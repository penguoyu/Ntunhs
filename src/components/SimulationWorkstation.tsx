import React, { useState } from 'react';
import { Course } from '../types';

interface SimulationWorkstationProps {
  courses: Course[];
  cart: string[];
  tier1Ids: string[];
  tier2Ids: string[];
  onSetTier1Ids: (ids: string[]) => void;
  onSetTier2Ids: (ids: string[]) => void;
  onRemoveFromCart: (id: string) => void;
  onAddToCart: (id: string) => void;
  onApplyToSchedule: () => void;
  onViewCourseDetail: (course: Course) => void;
  showToast: (msg: string) => void;
}

export const SimulationWorkstation: React.FC<SimulationWorkstationProps> = ({
  courses,
  cart,
  tier1Ids,
  tier2Ids,
  onSetTier1Ids,
  onSetTier2Ids,
  onRemoveFromCart,
  onAddToCart,
  onApplyToSchedule,
  onViewCourseDetail,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'simulation' | 'official' | 'contingency'>('simulation');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasAddedRecommended, setHasAddedRecommended] = useState(false);
  const [highlightedCourseId, setHighlightedCourseId] = useState<string | null>(null);

  const tier1Courses = courses.filter(c => tier1Ids.includes(c.id));
  const tier2Courses = courses.filter(c => tier2Ids.includes(c.id));

  const tier1Credits = tier1Courses.reduce((sum, c) => sum + c.credits, 0);
  const tier2Credits = tier2Courses.reduce((sum, c) => sum + c.credits, 0);
  const totalSimCredits = tier1Credits + (hasAddedRecommended ? 2.0 : 0);

  const moveTier1ToTier2 = (courseId: string) => {
    onSetTier1Ids(tier1Ids.filter(id => id !== courseId));
    if (!tier2Ids.includes(courseId)) {
      onSetTier2Ids([...tier2Ids, courseId]);
    }
    showToast('已將該課程移至備選梯隊 (Tier 2)');
  };

  const moveTier2ToTier1 = (courseId: string) => {
    onSetTier2Ids(tier2Ids.filter(id => id !== courseId));
    if (!tier1Ids.includes(courseId)) {
      onSetTier1Ids([...tier1Ids, courseId]);
    }
    showToast('已升格至第一志願梯隊 (Tier 1)');
  };

  const moveTier1Item = (index: number, direction: 'up' | 'down') => {
    const newArr = [...tier1Ids];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newArr.length) {
      const temp = newArr[index];
      newArr[index] = newArr[targetIdx];
      newArr[targetIdx] = temp;
      onSetTier1Ids(newArr);
    }
  };

  const handleCopyCodes = () => {
    setIsDrawerOpen(true);
  };

  const copySingleCode = (code: string, title: string) => {
    navigator.clipboard?.writeText(code);
    showToast(`選課代號 ${code} (${title}) 已複製！`);
  };

  const copyAllCodes = () => {
    const list = [...tier1Courses, ...tier2Courses].map(c => `${c.code} (${c.name})`).join('\n');
    navigator.clipboard?.writeText(list);
    showToast('已複製所有模擬志願代碼清單，可直接貼上選課系統！');
    setIsDrawerOpen(false);
  };

  const handleValidatePrereqs = () => {
    showToast('【智慧衝堂與先修檢核】全數合規！擋修條件通過，時段 100% 無碰撞。');
  };

  const handleAddRecommended = () => {
    setHasAddedRecommended(true);
    if (!cart.includes('GE2109')) {
      onAddToCart('GE2109');
    }
    showToast('已加入通識試排！《醫學倫理與科技法規》2.0 學分已成功排入週五時段。');
  };

  return (
    <div className="flex flex-col w-full max-w-[1680px] mx-auto pb-16">
      {/* Breadcrumb & Header Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-text-muted text-xs font-semibold">
            <span>校務資訊</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>選課作業</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">113-2 模擬選課工作台</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="font-bold text-xl sm:text-2xl text-primary tracking-tight">
              模擬工作台與志願梯隊決策
            </h1>
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-primary text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              四技資管三甲 即時連動中
            </span>
          </div>
        </div>

        {/* Action Utilities */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleValidatePrereqs}
            className="px-4 py-2 bg-surface-card text-on-surface hover:bg-surface-container-low font-bold text-xs rounded-xl shadow-xs border border-border-subtle flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-general-sky text-[18px]">verified_user</span>
            <span>驗證先修與衝堂</span>
          </button>
          <button
            onClick={handleCopyCodes}
            className="px-4 py-2 bg-surface-card text-on-surface hover:bg-surface-container-low font-bold text-xs rounded-xl shadow-xs border border-border-subtle flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-text-muted text-[18px]">content_copy</span>
            <span>複製選課代碼清單</span>
          </button>
          <button
            onClick={onApplyToSchedule}
            className="px-5 py-2 bg-primary text-white hover:bg-primary-container font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">sync_saved_locally</span>
            <span>一鍵套用模擬課表</span>
          </button>
        </div>
      </div>

      {/* Live Metric Diagnostic Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-card p-4 rounded-2xl shadow-sm border border-border-subtle flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted font-semibold">模擬選入堂數</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-bold text-2xl text-primary">{tier1Ids.length + tier2Ids.length}</span>
              <span className="text-xs text-text-secondary">門課</span>
              <span className="text-[11px] text-text-muted">
                ({tier1Ids.length} 正選 + {tier2Ids.length} 備案)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">bookmark_added</span>
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-2xl shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-semibold">預排學分 / 學期上限</span>
            <span className="text-[11px] text-secondary font-bold">安全裕度 (良好)</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-bold text-2xl text-primary">{totalSimCredits.toFixed(1)}</span>
            <span className="text-xs text-text-muted">/ 25.0 學分</span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-general-sky h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalSimCredits / 25.0) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-2xl shadow-sm border border-border-subtle flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted font-semibold">衝堂防護與檢核</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
              <span className="font-bold text-base text-secondary">零時段碰撞</span>
            </div>
            <span className="text-[11px] text-text-muted">第一志願時段全數獨立</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-fixed/20 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[22px]">security</span>
          </div>
        </div>

        <div className="bg-surface-card p-4 rounded-2xl shadow-sm border border-border-subtle flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted font-semibold">畢業學分審查匹配</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-bold text-2xl text-clinical-purple">18.0</span>
              <span className="text-xs text-text-secondary">學分抵充</span>
            </div>
            <span className="text-[11px] text-conflict-danger font-semibold">
              {hasAddedRecommended ? '通識缺額已排入試選！' : '尚缺 1 門通識法規領域'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-clinical-purple">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
        </div>
      </div>

      {/* Main Dual Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Tiered Priority Lists (xl:col-span-5) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Tier 1: Priority Selection Section */}
          <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-5 bg-primary rounded-full"></span>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-primary">第一志願梯隊 (Tier 1)</h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs">
                    {tier1Courses.length} 門優先排入
                  </span>
                </div>
              </div>
              <span className="text-xs text-text-muted">總計 {tier1Credits.toFixed(1)} 學分</span>
            </div>

            {/* Course items */}
            <div className="flex flex-col gap-3">
              {tier1Courses.map((course, index) => {
                const isHovered = highlightedCourseId === course.id;
                return (
                  <div
                    key={course.id}
                    onMouseEnter={() => setHighlightedCourseId(course.id)}
                    onMouseLeave={() => setHighlightedCourseId(null)}
                    className={`p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-card transition-all shadow-xs border ${
                      isHovered ? 'border-primary ring-2 ring-primary/20' : 'border-border-subtle'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Drag / Order controls */}
                      <div className="flex flex-col items-center justify-center gap-1 text-text-muted shrink-0 pt-0.5">
                        <button
                          onClick={() => moveTier1Item(index, 'up')}
                          disabled={index === 0}
                          className="hover:text-primary disabled:opacity-30 p-0.5"
                          title="往前排序"
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                        </button>
                        <span className="text-xs font-bold text-text-muted">{index + 1}</span>
                        <button
                          onClick={() => moveTier1Item(index, 'down')}
                          disabled={index === tier1Courses.length - 1}
                          className="hover:text-primary disabled:opacity-30 p-0.5"
                          title="往後排序"
                        >
                          <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold px-2 py-0.2 rounded bg-surface-container-high text-primary">
                              {course.code}
                            </span>
                            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-primary-container text-white">
                              {course.category}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-primary">{course.credits} 學分</span>
                        </div>

                        <h4
                          onClick={() => onViewCourseDetail(course)}
                          className="font-bold text-sm text-on-surface truncate cursor-pointer hover:text-primary"
                        >
                          {course.name}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-text-secondary mt-1 flex-wrap">
                          <span className="flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-[14px] text-text-muted">schedule</span>
                            {course.timeStr}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-[14px] text-text-muted">location_on</span>
                            {course.location}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <button
                          onClick={() => moveTier1ToTier2(course.id)}
                          className="p-1 rounded text-text-muted hover:text-conflict-danger hover:bg-surface-container transition-colors"
                          title="移至備選梯隊"
                        >
                          <span className="material-symbols-outlined text-[18px]">low_priority</span>
                        </button>
                        <button
                          onClick={() => onRemoveFromCart(course.id)}
                          className="p-1 rounded text-text-muted hover:text-error hover:bg-surface-container transition-colors"
                          title="從清單移除"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier 2: Contingency Section */}
          <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-5 bg-tertiary-fixed-dim rounded-full"></span>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-on-surface">備選梯隊與衝堂備案 (Tier 2)</h3>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-text-secondary font-bold text-xs">
                    {tier2Courses.length} 門備案
                  </span>
                </div>
              </div>
              <span className="text-xs text-text-muted">{tier2Credits.toFixed(1)} 學分</span>
            </div>

            <div className="flex flex-col gap-3">
              {tier2Courses.map(course => (
                <div
                  key={course.id}
                  className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-card transition-all shadow-xs border border-border-subtle"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[11px] font-bold px-2 py-0.2 rounded bg-surface-container-high text-primary">
                          {course.code}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.2 rounded bg-surface-container text-on-surface">
                          {course.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">casino</span>
                          錄取率 45% (候補 #3)
                        </span>
                      </div>
                      <h4
                        onClick={() => onViewCourseDetail(course)}
                        className="font-bold text-sm text-on-surface truncate cursor-pointer hover:text-primary"
                      >
                        {course.name}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        {course.timeStr} • {course.location} • {course.credits} 學分
                      </p>
                    </div>

                    <button
                      onClick={() => moveTier2ToTier1(course.id)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary hover:text-white text-primary text-xs font-bold transition-all shrink-0 active:scale-95"
                    >
                      升至第一志願
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Academic Audit Recommendation */}
          <div className="relative overflow-hidden bg-gradient-to-r from-surface-container-high via-surface-card to-surface-card p-5 rounded-2xl shadow-sm border-l-4 border-l-clinical-purple border border-border-subtle">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-clinical-purple font-bold text-xs">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  <span>AI 審查畢業缺額推薦</span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-on-surface">
                  醫學倫理與科技法規 (通識向度三)
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  系統偵測您尚缺「社會與法規通識領域 2 學分」。此課程排定於{' '}
                  <strong className="text-primary font-bold">週五 09:10-11:00</strong>
                  ，與現存工作台課程為「零碰撞狀態」，加入後即達成大三通識畢業學分全數通關！
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted">
                  <span>授課教師：高崇民 特約律師</span>
                  <span>開課代碼：1132-9012</span>
                </div>
              </div>

              <button
                onClick={handleAddRecommended}
                disabled={hasAddedRecommended}
                className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 ${
                  hasAddedRecommended
                    ? 'bg-secondary text-white cursor-not-allowed'
                    : 'bg-clinical-purple text-white hover:opacity-90'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {hasAddedRecommended ? 'done' : 'add_circle'}
                </span>
                <span>{hasAddedRecommended ? '已在試排' : '加入試排'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Synchronized Weekly Schedule Preview (xl:col-span-7) */}
        <div className="xl:col-span-7 bg-surface-card rounded-2xl shadow-sm border border-border-subtle p-5 flex flex-col gap-4 sticky top-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-general-sky animate-ping"></span>
              <h3 className="font-bold text-base text-primary">即時連動週課表預覽</h3>
              <span className="text-xs text-text-muted">| 113 學年度第 2 學期</span>
            </div>

            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
              <button
                onClick={() => setViewMode('official')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'official' ? 'bg-surface-card text-primary shadow-xs' : 'text-text-muted'
                }`}
              >
                正式已選
              </button>
              <button
                onClick={() => setViewMode('simulation')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'simulation' ? 'bg-surface-card text-primary shadow-xs' : 'text-text-muted'
                }`}
              >
                模擬預排疊加
              </button>
              <button
                onClick={() => setViewMode('contingency')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'contingency' ? 'bg-surface-card text-primary shadow-xs' : 'text-text-muted'
                }`}
              >
                含備案全檢核
              </button>
            </div>
          </div>

          {/* Color Key Legend */}
          <div className="flex items-center justify-between text-xs text-text-muted flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-primary-container"></span>
                <span>資管必選</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-secondary"></span>
                <span>護理跨域</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-clinical-purple"></span>
                <span>通識推薦</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-tertiary-fixed-dim"></span>
                <span>備案候補</span>
              </div>
            </div>
            <span className="text-[11px] text-general-sky font-semibold">點選課表塊可檢視課堂</span>
          </div>

          {/* Mini Timetable Table for Simulation */}
          <div className="w-full overflow-x-auto rounded-xl border border-border-subtle text-xs">
            <div className="min-w-[500px]">
              {/* Header */}
              <div className="grid grid-cols-6 gap-1 bg-surface-container-low p-2 text-center font-bold text-on-surface">
                <div className="text-text-muted text-[11px]">節次 / 時間</div>
                <div className="py-1 rounded bg-surface-card">週一 (Mon)</div>
                <div className="py-1 rounded bg-surface-card">週二 (Tue)</div>
                <div className="py-1 rounded bg-surface-card">週三 (Wed)</div>
                <div className="py-1 rounded bg-surface-card">週四 (Thu)</div>
                <div className="py-1 rounded bg-surface-card text-primary">週五 (Fri)</div>
              </div>

              {/* Rows */}
              <div className="p-1 space-y-1">
                {/* Period 1 */}
                <div className="grid grid-cols-6 gap-1 min-h-[48px]">
                  <div className="bg-surface-container-low/70 p-1 flex flex-col justify-center items-center text-center rounded">
                    <span className="font-bold text-primary text-[11px]">1</span>
                    <span className="text-[9px] text-text-muted">08:10</span>
                  </div>
                  {/* Mon P1-3: Algorithm */}
                  <div
                    onClick={() => {
                      const c = courses.find(x => x.id === 'CS301');
                      if (c) onViewCourseDetail(c);
                    }}
                    className="row-span-3 bg-primary-container text-white p-2 rounded-lg flex flex-col justify-between shadow-xs cursor-pointer hover:ring-2 hover:ring-general-sky transition-all"
                  >
                    <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded w-fit font-bold">必修 3.0</span>
                    <span className="font-bold text-xs truncate">演算法資料結構</span>
                    <span className="text-[10px] text-white/80">S502 • 林冠宇</span>
                  </div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  {/* Thu P2-4: Health Big Data in Sim */}
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="bg-surface-bg rounded p-1 flex items-center justify-center text-[10px] text-text-muted">
                    自主自習
                  </div>
                </div>

                {/* Period 2 */}
                <div className="grid grid-cols-6 gap-1 min-h-[48px]">
                  <div className="bg-surface-container-low/70 p-1 flex flex-col justify-center items-center text-center rounded">
                    <span className="font-bold text-primary text-[11px]">2</span>
                    <span className="text-[9px] text-text-muted">09:10</span>
                  </div>
                  <div className="hidden"></div>
                  {/* Tue P2-4: FHIR */}
                  <div
                    onClick={() => {
                      const c = courses.find(x => x.id === 'IM3012');
                      if (c) onViewCourseDetail(c);
                    }}
                    className="row-span-3 bg-primary text-white p-2 rounded-lg flex flex-col justify-between shadow-xs cursor-pointer hover:ring-2 hover:ring-general-sky transition-all"
                  >
                    <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded w-fit font-bold">必修 3.0</span>
                    <span className="font-bold text-xs truncate">醫療資訊FHIR</span>
                    <span className="text-[10px] text-white/80">T401 • 陳建彰</span>
                  </div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  {/* Friday Ethics Recommended block */}
                  {hasAddedRecommended ? (
                    <div
                      onClick={() => {
                        const c = courses.find(x => x.id === 'GE2109');
                        if (c) onViewCourseDetail(c);
                      }}
                      className="row-span-2 bg-clinical-purple text-white p-2 rounded-lg flex flex-col justify-between shadow-xs cursor-pointer hover:ring-2 hover:ring-primary transition-all animate-in zoom-in"
                    >
                      <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded w-fit font-bold">通識 2.0</span>
                      <span className="font-bold text-xs truncate">醫學倫理法規</span>
                      <span className="text-[10px] text-white/80">B101 • 零碰撞</span>
                    </div>
                  ) : (
                    <div className="row-span-2 bg-clinical-purple/15 border-2 border-dashed border-clinical-purple text-clinical-purple p-2 rounded-lg flex flex-col justify-between">
                      <span className="text-[9px] bg-clinical-purple text-white px-1 py-0.2 rounded w-fit font-bold">
                        推薦排入
                      </span>
                      <span className="font-bold text-xs">醫學倫理與法規</span>
                      <span className="text-[10px]">點左側試排</span>
                    </div>
                  )}
                </div>

                {/* Period 3 */}
                <div className="grid grid-cols-6 gap-1 min-h-[48px]">
                  <div className="bg-surface-container-low/70 p-1 flex flex-col justify-center items-center text-center rounded">
                    <span className="font-bold text-primary text-[11px]">3</span>
                    <span className="text-[9px] text-text-muted">10:10</span>
                  </div>
                  <div className="hidden"></div>
                  <div className="hidden"></div>
                  {/* Wed P3-4: Smart Nursing */}
                  <div
                    onClick={() => {
                      const c = courses.find(x => x.id === 'NUR3402');
                      if (c) onViewCourseDetail(c);
                    }}
                    className="row-span-2 bg-secondary text-white p-2 rounded-lg flex flex-col justify-between shadow-xs cursor-pointer hover:ring-2 hover:ring-general-sky transition-all"
                  >
                    <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded w-fit font-bold">跨域 2.0</span>
                    <span className="font-bold text-xs truncate">智慧護理流程</span>
                    <span className="text-[10px] text-white/80">親仁B204</span>
                  </div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="hidden"></div>
                </div>

                {/* Period 4 */}
                <div className="grid grid-cols-6 gap-1 min-h-[48px]">
                  <div className="bg-surface-container-low/70 p-1 flex flex-col justify-center items-center text-center rounded">
                    <span className="font-bold text-primary text-[11px]">4</span>
                    <span className="text-[9px] text-text-muted">11:10</span>
                  </div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="hidden"></div>
                  <div className="hidden"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                </div>

                {/* Lunch Break */}
                <div className="grid grid-cols-6 gap-1 py-1 bg-surface-container-high/40 rounded text-center items-center">
                  <span className="text-[10px] text-text-muted">12:00</span>
                  <span className="col-span-5 text-[10px] text-text-muted tracking-wider">
                    午膳與臨床交班時間
                  </span>
                </div>

                {/* Period 5 */}
                <div className="grid grid-cols-6 gap-1 min-h-[48px]">
                  <div className="bg-surface-container-low/70 p-1 flex flex-col justify-center items-center text-center rounded">
                    <span className="font-bold text-primary text-[11px]">5</span>
                    <span className="text-[9px] text-text-muted">13:30</span>
                  </div>
                  {/* Mon P5-6: Biostats */}
                  <div
                    onClick={() => {
                      const c = courses.find(x => x.id === 'BIO202');
                      if (c) onViewCourseDetail(c);
                    }}
                    className="row-span-2 bg-secondary-container text-on-secondary-container p-2 rounded-lg flex flex-col justify-between shadow-xs cursor-pointer"
                  >
                    <span className="text-[10px] bg-secondary text-white px-1 py-0.2 rounded w-fit font-bold">
                      選修 2.0
                    </span>
                    <span className="font-bold text-xs truncate">生醫統計 R</span>
                    <span className="text-[10px] text-text-secondary">B204</span>
                  </div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  {/* Wed P5-7: Health Big Data */}
                  <div
                    onClick={() => {
                      const c = courses.find(x => x.id === 'IM3105');
                      if (c) onViewCourseDetail(c);
                    }}
                    className="row-span-3 bg-surface-container-highest p-2 rounded-lg flex flex-col justify-between shadow-xs cursor-pointer"
                  >
                    <span className="text-[10px] bg-clinical-purple text-white px-1 py-0.2 rounded w-fit font-bold">
                      選修 3.0
                    </span>
                    <span className="font-bold text-xs truncate">健康大數據</span>
                    <span className="text-[10px] text-text-muted">I401</span>
                  </div>
                  {/* Thu P5-6: Contingency slot */}
                  <div className="row-span-2 bg-tertiary-fixed-dim/30 border border-dashed border-tertiary-fixed-dim p-2 rounded-lg flex flex-col justify-between">
                    <span className="text-[9px] bg-tertiary-fixed text-on-tertiary-fixed px-1 py-0.2 rounded w-fit font-bold">
                      備案 (Tier 2)
                    </span>
                    <span className="font-bold text-xs text-tertiary">遠距照護IoT</span>
                    <span className="text-[10px] text-text-muted">中籤候補替換</span>
                  </div>
                  <div className="bg-surface-bg rounded p-1"></div>
                </div>

                {/* Period 6 */}
                <div className="grid grid-cols-6 gap-1 min-h-[48px]">
                  <div className="bg-surface-container-low/70 p-1 flex flex-col justify-center items-center text-center rounded">
                    <span className="font-bold text-primary text-[11px]">6</span>
                    <span className="text-[9px] text-text-muted">14:30</span>
                  </div>
                  <div className="hidden"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="hidden"></div>
                  <div className="hidden"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                </div>

                {/* Period 7 */}
                <div className="grid grid-cols-6 gap-1 min-h-[48px]">
                  <div className="bg-surface-container-low/70 p-1 flex flex-col justify-center items-center text-center rounded">
                    <span className="font-bold text-primary text-[11px]">7</span>
                    <span className="text-[9px] text-text-muted">15:30</span>
                  </div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="hidden"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                  <div className="bg-surface-bg rounded p-1"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs border border-border-subtle">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
              <span>時程防衝堂演算法演算完成：當前預排 0 節衝突，時段分佈均衡</span>
            </div>
            <button
              onClick={onApplyToSchedule}
              className="text-primary hover:underline font-bold flex items-center gap-1"
            >
              <span>套用課表</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Up Drawer for Fast Course Code Copying */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="bg-surface-card w-full max-w-xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto my-3"></div>

            <div className="px-6 pb-3 flex items-center justify-between border-b border-border-subtle">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-on-surface">113-2 正式選課速填代碼</h3>
                <p className="text-xs text-text-muted">已依志願權重排序，點擊單張即可複製</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-text-muted hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-3 flex-1">
              {[...tier1Courses, ...tier2Courses].map(course => (
                <div
                  key={course.id}
                  className="bg-surface-container-low rounded-xl p-3.5 flex items-center justify-between gap-3 border border-border-subtle"
                >
                  <div className="min-w-0">
                    <div className="text-primary font-bold text-sm truncate">
                      {course.code} • {course.name}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5 truncate">
                      {course.timeStr} | {course.credits}學分 | {course.category}
                    </div>
                  </div>
                  <button
                    onClick={() => copySingleCode(course.code, course.name)}
                    className="px-3.5 py-1.5 rounded-lg bg-surface-card text-primary font-bold text-xs shadow-xs hover:bg-surface-container active:scale-95 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    <span>複製</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-border-subtle bg-surface-card">
              <button
                onClick={copyAllCodes}
                className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                <span>一次複製全部 6 組選課碼</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
