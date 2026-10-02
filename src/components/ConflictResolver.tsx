import React, { useState } from 'react';
import { Course } from '../types';

interface ConflictResolverProps {
  onResolveConflict: (solutionId: number) => void;
  onBack: () => void;
  onViewCourseDetail?: (course: Course) => void;
  showToast: (msg: string) => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  onResolveConflict,
  onBack,
  showToast,
}) => {
  const [selectedSolution, setSelectedSolution] = useState<number>(1);
  const [isApplied, setIsApplied] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleApply = () => {
    setIsApplied(true);
    if (selectedSolution === 1) {
      setFeedbackMessage('已成功切換至《社區高齡照護科技》B班（週二 15:30-17:20）！週四時段衝堂已徹底消除。');
      onResolveConflict(1);
    } else {
      setFeedbackMessage('已成功換選《長期照護評估與個案管理》（週五 10:10-12:00）！學分維持達標無衝堂。');
      onResolveConflict(2);
    }
    showToast('衝堂調整已儲存！課表已自動更新');
  };

  const handleSkip = () => {
    setFeedbackMessage('已暫時略過調整。請注意開學第 2 階段若未抽中可能需重新排課。');
    showToast('已維持目前自選時段');
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pb-16">
      {/* Top Critical Conflict Alert Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-error-container text-on-error-container shadow-sm flex items-start gap-3.5 relative overflow-hidden border border-error/20 mb-5">
        <div className="w-11 h-11 rounded-full bg-error text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
          <span className="material-symbols-outlined text-[24px]">warning</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-base sm:text-lg text-on-error-container leading-tight">
              偵測到 1 處時段衝堂衝突！
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-error text-white font-bold text-xs shrink-0">
              高警示
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-error-container/90 mt-1">
            衝突時段：<strong className="font-bold underline decoration-error text-error">週四 13:30 - 15:20 (第 5-6 節)</strong>
          </p>
          <p className="text-xs text-on-error-container/80 mt-0.5">
            系統已自動為您演算 2 組無痛調課最佳解，避免選課落榜。
          </p>
        </div>
      </div>

      {/* Micro Timetable Conflict Visualizer Strip */}
      <div className="bg-surface-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border-subtle mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
            <span>週四課表時段偵測條</span>
          </div>
          <span className="text-xs text-text-muted">點選紅框可聚焦比對</span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-7 gap-2 text-center text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-text-muted mb-1 font-semibold">1-2 節</span>
            <div className="w-full h-9 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-text-muted mb-1 font-semibold">3 節</span>
            <div className="w-full h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-text-muted font-bold">
              空
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-text-muted mb-1 font-semibold">4 節</span>
            <div className="w-full h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-text-muted font-bold">
              空
            </div>
          </div>

          {/* Conflict 5-6 */}
          <div className="flex flex-col items-center col-span-2">
            <span className="text-[11px] text-error font-bold mb-1">5-6 節 (衝堂)</span>
            <div className="w-full h-9 rounded-xl bg-error text-white flex items-center justify-center gap-1.5 shadow-sm ring-2 ring-error/30 animate-bounce font-bold">
              <span className="material-symbols-outlined text-[16px]">priority_high</span>
              <span>2 門重疊</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-text-muted mb-1 font-semibold">7 節</span>
            <div className="w-full h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-text-muted font-bold">
              空
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-text-muted mb-1 font-semibold">8 節</span>
            <div className="w-full h-9 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Courses Detailed Comparison */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-base text-primary">衝突課程詳細對比</span>
          <span className="text-xs text-text-muted">請擇一替換或更換時段</span>
        </div>

        {/* Course A Card */}
        <div className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border-subtle relative overflow-hidden flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                  護理專業選修 2.0學分
                </span>
                <span className="px-2 py-0.5 rounded-full bg-error/15 text-error text-[11px] font-bold">
                  時段衝突 A
                </span>
              </div>
              <h3 className="font-bold text-base text-primary truncate">重症護理臨床情境模擬</h3>
            </div>

            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-xs bg-surface-container flex items-center justify-center relative">
              <img
                alt="重症高階生理模擬假人"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-16jma2UqCC4B9OBiLZBERFOzpe-Dze_Chita5wV0lk3xMKejrI5SEKxn4wANh604MUkt9V5TTqEBgLM2BP7qEX_uhQsbirjxqJPW-bchLJ7-tNQMLyvBugVTtw83Y_OTwRlLT45Ru8pDqpLJytQHvJqwJaWI3TXBIgaMpTQV7gQYo1bY1lv5-PC0-jW65UHk2NENDTUVkcfqdM8mATn066MAHU-yUG3JTlqui0I7jtxL8Se5_uPf"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="material-symbols-outlined text-clinical-purple text-[24px] absolute pointer-events-none">
                personal_injury
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-on-surface bg-surface-container-low p-3 rounded-xl mt-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-text-muted text-[16px]">person</span>
              <span className="text-text-secondary truncate">陳建宏 助理教授</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-text-muted text-[16px]">meeting_room</span>
              <span className="text-text-secondary truncate">技能中心 OSC6</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-error text-[16px]">schedule</span>
              <span className="text-error font-bold truncate">週四 13:30 - 15:20</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-error text-[16px]">group_off</span>
              <span className="text-error font-bold truncate">已額滿 (需抽籤)</span>
            </div>
          </div>
        </div>

        {/* Conflict Splice Center Badge */}
        <div className="flex items-center justify-center -my-2.5 z-10">
          <div className="px-3.5 py-1 rounded-full bg-error text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
            <span className="material-symbols-outlined text-[15px]">sync_problem</span>
            <span>時段衝突重疊 110 分鐘</span>
          </div>
        </div>

        {/* Course B Card */}
        <div className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border-subtle relative overflow-hidden flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                  系選修 2.0學分
                </span>
                <span className="px-2 py-0.5 rounded-full bg-error/15 text-error text-[11px] font-bold">
                  時段衝突 B
                </span>
              </div>
              <h3 className="font-bold text-base text-primary truncate">社區高齡照護科技</h3>
            </div>

            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-xs bg-surface-container flex items-center justify-center relative">
              <img
                alt="遠距長照智慧平板系統"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4YURwRbNPtQDxebVUFR0UfPzi0vmRdFYh8Ock2QDuMJO6fX6Fj69QSAD0ydo1MCkrBZzflWZz4W1jwpoXQLavttA3HwtRblu3evLGVxrZvzDWNCmBPXXKavzNGSge3HWkJ8W8jZCKVdF--F9zz1ti2-h7iUmYlTBfWjccRcw1VdTqfgWyueP6ySsE1xf7gXG2SFiv5eiG0bqJmrWVqxrnyfstKz3KzUwgzhdX9kiYNfQvlXsXoaop"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="material-symbols-outlined text-secondary text-[24px] absolute pointer-events-none">
                devices
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-on-surface bg-surface-container-low p-3 rounded-xl mt-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-text-muted text-[16px]">person</span>
              <span className="text-text-secondary truncate">黃素貞 副教授</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-text-muted text-[16px]">meeting_room</span>
              <span className="text-text-secondary truncate">學思樓 F305</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-error text-[16px]">schedule</span>
              <span className="text-error font-bold truncate">週四 13:30 - 15:20</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-secondary text-[16px]">how_to_reg</span>
              <span className="text-secondary font-bold truncate">尚餘 8 席名額</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Schedule Resolution Recommendations */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-2 px-1">
          <span
            className="material-symbols-outlined text-clinical-purple text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <h2 className="font-bold text-base text-primary">北護智慧換課建議 (AI 最佳解)</h2>
        </div>

        {/* Solution 1: Recommended Section B */}
        <div
          onClick={() => setSelectedSolution(1)}
          className={`p-4 sm:p-5 rounded-2xl shadow-sm border transition-all cursor-pointer ${
            selectedSolution === 1
              ? 'bg-primary-fixed/20 border-primary ring-2 ring-primary/20'
              : 'bg-surface-card border-border-subtle'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary text-white font-bold text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                推薦首選方案
              </span>
              <span className="text-xs text-secondary font-bold">100% 保證不撞期</span>
            </div>
            <input
              type="radio"
              name="conflict_sol"
              checked={selectedSolution === 1}
              onChange={() => setSelectedSolution(1)}
              className="w-4 h-4 accent-primary"
            />
          </div>

          <div className="mt-3 p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 text-xs">
            <p className="font-bold text-sm text-on-surface">
              保留《重症護理》，將《社區高齡照護科技》改修 B 班
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-secondary mt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-text-muted">event</span>
                改為：週二 15:30 - 17:20 (第 7-8 節)
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-text-muted">school</span>
                授課：林美慧 講師
              </span>
              <span className="flex items-center gap-1 text-secondary font-semibold">
                <span className="material-symbols-outlined text-[15px]">chair</span>
                課位：尚餘 19 席 (充足)
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-1 text-xs">
            <span className="text-text-muted">免重排學程，總學分維持不變</span>
            <button
              onClick={e => {
                e.stopPropagation();
                setSelectedSolution(1);
                handleApply();
              }}
              className="px-4 py-1.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span>一鍵切換此方案</span>
            </button>
          </div>
        </div>

        {/* Solution 2: Alternative Course in Same Module */}
        <div
          onClick={() => setSelectedSolution(2)}
          className={`p-4 sm:p-5 rounded-2xl shadow-sm border transition-all cursor-pointer ${
            selectedSolution === 2
              ? 'bg-primary-fixed/20 border-primary ring-2 ring-primary/20'
              : 'bg-surface-card border-border-subtle'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold text-xs">
                方案 2
              </span>
              <span className="text-xs text-text-muted font-semibold">同為「長照選修學群」替代</span>
            </div>
            <input
              type="radio"
              name="conflict_sol"
              checked={selectedSolution === 2}
              onChange={() => setSelectedSolution(2)}
              className="w-4 h-4 accent-primary"
            />
          </div>

          <div className="mt-3 p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 text-xs">
            <p className="font-bold text-sm text-on-surface">改選《長期照護評估與個案管理》</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-secondary mt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-text-muted">event</span>
                時段：週五 10:10 - 12:00 (第 3-4 節)
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-text-muted">school</span>
                授課：郭家良 教授
              </span>
              <span className="flex items-center gap-1 text-secondary font-semibold">
                <span className="material-symbols-outlined text-[15px]">event_seat</span>
                課位：尚餘 15 席
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-1 text-xs">
            <span className="text-text-muted">可抵免相同核心學分領域</span>
            <button
              onClick={e => {
                e.stopPropagation();
                setSelectedSolution(2);
                handleApply();
              }}
              className="px-4 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>選取此替代課</span>
            </button>
          </div>
        </div>
      </div>

      {/* Applied Feedback Notice */}
      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/30 text-on-surface flex items-center justify-between gap-3 mb-6 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">check_circle</span>
            <span className="text-xs sm:text-sm font-bold text-secondary">{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs text-text-muted hover:text-on-surface font-semibold"
          >
            關閉
          </button>
        </div>
      )}

      {/* Bottom Action Buttons Floating Bar */}
      <div className="sticky bottom-20 xl:bottom-6 z-40 bg-surface-card/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border border-border-subtle flex items-center gap-3">
        <button
          onClick={handleSkip}
          className="w-1/3 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-bold text-xs sm:text-sm active:scale-95 transition-all text-center"
        >
          暫時略過 (維持自選)
        </button>
        <button
          onClick={handleApply}
          className={`flex-1 py-3 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all ${
            isApplied ? 'bg-secondary' : 'bg-primary hover:bg-primary-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isApplied ? 'done_all' : 'verified'}
          </span>
          <span>{isApplied ? '調課已套用並儲存！' : '套用建議調整並儲存'}</span>
        </button>
      </div>
    </div>
  );
};
