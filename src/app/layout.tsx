import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HIV/TB Monitor — Dream Medical Center',
  description: 'Clinical web dashboard for HIV & TB patient monitoring',
  // TODO(logo): replace /dmc-logo.png below with the actual DMC heart-and-cross asset
  // once supplied. Place the PNG/SVG in public/ and update the href.
  icons: { icon: '/dmc-logo.png', shortcut: '/dmc-logo.png', apple: '/dmc-logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
