import { Course, CourseSlot } from '../types';
import { PERIOD_TIMES, slotRuns, slotsOf } from './schedule';

/**
 * 校本部地圖資料（FR-08）。
 * 建築位置依學校公告的「國立臺北護理健康大學校本部地圖」（2024.10.15 版）描繪，
 * 座標直接沿用該圖的像素位置（約 2000 × 1500），步道網路與距離為估算值。
 * 教室代碼字首依資管系網站「校本部平面圖」：B 親仁樓、G 教學大樓、S 科技大樓、L 圖書館、F 學思樓、I 樂育樓。
 * 正式上線時應改由校園 GIS 系統 API 取得座標與路徑。
 */

export interface CampusBuilding {
  /** 校本部地圖上的編號 */
  no: number;
  name: string;
  en: string;
  /** 教室代碼字首（例如 F408 的 F）；沒有排課的建築為 undefined */
  code?: string;
  /** 字首對應是推測的（學校網站沒有寫明） */
  codeInferred?: boolean;
  /** 中心點、寬高與旋轉角度（地圖上的大樓多半斜放） */
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
  round?: boolean;
  /** 出入口位置 */
  door: { x: number; y: number };
}

/** 地圖像素換算公尺（以校本部東西寬約 600 公尺估算） */
const METERS_PER_PX = 0.33;
/** 下課人潮中的步行速度（公尺／分鐘） */
const WALK_SPEED = 70;
/** 每上下一層樓（含等電梯、走樓梯）約需幾分鐘 */
const MIN_PER_FLOOR = 0.35;

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { no: 1, name: '親仁樓', en: 'Benevolence Bldg.', code: 'B', cx: 1500, cy: 505, w: 280, h: 95, rot: -17, door: { x: 1450, y: 560 } },
  { no: 2, name: '行政大樓', en: 'Administration Bldg.', cx: 1375, cy: 705, w: 165, h: 170, rot: -17, door: { x: 1455, y: 720 } },
  { no: 3, name: '科技大樓', en: 'Science & Technology Bldg.', code: 'S', cx: 1310, cy: 900, w: 330, h: 75, rot: -17, door: { x: 1300, y: 940 } },
  { no: 4, name: '圖書館', en: 'Library', code: 'L', cx: 1130, cy: 790, w: 170, h: 170, rot: 0, round: true, door: { x: 1150, y: 870 } },
  { no: 5, name: '教學大樓', en: 'Teaching Bldg.', code: 'G', cx: 1190, cy: 625, w: 300, h: 70, rot: -17, door: { x: 1130, y: 665 } },
  { no: 6, name: '學思樓', en: 'Pondering Bldg.', code: 'F', cx: 900, cy: 560, w: 270, h: 110, rot: 6, door: { x: 880, y: 615 } },
  { no: 7, name: '體育館', en: 'Gymnasium', cx: 632, cy: 600, w: 155, h: 130, rot: 3, round: true, door: { x: 712, y: 610 } },
  { no: 8, name: '明倫館', en: 'Ming-Lun Hall', cx: 618, cy: 710, w: 150, h: 100, rot: 3, door: { x: 700, y: 720 } },
  { no: 9, name: '蕙質樓', en: 'Hui-Chih Bldg.', cx: 590, cy: 812, w: 160, h: 60, rot: 3, door: { x: 680, y: 815 } },
  { no: 10, name: '學生餐廳', en: 'Restaurant', cx: 538, cy: 875, w: 85, h: 70, rot: 3, door: { x: 590, y: 880 } },
  { no: 11, name: '蘭心樓', en: 'Lan-Hsin Bldg.', cx: 575, cy: 958, w: 165, h: 60, rot: 3, door: { x: 665, y: 960 } },
  { no: 12, name: '爾雅樓', en: 'Elegance Bldg.', cx: 475, cy: 640, w: 135, h: 95, rot: 3, door: { x: 478, y: 690 } },
  { no: 13, name: '水療中心', en: 'Hydrotherapy Center', cx: 388, cy: 785, w: 170, h: 150, rot: 3, door: { x: 476, y: 790 } },
  { no: 14, name: '樂育樓', en: 'Inspiration Bldg.', code: 'I', cx: 368, cy: 975, w: 150, h: 60, rot: 3, door: { x: 446, y: 990 } },
];

