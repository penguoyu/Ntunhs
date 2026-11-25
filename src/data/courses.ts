import { Course, StudentProfile } from '../types';
import coursesJson from './generated/courses.json';
import demoPlans from './generated/demo-plans.json';
import { inferSdgs } from '../lib/sdgs';

/**
 * 課程資料：由學校「全校修課資料表」轉出（scripts/convert_courses.py）。
 * 要更新學期時，重新下載 xls 後再跑一次轉檔程式即可，不需要手動修改這個檔案。
 */
/**
 * 示範用：把幾門課的選課人數設成額滿，方便展示 FR-07 額滿候補與自動遞補。
 * （學校資料沒有名額上限，上限本來就是推估值）
 */
const DEMO_FULL_IDS = new Set([
  '22140158701335', // 資訊科技創新應用管理（張哲宇的收藏）
  '22140162801445', // 醫療機構管理實務
]);

export const COURSES_DATA = (coursesJson as unknown as Course[]).map(c => ({
  ...c,
  ...(DEMO_FULL_IDS.has(c.id) ? { enrolled: c.capacity } : {}),
  // 學校資料沒有 SDGs：依課名與摘要自動對應（模擬，畫面上有標示）
  ...(c.sdgs?.length ? {} : { sdgs: inferSdgs(c), sdgsAuto: true }),
}));

export const CURRENT_STUDENT: StudentProfile = {
  name: '張哲宇',
  studentId: '11124026',
  department: '資訊管理系 四技三年級甲班',
  grade: '三年級',
  classGroup: '甲班',
  gpa: 3.85,
  rank: '6 / 54',
  status: '在學良好',
  microDegree: '醫療資訊與智慧照護微學程',
  microDegreeCredits: 8,
  microDegreeTarget: 15,
  passedCourses: demoPlans.usr_stu_1.passedCourses,
};

export const INITIAL_SCHEDULE_COURSE_IDS = demoPlans.usr_stu_1.scheduleIds;
