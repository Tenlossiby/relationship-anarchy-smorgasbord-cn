import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '@/data/categories';
import {
  BRAND_NAME,
  BRAND_NAME_TW,
  describePerspectiveForLocale,
  localizeCategory,
  localizeRelationLabel,
  toTaiwanText,
} from '@/lib/i18n';

describe('Taiwan Traditional Chinese display', () => {
  it('uses the requested full product name', () => {
    expect(BRAND_NAME).toBe('关系安那其主义自助拼盘');
    expect(BRAND_NAME_TW).toBe('關係安那其主義自助拼盤');
  });

  it('uses common Taiwan interface terms', () => {
    expect(toTaiwanText('导入档案，打开设置，填写备注和账号信息。'))
      .toBe('匯入檔案，開啟設定，填寫備註和帳號資訊。');
    expect(toTaiwanText('所有数据均存储在您的浏览器本地；本地保存不等于设备加密。'))
      .toBe('所有資料都儲存在這台裝置的瀏覽器中；存放在瀏覽器中，不代表裝置本身有加密。');
  });

  it('localizes category content without changing stable identifiers', () => {
    const source = CATEGORIES[0];
    const localized = localizeCategory(source, 'zh-TW');
    expect(localized.id).toBe(source.id);
    expect(localized.cards.map(card => card.id)).toEqual(source.cards.map(card => card.id));
    expect(localized.zh).not.toBe(source.zh);

    const emotionalSupport = localizeCategory(CATEGORIES.find(category => category.id === 'emotional-support')!, 'zh-TW');
    expect(emotionalSupport.zh).toBe('情感支持');

    const labels = localizeCategory(CATEGORIES.find(category => category.id === 'labels-terms')!, 'zh-TW');
    expect(labels.cards.find(card => card.id === 'labels-datemate')?.zh).toBe('約會對象');
  });

  it('never converts names supplied by the user', () => {
    expect(describePerspectiveForLocale('小明', '小红', 'zh-TW'))
      .toBe('小明填寫了自己與小红的這段關係');
  });

  it('converts built-in relationship labels but preserves custom labels', () => {
    expect(localizeRelationLabel('伴侣', 'zh-TW')).toBe('伴侶');
    expect(localizeRelationLabel('约会对象', 'zh-TW')).toBe('約會對象');
    expect(localizeRelationLabel('我的专属称呼', 'zh-TW')).toBe('我的专属称呼');
  });

  it('keeps the original seven marking choices intact', () => {
    expect(toTaiwanText('同意、必要、也许、未来可能、需要讨论、绝对不行、硬性界限'))
      .toBe('同意、必要、也許、未來可能、需要討論、絕對不行、硬性界限');
  });
});
