'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCategoryById } from '@/data/categories';
import { STATUS_LABELS, StatusLabel, Participation, Profile } from '@/types';
import { getAnswerStatuses, SUGGESTED_STATUS_VALUES } from '@/lib/domain';
import { updateCardAnswer, getAnswer, getProfile, markCardViewed } from '@/lib/storageV2';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { LocalizedLoading } from '@/components/LocalizedLoading';

function CardDiscussionContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { refreshProfiles } = useApp();
  const { t, tc } = useLanguage();

  const profileId = params.profileId as string;
  const categoryId = params.categoryId as string;
  const preSelectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const category = getCategoryById(categoryId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStatuses, setSelectedStatuses] = useState<StatusLabel[]>([]);
  const [participation, setParticipation] = useState<Participation | undefined>();
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProfile(getProfile(profileId));
  }, [profileId]);

  useEffect(() => {
    if (profile && category) {
      // 加载当前卡牌的已有回答
      const cardAnswer = getAnswer(profile, categoryId, category.cards[currentIndex]?.id);
      setSelectedStatuses(getAnswerStatuses(cardAnswer)); setParticipation(cardAnswer?.participation); setNote(cardAnswer?.note || '');
    }
  }, [profile, category, currentIndex, categoryId]);

  useEffect(() => {
    if (!profile?.permissions.editable || !category) return;
    const card = category.cards[currentIndex];
    if (!card) return;
    const persistOnLeave = () => updateCardAnswer(profileId, categoryId, { cardId: card.id, statuses: selectedStatuses, participation, note, updatedAt: new Date().toISOString() });
    window.addEventListener('pagehide', persistOnLeave);
    window.addEventListener('beforeunload', persistOnLeave);
    return () => { window.removeEventListener('pagehide', persistOnLeave); window.removeEventListener('beforeunload', persistOnLeave); };
  }, [profile, category, currentIndex, profileId, categoryId, selectedStatuses, participation, note]);

  if (!profile || !category) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
        <p className="text-[#6B6B6B]">{t('加载中...')}</p>
      </div>
    );
  }

  const currentCard = category.cards[currentIndex];
  const localizedCategory = tc(category);
  const localizedCurrentCard = localizedCategory.cards[currentIndex];
  const totalCards = category.cards.length;
  const isReadOnly = !profile.permissions.editable;
  const conversationPrompts = [localizedCurrentCard.prompt, ...(localizedCurrentCard.reflectionPrompts || [])].filter((prompt): prompt is string => Boolean(prompt));

  const persistCurrent = () => {
    if (isReadOnly) return;
    updateCardAnswer(profileId, categoryId, { cardId: currentCard.id, statuses: selectedStatuses, participation, note, updatedAt: new Date().toISOString() });
    const savedProfile = getProfile(profileId);
    if (savedProfile) setProfile(savedProfile);
    refreshProfiles();
  };

  const toggleStatus = (status: StatusLabel) => setSelectedStatuses(prev => prev.includes(status) ? prev.filter(item => item !== status) : [...prev, status]);

  const saveAndNext = async () => {
    if (isReadOnly) return;
    setIsSaving(true);

    persistCurrent();

    // 跳转到下一张
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 类别完成，检查是否还有预选类别
      if (preSelectedCategories.length > 0) {
        const currentIndexInPreSelected = preSelectedCategories.indexOf(categoryId);
        if (currentIndexInPreSelected !== -1 && currentIndexInPreSelected < preSelectedCategories.length - 1) {
          // 跳到下一个预选类别
          const nextCategoryId = preSelectedCategories[currentIndexInPreSelected + 1];
          router.push(`/explore/${profileId}/${nextCategoryId}?categories=${preSelectedCategories.join(',')}`);
        } else {
          // 预选类别都完成了，跳到档案详情页
          router.push(`/profiles/${profileId}`);
        }
      } else {
        // 没有预选类别，返回选择页面
        router.push(`/explore/${profileId}`);
      }
    }

    setIsSaving(false);
  };

  const skipCard = () => {
    if (isReadOnly) return;
    markCardViewed(profileId, categoryId, currentCard.id);
    const savedProfile = getProfile(profileId);
    if (savedProfile) setProfile(savedProfile);
    refreshProfiles();
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 类别完成，检查是否还有预选类别
      if (preSelectedCategories.length > 0) {
        const currentIndexInPreSelected = preSelectedCategories.indexOf(categoryId);
        if (currentIndexInPreSelected !== -1 && currentIndexInPreSelected < preSelectedCategories.length - 1) {
          // 跳到下一个预选类别
          const nextCategoryId = preSelectedCategories[currentIndexInPreSelected + 1];
          router.push(`/explore/${profileId}/${nextCategoryId}?categories=${preSelectedCategories.join(',')}`);
        } else {
          // 预选类别都完成了，跳到档案详情页
          router.push(`/profiles/${profileId}`);
        }
      } else {
        // 没有预选类别，返回选择页面
        router.push(`/explore/${profileId}`);
      }
    }
  };

  const goToPrev = () => {
    persistCurrent();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    persistCurrent();
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/profiles/${profileId}`}
              onClick={persistCurrent}
              className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">{localizedCategory.icon}</span>
              <span className="font-medium text-[#4A4A4A]">{localizedCategory.zh}</span>
            </div>
            <div className="w-6" /> {/* spacer */}
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#E8E2DA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7A9B76] rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[#6B6B6B]">{currentIndex + 1}/{totalCards}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-medium text-[#4A4A4A] text-center mb-2">
            {localizedCurrentCard.zh}
          </h2>
          <p className="text-sm text-[#6B6B6B] text-center">
            {localizedCurrentCard.en}
          </p>

          {conversationPrompts.length ? (
            <div className="mt-5 overflow-hidden rounded-2xl bg-[#F7F4EF] px-4">
              {conversationPrompts.map((prompt, index) => (
                <div
                  key={prompt}
                  className={cn(
                    'flex items-start gap-3 py-3.5',
                    index < conversationPrompts.length - 1 && 'border-b border-[#E3DED6]'
                  )}
                >
                  <span className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#7A9B76]" />
                  <p className="text-[15px] leading-7 text-[#4A4A4A]">{prompt}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={cn(
              'flex items-center gap-1 px-4 py-2 rounded-full text-sm',
              currentIndex > 0
                ? 'bg-white text-[#4A4A4A] border border-[#D9D4CC]'
                : 'text-[#C5BEB3] cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('上一张')}</span>
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === totalCards - 1}
            className={cn(
              'flex items-center gap-1 px-4 py-2 rounded-full text-sm',
              currentIndex < totalCards - 1
                ? 'bg-white text-[#4A4A4A] border border-[#D9D4CC]'
                : 'text-[#C5BEB3] cursor-not-allowed'
            )}
          >
            <span>{t('下一张')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested marking method from the original translation */}
        <div className="mb-6">
          <p className="text-sm text-[#6B6B6B] mb-3">{t('建议标记方式（可多选）')}</p>

          {/* Definition & Communication Hint */}
          <div className="bg-[#E8F2E6] rounded-xl p-4 mb-4 border border-[#7A9B76]/20">
            <p className="text-sm text-[#4A5D4B] leading-relaxed">
              <span className="font-medium">💡 {t('提示：')}</span>
              {t('不同的人对同一个词汇可能有不同的定义。这个工具依赖于你和伙伴之间的互动和沟通，它不会独立于关系而存在。请勇敢地用你自己的理解与伙伴一起讨论，没有标准答案，只有你们共同定义的答案。')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SUGGESTED_STATUS_VALUES.map((status) => {
              const config = STATUS_LABELS[status];
              const isSelected = selectedStatuses.includes(status);

              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)} disabled={isReadOnly}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-white text-[#4A4A4A] border border-[#D9D4CC] hover:border-[#7A9B76]'
                  )}
                  style={isSelected ? { backgroundColor: config.color } : {}}
                >
                  <span>{t(config.zh)}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
          <label className="block text-sm text-[#6B6B6B] mt-5 mb-2" htmlFor="participation">{t('如果需要区分行动者')}</label>
          <select id="participation" disabled={isReadOnly} value={participation || ''} onChange={(event) => setParticipation((event.target.value || undefined) as Participation | undefined)} className="w-full px-4 py-3 rounded-xl bg-white border border-[#D9D4CC] text-sm">
            <option value="">{t('暂不区分')}</option><option value="self">{t('主要由我')}</option><option value="other">{t('主要由对方')}</option><option value="together">{t('一起')}</option><option value="varies">{t('视情况而定')}</option>
          </select>
        </div>

        {/* Note Input */}
        <div className="mb-6">
          <p className="text-sm text-[#6B6B6B] mb-2">{t('备注（可选）')}</p>
          <textarea
            value={note}
            disabled={isReadOnly}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('记录你的想法、偏好或需要讨论的内容...')}
            className="w-full h-24 px-4 py-3 bg-white rounded-xl border border-[#D9D4CC] focus:border-[#7A9B76] focus:outline-none transition-colors resize-none text-sm"
          />
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#F5F1EB] via-[#F5F1EB] to-transparent pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {isReadOnly ? <p className="w-full text-center py-4 rounded-2xl bg-white/90 text-[#6B6B6B]">{t('这是收到的只读快照；如需修改，请从档案页创建可编辑副本。')}</p> : <>
          <button
            onClick={skipCard}
            className="flex-1 py-4 rounded-2xl font-medium text-[#6B6B6B] bg-white border border-[#D9D4CC] hover:border-[#7A9B76] transition-colors"
          >
            {t('跳过')}
          </button>
          </>}
          {!isReadOnly && <button
              onClick={saveAndNext}
              disabled={isSaving}
              className={cn(
                'flex-1 py-4 rounded-2xl font-medium text-white transition-all',
              Boolean(selectedStatuses.length || participation || note.trim())
                  ? 'bg-[#7A9B76] hover:bg-[#5A7B56]'
                  : 'bg-[#C5BEB3]'
              )}
            >
              {isSaving ? t('保存中...') : (currentIndex < totalCards - 1 ? t('保存并继续') : t('完成'))}
            </button>}
        </div>
      </div>
    </div>
  );
}

export default function CardDiscussionPage() {
  return (
    <Suspense fallback={<LocalizedLoading />}>
      <CardDiscussionContent />
    </Suspense>
  );
}
