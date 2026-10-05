export type CourseCategory = 
  | '專業必修' 
  | '必修'
  | '專業選修' 
  | '跨系選修' 
  | '跨領域選修'
  | '博雅通識' 
  | '臨床實習'
  | '跨院臨床';

export interface WeekProgress {
  week: string;
  tag: string;
  title: string;
  desc: string;
}

export interface GradingCriterion {
  item: string;
  percent: number;
  desc: string;
}

export interface TextbookInfo {
  title: string;
  edition: string;
  availablePaper: number;
  hasEbook: boolean;
  coverImage?: string;
  callNumber?: string;
}

export interface SDGGoal {
  id: number;
  code: string;
  name: string;
  enName: string;
  color: string;
  icon: string;
}

export const SDG_LIST: SDGGoal[] = [
  { id: 1, code: 'SDG 1', name: '終結貧窮', enName: 'No Poverty', color: '#E5243B', icon: 'volunteer_activism' },
  { id: 2, code: 'SDG 2', name: '消除飢餓', enName: 'Zero Hunger', color: '#DDA63A', icon: 'nutrition' },
  { id: 3, code: 'SDG 3', name: '健康與福祉', enName: 'Good Health and Well-being', color: '#4C9F38', icon: 'favorite' },
  { id: 4, code: 'SDG 4', name: '優質教育', enName: 'Quality Education', color: '#C5192D', icon: 'school' },
  { id: 5, code: 'SDG 5', name: '性別平權', enName: 'Gender Equality', color: '#FF3A21', icon: 'female' },
  { id: 6, code: 'SDG 6', name: '淨水及衛生', enName: 'Clean Water and Sanitation', color: '#26BDE2', icon: 'water_drop' },
  { id: 7, code: 'SDG 7', name: '可負擔的潔淨能源', enName: 'Affordable and Clean Energy', color: '#FCC30B', icon: 'bolt' },
  { id: 8, code: 'SDG 8', name: '合適的工作及經濟成長', enName: 'Decent Work and Economic Growth', color: '#A21942', icon: 'trending_up' },
  { id: 9, code: 'SDG 9', name: '工業化、創新及基礎建設', enName: 'Industry, Innovation and Infrastructure', color: '#FD6925', icon: 'precision_manufacturing' },
  { id: 10, code: 'SDG 10', name: '減少不平等', enName: 'Reduced Inequalities', color: '#DD1367', icon: 'balance' },
  { id: 11, code: 'SDG 11', name: '永續城鄉', enName: 'Sustainable Cities and Communities', color: '#FD9D24', icon: 'location_city' },
  { id: 12, code: 'SDG 12', name: '責任消費及生產', enName: 'Responsible Consumption and Production', color: '#BF8B2E', icon: 'recycling' },
  { id: 13, code: 'SDG 13', name: '氣候行動', enName: 'Climate Action', color: '#3F7E44', icon: 'eco' },
  { id: 14, code: 'SDG 14', name: '保育海洋生態', enName: 'Life Below Water', color: '#0A97D9', icon: 'waves' },
  { id: 15, code: 'SDG 15', name: '保育陸域生態', enName: 'Life on Land', color: '#56C02B', icon: 'forest' },
  { id: 16, code: 'SDG 16', name: '和平、正義及健全制度', enName: 'Peace, Justice and Strong Institutions', color: '#00689D', icon: 'gavel' },
  { id: 17, code: 'SDG 17', name: '多元夥伴關係', enName: 'Partnerships for the Goals', color: '#19486A', icon: 'handshake' },
];

export interface CoreCompetency {
  code: string;
  name: string;
  percentage: number;
}

export interface CourseReview {
  id: string;
  author: string;
  semester: string;
  rating: number;
  content: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  englishName: string;
  credits: number;
  category: CourseCategory;
  department: string;
  college: '健康科技學院' | '護理學院' | '人類發展與健康學院' | '通識中心';
  teacher: string;
  teacherTitle?: string;
  officeHours?: string;
  location: string;
  building: string;
  room: string;
  day: number; // 1 to 5 (Mon to Fri)
  periods: number[]; // e.g. [2, 3, 4]
  timeStr: string;
  enrolled: number;
  capacity: number;
  isEMI?: boolean;
  isCrossDisciplinary?: boolean;
  sdgs?: number[]; // 1 to 17 (聯合國 SDGs 永續發展目標)
  sdgsSummary?: string; // SDGs 永續指標簡述
  coreCompetencies?: CoreCompetency[];
  prerequisite?: string;
  prerequisitePassed?: boolean;
  description: string;
  rating: number;
  ratingCount: number;
  passRate?: number;
  averageScore?: number;
  tags: string[];
  accentColor: string; // 'primary' | 'secondary' | 'clinical-purple' | 'general-sky' | 'tertiary'
  syllabus?: {
    objectives: string;
    weeks: WeekProgress[];
    grading: GradingCriterion[];
    textbook: TextbookInfo;
    reviews: CourseReview[];
  };
}

export type UserRole = 'admin' | 'student';

export interface UserAccount {
  id: string;
  username: string; // e.g. 'admin' or '11124026'
  name: string;
  email: string;
  role: UserRole;
  department: string;
  studentId?: string;
  phone?: string;
  status: 'active' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

export type ActiveTab = 
  | 'search-courses' 
  | 'my-schedule' 
  | 'simulation-cart' 
  | 'graduation-audit'
  | 'conflict-resolver'
  | 'course-detail'
  | 'admin-courses'
  | 'admin-import'
  | 'admin-users'
  | 'admin-analytics'
  | 'user-profile';

export interface StudentProfile {
  name: string;
  studentId: string;
  department: string;
  grade: string;
  classGroup: string;
  gpa: number;
  rank: string;
  status: string;
  microDegree: string;
  microDegreeCredits: number;
  microDegreeTarget: number;
  email?: string;
  phone?: string;
}
