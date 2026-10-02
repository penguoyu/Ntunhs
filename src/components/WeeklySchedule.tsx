import React, { useState } from 'react';
import { Course } from '../types';

interface WeeklyScheduleProps {
  scheduleCourses: Course[];
  onViewCourseDetail: (course: Course) => void;
  onNavigateToGis: (course: Course) => void;
  onOpenConflictResolver: () => void;
  showToast: (msg: string) => void;
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  scheduleCourses,
  onViewCourseDetail,
  onNavigateToGis,
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

        {/* 3. Campus GIS Mobility Metric */}
        <div
          onClick={() => onNavigateToGis(scheduleCourses[0] || ({} as any))}
          className="bg-surface-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border-subtle flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">校園移動動線</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl text-primary">2 座大樓</span>
              <span className="text-xs text-general-sky font-semibold">平均步程 3.5 分</span>
            </div>
            <span className="text-xs text-text-muted">資科大樓 ↔ 學思樓 (無趕課緊迫)</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[26px]">directions_walk</span>
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
                {/* Days Header */}
                <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 items-center pb-2 text-center text-xs">
                  <div className="font-semibold text-text-muted">節次</div>
                  <div className="flex flex-col items-center py-2 rounded-xl bg-surface-container-low">
                    <span className="text-text-muted text-[10px]">一</span>
                    <span className="font-bold text-primary text-sm">Mon</span>
                  </div>
                  <div className="flex flex-col items-center py-2 rounded-xl bg-surface-container-low">
                    <span className="text-text-muted text-[10px]">二</span>
                    <span className="font-bold text-primary text-sm">Tue</span>
                  </div>
                  <div className="flex flex-col items-center py-2 rounded-xl bg-surface-container-low">
                    <span className="text-text-muted text-[10px]">三</span>
                    <span className="font-bold text-primary text-sm">Wed</span>
                  </div>
                  <div className="flex flex-col items-center py-2 rounded-xl bg-surface-container-low">
                    <span className="text-text-muted text-[10px]">四</span>
                    <span className="font-bold text-primary text-sm">Thu</span>
                  </div>
                  <div className="flex flex-col items-center py-2 rounded-xl bg-surface-container-high text-primary font-bold">
                    <span className="text-text-secondary text-[10px]">五</span>
                    <span className="text-sm">Fri</span>
                  </div>
                </div>

