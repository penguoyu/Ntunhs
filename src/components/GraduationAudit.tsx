import React from 'react';
import { Course, StudentProfile } from '../types';
import { SEMESTER_CODE } from '../data/semester';
import { AuditCategoryKey } from '../data/graduation';
import { buildAudit } from '../lib/audit';
import { checkPrerequisite } from '../lib/schedule';

const RING = 251.2; // 圓環周長 2πr，r = 40

const CATEGORY_META: { key: AuditCategoryKey; label: string; icon: string; iconTone: string; bar: string }[] = [
  { key: 'common', label: '校訂共同必修', icon: 'school', iconTone: 'text-secondary', bar: 'bg-secondary' },
  { key: 'required', label: '系專業必修', icon: 'trending_up', iconTone: 'text-general-sky', bar: 'bg-general-sky' },
  { key: 'elective', label: '系專業選修', icon: 'pending_actions', iconTone: 'text-clinical-purple', bar: 'bg-clinical-purple' },
  { key: 'general', label: '博雅通識領域', icon: 'menu_book', iconTone: 'text-tertiary-container', bar: 'bg-tertiary-container' },
];

interface GraduationAuditProps {
  student: StudentProfile;
  /** 目前課表（本學期修習中） */
  scheduleCourses: Course[];
  /** 預選清單 */
  cartCourses: Course[];
  onFilterMissingCourses: () => void;
  showToast: (msg: string) => void;
}

