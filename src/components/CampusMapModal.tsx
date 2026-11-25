import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, CircleCheck, Footprints, MapPin, Navigation, TriangleAlert, X } from 'lucide-react';
import { Course } from '../types';
import { OFF_CAMPUS_MAP_QUERY, Transition, buildingLabel, floorLabel, googleMapsUrl, offCampusOf, parseRoom, parseRooms, transitionsAround } from '../lib/campus';
import { CampusMapSvg } from './CampusMapSvg';
import { DAY_LABELS, PERIOD_TIMES, formatCourseTime, slotRuns, slotsOf } from '../lib/schedule';

interface CampusMapModalProps {
  course: Course;
  /** 目前課表＋預選清單，用來找前後堂課 */
  plannedCourses: Course[];
  onClose: () => void;
}

const runsOf = (periods: number[]) => slotRuns({ day: 0, periods, room: '' }).map(r => r.periods);

const periodRange = (periods: number[]) =>
  runsOf(periods)
    .map(r => `${PERIOD_TIMES[r[0]]?.start ?? ''}-${PERIOD_TIMES[r[r.length - 1]]?.end ?? ''}`)
    .join('、');

const periodText = (periods: number[]) =>
  `第 ${runsOf(periods)
    .map(r => (r.length === 1 ? `${r[0]}` : `${r[0]}-${r[r.length - 1]}`))
    .join('、')} 節`;

const LEVEL_STYLE = {
  late: { box: 'bg-red-50 border-red-200 text-red-800', badge: 'bg-red-100 text-red-700', label: '來不及' },
  tight: { box: 'bg-amber-50 border-amber-200 text-amber-900', badge: 'bg-amber-100 text-amber-800', label: '很趕' },
  ok: { box: 'bg-emerald-50 border-emerald-200 text-emerald-900', badge: 'bg-emerald-100 text-emerald-800', label: '時間充裕' },
} as const;

