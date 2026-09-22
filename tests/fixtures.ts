import type { LegacyExpoProfile, LegacyV1Profile } from '@/types';

export const directionAB: LegacyV1Profile = { id: 'fixture-ab', name: '匿名 A 给 B', fromName: 'A', toName: 'B', relationLabel: '朋友', progress: [] };
export const directionBA: LegacyV1Profile = { id: 'fixture-ba', name: '匿名 B 给 A', fromName: 'B', toName: 'A', relationLabel: '朋友', progress: [] };
export const v1Contradictory: LegacyV1Profile = { id: 'fixture-contradictory', fromName: 'A', toName: 'B', progress: [{ categoryId: 'caregiving', answers: [{ cardId: 'caregiving-health', statuses: ['agree', 'hard_limit'], note: '保留原始矛盾供复核' }] }] };
export const legacyExpoNeedsConfirmation: LegacyExpoProfile = { id: 'expo-fixture', partnerName: 'B', timestamp: '2025-01-01T00:00:00.000Z', data: { anonymous: true } };

export function encodeLegacyText(payload: unknown): string {
  return ['---RAS_DATA_START---', btoa(encodeURIComponent(JSON.stringify(payload))), '---RAS_DATA_END---'].join('\n');
}

export const legacyV1Text = encodeLegacyText({
  version: '1.0',
  exportedAt: '2025-01-01T00:00:00.000Z',
  profile: { ...v1Contradictory, progress: [{ categoryId: 'caregiving', answers: [{ cardId: 'caregiving-health', statuses: ['will_do', 'need_discussion'], note: '旧格式备注' }] }] },
});

export const legacyExpoText = encodeLegacyText({
  id: 'expo-real-profile',
  partnerName: 'B',
  timestamp: '2025-01-01T00:00:00.000Z',
  data: [
    { itemName: '健康', itemEn: 'Health', category: '照护', status: 'yes,required,maybe_future,lets_talk', notes: '需要提前说清楚' },
    { item_name_zh: '经济支持', item_name_en: 'Sponsorship', category_name_zh: '照护', category_name_en: 'Caregiving', status: 'definitely_no,hard_limit', notes: '旧字段名也要保留' },
    { item_name_en: 'Unknown legacy item', category_name_zh: '旧类别', status: 'yes', notes: '保留这条原始数据' },
  ],
});
