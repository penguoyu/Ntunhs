import React from 'react';
import { CAMPUS_BUILDINGS, CAMPUS_GATES, CampusBuilding, WalkRoute, pathSegments } from '../lib/campus';

interface CampusMapSvgProps {
  /** 這門課所在大樓（深藍） */
  targetNo?: number;
  /** 前一堂／下一堂所在大樓（綠） */
  otherNo?: number;
  route?: WalkRoute | null;
  label: string;
}

const NAVY = '#00355f';
const TEAL = '#006b5f';

/** 依學校「校本部地圖」描繪的簡化平面圖（座標沿用原圖像素） */
export const CampusMapSvg: React.FC<CampusMapSvgProps> = ({ targetNo, otherNo, route, label }) => {
  const segments = pathSegments();
  const target = CAMPUS_BUILDINGS.find(b => b.no === targetNo);

  // 路線標籤放在最長的一段中間
  let routeLabel: { x: number; y: number } | null = null;
  if (route && route.points.length > 1) {
    let best = 0;
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1];
      const b = route.points[i];
      const len = Math.hypot(a.x - b.x, a.y - b.y);
      if (len > best) {
        best = len;
        routeLabel = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
    }
  }

  const buildingStyle = (b: CampusBuilding) => {
    if (b.no === targetNo) return { fill: NAVY, stroke: NAVY, text: '#fff', sub: 'rgba(255,255,255,.8)' };
    if (b.no === otherNo) return { fill: TEAL, stroke: TEAL, text: '#fff', sub: 'rgba(255,255,255,.8)' };
    if (b.code) return { fill: '#ffffff', stroke: '#94a3b8', text: '#131b2e', sub: '#475569' };
    return { fill: '#e4eee2', stroke: '#c9dbc6', text: '#4b5d4a', sub: '#6b7f69' };
  };

  return (
    <svg
      viewBox="250 400 1480 700"
      className="w-full h-auto rounded-xl border border-border-subtle"
      style={{ background: '#fbfbf3' }}
      role="img"
      aria-label={label}
    >
      {/* 校園範圍 */}
      <polygon
        points="285,690 470,600 700,470 1000,440 1330,460 1580,385 1680,560 1695,860 1565,905 1280,1010 1000,1062 700,1052 285,1032"
        fill="#eef5e4"
        stroke="#d7e6c8"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* 運動場、籃球場、柳韻曲橋水池 */}
      <ellipse cx="885" cy="830" rx="92" ry="185" fill="#dcecd2" stroke="#c4dbb6" strokeWidth="18" />
      <text x="885" y="836" textAnchor="middle" fontSize="28" fill="#5d7a55">運動場</text>
      <rect x="965" y="900" width="120" height="110" rx="8" fill="#dcecd2" />
      <text x="1025" y="962" textAnchor="middle" fontSize="22" fill="#5d7a55">籃球場</text>
      <path d="M1215,680 q30,-30 50,10 q20,40 -10,80 q-30,30 -45,-15 z" fill="#cfe3f1" />

      {/* 步道 */}
      {segments.map((s, i) => (
        <line key={i} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} stroke="#e3e5dc" strokeWidth="20" strokeLinecap="round" />
      ))}
      <text x="768" y="880" fontSize="22" fill="#7b8574" transform="rotate(88 768 880)">晨映大道</text>
      <text x="1120" y="1000" fontSize="22" fill="#7b8574" transform="rotate(-11 1120 1000)">熾陽大道</text>
      <text x="1518" y="610" fontSize="22" fill="#7b8574" transform="rotate(72 1518 610)">椰林大道</text>

      {/* 校門 */}
      {CAMPUS_GATES.map(g => (
        <g key={g.name}>
          <polygon points={`${g.x - 11},${g.y + 10} ${g.x + 11},${g.y + 10} ${g.x},${g.y - 12}`} fill="#dc2626" />
          <text x={g.lx} y={g.ly} textAnchor={g.anchor} fontSize="22" fill="#b91c1c" fontWeight="600">{g.name}</text>
        </g>
      ))}

      {/* 建築 */}
      {CAMPUS_BUILDINGS.map(b => {
        const st = buildingStyle(b);
        const rx = b.round ? Math.min(b.w, b.h) * 0.45 : 10;
        const small = b.w < 120;
        return (
          <g key={b.no}>
            <rect
              x={b.cx - b.w / 2}
              y={b.cy - b.h / 2}
              width={b.w}
              height={b.h}
              rx={rx}
              fill={st.fill}
              stroke={st.stroke}
              strokeWidth="3"
              transform={b.rot ? `rotate(${b.rot} ${b.cx} ${b.cy})` : undefined}
            />
            <text x={b.cx} y={b.code ? b.cy : b.cy + 9} textAnchor="middle" fontSize={small ? 22 : 30} fontWeight="700" fill={st.text}>
              {b.no} {b.name}
            </text>
            {b.code && (
              <text x={b.cx} y={b.cy + 28} textAnchor="middle" fontSize="21" fill={st.sub}>
                {b.code} 棟{b.codeInferred ? '（推測）' : ''}
              </text>
            )}
          </g>
        );
      })}

      {/* 路線 */}
      {route && route.points.length > 1 && (
        <polyline
          points={route.points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={TEAL}
          strokeWidth="7"
          strokeDasharray="16 12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="route-dash-lg"
        />
      )}
      {routeLabel && route && (
        <g>
          <rect x={routeLabel.x - 110} y={routeLabel.y - 26} width="220" height="52" rx="26" fill={TEAL} />
          <text x={routeLabel.x} y={routeLabel.y + 9} textAnchor="middle" fontSize="26" fontWeight="600" fill="#fff">
            步行約 {route.meters} 公尺
          </text>
        </g>
      )}

      {/* 目標教室標記 */}
      {target && (
        <g>
          <circle cx={target.cx + target.w / 2 - 14} cy={target.cy - target.h / 2 + 10} r="20" fill="#71f8e4" className="pin-pulse" />
          <circle cx={target.cx + target.w / 2 - 14} cy={target.cy - target.h / 2 + 10} r="9" fill="#ffffff" stroke={NAVY} strokeWidth="3" />
        </g>
      )}
    </svg>
  );
};
