import { Course, CourseSlot } from '../types';
import { PERIOD_TIMES, slotsOf } from './schedule';

/**
 * 校園示意地圖資料（FR-08）。
 * 建築位置、名稱與步行時間皆為示意／估算值，不是學校 GIS 圖資，
 * 正式上線時應改由校園 GIS 系統 API 取得座標與路徑。
 */

export interface CampusBuilding {
  code: string;
  name: string;
  note: string;
  /** SVG 座標（viewBox 400 × 260） */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 主要步道（中央林蔭大道）的 y 座標；建築出入口都先接到這條路 */
export const ROAD_Y = 150;
/** 1 個 SVG 單位約等於幾公尺（示意比例） */
const METERS_PER_UNIT = 1.6;
/** 下課人潮中的步行速度（公尺／分鐘） */
const WALK_SPEED = 70;
/** 每上下一層樓（含等電梯、走樓梯）約需幾分鐘 */
const MIN_PER_FLOOR = 0.35;

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { code: 'A', name: 'A 棟', note: '通識教室', x: 20, y: 22, w: 72, h: 50 },
  { code: 'B', name: 'B 棟', note: '行政・校務中心', x: 148, y: 18, w: 84, h: 54 },
  { code: 'C', name: 'C 棟', note: '教學大樓', x: 276, y: 24, w: 58, h: 46 },
  { code: 'F', name: 'F 棟', note: '護理大樓', x: 26, y: 86, w: 92, h: 46 },
  { code: 'I', name: 'I 棟', note: '教學大樓', x: 296, y: 88, w: 76, h: 42 },
  { code: 'S', name: 'S 棟', note: '學生活動中心', x: 28, y: 176, w: 78, h: 54 },
  { code: 'G', name: 'G 棟', note: '健康科技大樓', x: 214, y: 172, w: 100, h: 62 },
];

const BUILDING_MAP = new Map(CAMPUS_BUILDINGS.map(b => [b.code, b]));

export interface RoomInfo {
  room: string;
  building: CampusBuilding;
  floor: number;
}

/** 教室代碼（如 F408、G303、S103）→ 建築與樓層；未排教室或無法辨識時回傳 null */
export const parseRoom = (room?: string): RoomInfo | null => {
  // 一門課有兩間教室時（如 F410,F602）取第一間
  const first = (room ?? '').split(/[,，、\s]+/)[0].trim().toUpperCase();
  const m = /^([A-Z])(B?)(\d)(\d{2,})$/.exec(first);
  if (!m) return null;
  const building = BUILDING_MAP.get(m[1]);
  if (!building) return null;
  // IB01 這類地下室編號視為 B1（樓層 0）
  const floor = m[2] ? 0 : Math.max(1, Number(m[3]));
  return { room: first, building, floor };
};

/** 建築出入口：在主步道上方的建築門口朝下，下方的朝上 */
export const doorOf = (b: CampusBuilding) => {
  const cx = b.x + b.w / 2;
  return b.y + b.h <= ROAD_Y ? { x: cx, y: b.y + b.h } : { x: cx, y: b.y };
};

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
  direction: '東' | '西' | '';
}

export const walkRoute = (from: RoomInfo, to: RoomInfo): WalkRoute => {
  if (from.building.code === to.building.code) {
    const verticalMinutes = Math.abs(from.floor - to.floor) * MIN_PER_FLOOR;
    const d = doorOf(from.building);
    return {
      from,
      to,
      meters: 40,
      verticalMinutes,
      minutes: Math.max(1, Math.ceil(40 / WALK_SPEED + verticalMinutes)),
      points: [d],
      direction: '',
    };
  }
  const a = doorOf(from.building);
  const b = doorOf(to.building);
  const units = Math.abs(a.y - ROAD_Y) + Math.abs(a.x - b.x) + Math.abs(b.y - ROAD_Y);
  const meters = Math.round((units * METERS_PER_UNIT) / 10) * 10;
  const verticalMinutes = (Math.abs(from.floor - 1) + Math.abs(to.floor - 1)) * MIN_PER_FLOOR;
  return {
    from,
    to,
    meters,
    verticalMinutes,
    minutes: Math.max(1, Math.ceil(meters / WALK_SPEED + verticalMinutes)),
    points: [a, { x: a.x, y: ROAD_Y }, { x: b.x, y: ROAD_Y }, b],
    direction: b.x > a.x ? '東' : b.x < a.x ? '西' : '',
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
  const items = courses.flatMap(course => slotsOf(course).map(slot => ({ course, slot })));
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
      const from = parseRoom(prev.slot.room || prev.course.room);
      const to = parseRoom(next.slot.room || next.course.room);
      const route = from && to ? walkRoute(from, to) : null;
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
