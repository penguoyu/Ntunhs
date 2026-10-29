import { UserAccount } from '../types';

export const INITIAL_USERS: UserAccount[] = [
  // 1. 預設登入身分：在校學生代表 (張哲宇)
  {
    id: 'usr_stu_1',
    username: '11124026',
    name: '張哲宇',
    email: 'chang.zy@ntunhs.edu.tw',
    role: 'student',
    department: '資訊管理系 四技三年級甲班',
    studentId: '11124026',
    phone: '0912-345-678',
    status: 'active',
    lastLogin: '2026-10-02 09:12',
    createdAt: '2024-09-05',
  },
  // 2. 學生代表 (護理系)
  {
    id: 'usr_stu_2',
    username: '11112045',
    name: '林思妤',
    email: 'lin.sy@ntunhs.edu.tw',
    role: 'student',
    department: '護理系 四年級乙班',
    studentId: '11112045',
    phone: '0928-876-543',
    status: 'active',
    lastLogin: '2026-10-01 20:15',
    createdAt: '2024-09-05',
  },
  // 3. 學生代表 (生死系)
  {
    id: 'usr_stu_3',
    username: '11135012',
    name: '王若庭',
    email: 'wang.rt@ntunhs.edu.tw',
    role: 'student',
    department: '生死與健康心理諮商系 二年級',
    studentId: '11135012',
    phone: '0933-210-987',
    status: 'active',
    lastLogin: '2026-09-30 11:20',
    createdAt: '2024-09-05',
  },
  // 4. 學生代表 (健管系)
  {
    id: 'usr_stu_4',
    username: '11141088',
    name: '郭政儒',
    email: 'kuo.cr@ntunhs.edu.tw',
    role: 'student',
    department: '健康事業管理系 三年級',
    studentId: '11141088',
    phone: '0955-443-322',
    status: 'active',
    lastLogin: '2026-09-15 14:02',
    createdAt: '2024-09-05',
  },
  // 5. 課程管理者：教務處課務組 柯組長
  {
    id: 'usr_admin_1',
    username: 'admin',
    name: '柯淑芬 組長',
    email: 'curriculum@ntunhs.edu.tw',
    role: 'admin',
    department: '教務處課務組',
    phone: '02-2822-7101 #2210',
    status: 'active',
    lastLogin: '2026-10-02 08:30',
    createdAt: '2024-08-01',
  },
  // 6. 課程管理者：資訊科技中心
  {
    id: 'usr_admin_2',
    username: 'admin_it',
    name: '李建銘 專員',
    email: 'it_system@ntunhs.edu.tw',
    role: 'admin',
    department: '資訊科技中心 系統管理組',
    phone: '02-2822-7101 #2840',
    status: 'active',
    lastLogin: '2026-10-01 16:45',
    createdAt: '2024-09-01',
  }
];

/**
 * 示範帳號共用密碼「ntunhs2026」的 SHA-256 雜湊。
 * 注意：這是純前端專題，驗證只在瀏覽器執行，正式上線必須改由後端驗證。
 */
export const DEMO_PASSWORD_HASH = '939670e04b184238896618402417ac7af495c05e2700f35b3e10199a93a69376';

export const sha256Hex = async (text: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const DEFAULT_STUDENT_USER = INITIAL_USERS[0];
