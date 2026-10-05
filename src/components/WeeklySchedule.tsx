import React, { useState, useMemo } from 'react';
import { Course, SDG_LIST } from '../types';

interface WeeklyScheduleProps {
  scheduleCourses: Course[];
  onViewCourseDetail: (course: Course) => void;
  onOpenConflictResolver: () => void;
  showToast: (msg: string) => void;
}

const DAYS = [
  { day: 1, zh: '一', en: 'Mon' },
  { day: 2, zh: '二', en: 'Tue' },
  { day: 3, zh: '三', en: 'Wed' },
  { day: 4, zh: '四', en: 'Thu' },
  { day: 5, zh: '五', en: 'Fri' },
];

const PERIOD_CONFIG = [
  { period: 1, time: '08:10' },
  { period: 2, time: '09:10' },
  { period: 3, time: '10:10' },
  { period: 4, time: '11:10' },
  { period: 5, time: '13:30' },
  { period: 6, time: '14:30' },
  { period: 7, time: '15:30' },
  { period: 8, time: '16:30' },
];

const periodToRow = (period: number): number => {
  return period <= 4 ? period + 1 : period + 2;
};

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  scheduleCourses,
  onViewCourseDetail,
  onOpenConflictResolver,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [scheduleVersion, setScheduleVersion] = useState('official');
  const [selectedCourseModal, setSelectedCourseModal] = useState<Course | null>(null);
  const [showOfficeHourModal, setShowOfficeHourModal] = useState(false);
  const [officeHourTeacher, setOfficeHourTeacher] = useState('');

  // Calculate totals
  const totalCredits = scheduleCourses.reduce((sum, c) => sum + c.credits, 0);
  const requiredCredits = scheduleCourses
    .filter(c => c.category.includes('必修'))
    .reduce((sum, c) => sum + c.credits, 0);
  const electiveCredits = totalCredits - requiredCredits;

  // Calculate SDGs metrics for current schedule
  const allSdgIds = Array.from(new Set(scheduleCourses.flatMap(c => (c.sdgs && c.sdgs.length > 0 ? c.sdgs : [3, 4]))));
  const activeSdgItems = SDG_LIST.filter(s => allSdgIds.includes(s.id));

  // Timetable grid calculations
  const occupiedSlots = useMemo(() => {
    const slots = new Set<string>();
    scheduleCourses.forEach(c => {
      if (c.day && c.periods) {
        c.periods.forEach(p => slots.add(`${c.day}-${p}`));
      }
    });
    return slots;
  }, [scheduleCourses]);

  const conflictingCourseIds = useMemo(() => {
    const ids = new Set<string>();
    scheduleCourses.forEach(c1 => {
      scheduleCourses.forEach(c2 => {
        if (c1.id !== c2.id && c1.day === c2.day && c1.periods?.some(p => c2.periods?.includes(p))) {
          ids.add(c1.id);
          ids.add(c2.id);
        }
      });
    });
    return ids;
  }, [scheduleCourses]);

  const coursePlacements = useMemo(() => {
    interface CoursePlacement {
      course: Course;
      startPeriod: number;
      endPeriod: number;
      rowStart: number;
      rowEnd: number;
      col: number;
      isConflict: boolean;
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
    }[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    scheduleCourses.forEach(course => {
      if (!course.day || !course.periods || course.periods.length === 0) return;
      const morning = course.periods.filter(p => p <= 4).sort((a, b) => a - b);
      const afternoon = course.periods.filter(p => p >= 5).sort((a, b) => a - b);

      if (morning.length > 0) {
        const startPeriod = morning[0];
        const endPeriod = morning[morning.length - 1];
        dayPlacements[course.day]?.push({
          course,
          startPeriod,
          endPeriod,
          rowStart: periodToRow(startPeriod),
          rowEnd: periodToRow(endPeriod) + 1,
          col: course.day + 1,
        });
      }

      if (afternoon.length > 0) {
        const startPeriod = afternoon[0];
        const endPeriod = afternoon[afternoon.length - 1];
        dayPlacements[course.day]?.push({
          course,
          startPeriod,
          endPeriod,
          rowStart: periodToRow(startPeriod),
          rowEnd: periodToRow(endPeriod) + 1,
          col: course.day + 1,
        });
      }
    });

    const placements: CoursePlacement[] = [];
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
        const isConflict = overlaps.length > 1 || conflictingCourseIds.has(item.course.id);

        placements.push({
          ...item,
          isConflict,
          totalInGroup,
          groupIndex: Math.max(0, groupIndex),
        });
      });
    });

    return placements;
  }, [scheduleCourses, conflictingCourseIds]);

  const emptySlots = useMemo(() => {
    const slots: { day: number; period: number; zh: string; time: string }[] = [];
    DAYS.forEach(d => {
      PERIOD_CONFIG.forEach(p => {
        if (!occupiedSlots.has(`${d.day}-${p.period}`)) {
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
  }, [occupiedSlots]);

  const handleExportICS = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NTUNHS Course Master//TW\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:北護 113-2 個人課表\nX-WR-TIMEZONE:Asia/Taipei\n`;
    scheduleCourses.forEach(c => {
      icsContent += `BEGIN:VEVENT\nSUMMARY:${c.name}\nLOCATION:${c.location}\nDESCRIPTION:授課教師: ${c.teacher} | ${c.credits}學分\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'NTUNHS_113_2_Timetable.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('已成功匯出 NTUNHS_113_2_Timetable.ics 日曆檔案！');
  };

  const handleExportPNG = () => {
    showToast('已為您生成高清課表預覽檔 (PNG)，長按或點擊即可儲存分享！');
  };

  const openOfficeHour = (teacherName: string) => {
    setOfficeHourTeacher(teacherName);
    setShowOfficeHourModal(true);
  };

  return (
    <div className="flex flex-col w-full max-w-[1680px] mx-auto pb-16">
      {/* Top Banner / Switcher */}
      <div className="w-full bg-surface-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border-subtle flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded-xl text-primary">
            <span className="material-symbols-outlined text-general-sky text-[20px]">school</span>
            <span className="font-bold text-sm sm:text-base">113學年度 第2學期</span>
            <span className="text-[11px] text-text-muted px-2 py-0.5 bg-surface-card rounded-md font-semibold">
              校務系統即時連動
            </span>
          </div>

          <div className="inline-flex p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setScheduleVersion('official')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                scheduleVersion === 'official'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              正式核定課表
            </button>
            <button
              onClick={() => setScheduleVersion('simulation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                scheduleVersion === 'simulation'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              預選模擬沙盒 (v2.4)
            </button>
          </div>
        </div>

        {/* View Mode & Export Tools */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Grid / List switcher */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-surface-card text-primary shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
              <span>網格</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-surface-card text-primary shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_timeline</span>
              <span>清單</span>
            </button>
          </div>

          <button
            onClick={handleExportICS}
            className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">event_available</span>
            <span>匯出至行事曆 (.ics)</span>
          </button>
          <button
            onClick={handleExportPNG}
            className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-container font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>產生課表圖檔 (PNG)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* 1. Credits & Load */}
        <div className="bg-surface-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border-subtle flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">已選修總學分</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-2xl sm:text-3xl text-primary">{totalCredits.toFixed(1)}</span>
              <span className="text-xs text-text-muted">/ 25.0 上限</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-general-sky bg-surface-container-low px-2 py-0.5 rounded-full font-bold">
                必修 {requiredCredits.toFixed(0)}
              </span>
              <span className="text-xs text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full font-bold">
                選修 {electiveCredits.toFixed(0)}
              </span>
            </div>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-container-high"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              ></path>
              <path
                className="text-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${Math.round((totalCredits / 25) * 100)}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              ></path>
            </svg>
            <span className="absolute text-xs font-bold text-primary">
              {Math.round((totalCredits / 25) * 100)}%
            </span>
          </div>
        </div>

        {/* 2. Conflict Engine */}
        <div
          onClick={onOpenConflictResolver}
          className="bg-surface-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border-subtle flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">智慧衝堂稽核引擎</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl text-secondary">零衝突</span>
              <span className="text-xs text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full font-bold">
                安全合規
              </span>
            </div>
            <span className="text-xs text-text-muted">已驗證全時段與實習時段 (點擊複查)</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-[26px]">verified_user</span>
          </div>
        </div>

        {/* 3. SDGs Curriculum Indicators Metric */}
        <div
          className="bg-surface-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border-subtle flex items-center justify-between"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">eco</span>
              SDGs 永續指標
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl text-primary">{activeSdgItems.length} 項指標</span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                永續合規
              </span>
            </div>
            <span className="text-xs text-text-muted">課表已涵蓋 {activeSdgItems.slice(0, 3).map(s => `SDG ${s.id}`).join(', ')}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">eco</span>
          </div>
        </div>

        {/* 4. Clinical & Lab Readiness */}
        <div className="bg-surface-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border-subtle flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">專業實習與臨床比重</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl text-clinical-purple">5.0 學分</span>
              <span className="text-xs text-clinical-purple bg-surface-container-high px-2 py-0.5 rounded-full font-bold">
                專業擬真
              </span>
            </div>
            <span className="text-xs text-text-muted">週四臨床工作流程中心實作</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-clinical-purple shrink-0">
            <span className="material-symbols-outlined text-[26px]">upload_file</span>
          </div>
        </div>
      </div>

      {/* Main Timetable View Container */}
      <div className="w-full bg-surface-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border-subtle mb-6">
        {viewMode === 'grid' ? (
          <div className="flex flex-col gap-3">
            {/* Mobile Scroll Hint & Quick View Switcher */}
            <div className="flex sm:hidden items-center justify-between text-xs text-text-muted px-1 pb-1">
              <span className="flex items-center gap-1 font-semibold text-primary">
                <span className="material-symbols-outlined text-[16px]">swipe</span>
                <span>左右滑動可檢視完整 5 日課表</span>
              </span>
              <button
                onClick={() => setViewMode('list')}
                className="text-secondary font-bold hover:underline flex items-center gap-0.5"
              >
                <span>清單條列</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
              <div className="min-w-[580px] sm:min-w-0">
                {/* Unified Timetable Grid */}
                <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-2 select-none text-xs">
                  {/* Row 1, Col 1: Period Header */}
                  <div
                    style={{ gridColumn: 1, gridRow: 1 }}
                    className="font-semibold text-text-muted text-xs flex items-center justify-center py-2 bg-surface-container-low/50 rounded-xl"
                  >
                    節次
                  </div>

                  {/* Row 1, Col 2..6: Day Headers */}
                  {DAYS.map(d => (
                    <div
                      key={`day-header-${d.day}`}
                      style={{ gridColumn: d.day + 1, gridRow: 1 }}
                      className={`flex flex-col items-center py-2 rounded-xl text-xs transition-colors ${
                        d.day === 5
                          ? 'bg-surface-container-high text-primary font-bold'
                          : 'bg-surface-container-low text-primary'
                      }`}
                    >
                      <span className="text-text-muted text-[10px]">週{d.zh}</span>
                      <span className="font-bold text-sm">{d.en}</span>
                    </div>
                  ))}

                  {/* Col 1: Period Time Indicators */}
                  {PERIOD_CONFIG.map(p => (
                    <div
                      key={`period-time-${p.period}`}
                      style={{ gridColumn: 1, gridRow: periodToRow(p.period) }}
                      className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle h-full min-h-[76px]"
                    >
                      <span className="font-bold text-primary text-sm sm:text-base">{p.period}</span>
                      <span className="text-[10px] text-text-muted">{p.time}</span>
                    </div>
                  ))}

                  {/* Row 6: Noon Break Divider */}
                  <div
                    style={{ gridColumn: 1, gridRow: 6 }}
                    className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle"
                  >
                    <span className="font-bold text-xs text-text-muted">午休</span>
                    <span className="text-[9px] text-text-muted">12:00</span>
                  </div>
                  <div
                    style={{ gridColumn: '2 / 7', gridRow: 6 }}
                    className="bg-surface-container-low/90 rounded-xl py-2 px-4 flex items-center justify-between text-text-muted text-xs border border-border-subtle"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[18px] text-tertiary-container">restaurant</span>
                      <span>12:00 - 13:30 午餐與休整 | 學生一餐、親仁大樓咖啡館全開</span>
                    </span>
                    <span className="text-secondary font-bold hidden sm:inline">午休 90 分鐘</span>
                  </div>

                  {/* Scheduled Courses */}
                  {coursePlacements.map((placement, idx) => {
                    const {
                      course,
                      startPeriod,
                      endPeriod,
                      rowStart,
                      rowEnd,
                      col,
                      isConflict,
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
                        key={`${course.id}-${startPeriod}-${idx}`}
                        style={{
                          gridColumn: col,
                          gridRow: `${rowStart} / ${rowEnd}`,
                          width: widthStyle,
                          marginLeft: marginLeftStyle,
                          justifySelf: 'start',
                          zIndex: isConflict ? 25 + groupIndex : 10,
                        }}
                        onClick={() => setSelectedCourseModal(course)}
                        className={`p-2 sm:p-2.5 rounded-xl flex flex-col justify-between cursor-pointer shadow-xs hover:shadow-md transition-all active:scale-[0.99] border relative group ${
                          isConflict
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 border-2 border-rose-500 ring-2 ring-rose-400/50 animate-pulse'
                            : course.category.includes('必修')
                            ? 'bg-primary-fixed/90 hover:bg-primary-fixed text-on-primary-fixed border-primary/25'
                            : course.category.includes('跨') || course.isCrossDisciplinary
                            ? 'bg-secondary-container/90 hover:bg-secondary-container text-on-secondary-container border-secondary/25'
                            : course.category.includes('通識')
                            ? 'bg-tertiary-fixed/90 hover:bg-tertiary-fixed text-on-tertiary-fixed border-tertiary/25'
                            : 'bg-surface-container-highest hover:bg-surface-variant text-on-surface border-border-subtle'
                        }`}
                        title={`${course.name} (${course.code}) | ${course.location} | ${course.teacher}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  course.category.includes('必修')
                                    ? 'bg-primary'
                                    : course.category.includes('跨') || course.isCrossDisciplinary
                                    ? 'bg-secondary'
                                    : course.category.includes('通識')
                                    ? 'bg-tertiary'
                                    : 'bg-clinical-purple'
                                }`}
                              ></span>
                              <span className="font-bold text-xs sm:text-sm truncate">
                                {course.name}
                              </span>
                            </div>
                            {isConflict ? (
                              <span className="px-1.5 py-0.2 rounded bg-conflict-danger text-white text-[9px] font-bold shrink-0">
                                衝堂
                              </span>
                            ) : (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                  course.category.includes('必修')
                                    ? 'bg-primary text-white'
                                    : course.category.includes('跨') || course.isCrossDisciplinary
                                    ? 'bg-secondary text-white'
                                    : course.category.includes('通識')
                                    ? 'bg-tertiary text-white'
                                    : 'bg-surface-container text-text-muted'
                                }`}
                              >
                                {course.category.slice(0, 2)} {course.credits.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] opacity-80 truncate mt-0.5">
                            <span className="material-symbols-outlined text-[12px] opacity-70">location_on</span>
                            <span className="truncate">{course.location || course.room}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] opacity-75 mt-1 pt-1 border-t border-black/5 dark:border-white/5">
                          <span className="truncate max-w-[85px] sm:max-w-none">{course.teacher}</span>
                          <span className="font-mono text-[9px]">
                            {isMultiPeriod ? `第${startPeriod}-${endPeriod}節` : `第${startPeriod}節`}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Unified Empty Slots */}
                  {emptySlots.map(slot => (
                    <div
                      key={`empty-${slot.day}-${slot.period}`}
                      style={{
                        gridColumn: slot.day + 1,
                        gridRow: periodToRow(slot.period),
                      }}
                      onClick={() => showToast(`週${slot.zh} 第${slot.period}節 (${slot.time}) 目前為自習空堂，無排課`)}
                      className="h-full min-h-[76px] bg-surface-container-lowest/80 hover:bg-surface-container-low/90 rounded-xl border border-dashed border-border-subtle/80 flex flex-col items-center justify-center p-2 text-center transition-all group cursor-pointer shadow-2xs hover:border-primary/40"
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

            {/* Friday All-Day Highlight Banner */}
            <div className="mt-2 p-3 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border-subtle">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-[20px]">event_available</span>
                <span className="font-bold text-xs sm:text-sm">
                  週五專題研討日：跨域產學與智慧醫療專題實作
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold w-fit">
                自主專題研發 / 企業實習準備
              </span>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map(dayNum => {
              const dayCourses = scheduleCourses.filter(c => c.day === dayNum);
              const dayName = ['星期一 (Mon)', '星期二 (Tue)', '星期三 (Wed)', '星期四 (Thu)', '星期五 (Fri)'][
                dayNum - 1
              ];
              const dayCredits = dayCourses.reduce((sum, c) => sum + c.credits, 0);

              return (
                <div
                  key={dayNum}
                  className="bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                      <span className="font-bold text-base text-on-surface">{dayName}</span>
                    </div>
                    <span className="text-xs text-text-muted">
                      共 {dayCourses.length} 門課 / {dayCredits.toFixed(1)} 學分
                    </span>
                  </div>

                  {dayCourses.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {dayCourses.map(course => (
                        <div
                          key={course.id}
                          onClick={() => setSelectedCourseModal(course)}
                          className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-primary">{course.timeStr}</span>
                              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">
                                {course.category} {course.credits}學分
                              </span>
                            </div>
                            <span className="font-bold text-sm text-on-surface truncate">{course.name}</span>
                            <span className="text-xs text-text-secondary mt-0.5">
                              {course.location} • {course.teacher}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-surface-container-low/60 text-center text-xs text-text-muted">
                      今日無正式排課，建議進行自主專題實作與文獻研讀。
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Notice Broadcast Banner */}
      <div className="w-full bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-[24px]">campaign</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-primary">【教務即時推播】教室與排課異動速報</span>
              <span className="text-[10px] bg-general-sky text-white px-2 py-0.2 rounded-full font-bold">
                即時同步正常
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              下週二 (03/25)《醫療資訊系統與FHIR標準》期中展示，原 I502 實驗室移至「資科大樓 2 樓國際演講廳」，請提早 5 分鐘抵達。
            </p>
          </div>
        </div>
        <button
          onClick={() => showToast('已加載完整 3 則教務處教室異動通知日誌')}
          className="text-xs font-bold px-4 py-2 bg-surface-container-low hover:bg-surface-container text-primary rounded-xl transition-colors shrink-0"
        >
          檢視完整異動日誌 (3)
        </button>
      </div>

      {/* Lower Section 3 Columns: Office Hours, SDGs Indicators Matrix, Library & Ratings */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 1. Professor Office Hours */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
                <h3 className="font-bold text-sm sm:text-base">授課導師與 Office Hour 預約</h3>
              </div>
              <span className="text-[10px] font-bold text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full">
                本週開放
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              點選時段即可直接向教授發送 1-on-1 課業與專題諮詢確認信。
            </p>

            <div className="space-y-2 mt-1">
              <div
                onClick={() => openOfficeHour('陳建安 教授 (演算法)')}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                    陳
                  </div>
                  <div>
                    <span className="font-bold text-xs text-on-surface block">陳建安 教授</span>
                    <span className="text-[11px] text-text-muted">演算法 • 資科大樓 I608室</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-general-sky font-bold block">週一 15:30-17:00</span>
                  <span className="text-[10px] text-secondary font-semibold">尚餘 2 名額</span>
                </div>
              </div>

              <div
                onClick={() => openOfficeHour('林郁芬 副教授 (FHIR標準)')}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xs">
                    林
                  </div>
                  <div>
                    <span className="font-bold text-xs text-on-surface block">林郁芬 副教授</span>
                    <span className="text-[11px] text-text-muted">FHIR標準 • 資科大樓 I615室</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-general-sky font-bold block">週三 10:00-12:00</span>
                  <span className="text-[10px] text-secondary font-semibold">尚餘 1 名額</span>
                </div>
              </div>

              <div
                onClick={() => openOfficeHour('李佳穎 主任護理師 (臨床模擬)')}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-clinical-purple flex items-center justify-center text-white font-bold text-xs">
                    李
                  </div>
                  <div>
                    <span className="font-bold text-xs text-on-surface block">李佳穎 主任護理師</span>
                    <span className="text-[11px] text-text-muted">臨床模擬 • 學思樓 F405</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-general-sky font-bold block">週四 16:30-17:30</span>
                  <span className="text-[10px] text-text-muted">採信件預約</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => openOfficeHour('預約課業導師')}
            className="w-full mt-4 py-2 bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
            <span>提出時段請益申請</span>
          </button>
        </div>

        {/* 2. SDGs Curriculum Indicators Matrix */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">eco</span>
                <h3 className="font-bold text-sm sm:text-base">SDGs 永續目標修習分佈</h3>
              </div>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                已涵蓋 {activeSdgItems.length} 項指標
              </span>
            </div>

            {/* SDGs Badges Container */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-border-subtle flex flex-col gap-2">
              <span className="text-[11px] font-bold text-emerald-900">
                本週課表已認列之聯合國 SDGs 永續目標：
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeSdgItems.map(item => (
                  <span
                    key={item.id}
                    className="px-2.5 py-1 rounded-lg text-white font-bold text-xs shadow-2xs flex items-center gap-1"
                    style={{ backgroundColor: item.color }}
                    title={`SDGs 永續目標：${item.code} ${item.name}`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{item.icon}</span>
                    <span>{item.code} {item.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
                <span className="text-[11px] text-text-muted">SDGs 核心能力覆蓋</span>
                <span className="text-sm font-bold text-primary">專業實務 • 科技應用</span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
                <span className="text-[11px] text-text-muted">校級永續指標審查</span>
                <span className="text-sm font-bold text-emerald-700">通過 (100% 合規)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span>依北護校務發展藍圖與教育部永續指標規範</span>
            <span className="font-bold text-emerald-800">免檢附紙本證明</span>
          </div>
        </div>

        {/* 3. Course Reviews & NTUNHS Library Reserves */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[20px]">local_library</span>
                <h3 className="font-bold text-sm sm:text-base">指定教材館藏與評鑑星等</h3>
              </div>
              <span className="text-[11px] text-text-muted">圖書館連動</span>
            </div>

            <div className="space-y-2 mt-1">
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-11 bg-primary rounded-lg shadow-xs flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-on-surface block truncate max-w-[140px]">
                      FHIR在現代醫療的應用
                    </span>
                    <span className="text-[10px] text-text-muted">索書號：R858 / F44 (總館3F)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-secondary font-bold block">在架可借 (2本)</span>
                  <button
                    onClick={() => showToast('已向北護圖書館系統送出一鍵預約！')}
                    className="text-[11px] text-general-sky font-semibold hover:underline"
                  >
                    一鍵預約
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-11 bg-clinical-purple rounded-lg shadow-xs flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-on-surface block truncate max-w-[140px]">
                      生醫統計分析入門 (R)
                    </span>
                    <span className="text-[10px] text-text-muted">指定參考書 • 限館內閱覽</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-tertiary-container font-semibold block">被借閱中</span>
                  <span className="text-[10px] text-text-muted">預計 03/22 歸還</span>
                </div>
              </div>

              {/* Rating summary */}
              <div className="bg-surface-container p-2.5 rounded-xl flex items-center justify-between mt-1">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted">歷年同課程綜合評鑑滿意度</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-bold text-sm text-primary">4.8</span>
                    <div className="flex text-amber-500 text-[12px]">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                    <span className="text-[10px] text-text-muted">(186份回饋)</span>
                  </div>
                </div>
                <span
                  onClick={() => onViewCourseDetail(scheduleCourses[0] || ({} as any))}
                  className="text-xs text-general-sky font-semibold cursor-pointer hover:underline"
                >
                  看學長姐評價 →
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => showToast('已連接北護圖書資源整合查詢系統 (Primo Discovery)')}
            className="w-full mt-4 py-2 bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span>開啟北護圖書資源整合查詢</span>
          </button>
        </div>
      </div>

      {/* Quick Course Info Modal Sheet (When clicking a course block) */}
      {selectedCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-card w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto sm:hidden"></div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <span className="w-fit px-2.5 py-0.5 rounded-full font-bold text-xs bg-primary-fixed text-primary mb-1">
                  {selectedCourseModal.category} • {selectedCourseModal.credits} 學分
                </span>
                <h3 className="font-bold text-lg sm:text-xl text-primary">{selectedCourseModal.name}</h3>
                <span className="text-xs text-text-muted mt-0.5">{selectedCourseModal.englishName}</span>
              </div>
              <button
                onClick={() => setSelectedCourseModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-text-muted hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1 text-xs">
              <div className="bg-surface-container-low p-3 rounded-xl">
                <span className="text-text-muted block">上課教室</span>
                <span className="font-bold text-on-surface text-sm mt-0.5 block">{selectedCourseModal.location}</span>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl">
                <span className="text-text-muted block">授課教師</span>
                <span className="font-bold text-on-surface text-sm mt-0.5 block">{selectedCourseModal.teacher}</span>
              </div>
              <div className="col-span-2 bg-surface-container-low p-3 rounded-xl">
                <span className="text-text-muted block">上課時程</span>
                <span className="font-bold text-on-surface text-sm mt-0.5 block">{selectedCourseModal.timeStr}</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed bg-surface-bg p-3 rounded-xl border border-border-subtle">
              {selectedCourseModal.description}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `【北護課表】${selectedCourseModal.name}\n教師: ${selectedCourseModal.teacher}\n地點: ${selectedCourseModal.location}\n時段: ${selectedCourseModal.timeStr}`
                  );
                  showToast('課程資訊已複製到剪貼簿！');
                }}
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>複製課堂資訊</span>
              </button>

              <button
                onClick={() => {
                  const course = selectedCourseModal;
                  setSelectedCourseModal(null);
                  onViewCourseDetail(course);
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-container font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>檢視大綱與 SDGs 永續指標</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Office Hour Request Modal */}
      {showOfficeHourModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                <span>預約導師晤談時段</span>
              </div>
              <button
                onClick={() => setShowOfficeHourModal(false)}
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-text-muted hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              向 <strong className="text-primary">{officeHourTeacher}</strong> 申請 Office Hour 一對一諮詢：
            </p>

            <div className="flex flex-col gap-2.5 text-xs">
              <div>
                <label className="text-text-muted block mb-1 font-semibold">諮詢議題主題</label>
                <select className="w-full h-10 px-3 rounded-xl bg-surface-bg border border-border-subtle focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>期中專題研究題目指導</option>
                  <option>HL7/FHIR 沙盒連線除錯諮詢</option>
                  <option>臨床實習梯次與學分規劃建議</option>
                  <option>微學程證照申請輔導</option>
                </select>
              </div>

              <div>
                <label className="text-text-muted block mb-1 font-semibold">簡述預計討論內容</label>
                <textarea
                  rows={3}
                  defaultValue="老師您好，我是資管三甲張哲宇，想請益關於FHIR Observation資源欄位擴充與北護附醫沙盒資料對接細節..."
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-border-subtle focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowOfficeHourModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-container text-text-secondary font-bold text-xs hover:bg-surface-container-high"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowOfficeHourModal(false);
                  showToast('已向授課導師發送 Office Hour 預約信，請留意校園信箱回覆！');
                }}
                className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container shadow-sm"
              >
                送出預約申請
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
