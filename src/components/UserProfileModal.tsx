import React, { useState } from 'react';
import { UserAccount, StudentProfile } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  student: StudentProfile;
  onUpdateUser: (updatedUser: UserAccount) => void;
  onUpdateStudent?: (updatedStudent: StudentProfile) => void;
  showToast: (msg: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  student,
  onUpdateUser,
  onUpdateStudent,
  showToast,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '0912-345-678');
  const [department, setDepartment] = useState(currentUser.department);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'history'>('profile');

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserAccount = {
      ...currentUser,
      name,
      email,
      phone,
      department,
    };
    onUpdateUser(updated);

    if (currentUser.role === 'student' && onUpdateStudent) {
      onUpdateStudent({
        ...student,
        name,
        email,
        phone,
        department,
      });
    }

    showToast('個人帳號資料已成功儲存更新！');
    onClose();
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
    showToast('密碼已成功更新！下次登入請使用新密碼');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-surface-card rounded-3xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Card */}
        <div className="p-6 pb-5 bg-gradient-to-r from-primary to-primary-container text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 text-2xl font-bold shadow-md">
              {currentUser.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-white">{currentUser.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-emerald-400 text-emerald-950'
                }`}>
                  {currentUser.role === 'admin' ? '系統/課程管理者' : '在校學生'}
                </span>
              </div>
              <p className="text-xs text-primary-fixed-dim mt-1 font-mono">
                {currentUser.role === 'student' ? `學號：${currentUser.studentId || currentUser.username}` : `工號帳號：${currentUser.username}`} • {currentUser.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors relative z-10"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border-subtle bg-surface-container-low px-6">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors mr-6 ${
              activeSubTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span>基本帳號資料</span>
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors mr-6 ${
              activeSubTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">security</span>
            <span>密碼與安全</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>系統登入紀錄</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeSubTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    使用者全名
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    系統登入帳號
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.username}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-container-low text-text-muted text-sm font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  所屬系所 / 單位
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    聯絡 Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    聯絡電話 / 手機
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Status Ribbon */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <span className="font-bold text-on-surface">帳號狀態：</span>
                  <span className="text-secondary font-semibold">
                    {currentUser.status === 'active' ? '正常在學 / 在職中' : '帳號受限'}
                  </span>
                </div>
                <div className="text-text-muted">
                  註冊日期：{currentUser.createdAt}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-border-subtle hover:bg-surface-container text-xs font-bold transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>儲存個人設定</span>
                </button>
              </div>
            </form>
          )}

          {activeSubTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  目前密碼
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="輸入原密碼"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    新密碼
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="至少 6 位數英數組合"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    確認新密碼
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="再次輸入新密碼"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-xs text-primary">
                <span className="font-bold">安全提醒：</span>
                北護單一簽入系統建議每學期定期更換密碼，保障校務選課與個人隱私安全。
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  <span>變更並更新密碼</span>
                </button>
              </div>
            </form>
          )}

          {activeSubTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs text-text-muted">
                以下列出此帳號最近的登入連線紀錄（系統自動稽核）：
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">devices</span>
                    <div>
                      <div className="font-bold text-on-surface">目前裝置（Web 瀏覽器）</div>
                      <div className="text-text-muted font-mono text-[11px]">IP: 140.131.110.88 (石牌校本部)</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold text-[10px]">
                    連線中
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-text-muted text-[18px]">smartphone</span>
                    <div>
                      <div className="font-bold text-on-surface">北護行動 App (iOS)</div>
                      <div className="text-text-muted font-mono text-[11px]">IP: 211.20.14.92 • 2026-10-01 19:40</div>
                    </div>
                  </div>
                  <span className="text-text-muted text-[10px]">已登出</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
