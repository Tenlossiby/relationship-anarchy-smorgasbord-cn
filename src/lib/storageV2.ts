import type { CardAnswerV2, ExportEnvelopeV2, Profile, ProfileV2, StatusLabel } from '@/types';
import { CONTENT_VERSION, createEnvelope, createProfile as createDomainProfile, decodeEnvelope, digestString, encodeEnvelope, getAnswerStatuses, isAnswerEffective, makeId, migrateV1Profile, normalizeAnswer, validateProfile } from '@/lib/domain';
import { migrateLegacyExpoImport, migrateLegacyV1Import, parseLegacyExpoExport, parseLegacyV1Export } from '@/lib/legacyMigration';
import { DEFAULT_LOCALE, describePerspectiveForLocale, localizeText, type AppLocale } from '@/lib/i18n';

export const PROFILES_KEY = 'ra_profiles_v2';
export const BACKUP_KEY = 'ra_profiles_v2_backup';
export const LEGACY_PROFILES_KEY = 'ra_profiles';
export const LEGACY_BACKUP_KEY = 'ra_profiles_backup';
export const MIGRATION_MARKER_KEY = 'ra_profiles_v2_migration';
export const RECOVERY_KEY = 'ra_profiles_v2_recovery';
function ensureLegacyMigration(): void {
  if (typeof window === 'undefined' || window.localStorage.getItem(MIGRATION_MARKER_KEY)) return;
  const legacyRaw = window.localStorage.getItem(LEGACY_PROFILES_KEY);
  if (!legacyRaw) return;
  const existingRaw = window.localStorage.getItem(PROFILES_KEY);
  const now = new Date().toISOString();
  window.localStorage.setItem(LEGACY_BACKUP_KEY, legacyRaw);
  try {
    const parsed = JSON.parse(legacyRaw);
    if (!Array.isArray(parsed)) throw new Error('旧档案不是数组。');
    let existing: unknown[] = [];
    if (existingRaw) {
      const decoded = JSON.parse(existingRaw);
      if (!Array.isArray(decoded)) throw new Error('现有 V2 档案不是数组，已停止合并以避免覆盖。');
      existing = decoded;
    }
    const migrated: ProfileV2[] = [];
    const failures: Array<{ index: number; error: string; raw: unknown }> = [];
    parsed.forEach((value, index) => {
      try {
        const profile = migrateStored(value);
        if (!profile) throw new Error('无法识别或验证旧档案。');
        const sourceId = value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string' ? (value as { id: string }).id : undefined;
        if (sourceId) profile.id = sourceId;
        migrated.push(profile);
      } catch (error) {
        failures.push({ index, error: error instanceof Error ? error.message : '未知迁移错误', raw: value });
      }
    });
    const existingProfiles: ProfileV2[] = [];
    existing.forEach((value, index) => {
      const profile = migrateStored(value);
      if (!profile) throw new Error(`现有 V2 档案第 ${index + 1} 条无法验证，已停止合并以避免丢失。`);
      existingProfiles.push(profile);
    });
    const seenIds = new Set(existingProfiles.map(profile => profile.id));
    const seenSources = new Set(existingProfiles.map(profile => profile.provenance.kind === 'fork' ? profile.provenance.sourceProfileId : ''));
    const additions = migrated.filter(profile => {
      const sourceId = profile.provenance.kind === 'fork' ? profile.provenance.sourceProfileId : '';
      if (seenIds.has(profile.id) || (sourceId && seenSources.has(sourceId))) return false;
      seenIds.add(profile.id);
      if (sourceId) seenSources.add(sourceId);
      return true;
    });
    const merged = [...existingProfiles, ...additions];
    if (existingRaw && additions.length > 0) window.localStorage.setItem(BACKUP_KEY, existingRaw);
    if (!existingRaw || additions.length > 0) window.localStorage.setItem(PROFILES_KEY, JSON.stringify(merged));
    if (failures.length) {
      window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ source: LEGACY_PROFILES_KEY, raw: legacyRaw, failures, createdAt: now }));
    }
    window.localStorage.setItem(MIGRATION_MARKER_KEY, JSON.stringify({ status: failures.length ? 'partial' : 'completed', migratedAt: now, count: additions.length, skipped: migrated.length - additions.length, failed: failures.length }));
  } catch (error) {
    window.localStorage.setItem(RECOVERY_KEY, JSON.stringify({ source: LEGACY_PROFILES_KEY, raw: legacyRaw, existingRaw, error: error instanceof Error ? error.message : '未知迁移错误', createdAt: now }));
    window.localStorage.setItem(MIGRATION_MARKER_KEY, JSON.stringify({ status: 'failed', failedAt: now }));
  }
}
function readRaw(): unknown[] { if (typeof window === 'undefined') return []; try { ensureLegacyMigration(); const raw = window.localStorage.getItem(PROFILES_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function legacyStatuses(answer: CardAnswerV2): StatusLabel[] { return getAnswerStatuses(answer); }
function withLegacyView(value: ProfileV2): Profile { const profile = value as Profile; Object.defineProperties(profile, { name: { value: value.title, enumerable: false }, fromName: { value: value.direction.author.displayName, enumerable: false }, toName: { value: value.direction.subject.displayName, enumerable: false }, relationLabel: { value: value.relationLabels.join('、'), enumerable: false }, isImported: { value: value.provenance.kind === 'imported', enumerable: false }, importedFrom: { value: value.provenance.kind === 'imported' ? value.provenance.sourceProfileId : undefined, enumerable: false }, progress: { value: Object.values(value.answers).map(category => ({ categoryId: category.categoryId, answers: Object.values(category.answers).map(answer => ({ cardId: answer.cardId, statuses: legacyStatuses(answer), note: answer.note })) })), enumerable: false } }); return profile; }
function migrateStored(value: unknown): ProfileV2 | null { try { if (value && typeof value === 'object' && (value as { schemaVersion?: number }).schemaVersion === 2) return validateProfile(value); if (value && typeof value === 'object') return validateProfile(migrateV1Profile(value as never)); } catch { /* retain raw data for recovery */ } return null; }
export const getProfiles = (): Profile[] => readRaw().map(migrateStored).filter((profile): profile is ProfileV2 => Boolean(profile)).map(withLegacyView);
export const saveProfiles = (profiles: Profile[]): void => { if (typeof window === 'undefined') return; ensureLegacyMigration(); const previous = window.localStorage.getItem(PROFILES_KEY); if (previous) window.localStorage.setItem(BACKUP_KEY, previous); window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); };
export const restoreBackup = (): Profile[] => { if (typeof window === 'undefined') return []; try { const raw = window.localStorage.getItem(BACKUP_KEY); return raw ? JSON.parse(raw).map(migrateStored).filter(Boolean) : []; } catch { return []; } };
export const addProfile = (profile: Profile): void => saveProfiles([...getProfiles(), profile]);
export const updateProfile = (profile: Profile): void => { if (!profile.permissions.editable) return; const profiles = getProfiles(); const index = profiles.findIndex(item => item.id === profile.id); if (index < 0) return; profiles[index] = { ...profile, updatedAt: new Date().toISOString() }; saveProfiles(profiles); };
export const deleteProfile = (id: string): void => saveProfiles(getProfiles().filter(profile => profile.id !== id));
export const getProfile = (id: string): Profile | undefined => getProfiles().find(profile => profile.id === id);
export const createProfile = (title: string, fromName: string, toName: string, relationLabel: string): Profile => withLegacyView(createDomainProfile(title, fromName, toName, relationLabel ? [relationLabel] : []));
export function getCategoryProgress(profile: Profile, categoryId: string) { return profile.answers[categoryId]; }
export function getAnswer(profile: Profile, categoryId: string, cardId: string): CardAnswerV2 | undefined { return profile.answers[categoryId]?.answers[cardId]; }
export function countEffectiveAnswers(profile: ProfileV2, categoryId?: string): number { const categories = categoryId ? [profile.answers[categoryId]] : Object.values(profile.answers); return categories.filter(Boolean).reduce((sum, category) => sum + Object.values(category.answers).filter(isAnswerEffective).length, 0); }
export const updateCardAnswer = (profileId: string, categoryId: string, answer: CardAnswerV2): void => { const profile = getProfile(profileId); if (!profile || !profile.permissions.editable) return; const category = profile.answers[categoryId] || { categoryId, answers: {}, viewedCardIds: [] }; const normalized = normalizeAnswer(answer); if (normalized) category.answers[answer.cardId] = normalized; else delete category.answers[answer.cardId]; if (Object.keys(category.answers).length || category.viewedCardIds?.length) profile.answers[categoryId] = category; else delete profile.answers[categoryId]; updateProfile(profile); };
export function markCardViewed(profileId: string, categoryId: string, cardId: string): void { const profile = getProfile(profileId); if (!profile || !profile.permissions.editable) return; const category = profile.answers[categoryId] || { categoryId, answers: {}, viewedCardIds: [] }; category.viewedCardIds = [...new Set([...(category.viewedCardIds || []), cardId])]; profile.answers[categoryId] = category; updateProfile(profile); }
export function createEditableCopy(source: Profile): Profile { return { ...source, id: makeId(), title: `${source.title}（副本）`, provenance: { kind: 'fork', sourceProfileId: source.id, forkedAt: new Date().toISOString() }, permissions: { editable: true }, answers: JSON.parse(JSON.stringify(source.answers)), updatedAt: new Date().toISOString() }; }
export const exportProfileToText = (profile: ProfileV2, includesNotes = true, locale: AppLocale = DEFAULT_LOCALE): string => {
  const envelope = createEnvelope(profile, includesNotes);
  const t = (text: string) => localizeText(text, locale);
  return [
    t('关系安那其拼盘 - 关系档案'),
    '',
    `${t('档案')}：${profile.title}`,
    `${t('填写视角')}：${describePerspectiveForLocale(profile.direction.author.displayName, profile.direction.subject.displayName, locale)}`,
    `${t('回答数')}：${countEffectiveAnswers(profile)} · ${t('包含备注')}：${includesNotes ? t('是') : t('否')}`,
    t('隐私提示：Base64 只是编码，不是加密；内容仅在本地处理。'),
    '',
    '---RAS_DATA_START---',
    encodeEnvelope(envelope),
    '---RAS_DATA_END---',
    '',
  ].join('\n');
};
export const parseImportText = (text: string): ExportEnvelopeV2 => decodeEnvelope(text);
export const importLegacyExpoProfile = (text: string, authorName: string, subjectName: string): Profile | null => { const legacy = parseLegacyExpoExport(text); return legacy ? withLegacyView(migrateLegacyExpoImport(legacy, authorName, subjectName)) : null; };
export const importProfileFromText = (text: string): Profile | null => { try { const envelope = decodeEnvelope(text); const profile = JSON.parse(JSON.stringify(envelope.profile)) as ProfileV2; profile.id = makeId(); profile.permissions = { editable: false }; profile.provenance = { kind: 'imported', sourceProfileId: envelope.profile.id, sourceExportId: envelope.exportId, importedAt: new Date().toISOString() }; profile.contentVersion = CONTENT_VERSION; return withLegacyView(profile); } catch { const legacy = parseLegacyV1Export(text); return legacy ? withLegacyView(migrateLegacyV1Import(legacy, text)) : null; } };
export const generateShareCode = (profile: ProfileV2, locale: AppLocale = DEFAULT_LOCALE): string => exportProfileToText(profile, true, locale);
export const importFromClipboard = async (): Promise<Profile | null> => { try { return importProfileFromText(await navigator.clipboard.readText()); } catch { return null; } };
export function hasDuplicateExport(text: string, profiles: Profile[]): boolean {
  let sourceProfileId: string | undefined;
  let sourceExportId: string | undefined;
  try {
    const envelope = decodeEnvelope(text);
    sourceProfileId = envelope.profile.id;
    sourceExportId = envelope.exportId;
  } catch {
    const legacyV1 = parseLegacyV1Export(text);
    if (legacyV1) {
      sourceProfileId = legacyV1.profile.id || `legacy-v1-${digestString(JSON.stringify(legacyV1.profile))}`;
      sourceExportId = digestString(text);
    } else {
      const legacyExpo = parseLegacyExpoExport(text);
      if (legacyExpo) {
        sourceProfileId = legacyExpo.sourceProfileId;
        sourceExportId = legacyExpo.sourceExportId;
      }
    }
  }
  if (!sourceProfileId || !sourceExportId) return false;
  return profiles.some(profile => profile.provenance.kind === 'imported' && profile.provenance.sourceProfileId === sourceProfileId && profile.provenance.sourceExportId === sourceExportId);
}
