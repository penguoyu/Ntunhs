import React from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: '上課教室異動',
      desc: '下週二 (03/25)《醫療資訊系統與FHIR標準》期中成果展示，原 I502 網路實驗室移至「資科大樓 2 樓國際演講廳」，請提早 5 分鐘抵達。',
      time: '10 分鐘前',
      actionText: '查看週課表',
      tabTarget: 'my-schedule',
    },
    {
      id: 2,
      type: 'info',
      title: '候補順位更新',
      desc: '《重症護理臨床情境模擬》候補順位由第 3 位升至第 2 位。',
      time: '25 分鐘前',
      actionText: '進入模擬工作台',
      tabTarget: 'simulation-cart',
    },
    {
      id: 3,
      type: 'alert',
      title: '通識學分不足',
      desc: '博雅通識社會科學領域尚缺 2 學分，週五《醫學倫理與智慧科技法規》與目前課表不衝堂。',
      time: '2 小時前',
      actionText: '查看學分審查',
      tabTarget: 'graduation-audit',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-card w-full max-w-lg rounded-2xl shadow-2xl p-5 border border-border-subtle flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            <span>通知</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-text-muted hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {notifications.map(n => (
            <div
              key={n.id}
              className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">{n.title}</span>
                <span className="text-[10px] text-text-muted">{n.time}</span>
              </div>
              <p className="text-text-secondary leading-relaxed">{n.desc}</p>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab(n.tabTarget);
                  }}
                  className="text-xs font-bold text-general-sky hover:underline flex items-center gap-1"
                >
                  <span>{n.actionText}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-primary font-bold text-xs"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
