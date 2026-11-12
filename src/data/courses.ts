import { Course, StudentProfile } from '../types';
import coursesJson from './generated/courses.json';
import demoPlans from './generated/demo-plans.json';

/**
 * 課程資料：由學校「全校修課資料表」轉出（scripts/convert_courses.py）。
 * 要更新學期時，重新下載 xls 後再跑一次轉檔程式即可，不需要手動修改這個檔案。
 */
export const COURSES_DATA = coursesJson as unknown as Course[];

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
