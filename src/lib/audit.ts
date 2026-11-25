import { Course, StudentProfile } from '../types';
import {
  AuditCategoryKey,
  EMPTY_GRADUATION_RECORD,
  GRADUATION_RECORDS,
  GRADUATION_REQUIREMENT,
  SDG_REQUIREMENT,
} from '../data/graduation';

/** 校訂共同必修：國文、英文、體育、資訊素養、全民國防等（學校資料的「通識必修」） */
const COMMON_REQUIRED = /國文|英文|英語|體育|羽球|資訊素養|國防/;

/** 課程類別對應到畢業學分類別 */
export const auditCategoryOf = (c: Course): AuditCategoryKey =>
  c.category === '博雅通識' || c.college === '通識中心'
    ? COMMON_REQUIRED.test(c.name)
      ? 'common'
      : 'general'
    : c.category.includes('必修')
      ? 'required'
      : 'elective';

/** 博雅通識課程屬於哪個通識領域（依課名判斷，示範規則） */
export const generalAreaOf = (name: string): string | null =>
  /藝術|舞蹈|美學|音樂|美育/.test(name)
    ? '美育探索'
    : /法規|法律|邏輯|休閒|經濟|社會|心理|政治/.test(name)
      ? '社會科學'
      : /環境|永續|科學|生態|物理|化學|生物/.test(name)
        ? '自然科學'
        : /哲學|文明|宗教|文學|歷史|日文|人生/.test(name)
          ? '人文學'
          : null;

export interface AuditCategory {
  key: AuditCategoryKey;
  earned: number;
  required: number;
  /** 本學期修習中（來自目前課表） */
  inProgress: number;
  inProgressCourses: Course[];
  /** 本學期通過後仍缺 */
  missing: number;
  percent: number;
}

/** 依學生已取得學分與「目前課表」計算畢業審查數字，讓各頁數字一致 */
export const buildAudit = (student: Pick<StudentProfile, 'studentId'>, scheduleCourses: Course[]) => {
  const record = GRADUATION_RECORDS[student.studentId] ?? EMPTY_GRADUATION_RECORD;
  const keys = Object.keys(GRADUATION_REQUIREMENT) as AuditCategoryKey[];
  const categories = Object.fromEntries(
    keys.map(key => {
      const earned = record.earned[key];
      const required = GRADUATION_REQUIREMENT[key];
      const inProgressCourses = scheduleCourses.filter(c => auditCategoryOf(c) === key);
      const inProgress = inProgressCourses.reduce((sum, c) => sum + c.credits, 0);
      const category: AuditCategory = {
        key,
        earned,
        required,
        inProgress,
        inProgressCourses,
        missing: Math.max(0, required - earned - inProgress),
        percent: Math.min(100, (earned / required) * 100),
      };
      return [key, category];
    })
  ) as Record<AuditCategoryKey, AuditCategory>;

  const total = keys.reduce((sum, k) => sum + GRADUATION_REQUIREMENT[k], 0);
  const earned = keys.reduce((sum, k) => sum + record.earned[k], 0);
  const inProgress = scheduleCourses.reduce((sum, c) => sum + c.credits, 0);
  return {
    categories,
    total,
    earned,
    inProgress,
    /** 本學期全數通過後仍缺的學分 */
    remaining: Math.max(0, total - earned - inProgress),
    // 通識缺額：扣掉本學期修習中、屬於該領域的通識課
    generalMissing: record.generalMissing
      .map(m => {
        const taking = categories.general.inProgressCourses.filter(c => generalAreaOf(c.name) === m.area);
        const inProgress = taking.reduce((sum, c) => sum + c.credits, 0);
        return { ...m, inProgress, remaining: Math.max(0, m.credits - inProgress), taking };
      }),
    // SDGs：已修課程的項目加上本學期課表新涵蓋的項目
    sdgEarned: record.sdgIds.length,
    sdgNew: [...new Set(scheduleCourses.flatMap(c => c.sdgs ?? []))].filter(id => !record.sdgIds.includes(id)),
    sdgCount: new Set([...record.sdgIds, ...scheduleCourses.flatMap(c => c.sdgs ?? [])]).size,
    sdgRequired: SDG_REQUIREMENT,
  };
};
