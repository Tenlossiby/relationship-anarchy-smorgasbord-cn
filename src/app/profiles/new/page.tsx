'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RELATION_LABELS } from '@/types';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';

export default function NewProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createNewProfile } = useApp();
  
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [relationLabel, setRelationLabel] = useState('伴侣');
  const [customLabel, setCustomLabel] = useState('');
  const [isCustomLabel, setIsCustomLabel] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileName = name || `${fromName} & ${toName}`;
    const label = isCustomLabel ? customLabel : relationLabel;
    
    const profile = createNewProfile(profileName, fromName, toName, label);
    
    // 跳转到卡牌讨论页面
    if (categories.length > 0) {
      router.push(`/explore/${profile.id}?categories=${categories.join(',')}`);
    } else {
      router.push(`/profiles/${profile.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/profiles" className="p-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">创建档案</h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              档案名称（可选）
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：小明 & 小红"
              className="w-full px-4 py-3 bg-card rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">
              不填写则自动生成
            </p>
          </div>

          {/* Your Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              你的名字 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="填表人"
              required
              className="w-full px-4 py-3 bg-card rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Partner's Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              对方名字 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder="这段关系指向谁？"
              required
              className="w-full px-4 py-3 bg-card rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Relationship Label */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              关系标签
            </label>
            <div className="flex flex-wrap gap-2">
              {RELATION_LABELS.map((label) => (
                <button
                  key={label.value}
                  type="button"
                  onClick={() => {
                    if (label.value === '其他') {
                      setIsCustomLabel(true);
                    } else {
                      setIsCustomLabel(false);
                      setRelationLabel(label.value);
                    }
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm transition-colors',
                    !isCustomLabel && relationLabel === label.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground border border-border hover:border-primary'
                  )}
                >
                  {label.label}
                </button>
              ))}
            </div>
            {isCustomLabel && (
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="输入自定义标签"
                className="w-full mt-2 px-4 py-3 bg-card rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
              />
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!fromName || !toName}
            className={cn(
              'w-full py-4 rounded-2xl font-medium text-primary-foreground transition-all',
              fromName && toName
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-muted cursor-not-allowed'
            )}
          >
            创建
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
