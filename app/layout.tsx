import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'POS App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div>{children}</div>
      </body>
    </html>
  );
}