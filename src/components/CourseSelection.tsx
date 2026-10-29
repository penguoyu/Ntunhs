import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Plus,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Star,
  Trash2,
  TriangleAlert,
  X,
  Check,
} from 'lucide-react';
import { Course, StudentProfile } from '../types';
import {
  CREDIT_LIMIT,
  Competition,
  DAY_LABELS,
  PERIOD_TIMES,
  admissionChance,
  checkPrerequisite,
  competitionLevel,
  conflictingIds,
  findConflicts,
  formatCourseTime,
  registeredCount,
  seatsLeft,
} from '../lib/schedule';
import { CURRENT_STAGE, SELECTION_STAGES } from '../data/semester';

const COMPETITION_STYLE: Record<Competition, { label: string; className: string }> = {
  open: { label: '登記未滿', className: 'text-secondary' },
  tight: { label: '競爭', className: 'text-amber-700' },
  hot: { label: '熱門', className: 'text-conflict-danger' },
  full: { label: '額滿', className: 'text-conflict-danger' },
};

interface CourseSelectionProps {
  courses: Course[];
  student: StudentProfile;
  semester: string;
  /** 已選上（含原班必修）的課程 */
  scheduleIds: string[];
  /** 預選清單，陣列順序即志願序 */
  cart: string[];
  favorites: string[];
  compact?: boolean;
  onToggleCart: (courseId: string) => void;
  onReorderCart: (ids: string[]) => void;
  onToggleFavorite: (courseId: string) => void;
  onDropCourse: (courseId: string) => void;
  onSubmitCart: () => void;
  onViewCourseDetail: (course: Course) => void;
}

type CategoryFilter = '全部' | '必修' | '選修' | '通識';
type TimeFilter = '全部' | '上午' | '下午' | '晚上';
type SortKey = 'default' | 'seats' | 'rating';

const TIME_RANGES: Record<Exclude<TimeFilter, '全部'>, number[]> = {
  上午: [1, 2, 3, 4],
  下午: [5, 6, 7, 8],
  晚上: [9, 10],
};

