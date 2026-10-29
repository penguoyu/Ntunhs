import { StudentProfile, UserAccount } from '../types';
import { CURRENT_STUDENT, INITIAL_SCHEDULE_COURSE_IDS } from './courses';

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

/** 示範學生的預設課表（課程時段已確認不衝堂；預選清單刻意放一門衝堂課方便展示提醒） */
const DEMO_PLANS: Record<string, StudentPlan> = {
  // 資管系 張哲宇
  usr_stu_1: {
    profile: CURRENT_STUDENT,
    scheduleIds: INITIAL_SCHEDULE_COURSE_IDS,
    cart: ['IM3208', 'HA_COMM', 'IM3301'],
    favorites: ['IM3012', 'NURS201'],
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
      passedCourses: [
        '解剖生理學',
        '基本護理學及實習',
        '基本護理技術',
        '基礎護理學',
        '心理學',
        '內外科護理學(一)',
        '統計學概論',
      ],
      email: 'lin.sy@ntunhs.edu.tw',
      phone: '0928-876-543',
    },
    scheduleIds: [
      'NUR2201', // Mon 5-7 精神衛生護理學及實習
      'NURS201', // Tue 1-3 內外科護理學(二)
      'NUR2302', // Wed 1-3 婦幼與兒科重症護理學
      'GE1205',  // Wed 7-8 當代醫學與藝術療癒
      'NUR2503', // Thu 2-4 臨床藥理學與精準投藥照護
      'NUR3502', // Fri 5-6 臨床實證護理學
    ],
    cart: ['NUR3450', 'NUR2605', 'NUR3600'],
    favorites: ['NUR_CRIT', 'GE2705'],
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
      passedCourses: ['心理學', '生死學概論', '諮商理論與技術'],
      email: 'wang.rt@ntunhs.edu.tw',
      phone: '0933-210-987',
    },
    scheduleIds: [
      'DPC2101', // Mon 2-4 悲傷輔導與重大失落危機陪伴實務
      'GE2508',  // Mon 5-6 氣候變遷與一體化健康全球視野
      'DPC2405', // Tue 2-3 藝術與表達性心理治療工作坊
      'DPC3203', // Wed 5-6 醫療臨床心理諮商與醫病關係溝通
      'GE2301',  // Wed 7-8 醫學人文、疾病敘事與經典電影賞析
      'DPC1001', // Thu 3-4 人類發展學
    ],
    cart: ['DPC3308', 'GE2705', 'GE2406'],
    favorites: ['NUR3600'],
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
      passedCourses: ['管理學概論', '醫療法規與病歷資訊學', '初級會計學', '統計學概論'],
      email: 'kuo.cr@ntunhs.edu.tw',
      phone: '0955-443-322',
    },
    scheduleIds: [
      'HA2101', // Mon 2-4 智慧醫院營運與醫療品質管理
      'HA3512', // Tue 5-6 遠距醫療法規與醫療糾紛風險防範
      'HA3405', // Wed 7-8 醫院智慧供應鏈與綠色醫療永續ESG
      'HA3205', // Thu 7-8 全民健保申報大數據與DRGs管理
      'HA3620', // Fri 2-4 智慧長照機構營運評鑑與評估實務
    ],
    cart: ['HA_COMM', 'BIO202', 'HA3301'],
    favorites: ['GE2109'],
  },
};

/** 取得使用者的預設選課資料；沒有示範資料的學生（例如新註冊帳號）從空白課表開始 */
export const defaultPlanFor = (user: UserAccount): StudentPlan =>
  DEMO_PLANS[user.id] ?? emptyPlan(user);
