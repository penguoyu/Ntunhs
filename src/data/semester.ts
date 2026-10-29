// 目前學期：學號 111 入學、四技三年級，課號前綴 1132 即 113 學年度第 2 學期
export const SEMESTER_CODE = '113-2';
export const SEMESTER_LABEL = '113學年度 第2學期';

/** 選課階段（日期為示範值，請依教務處公告的選課時程調整） */
export const SELECTION_STAGES = [
  { name: '預選', period: '12/23–12/27' },
  { name: '初選登記', period: '1/6–1/10' },
  { name: '分發公告', period: '1/14' },
  { name: '加退選', period: '2/17–2/28' },
];

/** 目前所在階段（SELECTION_STAGES 的索引） */
export const CURRENT_STAGE = 1;
