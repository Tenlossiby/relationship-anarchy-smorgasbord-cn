/**
 * 关系安那其自助拼盘 (Relationship Anarchy Smörgåsbord)
 *
 * Copyright (c) 2025 Tenlossiby
 * Licensed under MIT License
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shuffle, Sparkles, ArrowRight } from 'lucide-react';
import { CATEGORIES, getTotalCards } from '@/data/categories';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { profiles } = useApp();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const randomSelect = () => {
    const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
    setSelectedCategories(shuffled.slice(0, 3).map(c => c.id));
  };

  const startExploration = () => {
    if (selectedCategories.length === 0) {
      alert('请至少选择一个类别');
      return;
    }
    // 如果没有档案，先创建
    if (profiles.length === 0) {
      router.push('/profiles/new?categories=' + selectedCategories.join(','));
    } else {
      // 选择档案进行探索
      router.push('/profiles/select?categories=' + selectedCategories.join(','));
    }
  };

  const totalCards = getTotalCards();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground text-center">
            关系安那其自助拼盘
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            选择你感兴趣的类别，开始探索
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="flex items-center justify-center gap-4 mb-6 text-sm text-muted-foreground">
          <span>{CATEGORIES.length} 个类别</span>
          <span>·</span>
          <span>{totalCards} 张卡牌</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={randomSelect}
            className="flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-sm text-foreground hover:shadow-md transition-all"
          >
            <Shuffle className="w-4 h-4" />
            <span className="text-sm">随机抽取</span>
          </button>
          <span className="text-muted-foreground">
            已选 {selectedCategories.length} 项
          </span>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-32">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);

            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 card-hover',
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-card border-border hover:border-border/60 hover:shadow-sm'
                )}
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <span className="text-sm font-medium text-foreground text-center">
                  {category.zh}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {category.cards.length} 张
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Fixed Start Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={startExploration}
            disabled={selectedCategories.length === 0}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-primary-foreground transition-all duration-200 shadow-lg',
              selectedCategories.length > 0
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-muted cursor-not-allowed'
            )}
          >
            <Sparkles className="w-5 h-5" />
            <span>开始探索</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
