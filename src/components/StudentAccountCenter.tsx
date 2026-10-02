import React, { useState } from 'react';
import { UserAccount, StudentProfile, Course } from '../types';

interface StudentAccountCenterProps {
  currentUser: UserAccount;
  student: StudentProfile;
  scheduleCourses: Course[];
  cartCourses: Course[];
  onUpdateUser: (updatedUser: UserAccount) => void;
  onUpdateStudent: (updatedStudent: StudentProfile) => void;
  onOpenLogin: () => void;
  onNavigateTab: (tab: any) => void;
  onSwitchToAdmin: () => void;
  showToast: (msg: string) => void;
}

export const StudentAccountCenter: React.FC<StudentAccountCenterProps> = ({
  currentUser,
  student,
  scheduleCourses,
  cartCourses,
  onUpdateUser,
  onUpdateStudent,
  onOpenLogin,
  onNavigateTab,
  onSwitchToAdmin,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'courses' | 'security'>('profile');
  
  // Profile edit form
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '0912-345-678');
  const [department, setDepartment] = useState(currentUser.department);
  const [address, setAddress] = useState('台北市北投區明德路365號 (北護宿舍A棟)');
  const [emergencyContact, setEmergencyContact] = useState('張父 • 0920-111-222');

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserAccount = {
      ...currentUser,
      name,
      email,
      phone,
      department,
    };
    onUpdateUser(updatedUser);

    onUpdateStudent({
      ...student,
      name,
      email,
      phone,
      department,
    });

    showToast('個人帳號與學籍資料已成功儲存更新！');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showToast('請輸入新密碼');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('兩次輸入的新密碼不一致，請重新檢查');
      return;
    }
    showToast('密碼已成功更新！系統已同步更新金鑰');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const totalScheduleCredits = scheduleCourses.reduce((sum, c) => sum + c.credits, 0);
  const totalCartCredits = cartCourses.reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-20">
      {/* Student Banner Card */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-primary-container to-secondary text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border-2 border-white/40 text-3xl font-bold shadow-lg">
                {currentUser.name.slice(0, 1)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary-fixed border-2 border-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-on-secondary-fixed">check</span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {currentUser.name}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-xs font-bold shadow-xs">
                  學生身分 (在學良好)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-primary-fixed-dim mt-1 font-mono">
                學號：{currentUser.studentId || currentUser.username} • {currentUser.department}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">mail</span>
                  <span className="font-mono">{currentUser.email}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">phone</span>
                  <span className="font-mono">{currentUser.phone || '0912-345-678'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center sm:flex-col gap-2 shrink-0">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-white/20"
            >
              <span className="material-symbols-outlined text-[16px]">switch_account</span>
              <span>切換/登入其他帳號</span>
            </button>
            <button
              onClick={onSwitchToAdmin}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="切換至教務處課務管理員視角"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>進入教務課務管理後台</span>
            </button>
          </div>
        </div>

        {/* 4 Academic Mini Badges */}
        <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 text-center">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <div className="text-[11px] text-white/70">學業累積 GPA</div>
            <div className="text-lg font-bold text-secondary-fixed mt-0.5">{student.gpa.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <div className="text-[11px] text-white/70">全班歷年排名</div>
            <div className="text-lg font-bold text-white mt-0.5">{student.rank}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <div className="text-[11px] text-white/70">正式排定學分</div>
            <div className="text-lg font-bold text-white mt-0.5">{totalScheduleCredits} 學分</div>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <div className="text-[11px] text-white/70">預選模擬志願</div>
            <div className="text-lg font-bold text-white mt-0.5">{cartCourses.length} 門 ({totalCartCredits} 學分)</div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-border-subtle bg-surface-card rounded-t-2xl px-3 sm:px-6 pt-2 shadow-xs gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>個人帳號與基本資料</span>
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'academic'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">school</span>
          <span>學籍與選課權益</span>
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'courses'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">auto_stories</span>
          <span>我的選課與模擬紀錄</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'security'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">security</span>
          <span>帳號安全與密碼</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-surface-card rounded-b-2xl p-6 shadow-sm border border-t-0 border-border-subtle">
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-3xl">
            <div>
              <h3 className="font-bold text-base text-primary mb-1">基本聯絡與學籍身分資料</h3>
              <p className="text-xs text-text-muted">
                更新您的校園個人資訊，此聯絡資訊將用於選課抽籤通知與開學行事曆推播
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">學生姓名</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">學號 (系統帳號)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.studentId || currentUser.username}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-container-low text-text-muted text-sm font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">所屬院系與班級</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">學籍身分狀態</label>
                <div className="px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-container-low text-xs font-semibold text-secondary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>在學中（四技三年級 • 具備正式選課抽籤權限）</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">電子郵件 (Email)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">聯絡手機號碼</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">通訊住址 / 宿舍床位</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">緊急聯絡人資訊</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>儲存基本資料變更</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Academic Progress & Bidding Rights */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-base text-primary mb-1">學籍狀態與選課權益審查</h3>
              <p className="text-xs text-text-muted">
                教務處 113-2 最新核定修業指標、優先選課權重與微學程認證狀態
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-border-subtle">
                <div className="text-xs text-text-muted flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">military_tech</span>
                  <span>選課抽籤優先權等</span>
                </div>
                <div className="text-xl font-bold text-primary mt-2">甲級 (權重 1.2x)</div>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  三年級以上、前學期無逾期未繳費或記過紀錄，享專業選修抽籤優先加權。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-border-subtle">
                <div className="text-xs text-text-muted flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">credit_card</span>
                  <span>學分選修上下限</span>
                </div>
                <div className="text-xl font-bold text-secondary mt-2">9 ~ 25 學分</div>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  目前已正式選入 {totalScheduleCredits} 學分，符合每學期法定門檻規範。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-border-subtle">
                <div className="text-xs text-text-muted flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-amber-600">verified</span>
                  <span>先修課程鏈檢驗</span>
                </div>
                <div className="text-xl font-bold text-amber-600 mt-2">全數及格通過</div>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  《物件導向程式設計》、《資料庫管理系統》均達及格標準，無選課阻擋。
                </p>
              </div>
            </div>

            {/* Micro-Degree Card */}
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/15">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                    已核定修讀微學程
                  </span>
                  <h4 className="font-bold text-base text-primary mt-1">醫療資訊與智慧照護微學程</h4>
                  <p className="text-xs text-text-muted">跨系整合學程：資管系 + 護理學院合辦</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-muted">學分修讀進度</div>
                  <div className="text-xl font-bold font-mono text-primary">
                    {student.microDegreeCredits} / {student.microDegreeTarget} 學分
                  </div>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-border-subtle mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(student.microDegreeCredits / student.microDegreeTarget) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-text-muted mt-2">
                <span>尚餘 7 學分可取得證書</span>
                <button
                  onClick={() => onNavigateTab('search-courses')}
                  className="text-primary font-bold hover:underline"
                >
                  搜尋學程推薦選修課程 →
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => onNavigateTab('graduation-audit')}
                className="px-5 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-sm hover:bg-secondary/90 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>查看完整畢業學分審查表 (128 學分)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Current Course Lists */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-primary mb-1">我的已選與模擬選課清單</h3>
                <p className="text-xs text-text-muted">目前學期正式排定與預選課工作台志願佇列</p>
              </div>
              <button
                onClick={() => onNavigateTab('simulation-cart')}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-container flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>前往預選課工作台</span>
              </button>
            </div>

            {/* Official Schedule Courses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">event_available</span>
                  <span>113-2 正式排定週課表 ({scheduleCourses.length} 門，共 {totalScheduleCredits} 學分)</span>
                </span>
                <button
                  onClick={() => onNavigateTab('my-schedule')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  檢視週課表格子圖 →
                </button>
              </div>

              <div className="space-y-2">
                {scheduleCourses.map(course => (
                  <div
                    key={course.id}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">{course.name}</span>
                        <span className="font-mono text-primary font-bold">({course.id})</span>
                        <span className="px-2 py-0.2 rounded bg-surface-container text-text-muted font-semibold">
                          {course.category}
                        </span>
                      </div>
                      <div className="text-text-muted mt-1">
                        {course.teacher} • {course.timeStr} • {course.location}
                      </div>
                    </div>
                    <span className="font-bold text-primary font-mono text-sm">
                      {course.credits} 學分
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Cart Courses */}
            <div className="pt-2">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1 mb-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600">auto_awesome</span>
                <span>預選課工作台志願佇列 ({cartCourses.length} 門)</span>
              </span>

              <div className="space-y-2">
                {cartCourses.map(course => (
                  <div
                    key={course.id}
                    className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-on-surface">{course.name}</div>
                      <div className="text-text-muted mt-0.5">
                        {course.teacher} • {course.timeStr} • {course.location}
                      </div>
                    </div>
                    <span className="font-bold text-secondary font-mono">
                      {course.credits} 學分
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-bold text-base text-primary mb-1">帳號密碼與登入安全</h3>
              <p className="text-xs text-text-muted">
                維護北護單一入口網帳號之安全性與存取金鑰
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">目前原密碼</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="請輸入現行密碼"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">設定新密碼</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="至少 6 位數英數組合"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">確認新密碼</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="再次輸入新密碼"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-container flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  <span>變更並儲存新密碼</span>
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-border-subtle">
              <h4 className="font-bold text-xs text-on-surface mb-2">最近登入裝置與稽核紀錄</h4>
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle text-xs space-y-1">
                <div className="flex justify-between font-bold text-on-surface">
                  <span>目前登入裝置：Web 瀏覽器</span>
                  <span className="text-secondary">連線中</span>
                </div>
                <div className="text-text-muted font-mono text-[11px]">
                  登入時間：{currentUser.lastLogin} • IP: 140.131.110.88 (石牌校本部)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
