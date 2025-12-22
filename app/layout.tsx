import './globals.css';
import { ReactNode } from 'react';

/**
 * Root layout component.  Wraps the application with a basic HTML
 * structure and could host providers (e.g. React Query, theming) if
 * necessary.  At this stage it simply renders children.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <h1>AFCON 2025 Predictor</h1>
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
      </body>
    </html>
  );
}