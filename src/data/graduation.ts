/**
 * 各學生「已取得」的畢業學分（示範資料，以學號為 key）。
 * 「本學期修習中」不寫在這裡，由目前課表即時計算，見 src/lib/audit.ts。
 */
export type AuditCategoryKey = 'common' | 'required' | 'elective' | 'general';

export interface GraduationRecord {
  /** 各類別已取得學分 */
  earned: Record<AuditCategoryKey, number>;
  /** 通識尚缺的領域 */
  generalMissing: { area: string; credits: number }[];
  /** 已修課程涵蓋的 SDGs 項數 */
  sdgCount: number;
}

/** 畢業門檻（示範值，請依各系修業規定調整），合計 128 學分 */
export const GRADUATION_REQUIREMENT: Record<AuditCategoryKey, number> = {
  common: 18,
  required: 72,
  elective: 26,
  general: 12,
};
export const SDG_REQUIREMENT = 4;

export const GRADUATION_RECORDS: Record<string, GraduationRecord> = {
  // 資管系 張哲宇（三年級）
  '11124026': {
    earned: { common: 18, required: 42, elective: 10, general: 6 },
    generalMissing: [
      { area: '社會科學', credits: 2 },
      { area: '美育探索', credits: 4 },
    ],
    sdgCount: 8,
  },
  // 護理系 林思妤（四年級）
  '11112045': {
    earned: { common: 18, required: 60, elective: 16, general: 10 },
    generalMissing: [{ area: '自然科學', credits: 2 }],
    sdgCount: 9,
  },
  // 生死系 王若庭（二年級）
  '11135012': {
    earned: { common: 14, required: 20, elective: 4, general: 4 },
    generalMissing: [
      { area: '社會科學', credits: 4 },
      { area: '自然科學', credits: 2 },
      { area: '美育探索', credits: 2 },
    ],
    sdgCount: 3,
  },
  // 健管系 郭政儒（三年級）
  '11141088': {
    earned: { common: 18, required: 40, elective: 8, general: 8 },
    generalMissing: [{ area: '美育探索', credits: 4 }],
    sdgCount: 5,
  },
};

/** 沒有示範資料的學生（新註冊帳號、訪客）從 0 開始 */
export const EMPTY_GRADUATION_RECORD: GraduationRecord = {
  earned: { common: 0, required: 0, elective: 0, general: 0 },
  generalMissing: [],
  sdgCount: 0,
};
