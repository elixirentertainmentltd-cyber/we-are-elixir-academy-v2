import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'We Are Elixir Academy',
    short_name: 'Elixir Academy',
    description: 'Learning, certificates and creator development from We Are Elixir.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f7faff',
    theme_color: '#246bfd',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