/** 不在校本部的教室代碼（例如 C 開頭是城區部文教大樓） */
export const OFF_CAMPUS: Record<string, string> = {
  C: '城區部 文教大樓',
};

export const CAMPUS_GATES = [
  { name: '明德門（1 號門）', x: 1572, y: 900, lx: 1572, ly: 945, anchor: 'middle' as const },
  { name: '石牌門（2 號門）', x: 758, y: 462, lx: 774, ly: 470, anchor: 'start' as const },
  { name: '3 號門', x: 372, y: 690, lx: 356, ly: 698, anchor: 'end' as const },
];

/** 校內步道節點與路段（依地圖上的道路描繪） */
const NODES: Record<string, { x: number; y: number }> = {
  g2: { x: 755, y: 470 },
  n1: { x: 742, y: 620 },
  n2: { x: 727, y: 790 },
  n3: { x: 707, y: 1020 },
  s1: { x: 1000, y: 990 },
  s2: { x: 1290, y: 940 },
  s3: { x: 1560, y: 890 },
  p1: { x: 1490, y: 720 },
  p2: { x: 1445, y: 565 },
  h1: { x: 1050, y: 700 },
  h2: { x: 1320, y: 650 },
  w1: { x: 482, y: 770 },
  w2: { x: 478, y: 690 },
  w3: { x: 470, y: 1015 },
};

export const PATHS: { a: string; b: string; road: string }[] = [
  { a: 'g2', b: 'n1', road: '晨映大道' },
  { a: 'n1', b: 'n2', road: '晨映大道' },
  { a: 'n2', b: 'n3', road: '晨映大道' },
  { a: 'n3', b: 's1', road: '熾陽大道' },
  { a: 's1', b: 's2', road: '熾陽大道' },
  { a: 's2', b: 's3', road: '熾陽大道' },
  { a: 's3', b: 'p1', road: '椰林大道' },
  { a: 'p1', b: 'p2', road: '椰林大道' },
  { a: 'n1', b: 'h1', road: '學思樓前步道' },
  { a: 'h1', b: 'h2', road: '柳韻曲橋旁步道' },
  { a: 'h2', b: 'p2', road: '柳韻曲橋旁步道' },
  { a: 'n2', b: 'w1', road: '綠杏綠廊' },
  { a: 'w1', b: 'w2', road: '西側步道' },
  { a: 'w1', b: 'w3', road: '西側步道' },
  { a: 'w3', b: 'n3', road: '蘭心樓旁步道' },
];

export const pathSegments = () => PATHS.map(p => ({ from: NODES[p.a], to: NODES[p.b], road: p.road }));

const BUILDING_MAP = new Map(CAMPUS_BUILDINGS.filter(b => b.code).map(b => [b.code!, b]));

export const buildingLabel = (b: CampusBuilding) => `${b.name}（${b.code} 棟）`;

export interface RoomInfo {
  room: string;
  building: CampusBuilding;
  floor: number;
}

const splitRooms = (room?: string) =>
  (room ?? '')
    .split(/[,，、\s]+/)
    .map(r => r.trim().toUpperCase())
    .filter(Boolean);
const firstRoom = (room?: string) => splitRooms(room)[0] ?? '';

