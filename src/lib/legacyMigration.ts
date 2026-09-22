import { CATEGORIES } from '@/data/categories';
import type { CardAnswerV2, LegacyExpoProfile, LegacyV1Profile, ProfileV2 } from '@/types';
import { CONTENT_VERSION, decodeLegacyBase64, digestString, isAnswerEffective, makeId, migrateLegacyStatuses, normalizeAnswer, createProfile, migrateV1Profile } from '@/lib/domain';

const START_MARKER = '---RAS_DATA_START---';
const END_MARKER = '---RAS_DATA_END---';

export interface LegacyV1Export {
  version: '1.0';
  profile: LegacyV1Profile;
  exportedAt?: string;
}

export interface LegacyExpoImport extends LegacyExpoProfile {
  sourceProfileId: string;
  sourceExportId: string;
  rawPayload: unknown;
  items: unknown[];
}

export function decodeMachinePayload(text: string): unknown {
  const start = text.indexOf(START_MARKER);
  const end = text.indexOf(END_MARKER);
  const encoded = start >= 0 && end > start ? text.slice(start + START_MARKER.length, end).trim() : text.trim();
  if (!encoded) throw new Error('机读区为空。');
  try {
    return JSON.parse(decodeLegacyBase64(encoded));
  } catch {
    try { return JSON.parse(encoded); } catch { throw new Error('机读区不是有效的 JSON 或 Base64 数据。'); }
  }
}

export function parseLegacyV1Export(text: string): LegacyV1Export | null {
  try {
    const payload = decodeMachinePayload(text) as Partial<LegacyV1Export>;
    if (payload.version === '1.0' && payload.profile && typeof payload.profile === 'object') return payload as LegacyV1Export;
  } catch { /* caller displays the normal invalid-file message */ }
  return null;
}

export function migrateLegacyV1Import(input: LegacyV1Export, sourceText: string): ProfileV2 {
  const profile = migrateV1Profile(input.profile);
  profile.id = makeId();
  profile.permissions = { editable: false };
  profile.provenance = {
    kind: 'imported',
    sourceProfileId: input.profile.id || `legacy-v1-${digestString(JSON.stringify(input.profile))}`,
    sourceExportId: digestString(sourceText),
    importedAt: new Date().toISOString(),
  };
  profile.legacy = { rawData: input, unmappedItems: [] };
  return profile;
}

function recordValue(value: unknown, ...keys: string[]): unknown {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return keys.map(key => record[key]).find(item => item !== undefined);
}

function stringValue(value: unknown, ...keys: string[]): string | undefined {
  const result = recordValue(value, ...keys);
  return typeof result === 'string' && result.trim() ? result.trim() : undefined;
}

function arrayValue(value: unknown, ...keys: string[]): unknown[] {
  const result = recordValue(value, ...keys);
  return Array.isArray(result) ? result : [];
}

export function parseLegacyExpoExport(text: string): LegacyExpoImport | null {
  try {
    const payload = decodeMachinePayload(text) as LegacyExpoProfile & Record<string, unknown>;
    const data = Array.isArray(payload.data) ? payload.data : arrayValue(payload.data, 'items', 'answers', 'selections');
    if (typeof payload.partnerName !== 'string' || !Array.isArray(data)) return null;
    const sourceProfileId = stringValue(payload, 'id', 'profileId') || `legacy-expo-${digestString(JSON.stringify(payload))}`;
    return { ...payload, sourceProfileId, sourceExportId: digestString(text), rawPayload: payload, items: data };
  } catch { return null; }
}

function findCard(item: unknown) {
  const cardId = stringValue(item, 'cardId', 'itemId', 'id');
  const itemName = stringValue(item, 'itemName', 'item_name_zh', 'name', 'zh', 'item');
  const itemEn = stringValue(item, 'itemEn', 'item_name_en', 'en', 'englishName');
  const categoryHint = stringValue(item, 'categoryId', 'category', 'category_name_zh', 'category_name_en');
  const categories = categoryHint ? CATEGORIES.filter(category => category.id === categoryHint || category.zh === categoryHint || category.en === categoryHint) : CATEGORIES;
  for (const category of categories) {
    const card = category.cards.find(candidate => candidate.id === cardId || candidate.zh === itemName || candidate.en === itemEn || candidate.en === itemName);
    if (card) return { category, card };
  }
  return undefined;
}

function rawStatuses(item: unknown): string[] {
  const value = recordValue(item, 'statuses', 'status', 'selectedStatuses');
  const values = Array.isArray(value) ? value.filter((status): status is string => typeof status === 'string') : typeof value === 'string' ? [value] : [];
  return values.flatMap(status => status.split(',').map(part => part.trim()).filter(Boolean));
}

function noteValue(item: unknown): string | undefined {
  return stringValue(item, 'note', 'notes', 'remark', 'comments');
}

export function migrateLegacyExpoImport(input: LegacyExpoImport, authorName: string, subjectName: string): ProfileV2 {
  const profile = createProfile(`旧 Expo 档案：${authorName} → ${subjectName}`, authorName, subjectName);
  const unmappedItems: unknown[] = [];
  for (const item of input.items) {
    const match = findCard(item);
    const statuses = rawStatuses(item);
    const migrated = migrateLegacyStatuses(statuses);
    const answer: CardAnswerV2 | undefined = match ? normalizeAnswer({ cardId: match.card.id, ...migrated, note: noteValue(item), updatedAt: new Date().toISOString() }) : undefined;
    if (!match || !answer) { unmappedItems.push(item); continue; }
    const current = profile.answers[match.category.id] || { categoryId: match.category.id, answers: {} };
    current.answers[match.card.id] = answer;
    profile.answers[match.category.id] = current;
  }
  profile.id = makeId();
  profile.permissions = { editable: false };
  profile.provenance = { kind: 'imported', sourceProfileId: input.sourceProfileId, sourceExportId: input.sourceExportId, importedAt: new Date().toISOString() };
  profile.contentVersion = CONTENT_VERSION;
  profile.legacy = { rawData: input.rawPayload, unmappedItems };
  return profile;
}

export function countMappedLegacyItems(profile: ProfileV2): number {
  return Object.values(profile.answers).reduce((total, category) => total + Object.values(category.answers).filter(isAnswerEffective).length, 0);
}
