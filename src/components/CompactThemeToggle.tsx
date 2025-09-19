'use client';

import { Button } from '@dnb/eufemia/components';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { THEME_COOKIE_NAME } from '@/lib/theme';

interface CompactThemeToggleProps {
  initialTheme?: string;
}

export default function CompactThemeToggle({ initialTheme = 'system' }: CompactThemeToggleProps) {
  const [theme, setTheme] = useState(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = Cookies.get(THEME_COOKIE_NAME) || 'system';
    setTheme(savedTheme);
  }, []);

  const handleThemeToggle = () => {
    let newTheme: string;
    
    // Cycle through: system -> light -> dark -> system
    if (theme === 'system') {
      newTheme = 'light';
    } else if (theme === 'light') {
      newTheme = 'dark';
    } else {
      newTheme = 'system';
    }
    
    setTheme(newTheme);
    
    // Save to cookie
    Cookies.set(THEME_COOKIE_NAME, newTheme, { 
      expires: 365,
      sameSite: 'lax',
      path: '/'
    });
    
    // Update HTML data-theme attribute
    if (newTheme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      // Check system preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const getIcon = () => {
    if (theme === 'light') return '☀️';
    if (theme === 'dark') return '🌙';
    return '🔄'; // System/auto
  };

  const getLabel = () => {
    if (theme === 'light') return 'Lyst tema';
    if (theme === 'dark') return 'Mørkt tema';
    return 'Automatisk';
  };

  if (!mounted) {
    return (
      <Button
        variant="tertiary"
        icon={false}
        size="medium"
        disabled
        className="compact-theme-toggle"
      >
        <span className="theme-icon">🔄</span>
      </Button>
    );
  }

  return (
    <Button
      variant="tertiary"
      icon={false}
      size="medium"
      on_click={handleThemeToggle}
      title={getLabel()}
      aria-label={getLabel()}
      className="compact-theme-toggle"
    >
      <span className="theme-icon">
        {getIcon()}
      </span>
    </Button>
  );
}