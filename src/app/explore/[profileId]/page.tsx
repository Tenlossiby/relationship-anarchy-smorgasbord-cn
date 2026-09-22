'use client';

import { Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/data/categories';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { LocalizedLoading } from '@/components/LocalizedLoading';

function ExploreCategorySelectContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { profiles } = useApp();
  const { t, tc } = useLanguage();

  const profileId = params.profileId as string;
  const preSelectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const profile = profiles.find(p => p.id === profileId);

  const getCategoryProgress = (categoryId: string) => {
    return Object.keys(profile?.answers[categoryId]?.answers || {}).length;
  };

  const handleRandomCategory = () => {
    const available = CATEGORIES.filter(c => getCategoryProgress(c.id) < c.cards.length);
    if (available.length === 0) {
      alert(t('所有类别都已填写完成！'));
      return;
    }

    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    const ids = selected.map(c => c.id).join(',');

    router.push(`/explore/${profileId}/${selected[0].id}?categories=${ids}`);
  };

  const handleStartExplore = () => {
    const selected = preSelectedCategories.length ? preSelectedCategories : [CATEGORIES.find(category => getCategoryProgress(category.id) < category.cards.length)?.id || CATEGORIES[0].id];
    const selectedIds = selected.join(',');
    router.push(`/explore/${profileId}/${selected[0]}?categories=${selectedIds}`);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
        <p className="text-[#6B6B6B]">{t('档案不存在')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/profiles/${profileId}`}
            className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#4A4A4A]">{t('选择类别')}</span>
          </div>
          <div className="w-6" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Random Button */}
        <button
          onClick={handleRandomCategory}
          className="w-full mb-6 flex items-center justify-center gap-2 p-4 bg-[#7A9B76] text-white rounded-2xl font-medium hover:bg-[#5A7B56] transition-colors"
        >
          <Shuffle className="w-5 h-5" />
          <span>{t('随机抽取 3 个类别')}</span>
        </button>

        {/* Selected Categories Hint */}
        {preSelectedCategories.length > 0 && (
          <div className="mb-6 p-4 bg-[#E8F2E6] rounded-xl border border-[#7A9B76]/20">
            <p className="text-sm text-[#4A5D4B] mb-2">
              {t('已选择')} {preSelectedCategories.length} {t('个类别')}
            </p>
            <button
              onClick={handleStartExplore}
              className="w-full py-3 bg-[#7A9B76] text-white rounded-xl font-medium hover:bg-[#5A7B56] transition-colors"
            >
              {t('开始探索')}
            </button>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(tc).map((category) => {
            const progress = getCategoryProgress(category.id);
            const isCompleted = progress >= category.cards.length;

            return (
              <Link
                key={category.id}
                href={`/explore/${profileId}/${category.id}`}
                className={cn(
                  'bg-white rounded-2xl p-4 border-2 transition-all hover:shadow-md',
                  isCompleted
                    ? 'border-[#7A9B76] bg-[#7A9B76]/5'
                    : 'border-[#D9D4CC]'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  {isCompleted && (
                    <span className="text-xs px-2 py-0.5 bg-[#7A9B76] text-white rounded-full">
                      ✓
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-[#4A4A4A] text-sm mb-1">{category.zh}</h3>
                <p className="text-xs text-[#6B6B6B]">{progress}/{category.cards.length}</p>
              </Link>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function ExploreCategorySelectPage() {
  return (
    <Suspense fallback={<LocalizedLoading />}>
      <ExploreCategorySelectContent />
    </Suspense>
  );
}
