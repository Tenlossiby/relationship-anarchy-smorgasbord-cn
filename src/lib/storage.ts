// 本地存储管理工具
import { Profile, ExportData, CardAnswer, CategoryProgress, Card } from '@/types';
import { CATEGORIES } from '@/data/categories';

const PROFILES_KEY = 'ra_profiles';
const API_CONFIG_KEY = 'ra_api_config';

// 获取所有档案
export const getProfiles = (): Profile[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PROFILES_KEY);
  return data ? JSON.parse(data) : [];
};

// 保存所有档案
export const saveProfiles = (profiles: Profile[]): void => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

// 添加新档案
export const addProfile = (profile: Profile): void => {
  const profiles = getProfiles();
  profiles.push(profile);
  saveProfiles(profiles);
};

// 更新档案
export const updateProfile = (profile: Profile): void => {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index !== -1) {
    profiles[index] = profile;
    saveProfiles(profiles);
  }
};

// 删除档案
export const deleteProfile = (id: string): void => {
  const profiles = getProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
};

// 获取单个档案
export const getProfile = (id: string): Profile | undefined => {
  return getProfiles().find(p => p.id === id);
};

// 生成唯一ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 创建新档案
export const createProfile = (
  name: string,
  fromName: string,
  toName: string,
  relationLabel: string
): Profile => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    fromName,
    toName,
    relationLabel,
    createdAt: now,
    updatedAt: now,
    isImported: false,
    progress: [],
  };
};

// 更新档案中的卡牌回答
export const updateCardAnswer = (
  profileId: string,
  categoryId: string,
  cardId: string,
  statuses: string[],
  note?: string
): void => {
  const profile = getProfile(profileId);
  if (!profile) return;

  let categoryProgress = profile.progress.find(p => p.categoryId === categoryId);
  
  if (!categoryProgress) {
    categoryProgress = { categoryId, answers: [] };
    profile.progress.push(categoryProgress);
  }

  const existingAnswerIndex = categoryProgress.answers.findIndex(a => a.cardId === cardId);
  const newAnswer: CardAnswer = { cardId, statuses: statuses as any, note };

  if (existingAnswerIndex !== -1) {
    categoryProgress.answers[existingAnswerIndex] = newAnswer;
  } else {
    categoryProgress.answers.push(newAnswer);
  }

  profile.updatedAt = new Date().toISOString();
  updateProfile(profile);
};

// 获取档案在某个类别的进度
export const getCategoryProgress = (profile: Profile, categoryId: string): CategoryProgress | undefined => {
  return profile.progress.find(p => p.categoryId === categoryId);
};

// 导出档案为文本格式
export const exportProfileToText = (profile: Profile): string => {
  const lines: string[] = [];
  
  // 头部信息
  lines.push('═══════════════════════════════════════════════════');
  lines.push('     关系安那其自助拼盘 - 关系档案');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push(`📋 档案名称：${profile.name}`);
  lines.push(`👤 我是：${profile.fromName}`);
  lines.push(`➡️ 对方是：${profile.toName}`);
  lines.push(`🏷️ 关系标签：${profile.relationLabel}`);
  lines.push(`📅 创建时间：${new Date(profile.createdAt).toLocaleString('zh-CN')}`);
  lines.push(`📅 更新时间：${new Date(profile.updatedAt).toLocaleString('zh-CN')}`);
  lines.push('');

  // 各类别的回答
  for (const category of CATEGORIES) {
    const progress = profile.progress.find(p => p.categoryId === category.id);
    if (!progress || progress.answers.length === 0) continue;

    lines.push('───────────────────────────────────────────────────');
    lines.push(`${category.icon} ${category.zh} (${category.en})`);
    lines.push('───────────────────────────────────────────────────');

    for (const answer of progress.answers) {
      const card = category.cards.find((c: Card) => c.id === answer.cardId);
      if (!card) continue;

      lines.push(``);
      lines.push(`📌 ${card.zh}`);
      if (card.contextQuestion) {
        lines.push(`   💭 ${card.contextQuestion}`);
      }
      lines.push(`   ✦ 状态：${answer.statuses.map(s => {
        const labels: Record<string, string> = {
          agree: '同意', necessary: '必要', maybe: '也许', future_possible: '未来可能',
          need_discussion: '需要讨论', absolutely_not: '绝对不行', hard_limit: '硬性界限',
          // 兼容旧数据
          will_do: '我会', they_will: '对方会', together: '共同参与', unwilling: '不愿意'
        };
        return labels[s] || s;
      }).join('、')}`);
      if (answer.note) {
        lines.push(`   📝 备注：${answer.note}`);
      }
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════');
  lines.push('');
  lines.push('【以下是用于 App 恢复的机读区，请勿修改】');
  lines.push('');
  
  // 机读区
  const exportData: ExportData = {
    version: '1.0',
    profile,
    exportedAt: new Date().toISOString(),
  };
  
  const encoded = btoa(encodeURIComponent(JSON.stringify(exportData)));
  lines.push('---RAS_DATA_START---');
  lines.push(encoded);
  lines.push('---RAS_DATA_END---');
  lines.push('');
  lines.push('═══════════════════════════════════════════════════');
  
  return lines.join('\n');
};

// 从文本导入档案
export const importProfileFromText = (text: string): Profile | null => {
  try {
    // 查找机读区
    const startMarker = '---RAS_DATA_START---';
    const endMarker = '---RAS_DATA_END---';
    
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      return null;
    }
    
    const encoded = text.substring(startIndex + startMarker.length, endIndex).trim();
    const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
    
    const profile: Profile = {
      ...decoded.profile,
      id: generateId(), // 生成新ID
      isImported: true,
      importedFrom: decoded.profile.name,
      // 导入时调转指向
      fromName: decoded.profile.toName,
      toName: decoded.profile.fromName,
    };
    
    return profile;
  } catch (e) {
    console.error('Failed to import profile:', e);
    return null;
  }
};

// 生成社交口令
export const generateShareCode = (profile: Profile): string => {
  const exportData: ExportData = {
    version: '1.0',
    profile,
    exportedAt: new Date().toISOString(),
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(exportData)));
  return `💌 关系安那其自助拼盘 - ${profile.name}\n\n请复制下方口令导入档案：\n\n---RAS_DATA_START---\n${encoded}\n---RAS_DATA_END---`;
};

// 从剪贴口令导入
export const importFromClipboard = async (): Promise<Profile | null> => {
  try {
    const text = await navigator.clipboard.readText();
    return importProfileFromText(text);
  } catch (e) {
    return null;
  }
};

// API 配置管理
export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const getApiConfig = (): ApiConfig | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(API_CONFIG_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveApiConfig = (config: ApiConfig): void => {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
};

export const clearApiConfig = (): void => {
  localStorage.removeItem(API_CONFIG_KEY);
};
