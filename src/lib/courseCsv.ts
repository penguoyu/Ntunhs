import { Course, CourseSlot } from '../types';
import { DAY_LABELS } from './schedule';

/** 解析 CSV 文字（支援 UTF-8 BOM、雙引號欄位、欄位內換行與逗號） */
export const parseCsv = (text: string): string[][] => {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter(r => r.some(c => c.trim() !== ''));
};

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** 欄位名稱（中英文皆可）→ Course 欄位 */
const HEADER_ALIASES: Record<string, string> = {
  id: 'id', 課程代碼: 'id', 科目代號: 'id',
  code: 'code', 課號: 'code',
  name: 'name', 課程名稱: 'name', 科目名稱: 'name',
  englishname: 'englishName', 英文名稱: 'englishName',
  credits: 'credits', 學分: 'credits', 學分數: 'credits',
  category: 'category', 類別: 'category', 修別: 'category', 課別: 'category',
  college: 'college', 學院: 'college',
  department: 'department', 系所: 'department', 開課系所: 'department',
  teacher: 'teacher', 授課教師: 'teacher', 教師: 'teacher', 教師姓名: 'teacher',
  day: 'day', 星期: 'day',
  periods: 'periods', 節次: 'periods',
  timestr: 'timeStr', 時間時段: 'timeStr', 上課時間: 'timeStr',
  room: 'room', 教室: 'room', 上課教室: 'room', 地點: 'room',
  location: 'location',
  enrolled: 'enrolled', 已選人數: 'enrolled', 上課人數: 'enrolled',
  capacity: 'capacity', 容量上限: 'capacity', 人數上限: 'capacity', 名額: 'capacity',
  isemi: 'isEMI', emi: 'isEMI', 全英語授課: 'isEMI',
  description: 'description', 課程簡介: 'description',
  extraslots: 'extraSlots', 其他時段: 'extraSlots',
  note: 'note', 備註: 'note', 課表備註: 'note',
  program: 'program', 學制: 'program',
  classname: 'className', 開課班級: 'className', 班級: 'className',
  grade: 'grade', 年級: 'grade',
};

const parseDay = (v: string): number | undefined => {
  const t = v.trim().replace(/^週|^星期/, '');
  if (!t) return undefined;
  const n = Number(t);
  if (n >= 1 && n <= 7) return n;
  const idx = DAY_LABELS.indexOf(t[0] === '天' ? '日' : t[0]);
  return idx >= 0 ? idx + 1 : undefined;
};

const parsePeriods = (v: string): number[] | undefined => {
  const t = v.replace(/[第節\s]/g, '');
  if (!t) return undefined;
  const range = /^(\d+)[-~～至到](\d+)$/.exec(t);
  if (range) {
    const [a, b] = [Number(range[1]), Number(range[2])];
    return a <= b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : undefined;
  }
  const list = t.split(/[,，、]/).map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 14);
  return list.length ? list : undefined;
};

/** 從「週二 第 3-4 節」這類文字取出星期與節次 */
const parseTimeStr = (v: string) => {
  const m = /週([一二三四五六日])\s*(?:第\s*)?(\d+)(?:\s*[-~～]\s*(\d+))?/.exec(v);
  if (!m) return {};
  const day = DAY_LABELS.indexOf(m[1]) + 1;
  const a = Number(m[2]);
  const b = m[3] ? Number(m[3]) : a;
  return { day, periods: Array.from({ length: b - a + 1 }, (_, i) => a + i) };
};

/** 「四 1-2 F301；五 3-4 F302」→ 多個時段 */
const parseExtraSlots = (v: string): CourseSlot[] =>
  v
    .split(/[；;]/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [d, p, ...room] = part.split(/\s+/);
      const day = parseDay(d ?? '');
      const periods = parsePeriods(p ?? '');
      return day && periods ? { day, periods, room: room.join(' ') } : null;
    })
    .filter((x): x is CourseSlot => !!x);

const truthy = (v: string) => /^(1|true|是|y|yes|v|✓)$/i.test(v.trim());

/**
 * CSV → 課程物件（尚未補齊預設值，交給匯入頁的 normalize 處理）。
 * 第一列必須是欄位名稱；至少要有課程代碼、課程名稱、授課教師。
 */
