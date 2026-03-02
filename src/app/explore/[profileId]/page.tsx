'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shuffle, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, getCategoryById } from '@/data/categories';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';

export default function ExploreCategorySelectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { profiles } = useApp();

  const profileId = params.profileId as string;
  const preSelectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const profile = profiles.find(p => p.id === profileId);

  const getCategoryProgress = (categoryId: string) => {
    const progress = profile?.progress.find(p => p.categoryId === categoryId);
    return progress?.answers.length || 0;
  };

  const handleRandomCategory = () => {
    const available = CATEGORIES.filter(c => getCategoryProgress(c.id) < c.cards.length);
    if (available.length === 0) {
      alert('所有类别都已完成！');
      return;
    }
    const random = available[Math.floor(Math.random() * available.length)];
    router.push(`/explore/${profileId}/${random.id}`);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">档案不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/profiles/${profileId}`} className="p-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">选择类别</h1>
              <p className="text-xs text-muted-foreground">{profile.fromName} ➔ {profile.toName}</p>
            </div>
          </div>
          <button
            onClick={handleRandomCategory}
            className="flex items-center gap-1 px-3 py-1.5 bg-card rounded-full text-sm text-muted-foreground border border-border hover:border-primary transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            <span>随机</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Pre-selected Categories */}
        {preSelectedCategories.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">已选择的类别</p>
            <div className="space-y-2">
              {preSelectedCategories.map(catId => {
                const category = CATEGORIES.find(c => c.id === catId);
                if (!category) return null;

                const progress = getCategoryProgress(category.id);
                const isComplete = progress === category.cards.length;
                const hasProgress = progress > 0;

                const categoriesParam = preSelectedCategories.join(',');

                return (
                  <Link
                    key={category.id}
                    href={`/explore/${profileId}/${category.id}?categories=${categoriesParam}`}
                    className={cn(
                      'flex items-center justify-between p-4 bg-primary/10 rounded-xl transition-all border-2 border-primary/30',
                      isComplete ? 'opacity-60' : 'hover:shadow-md'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{category.zh}</span>
                          {isComplete && (
                            <span className="text-xs text-primary">✓ 已完成</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(progress / category.cards.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{progress}/{category.cards.length}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* All Categories */}
        <p className="text-sm text-muted-foreground mb-4">
          {preSelectedCategories.length > 0 ? '或选择其他类别' : '选择一个类别开始探索'}
        </p>

        <div className="space-y-2">
          {CATEGORIES.filter(c => !preSelectedCategories.includes(c.id)).map((category) => {
            const progress = getCategoryProgress(category.id);
            const isComplete = progress === category.cards.length;
            const hasProgress = progress > 0;

            const categoriesParam = preSelectedCategories.join(',');

            return (
              <Link
                key={category.id}
                href={categoriesParam
                  ? `/explore/${profileId}/${category.id}?categories=${categoriesParam}`
                  : `/explore/${profileId}/${category.id}`
                }
                className={cn(
                  'flex items-center justify-between p-4 bg-card rounded-xl transition-all',
                  isComplete ? 'opacity-60' : 'hover:shadow-md'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{category.zh}</span>
                      {isComplete && (
                        <span className="text-xs text-primary">✓ 已完成</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(progress / category.cards.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress}/{category.cards.length}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
