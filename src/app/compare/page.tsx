'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, getCategoryById } from '@/data/categories';
import { STATUS_LABELS, CardAnswerV2 } from '@/types';
import { classifyComparison, getAnswerStatuses, isAnswerEffective } from '@/lib/domain';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { LocalizedLoading } from '@/components/LocalizedLoading';

interface CompareItem {
  cardId: string;
  cardZh: string;
  cardEn: string;
  prompt?: string;
  answers: {
    profileId: string;
    profileName: string;
    answer?: CardAnswerV2;
  }[];
}

function CompareContent() {
  const searchParams = useSearchParams();
  const { profiles } = useApp();
  const { t, tc, perspective } = useLanguage();

  const profileIds = searchParams.get('profiles')?.split(',').filter(Boolean) || [];
  const selectedProfiles = profileIds.map(id => profiles.find(profile => profile.id === id)).filter((profile): profile is typeof profiles[number] => Boolean(profile));

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]?.id || '');

  // 计算对比数据
  const compareData = useMemo(() => {
    if (selectedProfiles.length < 2) return [];

    const category = getCategoryById(activeCategory);
    if (!category) return [];

    const items: CompareItem[] = [];

    for (const card of category.cards) {
      const answers: CompareItem['answers'] = [];

      for (const profile of selectedProfiles) {
        const answer = profile.answers[activeCategory]?.answers[card.id];

        answers.push({
          profileId: profile.id,
          profileName: perspective(profile.direction.author.displayName, profile.direction.subject.displayName),
          answer,
        });
      }

      // 只显示有至少一个回答的卡牌
      if (answers.some(a => isAnswerEffective(a.answer))) {
        items.push({
          cardId: card.id,
          cardZh: card.zh,
          cardEn: card.en,
          prompt: card.prompt,
          answers,
        });
      }
    }

    return items;
  }, [selectedProfiles, activeCategory, perspective]);

  // 计算每个类别的对比项数量
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const category of CATEGORIES) {
      let count = 0;
      for (const card of category.cards) {
        const hasAnswer = selectedProfiles.some(profile => {
          return isAnswerEffective(profile.answers[category.id]?.answers[card.id]);
        });
        if (hasAnswer) count++;
      }
      counts[category.id] = count;
    }

    return counts;
  }, [selectedProfiles]);

  useEffect(() => {
    if (!categoryCounts[activeCategory]) {
      const firstWithData = CATEGORIES.find(category => categoryCounts[category.id] > 0);
      if (firstWithData) setActiveCategory(firstWithData.id);
    }
  }, [activeCategory, categoryCounts]);

  if (selectedProfiles.length < 2) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center justify-center p-4">
        <p className="text-[#6B6B6B] mb-4">{t('请选择至少两个档案进行对比')}</p>
        <Link
          href="/profiles"
          className="px-6 py-3 bg-[#7A9B76] text-white rounded-2xl font-medium"
        >
          {t('返回档案列表')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <Link href="/profiles" className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-bold text-[#4A4A4A]">{t('档案对比')}</h1>
          </div>

          {/* Selected Profiles */}
          <div className="flex flex-wrap gap-2">
            {selectedProfiles.map((profile) => (
              <span
                key={profile.id}
                className="px-3 py-1 bg-white rounded-full text-sm text-[#4A4A4A] border border-[#D9D4CC]"
              >
                {profile.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[88px] z-30 bg-[#F5F1EB]/95 backdrop-blur-sm border-b border-[#D9D4CC] overflow-x-auto">
        <div className="max-w-2xl mx-auto px-4 py-2 flex gap-2">
          {CATEGORIES.map((category) => {
            const count = categoryCounts[category.id] || 0;
            if (count === 0) return null;

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                  activeCategory === category.id
                    ? 'bg-[#7A9B76] text-white'
                    : 'bg-white text-[#4A4A4A] border border-[#D9D4CC]'
                )}
              >
                <span>{category.icon}</span>
                <span>{tc(category).zh}</span>
                <span className="text-xs opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {compareData.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#6B6B6B]">{t('暂无对比数据')}</p>
            <p className="text-sm text-[#C5BEB3] mt-2">{t('请先在档案中填写该类别的内容')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {compareData.map((item) => (
              <div key={item.cardId} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Card Header */}
                <div className="p-4 bg-[#E8E2DA]/50 border-b border-[#E8E2DA]">
                  <h3 className="font-medium text-[#4A4A4A]">{t(item.cardZh)}</h3>
                  <p className="text-xs text-[#6B6B6B]">{item.cardEn}</p>
                  {item.prompt && (
                    <p className="text-sm text-[#6B6B6B] mt-1 italic">
                      &quot;{t(item.prompt)}&quot;
                    </p>
                  )}
                  <p className="text-xs text-[#6B6B6B] mt-2">{t(classifyComparison(item.answers.map(answer => answer.answer)))}</p>
                </div>

                {/* Profile Answers */}
                <div className="divide-y divide-[#E8E2DA]">
                  {item.answers.map((answer, idx) => {
                    const profileColors = ['#E8F5E8', '#E8F0F8', '#F3E8F5', '#F5F0E8', '#E8F5F3'];
                    const bgColor = profileColors[idx % profileColors.length];
                    const statuses = getAnswerStatuses(answer.answer);

                    return (
                      <div key={answer.profileId} className="p-4" style={{ backgroundColor: bgColor }}>
                        <p className="text-sm font-medium text-[#4A4A4A] mb-2">
                          {answer.profileName}
                        </p>

                        {answer.answer && isAnswerEffective(answer.answer) ? (
                          <>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {statuses.map(status => { const config = STATUS_LABELS[status]; return (
                                  <span
                                    key={status}
                                    className="px-2 py-1 rounded-lg text-xs font-medium text-white"
                                    style={{ backgroundColor: config.color }}
                                  >
                                    {t(config.zh)}
                                  </span>
                                ); })}
                              {answer.answer.participation && <span className="px-2 py-1 rounded-lg text-xs font-medium bg-[#E8F0F8] text-[#4A4A4A]">{t(({ self: '我会参与', other: '对方会参与', together: '共同参与', varies: '视情况而定' } as const)[answer.answer.participation])}</span>}
                            </div>
                            {answer.answer.note && (
                              <p className="text-sm text-[#6B6B6B] bg-white/50 rounded-lg p-2">
                                📝 {answer.answer.note}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-[#C5BEB3]">{t('未作答')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<LocalizedLoading />}>
      <CompareContent />
    </Suspense>
  );
}
