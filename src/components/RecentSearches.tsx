import React, { useCallback, useEffect, useState } from 'react';
import { History, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { DAY_LABELS } from '../lib/schedule';

/** 一次搜尋的完整條件（關鍵字＋所有篩選） */
export interface SearchSnapshot {
  keyword: string;
  department: string;
  category: string;
  days: number[];
  timeOfDay: string;
  credits: string;
  onlyAvailable: boolean;
  onlyNoConflict: boolean;
  onlyPrereqMet: boolean;
  onlyEMI: boolean;
  onlyFavorites: boolean;
}

export interface RecentSearch extends SearchSnapshot {
  id: string;
  /** 最後一次使用的時間（ISO） */
  at: string;
}

export const MAX_RECENT = 5;

const signature = (s: SearchSnapshot) =>
  JSON.stringify([
    s.keyword.trim().toLowerCase(),
    s.department,
    s.category,
    [...s.days].sort(),
    s.timeOfDay,
    s.credits,
    s.onlyAvailable,
    s.onlyNoConflict,
    s.onlyPrereqMet,
    s.onlyEMI,
    s.onlyFavorites,
  ]);

const load = (key: string): RecentSearch[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

/** 最近搜尋紀錄：存在本機 localStorage，每位使用者各自一份，最多 5 筆 */
export const useRecentSearches = (storageKey: string) => {
  const [items, setItems] = useState<RecentSearch[]>(() => load(storageKey));

  useEffect(() => setItems(load(storageKey)), [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* 無法寫入時只保留在這次瀏覽 */
    }
  }, [items, storageKey]);

  const record = useCallback((snap: SearchSnapshot) => {
    const sig = signature(snap);
    setItems(prev => {
      const rest = prev.filter(p => signature(p) !== sig);
      const entry: RecentSearch = {
        ...snap,
        keyword: snap.keyword.trim(),
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        at: new Date().toISOString(),
      };
      return [entry, ...rest].slice(0, MAX_RECENT);
    });
  }, []);

  const remove = useCallback((id: string) => setItems(prev => prev.filter(p => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  return { items, record, remove, clear };
};

const relativeTime = (iso: string, now: number) => {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '昨天' : `${days} 天前`;
};

type ChipTone = 'dept' | 'keyword' | 'plain';

/** 把條件轉成畫面上的標籤 */
export const snapshotChips = (s: SearchSnapshot): { label: string; tone: ChipTone }[] => {
  const chips: { label: string; tone: ChipTone }[] = [];
  if (s.keyword.trim()) chips.push({ label: `「${s.keyword.trim()}」`, tone: 'keyword' });
  if (s.department !== '全部') chips.push({ label: s.department, tone: 'dept' });
  if (s.category !== '全部') chips.push({ label: s.category, tone: 'plain' });
  if (s.days.length) chips.push({ label: [...s.days].sort().map(d => `週${DAY_LABELS[d - 1]}`).join('・'), tone: 'plain' });
  if (s.timeOfDay !== '全部') chips.push({ label: s.timeOfDay, tone: 'plain' });
  if (s.credits !== '全部') chips.push({ label: `${s.credits} 學分`, tone: 'plain' });
  if (s.onlyAvailable) chips.push({ label: '只看有餘額', tone: 'plain' });
  if (s.onlyNoConflict) chips.push({ label: '不衝堂', tone: 'plain' });
  if (s.onlyPrereqMet) chips.push({ label: '符合先修', tone: 'plain' });
  if (s.onlyEMI) chips.push({ label: 'EMI', tone: 'plain' });
  if (s.onlyFavorites) chips.push({ label: '只看收藏', tone: 'plain' });
  if (!chips.length) chips.push({ label: '全部課程', tone: 'plain' });
  return chips;
};

const TONE: Record<ChipTone, string> = {
  dept: 'bg-primary text-white',
  keyword: 'bg-secondary-fixed/60 text-on-secondary-fixed',
  plain: 'bg-surface-container text-text-secondary',
};

interface RecentSearchPanelProps {
  items: RecentSearch[];
  onRestore: (s: RecentSearch) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const RecentSearchPanel: React.FC<RecentSearchPanelProps> = ({ items, onRestore, onRemove, onClear, onClose }) => {
  const now = Date.now();
  return (
    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl border border-border-subtle bg-surface-card shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border-b border-border-subtle">
        <History size={16} className="text-primary" />
        <span className="text-sm font-semibold text-on-surface">最近搜尋紀錄</span>
        <span className="text-[11px] text-text-muted">最多保留 {MAX_RECENT} 筆</span>
        <button type="button" onClick={onClose} aria-label="關閉最近搜尋" className="ml-auto text-text-muted hover:text-on-surface">
          <X size={16} />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-text-muted">
          還沒有搜尋紀錄。輸入關鍵字或調整篩選條件後，系統會自動記下來，下次一鍵還原。
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {items.map(item => (
            <li key={item.id} className="group flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container-low">
              <Search size={15} className="text-text-muted shrink-0" />
              <button
                type="button"
                onClick={() => onRestore(item)}
                className="flex-1 min-w-0 flex flex-wrap gap-1 text-left"
                title="還原這組搜尋條件"
              >
                {snapshotChips(item).map((c, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold max-w-full truncate ${TONE[c.tone]}`}>
                    {c.label}
                  </span>
                ))}
              </button>
              <span className="text-[11px] text-text-muted whitespace-nowrap shrink-0">{relativeTime(item.at, now)}</span>
              <button
                type="button"
                onClick={() => onRestore(item)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-primary-fixed/60 text-on-primary-fixed text-xs font-semibold flex items-center gap-1 hover:bg-primary-fixed"
              >
                <RotateCcw size={13} /> 還原
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label="刪除這筆紀錄"
                className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-text-muted opacity-60 hover:opacity-100 hover:text-conflict-danger"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-border-subtle bg-surface-container-low text-[11px] text-text-muted">
        <span>搜尋條件儲存於本機瀏覽器，離線也能用</span>
        {items.length > 0 && (
          <button type="button" onClick={onClear} className="flex items-center gap-1 text-conflict-danger font-medium hover:underline">
            <Trash2 size={12} /> 清除全部紀錄
          </button>
        )}
      </div>
    </div>
  );
};
