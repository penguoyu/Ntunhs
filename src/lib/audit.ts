import { Course, StudentProfile } from '../types';
import {
  AuditCategoryKey,
  EMPTY_GRADUATION_RECORD,
  GRADUATION_RECORDS,
  GRADUATION_REQUIREMENT,
  SDG_REQUIREMENT,
} from '../data/graduation';

/** 課程類別對應到畢業學分類別 */
export const auditCategoryOf = (c: Course): AuditCategoryKey =>
  c.category === '博雅通識' || c.college === '通識中心'
    ? 'general'
    : c.category.includes('必修')
      ? 'required'
      : 'elective';

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
    generalMissing: record.generalMissing,
    sdgCount: record.sdgCount,
    sdgRequired: SDG_REQUIREMENT,
  };
};
