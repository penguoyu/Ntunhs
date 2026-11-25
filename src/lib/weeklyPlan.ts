import { Course, WeekProgress } from '../types';

/**
 * 每週進度（模擬）
 *
 * 學校公開的開課資料沒有週次進度，這裡依「課程簡介」裡列出的單元，
 * 加上課程類型（講授／實驗／實習／體育／專題）排出 18 週的進度表。
 * 同一門課每次產生的結果都一樣；正式版應改接教學大綱系統。
 */

export const TOTAL_WEEKS = 18;

type Kind = 'lecture' | 'lab' | 'practicum' | 'sport' | 'project' | 'service';

const kindOf = (c: Course): Kind => {
  const n = c.name;
  if (/體育|球|游泳|瑜珈|舞|太極|運動/.test(n) && c.category === '博雅通識') return 'sport';
  if (/實習/.test(n)) return 'practicum';
  if (/服務學習/.test(n)) return 'service';
  if (/專題|論文|畢業製作|研究/.test(n)) return 'project';
  if (/實驗|實作|演練|技術|技能|工作坊/.test(n)) return 'lab';
  return 'lecture';
};

const KIND_TEXT: Record<Kind, { tag: string; desc: string; mid: [string, string]; final: [string, string] }> = {
  lecture: {
    tag: '講授',
    desc: '主題講授、案例討論與課堂練習',
    mid: ['期中考', '第 1 至 8 週內容綜合評量'],
    final: ['期末考', '第 10 週以後內容綜合評量'],
  },
  lab: {
    tag: '實作',
    desc: '示範操作、分組練習與實驗紀錄',
    mid: ['期中技能考', '前半學期操作項目實測'],
    final: ['期末技能考', '綜合操作測驗與實驗報告繳交'],
  },
  practicum: {
    tag: '實習',
    desc: '機構實習、個案照護與每日反思紀錄',
    mid: ['期中評值', '實習指導老師與學生個別回饋'],
    final: ['期末評值', '個案報告、實習總結與心得分享'],
  },
  sport: {
    tag: '術科',
    desc: '暖身、分解動作教學與分組練習',
    mid: ['期中術科測驗', '基本動作檢測'],
    final: ['期末術科測驗', '綜合技能與比賽表現'],
  },
  project: {
    tag: '專題',
    desc: '進度報告、指導討論與資料整理',
    mid: ['期中進度審查', '研究計畫／專題雛形報告'],
    final: ['期末成果發表', '書面報告繳交與口頭發表'],
  },
  service: {
    tag: '服務',
    desc: '機構服務、服務紀錄與團體反思',
    mid: ['期中反思', '服務歷程分享與檢討'],
    final: ['成果分享', '服務成果發表與反思報告'],
  },
};

/** 沒抓到單元時，依課程類型與課名補上的通用主題 */
const fallbackTopics = (kind: Kind, core: string): string[] => {
  switch (kind) {
    case 'lab':
      return ['器材介紹與安全規範', `${core}基本操作`, `${core}進階操作與數據紀錄`, '綜合實作與結果分析'];
    case 'practicum':
      return ['實習環境與作業流程認識', '在指導下執行實務工作', '獨立執行與個案管理', '個案報告撰寫與討論'];
    case 'sport':
      return ['基本動作與體能訓練', '進階技巧練習', '規則介紹與分組練習', '分組比賽與戰術運用'];
    case 'project':
      return ['題目擬定與文獻搜尋', '研究方法與資料收集', '資料分析與進度報告', '成果整理與報告撰寫'];
    case 'service':
      return ['服務機構介紹與行前訓練', '服務機構實地服務', '服務歷程紀錄與反思', '服務成果整理'];
    default:
      return [`${core}導論與基本概念`, '重要理論與模式', `${core}的實務應用`, '案例分析與分組討論', '相關法規與倫理議題', '最新發展與研究趨勢'];
  }
};

/** 「體育-籃球1」「內科護理學(二)」→ 籃球、內科護理學 */
const coreName = (name: string) =>
  name
    .replace(/^.*-/, '')
    .replace(/[（(][^)）]*[)）]/g, '')
    .replace(/[一二三四五六七八九十\dIVX]+$/, '')
    .trim() || name;

