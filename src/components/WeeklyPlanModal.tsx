import React, { useEffect } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Course } from '../types';
import { formatCourseTime } from '../lib/schedule';
import { hasExtractedTopics, weekLabel, weeklyRowsOf } from '../lib/weeklyPlan';

interface WeeklyPlanModalProps {
  course: Course;
  onClose: () => void;
}

const tagStyle = (tag: string) =>
  tag === '期中' || tag === '期末'
    ? 'bg-amber-100 text-amber-800'
    : tag === '課程介紹' || tag === '複習'
      ? 'bg-surface-container-high text-text-secondary'
      : 'bg-primary-fixed text-primary';

/** 每週上課進度（仿學校教學大綱的週次表，模擬資料） */
export const WeeklyPlanModal: React.FC<WeeklyPlanModalProps> = ({ course, onClose }) => {
  const rows = weeklyRowsOf(course);
  const fromDescription = hasExtractedTopics(course);
  const teachers = course.teacher.split(/[、,，]/).filter(Boolean);
  const teacherShort = teachers.length > 1 ? `${teachers[0]} 等` : course.teacher;

  // 疊在課程詳情上面：Esc 只關這一層
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="每週上課進度">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-surface-card w-full sm:max-w-5xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border-subtle flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border-subtle">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
              <CalendarDays size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-primary flex items-center gap-2 flex-wrap">
                每週上課進度
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-medium text-text-secondary">模擬</span>
              </h3>
              <p className="text-xs text-text-muted truncate">
                {course.name} ・ {course.teacher} ・ {formatCourseTime(course)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="關閉" className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center text-text-muted shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 sm:px-6 py-4">
          <p className="text-[11px] text-text-muted leading-relaxed mb-3">
            {fromDescription ? '課程進度依課程簡介列出的單元自動排定' : '課程簡介沒有列出單元，先以同類課程的通用進度示意'}
            ；日期以 115/09/07 開學、每週上課第一天推算，遇國定假日依學校行事曆調整。實際內容以老師上傳的教學大綱為準。
          </p>

          {/* 電腦版：表格 */}
          <table className="hidden md:table w-full text-xs border border-border-subtle rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-primary text-white text-left">
                <th className="py-2.5 px-3 font-semibold w-[132px]">週次／上課日期</th>
                <th className="py-2.5 px-3 font-semibold">課程進度</th>
                <th className="py-2.5 px-3 font-semibold">課程內容（主要教學活動及作業）</th>
                <th className="py-2.5 px-3 font-semibold w-[104px]">上課時數／節次</th>
                <th className="py-2.5 px-3 font-semibold w-[84px]">備註</th>
                <th className="py-2.5 px-3 font-semibold w-[96px]">授課教師</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.map(r => (
                <tr key={r.week} className={r.tag === '期中' || r.tag === '期末' ? 'bg-amber-50/60' : 'odd:bg-surface-card even:bg-surface-container-low'}>
                  <td className="py-2.5 px-3 align-top">
                    <div className="font-semibold text-primary">第{weekLabel(r.week)}週</div>
                    <div className="text-text-muted font-mono text-[11px] mt-0.5">{r.date}</div>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1.5 ${tagStyle(r.tag)}`}>{r.tag}</span>
                    <span className="font-medium text-on-surface">{r.progress}</span>
                  </td>
                  <td className="py-2.5 px-3 align-top text-text-secondary">{r.content}</td>
                  <td className="py-2.5 px-3 align-top">
                    <div>時數：{r.hours}</div>
                    <div className="font-mono text-[11px] text-text-muted">{r.periods}</div>
                  </td>
                  <td className="py-2.5 px-3 align-top text-text-muted">{r.note}</td>
                  <td className="py-2.5 px-3 align-top text-text-secondary">{teacherShort}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 手機版：一週一張卡 */}
          <ol className="md:hidden space-y-2">
            {rows.map(r => (
              <li
                key={r.week}
                className={`p-3 rounded-xl border text-xs ${
                  r.tag === '期中' || r.tag === '期末' ? 'bg-amber-50/60 border-amber-200' : 'bg-surface-container-low border-border-subtle'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-primary">第{weekLabel(r.week)}週</span>
                  <span className="font-mono text-[11px] text-text-muted">{r.date}</span>
                </div>
                <div className="mt-1.5 flex items-start gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${tagStyle(r.tag)}`}>{r.tag}</span>
                  <span className="font-medium text-on-surface">{r.progress}</span>
                </div>
                <p className="text-text-secondary mt-1">{r.content}</p>
                <p className="text-[11px] text-text-muted mt-1">
                  時數 {r.hours} ・ {r.periods}
                  {r.note && ` ・ ${r.note}`}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-border-subtle px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-text-muted">模擬資料・正式版將串接學校教學大綱系統</span>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-container whitespace-nowrap">
            返回課程詳情
          </button>
        </div>
      </div>
    </div>
  );
};
