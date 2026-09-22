/** Domain types for Relationship Anarchy Smörgåsbord V2. */

export type Stance = 'want' | 'open' | 'unsure' | 'not_for_me' | 'hard_limit';
export type AnswerMarker = 'important' | 'future_possible' | 'need_discussion';
export type Participation = 'self' | 'other' | 'together' | 'varies';
export type StatusLabel = 'agree' | 'necessary' | 'maybe' | 'future_possible' | 'need_discussion' | 'absolutely_not' | 'hard_limit' | 'will_do' | 'they_will' | 'together' | 'unwilling';

export const STATUS_LABELS: Record<StatusLabel, { en: string; zh: string; color: string }> = {
  agree: { en: 'Want', zh: '想要', color: '#7A9B76' }, necessary: { en: 'Important', zh: '重要', color: '#5B8DBE' }, maybe: { en: 'Unsure', zh: '不确定', color: '#D4A84B' }, future_possible: { en: 'Future possible', zh: '未来可能', color: '#A0A05B' }, need_discussion: { en: 'Need discussion', zh: '需要讨论', color: '#5BA0A0' }, absolutely_not: { en: 'Not for me', zh: '不适合我', color: '#D46B6B' }, hard_limit: { en: 'Hard limit', zh: '硬性界限', color: '#C75B5B' }, will_do: { en: 'I will', zh: '我会（旧）', color: '#7A9B76' }, they_will: { en: 'They will', zh: '对方会（旧）', color: '#5B8DBE' }, together: { en: 'Together', zh: '共同参与（旧）', color: '#9B7AA0' }, unwilling: { en: 'Unwilling', zh: '不愿意（旧）', color: '#D4845B' },
};

export interface PersonRef { id: string; displayName: string; }
export interface CardAnswerV2 { cardId: string; stance?: Stance; markers?: AnswerMarker[]; participation?: Participation; note?: string; updatedAt: string; legacy?: { rawStatuses: string[]; needsReview: boolean }; }
export interface CategoryProgressV2 { categoryId: string; answers: Record<string, CardAnswerV2>; viewedCardIds?: string[]; }
export type Provenance = { kind: 'local' } | { kind: 'imported'; sourceProfileId: string; sourceExportId: string; importedAt: string } | { kind: 'fork'; sourceProfileId: string; sourceExportId?: string; forkedAt: string };
export interface ProfileV2 { schemaVersion: 2; id: string; title: string; direction: { author: PersonRef; subject: PersonRef }; relationLabels: string[]; selectedCategoryIds: string[]; answers: Record<string, CategoryProgressV2>; provenance: Provenance; permissions: { editable: boolean }; contentVersion: string; createdAt: string; updatedAt: string; legacy?: { rawData: unknown; unmappedItems: unknown[] }; }
export interface CardV2 { id: string; en: string; zh: string; prompt: string; contextQuestion?: string; reflectionPrompts?: string[]; sensitivity?: Array<'body' | 'sex' | 'power' | 'privacy' | 'identity'>; }
export interface Category { id: string; en: string; zh: string; icon: string; cards: CardV2[]; description?: string; }
export interface ExportEnvelopeV2 { kind: 'ra-smorgasbord-profile'; schemaVersion: 2; exportId: string; exportedAt: string; contentVersion: string; privacy: { includesNotes: boolean; encoding: 'base64'; encrypted: false }; profile: ProfileV2; digest: string; }
export interface LegacyV1Profile { id?: string; name?: string; fromName?: string; toName?: string; relationLabel?: string; createdAt?: string; updatedAt?: string; progress?: Array<{ categoryId: string; answers?: Array<{ cardId: string; statuses?: string[]; note?: string }> }>; }
export interface LegacyExpoProfile { id?: string; profileId?: string; partnerName?: string; timestamp?: string; data?: unknown; }
export interface CardAnswer { cardId: string; statuses: StatusLabel[]; note?: string; }
export interface CategoryProgress { categoryId: string; answers: CardAnswer[]; }
export interface ExportData { version: string; profile: Profile; exportedAt: string; }
export interface LegacyProfileView { name: string; fromName: string; toName: string; relationLabel: string; isImported: boolean; importedFrom?: string; progress: CategoryProgress[]; }
export type Profile = ProfileV2 & LegacyProfileView;
export type Card = CardV2;

export const RELATION_LABELS = [
  { value: '伴侣', label: '伴侣' }, { value: '恋人', label: '恋人' }, { value: '挚友', label: '挚友' }, { value: '朋友', label: '朋友' }, { value: 'QPR', label: 'QPR (酷儿柏拉图式关系)' }, { value: '家人', label: '家人' }, { value: '约会对象', label: '约会对象' }, { value: '室友', label: '室友' }, { value: '合作伙伴', label: '合作伙伴' }, { value: '其他', label: '其ta' },
];
export const STANCE_LABELS: Record<Stance, { zh: string; color: string }> = { want: { zh: '想要', color: '#7A9B76' }, open: { zh: '愿意了解', color: '#5B8DBE' }, unsure: { zh: '不确定', color: '#D4A84B' }, not_for_me: { zh: '不适合我', color: '#D46B6B' }, hard_limit: { zh: '硬性界限', color: '#C75B5B' } };
export const MARKER_LABELS: Record<AnswerMarker, string> = { important: '重要', future_possible: '未来可能', need_discussion: '需要讨论' };
