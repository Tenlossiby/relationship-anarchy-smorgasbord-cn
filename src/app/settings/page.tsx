/**
 * 关系安那其自助拼盘 (Relationship Anarchy Smörgåsbord)
 *
 * Copyright (c) 2025 Tenlossiby
 * Licensed under MIT License
 */

'use client';

import { useState } from 'react';
import { ExternalLink, Github, Sun, Moon, Monitor, Download } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light' as const, label: '浅色', icon: Sun },
    { value: 'dark' as const, label: '深色', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
  ];

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = '/ra-smorgasbord-cn.png';
    link.download = '关系安那其自助拼盘_中文版.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">设置</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Theme Section */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">主题</h2>

          <div className="flex gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-200
                    ${theme === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* About Section */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">关于</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-card-foreground text-lg mb-1">
                关系安那其自助拼盘
              </h3>
              <p className="text-sm text-muted-foreground">
                Relationship Anarchy Smörgåsbord
              </p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              这是一个多元包容的关系探索工具。你与对方可以从任意"菜单"中挑选任意数量的"菜品"，无论是一大份，还是只选一点点。你们共同选择的那些"菜品"，就是你们的关系。
            </p>

            <div className="text-xs text-muted-foreground">
              Version 1.0
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-secondary rounded-2xl p-5 mb-6">
          <h2 className="font-medium text-card-foreground mb-3">💡 使用提示</h2>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 不要在对方不知情的情况下偷偷加入"菜品"（期待）</p>
            <p>• 这是你们自己的"拼盘"——如果想调整，完全没问题</p>
            <p>• 定期导出档案备份，避免数据丢失</p>
            <p>• 使用分享口令可以让对方导入并调换指向</p>
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">隐私说明</h2>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>🔒 所有数据均存储在您的浏览器本地。</p>
            <p>🔒 我们不会收集或上传任何个人信息。</p>
            <p>🔒 清除浏览器数据将删除所有档案。</p>
          </div>
        </section>

        {/* Original Work Image */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-card-foreground">中文版原图</h2>
            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>下载</span>
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              这是关系安那其自助拼盘的完整中文版图表，包含所有 28 个类别的详细内容。你可以下载这张图片用于个人讨论或打印使用。
            </p>

            <div className="relative w-full bg-secondary rounded-xl overflow-hidden">
              <img
                src="/ra-smorgasbord-cn.png"
                alt="关系安那其自助拼盘中文版"
                className="w-full h-auto"
                onClick={handleDownloadImage}
                style={{ cursor: 'pointer' }}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              点击图片或上方按钮即可下载
            </p>
          </div>
        </section>

        {/* Original Work */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">原作信息</h2>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              原版由温哥华多元之爱组织 (Vancouver Polyamory) 的 Lyrica Lawrence 和 Heather Orr
              于 2016 年 12 月发起。
            </p>
            <p>
              Maxx Hill 在包括关系安那其、多元之爱和单人多元之爱等社群的指导下进行了更新。
            </p>
            <p>
              中文版由 Oli / 黑巧翻译整理，协作翻译：jeambo、eddyxx；辅助核查：肉肉、Lena。
            </p>
            <p>
              该 Web App 由 Tenlossiby 制作，适用于多人异步填写匹配，所有用户数据仅保留在本地，请谨慎保留或删除。
            </p>
          </div>
        </section>

        {/* License */}
        <section className="bg-card rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-medium text-card-foreground mb-4">许可协议</h2>

          <p className="text-sm text-muted-foreground">
            本作品采用知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议授权。
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
