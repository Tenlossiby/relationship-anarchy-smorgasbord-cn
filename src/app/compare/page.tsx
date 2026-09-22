'use client';

import { useMemo, useEffect, useRef, Suspense } from 'react';
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
import { useSessionState } from '@/hooks/useSessionState';

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
  const contentStartRef = useRef<HTMLElement>(null);

  const profileIds = searchParams.get('profiles')?.split(',').filter(Boolean) || [];
  const selectedProfiles = profileIds.map(id => profiles.find(profile => profile.id === id)).filter((profile): profile is typeof profiles[number] => Boolean(profile));

  const [activeCategory, setActiveCategory] = useSessionState(
    `ra_compare_active_category_${profileIds.join('_')}`,
    CATEGORIES[0]?.id || ''
  );

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
  }, [activeCategory, categoryCounts, setActiveCategory]);

  const switchCategory = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    setActiveCategory(categoryId);
    window.requestAnimationFrame(() => {
      contentStartRef.current?.scrollIntoView({ block: 'start' });
    });
  };

  if (selectedProfiles.length < 2) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">{t('请选择至少两个档案进行对比')}</p>
        <Link
          href="/profiles"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-medium"
        >
          {t('返回档案列表')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <Link href="/profiles" className="p-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">{t('档案对比')}</h1>
          </div>

          {/* Selected Profiles */}
          <div className="flex flex-wrap gap-2">
            {selectedProfiles.map((profile) => (
              <span
                key={profile.id}
                className="px-3 py-1 bg-card rounded-full text-sm text-card-foreground border border-border"
              >
                {profile.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[88px] z-30 bg-background/95 backdrop-blur-sm border-b border-border overflow-x-auto">
        <div className="max-w-2xl mx-auto px-4 py-2 flex gap-2">
          {CATEGORIES.map((category) => {
            const count = categoryCounts[category.id] || 0;
            if (count === 0) return null;

            return (
              <button
                key={category.id}
                onClick={() => switchCategory(category.id)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                  activeCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground border border-border'
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
      <main ref={contentStartRef} className="max-w-2xl mx-auto scroll-mt-36 px-4 py-6">
        {compareData.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t('暂无对比数据')}</p>
            <p className="text-sm text-muted-foreground/70 mt-2">{t('请先在档案中填写该类别的内容')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {compareData.map((item) => (
              <div key={item.cardId} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                {/* Card Header */}
                <div className="p-4 bg-secondary/55 border-b border-border">
                  <h3 className="font-medium text-card-foreground">{t(item.cardZh)}</h3>
                  <p className="text-xs text-muted-foreground">{item.cardEn}</p>
                  {item.prompt && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      &quot;{t(item.prompt)}&quot;
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{t(classifyComparison(item.answers.map(answer => answer.answer)))}</p>
                </div>

                {/* Profile Answers */}
                <div className="divide-y divide-border">
                  {item.answers.map((answer, idx) => {
                    const profileColors = [
                      'bg-[#E8F5E8] dark:bg-[#293829]',
                      'bg-[#E8F0F8] dark:bg-[#273442]',
                      'bg-[#F3E8F5] dark:bg-[#392D3C]',
                      'bg-[#F5F0E8] dark:bg-[#3A342A]',
                      'bg-[#E8F5F3] dark:bg-[#273A37]',
                    ];
                    const bgColor = profileColors[idx % profileColors.length];
                    const statuses = getAnswerStatuses(answer.answer);

                    return (
                      <div key={answer.profileId} className={cn('p-4', bgColor)}>
                        <p className="text-sm font-medium text-card-foreground mb-2">
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
                              {answer.answer.participation && <span className="px-2 py-1 rounded-lg text-xs font-medium bg-card/70 text-card-foreground">{t(({ self: '我会参与', other: '对方会参与', together: '共同参与', varies: '视情况而定' } as const)[answer.answer.participation])}</span>}
                            </div>
                            {answer.answer.note && (
                              <p className="text-sm text-muted-foreground bg-card/55 rounded-lg p-2">
                                📝 {answer.answer.note}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground/70">{t('未作答')}</p>
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
