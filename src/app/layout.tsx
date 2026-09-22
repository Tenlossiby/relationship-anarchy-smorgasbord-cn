/**
 * 关系安那其主义自助拼盘 (Relationship Anarchy Smörgåsbord)
 *
 * Copyright (c) 2025 Tenlossiby
 * Licensed under MIT License
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7A9B76',
};

export const metadata: Metadata = {
  title: {
    default: '关系安那其主义自助拼盘',
    template: '%s | 关系安那其主义自助拼盘',
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
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="192x192" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="关系安那其" />
      </head>
      <body className={`antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
