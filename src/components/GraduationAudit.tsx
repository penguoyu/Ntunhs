import React from 'react';
import { StudentProfile } from '../types';

interface GraduationAuditProps {
  student: StudentProfile;
  onFilterMissingCourses: () => void;
  showToast: (msg: string) => void;
}

export const GraduationAudit: React.FC<GraduationAuditProps> = ({
  student,
  onFilterMissingCourses,
  showToast,
}) => {
  const handleDownloadPDF = () => {
    showToast('正在生成「國立臺北護理健康大學_歷年修業學分審查表.pdf」...');
    setTimeout(() => {
      showToast('學分查核單 PDF 已成功下載至您的裝置！');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pb-16">
      {/* Student Profile Identity Card */}
      <div className="relative overflow-hidden bg-primary-container text-white rounded-2xl p-5 sm:p-6 shadow-md mb-6">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-surface-tint/30 pointer-events-none blur-xl"></div>
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary-fixed-dim/30 flex items-center justify-center text-primary-fixed">
                <span className="material-symbols-outlined text-[32px]">account_circle</span>
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-secondary-container flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg sm:text-xl text-white tracking-tight">{student.name}</h2>
                <span className="text-xs bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-bold">
                  {student.status}
                </span>
              </div>
              <span className="text-xs text-on-primary-container truncate mt-1">
                {student.department} • 學號 {student.studentId} • 健資醫資組
              </span>
            </div>
          </div>

          <button
            onClick={() => showToast('已同步教務處最新成績資料庫 (113-2)')}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 transition-all shrink-0"
            aria-label="更新學分資料"
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div className="mt-4 pt-3 grid grid-cols-3 gap-2 text-center relative z-10 bg-primary/40 rounded-xl p-3 backdrop-blur-sm border border-white/10">
          <div className="flex flex-col">
            <span className="text-[11px] text-on-primary-container">當前學期</span>
            <span className="font-bold text-sm sm:text-base text-white mt-0.5">113-2</span>
          </div>
          <div className="flex flex-col border-x border-white/15">
            <span className="text-[11px] text-on-primary-container">累積 GPA</span>
            <span className="font-bold text-sm sm:text-base text-secondary-fixed mt-0.5">
              {student.gpa.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-primary-container">畢業班排名</span>
            <span className="font-bold text-sm sm:text-base text-white mt-0.5">{student.rank}</span>
          </div>
        </div>
      </div>

      {/* Total Credit Progress Card */}
      <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border-subtle flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 text-primary font-bold text-base">
            <span className="material-symbols-outlined text-[22px]">donut_large</span>
            <span>總修業學分進度</span>
          </div>
          <span className="text-xs text-text-muted font-semibold">畢業門檻 128 學分</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          {/* Circular Donut Ring Chart */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
              {/* Completed: 86 / 128 = 67.2% */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#006b5f"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset="82.4"
                strokeLinecap="round"
              />
              {/* In Progress: +18 / 128 = 14% */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#0f4c81"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset="216"
                strokeLinecap="round"
                className="opacity-90"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-bold text-2xl text-primary leading-none">67%</span>
              <span className="text-[10px] text-text-muted mt-1 font-semibold">總達成</span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="flex flex-col justify-center gap-3 flex-1 w-full text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0"></span>
                <span className="font-semibold text-text-secondary">已取得實得學分</span>
              </div>
              <span className="font-bold text-sm text-on-surface">
                86 <span className="text-xs text-text-muted font-normal">分</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
                <span className="font-semibold text-text-secondary">本學期擬修中</span>
              </div>
              <span className="font-bold text-sm text-primary">
                +18 <span className="text-xs text-text-muted font-normal">分</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-conflict-danger shrink-0"></span>
                <span className="font-semibold text-text-secondary">未來尚缺學分</span>
              </div>
              <span className="font-bold text-sm text-conflict-danger">
                24 <span className="text-xs text-text-muted font-normal">分</span>
              </span>
            </div>
          </div>
        </div>

        {/* Estimation Banner */}
        <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between text-xs border border-border-subtle">
          <div className="flex items-center gap-2 text-text-secondary">
            <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
            <span>若本學期全數通過，達成率將達</span>
          </div>
          <span className="text-secondary font-bold text-sm">81.3% (104 / 128)</span>
        </div>
      </div>

      {/* 4 Core Pillars Breakdown */}
      <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border-subtle flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 text-primary font-bold text-base">
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            <span>四大核心領域指標</span>
          </div>
          <span className="text-xs text-text-muted">點擊各項檢視科目</span>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          {/* Item 1: Common Required */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                <span className="font-bold text-sm text-on-surface">校訂共同必修</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-on-secondary-container bg-secondary-container px-2 py-0.5 rounded-full">
                  已全數達成
                </span>
                <span className="font-bold text-sm text-on-surface">18 / 18</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="text-text-muted">
              已抵免國文(4)、大一英文(4)、體育與軍訓全數合規。
            </span>
          </div>

          {/* Item 2: Major Required */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-general-sky text-[18px]">trending_up</span>
                <span className="font-bold text-sm text-on-surface">系專業必修</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                  58% 進行中
                </span>
                <span className="font-bold text-sm text-on-surface">42 / 72</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-general-sky rounded-full" style={{ width: '58.3%' }}></div>
            </div>
            <div className="flex items-center justify-between text-text-muted">
              <span>本學期修習中：內外護(二)、基本護理實習 (共 8 學分)</span>
              <span className="text-primary font-bold">尚缺 30</span>
            </div>
          </div>

          {/* Item 3: Major Electives */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-clinical-purple text-[18px]">
                  pending_actions
                </span>
                <span className="font-bold text-sm text-on-surface">系專業選修</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-conflict-danger bg-error-container px-2 py-0.5 rounded-full">
                  尚缺 16 學分
                </span>
                <span className="font-bold text-sm text-on-surface">10 / 26</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-clinical-purple rounded-full" style={{ width: '38.5%' }}></div>
            </div>
            <span className="text-text-muted">
              建議大三上實習前多選修 2 門專業臨床微模組課程。
            </span>
          </div>

          {/* Item 4: General Education */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary-container text-[18px]">
                  menu_book
                </span>
                <span className="font-bold text-sm text-on-surface">博雅通識領域</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded-full">
                  尚缺 6 學分
                </span>
                <span className="font-bold text-sm text-on-surface">6 / 12</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-tertiary-container rounded-full" style={{ width: '50%' }}></div>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-[11px] bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-conflict-danger">priority_high</span>
                缺 社會科學 2 學分
              </span>
              <span className="text-[11px] bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-conflict-danger">priority_high</span>
                缺 美育探索 4 學分
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prerequisite Warnings & Guardrail Network */}
      <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border-subtle flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 text-conflict-danger font-bold text-base">
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
            <span>關鍵擋修與先修鏈預警</span>
          </div>
          <span className="text-xs text-primary font-bold bg-primary-fixed px-2.5 py-0.5 rounded-full">
            先修防護網
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Chain 1 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="font-bold text-sm text-on-surface">醫療資訊系統整合與HL7/FHIR</span>
                <span className="text-text-muted">3 學分</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold text-[11px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock_open</span>
                已解鎖可修
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary pl-4">
              <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
              <span>先修條件：《資料庫管理系統》及格 (88分)</span>
            </div>
          </div>

          {/* Chain 2 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                <span className="font-bold text-sm text-on-surface">臨床醫學資訊實踐專案與實習</span>
                <span className="text-text-muted">4 學分</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold text-[11px]">
                四年級開放
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary pl-4">
              <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
              <span>先修門檻 1：醫療資訊系統規劃 本學期進行中</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary pl-4">
              <span className="material-symbols-outlined text-[16px] text-text-muted">schedule</span>
              <span>先修門檻 2：病歷資訊管理師或專業證照檢定合格</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onFilterMissingCourses}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">filter_alt</span>
          <span>從尚缺領域中，一鍵篩選本學期可修課程</span>
        </button>

        <button
          onClick={handleDownloadPDF}
          className="w-full py-3 bg-surface-card hover:bg-surface-container text-primary font-bold text-xs sm:text-sm rounded-xl border border-border-subtle flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>下載完整歷年成績與學分核算單 (PDF)</span>
        </button>
      </div>
    </div>
  );
};
