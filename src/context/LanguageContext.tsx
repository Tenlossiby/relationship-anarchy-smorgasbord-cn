'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Category } from '@/types';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, describePerspectiveForLocale, localizeCategory, localizeRelationLabel, localizeText, parseLocale, type AppLocale } from '@/lib/i18n';

interface LanguageContextValue {
  locale: AppLocale;
  isTraditional: boolean;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
  t: (text: string) => string;
  tc: (category: Category) => Category;
  perspective: (authorName: string, subjectName: string) => string;
  relation: (label: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(parseLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY)));
  }, []);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'zh-CN' ? 'zh-TW' : 'zh-CN');
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    const title = localizeText('关系安那其拼盘', locale);
    document.title = title;
    const observer = new MutationObserver(() => {
      if (document.title !== title) document.title = title;
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  const t = useCallback((text: string) => localizeText(text, locale), [locale]);
  const tc = useCallback((category: Category) => localizeCategory(category, locale), [locale]);
  const perspective = useCallback((authorName: string, subjectName: string) => describePerspectiveForLocale(authorName, subjectName, locale), [locale]);
  const relation = useCallback((label: string) => localizeRelationLabel(label, locale), [locale]);
  const value = useMemo(() => ({ locale, isTraditional: locale === 'zh-TW', setLocale, toggleLocale, t, tc, perspective, relation }), [locale, setLocale, toggleLocale, t, tc, perspective, relation]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
