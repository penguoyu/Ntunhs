// 目前學期：課程資料為 115 學年度第 1 學期（學校代碼 1151）
export const SEMESTER_CODE = '115-1';
export const SEMESTER_LABEL = '115學年度 第1學期';

/** 選課階段（日期為示範值，請依教務處公告的選課時程調整） */
export const SELECTION_STAGES = [
  { name: '預選', period: '5/25–5/29' },
  { name: '初選登記', period: '6/8–6/12' },
  { name: '分發公告', period: '6/17' },
  { name: '加退選', period: '9/7–9/18' },
];

/** 目前所在階段（SELECTION_STAGES 的索引） */
export const CURRENT_STAGE = 1;
