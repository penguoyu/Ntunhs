import { Course, StudentProfile } from '../types';

/** 北護節次時間（依課程資料中的 timeStr 對應） */
export const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:10', end: '09:00' },
  2: { start: '09:10', end: '10:00' },
  3: { start: '10:10', end: '11:00' },
  4: { start: '11:10', end: '12:00' },
  5: { start: '13:30', end: '14:20' },
  6: { start: '14:30', end: '15:20' },
  7: { start: '15:30', end: '16:20' },
  8: { start: '16:30', end: '17:20' },
  9: { start: '17:30', end: '18:20' },
  10: { start: '18:30', end: '19:20' },
};

export const DAY_LABELS = ['一', '二', '三', '四', '五'];

/** 每學期學分上限（示範值，請依北護學則調整） */
export const CREDIT_LIMIT = 25;

/** 兩門課是否時段重疊 */
export const coursesOverlap = (a: Course, b: Course): boolean =>
  a.id !== b.id &&
  a.day === b.day &&
  Array.isArray(a.periods) &&
  Array.isArray(b.periods) &&
  a.periods.some(p => b.periods.includes(p));

/** 找出 target 與 others 之中哪些課衝堂 */
export const findConflicts = (target: Course, others: Course[]): Course[] =>
  others.filter(o => coursesOverlap(target, o));

/** 一組課程內所有有衝堂的課程 id */
export const conflictingIds = (list: Course[]): Set<string> => {
  const ids = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (coursesOverlap(list[i], list[j])) {
        ids.add(list[i].id);
        ids.add(list[j].id);
      }
    }
  }
  return ids;
};

export const formatCourseTime = (c: Course): string => {
  if (!c.day || !c.periods?.length) return c.timeStr || '時間未定';
  const first = Math.min(...c.periods);
  const last = Math.max(...c.periods);
  return `週${DAY_LABELS[c.day - 1] ?? c.day} ${first === last ? first : `${first}-${last}`} 節`;
};

export const seatsLeft = (c: Course): number => Math.max(0, c.capacity - c.enrolled);

/** 由字串產生固定的整數，讓示範數值每次重新整理都一樣 */
const stableHash = (s: string): number => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

/** 本階段登記人數（課程資料沒有提供時，以餘額的 0.5～2.5 倍作為示範值） */
export const registeredCount = (c: Course): number =>
  c.registered ?? Math.round(Math.max(3, seatsLeft(c)) * (0.5 + (stableHash(c.id) % 200) / 100));

/** 本系學長姐修過人數（示範值） */
export const seniorsTaken = (c: Course): number => 5 + ((stableHash(c.id) >>> 3) % 60);

/** 依歷年平均分數描述給分 */
export const gradingStyle = (c: Course): string => {
  const avg = c.averageScore ?? 80;
  return avg >= 85 ? '給分偏甜' : avg >= 78 ? '給分正常' : '給分偏嚴';
};

/** 1～5 分轉成星號字串，例如 3.6 → ★★★★☆ */
export const starText = (rating: number): string => {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
};

export type Competition ='open' | 'tight' | 'hot' | 'full';

/** 登記人數相對於餘額的競爭程度 */
export const competitionLevel = (c: Course): Competition => {
  const left = seatsLeft(c);
  if (left === 0) return 'full';
  const ratio = registeredCount(c) / left;
  return ratio <= 1 ? 'open' : ratio <= 2 ? 'tight' : 'hot';
};

/** 第 1～3 志願在分發時的加權（示範規則） */
const RANK_WEIGHT = [1.5, 1.25, 1.1];

/** 依登記人數、餘額與志願序估算分發機率（0～1） */
export const admissionChance = (c: Course, rank: number): number => {
  const left = seatsLeft(c);
  if (left === 0) return 0;
  const registered = registeredCount(c);
  if (registered <= left) return 1;
  return Math.min(0.95, (left / registered) * (RANK_WEIGHT[rank - 1] ?? 1));
};

export type AllocationOutcome = 'accepted' | 'lost' | 'full' | 'conflict' | 'prereq' | 'credits';

export interface AllocationResult {
  course: Course;
  rank: number;
  outcome: AllocationOutcome;
  chance: number;
}

/**
 * 模擬電腦分發：依志願序逐一處理，先檢查衝堂／先修／學分上限，
 * 通過後再依 admissionChance 抽籤。
 */
export const allocate = (
  cart: Course[],
  schedule: Course[],
  student: Pick<StudentProfile, 'passedCourses'>,
  random: () => number = Math.random
): { results: AllocationResult[]; accepted: Course[] } => {
  const accepted = [...schedule];
  let credits = accepted.reduce((sum, c) => sum + c.credits, 0);
  const results = cart.map((course, i): AllocationResult => {
    const rank = i + 1;
    const chance = admissionChance(course, rank);
    const base = { course, rank, chance };
    if (seatsLeft(course) === 0) return { ...base, outcome: 'full' };
    if (!checkPrerequisite(course, student).met) return { ...base, outcome: 'prereq' };
    if (findConflicts(course, accepted).length > 0) return { ...base, outcome: 'conflict' };
    if (credits + course.credits > CREDIT_LIMIT) return { ...base, outcome: 'credits' };
    if (random() >= chance) return { ...base, outcome: 'lost' };
    accepted.push(course);
    credits += course.credits;
    return { ...base, outcome: 'accepted' };
  });
  return { results, accepted };
};

/**
 * 先修檢核：依學生已及格科目計算，而不是讀取寫死的旗標。
 * course.requires 為「每一組至少及格一科」，例如 [['資料結構', '程式設計']]。
 */
export const checkPrerequisite = (
  course: Course,
  student: Pick<StudentProfile, 'passedCourses'>
): { met: boolean; missing: string[][] } => {
  const groups = course.requires ?? [];
  const passed = new Set(student.passedCourses ?? []);
  const missing = groups.filter(group => !group.some(name => passed.has(name)));
  return { met: missing.length === 0, missing };
};
