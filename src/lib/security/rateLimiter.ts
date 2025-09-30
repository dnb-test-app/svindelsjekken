/**
 * Rate Limiting Module
 * Implements sliding window rate limiting with multi-tier limits
 */

export interface RateLimitConfig {
  minute: number;
  hour: number;
  day: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: {
    minute: number;
    hour: number;
    day: number;
  };
  resetTime: {
    minute: number;
    hour: number;
    day: number;
  };
  violated?: 'minute' | 'hour' | 'day';
}

export interface RateLimiterOptions {
  perUserLimits: RateLimitConfig;
  globalLimits: RateLimitConfig;
  cleanupIntervalMs?: number;
}

// Time windows in milliseconds
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Request timestamp storage
interface RequestLog {
  timestamps: number[];
  lastCleanup: number;
}

export class RateLimiter {
  private userStore = new Map<string, RequestLog>();
  private globalLog: RequestLog = { timestamps: [], lastCleanup: Date.now() };
  private config: RateLimiterOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimiterOptions) {
    this.config = config;

    // Start periodic cleanup
    const cleanupMs = config.cleanupIntervalMs || 60000; // Default: 1 minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupMs);
  }

  /**
   * Check if a request is allowed for a given key
   */
  checkLimit(key: string): RateLimitResult {
    const now = Date.now();

    // Get or create user log
    let userLog = this.userStore.get(key);
    if (!userLog) {
      userLog = { timestamps: [], lastCleanup: now };
      this.userStore.set(key, userLog);
    }

    // Check global limits first
    const globalCheck = this.checkTimeWindows(
      this.globalLog.timestamps,
      this.config.globalLimits,
      now
    );

    if (!globalCheck.allowed) {
      return {
        allowed: false,
        remaining: globalCheck.remaining,
        resetTime: globalCheck.resetTime,
        violated: globalCheck.violated
      };
    }

    // Check per-user limits
    const userCheck = this.checkTimeWindows(
      userLog.timestamps,
      this.config.perUserLimits,
      now
    );

    if (!userCheck.allowed) {
      return {
        allowed: false,
        remaining: userCheck.remaining,
        resetTime: userCheck.resetTime,
        violated: userCheck.violated
      };
    }

    // Request allowed - record it
    userLog.timestamps.push(now);
    this.globalLog.timestamps.push(now);

    // Clean old timestamps if needed
    if (now - userLog.lastCleanup > MINUTE_MS) {
      this.cleanupLog(userLog, now);
    }
    if (now - this.globalLog.lastCleanup > MINUTE_MS) {
      this.cleanupLog(this.globalLog, now);
    }

    return {
      allowed: true,
      remaining: userCheck.remaining,
      resetTime: userCheck.resetTime
    };
  }

  /**
   * Check time windows using sliding window algorithm
   */
  private checkTimeWindows(
    timestamps: number[],
    limits: RateLimitConfig,
    now: number
  ): RateLimitResult {
    const minuteStart = now - MINUTE_MS;
    const hourStart = now - HOUR_MS;
    const dayStart = now - DAY_MS;

    // Count requests in each window
    let minuteCount = 0;
    let hourCount = 0;
    let dayCount = 0;

    // Find oldest timestamp in each window (for resetTime calculation)
    let oldestInMinute = now;
    let oldestInHour = now;
    let oldestInDay = now;

    for (const ts of timestamps) {
      if (ts > minuteStart) {
        minuteCount++;
        if (ts < oldestInMinute) oldestInMinute = ts;
      }
      if (ts > hourStart) {
        hourCount++;
        if (ts < oldestInHour) oldestInHour = ts;
      }
      if (ts > dayStart) {
        dayCount++;
        if (ts < oldestInDay) oldestInDay = ts;
      }
    }

    // Check each limit
    if (minuteCount >= limits.minute) {
      return {
        allowed: false,
        remaining: {
          minute: 0,
          hour: Math.max(0, limits.hour - hourCount),
          day: Math.max(0, limits.day - dayCount)
        },
        resetTime: {
          minute: oldestInMinute + MINUTE_MS,
          hour: oldestInHour + HOUR_MS,
          day: oldestInDay + DAY_MS
        },
        violated: 'minute'
      };
    }

    if (hourCount >= limits.hour) {
      return {
        allowed: false,
        remaining: {
          minute: Math.max(0, limits.minute - minuteCount),
          hour: 0,
          day: Math.max(0, limits.day - dayCount)
        },
        resetTime: {
          minute: oldestInMinute + MINUTE_MS,
          hour: oldestInHour + HOUR_MS,
          day: oldestInDay + DAY_MS
        },
        violated: 'hour'
      };
    }

    if (dayCount >= limits.day) {
      return {
        allowed: false,
        remaining: {
          minute: Math.max(0, limits.minute - minuteCount),
          hour: Math.max(0, limits.hour - hourCount),
          day: 0
        },
        resetTime: {
          minute: oldestInMinute + MINUTE_MS,
          hour: oldestInHour + HOUR_MS,
          day: oldestInDay + DAY_MS
        },
        violated: 'day'
      };
    }

    // All checks passed
    return {
      allowed: true,
      remaining: {
        minute: limits.minute - minuteCount - 1,
        hour: limits.hour - hourCount - 1,
        day: limits.day - dayCount - 1
      },
      resetTime: {
        minute: now + MINUTE_MS,
        hour: now + HOUR_MS,
        day: now + DAY_MS
      }
    };
  }

  /**
   * Clean old timestamps from a log
   */
  private cleanupLog(log: RequestLog, now: number): void {
    const dayStart = now - DAY_MS;
    log.timestamps = log.timestamps.filter(ts => ts > dayStart);
    log.lastCleanup = now;
  }

  /**
   * Periodic cleanup of all logs
   */
  private cleanup(): void {
    const now = Date.now();
    const dayStart = now - DAY_MS;

    // Clean global log
    this.cleanupLog(this.globalLog, now);

    // Clean user logs and remove empty ones
    for (const [key, log] of this.userStore.entries()) {
      this.cleanupLog(log, now);

      // Remove users with no recent requests
      if (log.timestamps.length === 0) {
        this.userStore.delete(key);
      }
    }
  }

  /**
   * Get current statistics (for monitoring)
   */
  getStats(): {
    totalUsers: number;
    globalRequests: {
      minute: number;
      hour: number;
      day: number;
    };
  } {
    const now = Date.now();
    const minuteStart = now - MINUTE_MS;
    const hourStart = now - HOUR_MS;
    const dayStart = now - DAY_MS;

    const globalRequests = {
      minute: this.globalLog.timestamps.filter(ts => ts > minuteStart).length,
      hour: this.globalLog.timestamps.filter(ts => ts > hourStart).length,
      day: this.globalLog.timestamps.filter(ts => ts > dayStart).length
    };

    return {
      totalUsers: this.userStore.size,
      globalRequests
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.userStore.clear();
    this.globalLog.timestamps = [];
  }
}

// Default configuration
export const defaultRateLimiterConfig: RateLimiterOptions = {
  perUserLimits: {
    minute: 10,
    hour: 30,
    day: 100
  },
  globalLimits: {
    minute: 200,
    hour: 2000,
    day: 10000
  },
  cleanupIntervalMs: 60000 // 1 minute
};

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(defaultRateLimiterConfig);
  }
  return rateLimiterInstance;
}