export const csvToCourseObjects = (text: string): { items: Record<string, unknown>[]; unknownHeaders: string[] } => {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('CSV 至少需要一列欄位名稱和一筆課程資料');
  const headers = rows[0].map(h => h.trim());
  const keys = headers.map(h => HEADER_ALIASES[h] ?? HEADER_ALIASES[h.toLowerCase()]);
  const unknownHeaders = headers.filter((h, i) => h && !keys[i]);
  for (const need of ['id', 'name', 'teacher']) {
    if (!keys.includes(need)) {
      const label = need === 'id' ? '課程代碼' : need === 'name' ? '課程名稱' : '授課教師';
      throw new Error(`CSV 缺少「${label}」欄位`);
    }
  }
  const items = rows.slice(1).map(cells => {
    const raw: Record<string, string> = {};
    keys.forEach((k, i) => {
      if (k) raw[k] = (cells[i] ?? '').trim();
    });
    const item: Record<string, unknown> = { ...raw };
    const fromTime = raw.timeStr ? parseTimeStr(raw.timeStr) : {};
    const day = raw.day ? parseDay(raw.day) : fromTime.day;
    const periods = raw.periods ? parsePeriods(raw.periods) : fromTime.periods;
    if (day) item.day = day;
    else delete item.day;
    if (periods) item.periods = periods;
    else delete item.periods;
    const roomText = raw.room || raw.location || '';
    const room = /[A-Z]B?\d{3,}/i.exec(roomText)?.[0]?.toUpperCase();
    if (room) {
      item.room = room;
      item.building = `${room[0]} 棟`;
    }
    if (roomText) item.location = roomText;
    if (raw.isEMI !== undefined) item.isEMI = truthy(raw.isEMI);
    if (raw.extraSlots) {
      const extra = parseExtraSlots(raw.extraSlots);
      if (extra.length) item.extraSlots = extra;
      else delete item.extraSlots;
    } else delete item.extraSlots;
    for (const n of ['credits', 'enrolled', 'capacity'] as const) {
      if (raw[n] !== undefined && raw[n] !== '') item[n] = Number(raw[n]);
    }
    if (day && periods && !raw.timeStr) {
      item.timeStr = `週${DAY_LABELS[day - 1]} 第 ${Math.min(...periods)}-${Math.max(...periods)} 節`;
    }
    return item;
  });
  return { items, unknownHeaders };
};

const periodsText = (periods?: number[]) => {
  if (!periods?.length) return '';
  const ps = [...periods].sort((a, b) => a - b);
  const contiguous = ps.every((p, i) => i === 0 || p === ps[i - 1] + 1);
  return ps.length > 1 && contiguous ? `${ps[0]}-${ps[ps.length - 1]}` : ps.join(',');
};

/** 匯出 CSV（欄位與匯入相容，可直接再匯入） */
export const coursesToCsv = (courses: Course[]): string => {
  const headers = ['課程代碼', '課號', '課程名稱', '英文名稱', '學分', '類別', '學院', '系所', '學制', '開課班級', '年級', '授課教師', '星期', '節次', '上課教室', '其他時段', '時間時段', '已選人數', '容量上限', '全英語授課', '備註'];
  const rows = courses.map(c => [
    c.id,
    c.code,
    c.name,
    c.englishName,
    c.credits,
    c.category,
    c.college,
    c.department,
    c.program,
    c.className,
    c.grade,
    c.teacher,
    c.day ? DAY_LABELS[c.day - 1] : '',
    periodsText(c.periods),
    c.room || c.location,
    (c.extraSlots ?? []).map(x => `${DAY_LABELS[x.day - 1]} ${periodsText(x.periods)} ${x.room}`.trim()).join('；'),
    c.timeStr,
    c.enrolled,
    c.capacity,
    c.isEMI ? '是' : '',
    c.note,
  ]);
  return '﻿' + [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
};

export const SAMPLE_CSV = [
  '課程代碼,課程名稱,授課教師,學分,類別,系所,星期,節次,上課教室,容量上限,已選人數',
  'IM9001,智慧醫療資料視覺化,王小明,3,專業選修,資訊管理系,二,2-4,G303,45,12',
  'NUR9002,"長期照護實務（含社區見習）",李美華,2,專業選修,護理系,四,6-7,F408,40,40',
  'GE9003,健康生活與永續,陳大同,2,博雅通識,通識教育中心,五,3-4,B216,60,31',
].join('\n');
