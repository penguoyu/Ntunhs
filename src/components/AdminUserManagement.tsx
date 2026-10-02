import React, { useState, useMemo } from 'react';
import { UserAccount, UserRole } from '../types';

interface AdminUserManagementProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  showToast: (msg: string) => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'student'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('cards');

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('student');
  const [formDepartment, setFormDepartment] = useState('資訊管理系 四技三年級');
  const [formStudentId, setFormStudentId] = useState('');
  const [formPhone, setFormPhone] = useState('0912-345-678');
  const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q) ||
          (u.studentId && u.studentId.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && u.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const openAddUser = () => {
    setFormUsername(`111${Math.floor(20000 + Math.random() * 9000)}`);
    setFormName('');
    setFormEmail('');
    setFormRole('student');
    setFormDepartment('護理系 四年級');
    setFormStudentId('');
    setFormPhone('0912-000-000');
    setFormStatus('active');
    setIsAddUserModalOpen(true);
  };

  const openEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormDepartment(user.department);
    setFormStudentId(user.studentId || '');
    setFormPhone(user.phone || '');
    setFormStatus(user.status);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formUsername.trim()) {
      showToast('請完整填寫姓名、帳號與 Email！');
      return;
    }

    if (editingUser) {
      const updated: UserAccount = {
        ...editingUser,
        username: formUsername,
        name: formName,
        email: formEmail,
        role: formRole,
        department: formDepartment,
        studentId: formRole === 'student' ? formStudentId || formUsername : undefined,
        phone: formPhone,
        status: formStatus,
      };
      onUpdateUser(updated);
      showToast(`已更新使用者帳號：${updated.name} (${updated.username})`);
      setEditingUser(null);
    } else {
      const newUser: UserAccount = {
        id: `usr_${Date.now()}`,
        username: formUsername,
        name: formName,
        email: formEmail,
        role: formRole,
        department: formDepartment,
        studentId: formRole === 'student' ? formStudentId || formUsername : undefined,
        phone: formPhone,
        status: formStatus,
        lastLogin: '從未登入',
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddUser(newUser);
      showToast(`已建立新使用者帳號：${newUser.name} (${newUser.username})`);
      setIsAddUserModalOpen(false);
    }
  };

  const handleToggleStatus = (user: UserAccount) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated: UserAccount = {
      ...user,
      status: nextStatus,
    };
    onUpdateUser(updated);
    showToast(`帳號 ${user.name} 狀態已變更為：${nextStatus === 'active' ? '正常啟用' : '暫停使用'}`);
  };

  const handleResetPassword = (user: UserAccount) => {
    showToast(`已寄送密碼重設確認信至 ${user.email}，預設臨時密碼已重置！`);
  };

  const confirmDelete = () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser.id) {
      showToast('無法刪除目前正在登入使用的管理員帳號！');
      setDeletingUser(null);
      return;
    }
    onDeleteUser(deletingUser.id);
    showToast(`已刪除帳號：${deletingUser.name}`);
    setDeletingUser(null);
  };

  return (
    <div className="flex flex-col w-full max-w-[1680px] mx-auto pb-16">
      {/* Top Banner */}
      <section className="w-full bg-surface-card shadow-xs px-6 py-5 mb-6 rounded-2xl border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
              <span>身分與權限控管系統 (RBAC)</span>
            </span>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-xs text-text-muted">全校帳號管理</span>
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight mt-1">
            所有個人帳號管理 (User & Access Control)
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            維護全校學生、教師與課務管理員帳號，控管選課權限、身分狀態與密碼重設
          </p>
        </div>

        <button
          onClick={openAddUser}
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>手動新增帳號</span>
        </button>
      </section>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">group</span>
          </div>
          <div>
            <div className="text-xs text-text-muted">全校總使用者</div>
            <div className="text-2xl font-bold text-primary">{users.length} 位</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
          <div>
            <div className="text-xs text-text-muted">在校學生帳號</div>
            <div className="text-2xl font-bold text-secondary">
              {users.filter(u => u.role === 'student').length} 位
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">shield_person</span>
          </div>
          <div>
            <div className="text-xs text-text-muted">課程管理員</div>
            <div className="text-2xl font-bold text-amber-700">
              {users.filter(u => u.role === 'admin').length} 位
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div>
            <div className="text-xs text-text-muted">正常啟用比例</div>
            <div className="text-2xl font-bold text-emerald-700">
              {Math.round((users.filter(u => u.status === 'active').length / users.length) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-surface-card rounded-2xl p-4 shadow-xs border border-border-subtle mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-text-muted">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋姓名、學號、工號、系所或 Email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs font-semibold"
          >
            <option value="ALL">全部角色 (All Roles)</option>
            <option value="admin">課程管理者 (Admin)</option>
            <option value="student">學生 (Student)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs font-semibold"
          >
            <option value="ALL">全部狀態 (All Status)</option>
            <option value="active">正常啟用 (Active)</option>
            <option value="suspended">已停用 (Suspended)</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewLayout('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewLayout === 'cards'
                  ? 'bg-surface-card text-primary shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
              title="卡片檢視 (適合手機)"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>卡片</span>
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewLayout === 'table'
                  ? 'bg-surface-card text-primary shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
              title="表格檢視"
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>表格</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Master View: Cards or Table */}
      {viewLayout === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const isCurrent = user.id === currentUser.id;
            return (
              <div
                key={user.id}
                className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-xs border border-border-subtle flex flex-col justify-between gap-3 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-xs ${
                      user.role === 'admin'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {user.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-base text-on-surface flex items-center gap-1.5">
                        <span className="truncate">{user.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary text-white font-bold shrink-0">
                            您
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted font-mono truncate">
                        {user.username} {user.studentId ? `(${user.studentId})` : ''}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    user.role === 'admin'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}>
                    {user.role === 'admin' ? '管理者' : '學生'}
                  </span>
                </div>

                <div className="bg-surface-container-low p-2.5 rounded-xl space-y-1 text-xs text-on-surface-variant">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">系所處室：</span>
                    <span className="font-semibold truncate max-w-[180px]">{user.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">電子信箱：</span>
                    <span className="font-mono text-text-muted truncate max-w-[180px]">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">聯絡電話：</span>
                    <span className="font-mono text-text-muted">{user.phone || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    disabled={isCurrent}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    } ${isCurrent ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span>{user.status === 'active' ? '正常啟用' : '已停權'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-primary flex items-center justify-center transition-colors"
                      title="重設密碼"
                    >
                      <span className="material-symbols-outlined text-[17px]">key</span>
                    </button>
                    <button
                      onClick={() => openEditUser(user)}
                      className="w-8 h-8 rounded-lg bg-surface-container hover:bg-primary/10 text-primary flex items-center justify-center transition-colors"
                      title="編輯帳號"
                    >
                      <span className="material-symbols-outlined text-[17px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      disabled={isCurrent}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'text-border-subtle cursor-not-allowed'
                          : 'bg-surface-container hover:bg-rose-100 text-rose-600'
                      }`}
                      title={isCurrent ? '無法刪除自己' : '刪除此帳號'}
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-low text-text-muted font-bold">
                  <th className="py-3 px-4">使用者名稱 / 帳號</th>
                  <th className="py-3 px-4">角色權限</th>
                  <th className="py-3 px-4">所屬系所 / 處室單位</th>
                  <th className="py-3 px-4">聯絡 Email</th>
                  <th className="py-3 px-4">電話</th>
                  <th className="py-3 px-4">狀態</th>
                  <th className="py-3 px-4">最近登入</th>
                  <th className="py-3 px-4 text-center">帳號維護</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredUsers.map(user => {
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <tr key={user.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            user.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {user.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary text-white font-bold">
                                  您
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-muted font-mono">
                              {user.username} {user.studentId ? `(${user.studentId})` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          user.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {user.role === 'admin' ? '課程管理者' : '學生'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-on-surface">
                        {user.department}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-text-muted">
                        {user.email}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-text-muted">
                        {user.phone || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={isCurrent}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          } ${isCurrent ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span>{user.status === 'active' ? '啟用中' : '已停權'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-text-muted font-mono text-[11px]">
                        {user.lastLogin || '從未登入'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-1.5 rounded-lg hover:bg-surface-container text-text-muted hover:text-primary transition-colors"
                            title="重設密碼"
                          >
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>
                          <button
                            onClick={() => openEditUser(user)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            title="修改帳號資料"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-border-subtle cursor-not-allowed'
                                : 'hover:bg-rose-100 text-rose-600'
                            }`}
                            title={isCurrent ? '無法刪除自己' : '刪除此帳號'}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {(isAddUserModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-surface-card rounded-3xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px]">
                  {editingUser ? 'manage_accounts' : 'person_add'}
                </span>
                <h3 className="font-bold text-lg">
                  {editingUser ? `編輯帳號：${editingUser.name}` : '建立新系統帳號'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  帳號權限角色
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('student')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formRole === 'student'
                        ? 'border-secondary bg-secondary/10 text-secondary'
                        : 'border-border-subtle bg-surface-bg text-text-muted hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    <span>學生 (選課/模擬)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formRole === 'admin'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border-subtle bg-surface-bg text-text-muted hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">shield_person</span>
                    <span>課程管理者 (全權限)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    系統登入帳號
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="如: admin 或 學號"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    使用者全名
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="例如: 王小明"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    電子郵件 (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="user@ntunhs.edu.tw"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {formRole === 'student' ? '學號' : '教職員工號'}
                  </label>
                  <input
                    type="text"
                    value={formStudentId}
                    onChange={e => setFormStudentId(e.target.value)}
                    placeholder={formRole === 'student' ? '11124026' : 'EMP2201'}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  所屬系所 / 處室單位
                </label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={e => setFormDepartment(e.target.value)}
                  placeholder="資訊管理系 或 教務處課務組"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">聯絡電話</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="0912-345-678"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">帳號啟用狀態</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs font-bold"
                  >
                    <option value="active">正常啟用 (Active)</option>
                    <option value="suspended">已停用/停權 (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-bold hover:bg-surface-container"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{editingUser ? '確認更新帳號' : '建立帳號'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-card rounded-3xl p-6 shadow-2xl border border-border-subtle">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[28px]">person_remove</span>
            </div>
            <h3 className="font-bold text-lg text-on-surface">確認刪除此使用者帳號？</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              即將刪除帳號：<strong className="text-primary font-bold">{deletingUser.name}</strong> ({deletingUser.username})。
              該帳號的選課記錄、排程模擬與個人設定將一併移除，此動作無法復原。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-bold hover:bg-surface-container"
              >
                取消保留
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                確認刪除帳號
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
