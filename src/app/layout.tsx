import '@dnb/eufemia/style/core';
import '@dnb/eufemia/style/themes/ui';
import '@dnb/eufemia/components/logo/style';
import './globals.css';
import { Theme } from '@dnb/eufemia/shared';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata = {
  title: 'DNB Svindelsjekk',
  description: 'Vi stopper 9 av 10 svindelforsøk. Sammen kan vi stoppe resten.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Theme>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Theme>
      </body>
    </html>
  );
}