/** 單一教室代碼 → 建築與樓層 */
const parseOne = (code: string): RoomInfo | null => {
  // F408、G303、F1034（10 樓）、IB01（地下室）
  const m = /^([A-Z])(B)?(\d{2,})$/.exec(code);
  if (!m) return null;
  const building = BUILDING_MAP.get(m[1]);
  if (!building) return null;
  const digits = m[3];
  const floor = m[2] ? 0 : Math.max(1, Number(digits.length >= 4 ? digits.slice(0, 2) : digits[0]));
  return { room: code, building, floor };
};

/** 教室代碼（如 F408、G303、B216）→ 建築與樓層；有兩間教室（如 F410,F602）時取第一間 */
export const parseRoom = (room?: string): RoomInfo | null => {
  for (const code of splitRooms(room)) {
    const info = parseOne(code);
    if (info) return info;
  }
  return null;
};

/** 一個時段排了多間教室時，全部列出 */
export const parseRooms = (room?: string): RoomInfo[] =>
  splitRooms(room)
    .map(parseOne)
    .filter((r): r is RoomInfo => !!r);

/** 不在校本部的教室，回傳所在校區說明 */
export const offCampusOf = (room?: string): string | null => OFF_CAMPUS[firstRoom(room)[0] ?? ''] ?? null;

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** 離建築出入口最近的步道節點 */
const nearestNode = (p: { x: number; y: number }) =>
  Object.keys(NODES).reduce((best, k) => (dist(NODES[k], p) < dist(NODES[best], p) ? k : best), 'n1');

/** 在步道網路上找最短路徑（Dijkstra，節點很少直接暴力算） */
const shortestPath = (from: string, to: string): string[] => {
  const d: Record<string, number> = {};
  const prev: Record<string, string | undefined> = {};
  const todo = new Set(Object.keys(NODES));
  Object.keys(NODES).forEach(k => (d[k] = Infinity));
  d[from] = 0;
  while (todo.size) {
    const u = [...todo].reduce((a, b) => (d[a] <= d[b] ? a : b));
    todo.delete(u);
    if (u === to) break;
    for (const e of PATHS) {
      const v = e.a === u ? e.b : e.b === u ? e.a : null;
      if (!v || !todo.has(v)) continue;
      const nd = d[u] + dist(NODES[u], NODES[v]);
      if (nd < d[v]) {
        d[v] = nd;
        prev[v] = u;
      }
    }
  }
  const path = [to];
  while (path[0] !== from && prev[path[0]]) path.unshift(prev[path[0]]!);
  return path;
};

const roadOf = (a: string, b: string) => PATHS.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))?.road;

export interface WalkRoute {
  from: RoomInfo;
  to: RoomInfo;
  /** 水平步行距離（公尺） */
  meters: number;
  /** 上下樓所需分鐘 */
  verticalMinutes: number;
  /** 總預估分鐘（無條件進位） */
  minutes: number;
  /** 地圖上畫路線用的折線點 */
  points: { x: number; y: number }[];
  /** 依序經過的道路名稱 */
  roads: string[];
}