export const CampusMapModal: React.FC<CampusMapModalProps> = ({ course, plannedCourses, onClose }) => {
  const target = parseRoom(course.room || course.location);
  const transitions = useMemo(() => transitionsAround(course, plannedCourses), [course, plannedCourses]);
  // 預設顯示最需要注意的一段（先看「趕到這門課」）
  const [selected, setSelected] = useState(() => {
    const order = { late: 0, tight: 1, ok: 2 } as const;
    const ranked = transitions
      .map((t, i) => ({ t, i }))
      .sort((a, b) => order[a.t.level] - order[b.t.level] || (a.t.next.course.id === course.id ? -1 : 1));
    return ranked[0]?.i ?? -1;
  });
  const active: Transition | undefined = transitions[selected];
  const route = active?.route ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 這門課的大樓永遠是深藍色；路線另一端（前一堂或下一堂）用綠色
  const arriving = active?.next.course.id === course.id;
  // 有兩間教室時，以路線實際用到的那間為準
  const mine = route ? (arriving ? route.to : route.from) : target;
  const targetNo = mine?.building.no;
  const allRooms = parseRooms(course.room || course.location);
  const otherInfo = route ? (arriving ? route.from : route.to) : null;
  const otherNo = otherInfo && otherInfo.building.no !== targetNo ? otherInfo.building.no : undefined;
  const offCampus = offCampusOf(course.room || course.location);
  const offCampusCode = (course.room || course.location || '').trim().charAt(0).toUpperCase();
  const mapsPlace = mine ? mine.building.name : offCampus ? OFF_CAMPUS_MAP_QUERY[offCampusCode] ?? offCampus : null;
  const mapsHref = mapsPlace ? googleMapsUrl(mapsPlace) : null;
  const inferred = [target?.building, otherInfo?.building].filter(b => b?.codeInferred);

  const slots = slotsOf(course);

  const steps = route
    ? route.from.building.no === route.to.building.no
      ? [
          `離開 ${route.from.room}：在 ${route.from.building.name}內移動，不用出大樓。`,
          route.from.floor === route.to.floor
            ? `同一層樓，沿走廊走到 ${route.to.room}。`
            : `${route.to.floor > route.from.floor ? '上' : '下'}樓到 ${floorLabel(route.to.floor)}（約 ${Math.ceil(route.verticalMinutes)} 分鐘）。`,
          `抵達 ${route.to.room}。`,
        ]
      : [
          `離開 ${route.from.room}：${route.from.floor > 1 ? `從 ${floorLabel(route.from.floor)} 下到 1 樓，` : ''}由${route.from.building.name}出口出來。`,
          `${route.roads.length ? `沿${route.roads.join('、')}` : ''}步行約 ${route.meters} 公尺，抵達 ${route.to.building.no} 號${route.to.building.name}。`,
          `進入 ${route.to.building.name}${route.to.floor > 1 ? `，上到 ${floorLabel(route.to.floor)}` : ''}，找到 ${route.to.room}。`,
        ]
    : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="教室位置地圖">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[100vh] sm:max-h-[92vh] overflow-y-auto bg-surface-card sm:rounded-2xl shadow-2xl">
        {/* 標題 */}
        <div className="sticky top-0 z-10 bg-surface-card flex items-start gap-3 px-4 sm:px-6 py-4 border-b border-border-subtle">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-on-surface flex flex-wrap items-center gap-2">
              {target ? `${target.room} 教室位置與路線指引` : '教室位置'}
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-medium text-text-secondary">
                校本部地圖
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {target
                ? `${buildingLabel(target.building)} ${floorLabel(target.floor)} ・ `
                : ''}
              {course.name} ・ {formatCourseTime(course)}
              {allRooms.length > 1 && ` ・ 排在兩間教室：${allRooms.map(r => r.room).join('、')}`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="關閉" className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center text-text-muted">
            <X size={20} />
          </button>
        </div>

        {!target ? (
          <div className="p-10 text-center text-sm text-text-muted">
            {offCampus
              ? `這門課在${offCampus}（${course.room || course.location}），不在校本部，校本部地圖上沒有這棟大樓。`
              : `這門課的教室為「${course.room || course.location || '未排'}」，尚未排定或無法對應到校本部建築，暫時無法顯示位置。`}
            {mapsHref && (
              <div className="mt-4">
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5"
                >
                  <Navigation size={15} /> 用 Google 地圖導航到{mapsPlace}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {/* 左：地圖 */}
            <div className="p-4 sm:p-5 lg:border-r border-border-subtle">
              <div className="flex items-center justify-between text-[11px] text-text-muted mb-2">
                <span className="font-semibold text-text-secondary">校本部平面圖（依學校校本部地圖簡化）</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary" />目標教室</span>
                  {otherNo && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-secondary" />{arriving ? '前一堂' : '下一堂'}</span>}
                </span>
              </div>
              <CampusMapSvg targetNo={targetNo} otherNo={otherNo} route={route} label={`校本部地圖，標示 ${target.room}`} />
              <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
                大樓位置依學校公告的校本部地圖描繪；步行距離與時間為估算（下課人潮步速約 70 公尺／分、每層樓約 20 秒），正式版將串接校園 GIS 圖資 API。
                {inferred.length > 0 && ` ${Array.from(new Set(inferred.map(b => `${b!.code} 開頭教室對應${b!.name}`))).join('、')}是依開課系所推測，請以學校公告為準。`}
              </p>
            </div>

            {/* 右：趕課檢核 */}
            <div className="p-4 sm:p-5 space-y-4">
              {active && route ? (
                <div className={`rounded-xl border p-3.5 ${LEVEL_STYLE[active.level].box}`}>
                  <p className="flex items-center gap-1.5 font-semibold text-sm">
                    {active.level === 'ok' ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}
                    {active.level === 'ok' ? '換教室時間充裕' : active.level === 'tight' ? '趕課時間緊迫' : '下課時間不夠走到下一堂'}
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] ${LEVEL_STYLE[active.level].badge}`}>
                      {active.level === 'ok' ? `餘裕 ${active.gap - route.minutes} 分鐘` : active.level === 'tight' ? `僅剩 ${active.gap - route.minutes} 分鐘` : `差 ${route.minutes - active.gap} 分鐘`}
                    </span>
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed">
                    預估步行 {route.minutes} 分鐘，下課時間{active.level === 'ok' ? '有' : '只有'} {active.gap} 分鐘。
                    {active.level === 'ok'
                      ? '照正常速度走就來得及。'
                      : '下課尖峰電梯擁擠，建議提早收拾、走樓梯，或先跟授課老師說明。'}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-surface-container-low p-3.5 text-xs text-text-secondary leading-relaxed">
                  <p className="font-semibold text-sm text-on-surface mb-1">不用趕場</p>
                  這門課前後沒有緊接著的課（以目前課表與預選清單計算），可以從容前往
                  {target.building.name} {floorLabel(target.floor)}。
                </div>
              )}

              {transitions.length > 0 && (
                <div className="rounded-xl border border-border-subtle">
                  <div className="px-3.5 py-2.5 border-b border-border-subtle text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <Footprints size={14} /> 課堂銜接移動檢核
                  </div>
                  {transitions.length > 1 && (
                    <div className="flex gap-1.5 px-3.5 pt-3">
                      {transitions.map((t, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelected(i)}
                          className={`px-2 py-1 rounded-lg text-[11px] border ${i === selected ? 'bg-primary text-white border-primary' : 'border-border-subtle text-text-secondary'}`}
                        >
                          {t.next.course.id === course.id ? '趕來上這堂' : '下課趕去下一堂'}・週{DAY_LABELS[t.day - 1]}
                        </button>
                      ))}
                    </div>
                  )}
                  {active && (
                    <div className="p-3.5 space-y-2">
                      {[active.prev, active.next].map((s, idx) => (
                        <React.Fragment key={idx}>
                          {idx === 1 && (
                            <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-secondary">
                              <ArrowDown size={14} />
                              {route
                                ? `預估步行 ${route.minutes} 分鐘（含上下樓 ${Math.ceil(route.verticalMinutes)} 分鐘）・下課 ${active.gap} 分鐘`
                                : `下課 ${active.gap} 分鐘・教室未排定，無法估算`}
                            </div>
                          )}
                          <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${s.course.id === course.id ? 'bg-primary-fixed/60' : 'bg-surface-container-low'}`}>
                            <span className={`w-7 h-7 rounded-md text-[11px] font-semibold flex items-center justify-center shrink-0 ${s.course.id === course.id ? 'bg-primary text-white' : 'bg-surface-card text-text-secondary border border-border-subtle'}`}>
                              {idx === 0 ? '前' : '後'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate">
                                {s.slot.room || s.course.room} ・ {s.course.name}
                              </p>
                              <p className="text-[11px] text-text-muted">
                                週{DAY_LABELS[s.slot.day - 1]} {periodText(s.slot.periods)}（{periodRange(s.slot.periods)}）
                              </p>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {steps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">建議路線</p>
                  <ol className="space-y-2">
                    {steps.map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-on-surface">
                        <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0 ${i === steps.length - 1 ? 'bg-secondary text-white' : 'bg-surface-container text-text-secondary'}`}>
                          {i + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="text-[11px] text-text-muted border-t border-border-subtle pt-3">
                上課時段：
                {slots.map(s => `週${DAY_LABELS[s.day - 1]} ${periodText(s.periods)}（${periodRange(s.periods)}）${s.room ? ` ${s.room}` : ''}`).join('、')}
              </div>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 bg-surface-card border-t border-border-subtle px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-text-muted min-w-0"><span className="sm:hidden">來源：校本部地圖</span><span className="hidden sm:inline">資料來源：學校校本部地圖（2024.10.15）＋ 您的課表與預選清單</span></span>
          <div className="flex items-center gap-2 shrink-0">
          {mapsHref && target && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              title={`在 Google 地圖開啟${mapsPlace}`}
              className="whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg border border-border-subtle text-primary text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/5"
            >
              <Navigation size={15} /> <span className="hidden sm:inline">在 </span>Google 地圖<span className="hidden sm:inline">開啟</span>
            </a>
          )}
          <button type="button" onClick={onClose} className="shrink-0 whitespace-nowrap px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-primary-container">
            <ArrowLeft size={15} /> 返回選課
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};
