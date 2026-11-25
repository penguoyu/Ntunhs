import { Course } from '../types';

/**
 * 學校開課資料沒有 SDGs 欄位，這裡依課名與課程摘要的關鍵字自動對應（模擬），
 * 畫面上會標示「自動對應」。正式版應改用課程大綱系統填報的 SDGs。
 */
const RULES: { id: number; words: RegExp }[] = [
  { id: 3, words: /護理|健康|醫|照護|藥|病|臨床|營養|運動|保健|心理|諮商|長照|高齡|生理|解剖|助產|復健|急救|衛生|福祉/ },
  { id: 4, words: /教育|教學|幼兒|嬰幼兒|教保|托育|學習|教材|課程設計|師資/ },
  { id: 5, words: /性別|婦女|女性|母嬰|母性|助產|家庭/ },
  { id: 8, words: /管理|職場|產業|經濟|會計|創業|就業|行銷|財務|人力資源|實務|休閒/ },
  { id: 9, words: /資訊|程式|資料|數位|人工智慧|科技|創新|網路|系統|電腦|大數據|物聯網/ },
  { id: 10, words: /身心障礙|弱勢|多元文化|原住民|語言治療|聽語|聽覺|適應體育|社會福利|社工/ },
  { id: 11, words: /社區|城市|都市|城鄉/ },
  { id: 12, words: /消費|食品|餐飲|資源回收/ },
  { id: 13, words: /環境|氣候|永續|生態|節能/ },
  { id: 16, words: /法律|法規|倫理|政策|人權|生死|正義/ },
  { id: 17, words: /國際|跨領域|全球|合作/ },
];

export const inferSdgs = (c: Pick<Course, 'name' | 'description' | 'college'>): number[] => {
  // 以課名為主；課名對不到時才看摘要開頭
  let ids = RULES.filter(r => r.words.test(c.name)).map(r => r.id);
  if (!ids.length) ids = RULES.filter(r => r.words.test((c.description ?? '').slice(0, 60))).map(r => r.id);
  if (!ids.length) ids = [c.college === '護理學院' ? 3 : 4];
  return ids.slice(0, 3).sort((a, b) => a - b);
};
