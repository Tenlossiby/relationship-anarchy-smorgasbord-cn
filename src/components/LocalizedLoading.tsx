'use client';

import { useLanguage } from '@/context/LanguageContext';

export function LocalizedLoading({ themed = false }: { themed?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className={`min-h-screen flex items-center justify-center ${themed ? 'bg-background' : 'bg-[#F5F1EB]'}`}>
      {t('加载中...')}
    </div>
  );
}
