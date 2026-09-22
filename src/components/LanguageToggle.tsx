'use client';

import { Languages } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { isTraditional, toggleLocale, t } = useLanguage();
  const pathname = usePathname();
  const target = isTraditional ? '简体中文' : '繁體中文（台灣）';
  const isCardPage = /^\/explore\/[^/]+\/[^/]+/.test(pathname);

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t(`切换到${target}`)}
      title={t(`切换到${target}`)}
      className={cn(
        'fixed top-3 z-[70] flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-md backdrop-blur hover:border-primary hover:text-primary',
        isCardPage ? 'left-14' : 'right-4'
      )}
    >
      <Languages className="h-4 w-4" />
      <span>{isTraditional ? '简体' : '繁體'}</span>
    </button>
  );
}
