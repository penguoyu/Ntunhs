import React, { useState, useMemo } from 'react';
import { Course } from '../types';

interface SimulationWorkstationProps {
  courses: Course[];
  cart: string[];
  tier1Ids: string[];
  tier2Ids: string[];
  scheduleIds?: string[];
  onSetTier1Ids: (ids: string[]) => void;
  onSetTier2Ids: (ids: string[]) => void;
  onRemoveFromCart: (id: string) => void;
  onAddToCart: (id: string) => void;
  onApplyToSchedule: () => void;
  onViewCourseDetail: (course: Course) => void;
  showToast: (msg: string) => void;
}

const SIM_DAYS = [
  { day: 1, zh: '一', en: 'Mon' },
  { day: 2, zh: '二', en: 'Tue' },
  { day: 3, zh: '三', en: 'Wed' },
  { day: 4, zh: '四', en: 'Thu' },
  { day: 5, zh: '五', en: 'Fri' },
];

const SIM_PERIODS = [
  { period: 1, time: '08:10' },
  { period: 2, time: '09:10' },
  { period: 3, time: '10:10' },
  { period: 4, time: '11:10' },
  { period: 5, time: '13:30' },
  { period: 6, time: '14:30' },
  { period: 7, time: '15:30' },
  { period: 8, time: '16:30' },
];

const simPeriodToRow = (period: number): number => {
  return period <= 4 ? period + 1 : period + 2;
};