                {/* Grid Rows: Periods 1 to 8 + Noon Break */}
                <div className="flex flex-col gap-2 select-none text-xs">
              {/* Period 1 */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 min-h-[58px]">
                <div className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle">
                  <span className="font-bold text-primary">1</span>
                  <span className="text-[10px] text-text-muted">08:10</span>
                </div>
                {/* Mon P1-3: Algorithm */}
                <div
                  onClick={() => setSelectedCourseModal(scheduleCourses.find(c => c.id === 'CS301') || null)}
                  className="row-span-3 bg-primary-fixed hover:bg-primary-fixed-dim transition-all p-2 rounded-xl flex flex-col justify-between cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                      <span className="font-bold text-on-primary-fixed truncate">演算法資料結構</span>
                    </div>
                    <p className="text-[11px] text-on-primary-fixed-variant truncate mt-0.5">資科 I501</p>
                  </div>
                  <span className="text-[10px] text-primary font-bold text-right">必修 3.0</span>
                </div>
                {/* Tue P1 Empty */}
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">晨間專注</span>
                </div>
                {/* Wed P1 Empty */}
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">外語自主</span>
                </div>
                {/* Thu P1 Empty */}
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">文獻預習</span>
                </div>
                {/* Fri P1 Empty (Research slot) */}
                <div className="bg-surface-container-low rounded-xl flex items-center justify-center text-center p-1">
                  <span className="text-[10px] text-text-muted">專題研讀</span>
                </div>
              </div>

              {/* Period 2 */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 min-h-[58px]">
                <div className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle">
                  <span className="font-bold text-primary">2</span>
                  <span className="text-[10px] text-text-muted">09:10</span>
                </div>
                <div className="hidden"></div>
                {/* Tue P2-4: FHIR Standards */}
                <div
                  onClick={() => setSelectedCourseModal(scheduleCourses.find(c => c.id === 'IM3012') || null)}
                  className="row-span-3 bg-primary-fixed hover:bg-primary-fixed-dim transition-all p-2 rounded-xl flex flex-col justify-between cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                      <span className="font-bold text-on-primary-fixed truncate">醫療資訊FHIR</span>
                    </div>
                    <p className="text-[11px] text-on-primary-fixed-variant truncate mt-0.5">資科 I502</p>
                  </div>
                  <span className="text-[10px] text-primary font-bold text-right">必修 3.0</span>
                </div>
                {/* Wed P2 */}
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">Python習作</span>
                </div>
                {/* Thu P2 */}
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">生理量測分析</span>
                </div>
                {/* Fri P2-3: Medical Ethics */}
                <div
                  onClick={() => setSelectedCourseModal(scheduleCourses.find(c => c.id === 'GE2109') || null)}
                  className="row-span-2 bg-tertiary-fixed/90 hover:bg-tertiary-fixed transition-all p-2 rounded-xl flex flex-col justify-between cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>
                      <span className="font-bold text-on-tertiary-fixed truncate">醫學倫理與法規</span>
                    </div>
                    <p className="text-[11px] text-on-tertiary-fixed-variant truncate mt-0.5">文教 B101</p>
                  </div>
                  <span className="text-[10px] text-tertiary font-bold text-right">通識 2.0</span>
                </div>
              </div>

              {/* Period 3 */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 min-h-[58px]">
                <div className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle">
                  <span className="font-bold text-primary">3</span>
                  <span className="text-[10px] text-text-muted">10:10</span>
                </div>
                <div className="hidden"></div>
                <div className="hidden"></div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">館藏檢索</span>
                </div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">臨床討論</span>
                </div>
                <div className="hidden"></div>
              </div>

              {/* Period 4 */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 min-h-[58px]">
                <div className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle">
                  <span className="font-bold text-primary">4</span>
                  <span className="text-[10px] text-text-muted">11:10</span>
                </div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">空檔午膳</span>
                </div>
                <div className="hidden"></div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">課業自習</span>
                </div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">移至學思樓</span>
                </div>
                <div className="bg-surface-container-low rounded-xl flex items-center justify-center text-center p-1">
                  <span className="text-[10px] text-text-muted">文獻研析</span>
                </div>
              </div>

              {/* Noon Rest Break Divider */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 py-1">
                <div className="text-center font-bold text-text-muted self-center">午休</div>
                <div className="col-span-5 bg-surface-container-low rounded-xl py-2 px-4 flex items-center justify-between text-text-muted text-xs border border-border-subtle">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-tertiary-container">restaurant</span>
                    <span>12:00 - 13:30 午餐與休整 | 學生一餐、親仁大樓咖啡館全開</span>
                  </span>
                  <span className="text-secondary font-bold hidden sm:inline">小憩 90 分鐘</span>
                </div>
              </div>

              {/* Period 5 */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 min-h-[58px]">
                <div className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle">
                  <span className="font-bold text-primary">5</span>
                  <span className="text-[10px] text-text-muted">13:30</span>
                </div>
                {/* Mon P5-6: Biostats */}
                <div
                  onClick={() => setSelectedCourseModal(scheduleCourses.find(c => c.id === 'BIO202') || null)}
                  className="row-span-2 bg-secondary-container/90 hover:bg-secondary-container transition-all p-2 rounded-xl flex flex-col justify-between cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                      <span className="font-bold text-on-secondary-container truncate">生醫統計R</span>
                    </div>
                    <p className="text-[11px] text-on-secondary-fixed-variant truncate mt-0.5">文教 B204</p>
                  </div>
                  <span className="text-[10px] text-secondary font-bold text-right">跨選 2.0</span>
                </div>
                {/* Tue P5 */}
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">系統設計</span>
                </div>
                {/* Wed P5-7: Health Big Data */}
                <div
                  onClick={() => setSelectedCourseModal(scheduleCourses.find(c => c.id === 'IM3105') || null)}
                  className="row-span-3 bg-surface-container-highest hover:bg-surface-variant transition-all p-2 rounded-xl flex flex-col justify-between cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-clinical-purple shrink-0"></span>
                      <span className="font-bold text-on-surface truncate">健康大數據</span>
                    </div>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">資科 I401</p>
                  </div>
                  <span className="text-[10px] text-clinical-purple font-bold text-right">選修 3.0</span>
                </div>
                {/* Thu P5-6: Smart Nursing */}
                <div
                  onClick={() => setSelectedCourseModal(scheduleCourses.find(c => c.id === 'NUR3402') || null)}
                  className="row-span-2 bg-tertiary-fixed/90 hover:bg-tertiary-fixed transition-all p-2 rounded-xl flex flex-col justify-between cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>
                      <span className="font-bold text-on-tertiary-fixed truncate">智慧護理</span>
                    </div>
                    <p className="text-[11px] text-on-tertiary-fixed-variant truncate mt-0.5">學思 F401</p>
                  </div>
                  <span className="text-[10px] text-tertiary font-bold text-right">跨系 2.0</span>
                </div>
                {/* Fri P5-8: Research Day Block */}
                <div className="row-span-4 bg-surface-container-low rounded-xl p-2.5 flex flex-col justify-between border border-border-subtle">
                  <div>
                    <span className="px-1.5 py-0.5 rounded bg-general-sky text-white font-bold text-[9px]">
                      專題日
                    </span>
                    <h5 className="font-bold text-xs text-primary mt-1">智慧醫療專題實作</h5>
                    <p className="text-[10px] text-text-muted mt-0.5">全日自主研發 / 企業實習準備</p>
                  </div>
                  <span className="text-[10px] text-secondary font-semibold">自習A座已核可</span>
                </div>
              </div>

              {/* Period 6 */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 min-h-[58px]">
                <div className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle">
                  <span className="font-bold text-primary">6</span>
                  <span className="text-[10px] text-text-muted">14:30</span>
                </div>
                <div className="hidden"></div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">介面除錯</span>
                </div>
                <div className="hidden"></div>
                <div className="hidden"></div>
                <div className="hidden"></div>
              </div>

              {/* Period 7 */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 min-h-[58px]">
                <div className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle">
                  <span className="font-bold text-primary">7</span>
                  <span className="text-[10px] text-text-muted">15:30</span>
                </div>
                {/* Mon P7-8: Wearable IoT */}
                <div
                  onClick={() => setSelectedCourseModal(scheduleCourses.find(c => c.id === 'IM3208') || null)}
                  className="row-span-2 bg-secondary-fixed/50 hover:bg-secondary-fixed transition-all p-2 rounded-xl flex flex-col justify-between cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                      <span className="font-bold text-on-secondary-fixed truncate">穿戴式物聯網</span>
                    </div>
                    <p className="text-[11px] text-on-secondary-fixed-variant truncate mt-0.5">OSC3</p>
                  </div>
                  <span className="text-[10px] text-secondary font-bold text-right">選修 2.0</span>
                </div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">導生晤談</span>
                </div>
                <div className="hidden"></div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">模擬復盤</span>
                </div>
                <div className="hidden"></div>
              </div>

              {/* Period 8 */}
              <div className="grid grid-cols-[60px_repeat(5,1fr)] sm:grid-cols-[80px_repeat(5,1fr)] gap-1.5 min-h-[58px]">
                <div className="flex flex-col justify-center items-center bg-surface-container-lowest rounded-xl p-1 text-center border border-border-subtle">
                  <span className="font-bold text-primary">8</span>
                  <span className="text-[10px] text-text-muted">16:30</span>
                </div>
                <div className="hidden"></div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">實驗室組會</span>
                </div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">課後習題</span>
                </div>
                <div className="bg-surface-container-lowest rounded-xl border border-dashed border-border-subtle flex items-center justify-center">
                  <span className="text-[10px] text-text-muted">專案彙整</span>
                </div>
                <div className="hidden"></div>
              </div>
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

      {/* Lower Section 3 Columns: Office Hours, Campus GIS, Library & Ratings */}
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

        {/* 2. Campus GIS Route Advisory */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[20px]">near_me</span>
                <h3 className="font-bold text-sm sm:text-base">趕課動線與校園 GIS 導引</h3>
              </div>
              <span className="text-xs text-primary font-semibold">北護校本部平面</span>
            </div>

            {/* GIS Map Image preview */}
            <div
              onClick={() => onNavigateToGis(scheduleCourses[0] || ({} as any))}
              className="w-full h-40 rounded-xl bg-cover bg-center relative overflow-hidden shadow-inner flex flex-col justify-end p-3 cursor-pointer group"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB55SE6PSWA7lkGCDR_BrVWAAuG7EI2UGfusUGFecXXXb1ARj65fHwgORvSVyPhHzaBxMNmBIVJxiFNmtQanN0jwHdMjp52RMh51lTQat7e4NyUhutagRutB8vZjbU_tJw0dxjDBxik1j7XanTUOYjr8bsow5SqBKq-mlqLDc18BiFAUMrSg7KUZD7ctGBVF2YhSWpisve5eSBT2RgVVhwKLoymf8BukpSKFH6y4HiZpy-SuQ9vDJ8N')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent group-hover:from-primary transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[16px] text-secondary-container">route</span>
                  <span>資科大樓 ➔ 學思樓：240 公尺</span>
                </div>
                <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded text-[10px]">
                  建議路徑：經椰林大道
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
                <span className="text-[11px] text-text-muted">平均轉堂緩衝時間</span>
                <span className="text-sm font-bold text-primary">10 分鐘 (充裕)</span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
                <span className="text-[11px] text-text-muted">下雨備用路徑</span>
                <span className="text-sm font-bold text-primary">連通走廊 (全程不淋雨)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToGis(scheduleCourses[0] || ({} as any))}
            className="w-full mt-4 py-2 bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            <span>打開 3D 智慧導航地圖</span>
          </button>
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
                  onNavigateToGis(course);
                }}
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">navigation</span>
                <span>教室 GIS 導航</span>
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
                <span>查看課綱</span>
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
