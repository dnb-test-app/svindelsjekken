import '@dnb/eufemia/style/core';
import '@dnb/eufemia/style/themes/ui';
import './globals.css';
import { Theme } from '@dnb/eufemia/shared';
import { cookies } from 'next/headers';
import { isValidLocale, Locale, loadMessages } from '@/lib/i18n';
import { isValidTheme, THEME_COOKIE_NAME } from '@/lib/theme';
import Header from '@/components/Header';
import GlobalStatusWrapper from '@/components/GlobalStatusWrapper';

export const metadata = {
  title: 'DNB Svindelsjekk',
  description: 'Sjekk om noe kan være svindel - få en veiledende vurdering',
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const cookieStore = cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value || 'system';
  const theme = isValidTheme(themeCookie) ? themeCookie : 'system';
  
  const locale = isValidLocale(params.locale) ? params.locale : 'nb';
  const messages = loadMessages(locale as Locale);
  
  // Set data-theme attribute for CSS
  const dataTheme = theme === 'system' ? undefined : theme;
  
  // Determine direction based on locale (for future RTL support)
  const dir = 'ltr';

  return (
    <html lang={locale} dir={dir} data-theme={dataTheme}>
      <body>
        <Theme>
          <GlobalStatusWrapper />
          <div className="app-wrapper">
            <Header locale={locale} messages={messages} currentTheme={theme} />
            <main className="main-container">
              {children}
            </main>
          </div>
        </Theme>
      </body>
    </html>
  );
}