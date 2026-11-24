import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, CircleCheck, Footprints, MapPin, TriangleAlert, X } from 'lucide-react';
import { Course } from '../types';
import {
  CAMPUS_BUILDINGS,
  ROAD_Y,
  Transition,
  doorOf,
  floorLabel,
  parseRoom,
  transitionsAround,
} from '../lib/campus';
import { DAY_LABELS, PERIOD_TIMES, formatCourseTime, slotsOf } from '../lib/schedule';

interface CampusMapModalProps {
  course: Course;
  /** 目前課表＋預選清單，用來找前後堂課 */
  plannedCourses: Course[];
  onClose: () => void;
}

const periodRange = (periods: number[]) => {
  const first = Math.min(...periods);
  const last = Math.max(...periods);
  return `${PERIOD_TIMES[first]?.start ?? ''}-${PERIOD_TIMES[last]?.end ?? ''}`;
};

const periodText = (periods: number[]) => {
  const first = Math.min(...periods);
  const last = Math.max(...periods);
  return first === last ? `第 ${first} 節` : `第 ${first}-${last} 節`;
};

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
  const highlightCode = target?.building.code;
  const arriving = active?.next.course.id === course.id;
  const otherInfo = route ? (arriving ? route.from : route.to) : null;
  const originCode = otherInfo && otherInfo.building.code !== highlightCode ? otherInfo.building.code : null;
  const routeLabelPos = route && route.points.length > 1
    ? { x: (route.points[1].x + route.points[2].x) / 2, y: ROAD_Y }
    : null;

  const slots = slotsOf(course);

  const steps = route
    ? route.from.building.code === route.to.building.code
      ? [
          `離開 ${route.from.room}：在 ${route.from.building.name}內移動，不用出大樓。`,
          route.from.floor === route.to.floor
            ? `同一層樓，沿走廊走到 ${route.to.room}。`
            : `${route.to.floor > route.from.floor ? '上' : '下'}樓到 ${floorLabel(route.to.floor)}（約 ${Math.ceil(route.verticalMinutes)} 分鐘）。`,
          `抵達 ${route.to.room}。`,
        ]
      : [
          `離開 ${route.from.room}：${route.from.floor > 1 ? `從 ${floorLabel(route.from.floor)} 下到 1 樓，` : ''}由 ${route.from.building.name}出口走到中央林蔭大道。`,
          `沿林蔭大道${route.direction ? `向${route.direction}` : ''}步行約 ${route.meters} 公尺，抵達 ${route.to.building.name}（${route.to.building.note}）。`,
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
                示意地圖
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {target
                ? `${target.building.name}（${target.building.note}）${floorLabel(target.floor)} ・ `
                : ''}
              {course.name} ・ {formatCourseTime(course)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="關閉" className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center text-text-muted">
            <X size={20} />
          </button>
        </div>

        {!target ? (
          <div className="p-10 text-center text-sm text-text-muted">
            這門課的教室為「{course.room || course.location || '未排'}」，尚未排定或無法對應到校園建築，暫時無法顯示位置。
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {/* 左：地圖 */}
            <div className="p-4 sm:p-5 lg:border-r border-border-subtle">
              <div className="flex items-center justify-between text-[11px] text-text-muted mb-2">
                <span className="font-semibold text-text-secondary">北護石牌校區平面示意圖</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary" />目標教室</span>
                  {originCode && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-secondary" />{arriving ? '前一堂' : '下一堂'}</span>}
                </span>
              </div>
              <svg viewBox="0 0 400 260" className="w-full h-auto rounded-xl bg-[#f3f6fb] border border-border-subtle" role="img" aria-label={`校園示意地圖，標示 ${target.room}`}>
                {/* 綠地 */}
                <ellipse cx="190" cy="108" rx="62" ry="26" fill="#dcefe6" />
                <ellipse cx="150" cy="205" rx="44" ry="30" fill="#dcefe6" />
                <circle cx="356" cy="210" r="26" fill="#dcefe6" />
                {/* 道路 */}
                <rect x="10" y={ROAD_Y - 6} width="380" height="12" rx="6" fill="#dfe5f0" />
                <text x="160" y={ROAD_Y + 16} textAnchor="middle" fontSize="7" fill="#64748B">中央林蔭大道</text>
                {CAMPUS_BUILDINGS.map(b => {
                  const d = doorOf(b);
                  return <line key={`door-${b.code}`} x1={d.x} y1={d.y} x2={d.x} y2={ROAD_Y} stroke="#dfe5f0" strokeWidth="5" />;
                })}
                <text x="392" y={ROAD_Y + 18} textAnchor="end" fontSize="7" fill="#94a3b8">明德路 校門 →</text>

                {/* 建築 */}
                {CAMPUS_BUILDINGS.map(b => {
                  const isTarget = b.code === highlightCode;
                  const isOrigin = b.code === originCode;
                  const fill = isTarget ? '#00355f' : isOrigin ? '#006b5f' : '#ffffff';
                  const text = isTarget || isOrigin ? '#ffffff' : '#131b2e';
                  const sub = isTarget || isOrigin ? 'rgba(255,255,255,.8)' : '#64748B';
                  return (
                    <g key={b.code}>
                      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="7" fill={fill} stroke={isTarget || isOrigin ? fill : '#CBD5E1'} strokeWidth="1.2" />
                      <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 1} textAnchor="middle" fontSize="10" fontWeight="700" fill={text}>{b.name}</text>
                      <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 10} textAnchor="middle" fontSize="7" fill={sub}>{b.note}</text>
                    </g>
                  );
                })}

                {/* 路線 */}
                {route && route.points.length > 1 && (
                  <polyline
                    points={route.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#006b5f"
                    strokeWidth="2.5"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="route-dash"
                  />
                )}
                {routeLabelPos && route && (
                  <g>
                    <rect x={routeLabelPos.x - 30} y={routeLabelPos.y - 22} width="60" height="14" rx="7" fill="#006b5f" />
                    <text x={routeLabelPos.x} y={routeLabelPos.y - 12} textAnchor="middle" fontSize="7.5" fontWeight="600" fill="#fff">
                      步行約 {route.meters}m
                    </text>
                  </g>
                )}

                {/* 目標標記 */}
                {(() => {
                  const b = CAMPUS_BUILDINGS.find(x => x.code === highlightCode);
                  if (!b) return null;
                  const cx = b.x + b.w - 8;
                  const cy = b.y + 8;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r="9" fill="#71f8e4" className="pin-pulse" />
                      <circle cx={cx} cy={cy} r="4" fill="#ffffff" />
                    </g>
                  );
                })()}
              </svg>
              <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
                建築位置與步行時間為示意估算（下課人潮步速約 70 公尺／分、每層樓約 20 秒），正式版將串接校園 GIS 圖資 API。
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
          <span className="text-[11px] text-text-muted min-w-0">資料來源：校園示意圖資（模擬）<span className="hidden sm:inline">＋ 您的課表與預選清單</span></span>
          <button type="button" onClick={onClose} className="shrink-0 whitespace-nowrap px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-primary-container">
            <ArrowLeft size={15} /> 返回選課
          </button>
        </div>
      </div>
    </div>
  );
};