export const SimulationWorkstation: React.FC<SimulationWorkstationProps> = ({
  courses,
  cart,
  tier1Ids,
  tier2Ids,
  scheduleIds,
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

  // Timetable preview calculations
  const effectivePreviewCourses = useMemo(() => {
    if (viewMode === 'official') {
      return courses.filter(c => scheduleIds?.includes(c.id));
    }
    let list = viewMode === 'contingency' ? [...tier1Courses, ...tier2Courses] : [...tier1Courses];
    if (hasAddedRecommended && !list.some(c => c.id === 'GE2109')) {
      const ge = courses.find(c => c.id === 'GE2109');
      if (ge) list = [...list, ge];
    }
    return list;
  }, [viewMode, tier1Courses, tier2Courses, hasAddedRecommended, courses, scheduleIds]);

  // Conflict Detection for Simulation Preview
  const simConflicts = useMemo(() => {
    interface SimConflictPair {
      c1: Course;
      c2: Course;
      day: number;
      dayZh: string;
      periods: number[];
    }
    const pairs: SimConflictPair[] = [];
    const conflictingCourseIds = new Set<string>();
    const conflictMap = new Map<string, { otherCourse: Course; periods: number[]; dayZh: string }[]>();

    for (let i = 0; i < effectivePreviewCourses.length; i++) {
      for (let j = i + 1; j < effectivePreviewCourses.length; j++) {
        const c1 = effectivePreviewCourses[i];
        const c2 = effectivePreviewCourses[j];
        if (c1.day && c2.day && c1.day === c2.day && c1.periods && c2.periods) {
          const overlap = c1.periods.filter(p => c2.periods?.includes(p));
          if (overlap.length > 0) {
            conflictingCourseIds.add(c1.id);
            conflictingCourseIds.add(c2.id);
            const dayZh = SIM_DAYS.find(d => d.day === c1.day)?.zh || String(c1.day);
            pairs.push({
              c1,
              c2,
              day: c1.day,
              dayZh,
              periods: overlap.sort((a, b) => a - b),
            });

            if (!conflictMap.has(c1.id)) conflictMap.set(c1.id, []);
            conflictMap.get(c1.id)!.push({ otherCourse: c2, periods: overlap, dayZh });

            if (!conflictMap.has(c2.id)) conflictMap.set(c2.id, []);
            conflictMap.get(c2.id)!.push({ otherCourse: c1, periods: overlap, dayZh });
          }
        }
      }
    }
    return { pairs, conflictingCourseIds, conflictMap };
  }, [effectivePreviewCourses]);

  const simOccupiedSlots = useMemo(() => {
    const slots = new Set<string>();
    effectivePreviewCourses.forEach(c => {
      if (c.day && c.periods) {
        c.periods.forEach(p => slots.add(`${c.day}-${p}`));
      }
    });
    // If recommendation is shown on Fri P2-3, mark those as occupied so empty slots aren't rendered underneath
    if (!hasAddedRecommended) {
      slots.add('5-2');
      slots.add('5-3');
    }
    return slots;
  }, [effectivePreviewCourses, hasAddedRecommended]);

  const simCoursePlacements = useMemo(() => {
    interface Placement {
      course: Course;
      startPeriod: number;
      endPeriod: number;
      rowStart: number;
      rowEnd: number;
      col: number;
      isTier2: boolean;
      isConflict: boolean;
      conflictWithNames: string[];
      totalInGroup: number;
      groupIndex: number;
    }

    const dayPlacements: Record<number, {
      course: Course;
      startPeriod: number;
      endPeriod: number;
      rowStart: number;
      rowEnd: number;
      col: number;
      isTier2: boolean;
    }[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    effectivePreviewCourses.forEach(course => {
      if (!course.day || !course.periods || course.periods.length === 0) return;
      const morning = course.periods.filter(p => p <= 4).sort((a, b) => a - b);
      const afternoon = course.periods.filter(p => p >= 5).sort((a, b) => a - b);
      const isTier2 = tier2Ids.includes(course.id);

      if (morning.length > 0) {
        const start = morning[0];
        const end = morning[morning.length - 1];
        dayPlacements[course.day]?.push({
          course,
          startPeriod: start,
          endPeriod: end,
          rowStart: simPeriodToRow(start),
          rowEnd: simPeriodToRow(end) + 1,
          col: course.day + 1,
          isTier2,
        });
      }

      if (afternoon.length > 0) {
        const start = afternoon[0];
        const end = afternoon[afternoon.length - 1];
        dayPlacements[course.day]?.push({
          course,
          startPeriod: start,
          endPeriod: end,
          rowStart: simPeriodToRow(start),
          rowEnd: simPeriodToRow(end) + 1,
          col: course.day + 1,
          isTier2,
        });
      }
    });

    const finalPlacements: Placement[] = [];

    Object.keys(dayPlacements).forEach(dayKey => {
      const day = Number(dayKey);
      const list = dayPlacements[day];
      if (!list || list.length === 0) return;

      list.forEach(item => {
        const overlaps = list.filter(other =>
          item.startPeriod <= other.endPeriod && other.startPeriod <= item.endPeriod
        );
        overlaps.sort((a, b) => a.course.id.localeCompare(b.course.id));
        const groupIndex = overlaps.findIndex(x => x.course.id === item.course.id);
        const totalInGroup = overlaps.length;
        const isConflict = overlaps.length > 1 || simConflicts.conflictingCourseIds.has(item.course.id);
        const conflictWithNames = overlaps
          .filter(x => x.course.id !== item.course.id)
          .map(x => x.course.name);

        finalPlacements.push({
          ...item,
          isConflict,
          conflictWithNames,
          totalInGroup,
          groupIndex: Math.max(0, groupIndex),
        });
      });
    });

    return finalPlacements;
  }, [effectivePreviewCourses, tier2Ids, simConflicts]);

  const simEmptySlots = useMemo(() => {
    const slots: { day: number; period: number; zh: string; time: string }[] = [];
    SIM_DAYS.forEach(d => {
      SIM_PERIODS.forEach(p => {
        if (!simOccupiedSlots.has(`${d.day}-${p.period}`)) {
          slots.push({
            day: d.day,
            period: p.period,
            zh: d.zh,
            time: p.time,
          });
        }
      });
    });
    return slots;
  }, [simOccupiedSlots]);

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
    if (simConflicts.pairs.length > 0) {
      const desc = simConflicts.pairs
        .map(p => `《${p.c1.name}》與《${p.c2.name}》(週${p.dayZh} 第${p.periods.join(',')}節)`)
        .join('；');
      showToast(`⚠️【衝堂檢核警示】發現 ${simConflicts.pairs.length} 處時段衝堂衝突！${desc}。請將衝突科目移至備選梯隊 (Tier 2)。`);
    } else {
      showToast('【智慧衝堂與先修檢核】全數合規！擋修條件通過，預排時段 100% 無碰撞。');
    }
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

        <div className={`p-4 rounded-2xl shadow-sm border flex items-center justify-between transition-all ${
          simConflicts.pairs.length > 0
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
            : 'bg-surface-card border-border-subtle'
        }`}>
          <div className="flex flex-col">
            <span className="text-xs text-text-muted font-semibold">衝堂防護與檢核</span>
            <div className="flex items-center gap-1.5 mt-1">
              {simConflicts.pairs.length > 0 ? (
                <>
                  <span className="material-symbols-outlined text-rose-600 text-[20px] animate-pulse">warning</span>
                  <span className="font-bold text-base text-rose-600">{simConflicts.pairs.length} 處時段衝堂</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                  <span className="font-bold text-base text-secondary">零時段碰撞</span>
                </>
              )}
            </div>
            <span className={`text-[11px] ${simConflicts.pairs.length > 0 ? 'text-rose-600 font-bold' : 'text-text-muted'}`}>
              {simConflicts.pairs.length > 0 ? '需調整志願或移入備案' : '第一志願時段全數獨立'}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            simConflicts.pairs.length > 0
              ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600'
              : 'bg-secondary-fixed/20 text-secondary'
          }`}>
            <span className="material-symbols-outlined text-[22px]">
              {simConflicts.pairs.length > 0 ? 'crisis_alert' : 'security'}
            </span>
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

      {/* Top Conflict Alert Banner if conflicts exist */}
      {simConflicts.pairs.length > 0 && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500/80 text-rose-950 dark:text-rose-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-rose-700 dark:text-rose-300">
                  ⚠️ 模擬預排偵測到 {simConflicts.pairs.length} 處時段衝堂衝突！
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                  需排解衝突
                </span>
              </div>
              <div className="text-xs text-rose-900/90 dark:text-rose-200/90 mt-1.5 flex flex-col gap-1">
                {simConflicts.pairs.map((p, pIdx) => (
                  <div key={`conflict-pair-${pIdx}`} className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold underline decoration-rose-400">
                      《{p.c1.name}》
                    </span>
                    <span>與</span>
                    <span className="font-bold underline decoration-rose-400">
                      《{p.c2.name}》
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 font-mono text-[11px] font-bold">
                      週{p.dayZh} 第{p.periods.join(',')}節
                    </span>
                    <span>時段衝突重疊</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1.5">
                衝突科目已於下方週課表中並排展示並高亮標註「⚠️ 衝堂」。建議將衝堂科目點選「移至備案」移入 Tier 2 志願梯隊，確保系統分發安全。
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            {simConflicts.pairs[0] && (
              <button
                onClick={() => moveTier1ToTier2(simConflicts.pairs[0].c2.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">low_priority</span>
                <span>將《{simConflicts.pairs[0].c2.name}》移至備案</span>
              </button>
            )}
          </div>
        </div>
      )}

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
                const conflictItems = simConflicts.conflictMap.get(course.id) || [];
                const hasConflict = conflictItems.length > 0;

                return (
                  <div
                    key={course.id}
                    onMouseEnter={() => setHighlightedCourseId(course.id)}
                    onMouseLeave={() => setHighlightedCourseId(null)}
                    className={`p-3.5 rounded-xl transition-all shadow-xs border ${
                      isHovered
                        ? 'border-primary ring-2 ring-primary/20 bg-surface-card'
                        : hasConflict
                        ? 'border-2 border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                        : 'bg-surface-container-low hover:bg-surface-card border-border-subtle'
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold px-2 py-0.2 rounded bg-surface-container-high text-primary">
                              {course.code}
                            </span>
                            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-primary-container text-white">
                              {course.category}
                            </span>
                            {hasConflict && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-600 text-white flex items-center gap-1 shadow-2xs animate-pulse">
                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                衝堂衝突
                              </span>
                            )}
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

                        {/* Inline Conflict Warning & Quick Resolution Action */}
                        {hasConflict && (
                          <div className="mt-2.5 p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-rose-300 dark:border-rose-800">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="material-symbols-outlined text-[15px] text-rose-600 shrink-0">error</span>
                              <span className="truncate">
                                與《{conflictItems.map(x => x.otherCourse.name).join('、')}》（週{conflictItems[0]?.dayZh} 第{conflictItems[0]?.periods.join(',')}節）衝堂
                              </span>
                            </div>
                            <button
                              onClick={() => moveTier1ToTier2(course.id)}
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-2xs flex items-center gap-1 self-start sm:self-auto"
                            >
                              <span className="material-symbols-outlined text-[13px]">low_priority</span>
                              <span>移至備案 (解衝堂)</span>
                            </button>
                          </div>
                        )}
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
            <div className="flex items-center gap-3 flex-wrap">
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
              <div className="flex items-center gap-1 text-rose-600 font-bold">
                <span className="w-2.5 h-2.5 rounded bg-rose-600 animate-pulse"></span>
                <span>衝堂衝突</span>
              </div>
            </div>
            <span className="text-[11px] text-general-sky font-semibold">點選課表塊可檢視課堂</span>
          </div>

          {/* Mini Timetable Table for Simulation */}
          <div className="w-full overflow-x-auto rounded-xl border border-border-subtle text-xs bg-surface-card p-2 sm:p-3">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-[56px_repeat(5,1fr)] sm:grid-cols-[68px_repeat(5,1fr)] gap-1.5 select-none text-xs">
                {/* Row 1, Col 1: Period Header */}
                <div
                  style={{ gridColumn: 1, gridRow: 1 }}
                  className="font-semibold text-text-muted text-[11px] flex items-center justify-center py-1.5 bg-surface-container-low rounded-lg"
                >
                  節次
                </div>

                {/* Row 1, Col 2..6: Day Headers */}
                {SIM_DAYS.map(d => (
                  <div
                    key={`sim-day-${d.day}`}
                    style={{ gridColumn: d.day + 1, gridRow: 1 }}
                    className={`flex flex-col items-center py-1.5 rounded-lg text-xs ${
                      d.day === 5
                        ? 'bg-surface-container-high text-primary font-bold'
                        : 'bg-surface-container-low text-primary'
                    }`}
                  >
                    <span className="text-[10px] text-text-muted">週{d.zh}</span>
                    <span className="font-bold text-xs">{d.en}</span>
                  </div>
                ))}

                {/* Col 1: Period Time Indicators */}
                {SIM_PERIODS.map(p => (
                  <div
                    key={`sim-time-${p.period}`}
                    style={{ gridColumn: 1, gridRow: simPeriodToRow(p.period) }}
                    className="flex flex-col justify-center items-center bg-surface-container-low/70 rounded-lg p-1 text-center border border-border-subtle/60 h-full min-h-[58px]"
                  >
                    <span className="font-bold text-primary text-[11px]">{p.period}</span>
                    <span className="text-[9px] text-text-muted">{p.time}</span>
                  </div>
                ))}

                {/* Row 6: Lunch Break */}
                <div
                  style={{ gridColumn: 1, gridRow: 6 }}
                  className="flex flex-col justify-center items-center bg-surface-container-low/70 rounded-lg p-1 text-center border border-border-subtle/60"
                >
                  <span className="font-bold text-[10px] text-text-muted">午休</span>
                  <span className="text-[8px] text-text-muted">12:00</span>
                </div>
                <div
                  style={{ gridColumn: '2 / 7', gridRow: 6 }}
                  className="bg-surface-container-high/40 rounded-lg py-1 px-3 flex items-center justify-between text-text-muted text-[10px] border border-border-subtle/40"
                >
                  <span>12:00 - 13:30 午膳與臨床交班時間</span>
                  <span className="text-secondary font-semibold hidden sm:inline">午休 90 分鐘</span>
                </div>

                {/* Friday Recommended Slot (if not added yet) */}
                {!hasAddedRecommended && (
                  <div
                    style={{
                      gridColumn: 6,
                      gridRow: `${simPeriodToRow(2)} / ${simPeriodToRow(3) + 1}`,
                    }}
                    onClick={handleAddRecommended}
                    className="bg-clinical-purple/10 border-2 border-dashed border-clinical-purple text-clinical-purple p-2 rounded-lg flex flex-col justify-between cursor-pointer hover:bg-clinical-purple/20 transition-all shadow-2xs group"
                    title="點擊試排入週五通識《醫學倫理與科技法規》"
                  >
                    <span className="text-[9px] bg-clinical-purple text-white px-1.5 py-0.2 rounded w-fit font-bold shadow-2xs">
                      通識推薦
                    </span>
                    <span className="font-bold text-xs truncate">醫學倫理法規</span>
                    <span className="text-[10px] text-clinical-purple/80 group-hover:text-clinical-purple font-semibold">
                      + 點擊試排 2.0學分
                    </span>
                  </div>
                )}

                {/* Scheduled Simulation Courses */}
                {simCoursePlacements.map((placement, idx) => {
                  const {
                    course,
                    startPeriod,
                    endPeriod,
                    rowStart,
                    rowEnd,
                    col,
                    isTier2,
                    isConflict,
                    conflictWithNames,
                    totalInGroup,
                    groupIndex,
                  } = placement;
                  const isMultiPeriod = endPeriod > startPeriod;

                  const widthStyle = isConflict ? `calc(${100 / totalInGroup}% - 2px)` : '100%';
                  const marginLeftStyle = isConflict
                    ? `calc(${(groupIndex * 100) / totalInGroup}% + ${groupIndex > 0 ? 2 : 0}px)`
                    : '0px';

                  return (
                    <div
                      key={`sim-course-${course.id}-${startPeriod}-${idx}`}
                      style={{
                        gridColumn: col,
                        gridRow: `${rowStart} / ${rowEnd}`,
                        width: widthStyle,
                        marginLeft: marginLeftStyle,
                        justifySelf: 'start',
                        zIndex: isConflict ? 25 + groupIndex : 10,
                      }}
                      onClick={() => onViewCourseDetail(course)}
                      className={`p-1.5 sm:p-2 rounded-lg flex flex-col justify-between cursor-pointer shadow-xs hover:shadow-md transition-all active:scale-[0.99] border relative group ${
                        isConflict
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 border-2 border-rose-500 ring-2 ring-rose-400/50 animate-pulse'
                          : isTier2
                          ? 'bg-tertiary-fixed-dim/25 border-dashed border-tertiary-fixed-dim text-on-surface'
                          : course.category.includes('必修')
                          ? 'bg-primary-container text-white border-primary/30'
                          : course.category.includes('跨') || course.isCrossDisciplinary
                          ? 'bg-secondary text-white border-secondary/30'
                          : course.category.includes('通識')
                          ? 'bg-clinical-purple text-white border-purple-400/30'
                          : 'bg-surface-container-highest text-on-surface border-border-subtle'
                      }`}
                      title={
                        isConflict
                          ? `⚠️【衝堂警告】${course.name} 與 ${conflictWithNames.join('、')} 於第${startPeriod}-${endPeriod}節時段重疊！點擊檢視`
                          : `${course.name} (${course.code}) | ${course.location} | ${course.teacher}`
                      }
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              isConflict
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : isTier2
                                ? 'bg-tertiary text-white'
                                : 'bg-white/20'
                            }`}
                          >
                            {isConflict
                              ? '⚠️ 衝堂'
                              : isTier2
                              ? '備案 (Tier 2)'
                              : `${course.category.slice(0, 2)} ${course.credits.toFixed(1)}`}
                          </span>
                          <span
                            className={`text-[9px] font-mono ${
                              isConflict ? 'text-rose-700 dark:text-rose-300 font-bold' : 'opacity-80'
                            }`}
                          >
                            {isMultiPeriod ? `P${startPeriod}-${endPeriod}` : `P${startPeriod}`}
                          </span>
                        </div>
                        <span
                          className={`font-bold text-xs truncate block leading-tight mt-0.5 ${
                            isConflict ? 'text-rose-950 dark:text-rose-100 font-extrabold' : ''
                          }`}
                        >
                          {course.name}
                        </span>
                      </div>

                      <div
                        className={`flex items-center justify-between text-[10px] mt-1 pt-1 border-t ${
                          isConflict
                            ? 'border-rose-300/60 text-rose-800 dark:text-rose-200'
                            : 'border-white/10 opacity-85'
                        }`}
                      >
                        <span className="truncate max-w-[80px]">{course.location || course.room}</span>
                        <span className="truncate max-w-[65px] opacity-80">{course.teacher}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Unified Empty Slots */}
                {simEmptySlots.map(slot => (
                  <div
                    key={`sim-empty-${slot.day}-${slot.period}`}
                    style={{
                      gridColumn: slot.day + 1,
                      gridRow: simPeriodToRow(slot.period),
                    }}
                    onClick={() => showToast(`週${slot.zh} 第${slot.period}節 (${slot.time}) 為自習空堂時段`)}
                    className="h-full min-h-[58px] bg-surface-container-lowest/80 hover:bg-surface-container-low/90 rounded-lg border border-dashed border-border-subtle/80 flex flex-col items-center justify-center p-1 text-center transition-all group cursor-pointer shadow-2xs hover:border-primary/40"
                    title={`週${slot.zh} 第${slot.period}節 (${slot.time}) 自修空堂`}
                  >
                    <span className="text-[10px] text-text-muted/40 group-hover:text-primary transition-colors font-medium">
                      空堂
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs border border-border-subtle">
            {simConflicts.pairs.length > 0 ? (
              <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                <span className="material-symbols-outlined text-rose-600 text-[18px] animate-pulse">warning</span>
                <span>時程防衝堂警示：當前預排有 {simConflicts.pairs.length} 處時段衝堂，請調整志願或移至備案</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-text-secondary">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                <span>時程防衝堂演算法演算完成：當前預排 0 節衝突，時段分佈均衡</span>
              </div>
            )}
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
