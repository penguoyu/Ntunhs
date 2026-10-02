import React, { useState } from 'react';
import { ActiveTab, StudentProfile, UserAccount } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  student: StudentProfile;
  currentUser: UserAccount;
  semester: string;
  onSelectSemester?: (sem: string) => void;
  deviceMode: 'desktop' | 'mobile';
  onToggleDeviceMode: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenLogin: () => void;
  onOpenUserProfile: () => void;
  onQuickSwitchRole: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  student,
  currentUser,
  semester,
  deviceMode,
  onToggleDeviceMode,
  unreadCount = 2,
  onOpenNotifications,
  onOpenLogin,
  onOpenUserProfile,
  onQuickSwitchRole,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  return (
    <>
      {/* Desktop Header Bar (xl and up) */}
      <header className={`fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-border-subtle ${
        deviceMode === 'mobile' ? 'hidden' : 'hidden xl:block'
      }`}>
        <div className="h-20 w-full px-6 flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
          {/* Logo & School Branding */}
          <div 
            className="flex items-center gap-3 shrink-0 cursor-pointer" 
            onClick={() => onSelectTab(isAdmin ? 'admin-courses' : 'search-courses')}
          >
            <Logo size={40} />
            <div className="flex flex-col">
              <span className="font-bold text-xl text-primary tracking-tight">北護課程通</span>
              <span className="text-[11px] text-text-muted tracking-wider uppercase font-semibold">
                NTUNHS COURSE MASTER
              </span>
            </div>
            <div className="h-6 w-px bg-surface-container-high mx-2"></div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-general-sky text-[18px]">calendar_month</span>
              <span>{semester}</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs - Role-Adaptive */}
          <nav className="flex items-center gap-1">
            {isAdmin ? (
              // Admin Navigation
              <>
                <button
                  onClick={() => onSelectTab('admin-courses')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'admin-courses'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                  <span>課程維護管理 (CRUD)</span>
                </button>
                <button
                  onClick={() => onSelectTab('admin-import')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'admin-import'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>匯入課查系統結果</span>
                </button>
                <button
                  onClick={() => onSelectTab('admin-users')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'admin-users'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                  <span>全校帳號管理</span>
                </button>
                <button
                  onClick={() => onSelectTab('admin-analytics')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'admin-analytics'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">analytics</span>
                  <span>選課監控儀表板</span>
                </button>
                <div className="h-5 w-px bg-border-subtle mx-1"></div>
                <button
                  onClick={() => onSelectTab('search-courses')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 text-secondary hover:bg-secondary/10`}
                  title="切換至學生端選課視角預覽"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>學生選課視角</span>
                </button>
              </>
            ) : (
              // Student Navigation
              <>
                <button
                  onClick={() => onSelectTab('search-courses')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'search-courses'
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">explore</span>
                  <span>課程查詢與智能篩選</span>
                </button>
                <button
                  onClick={() => onSelectTab('simulation-cart')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'simulation-cart'
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span>預選課工作台與模擬</span>
                </button>
                <button
                  onClick={() => onSelectTab('my-schedule')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'my-schedule'
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span>個人週課表</span>
                </button>
                <button
                  onClick={() => onSelectTab('conflict-resolver')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'conflict-resolver'
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span>衝突診斷室</span>
                </button>
                <button
                  onClick={() => onSelectTab('graduation-audit')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'graduation-audit'
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">school</span>
                  <span>畢業審查</span>
                </button>
                <button
                  onClick={() => onSelectTab('campus-gis')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'campus-gis'
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">near_me</span>
                  <span>校園GIS</span>
                </button>
                <button
                  onClick={() => onSelectTab('user-profile')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'user-profile'
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  <span>個人帳號中心</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Status Indicators & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Switch Role One-Click Button */}
            <button
              onClick={onQuickSwitchRole}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-xs transition-all active:scale-95 ${
                isAdmin
                  ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
              }`}
              title="點擊直接在課程管理者與學生身分間快速切換"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isAdmin ? 'switch_account' : 'admin_panel_settings'}
              </span>
              <span>{isAdmin ? '點擊切換為學生' : '點擊切換為管理者'}</span>
            </button>

            {/* Device Switch Button (Desktop/Mobile) */}
            <button
              onClick={onToggleDeviceMode}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-primary flex items-center gap-1 transition-colors"
              title="切換行動版 / 桌面版版型視圖"
            >
              <span className="material-symbols-outlined text-[16px]">
                {deviceMode === 'desktop' ? 'devices' : 'smartphone'}
              </span>
              <span>{deviceMode === 'desktop' ? '手機視圖' : '桌面視圖'}</span>
            </button>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
              aria-label="即時課務通知"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-conflict-danger ring-2 ring-white"></span>
              )}
            </button>

            {/* Current User Pill & Dropdown */}
            <div className="relative">
              <div
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container rounded-xl cursor-pointer transition-colors border border-border-subtle"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  isAdmin ? 'bg-amber-600' : 'bg-primary'
                }`}>
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                    <span>{currentUser.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isAdmin ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {isAdmin ? '課程管理者' : '學生'}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted truncate max-w-[120px]">
                    {currentUser.department}
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[16px]">
                  expand_more
                </span>
              </div>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-56 bg-surface-card rounded-2xl shadow-xl border border-border-subtle p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-border-subtle mb-1">
                    <div className="text-xs font-bold text-on-surface">{currentUser.name}</div>
                    <div className="text-[11px] text-text-muted font-mono">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={onOpenUserProfile}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                    <span>個人帳號資料與設定</span>
                  </button>
                  <button
                    onClick={onOpenLogin}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">switch_account</span>
                    <span>切換/更換登入帳號</span>
                  </button>
                  <div className="border-t border-border-subtle my-1"></div>
                  <button
                    onClick={onOpenLogin}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>登出系統</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Header Bar */}
      <header className={`fixed top-0 z-50 pt-safe bg-surface-card/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-border-subtle ${
        deviceMode === 'mobile'
          ? 'block w-full max-w-[430px] left-1/2 -translate-x-1/2'
          : 'w-full left-0 xl:hidden'
      }`}>
        <div className="h-16 px-4 flex items-center justify-between gap-2">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Logo size={32} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-primary truncate">北護課程通</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isAdmin ? 'bg-amber-100 text-amber-900' : 'bg-primary-fixed text-on-primary-fixed'
                }`}>
                  {isAdmin ? '管理者' : '學生'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <span className="truncate">{currentUser.name}</span>
                <span>•</span>
                <span className="text-primary-container truncate font-semibold">
                  {currentTab === 'admin-courses' && '開課管理'}
                  {currentTab === 'admin-import' && '匯入課查'}
                  {currentTab === 'admin-users' && '帳號管理'}
                  {currentTab === 'admin-analytics' && '選課監控'}
                  {currentTab === 'search-courses' && '課程查詢'}
                  {currentTab === 'my-schedule' && '個人課表'}
                  {currentTab === 'simulation-cart' && '選課模擬'}
                  {currentTab === 'graduation-audit' && '畢業審查'}
                  {currentTab === 'conflict-resolver' && '衝突診斷'}
                  {currentTab === 'campus-gis' && '校園GIS'}
                  {currentTab === 'user-profile' && '個人帳號中心'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Quick Switch Button */}
            <button
              onClick={onQuickSwitchRole}
              className={`p-1.5 rounded-lg border text-xs font-bold ${
                isAdmin ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-emerald-400 bg-emerald-50 text-emerald-900'
              }`}
              title="切換身分"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isAdmin ? 'school' : 'admin_panel_settings'}
              </span>
            </button>

            <button
              onClick={onToggleDeviceMode}
              className="p-2 rounded-full hover:bg-surface-container text-primary transition-colors text-xs"
              title="切換視圖"
            >
              <span className="material-symbols-outlined text-[20px]">
                {deviceMode === 'desktop' ? 'devices' : 'desktop_mac'}
              </span>
            </button>

            <button
              onClick={onOpenNotifications}
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all relative"
              aria-label="通知中心"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-conflict-danger ring-2 ring-white"></span>
              )}
            </button>

            <div
              onClick={onOpenUserProfile}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform text-xs font-bold ${
                isAdmin ? 'bg-amber-600' : 'bg-primary'
              }`}
            >
              {currentUser.name.slice(0, 1)}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar for Admin */}
        {isAdmin && (
          <div className="flex items-center overflow-x-auto no-scrollbar px-3 py-1.5 bg-surface-container-low border-t border-border-subtle text-xs gap-1">
            <button
              onClick={() => onSelectTab('admin-courses')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-bold ${
                currentTab === 'admin-courses' ? 'bg-primary text-white' : 'text-text-muted'
              }`}
            >
              開課維護
            </button>
            <button
              onClick={() => onSelectTab('admin-import')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-bold ${
                currentTab === 'admin-import' ? 'bg-primary text-white' : 'text-text-muted'
              }`}
            >
              匯入課查輸出
            </button>
            <button
              onClick={() => onSelectTab('admin-users')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-bold ${
                currentTab === 'admin-users' ? 'bg-primary text-white' : 'text-text-muted'
              }`}
            >
              帳號管理
            </button>
            <button
              onClick={() => onSelectTab('admin-analytics')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-bold ${
                currentTab === 'admin-analytics' ? 'bg-primary text-white' : 'text-text-muted'
              }`}
            >
              選課監控
            </button>
            <button
              onClick={() => onSelectTab('search-courses')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-bold text-secondary`}
            >
              學生選課視角
            </button>
          </div>
        )}
      </header>
    </>
  );
};
