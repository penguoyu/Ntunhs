import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, Course, UserAccount, StudentProfile } from './types';
import { COURSES_DATA, CURRENT_STUDENT, INITIAL_SCHEDULE_COURSE_IDS } from './data/courses';
import { INITIAL_USERS, DEFAULT_STUDENT_USER } from './data/users';
import { SEMESTER_LABEL } from './data/semester';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CourseSelection } from './components/CourseSelection';
import { GraduationAudit } from './components/GraduationAudit';
import { CourseDetailModal } from './components/CourseDetailModal';
import { NotificationModal } from './components/NotificationModal';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { StudentAccountCenter } from './components/StudentAccountCenter';
import { AdminCourseManagement } from './components/AdminCourseManagement';
import { AdminCourseImport } from './components/AdminCourseImport';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AdminAnalytics } from './components/AdminAnalytics';
import { AllocationResultModal } from './components/AllocationResultModal';
import { AllocationResult, allocate, findConflicts } from './lib/schedule';

/**
 * 資料版本：修改 src/data 內的預設資料後請一併更新，
 * 瀏覽器中舊的 localStorage 快取就會被清掉，改用新的預設資料。
 */
const DATA_VERSION = '2026-10-20';
const DATA_KEYS = [
  'ntunhs_courses_catalog',
  'ntunhs_cart',
  'ntunhs_tier1',
  'ntunhs_tier2',
  'ntunhs_schedule',
  'ntunhs_student_profile',
  'ntunhs_users',
  'ntunhs_current_user',
];
try {
  if (localStorage.getItem('ntunhs_data_version') !== DATA_VERSION) {
    DATA_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('ntunhs_data_version', DATA_VERSION);
  }
} catch {
  /* localStorage 不可用時直接使用預設資料 */
}

/** 示範用預選清單：含一門衝堂、一門未符先修，方便展示提醒 */
const DEFAULT_CART = ['IM3208', 'HA_COMM', 'IM3301'];

/** 舊分頁已合併到「選課」頁 */
const MERGED_TABS: ActiveTab[] = ['my-schedule', 'simulation-cart', 'conflict-resolver'];
const normalizeTab = (tab: ActiveTab): ActiveTab => (MERGED_TABS.includes(tab) ? 'search-courses' : tab);