const KEYWORD = /(?:包括|包含|涵蓋|內容(?:為|有)|主題(?:為|有)?|單元(?:為|有)?|介紹|論述)\s*[：:]?\s*/;

const clean = (s: string) => {
  let t = s.trim();
  if (/\s/.test(t)) t = t.split(/\s+/)[0];
  return t
    .replace(new RegExp(`^${KEYWORD.source}`), '')
    .replace(/^[\d一二三四五六七八九十()（）.、]+/, '')
    .replace(/^(以及|及|和|與|還有|並|另外|其次為?|首先為?|最後為?|此外|再者|以)/, '')
    .replace(/等(?:等|知識|內容|議題|課題|主題|技能|項目)?$/, '')
    .replace(/[「」『』"“”]/g, '')
    .trim();
};

/** 看起來像句子而不是單元名稱的片段 */
const SENTENCE = /本課程|學生|期望|使學|讓學|如何|透過|藉由|能夠|足以|以明白|進而|培養|協助|了解|瞭解/;

/** 從課程簡介取出列舉的單元，例如「內容包括：A、B、C 以及 D 等。」 */
export const extractTopics = (description: string): string[] => {
  const text = description.replace(/\s*\n\s*/g, '');
  const topics: string[] = [];
  const re = new RegExp(`${KEYWORD.source}([^。；;]+)`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    // 「涵蓋六大主題，包括：A、B」→ 從最後一個關鍵字後面開始取
    let list = m[1];
    const inner = /(?:包括|包含|涵蓋)\s*[：:]\s*/g;
    let last: RegExpExecArray | null;
    let cut = -1;
    while ((last = inner.exec(list))) cut = last.index + last[0].length;
    if (cut >= 0) list = list.slice(cut);
    const parts = list
      .split(/[、，,]|以及/)
      .map(clean)
      .filter(p => p.length >= 3 && p.length <= 22 && !SENTENCE.test(p));
    if (parts.length >= 2) topics.push(...parts);
  }
  return Array.from(new Set(topics)).slice(0, 10);
};

const range = (a: number, b: number) => (a === b ? `${a}` : `${a}-${b}`);

/** 把主題平均分配到可用週次，回傳 [週次, 主題] */
const spread = (weeks: number[], topics: string[]) => {
  const out: { from: number; to: number; topic: string }[] = [];
  const n = Math.min(topics.length, weeks.length);
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i * weeks.length) / n);
    const b = Math.floor(((i + 1) * weeks.length) / n) - 1;
    out.push({ from: weeks[a], to: weeks[b], topic: topics[i] });
  }
  return out;
};

/** 是否從課程簡介抓到單元（false 表示用通用主題） */
export const hasExtractedTopics = (course: Course) => extractTopics(course.description || '').length >= 3;

export const weeklyPlanOf = (course: Course): WeekProgress[] => {
  if (course.syllabus?.weeks?.length) return course.syllabus.weeks;
  const kind = kindOf(course);
  const t = KIND_TEXT[kind];
  const found = extractTopics(course.description || '');
  const topics = found.length >= 3 ? found : fallbackTopics(kind, coreName(course.name));

  const firstHalf = [2, 3, 4, 5, 6, 7, 8];
  const secondHalf = [10, 11, 12, 13, 14, 15, 16];
  const splitAt = Math.ceil(topics.length / 2);
  const rows: WeekProgress[] = [
    {
      week: '1',
      tag: '課程介紹',
      title: '課程說明與評量方式',
      desc: kind === 'practicum' ? '實習單位分配、行前說明與注意事項' : '介紹課程目標、上課方式、評分標準與分組',
    },
    ...spread(firstHalf, topics.slice(0, splitAt)).map(s => ({ week: range(s.from, s.to), tag: t.tag, title: s.topic, desc: '' })),
    { week: '9', tag: '期中', title: t.mid[0], desc: t.mid[1] },
    ...spread(secondHalf, topics.slice(splitAt)).map(s => ({ week: range(s.from, s.to), tag: t.tag, title: s.topic, desc: '' })),
    { week: '17', tag: '複習', title: kind === 'project' ? '成果修正與發表準備' : '總複習與綜合討論', desc: '整理學期重點、回答問題' },
    { week: '18', tag: '期末', title: t.final[0], desc: t.final[1] },
  ];
  return rows;
};

