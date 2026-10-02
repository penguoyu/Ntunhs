import React from 'react';
import { ActiveTab, UserRole } from '../types';

interface BottomNavProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  cartCount: number;
  hasConflict?: boolean;
  userRole?: UserRole;
  deviceMode?: 'desktop' | 'mobile';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
  hasConflict,
  userRole = 'student',
  deviceMode = 'desktop',
}) => {
  const isAdmin = userRole === 'admin';

  const navContainerClass = `fixed bottom-0 z-50 pb-safe bg-surface-card/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,23,42,0.06)] border-t border-border-subtle ${
    deviceMode === 'mobile'
      ? 'w-full max-w-[430px] left-1/2 -translate-x-1/2'
      : 'left-0 w-full xl:hidden'
  }`;

  if (isAdmin) {
    return (
      <nav className={navContainerClass}>
        <div className="flex items-center justify-around h-16 px-1">
          <button
            onClick={() => onSelectTab('admin-courses')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all ${
              currentTab === 'admin-courses'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary font-normal'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
            <span className="text-[10px] leading-tight">開課維護</span>
          </button>

          <button
            onClick={() => onSelectTab('admin-import')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all ${
              currentTab === 'admin-import'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary font-normal'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span className="text-[10px] leading-tight">匯入課查</span>
          </button>

          <button
            onClick={() => onSelectTab('admin-users')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all ${
              currentTab === 'admin-users'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary font-normal'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
            <span className="text-[10px] leading-tight">帳號管理</span>
          </button>

          <button
            onClick={() => onSelectTab('admin-analytics')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all ${
              currentTab === 'admin-analytics'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary font-normal'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span className="text-[10px] leading-tight">選課監控</span>
          </button>

          <button
            onClick={() => onSelectTab('search-courses')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all text-secondary`}
          >
            <span className="material-symbols-outlined text-[20px]">school</span>
            <span className="text-[10px] leading-tight font-bold">學生視角</span>
          </button>
        </div>
      </nav>
    );
  }

  // Student Bottom Nav (5 clean tabs)
  return (
    <nav className={navContainerClass}>
      <div className="flex items-center justify-around h-16 px-1">
        {/* Tab 1: Course Search */}
        <button
          onClick={() => onSelectTab('search-courses')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all ${
            currentTab === 'search-courses'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary font-normal'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">explore</span>
          <span className="text-[10px] leading-tight">課程查詢</span>
        </button>

        {/* Tab 2: My Schedule */}
        <button
          onClick={() => onSelectTab('my-schedule')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all relative ${
            currentTab === 'my-schedule'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary font-normal'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          <span className="text-[10px] leading-tight">我的課表</span>
          {hasConflict && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-conflict-danger animate-ping"></span>
          )}
        </button>

        {/* Tab 3: Simulation Cart */}
        <button
          onClick={() => onSelectTab('simulation-cart')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all relative ${
            currentTab === 'simulation-cart'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary font-normal'
          }`}
        >
          <div className="relative">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.1 rounded-full bg-secondary text-white text-[8px] font-bold">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight">預選模擬</span>
        </button>

        {/* Tab 4: Graduation Audit */}
        <button
          onClick={() => onSelectTab('graduation-audit')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all ${
            currentTab === 'graduation-audit'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary font-normal'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">school</span>
          <span className="text-[10px] leading-tight">畢業審查</span>
        </button>

        {/* Tab 5: Student Account Center */}
        <button
          onClick={() => onSelectTab('user-profile')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] py-1 px-1 rounded-xl active:scale-95 transition-all ${
            currentTab === 'user-profile'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-primary font-normal'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="text-[10px] leading-tight">帳號中心</span>
        </button>
      </div>
    </nav>
  );
};
