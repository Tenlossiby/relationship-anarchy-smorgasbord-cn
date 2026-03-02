'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getCategoryById } from '@/data/categories';
import { STATUS_LABELS, StatusLabel, CardAnswer } from '@/types';
import { updateCardAnswer, getProfile } from '@/lib/storage';
import { cn } from '@/lib/utils';

export default function CardDiscussionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { refreshProfiles } = useApp();

  const profileId = params.profileId as string;
  const categoryId = params.categoryId as string;
  const preSelectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

  const [profile, setProfile] = useState(getProfile(profileId));
  const category = getCategoryById(categoryId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStatuses, setSelectedStatuses] = useState<StatusLabel[]>([]);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile && category) {
      // 加载当前卡牌的已有回答
      const categoryProgress = profile.progress.find(p => p.categoryId === categoryId);
      if (categoryProgress) {
        const cardAnswer = categoryProgress.answers.find(a => a.cardId === category.cards[currentIndex]?.id);
        if (cardAnswer) {
          setSelectedStatuses(cardAnswer.statuses);
          setNote(cardAnswer.note || '');
        } else {
          setSelectedStatuses([]);
          setNote('');
        }
      } else {
        setSelectedStatuses([]);
        setNote('');
      }
    }
  }, [profile, category, currentIndex, categoryId]);

  if (!profile || !category) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
        <p className="text-[#6B6B6B]">加载中...</p>
      </div>
    );
  }

  const currentCard = category.cards[currentIndex];
  const totalCards = category.cards.length;

  const toggleStatus = (status: StatusLabel) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
  };

  const saveAndNext = async () => {
    setIsSaving(true);

    // 保存当前回答
    updateCardAnswer(profileId, categoryId, currentCard.id, selectedStatuses, note || undefined);

    // 刷新档案数据
    const updatedProfile = getProfile(profileId);
    if (updatedProfile) {
      setProfile(updatedProfile);
    }
    refreshProfiles();

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
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const statusList: StatusLabel[] = [
    'agree', 'necessary', 'maybe', 'future_possible',
    'need_discussion', 'absolutely_not', 'hard_limit'
  ];

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/profiles/${profileId}`}
              className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">{category.icon}</span>
              <span className="font-medium text-[#4A4A4A]">{category.zh}</span>
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
          {/* Context Question */}
          {currentCard.contextQuestion && (
            <p className="text-sm text-[#6B6B6B] mb-4 italic">
              &quot;{currentCard.contextQuestion}&quot;
            </p>
          )}
          
          {/* Card Content */}
          <h2 className="text-xl font-medium text-[#4A4A4A] text-center mb-2">
            {currentCard.zh}
          </h2>
          <p className="text-sm text-[#6B6B6B] text-center">
            {currentCard.en}
          </p>
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
            <span>上一张</span>
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
            <span>下一张</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Status Labels */}
        <div className="mb-6">
          <p className="text-sm text-[#6B6B6B] mb-3">选择状态（可多选）</p>

          {/* Definition & Communication Hint */}
          <div className="bg-[#E8F2E6] rounded-xl p-4 mb-4 border border-[#7A9B76]/20">
            <p className="text-sm text-[#4A5D4B] leading-relaxed">
              <span className="font-medium">💡 提示：</span>
              不同的人对同一个词汇可能有不同的定义。这个工具依赖于你和伙伴之间的互动和沟通，它不会独立于关系而存在。请勇敢地用你自己的理解与伙伴一起讨论，没有标准答案，只有你们共同定义的答案。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statusList.map((status) => {
              const config = STATUS_LABELS[status];
              const isSelected = selectedStatuses.includes(status);
              
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-white text-[#4A4A4A] border border-[#D9D4CC] hover:border-[#7A9B76]'
                  )}
                  style={isSelected ? { backgroundColor: config.color } : {}}
                >
                  <span>{config.zh}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note Input */}
        <div className="mb-6">
          <p className="text-sm text-[#6B6B6B] mb-2">备注（可选）</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="记录你的想法、偏好或需要讨论的内容..."
            className="w-full h-24 px-4 py-3 bg-white rounded-xl border border-[#D9D4CC] focus:border-[#7A9B76] focus:outline-none transition-colors resize-none text-sm"
          />
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#F5F1EB] via-[#F5F1EB] to-transparent pt-6 pb-4 px-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={skipCard}
            className="flex-1 py-4 rounded-2xl font-medium text-[#6B6B6B] bg-white border border-[#D9D4CC] hover:border-[#7A9B76] transition-colors"
          >
            跳过
          </button>
          <button
            onClick={saveAndNext}
            disabled={isSaving}
            className={cn(
              'flex-1 py-4 rounded-2xl font-medium text-white transition-all',
              selectedStatuses.length > 0
                ? 'bg-[#7A9B76] hover:bg-[#5A7B56]'
                : 'bg-[#C5BEB3]'
            )}
          >
            {isSaving ? '保存中...' : (currentIndex < totalCards - 1 ? '保存并继续' : '完成')}
          </button>
        </div>
      </div>
    </div>
  );
}
