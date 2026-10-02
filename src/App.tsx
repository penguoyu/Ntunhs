import React, { useState, useEffect } from 'react';
import { ActiveTab, Course, UserAccount, StudentProfile } from './types';
import { COURSES_DATA, CURRENT_STUDENT, INITIAL_SCHEDULE_COURSE_IDS } from './data/courses';
import { INITIAL_USERS, DEFAULT_STUDENT_USER } from './data/users';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CourseSearch } from './components/CourseSearch';
import { WeeklySchedule } from './components/WeeklySchedule';
import { SimulationWorkstation } from './components/SimulationWorkstation';
import { ConflictResolver } from './components/ConflictResolver';
import { CampusGis } from './components/CampusGis';
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

export default function App() {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [semester] = useState('113學年 第2學期');

  // Users & Auth state - default is strictly Student view (張哲宇, 11124026)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
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
    return currentUser.role === 'admin' ? 'admin-courses' : 'search-courses';
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
      return saved ? JSON.parse(saved) : ['IM3012', 'NUR3402', 'IM3105', 'CS301'];
    } catch {
      return ['IM3012', 'NUR3402', 'IM3105', 'CS301'];
    }
  });

  const [tier1Ids, setTier1Ids] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_tier1');
      return saved ? JSON.parse(saved) : ['CS301', 'IM3012', 'NUR3402', 'IM3105'];
    } catch {
      return ['CS301', 'IM3012', 'NUR3402', 'IM3105'];
    }
  });

  const [tier2Ids, setTier2Ids] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ntunhs_tier2');
      return saved ? JSON.parse(saved) : ['NUR_CRIT', 'IM3208'];
    } catch {
      return ['NUR_CRIT', 'IM3208'];
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
  const [gisTargetCourse, setGisTargetCourse] = useState<Course | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistence to local storage
  useEffect(() => {
    localStorage.setItem('ntunhs_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ntunhs_current_user', JSON.stringify(currentUser));
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
    localStorage.setItem('ntunhs_tier1', JSON.stringify(tier1Ids));
  }, [tier1Ids]);

  useEffect(() => {
    localStorage.setItem('ntunhs_tier2', JSON.stringify(tier2Ids));
  }, [tier2Ids]);

  useEffect(() => {
    localStorage.setItem('ntunhs_schedule', JSON.stringify(scheduleIds));
  }, [scheduleIds]);

  useEffect(() => {
    localStorage.setItem('ntunhs_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
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

  const handleRegisterUser = (newUser: UserAccount) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const handleQuickSwitchRole = () => {
    if (currentUser.role === 'admin') {
      const studentUser = users.find(u => u.role === 'student' && u.status === 'active') || INITIAL_USERS[2];
      setCurrentUser(studentUser);
      setCurrentTab('search-courses');
      showToast(`已切換為學生身分：${studentUser.name} (${studentUser.department})`);
    } else {
      const adminUser = users.find(u => u.role === 'admin' && u.status === 'active') || INITIAL_USERS[0];
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
    setTier1Ids(prev => prev.filter(id => id !== courseId));
    setTier2Ids(prev => prev.filter(id => id !== courseId));
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
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Student Cart & Schedule Actions
  const handleToggleCart = (courseId: string) => {
    if (cart.includes(courseId)) {
      setCart(cart.filter(id => id !== courseId));
      setTier1Ids(tier1Ids.filter(id => id !== courseId));
      setTier2Ids(tier2Ids.filter(id => id !== courseId));
      showToast('已自模擬工作台移出');
    } else {
      setCart([...cart, courseId]);
      setTier1Ids([...tier1Ids, courseId]);
      showToast('已加入選課模擬工作台！');
    }
  };

  const handleToggleFavorite = (courseId: string) => {
    if (favorites.includes(courseId)) {
      setFavorites(favorites.filter(id => id !== courseId));
      showToast('已從我的收藏移除');
    } else {
      setFavorites([...favorites, courseId]);
      showToast('已加入我的最愛收藏！');
    }
  };

  const handleNavigateToGis = (course: Course) => {
    setGisTargetCourse(course);
    setCurrentTab('campus-gis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyToSchedule = () => {
    const merged = Array.from(new Set([...scheduleIds, ...tier1Ids]));
    setScheduleIds(merged);
    showToast('已成功套用模擬志願至個人週課表！');
    setCurrentTab('my-schedule');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResolveConflict = (solutionId: number) => {
    if (solutionId === 1) {
      showToast('已切換為《社區高齡照護科技》B班（週二時段）！零衝堂達成。');
    } else {
      if (!scheduleIds.includes('LTC_CASE')) {
        setScheduleIds([...scheduleIds.filter(id => id !== 'HA_COMM'), 'LTC_CASE']);
      }
      showToast('已切換為《長期照護評估與個案管理》！');
    }
  };

  // Derived objects for student timetable
  const scheduleCourses = courses.filter(c => scheduleIds.includes(c.id));
  const cartCourses = courses.filter(c => cart.includes(c.id));
  const totalCartCredits = cartCourses.reduce((sum, c) => sum + c.credits, 0);

  return (
    <div
      className={`min-h-screen bg-surface text-on-surface flex flex-col font-sans transition-all ${
        deviceMode === 'mobile' ? 'items-center bg-slate-900 py-0 sm:py-6' : ''
      }`}
    >
      <div
        className={`w-full flex flex-col min-h-screen ${
          deviceMode === 'mobile'
            ? 'max-w-[430px] bg-surface rounded-none sm:rounded-[36px] shadow-2xl overflow-hidden border-0 sm:border-[8px] sm:border-slate-800 relative'
            : 'max-w-full'
        }`}
      >
        {/* Main Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={tab => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
        />

        {/* Content View Container */}
        <main
          className={`flex-1 w-full pb-28 sm:pb-32 xl:pb-16 ${
            deviceMode === 'mobile' 
              ? currentUser.role === 'admin' ? 'pt-28 px-3' : 'pt-20 px-3' 
              : 'pt-20 xl:pt-24 px-3 sm:px-6 xl:px-10'
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
            <CourseSearch
              courses={courses}
              cart={cart}
              favorites={favorites}
              onToggleCart={handleToggleCart}
              onToggleFavorite={handleToggleFavorite}
              onViewCourseDetail={course => setInspectingCourse(course)}
              onNavigateToGis={handleNavigateToGis}
              onGoToSimulation={() => {
                setCurrentTab('simulation-cart');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              student={studentProfile}
              totalCredits={totalCartCredits}
            />
          )}

          {currentTab === 'my-schedule' && (
            <WeeklySchedule
              scheduleCourses={scheduleCourses}
              onViewCourseDetail={course => setInspectingCourse(course)}
              onNavigateToGis={handleNavigateToGis}
              onOpenConflictResolver={() => {
                setCurrentTab('conflict-resolver');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showToast={showToast}
            />
          )}

          {currentTab === 'simulation-cart' && (
            <SimulationWorkstation
              courses={courses}
              cart={cart}
              tier1Ids={tier1Ids}
              tier2Ids={tier2Ids}
              onSetTier1Ids={setTier1Ids}
              onSetTier2Ids={setTier2Ids}
              onRemoveFromCart={id => {
                setCart(cart.filter(x => x !== id));
                setTier1Ids(tier1Ids.filter(x => x !== id));
                setTier2Ids(tier2Ids.filter(x => x !== id));
                showToast('已自模擬工作台移出');
              }}
              onAddToCart={id => {
                if (!cart.includes(id)) {
                  setCart([...cart, id]);
                }
                if (!tier1Ids.includes(id)) {
                  setTier1Ids([...tier1Ids, id]);
                }
              }}
              onApplyToSchedule={handleApplyToSchedule}
              onViewCourseDetail={course => setInspectingCourse(course)}
              showToast={showToast}
            />
          )}

          {currentTab === 'conflict-resolver' && (
            <ConflictResolver
              onResolveConflict={handleResolveConflict}
              onBack={() => {
                setCurrentTab('my-schedule');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onViewCourseDetail={course => setInspectingCourse(course)}
              showToast={showToast}
            />
          )}

          {currentTab === 'campus-gis' && (
            <CampusGis
              targetCourse={gisTargetCourse}
              onViewCourseDetail={course => setInspectingCourse(course)}
              onBack={() => {
                setCurrentTab('my-schedule');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showToast={showToast}
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
              onNavigateTab={tab => {
                setCurrentTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSwitchToAdmin={() => {
                const adminUser = users.find(u => u.role === 'admin') || INITIAL_USERS[4];
                setCurrentUser(adminUser);
                setCurrentTab('admin-courses');
                showToast(`已切換為教務處課務管理員身分：${adminUser.name}`);
              }}
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
                onClick={() => setIsUserProfileModalOpen(true)} 
                className="hover:text-primary transition-colors font-medium"
              >
                個人帳號管理
              </button>
              <button 
                onClick={() => setIsLoginModalOpen(true)} 
                className="hover:text-primary transition-colors font-medium"
              >
                切換登入身分
              </button>
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
          onSelectTab={tab => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          cartCount={cart.length}
          hasConflict={true}
          userRole={currentUser.role}
          deviceMode={deviceMode}
        />

        {/* Course Detailed Inspector Modal */}
        {inspectingCourse && (
          <CourseDetailModal
            course={inspectingCourse}
            isInCart={cart.includes(inspectingCourse.id)}
            isFavorite={favorites.includes(inspectingCourse.id)}
            onToggleCart={handleToggleCart}
            onToggleFavorite={handleToggleFavorite}
            onClose={() => setInspectingCourse(null)}
            onNavigateToGis={handleNavigateToGis}
            showToast={showToast}
          />
        )}

        {/* Notifications Modal */}
        <NotificationModal
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNavigateTab={tab => {
            setCurrentTab(tab as ActiveTab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          currentUser={currentUser}
          users={users}
          onLogin={handleLogin}
          onRegister={handleRegisterUser}
          showToast={showToast}
        />

        {/* User Profile Modal */}
        <UserProfileModal
          isOpen={isUserProfileModalOpen}
          onClose={() => setIsUserProfileModalOpen(false)}
          currentUser={currentUser}
          student={studentProfile}
          onUpdateUser={handleUpdateUser}
          onUpdateStudent={setStudentProfile}
          showToast={showToast}
        />

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
