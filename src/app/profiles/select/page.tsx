'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { useLanguage } from '@/context/LanguageContext';
import { LocalizedLoading } from '@/components/LocalizedLoading';

function ProfileSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profiles } = useApp();
  const { t, perspective, relation } = useLanguage();

  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const newProfileHref = categories.length > 0
    ? `/profiles/new?categories=${categories.join(',')}`
    : '/profiles/new';

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
          <Link href="/profiles" className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-[#4A4A4A]">{t('选择档案')}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-[#E8E2DA] rounded-full flex items-center justify-center mb-4">
              <Plus className="w-10 h-10 text-[#6B6B6B]" />
            </div>
            <h2 className="text-lg font-medium text-[#4A4A4A] mb-2">{t('还没有档案')}</h2>
            <p className="text-sm text-[#6B6B6B] mb-6">{t('创建你的第一个关系档案')}</p>
            <Link
              href={newProfileHref}
              className="flex items-center gap-2 px-6 py-3 bg-[#7A9B76] text-white rounded-2xl font-medium hover:bg-[#5A7B56] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>{t('创建档案')}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <Link
              href={newProfileHref}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7A9B76] px-5 py-4 font-medium text-white transition-colors hover:bg-[#5A7B56]"
            >
              <Plus className="h-5 w-5" />
              <span>{t('新建档案并开始探索')}</span>
            </Link>

            <div>
              <p className="mb-3 text-sm font-medium text-[#6B6B6B]">{t('或选择已有档案')}</p>
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile.id)}
                    className="w-full bg-white rounded-2xl p-4 text-left border border-[#D9D4CC] hover:border-[#7A9B76] hover:shadow-md transition-all"
                  >
                    <h3 className="font-medium text-[#4A4A4A]">{profile.name}</h3>
                    <p className="text-sm text-[#6B6B6B]">
                      {perspective(profile.fromName, profile.toName)} · {relation(profile.relationLabel)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function ProfileSelectPage() {
  return (
    <Suspense fallback={<LocalizedLoading />}>
      <ProfileSelectContent />
    </Suspense>
  );
}
