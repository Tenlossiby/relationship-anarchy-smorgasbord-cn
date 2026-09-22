import OpenCC from 'opencc-js/cn2t';
import type { Category } from '@/types';

export type AppLocale = 'zh-CN' | 'zh-TW';

export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
export const LOCALE_STORAGE_KEY = 'ra_display_locale';
export const BRAND_NAME = '关系安那其主义自助拼盘';
export const BRAND_NAME_TW = '關係安那其主義自助拼盤';

const toTaiwan = OpenCC.Converter({ from: 'cn', to: 'twp' });

// OpenCC handles characters and common regional phrases. These overrides keep
// product language consistent with everyday Taiwan usage.
const taiwanPhraseOverrides: Array<[string, string]> = [
  ['所有数据均存储在您的浏览器本地；本地保存不等于设备加密。', '所有資料都儲存在這台裝置的瀏覽器中；存放在瀏覽器中，不代表裝置本身有加密。'],
  ['该应用及开发者不会收集或上传个人回答；清除浏览器数据可能删除本地档案，请先备份。', '該應用程式與開發者不會收集或上傳個人回答；清除瀏覽器資料可能會刪除本機檔案，請先備份。'],
  ['别人分享来的档案会按对方填写时的视角呈现；想接着填写，可以创建一份自己的档案', '別人分享給你的檔案，會保留對方填寫時的視角；想繼續填寫，可以建立一份自己的檔案'],
  ['支持 .txt 格式', '支援 .txt 格式'],
  ['支持网络', '支持系統'],
  ['怎样避免帮助变成控制、亏欠或默认义务？', '怎麼避免讓幫忙變成控制、虧欠，或理所當然的義務？'],
  ['而不是过去的默认？', '而不是照著過去的默契？'],
  ['请求帮忙和默认对方负责之间的界线在哪里？', '請人幫忙，和認定對方本來就該負責，兩者的界線在哪裡？'],
  ['哪些劳动不能被默认转给某个人？', '哪些勞動不能在沒有討論的情況下落到某個人身上？'],
  ['哪些情况需要明确同意，哪些情况绝不能被默认？', '哪些情況需要明確同意，哪些事情絕不能想當然耳？'],
  ['称谓是否会让别人默认某些权力和义务？', '稱謂會不會讓別人直接認定某些權力和義務？'],
  ['怎样避免默认规则？', '怎麼避免形成不成文的規則？'],
  ['默认权力', '不言明的權力'],
  ['如何被说出来？', '要怎麼把它們說清楚？'],
  ['关系安那其主义自助拼盘', '關係安那其主義自助拼盤'],
  ['关系安那其自助拼盘', '關係安那其主義自助拼盤'],
  ['关系安那其拼盘', '關係安那其主義自助拼盤'],
  ['RA拼盘', '關係安那其主義自助拼盤'],
  ['剪贴板', '剪貼簿'],
  ['本地存储', '本機儲存空間'],
  ['本地处理', '在本機處理'],
  ['本地档案', '本機檔案'],
  ['档案', '檔案'],
  ['导入', '匯入'],
  ['导出', '匯出'],
  ['设置', '設定'],
  ['备注', '備註'],
  ['账号', '帳號'],
  ['信息', '資訊'],
  ['数据', '資料'],
  ['文件', '檔案'],
  ['默认', '預設'],
  ['保存', '儲存'],
  ['加载', '載入'],
  ['创建', '建立'],
  ['复制', '複製'],
  ['粘贴', '貼上'],
  ['链接', '連結'],
  ['用户', '使用者'],
  ['组件', '元件'],
  ['软件', '軟體'],
  ['硬件', '硬體'],
  ['网络', '網路'],
  ['视频', '影片'],
  ['打印', '列印'],
  ['兼容', '相容'],
  ['反馈', '回饋'],
  ['质量', '品質'],
  ['通过', '透過'],
  ['约会对象', '約會對象'],
  ['合作伙伴', '合作夥伴'],
];
const postTaiwanPhraseOverrides: Array<[string, string]> = [
  ['菜品', '菜色'],
  ['隻選', '只選'],
  ['本地', '本機'],
  ['丟失', '遺失'],
  ['匹配', '配對'],
  ['約會物件', '約會對象'],
  ['合作伙伴', '合作夥伴'],
  ['這臺裝置', '這台裝置'],
  ['支援', '支持'],
  ['支持 .txt 格式', '支援 .txt 格式'],
];
const builtInRelationLabels = new Set(['伴侣', '恋人', '挚友', '朋友', 'QPR (酷儿柏拉图式关系)', '家人', '约会对象', '室友', '合作伙伴', '其ta', '其他']);

export function toTaiwanText(text: string): string {
  let localized = text;
  for (const [source, target] of taiwanPhraseOverrides) localized = localized.replaceAll(source, target);
  localized = toTaiwan(localized);
  for (const [source, target] of postTaiwanPhraseOverrides) localized = localized.replaceAll(source, target);
  return localized;
}

export function localizeText(text: string, locale: AppLocale): string {
  return locale === 'zh-TW' ? toTaiwanText(text) : text;
}

export function localizeCategory(category: Category, locale: AppLocale): Category {
  if (locale === 'zh-CN') return category;
  return {
    ...category,
    zh: toTaiwanText(category.zh),
    description: category.description ? toTaiwanText(category.description) : undefined,
    cards: category.cards.map(card => ({
      ...card,
      zh: toTaiwanText(card.zh),
      prompt: toTaiwanText(card.prompt),
      contextQuestion: card.contextQuestion ? toTaiwanText(card.contextQuestion) : undefined,
      reflectionPrompts: card.reflectionPrompts?.map(toTaiwanText),
    })),
  };
}

export function describePerspectiveForLocale(authorName: string, subjectName: string, locale: AppLocale): string {
  if (locale === 'zh-TW') return `${authorName || '未填寫'}填寫了自己與${subjectName || '未填寫'}的這段關係`;
  return `${authorName || '未填写'}填写了自己与${subjectName || '未填写'}的这段关系`;
}

export function localizeRelationLabel(label: string, locale: AppLocale): string {
  return builtInRelationLabels.has(label) ? localizeText(label, locale) : label;
}

export function parseLocale(value: string | null | undefined): AppLocale {
  return value === 'zh-TW' ? 'zh-TW' : DEFAULT_LOCALE;
}
