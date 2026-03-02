/**
 * 关系安那其自助拼盘 (Relationship Anarchy Smörgåsbord)
 *
 * Copyright (c) 2025 Tenlossiby
 * Licensed under MIT License
 */

// 关系安那其自助拼盘 - 类型定义

// 状态标签类型
export type StatusLabel =
  | 'agree'              // 同意
  | 'necessary'          // 必要
  | 'maybe'              // 也许
  | 'future_possible'    // 未来可能
  | 'need_discussion'    // 需要讨论
  | 'absolutely_not'     // 绝对不行
  | 'hard_limit'        // 硬性界限
  // 兼容旧数据的状态
  | 'will_do'            // 旧：我会
  | 'they_will'          // 旧：对方会
  | 'together'           // 旧：共同参与
  | 'unwilling';         // 旧：不愿意

// 状态标签配置
export const STATUS_LABELS: Record<string, { en: string; zh: string; color: string }> = {
  // 新状态
  agree: { en: 'Agree', zh: '同意', color: '#7A9B76' },
  necessary: { en: 'Necessary', zh: '必要', color: '#5B8DBE' },
  maybe: { en: 'Maybe', zh: '也许', color: '#D4A84B' },
  future_possible: { en: 'Future Possible', zh: '未来可能', color: '#A0A05B' },
  need_discussion: { en: 'Need Discussion', zh: '需要讨论', color: '#5BA0A0' },
  absolutely_not: { en: 'Absolutely Not', zh: '绝对不行', color: '#D46B6B' },
  hard_limit: { en: 'Hard Limit', zh: '硬性界限', color: '#C75B5B' },
  // 兼容旧数据
  will_do: { en: 'I will', zh: '我会（旧）', color: '#7A9B76' },
  they_will: { en: 'They will', zh: '对方会（旧）', color: '#5B8DBE' },
  together: { en: 'Together', zh: '共同参与（旧）', color: '#9B7AA0' },
  unwilling: { en: 'Unwilling', zh: '不愿意（旧）', color: '#D4845B' },
};

// 卡牌定义
export interface Card {
  id: string;
  en: string;
  zh: string;
  contextQuestion?: string; // 情境化提问
}

// 类别定义
export interface Category {
  id: string;
  en: string;
  zh: string;
  icon: string; // emoji 图标
  cards: Card[];
  description?: string;
}

// 档案中的卡牌回答
export interface CardAnswer {
  cardId: string;
  statuses: StatusLabel[];
  note?: string;
}

// 档案中的类别进度
export interface CategoryProgress {
  categoryId: string;
  answers: CardAnswer[];
}

// 档案定义
export interface Profile {
  id: string;
  name: string;           // 档案名称，如 "小明 & 小红"
  fromName: string;       // 填表人名字
  toName: string;         // 指向对象名字
  relationLabel: string;  // 关系标签
  createdAt: string;      // 创建时间
  updatedAt: string;      // 更新时间
  isImported: boolean;    // 是否是导入的档案
  importedFrom?: string;  // 导入来源
  progress: CategoryProgress[]; // 各类别的进度
}

// 导出数据格式
export interface ExportData {
  version: string;
  profile: Profile;
  exportedAt: string;
}

// 关系标签预设
export const RELATION_LABELS = [
  { value: '伴侣', label: '伴侣' },
  { value: '恋人', label: '恋人' },
  { value: '挚友', label: '挚友' },
  { value: '朋友', label: '朋友' },
  { value: 'QPR', label: 'QPR (酷儿柏拉图式关系)' },
  { value: '家人', label: '家人' },
  { value: '约会对象', label: '约会对象' },
  { value: '室友', label: '室友' },
  { value: '合作伙伴', label: '合作伙伴' },
  { value: '其他', label: '其ta' },
];
