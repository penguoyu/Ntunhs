import React from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import { Course } from '../types';
import { formatCourseTime } from '../lib/schedule';

export interface BackfillResult {
  course: Course;
  accepted: boolean;
  /** 未能遞補的原因 */
  reason?: string;
}

/** FR-07 自動遞補結果通知（模擬） */
export const BackfillResultModal: React.FC<{ result: BackfillResult; onClose: () => void }> = ({ result, onClose }) => {
  const { course, accepted, reason } = result;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="候補遞補結果">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface-card shadow-2xl p-6 text-center">
        <div
          className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
            accepted ? 'bg-emerald-50 text-secondary' : 'bg-red-50 text-conflict-danger'
          }`}
        >
          {accepted ? <CircleCheck size={30} /> : <CircleX size={30} />}
        </div>
        <h2 className="mt-3 text-lg font-semibold text-on-surface">{accepted ? '候補遞補成功' : '這次無法遞補'}</h2>
        <p className="mt-1 text-sm font-semibold text-primary">《{course.name}》</p>
        <p className="text-xs text-text-muted">
          {formatCourseTime(course)} ・ {course.room || course.location} ・ {course.credits} 學分
        </p>
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          {accepted
            ? '有同學退選釋出名額，您是候補第 1 位，系統已自動把這門課加進您的課表。'
            : `輪到您遞補時${reason}，系統依規則跳過您，名額由下一位候補同學遞補，並把您移出候補名單。`}
        </p>
        <p className="mt-2 text-[11px] text-text-muted">模擬流程：正式系統會在退選釋出名額時自動觸發，並以通知告知結果</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-container"
        >
          知道了
        </button>
      </div>
    </div>
  );
};