export default function App() {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const semester = SEMESTER_LABEL;

  // Users & Auth state - default is strictly Student view (張哲宇, 11124026)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
      return DEFAULT_STUDENT_USER;
    } catch {
      return DEFAULT_STUDENT_USER;
    }
  });

  const [studentProfile, setStudentProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_student_profile');
      return saved ? JSON.parse(saved) : CURRENT_STUDENT;
    } catch {
      return CURRENT_STUDENT;
    }
  });

  // Current tab - default is Student Course Search
  const [currentTab, setCurrentTab] = useState<ActiveTab>(() => {
    return currentUser?.role === 'admin' ? 'admin-courses' : 'search-courses';
  });

  // Dynamic Courses catalog with localStorage persistence
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_courses_catalog');
      return saved ? JSON.parse(saved) : COURSES_DATA;
    } catch {
      return COURSES_DATA;
    }
  });

  // Student Cart & Simulation State
  const [cart, setCart] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_cart');
      return saved ? JSON.parse(saved) : DEFAULT_CART;
    } catch {
      return DEFAULT_CART;
    }
  });

  const [scheduleIds, setScheduleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_schedule');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULE_COURSE_IDS;
    } catch {
      return INITIAL_SCHEDULE_COURSE_IDS;
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_favorites');
      return saved ? JSON.parse(saved) : ['IM3012', 'NURS201'];
    } catch {
      return ['IM3012', 'NURS201'];
    }
  });

  // Modal inspection states
  const [inspectingCourse, setInspectingCourse] = useState<Course | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [allocationResults, setAllocationResults] = useState<AllocationResult[] | null>(null);

  // Persistence to local storage
  useEffect(() => {
    localStorage.setItem('ntunhs_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ntunhs_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ntunhs_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('ntunhs_student_profile', JSON.stringify(studentProfile));
  }, [studentProfile]);

  useEffect(() => {
    localStorage.setItem('ntunhs_courses_catalog', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('ntunhs_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ntunhs_schedule', JSON.stringify(scheduleIds));
  }, [scheduleIds]);

  useEffect(() => {
    localStorage.setItem('ntunhs_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 3200);
  };

  const goToTab = (tab: ActiveTab) => {
    setCurrentTab(normalizeTab(tab));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth & Role handling
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentTab('admin-courses');
    } else {
      setCurrentTab('search-courses');
      if (user.studentId) {
        setStudentProfile(prev => ({
          ...prev,
          name: user.name,
          studentId: user.studentId || user.username,
          department: user.department,
          email: user.email,
        }));
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('search-courses');
    showToast('您已成功安全登出系統。目前為訪客瀏覽模式');
  };

  const handleRegisterUser = (newUser: UserAccount) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const handleQuickSwitchRole = () => {
    if (!currentUser || currentUser.role === 'admin') {
      const studentUser =
        users.find(u => u.role === 'student' && u.status === 'active') ||
        INITIAL_USERS.find(u => u.role === 'student')!;
      setCurrentUser(studentUser);
      setCurrentTab('search-courses');
      showToast(`已切換為學生身分：${studentUser.name} (${studentUser.department})`);
    } else {
      const adminUser =
        users.find(u => u.role === 'admin' && u.status === 'active') ||
        INITIAL_USERS.find(u => u.role === 'admin')!;
      setCurrentUser(adminUser);
      setCurrentTab('admin-courses');
      showToast(`已切換為課程管理者身分：${adminUser.name} (${adminUser.department})`);
    }
  };

  // Course Management CRUD Callbacks
  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev]);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setCart(prev => prev.filter(id => id !== courseId));
    setScheduleIds(prev => prev.filter(id => id !== courseId));
  };

  // Batch Import Course Callback
  const handleBatchImport = (incomingCourses: Course[], overwrite: boolean) => {
    setCourses(prev => {
      if (overwrite) {
        const incomingMap = new Map(incomingCourses.map(c => [c.id, c]));
        const updatedExisting = prev.map(c => incomingMap.has(c.id) ? incomingMap.get(c.id)! : c);
        const existingIds = new Set(prev.map(c => c.id));
        const completelyNew = incomingCourses.filter(c => !existingIds.has(c.id));
        return [...completelyNew, ...updatedExisting];
      } else {
        const existingIds = new Set(prev.map(c => c.id));
        const nonDuplicate = incomingCourses.filter(c => !existingIds.has(c.id));
        return [...nonDuplicate, ...prev];
      }
    });
  };

  // User Accounts Management Callbacks
  const handleAddUser = (user: UserAccount) => {
    setUsers(prev => [user, ...prev]);
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Student Cart & Schedule Actions（購物車陣列順序 = 志願序）
  const handleToggleCart = (courseId: string) => {
    if (cart.includes(courseId)) {
      setCart(cart.filter(id => id !== courseId));
      showToast('已移出預選清單');
      return;
    }
    const target = courses.find(c => c.id === courseId);
    setCart([...cart, courseId]);
    if (!target) return;
    const planned = courses.filter(c => scheduleIds.includes(c.id) || cart.includes(c.id));
    const clashes = findConflicts(target, planned);
    if (clashes.length > 0) {
      showToast(`已加入預選，但與 ${clashes.map(c => `《${c.name}》`).join('、')} 衝堂`);
    } else {
      showToast(`已加入預選：《${target.name}》`);
    }
  };

  const handleToggleFavorite = (courseId: string) => {
    if (favorites.includes(courseId)) {
      setFavorites(favorites.filter(id => id !== courseId));
      showToast('已從收藏移除');
    } else {
      setFavorites([...favorites, courseId]);
      showToast('已加入收藏');
    }
  };

  const handleDropCourse = (courseId: string) => {
    const target = courses.find(c => c.id === courseId);
    setScheduleIds(scheduleIds.filter(id => id !== courseId));
    showToast(`已退選《${target?.name ?? courseId}》`);
  };

  /** 模擬送出登記：依志願序電腦分發，未分發的課保留在預選清單 */
  const handleSubmitCart = () => {
    const byId = new Map(courses.map(c => [c.id, c]));
    const schedule = scheduleIds.map(id => byId.get(id)).filter((c): c is Course => !!c);
    const registering = cart
      .filter(id => !scheduleIds.includes(id))
      .map(id => byId.get(id))
      .filter((c): c is Course => !!c);
    const { results, accepted } = allocate(registering, schedule, studentProfile);
    const newIds = new Set(results.filter(r => r.outcome === 'accepted').map(r => r.course.id));

    setScheduleIds(accepted.map(c => c.id));
    setCart(cart.filter(id => !newIds.has(id)));
    setCourses(prev => prev.map(c => (newIds.has(c.id) ? { ...c, enrolled: c.enrolled + 1 } : c)));
    setAllocationResults(results);
  };

  // Derived objects for student timetable
  const scheduleCourses = courses.filter(c => scheduleIds.includes(c.id));
  const cartCourses = courses.filter(c => cart.includes(c.id));

  return (
    <div
      className={`min-h-screen bg-surface text-on-surface flex flex-col font-sans transition-all ${
        deviceMode === 'mobile' ? 'items-center bg-slate-900 py-0 sm:py-6 px-0 sm:px-4' : ''
      }`}
    >
      <div
        className={`w-full flex flex-col min-h-screen ${
          deviceMode === 'mobile'
            ? 'max-w-[430px] bg-surface rounded-none sm:rounded-[36px] shadow-2xl overflow-y-auto sm:max-h-[92vh] border-0 sm:border-[8px] sm:border-slate-800 relative'
            : 'max-w-full'
        }`}
      >
        {/* Main Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={goToTab}
          student={studentProfile}
          currentUser={currentUser}
          semester={semester}
          deviceMode={deviceMode}
          onToggleDeviceMode={() => {
            setDeviceMode(deviceMode === 'desktop' ? 'mobile' : 'desktop');
            showToast(deviceMode === 'desktop' ? '已切換為手機視圖預覽模式' : '已切換為桌面工作台模式');
          }}
          unreadCount={2}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
          onQuickSwitchRole={handleQuickSwitchRole}
          onLogout={handleLogout}
        />

        {/* Content View Container */}
        <main
          className={`flex-1 w-full pb-28 sm:pb-32 xl:pb-16 ${
            deviceMode === 'mobile' 
              ? 'pt-4 px-3' 
              : currentUser?.role === 'admin'
                ? 'pt-28 sm:pt-32 xl:pt-24 px-3 sm:px-6 xl:px-10 max-w-[1680px] mx-auto'
                : 'pt-20 sm:pt-24 xl:pt-24 px-3 sm:px-6 xl:px-10 max-w-[1680px] mx-auto'
          }`}
        >
          {/* ========================================= */}
          {/* 課程管理者 View Tabs                      */}
          {/* ========================================= */}

          {currentTab === 'admin-courses' && (
            <AdminCourseManagement
              courses={courses}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onViewCourseDetail={course => setInspectingCourse(course)}
              showToast={showToast}
            />
          )}

          {currentTab === 'admin-import' && (
            <AdminCourseImport
              currentCourses={courses}
              onBatchImport={handleBatchImport}
              showToast={showToast}
            />
          )}

          {currentTab === 'admin-users' && (
            <AdminUserManagement
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              showToast={showToast}
            />
          )}

          {currentTab === 'admin-analytics' && (
            <AdminAnalytics
              courses={courses}
              onViewCourseDetail={course => setInspectingCourse(course)}
            />
          )}

          {/* ========================================= */}
          {/* 學生 View Tabs                            */}
          {/* ========================================= */}

          {currentTab === 'search-courses' && (
            <CourseSelection
              courses={courses}
              student={studentProfile}
              semester={semester}
              scheduleIds={scheduleIds}
              cart={cart}
              favorites={favorites}
              compact={deviceMode === 'mobile'}
              onToggleCart={handleToggleCart}
              onReorderCart={setCart}
              onToggleFavorite={handleToggleFavorite}
              onDropCourse={handleDropCourse}
              onSubmitCart={handleSubmitCart}
              onViewCourseDetail={course => setInspectingCourse(course)}
            />
          )}

          {currentTab === 'graduation-audit' && (
            <GraduationAudit
              student={studentProfile}
              onFilterMissingCourses={() => {
                setCurrentTab('search-courses');
                showToast('已為您過濾通識社會科學與美育領域缺額課程！');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showToast={showToast}
            />
          )}

          {currentTab === 'user-profile' && (
            <StudentAccountCenter
              currentUser={currentUser}
              student={studentProfile}
              scheduleCourses={scheduleCourses}
              cartCourses={cartCourses}
              onUpdateUser={handleUpdateUser}
              onUpdateStudent={setStudentProfile}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              onNavigateTab={goToTab}
              onSwitchToAdmin={() => {
                const adminUser = users.find(u => u.role === 'admin') || INITIAL_USERS.find(u => u.role === 'admin')!;
                setCurrentUser(adminUser);
                setCurrentTab('admin-courses');
                showToast(`已切換為教務處課務管理員身分：${adminUser.name}`);
              }}
              onLogout={handleLogout}
              showToast={showToast}
            />
          )}
        </main>

        {/* Global Footer (Desktop) */}
        <footer className={`w-full bg-surface-card border-t border-border-subtle py-6 px-4 sm:px-6 xl:px-10 mt-12 text-xs text-text-muted ${
          deviceMode === 'mobile' ? 'hidden' : 'hidden xl:block'
        }`}>
          <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">國立臺北護理健康大學 教務處課務組</span>
              <span>© 2026 NTUNHS Course Master System. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-text-secondary">
              <button 
                onClick={() => {
                  if (currentUser) {
                    setIsUserProfileModalOpen(true);
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }} 
                className="hover:text-primary transition-colors font-medium"
              >
                {currentUser ? '個人帳號管理' : '校務帳號登入'}
              </button>
              <button 
                onClick={() => setIsLoginModalOpen(true)} 
                className="hover:text-primary transition-colors font-medium"
              >
                切換登入身分
              </button>
              {currentUser && (
                <button 
                  onClick={handleLogout}
                  className="hover:text-rose-600 text-rose-500 transition-colors font-medium"
                >
                  安全登出
                </button>
              )}
              <button onClick={() => showToast('已下載選課法規與選修修課須知 (PDF)')} className="hover:text-primary transition-colors">
                選課法規與須知
              </button>
              <button onClick={() => showToast('醫療資訊與智慧照護微學程：認列門檻 15 學分')} className="hover:text-primary transition-colors">
                跨領域學程指南
              </button>
              <button onClick={() => showToast('課務諮詢專線：(02)2822-7101 分機 2210')} className="hover:text-primary transition-colors">
                技術支援與回報
              </button>
            </div>
          </div>
        </footer>

        {/* Mobile Fixed Bottom Navigation (Role-Adaptive) */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={goToTab}
          cartCount={cart.length}
          hasConflict={false}
          userRole={currentUser?.role}
          deviceMode={deviceMode}
        />

        {/* Course Detailed Inspector Modal */}
        {inspectingCourse && (
          <CourseDetailModal
            course={inspectingCourse}
            isInCart={cart.includes(inspectingCourse.id)}
            isFavorite={favorites.includes(inspectingCourse.id)}
            scheduleCourses={scheduleCourses}
            cartCourses={cartCourses}
            onToggleCart={handleToggleCart}
            onToggleFavorite={handleToggleFavorite}
            onClose={() => setInspectingCourse(null)}
            showToast={showToast}
          />
        )}

        {/* Notifications Modal */}
        <NotificationModal
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNavigateTab={tab => goToTab(tab as ActiveTab)}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          currentUser={currentUser}
          users={users}
          onLogin={handleLogin}
          onRegister={handleRegisterUser}
          onLogout={handleLogout}
          showToast={showToast}
        />

        {/* User Profile Modal */}
        {currentUser && (
          <UserProfileModal
            isOpen={isUserProfileModalOpen}
            onClose={() => setIsUserProfileModalOpen(false)}
            currentUser={currentUser}
            student={studentProfile}
            onUpdateUser={handleUpdateUser}
            onUpdateStudent={setStudentProfile}
            onLogout={handleLogout}
            showToast={showToast}
          />
        )}

        {allocationResults && (
          <AllocationResultModal results={allocationResults} onClose={() => setAllocationResults(null)} />
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-2.5 rounded-full shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-white/10">
            <span className="material-symbols-outlined text-[18px] text-secondary-fixed">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
