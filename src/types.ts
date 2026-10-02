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
  | 'campus-gis'
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
