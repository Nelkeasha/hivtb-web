import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HIV/TB Monitor — Dream Medical Center',
  description: 'Clinical web dashboard for HIV & TB patient monitoring',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
