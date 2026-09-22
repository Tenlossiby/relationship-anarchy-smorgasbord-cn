'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RELATION_LABELS } from '@/types';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { LocalizedLoading } from '@/components/LocalizedLoading';

function NewProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createNewProfile } = useApp();
  const { t } = useLanguage();

  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [relationLabel, setRelationLabel] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  const handleCreate = () => {
    const finalLabel = relationLabel === '其他' ? customLabel || relationLabel : relationLabel;

    if (!fromName || !toName || !finalLabel) {
      alert(t('请填写所有必填字段'));
      return;
    }

    const profile = createNewProfile(
      name || `${fromName} & ${toName}`,
      fromName,
      toName,
      finalLabel
    );

    if (categories.length > 0) {
      router.push(`/explore/${profile.id}/${categories[0]}?categories=${categories.join(',')}`);
    } else {
      router.push(`/profiles/${profile.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/profiles" className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-[#4A4A4A]">{t('创建档案')}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          {/* 档案名称 */}
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
              {t('档案名称（可选）')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('例如：小明 & 小红')}
              className="w-full px-4 py-3 rounded-xl border border-[#D9D4CC] focus:border-[#7A9B76] focus:outline-none transition-colors"
            />
          </div>

          {/* 你的名字 */}
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
              {t('你的名字')} <span className="text-[#C75B5B]">*</span>
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder={t('例如：小明')}
              className="w-full px-4 py-3 rounded-xl border border-[#D9D4CC] focus:border-[#7A9B76] focus:outline-none transition-colors"
            />
          </div>

          {/* 对方名字 */}
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
              {t('对方名字')} <span className="text-[#C75B5B]">*</span>
            </label>
            <input
              type="text"
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder={t('例如：小红')}
              className="w-full px-4 py-3 rounded-xl border border-[#D9D4CC] focus:border-[#7A9B76] focus:outline-none transition-colors"
            />
          </div>

          {/* 关系标签 */}
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
              {t('关系标签')} <span className="text-[#C75B5B]">*</span>
            </label>
            <select
              value={relationLabel}
              onChange={(e) => setRelationLabel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#D9D4CC] focus:border-[#7A9B76] focus:outline-none transition-colors bg-white"
            >
              <option value="">{t('选择标签')}</option>
              {RELATION_LABELS.map((label) => (
                <option key={label.value} value={label.value}>
                  {t(label.label)}
                </option>
              ))}
            </select>

            {/* 自定义标签输入框 */}
            {relationLabel === '其他' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder={t('请输入自定义标签（可选）')}
                  className="w-full px-4 py-3 rounded-xl border border-[#D9D4CC] focus:border-[#7A9B76] focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!fromName || !toName || !relationLabel}
          className={cn(
            'w-full mt-6 py-4 rounded-2xl font-medium text-white transition-all',
            fromName && toName && relationLabel
              ? 'bg-[#7A9B76] hover:bg-[#5A7B56]'
              : 'bg-[#C5BEB3] cursor-not-allowed'
          )}
        >
          {t('创建档案')}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

export default function NewProfilePage() {
  return (
    <Suspense fallback={<LocalizedLoading />}>
      <NewProfileContent />
    </Suspense>
  );
}
