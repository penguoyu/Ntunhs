import React from 'react';
import { Check, X } from 'lucide-react';
import { AllocationOutcome, AllocationResult, formatCourseTime } from '../lib/schedule';

interface AllocationResultModalProps {
  results: AllocationResult[];
  onClose: () => void;
}

const OUTCOME_TEXT: Record<AllocationOutcome, string> = {
  accepted: '分發成功',
  lost: '名額不足，未抽中',
  full: '已額滿',
  conflict: '與已選上的課衝堂',
  prereq: '未符合先修條件',
  credits: '超過學分上限',
};

export const AllocationResultModal: React.FC<AllocationResultModalProps> = ({ results, onClose }) => {
  const acceptedCount = results.filter(r => r.outcome === 'accepted').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-labelledby="allocation-title"
        className="bg-surface-card w-full max-w-md rounded-2xl shadow-2xl border border-border-subtle"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border-subtle flex items-start justify-between gap-3">
          <div>
            <h2 id="allocation-title" className="font-bold text-base">
              分發結果（模擬）
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              登記 {results.length} 門，分發成功 {acceptedCount} 門。未分發的課仍留在預選清單，可於加退選再登記。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-container-low"
          >
            <X size={18} />
          </button>
        </div>

        <ol className="divide-y divide-border-subtle max-h-[60vh] overflow-y-auto">
          {results.map(r => {
            const ok = r.outcome === 'accepted';
            return (
              <li key={r.course.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-xs font-bold text-text-muted shrink-0">{r.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.course.name}</p>
                  <p className="text-[11px] text-text-muted">
                    {formatCourseTime(r.course)}
                    {r.chance > 0 && r.chance < 1 && ` ・ 預估機率 ${Math.round(r.chance * 100)}%`}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold flex items-center gap-1 shrink-0 ${
                    ok ? 'text-secondary' : 'text-conflict-danger'
                  }`}
                >
                  {ok ? <Check size={14} /> : <X size={14} />}
                  {OUTCOME_TEXT[r.outcome]}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="p-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-container"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
