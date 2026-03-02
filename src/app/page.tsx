'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ArrowRight, Download, Trash2, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { getTotalCards } from '@/data/categories';

export default function ProfilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profiles, selectedProfiles, toggleProfileSelection, clearSelection, deleteProfile } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [highlightProfileId, setHighlightProfileId] = useState<string | null>(null);

  // 获取需要高亮的档案ID
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightProfileId(highlightId);

      // 3秒后移除高亮效果
      const timer = setTimeout(() => {
        setHighlightProfileId(null);
        // 清除URL参数（仅在客户端执行）
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/profiles');
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const totalCards = getTotalCards();

  const getCompletedCards = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return 0;
    return profile.progress.reduce((sum, p) => sum + p.answers.length, 0);
  };

  const canCompare = selectedProfiles.length >= 2;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">我的档案</h1>
          <Link
            href="/profiles/new"
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">还没有档案</h2>
            <p className="text-sm text-muted-foreground mb-6">
              创建你的第一个关系档案，开始探索之旅
            </p>
            <Link
              href="/profiles/new"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>创建档案</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Import Hint */}
            <Link
              href="/profiles/import"
              className="flex items-center justify-center gap-2 p-3 mb-4 bg-card rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">导入档案</span>
            </Link>

            {/* Profile List */}
            <div className="space-y-3">
              {profiles
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((profile) => {
                const isSelected = selectedProfiles.includes(profile.id);
                const completed = getCompletedCards(profile.id);
                const progress = Math.round((completed / totalCards) * 100);
                const isHighlighted = highlightProfileId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className={cn(
                      'relative bg-card rounded-2xl border-2 transition-all duration-200 overflow-hidden',
                      isSelected
                        ? 'border-primary shadow-sm'
                        : 'border-border shadow-sm hover:shadow-md',
                      isHighlighted && 'animate-pulse ring-4 ring-primary/50'
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleProfileSelection(profile.id)}
                      className="absolute top-4 left-4 z-10"
                    >
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'border-border'
                      )}>
                        {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    </button>

                    {/* Content */}
                    <Link
                      href={`/profiles/${profile.id}`}
                      className="block pl-12 pr-12 py-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground">{profile.name}</h3>
                            {profile.isImported && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-full">
                                📥 导入
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {profile.fromName} ➔ {profile.toName} · {profile.relationLabel}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {completed}/{totalCards}
                            </span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(profile.createdAt).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDeleteConfirm(profile.id);
                      }}
                      className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Delete Confirmation */}
                    {showDeleteConfirm === profile.id && (
                      <div className="absolute inset-0 bg-card/95 flex items-center justify-center gap-2 p-4">
                        <span className="text-sm text-muted-foreground">确定删除？</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            deleteProfile(profile.id);
                            setShowDeleteConfirm(null);
                          }}
                          className="px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded-lg"
                        >
                          删除
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1 bg-muted text-foreground text-sm rounded-lg"
                        >
                          取消
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Compare Button */}
      {profiles.length >= 2 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 pt-8">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={clearSelection}
              className={cn(
                'flex-1 py-3 rounded-2xl font-medium transition-all',
                selectedProfiles.length > 0
                  ? 'bg-muted text-foreground'
                  : 'bg-transparent'
              )}
            >
              {selectedProfiles.length > 0 ? '清除选择' : ''}
            </button>
            <button
              onClick={() => {
                if (canCompare) {
                  router.push(`/compare?profiles=${selectedProfiles.join(',')}`);
                }
              }}
              disabled={!canCompare}
              className={cn(
                'flex-1 py-3 rounded-2xl font-medium transition-all',
                canCompare
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {selectedProfiles.length > 0 
                ? `对比 (${selectedProfiles.length})`
                : '选择档案进行对比'
              }
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
