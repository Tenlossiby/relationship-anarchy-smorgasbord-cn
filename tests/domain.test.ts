import { describe, expect, it } from 'vitest';
import { classifyComparison, createEnvelope, createProfile, decodeEnvelope, describePerspective, encodeEnvelope, getAnswerStatuses, isAnswerEffective, migrateLegacyStatuses, migrateV1Profile, SUGGESTED_STATUS_VALUES } from '@/lib/domain';
import { STATUS_LABELS } from '@/types';
import { CATEGORIES } from '@/data/categories';
import { directionAB, directionBA, legacyExpoText, legacyV1Text, v1Contradictory } from './fixtures';
import { exportProfileToText, getProfiles, hasDuplicateExport, importLegacyExpoProfile, importProfileFromText } from '@/lib/storageV2';
import { migrateLegacyExpoImport, parseLegacyExpoExport, parseLegacyV1Export } from '@/lib/legacyMigration';
import { LEGACY_BACKUP_KEY, LEGACY_PROFILES_KEY, MIGRATION_MARKER_KEY, PROFILES_KEY, RECOVERY_KEY } from '@/lib/storageV2';

describe('V2 direction invariant', () => {
  it('keeps author → subject through export and import decoding', () => {
    const original = createProfile('双向样本', 'A', 'B', ['朋友']);
    const envelope = createEnvelope(original);
    const restored = decodeEnvelope(`---RAS_DATA_START---\n${encodeEnvelope(envelope)}\n---RAS_DATA_END---`);
    expect(restored.profile.direction.author.displayName).toBe('A');
    expect(restored.profile.direction.subject.displayName).toBe('B');
  });

  it('imports as a read-only snapshot and detects the same export twice', () => {
    const original = createProfile('匿名样本', 'A', 'B');
    const text = exportProfileToText(original);
    const imported = importProfileFromText(text);
    expect(imported?.permissions.editable).toBe(false);
    expect(imported?.direction.author.displayName).toBe('A');
    expect(imported && hasDuplicateExport(text, [imported])).toBe(true);
  });

  it('migrates V1 fromName → toName without swapping', () => {
    const migrated = migrateV1Profile(directionAB);
    expect(migrated.direction.author.displayName).toBe('A');
    expect(migrated.direction.subject.displayName).toBe('B');
  });

  it('describes the perspective without pretending the imported author is me', () => {
    expect(describePerspective('朋友', '我')).toBe('朋友填写了自己与我的这段关系');
    expect(describePerspective('我', '朋友')).toBe('我填写了自己与朋友的这段关系');
  });
});