const matchCategory = (c: Course, f: CategoryFilter) => {
  if (f === '全部') return true;
  if (f === '通識') return c.category === '博雅通識' || c.college === '通識中心';
  if (f === '必修') return c.category.includes('必修');
  return c.category.includes('選修');
};

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
      active
        ? 'bg-primary text-white border-primary'
        : 'bg-surface-card text-text-secondary border-border-subtle hover:border-border-strong'
    }`}
  >
    {children}
  </button>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="w-4 h-4 rounded accent-primary"
    />
    {label}
  </label>
);

/* ------------------------------------------------------------------ */
/* 週課表                                                              */
/* ------------------------------------------------------------------ */

interface TimetableProps {
  scheduleCourses: Course[];
  cartCourses: Course[];
  preview: Course | null;
  maxPeriod: number;
  onSelect: (c: Course) => void;
}

const ROW_H = 44;
const NAME_LINE_H = 13;

/** 課表格子用的簡稱：去掉括號內的補充說明 */
const shortName = (name: string) => name.replace(/[（(][^）)]*[）)]/g, '').trim() || name;

type BlockKind = 'schedule' | 'cart' | 'preview';
type BlockEntry = { course: Course; kind: BlockKind };
/** 同一天時段相連的一組課；超過一門代表衝堂，合併成一格顯示 */
type BlockGroup = { start: number; end: number; entries: BlockEntry[] };

const Timetable: React.FC<TimetableProps> = ({ scheduleCourses, cartCourses, preview, maxPeriod, onSelect }) => {
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);
  const cartRank = new Map(cartCourses.map((c, i) => [c.id, i + 1]));

  const blocks = useMemo(() => {
    const all: BlockEntry[] = [
      ...scheduleCourses.map(c => ({ course: c, kind: 'schedule' as const })),
      ...cartCourses
        .filter(c => !scheduleCourses.some(s => s.id === c.id))
        .map(c => ({ course: c, kind: 'cart' as const })),
    ];
    if (preview && !all.some(b => b.course.id === preview.id)) {
      all.push({ course: preview, kind: 'preview' });
    }

    // 依星期分欄；時段重疊的課併成同一組，不再擠成好幾條細欄
    const byDay: Record<number, BlockGroup[]> = {};
    for (let d = 1; d <= 5; d++) {
      const items = all
        .filter(b => b.course.day === d && b.course.periods?.length)
        .sort((a, b) => Math.min(...a.course.periods) - Math.min(...b.course.periods));
      const groups: BlockGroup[] = [];
      for (const b of items) {
        const start = Math.min(...b.course.periods);
        const end = Math.max(...b.course.periods);
        const last = groups[groups.length - 1];
        if (last && start <= last.end) {
          last.entries.push(b);
          last.end = Math.max(last.end, end);
        } else {
          groups.push({ start, end, entries: [b] });
        }
      }
      byDay[d] = groups;
    }
    return byDay;
  }, [scheduleCourses, cartCourses, preview]);

  const label = ({ course, kind }: BlockEntry) =>
    `${kind === 'cart' ? `#${cartRank.get(course.id)} ` : ''}${shortName(course.name)}`;

  return (
    <div className="rounded-xl border border-border-subtle overflow-hidden bg-surface-card">
      <div className="grid grid-cols-[34px_repeat(5,minmax(0,1fr))] bg-surface-container-low text-[11px] font-bold text-text-secondary">
        <div />
        {DAY_LABELS.map(d => (
          <div key={d} className="py-1.5 text-center border-l border-border-subtle">
            週{d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[34px_repeat(5,minmax(0,1fr))]">
        <div>
          {periods.map(p => (
            <div
              key={p}
              style={{ height: ROW_H }}
              className="border-t border-border-subtle text-[10px] text-text-muted flex flex-col items-center justify-center leading-tight"
            >
              <span className="font-bold text-text-secondary">{p}</span>
              <span>{PERIOD_TIMES[p]?.start}</span>
            </div>
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(day => (
          <div key={day} className="relative border-l border-border-subtle" style={{ height: ROW_H * maxPeriod }}>
            {periods.map(p => (
              <div
                key={p}
                className="absolute left-0 right-0 border-t border-border-subtle"
                style={{ top: (p - 1) * ROW_H }}
              />
            ))}
            {(blocks[day] ?? []).map(({ start, end, entries }) => {
              const height = (end - start + 1) * ROW_H - 4;
              const pos = { top: (start - 1) * ROW_H + 2, height, left: 2, right: 2 };

              if (entries.length > 1) {
                const onlyPreview = entries.filter(e => e.kind !== 'preview').length < 2;
                return (
                  <div
                    key={entries.map(e => e.course.id).join('+')}
                    title={entries.map(e => `${e.course.name}｜${formatCourseTime(e.course)}`).join('\n')}
                    className={`absolute rounded-md border px-1.5 py-1 overflow-hidden flex flex-col gap-0.5 bg-red-50 border-conflict-danger text-red-800 ${
                      onlyPreview ? 'border-dashed' : ''
                    }`}
                    style={pos}
                  >
                    <span className="flex items-center gap-0.5 text-[10px] font-bold leading-3 shrink-0">
                      <TriangleAlert size={10} className="shrink-0" />
                      {entries.length} 門衝堂
                    </span>
                    {entries.map(e => (
                      <button
                        key={e.course.id}
                        type="button"
                        onClick={() => onSelect(e.course)}
                        disabled={e.kind === 'preview'}
                        className={`text-left text-[11px] font-semibold truncate hover:underline shrink-0 ${
                          e.kind === 'preview' ? 'opacity-60 italic' : ''
                        }`}
                        style={{ lineHeight: `${NAME_LINE_H}px` }}
                      >
                        {label(e)}
                      </button>
                    ))}
                  </div>
                );
              }

              const { course, kind } = entries[0];
              const showRoom = end > start;
              // 依格子高度決定課名最多顯示幾行，超出以 … 收尾
              const nameLines = Math.max(1, Math.floor((height - 6 - (showRoom ? 12 : 0)) / NAME_LINE_H));
              const tone =
                kind === 'schedule'
                  ? 'bg-primary-fixed border-primary-container text-on-primary-fixed'
                  : kind === 'cart'
                    ? 'bg-secondary-fixed/40 border-secondary border-dashed text-on-secondary-fixed'
                    : 'bg-surface-container border-border-strong border-dashed text-text-secondary';
              return (
                <button
                  key={`${kind}-${course.id}`}
                  type="button"
                  onClick={() => onSelect(course)}
                  title={`${course.name}｜${formatCourseTime(course)}｜${course.location}`}
                  className={`absolute rounded-md border px-1.5 py-1 text-left overflow-hidden flex flex-col transition-shadow hover:shadow-md ${tone} ${
                    kind === 'preview' ? 'opacity-80 pointer-events-none' : ''
                  }`}
                  style={pos}
                >
                  <span
                    className="text-[11px] font-semibold break-all"
                    style={{
                      lineHeight: `${NAME_LINE_H}px`,
                      display: '-webkit-box',
                      WebkitLineClamp: nameLines,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {kind === 'cart' && <span className="font-bold mr-0.5">#{cartRank.get(course.id)}</span>}
                    {shortName(course.name)}
                  </span>
                  {showRoom && (
                    <span className="mt-auto text-[10px] leading-3 opacity-75 truncate">{course.room}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 border-t border-border-subtle text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-primary-fixed border border-primary-container" />
          已選上
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-secondary-fixed/40 border border-dashed border-secondary" />
          預選（#志願序）
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-50 border border-conflict-danger" />
          衝堂
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 主頁面                                                              */
/* ------------------------------------------------------------------ */

export const CourseSelection: React.FC<CourseSelectionProps> = ({
  courses,
  student,
  semester,
  scheduleIds,
  cart,
  favorites,
  compact = false,
  onToggleCart,
  onReorderCart,
  onToggleFavorite,
  onDropCourse,
  onSubmitCart,
  onViewCourseDetail,
}) => {
  // 篩選條件
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState('全部');
  const [category, setCategory] = useState<CategoryFilter>('全部');
  const [days, setDays] = useState<number[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeFilter>('全部');
  const [credits, setCredits] = useState('全部');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyNoConflict, setOnlyNoConflict] = useState(false);
  const [onlyPrereqMet, setOnlyPrereqMet] = useState(false);
  const [onlyEMI, setOnlyEMI] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('default');

  // 介面狀態
  const [preview, setPreview] = useState<Course | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [stageMore, setStageMore] = useState(false);
  const stagesRef = useRef<HTMLOListElement>(null);

  const updateStageFade = () => {
    const el = stagesRef.current;
    if (el) setStageMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  // 階段列放不下時，先把目前階段捲到可見範圍
  useEffect(() => {
    const el = stagesRef.current;
    const current = el?.querySelector<HTMLElement>('[aria-current="step"]');
    if (el && current) el.scrollLeft = Math.max(0, current.offsetLeft - 8);
    updateStageFade();
    window.addEventListener('resize', updateStageFade);
    return () => window.removeEventListener('resize', updateStageFade);
  }, []);

  const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses]);
  const scheduleCourses = useMemo(
    () => scheduleIds.map(id => courseMap.get(id)).filter((c): c is Course => !!c),
    [scheduleIds, courseMap]
  );
  const cartCourses = useMemo(
    () => cart.map(id => courseMap.get(id)).filter((c): c is Course => !!c),
    [cart, courseMap]
  );
  const plannedCourses = useMemo(
    () => [...scheduleCourses, ...cartCourses.filter(c => !scheduleIds.includes(c.id))],
    [scheduleCourses, cartCourses, scheduleIds]
  );

  const departments = useMemo(
    () => Array.from(new Set(courses.map(c => c.department))).sort((a, b) => a.localeCompare(b, 'zh-Hant')),
    [courses]
  );
  const creditOptions = useMemo(
    () => Array.from(new Set(courses.map(c => c.credits))).sort((a, b) => a - b),
    [courses]
  );
  const maxPeriod = useMemo(
    () => Math.max(8, ...courses.flatMap(c => c.periods ?? [])),
    [courses]
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const list = courses.filter(c => {
      if (kw) {
        const haystack = [c.name, c.englishName, c.code, c.id, c.teacher, ...(c.tags ?? [])].join(' ').toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      if (department !== '全部' && c.department !== department) return false;
      if (!matchCategory(c, category)) return false;
      if (days.length && !days.includes(c.day)) return false;
      if (timeOfDay !== '全部' && !c.periods?.some(p => TIME_RANGES[timeOfDay].includes(p))) return false;
      if (credits !== '全部' && c.credits !== Number(credits)) return false;
      if (onlyAvailable && seatsLeft(c) === 0) return false;
      if (onlyEMI && !c.isEMI) return false;
      if (onlyFavorites && !favorites.includes(c.id)) return false;
      if (onlyPrereqMet && !checkPrerequisite(c, student).met) return false;
      if (onlyNoConflict && findConflicts(c, plannedCourses).length > 0) return false;
      return true;
    });
    if (sortKey === 'seats') list.sort((a, b) => seatsLeft(b) - seatsLeft(a));
    if (sortKey === 'rating') list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [
    courses, keyword, department, category, days, timeOfDay, credits, onlyAvailable, onlyEMI,
    onlyFavorites, onlyPrereqMet, onlyNoConflict, sortKey, favorites, student, plannedCourses,
  ]);

  const activeFilterCount =
    (department !== '全部' ? 1 : 0) +
    (category !== '全部' ? 1 : 0) +
    (days.length ? 1 : 0) +
    (timeOfDay !== '全部' ? 1 : 0) +
    (credits !== '全部' ? 1 : 0) +
    [onlyAvailable, onlyNoConflict, onlyPrereqMet, onlyEMI, onlyFavorites].filter(Boolean).length;

  const resetFilters = () => {
    setKeyword('');
    setDepartment('全部');
    setCategory('全部');
    setDays([]);
    setTimeOfDay('全部');
    setCredits('全部');
    setOnlyAvailable(false);
    setOnlyNoConflict(false);
    setOnlyPrereqMet(false);
    setOnlyEMI(false);
    setOnlyFavorites(false);
  };

  const scheduleCredits = scheduleCourses.reduce((s, c) => s + c.credits, 0);
  const cartOnly = cartCourses.filter(c => !scheduleIds.includes(c.id));
  const cartCredits = cartOnly.reduce((s, c) => s + c.credits, 0);
  const totalCredits = scheduleCredits + cartCredits;
  const plannedClash = conflictingIds(plannedCourses);

  const moveCart = (id: string, delta: number) => {
    const idx = cart.indexOf(id);
    const to = idx + delta;
    if (idx < 0 || to < 0 || to >= cart.length) return;
    const next = [...cart];
    [next[idx], next[to]] = [next[to], next[idx]];
    onReorderCart(next);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = cart.filter(id => id !== dragId);
    next.splice(next.indexOf(targetId), 0, dragId);
    onReorderCart(next);
    setDragId(null);
  };

  /* ---------------- 篩選面板 ---------------- */
  const filterPanel = (
    <div className="space-y-5">
      <div>
        <label htmlFor="dept" className="block text-xs font-bold text-text-secondary mb-1.5">
          開課系所
        </label>
        <select
          id="dept"
          value={department}
          onChange={e => setDepartment(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface-card text-sm"
        >
          <option value="全部">全部系所</option>
          {departments.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs font-bold text-text-secondary mb-1.5">修別</p>
        <div className="flex flex-wrap gap-1.5">
          {(['全部', '必修', '選修', '通識'] as CategoryFilter[]).map(c => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-text-secondary mb-1.5">星期（可複選）</p>
        <div className="flex flex-wrap gap-1.5">
          {DAY_LABELS.map((d, i) => (
            <Chip
              key={d}
              active={days.includes(i + 1)}
              onClick={() =>
                setDays(prev => (prev.includes(i + 1) ? prev.filter(x => x !== i + 1) : [...prev, i + 1]))
              }
            >
              {d}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-text-secondary mb-1.5">時段</p>
        <div className="flex flex-wrap gap-1.5">
          {(['全部', '上午', '下午', '晚上'] as TimeFilter[]).map(t => (
            <Chip key={t} active={timeOfDay === t} onClick={() => setTimeOfDay(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="credits" className="block text-xs font-bold text-text-secondary mb-1.5">
          學分
        </label>
        <select
          id="credits"
          value={credits}
          onChange={e => setCredits(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface-card text-sm"
        >
          <option value="全部">全部</option>
          {creditOptions.map(c => (
            <option key={c} value={String(c)}>
              {c} 學分
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2.5 pt-1">
        <Toggle checked={onlyAvailable} onChange={setOnlyAvailable} label="只看有餘額" />
        <Toggle checked={onlyNoConflict} onChange={setOnlyNoConflict} label="只看不衝堂" />
        <Toggle checked={onlyPrereqMet} onChange={setOnlyPrereqMet} label="只看符合先修" />
        <Toggle checked={onlyEMI} onChange={setOnlyEMI} label="全英語授課 (EMI)" />
        <Toggle checked={onlyFavorites} onChange={setOnlyFavorites} label="只看收藏" />
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border-subtle text-sm text-text-secondary hover:bg-surface-container-low"
      >
        <RotateCcw size={14} /> 清除所有條件
      </button>
    </div>
  );

  /* ---------------- 課程列表 ---------------- */
  const courseRow = (c: Course) => {
    const inCart = cart.includes(c.id);
    const inSchedule = scheduleIds.includes(c.id);
    const clashes = inSchedule ? [] : findConflicts(c, plannedCourses);
    const prereq = checkPrerequisite(c, student);
    const left = seatsLeft(c);
    const competition = COMPETITION_STYLE[competitionLevel(c)];
    const isFav = favorites.includes(c.id);

    return (
      <li
        key={c.id}
        onMouseEnter={() => setPreview(c)}
        onMouseLeave={() => setPreview(p => (p?.id === c.id ? null : p))}
        className={`p-3 sm:p-4 rounded-xl border bg-surface-card transition-colors ${
          inCart || inSchedule ? 'border-secondary/50' : 'border-border-subtle hover:border-border-strong'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-mono text-text-muted">{c.code}</span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold ${
                  c.category.includes('必修')
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : c.category === '博雅通識'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-surface-container text-text-secondary'
                }`}
              >
                {c.category}
              </span>
              <span className="px-1.5 py-0.5 rounded border border-border-subtle text-text-secondary font-bold">
                {c.credits} 學分
              </span>
              {c.isEMI && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">EMI</span>}
            </div>
            <button
              type="button"
              onClick={() => onViewCourseDetail(c)}
              className="mt-1 text-left font-bold text-[15px] text-on-surface hover:text-primary hover:underline"
            >
              {c.name}
            </button>
            <p className="mt-0.5 text-xs text-text-secondary">
              {c.teacher} ・ {formatCourseTime(c)} ・ {c.room || c.location}
            </p>
            <p className="text-[11px] text-text-muted truncate">{c.department}</p>

            {(clashes.length > 0 || !prereq.met || inSchedule) && (
              <div className="mt-2 space-y-1 text-xs">
                {inSchedule && (
                  <p className="flex items-center gap-1 text-secondary font-medium">
                    <Check size={13} /> 已在課表中
                  </p>
                )}
                {clashes.length > 0 && (
                  <p className="flex items-start gap-1 text-conflict-danger font-medium">
                    <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                    與 {clashes.map(x => `《${x.name}》`).join('、')} 衝堂
                  </p>
                )}
                {!prereq.met && (
                  <p className="flex items-start gap-1 text-amber-700 font-medium">
                    <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                    未符合先修：{prereq.missing.map(g => g.join(' 或 ')).join('，以及 ')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div
              className="flex flex-col items-end gap-1"
              title={`已選 ${c.enrolled}／上限 ${c.capacity}${inSchedule ? '' : `，本階段登記 ${registeredCount(c)} 人`}`}
            >
              <span className={`text-xs font-bold ${inSchedule ? 'text-secondary' : competition.className}`}>
                {inSchedule ? '已選上' : competition.label}
              </span>
              <span className="w-16 h-1 rounded-full bg-surface-container overflow-hidden" aria-hidden>
                <span
                  className={`block h-full rounded-full ${left === 0 ? 'bg-conflict-danger' : 'bg-secondary'}`}
                  style={{ width: `${Math.min(100, (c.enrolled / c.capacity) * 100)}%` }}
                />
              </span>
              <span className="text-[11px] text-text-muted whitespace-nowrap">
                餘 {left}
                {!inSchedule && left > 0 && ` ・ 登記 ${registeredCount(c)}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleFavorite(c.id)}
                aria-label={isFav ? '取消收藏' : '收藏'}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                  isFav ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-border-subtle text-text-muted hover:text-amber-500'
                }`}
              >
                <Star size={15} fill={isFav ? 'currentColor' : 'none'} />
              </button>
              {!inSchedule && (
                <button
                  type="button"
                  onClick={() => onToggleCart(c.id)}
                  onFocus={() => setPreview(c)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 ${
                    inCart
                      ? 'bg-secondary/10 text-secondary border border-secondary/40'
                      : 'bg-primary text-white hover:bg-primary-container'
                  }`}
                >
                  {inCart ? (
                    <>
                      <Check size={14} /> 已預選
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> 預選
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </li>
    );
  };

  /* ---------------- 右側：課表 + 預選清單 ---------------- */
  const planner = (
    <div className="space-y-4">
      <Timetable
        scheduleCourses={scheduleCourses}
        cartCourses={cartOnly}
        preview={preview}
        maxPeriod={maxPeriod}
        onSelect={onViewCourseDetail}
      />

      <div className="rounded-xl border border-border-subtle bg-surface-card">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm">預選清單（志願序）</h3>
          <span className={`text-xs font-bold ${totalCredits > CREDIT_LIMIT ? 'text-conflict-danger' : 'text-text-secondary'}`}>
            {scheduleCredits} + {cartCredits} = {totalCredits} / {CREDIT_LIMIT} 學分
          </span>
        </div>

        {cartOnly.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-muted">
            還沒有預選課程。在左側列表按「預選」加入。
          </p>
        ) : (
          <ol className="divide-y divide-border-subtle">
            {cartOnly.map((c, i) => (
              <li
                key={c.id}
                draggable
                onDragStart={() => setDragId(c.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => dropOn(c.id)}
                onDragEnd={() => setDragId(null)}
                className={`flex items-center gap-2 px-3 py-2.5 ${dragId === c.id ? 'opacity-40' : ''}`}
              >
                <GripVertical size={16} className="text-text-muted cursor-grab shrink-0" aria-hidden />
                <span className="w-5 text-xs font-bold text-secondary shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onViewCourseDetail(c)}
                    className="block text-left text-sm font-semibold truncate max-w-full hover:underline"
                  >
                    {c.name}
                  </button>
                  <p className="text-[11px] text-text-muted">
                    {formatCourseTime(c)} ・ {c.credits} 學分
                    {seatsLeft(c) === 0 ? (
                      <span className="text-conflict-danger"> ・ 額滿</span>
                    ) : !checkPrerequisite(c, student).met ? (
                      <span className="text-amber-700"> ・ 未符先修</span>
                    ) : (
                      <span> ・ 預估 {Math.round(admissionChance(c, i + 1) * 100)}%</span>
                    )}
                    {plannedClash.has(c.id) && <span className="text-conflict-danger font-bold"> ・ 衝堂</span>}
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => moveCart(c.id, -1)}
                    disabled={i === 0}
                    aria-label="志願往前"
                    className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:bg-surface-container-low disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCart(c.id, 1)}
                    disabled={i === cartOnly.length - 1}
                    aria-label="志願往後"
                    className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:bg-surface-container-low disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleCart(c.id)}
                    aria-label="移出預選"
                    className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-conflict-danger hover:bg-red-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="p-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onSubmitCart}
            disabled={cartOnly.length === 0}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} /> 送出登記並分發（模擬）
          </button>
          <p className="mt-1.5 text-[11px] text-text-muted text-center">
            登記人數超過餘額時依志願序加權抽籤，登記先後不影響結果
          </p>
        </div>
      </div>

      <details className="rounded-xl border border-border-subtle bg-surface-card group">
        <summary className="px-4 py-3 cursor-pointer text-sm font-bold flex items-center justify-between list-none">
          已選上課程（{scheduleCourses.length} 門，{scheduleCredits} 學分）
          <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
        </summary>
        <ul className="divide-y divide-border-subtle border-t border-border-subtle">
          {scheduleCourses.map(c => (
            <li key={c.id} className="flex items-center gap-2 px-4 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{c.name}</p>
                <p className="text-[11px] text-text-muted">
                  {formatCourseTime(c)} ・ {c.credits} 學分
                  {plannedClash.has(c.id) && <span className="text-conflict-danger font-bold"> ・ 衝堂</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDropCourse(c.id)}
                className="text-xs text-text-muted hover:text-conflict-danger flex items-center gap-1"
              >
                <Trash2 size={13} /> 退選
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );

  const wide = !compact;

  return (
    <div className={`w-full ${compact ? 'pb-24' : 'pb-40 lg:pb-24'}`}>
      {/* 頁首 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface">選課</h1>
          <p className="text-xs text-text-muted mt-0.5">
            {semester}・{student.name}（{student.department}）
          </p>
        </div>
        <div className="relative min-w-0">
        <ol
          ref={stagesRef}
          onScroll={updateStageFade}
          className="flex items-center gap-1 text-[11px] overflow-x-auto no-scrollbar"
          aria-label="選課階段"
        >
          {SELECTION_STAGES.map((s, i) => {
            const state = i < CURRENT_STAGE ? 'done' : i === CURRENT_STAGE ? 'current' : 'next';
            return (
              <li key={s.name} className="flex items-center gap-1 shrink-0">
                {i > 0 && <span className="w-3 h-px bg-border-strong" aria-hidden />}
                <span
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={`px-2 py-1 rounded-md border whitespace-nowrap ${
                    state === 'current'
                      ? 'bg-primary text-white border-primary font-bold'
                      : state === 'done'
                        ? 'border-border-subtle text-text-muted line-through decoration-text-muted/40'
                        : 'border-border-subtle text-text-secondary'
                  }`}
                >
                  {s.name} <span className={state === 'current' ? 'opacity-80' : 'opacity-70'}>{s.period}</span>
                </span>
              </li>
            );
          })}
        </ol>
          {/* 還有沒顯示到的階段時，右側淡出並加上箭頭提示可以滑動 */}
          {stageMore && (
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-10 flex items-center justify-end bg-gradient-to-l from-surface to-transparent text-text-muted"
              aria-hidden
            >
              <ChevronRight size={14} />
            </div>
          )}
        </div>
      </div>

      <div className={wide ? 'xl:grid xl:grid-cols-[220px_minmax(0,1fr)_440px] lg:grid lg:grid-cols-[minmax(0,1fr)_400px] gap-5' : ''}>
        {/* 左：篩選（xl 以上常駐） */}
        {wide && (
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-xl border border-border-subtle bg-surface-card p-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
              {filterPanel}
            </div>
          </aside>
        )}

        {/* 中：搜尋 + 列表 */}
        <section className="min-w-0">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜尋課名、課號、教師或關鍵字"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-subtle bg-surface-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={`${wide ? 'xl:hidden' : ''} px-3 rounded-xl border border-border-subtle bg-surface-card text-sm flex items-center gap-1.5`}
            >
              <SlidersHorizontal size={15} />
              篩選{activeFilterCount > 0 && <span className="text-primary font-bold">({activeFilterCount})</span>}
            </button>
          </div>

          <div className="flex items-center justify-between mb-2 text-xs text-text-muted">
            <span>
              共 {filtered.length} 門課程
              {activeFilterCount > 0 && (
                <button type="button" onClick={resetFilters} className="ml-2 text-primary hover:underline">
                  清除條件
                </button>
              )}
            </span>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              aria-label="排序"
              className="px-2 py-1 rounded-lg border border-border-subtle bg-surface-card"
            >
              <option value="default">預設排序</option>
              <option value="seats">餘額多 → 少</option>
              <option value="rating">評價高 → 低</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-muted rounded-xl border border-dashed border-border-strong">
              沒有符合條件的課程
            </div>
          ) : (
            <ul className="space-y-2.5">{filtered.map(courseRow)}</ul>
          )}
        </section>

        {/* 右：課表 + 預選（lg 以上常駐） */}
        {wide && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-4">{planner}</div>
          </aside>
        )}
      </div>

      {/* 小螢幕：底部摘要列 */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className={`${
          compact ? 'sticky bottom-20 w-full mt-4' : 'fixed bottom-20 left-3 right-3 lg:hidden'
        } z-30 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-inverse-surface text-inverse-on-surface shadow-xl`}
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <CalendarDays size={18} />
          課表與預選
        </span>
        <span className="text-xs">
          預選 {cartOnly.length} 門・共 {totalCredits} 學分
          {plannedClash.size > 0 && <span className="ml-1.5 text-red-300 font-bold">有衝堂</span>}
        </span>
      </button>

      {/* 小螢幕：篩選抽屜 */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="篩選條件">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="relative ml-auto w-[85%] max-w-sm h-full bg-surface p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">篩選條件</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="關閉">
                <X size={20} />
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-4 w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold"
            >
              顯示 {filtered.length} 門課程
            </button>
          </div>
        </div>
      )}

      {/* 小螢幕：課表底部面板 */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="課表與預選">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-surface rounded-t-2xl max-h-[88vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">課表與預選</h2>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="關閉">
                <X size={20} />
              </button>
            </div>
            {planner}
          </div>
        </div>
      )}
    </div>
  );
};
