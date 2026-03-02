'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Clipboard, FileText, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';

export default function ImportProfilePage() {
  const router = useRouter();
  const { importProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importMode, setImportMode] = useState<'clipboard' | 'file'>('clipboard');
  const [clipboardText, setClipboardText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
    } catch (e) {
      setErrorMessage('无法读取剪贴板，请手动粘贴');
    }
  };

  const handleImportFromText = () => {
    if (!clipboardText.trim()) {
      setErrorMessage('请粘贴档案内容');
      setImportStatus('error');
      return;
    }

    const profile = importProfile(clipboardText);
    if (profile) {
      setImportStatus('success');
      setTimeout(() => {
        router.push(`/profiles/${profile.id}`);
      }, 1000);
    } else {
      setErrorMessage('无法解析档案，请检查格式是否正确');
      setImportStatus('error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setClipboardText(text);
      setImportMode('clipboard');
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
          <h1 className="text-lg font-bold text-[#4A4A4A]">导入档案</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setImportMode('clipboard')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
              importMode === 'clipboard'
                ? 'bg-[#7A9B76] text-white'
                : 'bg-white text-[#4A4A4A] border border-[#D9D4CC]'
            )}
          >
            <Clipboard className="w-5 h-5" />
            <span>从剪贴板</span>
          </button>
          <button
            onClick={() => setImportMode('file')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
              importMode === 'file'
                ? 'bg-[#7A9B76] text-white'
                : 'bg-white text-[#4A4A4A] border border-[#D9D4CC]'
            )}
          >
            <FileText className="w-5 h-5" />
            <span>上传文件</span>
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
              <span>粘贴剪贴板内容</span>
            </button>

            {/* Text Area */}
            <textarea
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              placeholder="粘贴档案口令...&#10;&#10;格式示例：&#10;---RAS_DATA_START---&#10;eyJwYXJ0bmVyTmFtZSI6Iu...&#10;---RAS_DATA_END---"
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
              导入档案
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
              <span className="text-sm">点击或拖拽上传 TXT 文件</span>
              <span className="text-xs text-[#C5BEB3] mt-1">支持 .txt 格式</span>
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
              选择文件后，内容会自动填充到文本框
            </p>
          </div>
        )}

        {/* Status Messages */}
        {importStatus === 'success' && (
          <div className="mt-4 p-4 bg-[#7A9B76]/10 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-[#7A9B76]" />
            <span className="text-[#7A9B76]">导入成功！正在跳转...</span>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="mt-4 p-4 bg-[#C75B5B]/10 rounded-xl flex items-center gap-3">
            <span className="text-[#C75B5B]">{errorMessage}</span>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-[#E8E2DA] rounded-xl">
          <h3 className="font-medium text-[#4A4A4A] mb-2">导入说明</h3>
          <ul className="text-sm text-[#6B6B6B] space-y-1">
            <li>• 导入的档案会自动调换指向：原档案的&quot;对方&quot;会变为&quot;我&quot;</li>
            <li>• 支持从剪贴板粘贴或上传 .txt 文件</li>
            <li>• 文件必须包含 ---RAS_DATA_START--- 和 ---RAS_DATA_END--- 标记</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