describe('answer semantics', () => {
  it('counts note-only answers and rejects whitespace-only answers', () => {
    expect(isAnswerEffective({ note: '只写备注' })).toBe(true);
    expect(isAnswerEffective({ note: '   ' })).toBe(false);
    expect(isAnswerEffective({})).toBe(false);
  });

  it('preserves every original V1 status without forcing them into one stance', () => {
    const migratedProfile = migrateV1Profile(v1Contradictory);
    const migrated = migratedProfile.answers.caregiving.answers['caregiving-health'];
    expect(migrated?.statuses).toEqual(['agree', 'hard_limit']);
    expect(migrated?.legacy?.rawStatuses).toEqual(['agree', 'hard_limit']);
    expect(migrated?.legacy?.needsReview).toBe(false);
  });

  it('maps real old Expo data, keeps unmatched items, and creates a read-only import', () => {
    const parsed = parseLegacyExpoExport(legacyExpoText);
    expect(parsed?.items).toHaveLength(3);
    const migrated = parsed && migrateLegacyExpoImport(parsed, 'A', 'B');
    if (!migrated) throw new Error('旧 Expo fixture 未能迁移');
    expect(migrated?.direction.author.displayName).toBe('A');
    expect(migrated?.direction.subject.displayName).toBe('B');
    expect(migrated?.permissions.editable).toBe(false);
    expect(migrated?.provenance.kind).toBe('imported');
    expect(migrated?.answers.caregiving.answers['caregiving-health']?.statuses).toEqual(['agree', 'necessary', 'future_possible', 'need_discussion']);
    expect(migrated?.answers.caregiving.answers['caregiving-health']?.note).toBe('需要提前说清楚');
    expect(migrated?.answers.caregiving.answers['caregiving-sponsorship']?.statuses).toEqual(['absolutely_not', 'hard_limit']);
    expect(migrated?.answers.caregiving.answers['caregiving-sponsorship']?.legacy?.needsReview).toBe(false);
    expect(migrated?.legacy?.unmappedItems).toHaveLength(1);
    const imported = importLegacyExpoProfile(legacyExpoText, 'A', 'B');
    expect(imported && hasDuplicateExport(legacyExpoText, [imported])).toBe(true);
  });

  it('decodes the actual V1 percent-encoded TXT format and preserves note/status semantics', () => {
    const parsed = parseLegacyV1Export(legacyV1Text);
    expect(parsed?.profile.fromName).toBe('A');
    expect(parsed?.profile.toName).toBe('B');
    const migrated = parsed && migrateV1Profile(parsed.profile);
    if (!migrated) throw new Error('V1 fixture 未能迁移');
    expect(migrated.direction.author.displayName).toBe('A');
    expect(migrated.direction.subject.displayName).toBe('B');
    expect(migrated.answers.caregiving.answers['caregiving-health']?.participation).toBe('self');
    expect(migrated.answers.caregiving.answers['caregiving-health']?.note).toBe('旧格式备注');
  });

  it('imports V1 TXT as a read-only snapshot through the storage entry point', () => {
    const imported = importProfileFromText(legacyV1Text);
    expect(imported?.permissions.editable).toBe(false);
    expect(imported?.provenance.kind).toBe('imported');
    expect(imported?.direction.author.displayName).toBe('A');
    expect(imported?.answers.caregiving.answers['caregiving-health']?.note).toBe('旧格式备注');
  });

  it('keeps two anonymous same-name participants distinct by profile selection', () => {
    const first = migrateV1Profile({ ...directionAB, fromName: '同名', toName: '同名' });
    const second = migrateV1Profile({ ...directionBA, fromName: '同名', toName: '同名' });
    expect(first.id).not.toBe(second.id);
    expect(first.direction.author.id).not.toBe(second.direction.author.id);
  });

  it('preserves raw contradictory statuses', () => {
    const migrated = migrateLegacyStatuses(['agree', 'hard_limit']);
    expect(migrated.statuses).toEqual(['agree', 'hard_limit']);
    expect(migrated.legacy?.rawStatuses).toEqual(['agree', 'hard_limit']);
    expect(migrated.legacy?.needsReview).toBe(false);
  });

  it('keeps legacy participation separate from the original seven markers', () => {
    const migrated = migrateLegacyStatuses(['will_do']);
    expect(migrated.statuses).toEqual([]);
    expect(migrated.participation).toBe('self');
    expect(migrated.legacy?.needsReview).toBe(false);
  });

  it('restores the original translated labels and keeps them multi-select', () => {
    expect(SUGGESTED_STATUS_VALUES.map(status => STATUS_LABELS[status].zh)).toEqual([
      '同意', '必要', '也许', '未来可能', '需要讨论', '绝对不行', '硬性界限',
    ]);
    expect(getAnswerStatuses({ statuses: ['agree', 'necessary', 'maybe'] })).toEqual(['agree', 'necessary', 'maybe']);
    expect(getAnswerStatuses({ stance: 'want', markers: ['important', 'future_possible'] })).toEqual(['agree', 'necessary', 'future_possible']);
  });
});

describe('comparison description', () => {
  it('does not turn hard limits into a relationship verdict', () => {
    expect(classifyComparison([{ statuses: ['agree'] }, { statuses: ['hard_limit'] }])).toBe('值得聊聊');
    expect(classifyComparison([{ note: '语境' }, undefined])).toBe('有人未回答');
    expect(classifyComparison([{ statuses: ['agree'] }, { statuses: ['agree'] }])).toBe('相近');
    expect(classifyComparison([{ note: '我的语境' }, { note: '对方的语境' }])).toBe('都有备注');
    expect(classifyComparison([{ statuses: ['agree'], participation: 'self' }, { statuses: ['agree'], participation: 'other' }])).toBe('有所不同');
    expect(classifyComparison([{ note: '我的语境' }, { statuses: ['agree'] }])).not.toBe('相近');
    expect(classifyComparison([{ note: '我的语境', statuses: ['agree'] }, { note: '对方语境', statuses: ['hard_limit'] }])).toBe('值得聊聊');
  });
});

