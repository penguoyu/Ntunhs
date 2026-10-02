import React, { useState } from 'react';
import { Course } from '../types';

interface CampusGisProps {
  targetCourse?: Course | null;
  onViewCourseDetail?: (course: Course) => void;
  onBack: () => void;
  showToast: (msg: string) => void;
}

export const CampusGis: React.FC<CampusGisProps> = ({
  targetCourse,
  onViewCourseDetail,
  onBack,
  showToast,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<'2F' | '3F' | '4F'>('4F');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isArActive, setIsArActive] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const startNavigation = () => {
    setIsArActive(true);
  };

  const handleSubscribeSSE = () => {
    setIsSubscribed(!isSubscribed);
    showToast(isSubscribed ? '已取消名額候補推播通知' : '已開啟 SSE 實時名額遞補推播！有釋出名額將以簡訊與 App 即時通知');
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-20">
      {/* Top Ambient Campus Context Banner */}
      <div className="px-2 pt-2 pb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs">
            <span className="material-symbols-outlined text-[15px]">explore</span>
            <span>北護校本部 • 石牌校區 GIS</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>即時推播已連線 (80ms)</span>
          </div>
        </div>

        <div className="mt-1">
          <h2 className="font-bold text-xl sm:text-2xl text-primary tracking-tight">校園 GIS 趕課導航</h2>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            學思樓 F401 臨床示範階梯教室 • 護理學院核心模擬教學大樓
          </p>
        </div>
      </div>

      {/* Inter-building Transit Calculator Card (Transit ETA) */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border-subtle mb-5">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 text-primary font-bold text-xs sm:text-sm">
            <span className="material-symbols-outlined text-[18px]">transfer_within_a_station</span>
            <span>換教室步行評估 (Transit ETA)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
            餘裕安全
          </span>
        </div>

        {/* Origin -> Destination Visual Flow */}
        <div className="mt-3.5 bg-surface-container-low rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2 border border-border-subtle">
          {/* Origin */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shrink-0 text-xs font-bold">
              起
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-text-muted">上一節 10:00 畢</div>
              <div className="font-bold text-xs sm:text-sm text-on-surface truncate">文教 B302</div>
              <div className="text-[11px] text-text-muted truncate">內外科護理學</div>
            </div>
          </div>

          {/* Transit Time Flow */}
          <div className="flex flex-col items-center px-2 shrink-0">
            <span className="text-xs font-bold text-secondary">4 分鐘</span>
            <div className="flex items-center text-secondary">
              <span className="material-symbols-outlined text-[18px] animate-pulse">east</span>
            </div>
            <span className="text-[10px] text-text-muted">約 220m</span>
          </div>

          {/* Destination */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
            <div className="min-w-0">
              <div className="text-[10px] text-text-muted">下一節 10:10 始</div>
              <div className="font-bold text-xs sm:text-sm text-primary truncate">學思 F401</div>
              <div className="text-[11px] text-text-muted truncate">OSCE 臨床模擬</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-xs font-bold">
              訖
            </div>
          </div>
        </div>

        {/* Status Callout & Smart Weather Tip */}
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-start gap-2 text-text-secondary">
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
              check_circle
            </span>
            <p>
              <strong className="text-on-surface font-bold">綠色安全：</strong>課間休息共 10
              分鐘，步行僅需 4 分鐘，抵達後尚餘 6 分鐘可簽到更換實習衣物。
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-general-sky shrink-0">wb_twilight</span>
            <span className="flex-1">
              天候指南：今日紫外線強，推薦走 <strong className="text-primary font-bold">2F 樂育連通天橋</strong>{' '}
              穿廊，全程無障礙且避開烈日與突發降雨。
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 2.5D Campus Vector GIS Section */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-primary">
            <span className="material-symbols-outlined text-[18px]">apartment</span>
            <span>校園立體俯瞰與室內導航圖</span>
          </div>
          {/* Floor selection tabs */}
          <div className="flex items-center gap-1 bg-surface-container rounded-full p-1 border border-border-subtle">
            {(['2F', '3F', '4F'] as const).map(f => (
              <button
                key={f}
                onClick={() => {
                  setSelectedFloor(f);
                  showToast(`已切換至學思樓 ${f} 室內動線透視圖`);
                }}
                className={`px-3 py-0.5 rounded-full text-xs font-bold transition-all ${
                  selectedFloor === f
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-muted hover:text-on-surface'
                }`}
              >
                {f === '4F' ? '4F 教室' : f === '2F' ? '2F 穿廊' : '3F'}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas Container */}
        <div className="relative w-full h-84 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-800">
          {/* Vector Stylized Campus Map SVG */}
          <svg
            className="w-full h-full object-cover select-none transition-transform duration-300"
            style={{ transform: `scale(${zoomLevel})` }}
            viewBox="0 0 400 320"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f2b26" />
                <stop offset="100%" stopColor="#071b17" />
              </linearGradient>
              <filter id="glowF401" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Campus Grounds */}
            <rect width="400" height="320" fill="url(#grassGrad)" />

            {/* Walkway Roads */}
            <path d="M-20 160 Q 150 150, 420 170" fill="none" stroke="#334155" strokeWidth="26" />
            <path d="M 120 -10 L 140 330" fill="none" stroke="#334155" strokeWidth="20" />
            <path d="M 280 20 L 260 330" fill="none" stroke="#334155" strokeWidth="18" />

            {/* 2F Skybridge Connector */}
            <path
              d="M 110 80 L 220 80"
              fill="none"
              stroke="#006b5f"
              strokeWidth="6"
              strokeDasharray={selectedFloor === '2F' ? 'none' : '4 2'}
            />
            <text x="140" y="74" fill="#71f8e4" fontSize="8" fontWeight="600" fontFamily="Inter">
              2F 天橋走廊
            </text>

            {/* Building B: 文教大樓 (Origin) */}
            <g
              className="cursor-pointer group"
              onClick={() => showToast('文教大樓 B302 內外科護理學研究室 (出發點)')}
            >
              <polygon points="40,65 110,65 110,125 40,125" fill="#09131f" opacity="0.6" />
              <polygon points="40,55 110,55 110,65 40,65" fill="#132c45" />
              <polygon points="110,55 118,48 118,118 110,125" fill="#0f243a" />
              <polygon points="40,55 110,55 118,48 48,48" fill="#1b4965" />
              <rect x="42" y="58" width="66" height="64" rx="4" fill="#1e3a5f" />
              <text x="75" y="88" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
                文教大樓
              </text>
              <text x="75" y="103" textAnchor="middle" fill="#a0c9ff" fontSize="9">
                B 棟 (3F)
              </text>
            </g>

            {/* Building F: 學思樓 (Destination) */}
            <g
              className="cursor-pointer group"
              onClick={() => showToast('學思樓 F401 臨床技能中心已聚焦！')}
            >
              <polygon points="220,55 310,55 310,135 220,135" fill="#09131f" opacity="0.6" />
              <polygon points="220,40 310,40 310,55 220,55" fill="#00355f" />
              <polygon points="310,40 322,30 322,120 310,135" fill="#072942" />
              <polygon points="220,40 310,40 322,30 232,30" fill="#2d6197" />
              <rect x="220" y="48" width="90" height="84" rx="6" fill="#0f4c81" />
              <text x="265" y="82" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                學思樓 (F棟)
              </text>
              <text x="265" y="98" textAnchor="middle" fill="#ffddb8" fontSize="9.5" fontWeight="600">
                OSCE 臨床模擬
              </text>
              <rect x="238" y="106" width="54" height="16" rx="8" fill="#00201c" />
              <text x="265" y="117" textAnchor="middle" fill="#71f8e4" fontSize="8" fontWeight="700">
                目標 4F
              </text>
            </g>

            {/* Other Buildings for spatial campus context */}
            {/* 親仁樓 */}
            <rect x="50" y="200" width="80" height="75" rx="5" fill="#1e293b" opacity="0.9" />
            <text x="90" y="240" textAnchor="middle" fill="#94a3b8" fontSize="10">
              親仁樓
            </text>
            <text x="90" y="254" textAnchor="middle" fill="#64748b" fontSize="8">
              行政 / 護理系所
            </text>

            {/* 樂育樓 */}
            <rect x="160" y="215" width="85" height="65" rx="5" fill="#1e293b" opacity="0.9" />
            <text x="202" y="250" textAnchor="middle" fill="#94a3b8" fontSize="10">
              樂育樓
            </text>
            <text x="202" y="264" textAnchor="middle" fill="#64748b" fontSize="8">
              健管資訊學院
            </text>

            {/* 體育健康大樓 */}
            <rect x="290" y="195" width="80" height="85" rx="5" fill="#1e293b" opacity="0.9" />
            <text x="330" y="235" textAnchor="middle" fill="#94a3b8" fontSize="10">
              體育健康大樓
            </text>
            <text x="330" y="250" textAnchor="middle" fill="#64748b" fontSize="8">
              水療 / 健身中心
            </text>

            {/* Animated Walking Route */}
            <path
              d="M 85 95 C 120 95, 130 80, 180 80 S 230 75, 255 75"
              fill="none"
              stroke="#4fdbc8"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="6 4"
              className="animate-pulse"
            />
            {/* Directional Arrows */}
            <polygon points="160,77 168,80 160,83" fill="#4fdbc8" />
            <polygon points="215,74 223,77 215,80" fill="#4fdbc8" />

            {/* Start Pin: B302 */}
            <g transform="translate(85, 95)">
              <circle r="10" fill="#006b5f" opacity="0.4" className="animate-ping" />
              <circle r="6" fill="#006b5f" />
              <circle r="2.5" fill="#ffffff" />
            </g>

            {/* Destination Pin: F401 */}
            <g transform="translate(255, 75)" filter="url(#glowF401)">
              <circle r="14" fill="#8ebdf9" opacity="0.4" className="animate-ping" />
              <circle r="8" fill="#00355f" />
              <circle r="4" fill="#ffb95f" />
            </g>
          </svg>

          {/* Compass & Overlay Controls */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim">navigation</span>
              <span>北方朝上 • 3D 視角</span>
            </div>
          </div>

          {/* Zoom Buttons */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 1.8))}
              className="w-8 h-8 rounded-lg bg-black/60 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all"
              aria-label="放大"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}
              className="w-8 h-8 rounded-lg bg-black/60 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all"
              aria-label="縮小"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="w-8 h-8 rounded-lg bg-black/60 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all"
              aria-label="重設視角"
            >
              <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
            </button>
          </div>

          {/* Location Pin Legend Card */}
          <div className="absolute bottom-3 left-3 bg-surface-card/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2 border border-border-subtle">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="text-xs text-text-secondary">出發 B302</span>
            </div>
            <span className="text-text-muted text-[10px]">➔</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
              <span className="text-xs font-bold text-primary">學思 F401 (4F)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time High Concurrency Bidding & Quota Live Card */}
      <div className="bg-surface-container rounded-2xl p-4 sm:p-5 mb-5 border border-border-subtle">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">notifications_active</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-on-surface">
                  內外科護理學(二) 臨床加退選即時名額
                </span>
                <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                  高併發熱門
                </span>
              </div>
              <div className="text-xs text-text-muted mt-0.5">課號：NUR3012 • 授課教師：陳素珍 特聘副教授</div>
            </div>
          </div>
        </div>

        {/* Live Counter Box */}
        <div className="mt-3 p-3.5 rounded-xl bg-surface-card flex items-center justify-between border border-border-subtle">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted">即時剩餘名額 (SSE 實時推播)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-bold text-2xl sm:text-3xl text-primary">2</span>
              <span className="text-xs text-text-secondary">/ 60 席</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-text-muted">您的候補排序</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-bold text-lg sm:text-xl text-secondary">#3</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                有望遞補
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-xs px-1">
          <span className="flex items-center gap-1 text-text-muted">
            <span className="material-symbols-outlined text-[15px] text-secondary">sync</span>
            最後更新：剛剛 (同步自教務選課引擎 80ms)
          </span>
          <button
            onClick={handleSubscribeSSE}
            className="text-primary font-bold hover:underline"
          >
            {isSubscribed ? '已訂閱推播' : '訂閱推播'}
          </button>
        </div>
      </div>

      {/* Classroom Space Specs & Clinical Equipment */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border-subtle mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">meeting_room</span>
            <h3 className="font-bold text-sm sm:text-base text-on-surface">
              學思樓 F401 空間規格與臨床設備
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container text-text-secondary font-semibold">
            容納 60 人
          </span>
        </div>

        {/* Facilities list */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">personal_injury</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-on-surface">高階生理模擬假人 (SimMan 3G Plus)</div>
              <div className="text-text-muted text-[11px]">配備臨床生命徵象反饋、無線即時生理監視器控制台</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-general-sky shrink-0">
              <span className="material-symbols-outlined text-[18px]">tv_gen</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-on-surface">智慧多螢幕投影 & 雙向視訊示範錄播</div>
              <div className="text-text-muted text-[11px]">
                OSCE 考站專用 4 鏡頭錄影評估、分組協作副螢幕 6 組
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-conflict-danger shrink-0">
              <span className="material-symbols-outlined text-[18px]">medical_services</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-on-surface">標準重症急救醫療車 (Crash Cart)</div>
              <div className="text-text-muted text-[11px]">
                模擬除顫儀 AED/Defibrillator、臨床無菌耗材備品庫
              </div>
            </div>
          </div>
        </div>

        {/* Daily Classroom Schedule */}
        <div className="mt-4 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-primary">今日教室課表時段 (Today's Schedule)</span>
            <span className="text-[11px] text-text-muted">星期二</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-muted w-20">08:10-10:00</span>
                <span>基礎醫學實作實驗 (第 1-2 節)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-text-muted">已結束</span>
            </div>

            <div className="p-2.5 rounded-xl bg-primary-fixed/40 flex items-center justify-between text-primary font-bold border border-primary/20">
              <div className="flex items-center gap-2">
                <span className="w-20">10:10-12:00</span>
                <span>內外科護理學 OSCE 模擬 (第 3-4 節)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary text-white">進行中 / 趕課</span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-muted w-20">13:30-15:20</span>
                <span>重症護理情境模擬工作坊 (第 5-6 節)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-text-secondary">
                即將開始
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-muted w-20">15:30-17:20</span>
                <span>產兒科護理示範評量 (第 7-8 節)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-text-secondary">預定</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Pinned Action Bar */}
      <div className="sticky bottom-20 xl:bottom-6 z-40 bg-surface-card/95 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-xl border border-border-subtle flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-1/3 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs sm:text-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>返回課程</span>
        </button>
        <button
          onClick={startNavigation}
          className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">view_in_ar</span>
          <span>開啟 AR 實景步行導航</span>
        </button>
      </div>

      {/* AR Walkthrough Simulated Overlay Modal */}
      {isArActive && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in">
          {/* Top HUD */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
              <span className="text-xs font-bold">AR 導航：文教 2F 天橋 ➔ 學思樓 F401</span>
            </div>
            <button
              onClick={() => setIsArActive(false)}
              className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Center AR Compass / Ground Path Visual */}
          <div className="flex flex-col items-center justify-center text-center text-white my-auto space-y-4">
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-secondary-fixed flex items-center justify-center animate-spin">
              <span className="material-symbols-outlined text-[48px] text-secondary-fixed">navigation</span>
            </div>
            <div>
              <h3 className="font-bold text-xl sm:text-2xl text-secondary-fixed">直行 85 公尺後右轉 2F 空橋</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm">
                請保持相機平視前方，跟隨地面虛擬綠色護理箭頭航標，預計 3 分鐘內抵達學思樓 F401 階梯教室。
              </p>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 block">剩餘步行距離</span>
              <span className="font-bold text-lg text-white">180 公尺 (約 2 分鐘)</span>
            </div>
            <button
              onClick={() => {
                setIsArActive(false);
                showToast('已完成抵達打卡！學思樓 F401 簽到完成');
              }}
              className="px-5 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs sm:text-sm shadow-md"
            >
              我已抵達教室
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
