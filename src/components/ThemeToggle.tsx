'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

const themeOrder = ['light', 'dark', 'system'] as const;
const themeLabels = { light: '浅色', dark: '深色', system: '跟随系统' } as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor } as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const pathname = usePathname();
  const currentIndex = themeOrder.indexOf(theme);
  const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
  const Icon = themeIcons[theme];
  const isCardPage = /^\/explore\/[^/]+\/[^/]+/.test(pathname);

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`${t('当前主题')}：${t(themeLabels[theme])}；${t('点击切换到')} ${t(themeLabels[nextTheme])}`}
      title={`${t('当前主题')}：${t(themeLabels[theme])}；${t('点击切换到')} ${t(themeLabels[nextTheme])}`}
      className={cn(
        'fixed top-3 z-[70] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md backdrop-blur transition-colors hover:border-primary hover:text-primary',
        isCardPage ? 'right-14' : 'right-4'
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
