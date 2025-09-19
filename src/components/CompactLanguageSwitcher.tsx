'use client';

import { Button } from '@dnb/eufemia/components';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

interface CompactLanguageSwitcherProps {
  currentLocale: string;
}

export default function CompactLanguageSwitcher({ currentLocale }: CompactLanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageToggle = () => {
    const newLocale = currentLocale === 'nb' ? 'en' : 'nb';
    
    // Set ONLY the locale cookie, don't touch theme
    Cookies.set('locale', newLocale, { 
      expires: 365,
      sameSite: 'lax',
      path: '/'
    });
    
    // Update the URL to new locale
    const segments = pathname.split('/').filter(s => s !== '');
    
    if (segments.length === 0) {
      // Reload to get fresh server-side props with new locale
      window.location.href = `/${newLocale}`;
      return;
    }
    
    // Replace the locale segment
    if (segments[0] === 'nb' || segments[0] === 'en') {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    
    const newPath = '/' + segments.join('/');
    // Use window.location to ensure fresh server render
    window.location.href = newPath;
  };

  return (
    <Button
      variant="tertiary"
      icon={false}
      size="medium"
      on_click={handleLanguageToggle}
      title={currentLocale === 'nb' ? 'Switch to English' : 'Bytt til norsk'}
      aria-label={currentLocale === 'nb' ? 'Switch to English' : 'Bytt til norsk'}
      className="compact-language-switcher"
    >
      <span className="flag-icon">
        {currentLocale === 'nb' ? '🇳🇴' : '🇬🇧'}
      </span>
    </Button>
  );
}