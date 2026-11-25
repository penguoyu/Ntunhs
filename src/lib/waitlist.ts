import { Course, StudentProfile } from '../types';
import { CREDIT_LIMIT, checkPrerequisite, findConflicts } from './schedule';

/**
 * FR-07 額滿候補與自動遞補（模擬）。
 * 真實系統由選課系統在有人退選時觸發；這裡用「模擬有人退選」按鈕代替，
 * 候補順位前面的人數也是示範值。
 */

const stableHash = (s: string): number => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

/** 剛加入候補時排在前面的人數（示範值 1～5，同一個人同一門課每次都一樣） */
export const initialAhead = (courseId: string, studentId: string): number =>
  1 + (stableHash(`${courseId}:${studentId}`) % 5);

export type BackfillBlock = { reason: 'conflict'; with: Course[] } | { reason: 'credits'; total: number } | { reason: 'prereq'; missing: string[][] };

/** 輪到自己遞補時，檢查是否能放進課表；不能放就回傳原因 */
export const backfillBlock = (
  course: Course,
  schedule: Course[],
  student: Pick<StudentProfile, 'passedCourses'>
): BackfillBlock | null => {
  const prereq = checkPrerequisite(course, student);
  if (!prereq.met) return { reason: 'prereq', missing: prereq.missing };
  const clashes = findConflicts(course, schedule);
  if (clashes.length) return { reason: 'conflict', with: clashes };
  const total = schedule.reduce((s, c) => s + c.credits, 0) + course.credits;
  if (total > CREDIT_LIMIT) return { reason: 'credits', total };
  return null;
};

export const blockText = (b: BackfillBlock): string =>
  b.reason === 'conflict'
    ? `與《${b.with.map(c => c.name).join('、')}》衝堂`
    : b.reason === 'credits'
      ? `遞補後總學分 ${b.total} 超過上限 ${CREDIT_LIMIT}`
      : `未符合先修：${b.missing.map(g => g.join(' 或 ')).join('，')}`;
