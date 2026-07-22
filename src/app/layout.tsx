import type { Metadata } from 'next';
import './globals.css';
import './part5.css';

export const metadata: Metadata = {
  title: 'We Are Elixir Academy',
  description: 'Learning and development for the We Are Elixir community',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
