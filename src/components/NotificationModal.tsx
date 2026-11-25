import React from 'react';
import { ActiveTab, AppNotification } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

const KIND_STYLE: Record<AppNotification['kind'], { icon: string; color: string }> = {
  success: { icon: 'check_circle', color: 'text-secondary' },
  info: { icon: 'info', color: 'text-primary' },
  warning: { icon: 'warning', color: 'text-amber-600' },
};

const timeAgo = (iso: string) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return '剛剛';
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

/** 通知中心：顯示這位學生在本裝置上的選課、候補與退選紀錄 */
export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, notifications, onClose, onNavigateTab }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface-card w-full max-w-lg rounded-2xl shadow-2xl p-5 border border-border-subtle flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="通知"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            <span>通知</span>
          </div>
          <button
            onClick={onClose}
            aria-label="關閉"
            className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-text-muted hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 && (
            <div className="py-10 text-center text-text-muted text-xs">
              <span className="material-symbols-outlined text-[40px] text-text-muted/50 block mb-2">notifications_off</span>
              目前沒有通知。登記分發、加入候補、遞補或退選時，結果會出現在這裡。
            </div>
          )}
          {notifications.map(n => {
            const st = KIND_STYLE[n.kind];
            return (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-xs ${
                  n.read ? 'bg-surface-container-low border-border-subtle' : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-semibold flex items-center gap-1.5 ${st.color}`}>
                    <span className="material-symbols-outlined text-[16px]">{st.icon}</span>
                    {n.title}
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-label="未讀" />}
                  </span>
                  <span className="text-[11px] text-text-muted whitespace-nowrap">{timeAgo(n.at)}</span>
                </div>
                <p className="text-text-secondary leading-relaxed">{n.desc}</p>
                {n.tab && n.actionText && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateTab(n.tab!);
                      }}
                      className="text-xs font-medium text-general-sky hover:underline flex items-center gap-1"
                    >
                      <span>{n.actionText}</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[11px] text-text-muted">通知只保存在這台裝置（最多 20 則）</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-primary font-medium text-xs"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
