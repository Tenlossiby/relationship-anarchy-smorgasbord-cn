/**
 * 关系安那其拼盘 (Relationship Anarchy Smörgåsbord)
 *
 * Copyright (c) 2025 Tenlossiby
 * Licensed under MIT License
 */

'use client';

import { ExternalLink, Download } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useEffect, useState } from 'react';
import { RECOVERY_KEY } from '@/lib/storageV2';
import { useLanguage } from '@/context/LanguageContext';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [recoveryData, setRecoveryData] = useState<string | null>(null);

  useEffect(() => {
    setRecoveryData(window.localStorage.getItem(RECOVERY_KEY));
  }, []);

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = '/ra-smorgasbord-cn.png';
    link.download = `${t('关系安那其拼盘')}_${t('中文版')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRecovery = () => {
    if (!recoveryData) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([recoveryData], { type: 'application/json;charset=utf-8' }));
    link.download = `${t('关系档案恢复数据')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">{t('关于')}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {recoveryData && (
          <section className="bg-[#FFF4DD] border border-[#D4A84B]/40 rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="font-medium text-[#6B4F18] mb-2">{t('发现未完成的迁移')}</h2>
            <p className="text-sm text-[#6B5A36] leading-relaxed">{t('旧档案迁移没有覆盖全部内容。原始数据已保留在本机，你可以先下载恢复文件，再决定是否继续处理。')}</p>
            <button onClick={handleDownloadRecovery} className="mt-3 px-4 py-2 rounded-xl bg-[#D4A84B] text-white text-sm font-medium">{t('下载恢复数据')}</button>
          </section>
        )}

        {/* About Section */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">{t('这个工具')}</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-card-foreground text-lg mb-1">
                {t('关系安那其拼盘')}
              </h3>
              <p className="text-sm text-muted-foreground">
                Relationship Anarchy Smörgåsbord
              </p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('这是一个多元包容的关系探索工具。你与对方可以从任意「菜单」中挑选任意数量的「菜品」，无论是一大份，还是只选一点点。你们共同选择的那些「菜品」，就是你们的关系。')}
            </p>

            <div className="text-xs text-muted-foreground">
              Version 2.0
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-secondary rounded-2xl p-5 mb-6">
          <h2 className="font-medium text-card-foreground mb-3">💡 {t('使用提示')}</h2>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• {t('不要在对方不知情的情况下偷偷加入「菜品」（期待）')}</p>
            <p>• {t('这是你们自己的「拼盘」——如果想调整，完全没问题')}</p>
            <p>• {t('定期导出档案备份，避免数据丢失')}</p>
            <p>• {t('别人分享来的档案会按对方填写时的视角呈现；想接着填写，可以创建一份自己的副本')}</p>
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">{t('隐私说明')}</h2>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>🔒 {t('所有数据均存储在您的浏览器本地；本地保存不等于设备加密。')}</p>
            <p>🔒 {t('导出文件中的 Base64 只是编码，不是加密；分享前请确认其中可能含有敏感备注。')}</p>
            <p>🔒 {t('我们不会收集或上传个人回答；清除浏览器数据可能删除本地档案，请先备份。')}</p>
          </div>
        </section>

        {/* Original Work Image */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-card-foreground">{t('中文版原图')}</h2>
            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('下载')}</span>
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('这是关系安那其拼盘的完整中文版图表，包含所有 28 个类别的详细内容。你可以下载这张图片用于个人讨论或打印使用。')}
            </p>

            <div className="relative w-full bg-secondary rounded-xl overflow-hidden">
              <img
                src="/ra-smorgasbord-cn.png"
                alt={t('关系安那其拼盘中文版')}
                className="w-full h-auto"
                onClick={handleDownloadImage}
                style={{ cursor: 'pointer' }}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t('点击图片或上方按钮即可下载')}
            </p>
          </div>
        </section>

        {/* Original Work */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">{t('原作信息')}</h2>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              {t('原版由温哥华多元之爱组织 (Vancouver Polyamory) 的 Lyrica Lawrence 和 Heather Orr 于 2016 年 12 月发起。')}
            </p>
            <p>
              {t('Maxx Hill 在包括关系安那其、多元之爱和单人多元之爱等社群的指导下进行了更新。')}
            </p>
            <p>
              {t('中文版由 Oli / 黑巧翻译整理，协作翻译：jeambo、eddyxx；辅助核查：肉肉、Lena。')}
            </p>
            <p>
              {t('该 Web App 由 Tenlossiby 制作，适用于多人异步填写匹配，所有用户数据仅保留在本地，请谨慎保留或删除。')}
            </p>
          </div>
        </section>

        {/* License */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">{t('许可协议')}</h2>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-card-foreground mb-1">
                📄 {t('图表内容许可')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('采用知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议（中文翻译）授权。')}
              </p>
              <a
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                {t('查看 CC BY-NC-SA 4.0 协议详情')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="border-t border-border pt-3">
              <h3 className="text-sm font-medium text-card-foreground mb-1">
                💻 {t('软件开源许可')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('本 Web App 采用 MIT 许可协议开源。')}
              </p>
              <a
                href="https://github.com/Tenlossiby/relationship-anarchy-smorgasbord-cn/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                {t('查看 MIT 协议详情')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-secondary rounded-xl p-3">
              <p className="text-xs text-muted-foreground">
                ⚠️ <span className="font-medium">{t('重要提示：')}</span>{t('使用或分享时，请务必保留原作者署名信息。')}
              </p>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
