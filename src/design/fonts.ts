import { Cormorant_Garamond, Inter, Newsreader } from 'next/font/google';

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
  fallback: ['Georgia', 'serif'],
});

export const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

export const newsreader = Newsreader({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-newsreader',
  fallback: ['Georgia', 'serif'],
});
