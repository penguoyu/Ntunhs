import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
  onRegister: (newUser: UserAccount) => void;
  showToast: (msg: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  onLogin,
  onRegister,
  showToast,
}) => {
  const [tab, setTab] = useState<'quick' | 'password' | 'register'>('quick');
  
  // Password login form
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // Register form
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regDepartment, setRegDepartment] = useState('資訊管理系 四技三年級');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');

  if (!isOpen) return null;

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const query = usernameInput.trim().toLowerCase();
    const matched = users.find(
      u => u.username.toLowerCase() === query || u.email.toLowerCase() === query || (u.studentId && u.studentId === query)
    );

    if (!matched) {
      showToast('查無此帳號！請確認學號、工號或 Email 是否正確');
      return;
    }

    if (matched.status === 'suspended') {
      showToast('此帳號目前已停用，請聯繫教務處管理員 (分機 2210)');
      return;
    }

    onLogin(matched);
    showToast(`歡迎回來，${matched.name} (${matched.role === 'admin' ? '課程管理員' : '學生'})！`);
    onClose();
  };

  const handleQuickLogin = (user: UserAccount) => {
    if (user.status === 'suspended') {
      showToast('此帳號已停用，無法登入');
      return;
    }
    onLogin(user);
    showToast(`已切換身分為：${user.name} (${user.role === 'admin' ? '課程管理員' : '學生'})`);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      showToast('請填寫完整姓名與 Email');
      return;
    }

    const newId = `usr_${Date.now()}`;
    const newUser: UserAccount = {
      id: newId,
      username: regStudentId.trim() || `user_${Date.now().toString().slice(-4)}`,
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      department: regDepartment,
      studentId: regRole === 'student' ? regStudentId.trim() || undefined : undefined,
      phone: '0900-000-000',
      status: 'active',
      lastLogin: '剛剛',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onRegister(newUser);
    onLogin(newUser);
    showToast(`註冊成功！歡迎加入北護課程系統，${newUser.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-surface-card rounded-3xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-6 pb-4 bg-primary text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20">
              <span className="material-symbols-outlined text-[28px]">lock_person</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">北護單一入口認證登入</h3>
              <p className="text-xs text-primary-fixed-dim mt-0.5">
                國立臺北護理健康大學 • 課程管理與選課系統
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

        {/* Tab Selection */}
        <div className="flex border-b border-border-subtle bg-surface-container-low px-4 pt-2">
          <button
            onClick={() => setTab('quick')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'quick'
                ? 'border-primary text-primary bg-surface-card rounded-t-xl shadow-xs'
                : 'border-transparent text-text-muted hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>快速角色體驗</span>
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'password'
                ? 'border-primary text-primary bg-surface-card rounded-t-xl shadow-xs'
                : 'border-transparent text-text-muted hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
            <span>帳號密碼登入</span>
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'register'
                ? 'border-primary text-primary bg-surface-card rounded-t-xl shadow-xs'
                : 'border-transparent text-text-muted hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>註冊新帳號</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {tab === 'quick' && (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-primary">
                <span className="font-bold">💡 評估演示專用：</span>
                點擊下方預設角色即可瞬間登入，立即體驗「課程管理者」全功能或「學生」選課模擬！
              </div>

              {/* Course Administrators section */}
              <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">admin_panel_settings</span>
                  <span>課程管理者權限 (Admin)</span>
                </div>
                <div className="space-y-2">
                  {users
                    .filter(u => u.role === 'admin')
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleQuickLogin(u)}
                        className="w-full text-left p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-border-subtle hover:border-primary/40 transition-all flex items-center justify-between group active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                                {u.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                課程管理者
                              </span>
                            </div>
                            <div className="text-xs text-text-muted mt-0.5">
                              {u.department} • 具備匯入、新增、修改、刪除、帳號管理權限
                            </div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5">
                          arrow_forward
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Students section */}
              <div className="pt-2">
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">school</span>
                  <span>學生選課身分 (Student)</span>
                </div>
                <div className="space-y-2">
                  {users
                    .filter(u => u.role === 'student' && u.status === 'active')
                    .map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleQuickLogin(u)}
                        className="w-full text-left p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-border-subtle hover:border-secondary/40 transition-all flex items-center justify-between group active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-on-surface group-hover:text-secondary transition-colors">
                                {u.name}
                              </span>
                              <span className="text-xs text-text-muted font-mono">
                                ({u.studentId})
                              </span>
                            </div>
                            <div className="text-xs text-text-muted mt-0.5">
                              {u.department} • 課程查詢、志願排程、預選課模擬
                            </div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-text-muted group-hover:text-secondary transition-transform group-hover:translate-x-0.5">
                          arrow_forward
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  校園帳號 / 學號 / 教職員工號 / Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
                    account_circle
                  </span>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder="例如: admin 或 11124026 或 Email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  管理者預設帳號: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">admin</code>，學生帳號: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">11124026</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  密碼
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
                    lock
                  </span>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="請輸入密碼 (預設任意輸入即可通過)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-1.5 text-text-muted cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded accent-primary" />
                  <span>記住此裝置登入狀態</span>
                </label>
                <button
                  type="button"
                  onClick={() => showToast('請洽教務處資訊組重設密碼')}
                  className="text-primary hover:underline"
                >
                  忘記密碼？
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>驗證並登入系統</span>
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  帳號類型 / 角色權限
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('student')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      regRole === 'student'
                        ? 'border-secondary bg-secondary/10 text-secondary'
                        : 'border-border-subtle bg-surface-bg text-text-muted hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    <span>學生 (選課/模擬)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      regRole === 'admin'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border-subtle bg-surface-bg text-text-muted hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">shield_person</span>
                    <span>課程管理者 (CRUD/匯入)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">姓名</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="例如: 陳怡君"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {regRole === 'student' ? '學號' : '教職員編號'}
                  </label>
                  <input
                    type="text"
                    value={regStudentId}
                    onChange={e => setRegStudentId(e.target.value)}
                    placeholder={regRole === 'student' ? '11124099' : 'EMP9901'}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">所屬院系 / 單位</label>
                <select
                  value={regDepartment}
                  onChange={e => setRegDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                >
                  <option value="資訊管理系 四技三年級">資訊管理系 (IM)</option>
                  <option value="護理系 四年級">護理系 (NUR)</option>
                  <option value="健康事業管理系 三年級">健康事業管理系 (HA)</option>
                  <option value="高齡健康照護系 二年級">高齡健康照護系 (LTC)</option>
                  <option value="生死與健康心理諮商系 三年級">生死與健康心理諮商系 (DPC)</option>
                  <option value="語言治療與聽力學系 二年級">語言治療與聽力學系 (SLPA)</option>
                  <option value="運動保健系 三年級">運動保健系 (SPE/EX)</option>
                  <option value="助產及婦女健康照護系">助產及婦女健康照護系 (NMW)</option>
                  <option value="教務處課務組">教務處課務組 (管理職務)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">電子郵件 (Email)</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="name@ntunhs.edu.tw 或 個人信箱"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-secondary text-white font-bold text-sm shadow-md hover:bg-secondary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span>完成註冊並直接登入</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
