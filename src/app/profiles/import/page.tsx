'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Clipboard, FileText, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseImportText } from '@/lib/storageV2';
import { parseLegacyExpoExport, parseLegacyV1Export } from '@/lib/legacyMigration';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useSessionState } from '@/hooks/useSessionState';

export default function ImportProfilePage() {
  const router = useRouter();
  const { importProfile, importLegacyProfile } = useApp();
  const { t, perspective } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importDraft, setImportDraft, clearImportDraft] = useSessionState<{
    importMode: 'clipboard' | 'file';
    clipboardText: string;
    legacyAuthor: string;
    legacySubject: string;
  }>('ra_import_profile_draft', {
    importMode: 'clipboard',
    clipboardText: '',
    legacyAuthor: '',
    legacySubject: '',
  });
  const { importMode, clipboardText, legacyAuthor, legacySubject } = importDraft;
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [preview, setPreview] = useState<{ direction: string; title: string; includesNotes: boolean } | null>(null);
  const [pendingImportText, setPendingImportText] = useState<string | null>(null);
  const [legacyText, setLegacyText] = useState<string | null>(null);
  const [legacyPreview, setLegacyPreview] = useState<{ sourceProfileId: string; itemCount: number } | null>(null);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportDraft(current => ({ ...current, clipboardText: text }));
    } catch {
      setErrorMessage(t('无法读取剪贴板，请手动粘贴'));
    }
  };

  const handleImportFromText = () => {
    if (!clipboardText.trim()) {
      setErrorMessage(t('请粘贴档案内容'));
      setImportStatus('error');
      return;
    }

    let parsed;
    try {
      parsed = parseImportText(clipboardText);
      setPreview({ direction: perspective(parsed.profile.direction.author.displayName, parsed.profile.direction.subject.displayName), title: parsed.profile.title, includesNotes: parsed.privacy.includesNotes });
    } catch (error) {
      const legacyV1 = parseLegacyV1Export(clipboardText);
      if (legacyV1) {
        const legacyProfile = legacyV1.profile;
        const includesNotes = (legacyProfile.progress || []).some(category => (category.answers || []).some(answer => Boolean(answer.note?.trim())));
        setPreview({ direction: perspective(legacyProfile.fromName || '', legacyProfile.toName || ''), title: legacyProfile.name || t('旧版关系档案'), includesNotes });
        setPendingImportText(clipboardText);
        setImportStatus('idle');
        setErrorMessage(t('识别到旧版档案。请确认谁填写了它、写的是与谁的关系。导入后会先以只读方式打开。'));
        return;
      }
      if (parseLegacyExpoExport(clipboardText)) {
        setLegacyText(clipboardText);
        setPreview(null);
        setPendingImportText(null);
        setImportStatus('idle');
        setErrorMessage(t('识别到旧 Expo 档案。请先确认谁填写了它、写的是与谁的关系。'));
        return;
      }
      setErrorMessage(t(error instanceof Error ? error.message : '无法解析档案，请检查格式是否正确'));
      setImportStatus('error');
      return;
    }
    setPendingImportText(clipboardText);
    setImportStatus('idle');
    setErrorMessage(t('请检查预览，确认后才会写入本地档案。'));
  };

  const handleConfirmImport = () => {
    if (!pendingImportText) return;
    const profile = importProfile(pendingImportText);
    if (profile) {
      clearImportDraft();
      setImportStatus('success');
      setTimeout(() => {
        router.push(`/profiles/${profile.id}`);
      }, 1000);
    } else {
      setErrorMessage(t('这份档案可能已导入过，或无法写入本地存储。'));
      setImportStatus('error');
    }
  };

  const handleLegacyPreview = () => {
    if (!legacyText || !legacyAuthor.trim() || !legacySubject.trim()) { setErrorMessage(t('请先确认谁填写了这份档案，以及写的是与谁的关系。')); setImportStatus('error'); return; }
    const parsed = parseLegacyExpoExport(legacyText);
    if (!parsed) { setErrorMessage(t('旧档案无法读取，请保留原文件并检查格式。')); setImportStatus('error'); return; }
    setLegacyPreview({ sourceProfileId: parsed.sourceProfileId, itemCount: parsed.items.length });
    setImportStatus('idle');
    setErrorMessage(t('预览已生成。确认后才会写入本地档案。'));
  };

  const handleConfirmLegacyImport = () => {
    if (!legacyText || !legacyPreview) return;
    const profile = importLegacyProfile(legacyText, legacyAuthor, legacySubject);
    if (profile) { clearImportDraft(); setImportStatus('success'); setTimeout(() => router.push(`/profiles/${profile.id}`), 500); }
    else { setErrorMessage(t('旧档案无法读取，请保留原文件并检查格式。')); setImportStatus('error'); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportDraft(current => ({ ...current, clipboardText: text, importMode: 'clipboard' }));
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F5F1EB]/90 backdrop-blur-lg border-b border-[#D9D4CC]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/profiles" className="p-1 text-[#6B6B6B] hover:text-[#4A4A4A]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-[#4A4A4A]">{t('导入档案')}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setImportDraft(current => ({ ...current, importMode: 'clipboard' }))}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
              importMode === 'clipboard'
                ? 'bg-[#7A9B76] text-white'
                : 'bg-white text-[#4A4A4A] border border-[#D9D4CC]'
            )}
          >
            <Clipboard className="w-5 h-5" />
            <span>{t('从剪贴板')}</span>
          </button>
          <button
            onClick={() => setImportDraft(current => ({ ...current, importMode: 'file' }))}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
              importMode === 'file'
                ? 'bg-[#7A9B76] text-white'
                : 'bg-white text-[#4A4A4A] border border-[#D9D4CC]'
            )}
          >
            <FileText className="w-5 h-5" />
            <span>{t('上传文件')}</span>
          </button>
        </div>

        {importMode === 'clipboard' ? (
          <div className="space-y-4">
            {/* Paste Button */}
            <button
              onClick={handlePasteFromClipboard}
              className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-xl border border-dashed border-[#D9D4CC] text-[#6B6B6B] hover:border-[#7A9B76] hover:text-[#7A9B76] transition-colors"
            >
              <Clipboard className="w-5 h-5" />
              <span>{t('粘贴剪贴板内容')}</span>
            </button>

            {/* Text Area */}
            <textarea
              value={clipboardText}
              onChange={(e) => setImportDraft(current => ({ ...current, clipboardText: e.target.value }))}
              placeholder={t('粘贴档案口令...\n\n格式示例：\n---RAS_DATA_START---\neyJwYXJ0bmVyTmFtZSI6Iu...\n---RAS_DATA_END---')}
              className="w-full h-64 px-4 py-3 bg-white rounded-xl border border-[#D9D4CC] focus:border-[#7A9B76] focus:outline-none transition-colors resize-none text-sm"
            />

            {/* Import Button */}
            <button
              onClick={handleImportFromText}
              disabled={!clipboardText.trim()}
              className={cn(
                'w-full py-4 rounded-2xl font-medium text-white transition-all',
                clipboardText.trim()
                  ? 'bg-[#7A9B76] hover:bg-[#5A7B56]'
                  : 'bg-[#C5BEB3] cursor-not-allowed'
              )}
            >
              {t('生成导入预览')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Upload Area */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-[#D9D4CC] text-[#6B6B6B] hover:border-[#7A9B76] hover:text-[#7A9B76] transition-colors"
            >
              <Upload className="w-12 h-12 mb-3" />
              <span className="text-sm">{t('点击或拖拽上传 TXT 文件')}</span>
              <span className="text-xs text-[#C5BEB3] mt-1">{t('支持 .txt 格式')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Hint */}
            <p className="text-sm text-[#6B6B6B] text-center">
              {t('选择文件后，内容会自动填充到文本框')}
            </p>
          </div>
        )}

        {/* Status Messages */}
        {importStatus === 'success' && (
          <div className="mt-4 p-4 bg-[#7A9B76]/10 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-[#7A9B76]" />
            <span className="text-[#7A9B76]">{t('导入成功！正在跳转...')}</span>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="mt-4 p-4 bg-[#C75B5B]/10 rounded-xl flex items-center gap-3">
            <span className="text-[#C75B5B]">{errorMessage}</span>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-[#E8E2DA] rounded-xl">
          <h3 className="font-medium text-[#4A4A4A] mb-2">{t('导入说明')}</h3>
          <ul className="text-sm text-[#6B6B6B] space-y-1">
            <li>• {t('别人分享来的档案会按对方填写时的视角呈现，导入后不能直接改；需要继续填写时，可以创建副本')}</li>
            <li>• {t('支持从剪贴板粘贴或上传 .txt 文件')}</li>
            <li>• {t('文件必须包含 ---RAS_DATA_START--- 和 ---RAS_DATA_END--- 标记')}</li>
            <li>• {t('Base64 只是编码，不是加密；导入前请确认内容来源和隐私边界')}</li>
          </ul>
        </div>
        {preview && <div className="mt-4 p-4 bg-white rounded-xl border border-[#7A9B76]/30 text-sm text-[#4A4A4A] space-y-3"><p className="font-medium">{t('导入预览')}：{preview.title}</p><p className="mt-1">{t('填写视角')}：{preview.direction}</p><p className="mt-1">{t('包含备注')}：{preview.includesNotes ? t('是') : t('否')}</p><button onClick={handleConfirmImport} className="w-full py-3 rounded-xl bg-[#7A9B76] text-white font-medium">{t('确认并写入只读档案')}</button></div>}
        {legacyText && <div className="mt-4 p-4 bg-white rounded-xl border border-[#D4A84B]/40 text-sm text-[#4A4A4A] space-y-3"><p className="font-medium">{t('这份旧档案需要你确认填写视角')}</p><p>{t('旧文件没有完整记录这层信息，请手动补上：')}</p><input value={legacyAuthor} onChange={event => { setImportDraft(current => ({ ...current, legacyAuthor: event.target.value })); setLegacyPreview(null); }} placeholder={t('谁填写了这份档案？')} className="w-full px-3 py-2 rounded-lg border border-[#D9D4CC]" /><input value={legacySubject} onChange={event => { setImportDraft(current => ({ ...current, legacySubject: event.target.value })); setLegacyPreview(null); }} placeholder={t('填写的是与谁的关系？')} className="w-full px-3 py-2 rounded-lg border border-[#D9D4CC]" /><button onClick={handleLegacyPreview} className="w-full py-3 rounded-xl bg-[#D4A84B] text-white font-medium">{t('查看旧档案预览')}</button>{legacyPreview && <div className="space-y-2 rounded-lg bg-[#F5F1EB] p-3"><p>{t('来源档案')}：{legacyPreview.sourceProfileId}</p><p>{t('发现条目')}：{legacyPreview.itemCount} {t('条')}</p><button onClick={handleConfirmLegacyImport} className="w-full py-3 rounded-xl bg-[#7A9B76] text-white font-medium">{t('确认并导入只读档案')}</button></div>}</div>}
      </main>

      <BottomNav />
    </div>
  );
}
