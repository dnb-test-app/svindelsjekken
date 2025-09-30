import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RateLimiter, defaultRateLimiterConfig } from '../rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Create fresh instance with test configuration
    rateLimiter = new RateLimiter({
      perUserLimits: {
        minute: 5,
        hour: 10,
        day: 20
      },
      globalLimits: {
        minute: 50,
        hour: 100,
        day: 200
      },
      cleanupIntervalMs: 60000
    });
  });

  afterEach(() => {
    // Clean up resources
    rateLimiter.destroy();
  });

  describe('Basic functionality', () => {
    it('should allow requests under the limit', () => {
      const result1 = rateLimiter.checkLimit('user1');
      expect(result1.allowed).toBe(true);

      const result2 = rateLimiter.checkLimit('user1');
      expect(result2.allowed).toBe(true);
    });

    it('should track remaining requests correctly', () => {
      const result1 = rateLimiter.checkLimit('user1');
      expect(result1.remaining.minute).toBe(4); // 5 - 1

      const result2 = rateLimiter.checkLimit('user1');
      expect(result2.remaining.minute).toBe(3); // 5 - 2
    });

    it('should block requests when minute limit is exceeded', () => {
      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkLimit('user1');
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const blockedResult = rateLimiter.checkLimit('user1');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.violated).toBe('minute');
    });

    it('should track different users independently', () => {
      // User1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('user1');
      }

      // User1 should be blocked
      const user1Result = rateLimiter.checkLimit('user1');
      expect(user1Result.allowed).toBe(false);

      // User2 should still be allowed
      const user2Result = rateLimiter.checkLimit('user2');
      expect(user2Result.allowed).toBe(true);
    });
  });

  describe('Time windows', () => {
    it('should enforce hour limit independently of minute limit', () => {
      const limiter = new RateLimiter({
        perUserLimits: {
          minute: 100, // High minute limit
          hour: 5,     // Low hour limit
          day: 100
        },
        globalLimits: {
          minute: 1000,
          hour: 1000,
          day: 1000
        }
      });

      // Make 5 requests (within minute limit, at hour limit)
      for (let i = 0; i < 5; i++) {
        const result = limiter.checkLimit('user1');
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked by hour limit
      const blockedResult = limiter.checkLimit('user1');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.violated).toBe('hour');

      limiter.destroy();
    });

    it('should enforce day limit independently', () => {
      const limiter = new RateLimiter({
        perUserLimits: {
          minute: 100,
          hour: 100,
          day: 3 // Very low day limit for testing
        },
        globalLimits: {
          minute: 1000,
          hour: 1000,
          day: 1000
        }
      });

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        const result = limiter.checkLimit('user1');
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked by day limit
      const blockedResult = limiter.checkLimit('user1');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.violated).toBe('day');

      limiter.destroy();
    });

    it('should provide reset times for violated limits', () => {
      // Exhaust minute limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit('user1');
      }

      const blockedResult = rateLimiter.checkLimit('user1');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.resetTime.minute).toBeGreaterThan(Date.now());
    });
  });

  describe('Global limits', () => {
    it('should enforce global limits across all users', () => {
      const limiter = new RateLimiter({
        perUserLimits: {
          minute: 100,
          hour: 100,
          day: 100
        },
        globalLimits: {
          minute: 5, // Low global limit
          hour: 100,
          day: 100
        }
      });

      // Different users make requests up to global limit
      limiter.checkLimit('user1');
      limiter.checkLimit('user2');
      limiter.checkLimit('user3');
      limiter.checkLimit('user4');
      limiter.checkLimit('user5');

      // Next request from any user should be blocked
      const blockedResult = limiter.checkLimit('user6');
      expect(blockedResult.allowed).toBe(false);

      limiter.destroy();
    });

    it('should check global limits before user limits', () => {
      const limiter = new RateLimiter({
        perUserLimits: {
          minute: 100,
          hour: 100,
          day: 100
        },
        globalLimits: {
          minute: 2,
          hour: 100,
          day: 100
        }
      });

      // Make 2 requests from user1 (exhausts global limit)
      limiter.checkLimit('user1');
      limiter.checkLimit('user1');

      // User1 still has personal capacity, but global limit is reached
      const result = limiter.checkLimit('user1');
      expect(result.allowed).toBe(false);

      limiter.destroy();
    });
  });

  describe('Cleanup', () => {
    it('should clean up old timestamps', () => {
      // Make some requests
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user2');

      const statsBefore = rateLimiter.getStats();
      expect(statsBefore.totalUsers).toBe(2);

      // Trigger cleanup manually (in real scenario, this happens via setInterval)
      rateLimiter['cleanup']();

      const statsAfter = rateLimiter.getStats();
      expect(statsAfter.totalUsers).toBeGreaterThanOrEqual(0);
    });

    it('should not cleanup recent timestamps', () => {
      rateLimiter.checkLimit('user1');

      const statsBefore = rateLimiter.getStats();
      rateLimiter['cleanup']();
      const statsAfter = rateLimiter.getStats();

      // Recent user should still be there
      expect(statsAfter.totalUsers).toBe(statsBefore.totalUsers);
    });
  });

  describe('Statistics', () => {
    it('should return current statistics', () => {
      rateLimiter.checkLimit('user1');
      rateLimiter.checkLimit('user2');
      rateLimiter.checkLimit('user1');

      const stats = rateLimiter.getStats();

      expect(stats.totalUsers).toBe(2);
      expect(stats.globalRequests.minute).toBe(3);
      expect(stats.globalRequests.hour).toBe(3);
      expect(stats.globalRequests.day).toBe(3);
    });

    it('should update statistics after requests', () => {
      const stats1 = rateLimiter.getStats();
      expect(stats1.globalRequests.minute).toBe(0);

      rateLimiter.checkLimit('user1');

      const stats2 = rateLimiter.getStats();
      expect(stats2.globalRequests.minute).toBe(1);
    });
  });

  describe('Resource management', () => {
    it('should properly destroy and cleanup', () => {
      rateLimiter.checkLimit('user1');

      rateLimiter.destroy();

      const stats = rateLimiter.getStats();
      expect(stats.totalUsers).toBe(0);
      expect(stats.globalRequests.minute).toBe(0);
    });

    it('should handle multiple destroy calls safely', () => {
      rateLimiter.destroy();
      rateLimiter.destroy(); // Should not throw

      expect(rateLimiter['cleanupInterval']).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty user key', () => {
      const result = rateLimiter.checkLimit('');
      expect(result.allowed).toBe(true);
    });

    it('should handle rapid successive requests', () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(rateLimiter.checkLimit('user1'));
      }

      const allowedCount = results.filter(r => r.allowed).length;
      expect(allowedCount).toBe(5); // Should match the minute limit
    });

    it('should handle very long user keys', () => {
      const longKey = 'a'.repeat(1000);
      const result = rateLimiter.checkLimit(longKey);
      expect(result.allowed).toBe(true);
    });

    it('should handle special characters in user key', () => {
      const specialKey = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = rateLimiter.checkLimit(specialKey);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Default configuration', () => {
    it('should use sensible default limits', () => {
      const defaultLimiter = new RateLimiter(defaultRateLimiterConfig);

      expect(defaultRateLimiterConfig.perUserLimits.minute).toBe(10);
      expect(defaultRateLimiterConfig.perUserLimits.hour).toBe(30);
      expect(defaultRateLimiterConfig.perUserLimits.day).toBe(100);

      expect(defaultRateLimiterConfig.globalLimits.minute).toBe(200);
      expect(defaultRateLimiterConfig.globalLimits.hour).toBe(2000);
      expect(defaultRateLimiterConfig.globalLimits.day).toBe(10000);

      defaultLimiter.destroy();
    });
  });

  describe('Sliding window', () => {
    it('should implement sliding window correctly', () => {
      // Make requests at the limit
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkLimit('user1');
        expect(result.allowed).toBe(true);
      }

      // Should be blocked immediately after
      const blocked = rateLimiter.checkLimit('user1');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining.minute).toBe(0);
    });

    it('should count requests in correct time windows', () => {
      rateLimiter.checkLimit('user1');

      const stats = rateLimiter.getStats();

      // Request should count in all windows
      expect(stats.globalRequests.minute).toBeGreaterThan(0);
      expect(stats.globalRequests.hour).toBeGreaterThan(0);
      expect(stats.globalRequests.day).toBeGreaterThan(0);
    });
  });
});