describe('card content integrity', () => {
  it('keeps all 179 card IDs and complete natural prompts', () => {
    const cards = CATEGORIES.flatMap(category => category.cards);
    expect(cards).toHaveLength(179);
    expect(new Set(cards.map(card => card.id)).size).toBe(179);
    for (const card of cards) {
      expect(card.prompt).toMatch(/[？?]$/);
      expect(card.prompt).not.toMatch(/[.…]+$/);
      expect(card.reflectionPrompts?.length || 0).toBeLessThanOrEqual(3);
    }
    for (const id of ['power-sadomasochism', 'power-bondage', 'tech-passwords', 'sexual-frequency', 'sexual-genitals', 'romantic-uniqueness']) {
      const card = cards.find(item => item.id === id);
      expect(card?.reflectionPrompts?.length, id).toBeGreaterThan(0);
      expect(card?.sensitivity?.length, id).toBeGreaterThan(0);
    }
    const sensitiveCards = cards.filter(card => card.sensitivity?.length);
    expect(sensitiveCards.length).toBeGreaterThanOrEqual(35);
    expect(sensitiveCards.filter(card => card.reflectionPrompts?.length).length / sensitiveCards.length).toBeGreaterThanOrEqual(0.9);
  });

  it('prefers raw UTF-8 JSON before legacy percent decoding', () => {
    const original = createProfile('百分号样本', 'A', 'B');
    original.answers.caregiving = { categoryId: 'caregiving', answers: { 'caregiving-health': { cardId: 'caregiving-health', note: '保留 %20 与 %2F，不要被误解码', updatedAt: new Date().toISOString() } } };
    const envelope = createEnvelope(original);
    const restored = decodeEnvelope(`---RAS_DATA_START---\n${encodeEnvelope(envelope)}\n---RAS_DATA_END---`);
    expect(restored.profile.answers.caregiving.answers['caregiving-health'].note).toBe('保留 %20 与 %2F，不要被误解码');
  });
});

describe('browser localStorage migration', () => {
  class MemoryStorage implements Storage {
    private values = new Map<string, string>();
    get length() { return this.values.size; }
    clear() { this.values.clear(); }
    getItem(key: string) { return this.values.get(key) ?? null; }
    key(index: number) { return [...this.values.keys()][index] ?? null; }
    removeItem(key: string) { this.values.delete(key); }
    setItem(key: string, value: string) { this.values.set(key, value); }
  }

  it('backs up and migrates ra_profiles on first browser read', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_PROFILES_KEY, JSON.stringify([{ ...directionAB, progress: [{ categoryId: 'caregiving', answers: [{ cardId: 'caregiving-health', statuses: ['will_do'], note: '本地旧备注' }] }] }]));
    Object.assign(globalThis, { window: { localStorage: storage } });
    const profiles = getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].direction.author.displayName).toBe('A');
    expect(profiles[0].answers.caregiving.answers['caregiving-health']?.participation).toBe('self');
    expect(profiles[0].answers.caregiving.answers['caregiving-health']?.note).toBe('本地旧备注');
    expect(storage.getItem(LEGACY_BACKUP_KEY)).toContain('本地旧备注');
    expect(storage.getItem(PROFILES_KEY)).toContain('caregiving-health');
    expect(JSON.parse(storage.getItem(MIGRATION_MARKER_KEY) || '{}').status).toBe('completed');
    delete (globalThis as { window?: unknown }).window;
  });

  it('keeps malformed legacy data recoverable instead of erasing it', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_PROFILES_KEY, '{not-json');
    Object.assign(globalThis, { window: { localStorage: storage } });
    expect(getProfiles()).toEqual([]);
    expect(storage.getItem(LEGACY_BACKUP_KEY)).toBe('{not-json');
    expect(storage.getItem(RECOVERY_KEY)).toContain('{not-json');
    expect(JSON.parse(storage.getItem(MIGRATION_MARKER_KEY) || '{}').status).toBe('failed');
    delete (globalThis as { window?: unknown }).window;
  });

  it('merges legacy data without overwriting existing V2 profiles and reports partial failures', () => {
    const storage = new MemoryStorage();
    const existing = createProfile('已有档案', 'A', 'B');
    existing.id = 'same-profile';
    existing.answers.caregiving = { categoryId: 'caregiving', answers: { 'caregiving-health': { cardId: 'caregiving-health', note: '新的档案内容', updatedAt: new Date().toISOString() } } };
    storage.setItem(PROFILES_KEY, JSON.stringify([existing]));
    storage.setItem(LEGACY_PROFILES_KEY, JSON.stringify([
      { id: 'same-profile', fromName: 'A', toName: 'B', progress: [{ categoryId: 'caregiving', answers: [{ cardId: 'caregiving-health', statuses: ['agree'], note: '旧数据不应覆盖' }] }] },
      { id: 'new-profile', fromName: 'C', toName: 'D', progress: [] },
      { id: 'broken-profile', progress: [{ categoryId: 'caregiving', answers: [{ cardId: 'missing', statuses: ['yes'] }] }] },
    ]));
    Object.assign(globalThis, { window: { localStorage: storage } });
    const profiles = getProfiles();
    expect(profiles.map(profile => profile.id)).toEqual(['same-profile', 'new-profile']);
    expect(profiles[0].answers.caregiving.answers['caregiving-health']?.note).toBe('新的档案内容');
    expect(JSON.parse(storage.getItem(MIGRATION_MARKER_KEY) || '{}').status).toBe('partial');
    expect(JSON.parse(storage.getItem(RECOVERY_KEY) || '{}').failures).toHaveLength(1);
    delete (globalThis as { window?: unknown }).window;
  });
});
