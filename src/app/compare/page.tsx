'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, getCategoryById } from '@/data/categories';
import { STATUS_LABELS, StatusLabel, Profile, CardAnswer } from '@/types';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';

interface CompareItem {
  cardId: string;
  cardZh: string;
  cardEn: string;
  contextQuestion?: string;
  answers: {
    profileId: string;
    profileName: string;
    statuses: StatusLabel[];
    note?: string;
  }[];
}

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profiles } = useApp();

  const profileIds = searchParams.get('profiles')?.split(',').filter(Boolean) || [];
  const selectedProfiles = profiles.filter(p => profileIds.includes(p.id));

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
        const progress = profile.progress.find(p => p.categoryId === activeCategory);
        const answer = progress?.answers.find(a => a.cardId === card.id);

        answers.push({
          profileId: profile.id,
          profileName: `${profile.fromName} ➔ ${profile.toName}`,
          statuses: answer?.statuses || [],
          note: answer?.note,
        });
      }

      // 只显示有至少一个回答的卡牌
      if (answers.some(a => a.statuses.length > 0)) {
        items.push({
          cardId: card.id,
          cardZh: card.zh,
          cardEn: card.en,
          contextQuestion: card.contextQuestion,
          answers,
        });
      }
    }

    return items;
  }, [selectedProfiles, activeCategory]);

  // 计算每个类别的对比项数量
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    for (const category of CATEGORIES) {
      let count = 0;
      for (const card of category.cards) {
        const hasAnswer = selectedProfiles.some(profile => {
          const progress = profile.progress.find(p => p.categoryId === category.id);
          return progress?.answers.some(a => a.cardId === card.id && a.statuses.length > 0);
        });
        if (hasAnswer) count++;
      }
      counts[category.id] = count;
    }
    
    return counts;
  }, [selectedProfiles]);

  if (selectedProfiles.length < 2) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center justify-center p-4">
        <p className="text-[#6B6B6B] mb-4">请选择至少两个档案进行对比</p>
        <Link
          href="/profiles"
          className="px-6 py-3 bg-[#7A9B76] text-white rounded-2xl font-medium"
        >
          返回档案列表
        </Link>
      </div>
    );
  }

  const currentCategory = getCategoryById(activeCategory);

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-3">
            <Link href="/profiles" className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-bold text-[#4A4A4A]">档案对比</h1>
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
                <span>{category.zh}</span>
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
            <p className="text-[#6B6B6B]">暂无对比数据</p>
            <p className="text-sm text-[#C5BEB3] mt-2">请先在档案中填写该类别的内容</p>
          </div>
        ) : (
          <div className="space-y-4">
            {compareData.map((item) => (
              <div key={item.cardId} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Card Header */}
                <div className="p-4 bg-[#E8E2DA]/50 border-b border-[#E8E2DA]">
                  <h3 className="font-medium text-[#4A4A4A]">{item.cardZh}</h3>
                  <p className="text-xs text-[#6B6B6B]">{item.cardEn}</p>
                  {item.contextQuestion && (
                    <p className="text-sm text-[#6B6B6B] mt-1 italic">
                      &quot;{item.contextQuestion}&quot;
                    </p>
                  )}
                </div>

                {/* Profile Answers */}
                <div className="divide-y divide-[#E8E2DA]">
                  {item.answers.map((answer, idx) => {
                    const profileColors = ['#E8F5E8', '#E8F0F8', '#F3E8F5', '#F5F0E8', '#E8F5F3'];
                    const bgColor = profileColors[idx % profileColors.length];

                    return (
                      <div key={answer.profileId} className="p-4" style={{ backgroundColor: bgColor }}>
                        <p className="text-sm font-medium text-[#4A4A4A] mb-2">
                          {answer.profileName}
                        </p>
                        
                        {answer.statuses.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {answer.statuses.map((status) => {
                                const config = STATUS_LABELS[status];
                                return (
                                  <span
                                    key={status}
                                    className="px-2 py-0.5 rounded-full text-xs text-white"
                                    style={{ backgroundColor: config.color }}
                                  >
                                    {config.zh}
                                  </span>
                                );
                              })}
                            </div>
                            {answer.note && (
                              <p className="text-sm text-[#6B6B6B] italic">
                                📝 {answer.note}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-[#C5BEB3]">未作答</p>
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
