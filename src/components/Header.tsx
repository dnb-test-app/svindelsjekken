'use client';

import { Drawer, Icon, Flex, Space, P, Button } from '@dnb/eufemia';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Messages } from '@/lib/i18n';
import CompactLanguageSwitcher from './CompactLanguageSwitcher';
import CompactThemeToggle from './CompactThemeToggle';

interface HeaderProps {
  locale: string;
  messages: Messages;
  currentTheme: string;
}

export default function Header({ locale, messages, currentTheme }: HeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Handle T click for configuration
  const handleTClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/${locale}/config`);
  };
  
  return (
    <header className="header">
      <div className="header-container">
        <Flex.Container>
          <Flex.Item>
            <Link href={`/${locale}`} className="logo-link">
              <Flex.Container gap="small" align="center">
                <Icon icon="dnb" size="medium" />
                <span className="logo-text">
                  DNB Svindelsjekk
                </span>
              </Flex.Container>
            </Link>
          </Flex.Item>
          
          <Flex.Item>
            <Flex.Container gap="small" align="center">
              {/* T for Trygghet - Klikkbar for konfigurasjon */}
              <button
                onClick={handleTClick}
                className="t-button"
                title={messages.config || 'Konfigurasjon'}
                aria-label={messages.config || 'Konfigurasjon'}
              >
                <span className="t-letter">T</span>
                <span className="t-text">for trygghet</span>
              </button>
              
              <CompactLanguageSwitcher currentLocale={locale} />
              <CompactThemeToggle initialTheme={currentTheme} />
              
              {/* Mobile menu button */}
              <Button
                variant="tertiary"
                icon="menu"
                icon_position="left"
                on_click={() => setDrawerOpen(true)}
                className="mobile-menu-button"
                aria-label="Meny"
              />
            </Flex.Container>
          </Flex.Item>
        </Flex.Container>
      </div>
      
      {/* Mobile drawer menu */}
      <Drawer
        title="Meny"
        openState={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        spacing
      >
        <Space top="medium">
          <nav className="mobile-nav">
            <Link
              href={`/${locale}`}
              className="mobile-nav-link"
              onClick={() => setDrawerOpen(false)}
            >
              <Icon icon="home" size="small" />
              <span>Hjem</span>
            </Link>
            
            <Link
              href={`/${locale}/config`}
              className="mobile-nav-link"
              onClick={() => setDrawerOpen(false)}
            >
              <Icon icon="settings" size="small" />
              <span>{messages.config || 'Konfigurasjon'}</span>
            </Link>
            
            <Link
              href={`/${locale}/om`}
              className="mobile-nav-link"
              onClick={() => setDrawerOpen(false)}
            >
              <Icon icon="information" size="small" />
              <span>{messages.about || 'Om'}</span>
            </Link>
            
            <Link
              href={`/${locale}/personvern`}
              className="mobile-nav-link"
              onClick={() => setDrawerOpen(false)}
            >
              <Icon icon="locker" size="small" />
              <span>{messages.privacy || 'Personvern'}</span>
            </Link>
          </nav>
        </Space>
      </Drawer>
      
      <style jsx>{`
        .header {
          background-color: var(--color-white);
          border-bottom: 1px solid var(--color-black-8);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        [data-theme="dark"] .header {
          background-color: var(--color-black-background);
          border-bottom-color: var(--color-black-border);
        }
        
        .header-container {
          max-width: var(--layout-large);
          margin: 0 auto;
          padding: var(--spacing-small) var(--spacing-medium);
        }
        
        .logo-link {
          text-decoration: none;
          color: inherit;
        }
        
        .logo-text {
          font-weight: var(--font-weight-medium);
          font-size: var(--font-size-medium);
        }
        
        .t-button {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: var(--spacing-x-small) var(--spacing-small);
          background: transparent;
          border: 1px solid var(--color-sea-green);
          border-radius: var(--button-border-radius);
          cursor: pointer;
          color: var(--color-sea-green);
          font-size: var(--font-size-small);
          transition: all 0.2s ease;
        }
        
        .t-button:hover {
          background-color: var(--color-sea-green);
          color: var(--color-white);
        }
        
        .t-letter {
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-basis);
        }
        
        .t-text {
          font-size: var(--font-size-x-small);
        }
        
        .mobile-menu-button {
          display: none;
        }
        
        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-small);
        }
        
        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-small);
          padding: var(--spacing-small);
          text-decoration: none;
          color: inherit;
          border-radius: var(--button-border-radius);
          transition: background-color 0.2s ease;
        }
        
        .mobile-nav-link:hover {
          background-color: var(--color-mint-green-12);
        }
        
        @media screen and (max-width: 40em) {
          .mobile-menu-button {
            display: flex;
          }
          
          .t-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}