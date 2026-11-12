import React, { useEffect, useState } from 'react';
import { Course, StudentProfile } from '../types';
import { checkPrerequisite, seatsLeft } from '../lib/schedule';

/** 某一學期的開課紀錄（由 scripts/convert_courses.py 依課名彙整） */
interface HistoryEntry {
  semester: string; // 例如 '1141' = 114 學年度第 1 學期
  sections: number;
  enrolled: number;
  teachers: string[];
}

const semesterLabel = (code: string) => `${code.slice(0, 3)}-${code.slice(3)}`;

interface RealCourseBodyProps {
  course: Course;
  student?: Pick<StudentProfile, 'passedCourses'>;
}

/** 真實開課資料的課程詳情：只顯示學校資料裡有的內容，加上歷年開課紀錄 */
export const RealCourseBody: React.FC<RealCourseBodyProps> = ({ course, student }) => {
  // 歷年資料檔較大，打開課程詳情時才載入
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  useEffect(() => {
    let alive = true;
    setHistory(null);
    import('../data/generated/course-history.json').then(mod => {
      const all = mod.default as unknown as Record<string, HistoryEntry[]>;
      if (alive) setHistory(all[course.name] ?? []);
    });
    return () => {
      alive = false;
    };
  }, [course.name]);

  const totalSections = history?.reduce((sum, h) => sum + h.sections, 0) ?? 0;
  const totalEnrolled = history?.reduce((sum, h) => sum + h.enrolled, 0) ?? 0;
  const avgPerSection = totalSections ? Math.round(totalEnrolled / totalSections) : null;
  const maxEnrolled = Math.max(1, ...(history ?? []).map(h => h.enrolled));
  const prereq = student ? checkPrerequisite(course, student) : null;
  const left = seatsLeft(course);

  const card = 'bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border-subtle';
  const metric = 'bg-surface-card rounded-xl p-3.5 flex flex-col justify-between shadow-xs border border-border-subtle';

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        <div className={metric}>
          <span className="text-[11px] text-text-muted font-semibold">目前修課人數</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="font-semibold text-xl sm:text-2xl text-primary">{course.enrolled}</span>
            <span className="text-[11px] text-text-muted">人</span>
          </div>
          <span className="text-[11px] text-text-muted">
            {left === 0 ? '已額滿' : `餘 ${left} 席`}（名額 {course.capacity} 為推估）
          </span>
        </div>
        <div className={metric}>
          <span className="text-[11px] text-text-muted font-semibold">歷年每班平均</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="font-semibold text-xl sm:text-2xl text-primary">{avgPerSection ?? '—'}</span>
            <span className="text-[11px] text-text-muted">人</span>
          </div>
          <span className="text-[11px] text-text-muted">110～114 學年度</span>
        </div>
        <div className={metric}>
          <span className="text-[11px] text-text-muted font-semibold">歷年開課</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="font-semibold text-xl sm:text-2xl text-primary">{history ? history.length : '—'}</span>
            <span className="text-[11px] text-text-muted">個學期</span>
          </div>
          <span className="text-[11px] text-text-muted">共 {totalSections} 班次</span>
        </div>
      </div>

      <div className={card}>
        <h4 className="font-medium text-xs sm:text-sm text-primary mb-1.5">課程簡介</h4>
        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{course.description}</p>
      </div>

      {(course.note || course.requires?.length) && (
        <div className={`${card} space-y-2 text-xs`}>
          <h4 className="font-medium text-xs sm:text-sm text-primary">修課限制與先修條件</h4>
          {course.note && <p className="text-text-secondary leading-relaxed whitespace-pre-line">{course.note}</p>}
          {(course.requires ?? []).map(group => {
            const ok = prereq ? !prereq.missing.includes(group) : false;
            return (
              <p key={group.join('|')} className={`flex items-center gap-1.5 font-medium ${ok ? 'text-secondary' : 'text-amber-700'}`}>
                <span className="material-symbols-outlined text-[16px]">{ok ? 'check_circle' : 'error'}</span>
                先修《{group.join('》或《')}》：{ok ? '已及格' : '尚未及格'}（示範規則）
              </p>
            );
          })}
        </div>
      )}

      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-xs sm:text-sm text-primary">歷年開課紀錄</h4>
          <span className="text-[11px] text-text-muted">資料來源：學校全校修課資料表</span>
        </div>
        {history === null ? (
          <p className="text-xs text-text-muted py-2">載入中…</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-text-muted py-2">110～114 學年度沒有同名課程的開課紀錄，可能是新開課程。</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] text-text-muted border-b border-border-subtle">
                <th className="py-1.5 pr-2 font-medium whitespace-nowrap">學期</th>
                <th className="py-1.5 pr-2 font-medium whitespace-nowrap">班次</th>
                <th className="py-1.5 pr-2 font-medium">修課人數</th>
                <th className="py-1.5 font-medium">授課教師</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map(h => (
                <tr key={h.semester} className="border-b border-border-subtle/60 last:border-0 align-top">
                  <td className="py-2 pr-2 font-semibold text-on-surface whitespace-nowrap">{semesterLabel(h.semester)}</td>
                  <td className="py-2 pr-2 text-text-secondary">{h.sections}</td>
                  <td className="py-2 pr-3 w-[38%]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${(h.enrolled / maxEnrolled) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold text-on-surface tabular-nums">{h.enrolled || '—'}</span>
                    </div>
                  </td>
                  <td className="py-2 text-text-secondary">
                    {h.teachers.slice(0, 4).join('、')}
                    {h.teachers.length > 4 && ` 等 ${h.teachers.length} 位`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {history?.some(h => h.enrolled === 0) && (
          <p className="mt-2 text-[11px] text-text-muted">「—」表示該學期有排課但資料中修課人數為 0。</p>
        )}
      </div>
    </>
  );
};
