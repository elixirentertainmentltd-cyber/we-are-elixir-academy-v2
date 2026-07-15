import type { Metadata } from 'next';
import './globals.css';
import './part5.css';

export const metadata: Metadata = {
  title: 'We Are Elixir Academy',
  description: 'Learning and development for the We Are Elixir community',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
