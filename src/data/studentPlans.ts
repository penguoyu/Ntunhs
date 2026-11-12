import { StudentProfile, UserAccount } from '../types';
import { CURRENT_STUDENT } from './courses';
import demoPlans from './generated/demo-plans.json';

/** 課表、預選清單與已及格科目由轉檔程式依真實開課資料產生（scripts/convert_courses.py） */
const generated = (id: keyof typeof demoPlans) => ({
  scheduleIds: demoPlans[id].scheduleIds,
  cart: demoPlans[id].cart,
  favorites: demoPlans[id].favorites,
});

/** 每位使用者各自的選課資料（課表、預選清單、收藏、學籍資料） */
export interface StudentPlan {
  profile: StudentProfile;
  scheduleIds: string[];
  cart: string[];
  favorites: string[];
}

/** 訪客與未登入時使用的 key */
export const GUEST_PLAN_KEY = '__guest__';

const blankProfile = (user?: UserAccount): StudentProfile => ({
  name: user?.name ?? '訪客',
  studentId: user?.studentId ?? user?.username ?? '',
  department: user?.department ?? '',
  grade: '',
  classGroup: '',
  gpa: 0,
  rank: '-',
  status: user ? '在學' : '訪客瀏覽',
  microDegree: '',
  microDegreeCredits: 0,
  microDegreeTarget: 0,
  passedCourses: [],
  email: user?.email,
  phone: user?.phone,
});

/** 訪客：空白課表 */
export const emptyPlan = (user?: UserAccount): StudentPlan => ({
  profile: blankProfile(user),
  scheduleIds: [],
  cart: [],
  favorites: [],
});

/** 示範學生的預設課表（課表不衝堂；預選清單刻意放一門衝堂或未符先修的課方便展示提醒） */
const DEMO_PLANS: Record<string, StudentPlan> = {
  // 資管系 張哲宇
  usr_stu_1: {
    profile: CURRENT_STUDENT,
    ...generated('usr_stu_1'),
  },
  // 護理系 林思妤
  usr_stu_2: {
    profile: {
      name: '林思妤',
      studentId: '11112045',
      department: '護理系 四年級乙班',
      grade: '四年級',
      classGroup: '乙班',
      gpa: 3.72,
      rank: '9 / 62',
      status: '在學良好',
      microDegree: '長期照護與安寧療護微學程',
      microDegreeCredits: 10,
      microDegreeTarget: 15,
      passedCourses: demoPlans.usr_stu_2.passedCourses,
      email: 'lin.sy@ntunhs.edu.tw',
      phone: '0928-876-543',
    },
    ...generated('usr_stu_2'),
  },
  // 生死系 王若庭
  usr_stu_3: {
    profile: {
      name: '王若庭',
      studentId: '11135012',
      department: '生死與健康心理諮商系 二年級',
      grade: '二年級',
      classGroup: '甲班',
      gpa: 3.91,
      rank: '3 / 48',
      status: '在學良好',
      microDegree: '悲傷輔導與生命教育微學程',
      microDegreeCredits: 4,
      microDegreeTarget: 12,
      passedCourses: demoPlans.usr_stu_3.passedCourses,
      email: 'wang.rt@ntunhs.edu.tw',
      phone: '0933-210-987',
    },
    ...generated('usr_stu_3'),
  },
  // 健管系 郭政儒
  usr_stu_4: {
    profile: {
      name: '郭政儒',
      studentId: '11141088',
      department: '健康事業管理系 三年級',
      grade: '三年級',
      classGroup: '甲班',
      gpa: 3.48,
      rank: '15 / 50',
      status: '在學良好',
      microDegree: '智慧醫療管理微學程',
      microDegreeCredits: 6,
      microDegreeTarget: 15,
      passedCourses: demoPlans.usr_stu_4.passedCourses,
      email: 'kuo.cr@ntunhs.edu.tw',
      phone: '0955-443-322',
    },
    ...generated('usr_stu_4'),
  },
};

/** 取得使用者的預設選課資料；沒有示範資料的學生（例如新註冊帳號）從空白課表開始 */
export const defaultPlanFor = (user: UserAccount): StudentPlan =>
  DEMO_PLANS[user.id] ?? emptyPlan(user);