/* ------------------------------------------------------------------ */
/* 週次表（仿學校教學大綱「週次／上課日期」表格，模擬）                    */
/* ------------------------------------------------------------------ */

/** 115-1 第 1 週的星期一（學校行事曆 115/09/07 開學） */
export const SEMESTER_WEEK1_MONDAY = new Date(2026, 8, 7);

const ACTIVITIES: Record<Kind, string[]> = {
  lecture: ['講授與課堂討論', '講授＋隨堂練習', '案例分析與小組討論', '講授＋課後作業'],
  lab: ['示範操作與分組實作', '分組實作＋實驗紀錄', '操作練習與結果討論', '實作＋繳交實驗報告'],
  practicum: ['機構實習＋每日反思', '個案照護與指導討論', '機構實習＋讀書報告', '個案討論會'],
  sport: ['暖身、分解動作教學', '分組練習', '技巧練習與分組對抗', '體能訓練＋分組練習'],
  project: ['指導討論與進度報告', '資料收集與整理', '小組討論＋進度報告', '撰寫報告與修正'],
  service: ['行前訓練與說明', '機構服務', '機構服務＋服務紀錄', '團體反思討論'],
};

export interface WeekRow {
  week: number;
  /** 例如 115/09/08(二) */
  date: string;
  progress: string;
  content: string;
  tag: string;
  hours: number;
  /** 例如 W2:1~2 */
  periods: string;
  note: string;
}

const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const DAY_CN = ['一', '二', '三', '四', '五', '六', '日'];
const nth = (i: number) => CN_NUM[i] ?? String(i + 1);
const pad = (n: number) => String(n).padStart(2, '0');

const rocDate = (d: Date) => `${d.getFullYear() - 1911}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

/** 把「3-4」這種週次範圍展開成每一週 */
const weeksOf = (w: string) => {
  const [a, b] = w.split('-').map(Number);
  return Array.from({ length: (b || a) - a + 1 }, (_, i) => a + i);
};

/** 一門課 18 週的週次表（日期、進度、內容、時數／節次、備註） */
export const weeklyRowsOf = (course: Course): WeekRow[] => {
  const kind = kindOf(course);
  const acts = ACTIVITIES[kind];
  const slots = [
    ...(course.day && course.periods?.length ? [{ day: course.day, periods: course.periods }] : []),
    ...(course.extraSlots ?? []),
  ];
  const hours = slots.reduce((sum, s) => sum + s.periods.length, 0);
  const periods = slots
    .map(s => {
      const ps = [...s.periods].sort((x, y) => x - y);
      return `W${s.day}:${ps[0]}~${ps[ps.length - 1]}`;
    })
    .join('、');
  const firstDay = slots[0]?.day ?? 1;

  const rows: WeekRow[] = [];
  let topicIndex = 0;
  for (const plan of weeklyPlanOf(course)) {
    const ws = weeksOf(plan.week);
    const isTopic = plan.desc === '';
    ws.forEach((week, i) => {
      const date = new Date(SEMESTER_WEEK1_MONDAY);
      date.setDate(date.getDate() + (week - 1) * 7 + (firstDay - 1));
      const part = ws.length > 1 ? `（${nth(i)}）` : '';
      const activity = acts[(topicIndex + i) % acts.length];
      rows.push({
        week,
        date: `${rocDate(date)}(${DAY_CN[firstDay - 1]})`,
        progress: `${plan.title}${part}`,
        content: isTopic ? activity : plan.desc,
        tag: plan.tag,
        hours,
        periods,
        note: week <= 2 ? '加退選期間' : plan.tag === '期中' ? '期中考週' : plan.tag === '期末' ? '期末考週' : '',
      });
    });
    if (isTopic) topicIndex += ws.length;
  }
  return rows;
};

export const weekLabel = (n: number) => (n <= 10 ? nth(n - 1) : n < 20 ? `十${nth(n - 11)}` : String(n));