export const walkRoute = (from: RoomInfo, to: RoomInfo): WalkRoute => {
  if (from.building.no === to.building.no) {
    const verticalMinutes = Math.abs(from.floor - to.floor) * MIN_PER_FLOOR;
    return {
      from,
      to,
      meters: 40,
      verticalMinutes,
      minutes: Math.max(1, Math.ceil(40 / WALK_SPEED + verticalMinutes)),
      points: [from.building.door],
      roads: [],
    };
  }
  const a = from.building.door;
  const b = to.building.door;
  const nodes = shortestPath(nearestNode(a), nearestNode(b));
  const points = [a, ...nodes.map(k => NODES[k]), b];
  const px = points.slice(1).reduce((sum, p, i) => sum + dist(points[i], p), 0);
  const meters = Math.round((px * METERS_PER_PX) / 10) * 10;
  const roads: string[] = [];
  for (let i = 1; i < nodes.length; i++) {
    const r = roadOf(nodes[i - 1], nodes[i]);
    if (r && roads[roads.length - 1] !== r) roads.push(r);
  }
  const verticalMinutes = (Math.abs(from.floor - 1) + Math.abs(to.floor - 1)) * MIN_PER_FLOOR;
  return {
    from,
    to,
    meters,
    verticalMinutes,
    minutes: Math.max(1, Math.ceil(meters / WALK_SPEED + verticalMinutes)),
    points,
    roads,
  };
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** 前一堂課下課到下一堂課上課之間有幾分鐘 */
export const gapMinutes = (prevLastPeriod: number, nextFirstPeriod: number): number => {
  const end = PERIOD_TIMES[prevLastPeriod]?.end;
  const start = PERIOD_TIMES[nextFirstPeriod]?.start;
  if (!end || !start) return 0;
  return toMinutes(start) - toMinutes(end);
};

export type TransitionLevel = 'ok' | 'tight' | 'late';

export interface Transition {
  day: number;
  prev: { course: Course; slot: CourseSlot };
  next: { course: Course; slot: CourseSlot };
  gap: number;
  route: WalkRoute | null;
  /** ok：時間充裕；tight：剩不到 3 分鐘；late：步行時間超過下課時間 */
  level: TransitionLevel;
}

/** 同一天、中間沒有空堂（含午休 40 分鐘）的兩堂課才列入換教室檢查 */
const CONSECUTIVE_GAP_LIMIT = 45;

export const levelOf = (gap: number, route: WalkRoute | null): TransitionLevel => {
  if (!route) return 'ok';
  if (route.minutes > gap) return 'late';
  if (gap - route.minutes < 3) return 'tight';
  return 'ok';
};

/** 找出一組課程中所有「下課後要立刻換教室」的銜接 */
export const transitionsOf = (courses: Course[]): Transition[] => {
  const items = courses.flatMap(course => slotsOf(course).flatMap(slotRuns).map(slot => ({ course, slot })));
  const result: Transition[] = [];
  for (let day = 1; day <= 7; day++) {
    const today = items
      .filter(i => i.slot.day === day)
      .sort((a, b) => Math.min(...a.slot.periods) - Math.min(...b.slot.periods));
    for (let i = 0; i + 1 < today.length; i++) {
      const prev = today[i];
      const next = today[i + 1];
      if (prev.course.id === next.course.id) continue;
      const last = Math.max(...prev.slot.periods);
      const first = Math.min(...next.slot.periods);
      if (first <= last) continue; // 衝堂另外處理
      const gap = gapMinutes(last, first);
      if (gap > CONSECUTIVE_GAP_LIMIT) continue;
      // 兩間教室的課（如 F414,I303）取步行最短的組合
      const froms = parseRooms(prev.slot.room || prev.course.room);
      const tos = parseRooms(next.slot.room || next.course.room);
      let route: WalkRoute | null = null;
      for (const f of froms)
        for (const t of tos) {
          const r = walkRoute(f, t);
          if (!route || r.minutes < route.minutes) route = r;
        }
      result.push({ day, prev, next, gap, route, level: levelOf(gap, route) });
    }
  }
  return result;
};

/** 某門課（若加入課表）和前後堂課的銜接 */
export const transitionsAround = (target: Course, planned: Course[]): Transition[] => {
  const others = planned.filter(c => c.id !== target.id);
  return transitionsOf([...others, target]).filter(
    t => t.prev.course.id === target.id || t.next.course.id === target.id
  );
};

export const floorLabel = (floor: number) => (floor <= 0 ? 'B1' : `${floor}F`);

/**
 * 「在 Google 地圖導航」連結（不需 API 金鑰）：手機會直接開 Google 地圖 App。
 * 校內大樓以「學校名＋樓名」搜尋；城區部等校外地點直接導航到該校區。
 */
export const googleMapsUrl = (place: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`國立臺北護理健康大學 ${place}`)}`;

export const OFF_CAMPUS_MAP_QUERY: Record<string, string> = {
  C: '城區部',
};
