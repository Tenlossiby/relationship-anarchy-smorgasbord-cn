'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';

export default function ProfileSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profiles } = useApp();

  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const handleSelectProfile = (profileId: string) => {
    if (categories.length > 0) {
      router.push(`/explore/${profileId}?categories=${categories.join(',')}`);
    } else {
      router.push(`/explore/${profileId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-[#4A4A4A]">选择档案</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-[#6B6B6B] mb-4">
          选择一个档案开始探索，或创建新档案
        </p>

        {/* Create New */}
        <Link
          href={`/profiles/new${categories.length > 0 ? `?categories=${categories.join(',')}` : ''}`}
          className="flex items-center justify-center gap-2 p-4 mb-4 bg-white rounded-xl border-2 border-dashed border-[#D9D4CC] text-[#6B6B6B] hover:border-[#7A9B76] hover:text-[#7A9B76] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">创建新档案</span>
        </Link>

        {/* Existing Profiles */}
        {profiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-[#6B6B6B]">或选择已有档案</p>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                className="w-full p-4 bg-white rounded-xl text-left hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-[#4A4A4A]">{profile.name}</h3>
                    <p className="text-sm text-[#6B6B6B]">
                      {profile.fromName} ➔ {profile.toName} · {profile.relationLabel}
                    </p>
                  </div>
                  <span className="text-xs text-[#C5BEB3]">
                    {profile.progress.reduce((sum, p) => sum + p.answers.length, 0)} 张
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
