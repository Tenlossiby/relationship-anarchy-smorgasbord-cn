/**
 * 关系安那其自助拼盘 (Relationship Anarchy Smörgåsbord)
 *
 * Copyright (c) 2025 Tenlossiby
 * Licensed under MIT License
 */

import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7A9B76',
};

export const metadata: Metadata = {
  title: {
    default: '关系安那其自助拼盘',
    template: '%s | RA Smörgåsbord',
  },
  description:
    '一个多元包容的关系探索工具，帮助你和伙伴发现和记录动态的关系模式。',
  keywords: [
    '关系安那其',
    'Relationship Anarchy',
    '多元关系',
    'Polyamory',
    '关系探索',
    '沟通工具',
  ],
  authors: [{ name: 'Tenlossiby' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`antialiased`}>
        <ThemeProvider>
          <AppProvider>
            {isDev && <Inspector />}
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
