import React from 'react';
import { Course } from '../types';

interface AdminAnalyticsProps {
  courses: Course[];
  onViewCourseDetail: (course: Course) => void;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  courses,
  onViewCourseDetail,
}) => {
  const totalCourses = courses.length;
  const totalCapacity = courses.reduce((sum, c) => sum + c.capacity, 0);
  const totalEnrolled = courses.reduce((sum, c) => sum + c.enrolled, 0);
  const overallRate = Math.round((totalEnrolled / totalCapacity) * 100);

  // Top 8 highest demand courses (most filled)
  const topDemandCourses = [...courses]
    .sort((a, b) => (b.enrolled / b.capacity) - (a.enrolled / a.capacity))
    .slice(0, 8);

  // Group by college
  const colleges = ['健康科技學院', '護理學院', '人類發展與健康學院', '通識中心'] as const;
  const collegeStats = colleges.map(col => {
    const list = courses.filter(c => c.college === col);
    const colCapacity = list.reduce((s, c) => s + c.capacity, 0);
    const colEnrolled = list.reduce((s, c) => s + c.enrolled, 0);
    return {
      college: col,
      count: list.length,
      capacity: colCapacity,
      enrolled: colEnrolled,
      rate: colCapacity > 0 ? Math.round((colEnrolled / colCapacity) * 100) : 0,
    };
  });

  return (
    <div className="flex flex-col w-full max-w-[1680px] mx-auto pb-16">
      {/* Top Banner */}
      <section className="w-full bg-surface-card shadow-xs px-4 sm:px-6 py-4 sm:py-5 mb-6 rounded-2xl border border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 text-xs font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">monitoring</span>
            <span>校務選課大數據</span>
          </span>
          <span className="text-text-muted text-xs">•</span>
          <span className="text-xs text-text-muted">即時模擬選課監控儀表板</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-tight mt-1">
          選課需求與容量監控分析 (Analytics & Capacity Optimization)
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          監控全校 4 大學院開課飽和度、熱門排隊科目與教室資源負載
        </p>
      </section>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between text-text-muted text-xs font-semibold">
            <span>開課總量</span>
            <span className="material-symbols-outlined text-[20px] text-primary">menu_book</span>
          </div>
          <div className="text-2xl font-bold text-primary mt-2">{totalCourses} 門</div>
          <div className="text-[11px] text-text-muted mt-1">跨 10 系所及通識中心</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between text-text-muted text-xs font-semibold">
            <span>總核定開課名額</span>
            <span className="material-symbols-outlined text-[20px] text-secondary">chair_alt</span>
          </div>
          <div className="text-2xl font-bold text-secondary mt-2">{totalCapacity.toLocaleString()} 席</div>
          <div className="text-[11px] text-text-muted mt-1">教室容納上限基準</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between text-text-muted text-xs font-semibold">
            <span>模擬中選人次</span>
            <span className="material-symbols-outlined text-[20px] text-amber-600">group_add</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{totalEnrolled.toLocaleString()} 人</div>
          <div className="text-[11px] text-text-muted mt-1">第一階段志願模擬投標</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-xs">
          <div className="flex items-center justify-between text-text-muted text-xs font-semibold">
            <span>平均滿額率</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-600">speed</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{overallRate}%</div>
          <div className="text-[11px] text-text-muted mt-1">全校容量供需平衡良好</div>
        </div>
      </div>

      {/* College Breakdown & Hot Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* College Capacity Progress Bars */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-xs border border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
              <span>各學院開課規模與填補率</span>
            </h3>
            <span className="text-xs text-text-muted">113-2 學期</span>
          </div>

          <div className="space-y-4">
            {collegeStats.map(c => (
              <div key={c.college} className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="font-bold text-on-surface flex items-center gap-2">
                    <span>{c.college}</span>
                    <span className="text-text-muted font-normal">({c.count} 門課程)</span>
                  </div>
                  <div className="font-mono font-bold text-primary">
                    {c.enrolled} / {c.capacity} 席 ({c.rate}%)
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      c.rate >= 90 ? 'bg-rose-500' : c.rate >= 75 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${c.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Demanded Courses */}
        <div className="bg-surface-card rounded-2xl p-5 shadow-xs border border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-tertiary">local_fire_department</span>
              <span>熱門爆滿排行（建議開課組評估加開班次）</span>
            </h3>
            <span className="text-xs text-text-muted">預選熱度 TOP 8</span>
          </div>

          <div className="space-y-2">
            {topDemandCourses.map((c, i) => {
              const fill = Math.round((c.enrolled / c.capacity) * 100);
              return (
                <div
                  key={c.id}
                  onClick={() => onViewCourseDetail(c)}
                  className="p-2.5 rounded-xl hover:bg-surface-container-low border border-transparent hover:border-border-subtle flex items-center justify-between text-xs cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      i < 3 ? 'bg-tertiary text-white' : 'bg-surface-container text-text-muted'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 truncate">
                      <div className="font-bold text-on-surface truncate">{c.name}</div>
                      <div className="text-[11px] text-text-muted truncate">
                        {c.teacher} • {c.department}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                      fill >= 100
                        ? 'bg-rose-100 text-rose-800'
                        : fill >= 85
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {c.enrolled}/{c.capacity} ({fill}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
