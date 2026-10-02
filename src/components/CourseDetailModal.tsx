import React, { useState } from 'react';
import { Course } from '../types';

interface CourseDetailModalProps {
  course: Course;
  isInCart: boolean;
  isFavorite: boolean;
  onToggleCart: (courseId: string) => void;
  onToggleFavorite: (courseId: string) => void;
  onClose: () => void;
  onNavigateToGis?: (course: Course) => void;
  showToast: (msg: string) => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  isInCart,
  isFavorite,
  onToggleCart,
  onToggleFavorite,
  onClose,
  onNavigateToGis,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'grading' | 'prereq' | 'reviews'>('syllabus');

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${course.name} - 北護課程通`,
        text: `推薦 ${course.teacher} 的 ${course.code} ${course.name}，快來看看大綱與評價！`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(
        `【北護課程推薦】${course.name} (${course.code})\n授課: ${course.teacher}\n學分: ${course.credits}\n時段: ${course.timeStr}`
      );
      showToast('課程分享資訊已複製至剪貼簿！');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-surface w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-border-subtle animate-in slide-in-from-bottom duration-200">
        {/* Sticky Modal Top Bar */}
        <div className="px-5 pt-4 pb-3 bg-surface-card border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold text-xs uppercase tracking-wider">
              {course.id}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              {course.department.includes('護理') ? '護理學院 • 必修' : '資訊管理系 • 專業'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-primary active:scale-95 transition-all"
              aria-label="分享課程"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>
            <button
              onClick={() => onToggleFavorite(course.id)}
              className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-primary active:scale-95 transition-all"
              aria-label="收藏"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${isFavorite ? 'text-amber-500' : 'text-text-muted'}`}
                style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-text-muted hover:text-on-surface active:scale-95 transition-all"
              aria-label="關閉"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Hero Details Card */}
          <div className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-xl sm:text-2xl text-primary tracking-tight">
                  {course.name}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">{course.englishName}</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-primary font-bold text-2xl leading-none">{course.credits.toFixed(1)}</span>
                <span className="text-text-muted text-[11px] mt-0.5 font-semibold">學分 (週{course.credits}h)</span>
              </div>
            </div>

            {/* Instructor & Location Row */}
            <div className="mt-4 pt-3.5 bg-surface-container-low rounded-xl p-3.5 flex flex-col gap-2.5 border border-border-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">
                    {course.teacher.slice(0, 1)}
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-primary block">{course.teacher}</span>
                    <span className="text-[11px] text-text-muted">{course.teacherTitle || course.department}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-surface-card text-secondary font-bold text-xs shadow-xs">
                  {course.rating.toFixed(1)} ★ 歷年特優
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary pt-1 border-t border-border-subtle/60 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-text-muted text-[16px]">domain</span>
                  <span className="truncate">{course.location}</span>
                </div>
                <div className="flex items-center gap-1 text-primary font-bold">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>{course.timeStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Metric 1: Capacity Strain */}
            <div className="bg-surface-card rounded-xl p-3.5 flex flex-col justify-between shadow-xs border border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted font-semibold">即時餘額</span>
                <span className="w-2 h-2 rounded-full bg-conflict-danger animate-pulse"></span>
              </div>
              <div className="my-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-xl sm:text-2xl text-conflict-danger">
                    {course.capacity - course.enrolled}
                  </span>
                  <span className="text-[11px] text-text-muted">/ {course.capacity} 席</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className="bg-conflict-danger h-full rounded-full"
                    style={{ width: `${Math.min(100, (course.enrolled / course.capacity) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-[10px] text-conflict-danger font-bold">緊張度 96%</span>
            </div>

            {/* Metric 2: Grade Stats */}
            <div className="bg-surface-card rounded-xl p-3.5 flex flex-col justify-between shadow-xs border border-border-subtle">
              <span className="text-[11px] text-text-muted font-semibold">歷年平均</span>
              <div className="my-1.5">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-bold text-xl sm:text-2xl text-primary">{course.averageScore || 82.4}</span>
                  <span className="text-[11px] text-text-muted">分</span>
                </div>
                <p className="text-[11px] text-secondary font-bold mt-0.5">
                  當率 {course.passRate ? (100 - course.passRate).toFixed(1) : 3.2}%
                </p>
              </div>
              <span className="text-[10px] text-text-muted">溫和給分型</span>
            </div>

            {/* Metric 3: Student Ratings */}
            <div className="bg-surface-card rounded-xl p-3.5 flex flex-col justify-between shadow-xs border border-border-subtle">
              <span className="text-[11px] text-text-muted font-semibold">學生綜合評價</span>
              <div className="my-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-xl sm:text-2xl text-primary">{course.rating.toFixed(1)}</span>
                  <span className="text-amber-500 text-xs">★</span>
                </div>
                <div className="text-amber-500 text-[10px] mt-0.5">★★★★★</div>
              </div>
              <span className="text-[10px] text-text-muted">{course.ratingCount} 則評語</span>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'syllabus', label: '課程大綱與週次' },
              { id: 'grading', label: '成績評量標準' },
              { id: 'prereq', label: '先修與擋修規則' },
              { id: 'reviews', label: '學長姐修課心得' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-card text-text-secondary hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Syllabus */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div className="bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle">
                <div className="flex items-center gap-1.5 mb-1.5 text-primary font-bold text-xs sm:text-sm">
                  <span className="material-symbols-outlined text-[18px] text-clinical-purple">clinical_notes</span>
                  <span>教學核心目標與 OSCE 規劃</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {course.syllabus?.objectives || course.description}
                </p>
              </div>

              {/* Weekly Timeline */}
              <div className="bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs sm:text-sm text-primary">學期週次進度摘要</h4>
                  <span className="text-[11px] text-text-muted">共 18 週課程</span>
                </div>

                <div className="space-y-2.5">
                  {(course.syllabus?.weeks || [
                    { week: '1-4', tag: '核心學理', title: '臨床護理評估與急重症處置思維', desc: '心血管急症、心電圖判讀與緊急藥物實務。' },
                    { week: '5-8', tag: '模擬教學', title: '高階假人 (SimMan 3G) 重症跑台實作', desc: '人工氣道抽痰照護與胸腔水封引流管處置。' },
                    { week: '9', tag: '期中考核', title: '期中紙筆測驗與跨領域病歷研討', desc: '40題單選、2題護理計畫與團隊討論。' },
                    { week: '10+', tag: 'OSCE考評', title: '神經急重症與臨床全真 OSCE 總結評量', desc: 'GCS評估、急診插管應變綜合跑台測驗。' }
                  ]).map((w, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surface-container-low flex items-start gap-3 border border-border-subtle">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-text-muted">W</span>
                        <span className="font-bold text-xs leading-none">{w.week}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-1.5 py-0.2 rounded bg-primary-fixed text-primary text-[10px] font-bold">
                            {w.tag}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-on-surface truncate">{w.title}</h5>
                        <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{w.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Grading */}
          {activeTab === 'grading' && (
            <div className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border-subtle space-y-4 text-xs animate-in fade-in">
              <h4 className="font-bold text-xs sm:text-sm text-primary">成績評量佔比規劃</h4>

              <div className="space-y-3">
                {[
                  { item: '期末臨床技術考 (OSCE)', percent: 35, desc: '客觀結構式情境跑台與無菌侵入技術操作評量', color: 'bg-primary' },
                  { item: '期中筆試測驗', percent: 30, desc: '第 1 至 8 週心肺急重症學理單選與案例申論', color: 'bg-general-sky' },
                  { item: '平時案例分析與小組報告', percent: 25, desc: '護理個案概念圖擬定、臨床文獻實證研討 (EBN)', color: 'bg-secondary' },
                  { item: '課堂出席與隨堂小考', percent: 10, desc: '北護數位學院自主學習點名與隨機 Kahoot! 提問', color: 'bg-clinical-purple' },
                ].map((g, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-on-surface">{g.item}</span>
                      <span className="text-primary font-bold">{g.percent}%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div className={`${g.color} h-full rounded-full`} style={{ width: `${g.percent}%` }}></div>
                    </div>
                    <span className="text-[11px] text-text-muted mt-1 block">{g.desc}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2 text-text-secondary mt-2 border border-border-subtle">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">info</span>
                <span>注意：期末 OSCE 技術考成績未達 60 分者，須於學期末第 18 週統一參加臨床技術輔導補測。</span>
              </div>
            </div>
          )}

          {/* Tab 3: Prerequisites */}
          {activeTab === 'prereq' && (
            <div className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm border border-border-subtle space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-1.5 text-primary font-bold text-xs sm:text-sm">
                <span className="material-symbols-outlined text-[18px] text-general-sky">shield</span>
                <span>先修科目檢核狀態</span>
              </div>
              <p className="text-[11px] text-text-muted">
                系統已自動比對您在教務處修課歷史，您的擋修判定結果如下：
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">解剖生理學 (含實驗)</h5>
                      <span className="text-[11px] text-text-muted">112-1 • 必修 4.0 學分</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold text-[11px]">
                    已通過 (86分)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-on-surface">基本護理學及實習</h5>
                      <span className="text-[11px] text-text-muted">112-2 • 必修 5.0 學分</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold text-[11px]">
                    已通過 (89分)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary-container/30 flex items-center gap-2 text-on-secondary-container font-semibold mt-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
                <span>先修條件全部吻合，您具備本課程合法加選資格！</span>
              </div>
            </div>
          )}

          {/* Tab 4: Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-3 text-xs animate-in fade-in">
              <div className="bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center gap-5">
                <div className="text-center flex flex-col items-center">
                  <span className="font-bold text-3xl text-primary leading-none">{course.rating.toFixed(1)}</span>
                  <div className="flex text-amber-500 text-xs my-1">★★★★★</div>
                  <span className="text-[10px] text-text-muted">{course.ratingCount} 則評分</span>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 text-text-muted text-[11px]">
                  <div className="flex items-center gap-2">
                    <span>收穫程度</span>
                    <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <span className="font-bold text-primary">4.9</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>紮實程度</span>
                    <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '90%' }}></div>
                    </div>
                    <span className="font-bold text-primary">4.7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>甜度指數</span>
                    <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <span className="font-bold text-primary">4.2</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle space-y-3">
                {(course.syllabus?.reviews || [
                  { id: '1', author: '護理系大三 陳學姊', semester: '112-2', rating: 5, content: '老師上課超生動！用臨床案例把心電圖和氣道抽痰技巧講得非常透徹，技術考前務必在模擬病房多借假人練習。' },
                  { id: '2', author: '護理系大四 林學長', semester: '111-2', rating: 4, content: '大推！每週雖然有案例研討，但大三去醫院臨床實習時真的發現非常有幫助。' }
                ]).map(rev => (
                  <div key={rev.id} className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-on-surface">{rev.author}</span>
                      <span className="text-amber-500 text-xs">★★★★★</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{rev.semester} 修習</span>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{rev.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Textbook Card */}
          <div className="bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle">
            <h4 className="font-bold text-xs sm:text-sm text-primary mb-2.5">指定教材與參考文獻</h4>
            <div className="flex items-center gap-3">
              <div className="w-14 h-18 bg-surface-container rounded-lg overflow-hidden shrink-0 shadow-xs border border-border-subtle flex items-center justify-center relative">
                <img
                  alt="教科書封面"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDd6ngvTN1ezFh1VlzS94FFI8ie2w5Qt0sgJoG-Hh8FctBrtKX67GmBe4-JXt2Hu_jcOF3o0NFP9_2k8ZziFL8DtPsYsVCtMvTW7Y9O97DEMD23773MlGLPavitegRDQ7scSNAg4xyVL2-kMJUG9xs70JfvsSmC9uGbJws7gJ1jlWKX4lR6abi7oGfa8CmVDr6e7_22YB6AO5TPgOgl8exSZxHxXVB05xkUrt3nIx-vZFwHjWX5qdBg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="material-symbols-outlined text-primary text-[24px] absolute pointer-events-none">
                  menu_book
                </span>
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <h5 className="font-bold text-on-surface line-clamp-1">
                  {course.syllabus?.textbook?.title || "Brunner & Suddarth's Textbook of Medical-Surgical Nursing"}
                </h5>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {course.syllabus?.textbook?.edition || '15th Edition • Wolters Kluwer'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                    圖書館有紙本 4 冊
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold">
                    電子書在庫
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Simulation Center Lab Preview */}
          <div className="bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-text-muted">上課場域實景預覽</span>
              <span className="text-primary font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                學思樓臨床技能中心
              </span>
            </div>
            <div className="w-full h-36 rounded-xl overflow-hidden shadow-xs border border-border-subtle bg-surface-container flex items-center justify-center relative">
              <img
                alt="北護學思樓臨床技能中心實景"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr2nMcfE0kSxaD3MLyXFeiIOwVhA7YPRxmwMVuDXaUBQjxnmmVgi85GzL77fjLmwvb4BglaV2JW5pmpk9PtQ4DW_tGTqAXXmX6XMxSBYHWaSJDYOaYWcDHguNP7BT8ALEDJlXbLG_04tK7FGEa8wUj0KZM7xrZGpY4n-X_-m0y0pgkV54dulCxsk0rDzPStGHqv8ZMkX77O962zEomVAWzEZb9V-CZCJLSWGxcExK_xRpR1uocnDwO"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="material-symbols-outlined text-primary text-[32px] absolute pointer-events-none">
                domain
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Modal Bottom Action Bar */}
        <div className="p-4 bg-surface-card border-t border-border-subtle flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-secondary font-bold">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>衝堂即時預檢：與您目前課表完全無衝堂</span>
            </div>
            <span className="text-[11px] text-text-muted">時段空檔正常</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onToggleCart(course.id)}
              className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
                isInCart ? 'bg-secondary text-white' : 'bg-primary text-white hover:bg-primary-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isInCart ? 'check_circle' : 'add_circle'}
              </span>
              <span>{isInCart ? '已在模擬課表中 (點擊移出)' : '加入選課模擬車'}</span>
            </button>

            {onNavigateToGis && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToGis(course);
                }}
                className="px-4 py-3 rounded-xl bg-surface-container text-primary font-bold text-xs flex items-center justify-center hover:bg-surface-container-high transition-colors"
                title="查看教室 GIS 導航"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
