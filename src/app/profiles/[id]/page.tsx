'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Share2, Play } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, getTotalCards } from '@/data/categories';
import { exportProfileToText, generateShareCode } from '@/lib/storage';
import { BottomNav } from '@/components/BottomNav';
import { STATUS_LABELS, type StatusLabel } from '@/types';

export default function ProfileDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { profiles } = useApp();
  const profileId = params.id as string;

  const profile = profiles.find(p => p.id === profileId);
  const totalCards = getTotalCards();

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center">
        <p className="text-[#6B6B6B]">档案不存在</p>
      </div>
    );
  }

  const completedCards = profile.progress.reduce((sum, p) => sum + p.answers.length, 0);
  const progressPercent = Math.round((completedCards / totalCards) * 100);

  const handleExport = () => {
    const text = exportProfileToText(profile);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = generateShareCode(profile);
    try {
      await navigator.clipboard.writeText(shareText);
      alert('档案口令已复制到剪贴板！');
    } catch (e) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('档案口令已复制到剪贴板！');
    }
  };

  // 获取已填写的所有答案
  const getCompletedAnswers = () => {
    const answers: Array<{
      category: typeof CATEGORIES[0];
      cardId: string;
      card: typeof CATEGORIES[0]['cards'][0];
      statuses: StatusLabel[];
      note?: string;
    }> = [];

    profile.progress.forEach(catProgress => {
      const category = CATEGORIES.find(c => c.id === catProgress.categoryId);
      if (!category) return;

      catProgress.answers.forEach(answer => {
        // 只显示有选择状态或有备注的项目
        if (answer.statuses.length > 0 || answer.note) {
          const card = category.cards.find(c => c.id === answer.cardId);
          if (card) {
            answers.push({
              category,
              cardId: answer.cardId,
              card,
              statuses: answer.statuses,
              note: answer.note,
            });
          }
        }
      });
    });

    return answers;
  };

  const completedAnswers = getCompletedAnswers();

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/profiles?highlight=${profileId}`}
              className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-bold text-[#4A4A4A]">档案详情</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">{profile.name}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">我是</span>
              <span className="text-[#4A4A4A] font-medium">{profile.fromName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">对方是</span>
              <span className="text-[#4A4A4A] font-medium">{profile.toName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">关系标签</span>
              <span className="text-[#4A4A4A] font-medium">{profile.relationLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">创建时间</span>
              <span className="text-[#4A4A4A]">
                {new Date(profile.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
            {profile.isImported && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">导入来源</span>
                <span className="text-[#5B8DBE]">📥 {profile.importedFrom}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-4 border-t border-[#E8E2DA]">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#6B6B6B]">探索进度</span>
              <span className="text-[#7A9B76] font-medium">{completedCards}/{totalCards}</span>
            </div>
            <div className="h-3 bg-[#E8E2DA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7A9B76] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Export & Share Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl border border-[#D9D4CC] text-[#4A4A4A] hover:border-[#7A9B76] transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>导出 TXT</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl border border-[#D9D4CC] text-[#4A4A4A] hover:border-[#7A9B76] transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>分享口令</span>
          </button>
        </div>

        {/* Completed Answers Comparison */}
        {completedAnswers.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[#6B6B6B] mb-3">已填项目</h3>
            <div className="space-y-3">
              {completedAnswers.map((answer, index) => (
                <div
                  key={`${answer.category.id}-${answer.cardId}`}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{answer.category.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs text-[#6B6B6B] mb-1">{answer.category.zh}</div>
                      <div className="text-sm font-medium text-[#4A4A4A]">{answer.card.zh}</div>
                    </div>
                  </div>
                  {answer.statuses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {answer.statuses.map(status => {
                        const statusLabel = STATUS_LABELS[status];
                        return (
                          <span
                            key={status}
                            className="px-3 py-1 rounded-full text-xs text-white"
                            style={{ backgroundColor: statusLabel?.color || '#999' }}
                          >
                            {statusLabel?.zh || status}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {answer.note && (
                    <div className="mt-2 text-xs text-[#6B6B6B] bg-[#F5F1EB] rounded-lg p-2">
                      {answer.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Continue Exploration Button (if not complete) */}
        {completedCards < totalCards && (
          <div className="mt-6">
            <Link
              href={`/explore/${profile.id}`}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#7A9B76] text-white rounded-2xl font-medium hover:bg-[#5A7B56] transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>继续探索</span>
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