export const GraduationAudit: React.FC<GraduationAuditProps> = ({
  student,
  scheduleCourses,
  cartCourses,
  onFilterMissingCourses,
  showToast,
}) => {
  const audit = buildAudit(student, scheduleCourses);
  const sdgDone = audit.sdgCount >= audit.sdgRequired;
  const prereqCourses = cartCourses
    .filter(c => c.requires?.length)
    .map(course => ({ course, check: checkPrerequisite(course, student) }));

  /** 產生可列印的學分核算單，用瀏覽器「另存為 PDF」下載 */
  const handleDownloadPDF = () => {
    const w = window.open('', '_blank');
    if (!w) {
      showToast('瀏覽器擋住了新視窗，請允許彈出視窗後再試一次');
      return;
    }
    const esc = (t: string) => t.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]!);
    const rows = CATEGORY_META.map(meta => {
      const cat = audit.categories[meta.key];
      return `<tr><td>${meta.label}</td><td>${cat.required}</td><td>${cat.earned}</td><td>${cat.inProgress}</td><td>${cat.missing}</td></tr>`;
    }).join('');
    const courses = scheduleCourses
      .map(c => `<tr><td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${c.credits}</td><td>${esc(c.category)}</td></tr>`)
      .join('');
    w.document.write(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>學分核算單_${esc(student.studentId)}</title>
<style>body{font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;margin:32px;color:#131b2e}h1{font-size:20px;margin:0 0 4px}p{margin:2px 0;font-size:13px;color:#475569}
table{border-collapse:collapse;width:100%;margin-top:14px;font-size:13px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#eef2ff}
.note{margin-top:18px;font-size:11px;color:#64748b}@media print{button{display:none}}</style></head><body>
<h1>國立臺北護理健康大學　學分核算單（模擬）</h1>
<p>${esc(student.name)}　${esc(student.studentId)}　${esc(student.department)}</p>
<p>畢業門檻 ${audit.total} 學分，已取得 ${audit.earned}，本學期修習中 ${audit.inProgress}，全數通過後仍缺 ${audit.remaining} 學分</p>
<table><thead><tr><th>類別</th><th>應修</th><th>已取得</th><th>本學期修習中</th><th>通過後仍缺</th></tr></thead><tbody>${rows}</tbody></table>
<table><thead><tr><th>課號</th><th>本學期課程</th><th>學分</th><th>類別</th></tr></thead><tbody>${courses || '<tr><td colspan=4>無</td></tr>'}</tbody></table>
<p class="note">SDGs：已涵蓋 ${audit.sdgCount} 項（畢業需 ${audit.sdgRequired} 項）。本表為選課系統模擬資料，正式成績以教務處為準。產生時間：${new Date().toLocaleString('zh-TW')}</p>
<button onclick="print()">列印／另存為 PDF</button>
<script>setTimeout(()=>print(),300)</script></body></html>`);
    w.document.close();
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
                <h2 className="font-semibold text-lg sm:text-xl text-white tracking-tight">{student.name}</h2>
                <span className="text-xs bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-medium">
                  {student.status}
                </span>
              </div>
              <span className="text-xs text-on-primary-container truncate mt-1">
                {student.department} • 學號 {student.studentId}
              </span>
            </div>
          </div>

          <button
            onClick={() => showToast(`已重新整理成績資料（${SEMESTER_CODE}）`)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 transition shrink-0"
            aria-label="更新學分資料"
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div className="mt-4 pt-3 grid grid-cols-3 gap-2 text-center relative z-10 bg-primary/40 rounded-xl p-3 backdrop-blur-sm border border-white/10">
          <div className="flex flex-col">
            <span className="text-[11px] text-on-primary-container">當前學期</span>
            <span className="font-semibold text-sm sm:text-base text-white mt-0.5">{SEMESTER_CODE}</span>
          </div>
          <div className="flex flex-col border-x border-white/15">
            <span className="text-[11px] text-on-primary-container">累積 GPA</span>
            <span className="font-semibold text-sm sm:text-base text-secondary-fixed mt-0.5">
              {student.gpa.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-on-primary-container">畢業班排名</span>
            <span className="font-semibold text-sm sm:text-base text-white mt-0.5">{student.rank}</span>
          </div>
        </div>
      </div>

      {/* Total Credit Progress Card */}
      <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border-subtle flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 text-primary font-semibold text-base">
            <span className="material-symbols-outlined text-[22px]">donut_large</span>
            <span>總修業學分進度</span>
          </div>
          <span className="text-xs text-text-muted font-medium">畢業門檻 {audit.total} 學分</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          {/* 圓環：外圈為已取得 + 本學期修習中，內層為已取得 */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#0f4c81"
                strokeWidth="10"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - Math.min(1, (audit.earned + audit.inProgress) / audit.total))}
                className="opacity-90"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#006b5f"
                strokeWidth="10"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - Math.min(1, audit.earned / audit.total))}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-semibold text-2xl text-primary leading-none">
                {Math.round((audit.earned / audit.total) * 100)}%
              </span>
              <span className="text-[11px] text-text-muted mt-1 font-semibold">已取得</span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="flex flex-col justify-center gap-3 flex-1 w-full text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0"></span>
                <span className="font-semibold text-text-secondary">已取得實得學分</span>
              </div>
              <span className="font-semibold text-sm text-on-surface">
                {audit.earned} <span className="text-xs text-text-muted font-normal">分</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
                <span className="font-semibold text-text-secondary">本學期修習中（{scheduleCourses.length} 門）</span>
              </div>
              <span className="font-semibold text-sm text-primary">
                +{audit.inProgress} <span className="text-xs text-text-muted font-normal">分</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-conflict-danger shrink-0"></span>
                <span className="font-semibold text-text-secondary">未來尚缺學分</span>
              </div>
              <span className="font-semibold text-sm text-conflict-danger">
                {audit.remaining} <span className="text-xs text-text-muted font-normal">分</span>
              </span>
            </div>
          </div>
        </div>

        {/* Estimation Banner */}
        <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between text-xs border border-border-subtle">
          <div className="flex items-center gap-2 text-text-secondary">
            <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
            <span>本學期全數通過後</span>
          </div>
          <span className="text-secondary font-semibold text-sm">
            {(((audit.earned + audit.inProgress) / audit.total) * 100).toFixed(1)}% ({audit.earned + audit.inProgress} /{' '}
            {audit.total})
          </span>
        </div>
      </div>

      {/* 各類別學分 */}
      <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border-subtle flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 text-primary font-semibold text-base">
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            <span>各類別學分</span>
          </div>
          <span className="text-xs text-text-muted">修習中的課來自目前課表</span>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          {CATEGORY_META.map(meta => {
            const cat = audit.categories[meta.key];
            const done = cat.earned >= cat.required;
            return (
              <div
                key={meta.key}
                className="bg-surface-container-lowest p-4 rounded-xl border border-border-subtle flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`material-symbols-outlined text-[18px] ${meta.iconTone}`}>
                      {done ? 'check_circle' : meta.icon}
                    </span>
                    <span className="font-semibold text-sm text-on-surface">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        done
                          ? 'text-on-secondary-container bg-secondary-container'
                          : cat.missing === 0
                            ? 'text-primary bg-primary-fixed'
                            : 'text-conflict-danger bg-error-container'
                      }`}
                    >
                      {done ? '已修畢' : cat.missing === 0 ? '本學期通過後修畢' : `尚缺 ${cat.missing} 學分`}
                    </span>
                    <span className="font-semibold text-sm text-on-surface">
                      {cat.earned} / {cat.required}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden flex">
                  <div className={`h-full ${meta.bar}`} style={{ width: `${cat.percent}%` }}></div>
                  <div
                    className={`h-full ${meta.bar} opacity-40`}
                    style={{ width: `${Math.min(100 - cat.percent, (cat.inProgress / cat.required) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-text-muted">
                  {cat.inProgress > 0
                    ? `本學期修習中：${cat.inProgressCourses.map(c => c.name).join('、')}（共 ${cat.inProgress} 學分）`
                    : done
                      ? '此類別已修畢。'
                      : '本學期沒有修習此類別的課程。'}
                </span>
                {meta.key === 'general' && audit.generalMissing.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    {audit.generalMissing.map(m => (
                      <span
                        key={m.area}
                        title={m.taking.length ? `本學期修習中：${m.taking.map(c => c.name).join('、')}` : undefined}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                          m.remaining === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[14px] ${m.remaining === 0 ? 'text-emerald-600' : 'text-conflict-danger'}`}>
                          {m.remaining === 0 ? 'check' : 'priority_high'}
                        </span>
                        {m.remaining === 0
                          ? `${m.area} 修習中可補足`
                          : `缺 ${m.area} ${m.remaining} 學分${m.inProgress ? `（修習中 ${m.inProgress}）` : ''}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* SDGs 永續課程門檻 */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-emerald-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">eco</span>
                <span className="font-semibold text-sm text-on-surface">SDGs 永續課程門檻</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    sdgDone ? 'text-emerald-800 bg-emerald-100' : 'text-conflict-danger bg-error-container'
                  }`}
                >
                  {sdgDone ? '已達標' : `尚缺 ${audit.sdgRequired - audit.sdgCount} 項`}
                </span>
                <span className="font-semibold text-sm text-emerald-800">
                  {audit.sdgCount} / {audit.sdgRequired} 項
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${Math.min(100, (audit.sdgCount / audit.sdgRequired) * 100)}%` }}
              ></div>
            </div>
            <span className="text-text-muted text-xs">
              已修課程涵蓋 {audit.sdgEarned} 項
              {audit.sdgNew.length > 0 && `，本學期課表再新增 ${audit.sdgNew.map(id => `SDG ${id}`).join('、')}`}
              ，合計 {audit.sdgCount} 項 SDGs 目標（畢業需 {audit.sdgRequired} 項；本學期課程的 SDGs 依課名自動對應，模擬）。
            </span>
          </div>
        </div>
      </div>

      {/* 先修條件：依預選清單與已及格科目即時檢核 */}
      <div className="bg-surface-card rounded-2xl p-5 sm:p-6 shadow-sm border border-border-subtle flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 text-primary font-semibold text-base">
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
            <span>預選課程的先修條件</span>
          </div>
        </div>

        {prereqCourses.length === 0 ? (
          <p className="text-xs text-text-muted py-2">預選清單中沒有設先修條件的課程。</p>
        ) : (
          <div className="space-y-3 text-xs">
            {prereqCourses.map(({ course, check }) => (
              <div
                key={course.id}
                className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${check.met ? 'bg-secondary' : 'bg-amber-500'}`}></span>
                    <span className="font-semibold text-sm text-on-surface truncate">{course.name}</span>
                    <span className="text-text-muted shrink-0">{course.credits} 學分</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1 shrink-0 ${
                      check.met ? 'bg-secondary-container text-on-secondary-container' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{check.met ? 'lock_open' : 'lock'}</span>
                    {check.met ? '可修' : '未符先修'}
                  </span>
                </div>
                {(course.requires ?? []).map(group => {
                  const ok = !check.missing.includes(group);
                  return (
                    <div key={group.join('|')} className="flex items-center gap-1.5 text-text-secondary pl-4">
                      <span
                        className={`material-symbols-outlined text-[16px] ${ok ? 'text-secondary' : 'text-amber-600'}`}
                      >
                        {ok ? 'check_circle' : 'error'}
                      </span>
                      <span>
                        《{group.join('》或《')}》{ok ? '已及格' : '尚未及格'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onFilterMissingCourses}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-[0.98] transition"
        >
          <span className="material-symbols-outlined text-[20px]">filter_alt</span>
          <span>查看可補足通識缺額的課程</span>
        </button>

        <button
          onClick={handleDownloadPDF}
          className="w-full py-3 bg-surface-card hover:bg-surface-container text-primary font-medium text-xs sm:text-sm rounded-xl border border-border-subtle flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>下載完整歷年成績與學分核算單 (PDF)</span>
        </button>
      </div>
    </div>
  );
};
