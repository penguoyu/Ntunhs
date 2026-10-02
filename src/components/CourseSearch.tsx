import React, { useState, useMemo } from 'react';
import { Course, StudentProfile } from '../types';

interface CourseSearchProps {
  courses: Course[];
  cart: string[];
  favorites: string[];
  onToggleCart: (courseId: string) => void;
  onToggleFavorite: (courseId: string) => void;
  onViewCourseDetail: (course: Course) => void;
  onNavigateToGis: (course: Course) => void;
  onGoToSimulation: () => void;
  student: StudentProfile;
  totalCredits: number;
}

export const CourseSearch: React.FC<CourseSearchProps> = ({
  courses,
  cart,
  favorites,
  onToggleCart,
  onToggleFavorite,
  onViewCourseDetail,
  onNavigateToGis,
  onGoToSimulation,
  student,
  totalCredits,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState('全部');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<string[]>([
    'IM', 'HA', 'SLP', 'NUR', 'LTC', 'NMW', 'DPC', 'EX', 'IEC', 'GE'
  ]);
  const [sortBy, setSortBy] = useState('recommend');
  const [prereqOnly, setPrereqOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<{ [key: string]: boolean }>({
    '2-2': true,
    '2-3': true,
    '2-4': true,
    '3-5': true,
    '3-6': true,
    '4-5': true,
    '4-6': true,
  });

  const hotSearches = [
    '醫療資訊系統',
    '生成式AI',
    'HL7/FHIR跨域實務',
    '醫療人工智慧',
    '悲傷輔導',
    '心臟救命術ACLS',
    '內外科護理學',
    '吞嚥復健',
    '正念減壓',
    '溫柔生產',
    '運動傷害貼紮',
    '當代醫學與藝術療癒',
  ];

  const quickFilters = [
    '全部',
    '必修課',
    '資訊科技',
    '護理專業',
    '健管長照',
    '身心療癒',
    '復健聽語',
    '博雅通識',
    '不衝堂優先',
    'EMI全英語授課',
    '有餘額',
  ];

  const deptCounts = useMemo(() => {
    return {
      IM: courses.filter(c => c.department.includes('資訊管理')).length,
      HA: courses.filter(c => c.department.includes('健康事業')).length,
      SLP: courses.filter(c => c.department.includes('語言') || c.department.includes('聽力')).length,
      NUR: courses.filter(c => c.department.includes('護理')).length,
      LTC: courses.filter(c => c.department.includes('高齡')).length,
      NMW: courses.filter(c => c.department.includes('助產')).length,
      DPC: courses.filter(c => c.department.includes('生死')).length,
      EX: courses.filter(c => c.department.includes('運動保健')).length,
      IEC: courses.filter(c => c.department.includes('嬰幼兒')).length,
      GE: courses.filter(c => c.college === '通識中心').length,
      healthTechCollege: courses.filter(c => c.college === '健康科技學院').length,
      nursingCollege: courses.filter(c => c.college === '護理學院').length,
      humanDevCollege: courses.filter(c => c.college === '人類發展與健康學院').length,
      generalCenter: courses.filter(c => c.college === '通識中心').length,
    };
  }, [courses]);

  const toggleSlot = (key: string) => {
    setSelectedSlots(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const clearSlots = () => {
    setSelectedSlots({});
  };

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // Query search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = course.name.toLowerCase().includes(q);
        const matchCode = course.code.toLowerCase().includes(q) || course.id.toLowerCase().includes(q);
        const matchTeacher = course.teacher.toLowerCase().includes(q);
        const matchDesc = course.description.toLowerCase().includes(q);
        const matchTags = course.tags.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchCode && !matchTeacher && !matchDesc && !matchTags) {
          return false;
        }
      }

      // Quick filter
      if (selectedQuickFilter === '必修課' && !course.category.includes('必修')) {
        return false;
      }
      if (selectedQuickFilter === '資訊科技' && !course.department.includes('資訊管理')) {
        return false;
      }
      if (selectedQuickFilter === '護理專業' && !course.department.includes('護理') && !course.department.includes('助產')) {
        return false;
      }
      if (selectedQuickFilter === '健管長照' && !course.department.includes('健康事業') && !course.department.includes('高齡')) {
        return false;
      }
      if (selectedQuickFilter === '身心療癒' && !course.department.includes('生死') && !course.tags.some(t => t.includes('療癒') || t.includes('正念') || t.includes('諮商') || t.includes('陪伴'))) {
        return false;
      }
      if (selectedQuickFilter === '復健聽語' && !course.department.includes('語言') && !course.department.includes('聽力') && !course.department.includes('運動保健')) {
        return false;
      }
      if (selectedQuickFilter === '博雅通識' && course.category !== '博雅通識') {
        return false;
      }
      if (selectedQuickFilter === 'EMI全英語授課' && !course.isEMI) {
        return false;
      }
      if (selectedQuickFilter === '有餘額' && course.enrolled >= course.capacity) {
        return false;
      }

      // Checkbox college filter
      if (selectedCollege.length > 0) {
        const isIM = course.department.includes('資訊管理') && selectedCollege.includes('IM');
        const isHA = course.department.includes('健康事業') && selectedCollege.includes('HA');
        const isSLP = (course.department.includes('語言') || course.department.includes('聽力')) && selectedCollege.includes('SLP');
        const isNUR = course.department.includes('護理') && selectedCollege.includes('NUR');
        const isLTC = course.department.includes('高齡') && selectedCollege.includes('LTC');
        const isNMW = course.department.includes('助產') && selectedCollege.includes('NMW');
        const isDPC = course.department.includes('生死') && selectedCollege.includes('DPC');
        const isEX = course.department.includes('運動保健') && selectedCollege.includes('EX');
        const isIEC = course.department.includes('嬰幼兒') && selectedCollege.includes('IEC');
        const isGeneral = course.college === '通識中心' && selectedCollege.includes('GE');
        if (!isIM && !isHA && !isSLP && !isNUR && !isLTC && !isNMW && !isDPC && !isEX && !isIEC && !isGeneral) {
          return false;
        }
      }

      // Prereq filter
      if (prereqOnly && course.prerequisitePassed === false) {
        return false;
      }

      // Available seats filter
      if (availableOnly && course.enrolled >= course.capacity) {
        return false;
      }

      return true;
    });
  }, [courses, searchQuery, selectedQuickFilter, selectedCollege, prereqOnly, availableOnly]);

  return (
    <div className="flex flex-col w-full max-w-[1680px] mx-auto pb-16">
      {/* Top Banner on Desktop */}
      <section className="w-full bg-surface-card shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] px-4 sm:px-6 xl:px-10 py-5 mb-6 rounded-2xl border border-border-subtle">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>{student.department}</span>
              </div>
              <span className="text-border-strong text-xs">•</span>
              <div className="flex items-center gap-1.5 text-secondary text-xs font-semibold">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>已套用個人身分智慧規則（自動排除已修過課程與原班衝堂節次）</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-text-muted text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                課務資料庫即時同步中
              </span>
              <span className="text-border-strong">•</span>
              <span className="font-medium text-primary">選課階段：第 1 階段線上初選模擬</span>
            </div>
          </div>

          {/* Search Bar Input Container */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[22px]">
                search
              </span>
              <input
                id="course-search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜尋課名、授課教師、開課代碼（例如 IM3012）、或關鍵字：醫療資訊、FHIR、Python、智慧護理..."
                className="w-full h-12 pl-12 pr-12 rounded-xl bg-surface-bg text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-inner text-sm transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              ) : (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setSearchQuery('醫療資訊')}
                    className="p-1.5 rounded-full hover:bg-surface-container text-text-muted hover:text-primary transition-colors"
                    title="語音輸入"
                  >
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  </button>
                  <button
                    onClick={() => setSearchQuery('IM3012')}
                    className="p-1.5 rounded-full hover:bg-surface-container text-text-muted hover:text-primary transition-colors"
                    title="條碼掃描"
                  >
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                className={`flex-1 md:flex-initial h-12 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                  isAdvancedFilterOpen
                    ? 'bg-primary text-white'
                    : 'bg-surface-container hover:bg-surface-container-high text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>{isAdvancedFilterOpen ? '收合條件' : '進階檢索'}</span>
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedQuickFilter('全部');
                  clearSlots();
                }}
                className="h-12 px-4 rounded-xl bg-surface-container text-primary text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span className="hidden sm:inline">重置條件</span>
              </button>
            </div>
          </div>

          {/* Hot Search Queries Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-text-muted text-xs font-semibold shrink-0 flex items-center gap-1">
              <span
                className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              熱搜：
            </span>
            {hotSearches.map(term => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs hover:bg-surface-container-high transition-colors shrink-0"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Quick Filter Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {quickFilters.map(filter => {
              const active = selectedQuickFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedQuickFilter(filter)}
                  className={`filter-pill shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center gap-1 ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-card text-text-secondary hover:text-primary hover:bg-surface-container'
                  }`}
                >
                  {filter === '不衝堂優先' && (
                    <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
                  )}
                  {filter === 'EMI全英語授課' && (
                    <span className="material-symbols-outlined text-[15px] text-general-sky">translate</span>
                  )}
                  {filter === '有餘額' && (
                    <span className="material-symbols-outlined text-[15px] text-secondary">event_available</span>
                  )}
                  <span>{filter}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Grid: Sidebar Filters + Course Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
        {/* Left Side: Advanced Multidimensional Filter Drawer/Accordion */}
        <aside
          className={`flex flex-col gap-5 bg-surface-card p-5 rounded-2xl shadow-sm border border-border-subtle ${
            isAdvancedFilterOpen ? 'block' : 'hidden xl:flex'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-primary font-bold text-base">
              <span className="material-symbols-outlined text-[20px]">filter_alt</span>
              <span>多維度智慧篩選</span>
            </div>
            <span className="text-[11px] font-bold text-secondary bg-secondary-fixed/20 px-2 py-0.5 rounded-md">
              8 條件啟用
            </span>
          </div>

          {/* Department Tree Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface">開課學制與系所</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCollege(['IM', 'HA', 'SLP', 'NUR', 'LTC', 'NMW', 'DPC', 'EX', 'IEC', 'GE'])}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  全選
                </button>
                <span className="text-border-subtle text-[11px]">|</span>
                <button
                  onClick={() => setSelectedCollege([])}
                  className="text-[11px] text-text-muted hover:underline font-semibold"
                >
                  重設
                </button>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {/* College 1: 健康科技學院 */}
              <div className="rounded-xl bg-surface-container-low p-2">
                <div className="flex items-center justify-between px-1 py-0.5 text-primary font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                    健康科技學院
                  </span>
                  <span className="text-[11px] text-text-muted">{deptCounts.healthTechCollege} 門</span>
                </div>
                <div className="pl-3 space-y-1 mt-1">
                  <label className="flex items-center justify-between px-2 py-1 rounded bg-surface-card shadow-xs cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('IM')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('IM') ? prev.filter(x => x !== 'IM') : [...prev, 'IM']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span className="font-semibold text-primary">資訊管理系 (IM)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.IM}</span>
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('HA')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('HA') ? prev.filter(x => x !== 'HA') : [...prev, 'HA']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span>健康事業管理系 (HA)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.HA}</span>
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('SLP')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('SLP') ? prev.filter(x => x !== 'SLP') : [...prev, 'SLP']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span>語言治療與聽力 (SLPA)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.SLP}</span>
                  </label>
                </div>
              </div>

              {/* College 2: 護理學院 */}
              <div className="rounded-xl bg-surface-container-low p-2">
                <div className="flex items-center justify-between px-1 py-0.5 text-on-surface font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">domain</span>
                    護理學院
                  </span>
                  <span className="text-[11px] text-text-muted">{deptCounts.nursingCollege} 門</span>
                </div>
                <div className="pl-3 space-y-1 mt-1">
                  <label className="flex items-center justify-between px-2 py-1 rounded bg-surface-card shadow-xs cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('NUR')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('NUR') ? prev.filter(x => x !== 'NUR') : [...prev, 'NUR']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span className="font-semibold">護理系 (NUR) 跨域開放</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.NUR}</span>
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('LTC')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('LTC') ? prev.filter(x => x !== 'LTC') : [...prev, 'LTC']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span>高齡健康照護系 (LTC)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.LTC}</span>
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('NMW')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('NMW') ? prev.filter(x => x !== 'NMW') : [...prev, 'NMW']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span>助產及婦女照護 (NMW)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.NMW}</span>
                  </label>
                </div>
              </div>

              {/* College 3: 人類發展與健康學院 */}
              <div className="rounded-xl bg-surface-container-low p-2">
                <div className="flex items-center justify-between px-1 py-0.5 text-on-surface font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                    人類發展與健康學院
                  </span>
                  <span className="text-[11px] text-text-muted">{deptCounts.humanDevCollege} 門</span>
                </div>
                <div className="pl-3 space-y-1 mt-1">
                  <label className="flex items-center justify-between px-2 py-1 rounded bg-surface-card shadow-xs cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('DPC')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('DPC') ? prev.filter(x => x !== 'DPC') : [...prev, 'DPC']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span className="font-semibold">生死與心理諮商 (DPC)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.DPC}</span>
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('EX')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('EX') ? prev.filter(x => x !== 'EX') : [...prev, 'EX']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span>運動保健系 (SPE/EX)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.EX}</span>
                  </label>
                  <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-card cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('IEC')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('IEC') ? prev.filter(x => x !== 'IEC') : [...prev, 'IEC']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span>嬰幼兒保育系 (IEC)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.IEC}</span>
                  </label>
                </div>
              </div>

              {/* College 4: 通識教育中心 */}
              <div className="rounded-xl bg-surface-container-low p-2">
                <div className="flex items-center justify-between px-1 py-0.5 text-on-surface font-bold">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    通識教育中心
                  </span>
                  <span className="text-[11px] text-text-muted">{deptCounts.generalCenter} 門</span>
                </div>
                <div className="pl-3 space-y-1 mt-1">
                  <label className="flex items-center justify-between px-2 py-1 rounded bg-surface-card shadow-xs cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCollege.includes('GE')}
                        onChange={() => {
                          setSelectedCollege(prev =>
                            prev.includes('GE') ? prev.filter(x => x !== 'GE') : [...prev, 'GE']
                          );
                        }}
                        className="rounded accent-primary w-3.5 h-3.5"
                      />
                      <span className="font-semibold">博雅通識核心領域 (GE)</span>
                    </div>
                    <span className="text-text-muted">{deptCounts.GE}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Time Slot Matrix */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface">時段篩選矩陣 (週 / 節)</label>
              <button onClick={clearSlots} className="text-[11px] text-text-muted hover:text-primary">
                清空節次
              </button>
            </div>
            <div className="bg-surface-bg p-2 rounded-xl border border-border-subtle">
              <div className="grid grid-cols-6 gap-1 text-center text-[11px] font-bold mb-1 text-text-muted">
                <span>節</span>
                <span>一</span>
                <span>二</span>
                <span>三</span>
                <span>四</span>
                <span>五</span>
              </div>
              {/* Row 1-8 */}
              {[1, 2, 3, 4, 5, 6, 7].map(period => (
                <div key={period} className="grid grid-cols-6 gap-1 text-[11px] mb-1">
                  <div className="py-1 text-center text-text-muted font-semibold">{period}</div>
                  {[1, 2, 3, 4, 5].map(day => {
                    const key = `${day}-${period}`;
                    const isSelected = !!selectedSlots[key];
                    // simulate conflict slot
                    const isConflict = day === 3 && (period === 2 || period === 3 || period === 4);
                    return (
                      <button
                        key={day}
                        onClick={() => !isConflict && toggleSlot(key)}
                        disabled={isConflict}
                        className={`h-6 rounded text-[10px] font-semibold transition-all ${
                          isConflict
                            ? 'bg-surface-container-high text-text-muted cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary text-white font-bold shadow-xs'
                            : 'bg-surface-card hover:bg-primary-fixed text-text-secondary'
                        }`}
                        title={isConflict ? '原班必修：軟體工程 (不可選)' : `週${['一','二','三','四','五'][day-1]} 第${period}節`}
                      >
                        {isConflict ? '擋' : isSelected ? '選' : '可'}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="flex items-center justify-between text-[10px] text-text-muted mt-2 pt-2 border-t border-border-subtle">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-primary rounded-xs"></span> 勾選過濾
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-surface-container-high rounded-xs"></span> 原班排定
                </span>
              </div>
            </div>
          </div>

          {/* Prerequisite & Availability Toggles */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="p-3 rounded-xl bg-secondary-fixed/15 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">先修科目智能防呆檢核</span>
                <span className="text-[11px] text-secondary">僅展示已符合先修及格條件課程</span>
              </div>
              <input
                type="checkbox"
                checked={prereqOnly}
                onChange={e => setPrereqOnly(e.target.checked)}
                className="w-4 h-4 accent-secondary rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-bg flex items-center justify-between border border-border-subtle">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">只看非額滿開課班級</span>
                <span className="text-[11px] text-text-muted">隱藏已達上限且無候補名額</span>
              </div>
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={e => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Micro-degree Pathway Status Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary-container to-primary text-white flex flex-col gap-1 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-primary-container font-semibold">已綁定微學程路徑</span>
              <span className="material-symbols-outlined text-[16px] text-secondary-fixed">verified</span>
            </div>
            <span className="font-bold text-sm tracking-tight">{student.microDegree}</span>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden my-1">
              <div
                className="bg-secondary-fixed-dim h-full rounded-full transition-all"
                style={{ width: `${(student.microDegreeCredits / student.microDegreeTarget) * 100}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-surface-container">
              已認列 {student.microDegreeCredits} / {student.microDegreeTarget} 學分（再選 2 門可取得證照）
            </span>
          </div>
        </aside>

        {/* Right Side: Course Results Listing */}
        <section className="flex flex-col gap-4">
          {/* Results Summary Bar */}
          <div className="bg-surface-card p-4 rounded-2xl shadow-sm border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-on-surface">符合條件課程</span>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
                {filteredCourses.length} 門課
              </span>
              <span className="text-text-muted text-xs hidden md:inline">
                （經智慧演算已排除 14 門原班衝突時段）
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <span>排序：</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-surface-bg text-on-surface font-semibold text-xs px-2.5 py-1.5 rounded-lg border-0 focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="recommend">學程契合度優先 (AI Recommended)</option>
                  <option value="available">剩餘名額多到少</option>
                  <option value="rating">教師綜合評價最高 (4.5★+)</option>
                  <option value="day">星期一至五時段順序</option>
                </select>
              </div>
            </div>
          </div>

          {/* Course Cards List */}
          <div className="space-y-4">
            {filteredCourses.map(course => {
              const inCart = cart.includes(course.id);
              const isFav = favorites.includes(course.id);

              return (
                <div
                  key={course.id}
                  className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border border-border-subtle"
                >
                  {/* Left accent color indicator */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      course.accentColor === 'primary'
                        ? 'bg-primary'
                        : course.accentColor === 'clinical-purple'
                        ? 'bg-clinical-purple'
                        : course.accentColor === 'general-sky'
                        ? 'bg-general-sky'
                        : course.accentColor === 'tertiary-fixed-dim'
                        ? 'bg-tertiary-fixed-dim'
                        : 'bg-secondary'
                    }`}
                  ></div>

                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pl-1.5">
                    {/* Course Information */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      {/* Tags & Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold text-xs">
                          {course.category} {course.credits.toFixed(1)} 學分
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container font-medium text-xs text-text-muted">
                          {course.id}
                        </span>
                        {course.isEMI && (
                          <span className="px-2 py-0.5 rounded-full bg-general-sky/15 text-general-sky font-semibold text-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">translate</span>
                            EMI全英語授課
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/20 text-secondary font-semibold text-xs flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          衝突安全 (無衝堂)
                        </span>
                        {course.prerequisite && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-secondary text-xs">
                            {course.prerequisite}
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <h3
                        onClick={() => onViewCourseDetail(course)}
                        className="font-bold text-lg sm:text-xl text-primary hover:text-primary-container cursor-pointer transition-colors mt-0.5"
                      >
                        {course.name}
                        {course.englishName && (
                          <span className="block text-xs sm:text-sm font-normal text-text-muted mt-0.5">
                            {course.englishName}
                          </span>
                        )}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 mt-0.5 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Meta Grid: Teacher, Room, Time */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-1.5 bg-surface-container-low px-3 rounded-xl text-xs text-on-surface-variant mt-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-[16px] text-text-muted">person</span>
                          <span className="font-medium truncate">{course.teacher}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-[16px] text-text-muted">schedule</span>
                          <span className="truncate">{course.timeStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-[16px] text-text-muted">location_on</span>
                          <span className="truncate">{course.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side Quota + Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between lg:justify-start gap-3 shrink-0 w-full lg:w-56 pt-2 lg:pt-0 border-t border-border-subtle lg:border-t-0">
                      {/* Quota Progress */}
                      <div className="flex items-center justify-between sm:justify-start lg:flex-col lg:items-end gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-base text-on-surface">{course.enrolled}</span>
                          <span className="text-text-muted text-xs">/ {course.capacity} 席</span>
                          {/* Heart Favorite Button */}
                          <button
                            onClick={() => onToggleFavorite(course.id)}
                            className="ml-1 w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-colors"
                            aria-label="收藏"
                          >
                            <span
                              className={`material-symbols-outlined text-[16px] ${
                                isFav ? 'text-conflict-danger' : 'text-text-muted'
                              }`}
                              style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              {isFav ? 'favorite' : 'favorite_border'}
                            </span>
                          </button>
                        </div>
                        <div className="flex flex-col items-end sm:items-start lg:items-end">
                          <div className="w-24 sm:w-32 bg-surface-bg h-2 rounded-full overflow-hidden border border-border-subtle">
                            <div
                              className={`h-full rounded-full transition-all ${
                                course.enrolled >= course.capacity
                                  ? 'bg-conflict-danger'
                                  : course.enrolled / course.capacity > 0.85
                                  ? 'bg-tertiary-fixed-dim'
                                  : 'bg-secondary'
                              }`}
                              style={{ width: `${Math.min(100, (course.enrolled / course.capacity) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 text-secondary">
                            {course.enrolled >= course.capacity
                              ? '已額滿 (抽籤)'
                              : course.capacity - course.enrolled <= 3
                              ? `僅餘 ${course.capacity - course.enrolled} 席`
                              : `餘 ${course.capacity - course.enrolled} 席`}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => onViewCourseDetail(course)}
                          className="h-9 px-2 sm:px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                          title="查看完整課程大綱與評分方式"
                        >
                          <span className="material-symbols-outlined text-[15px]">menu_book</span>
                          <span>大綱</span>
                        </button>

                        <button
                          onClick={() => onNavigateToGis(course)}
                          className="h-9 px-2 sm:px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                          title="校園建物 GIS 與連通空橋路線"
                        >
                          <span className="material-symbols-outlined text-[15px]">map</span>
                          <span>GIS</span>
                        </button>

                        <button
                          onClick={() => onToggleCart(course.id)}
                          className={`h-9 px-2.5 sm:px-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 ${
                            inCart
                              ? 'bg-secondary text-white hover:opacity-90'
                              : 'bg-primary text-white hover:bg-primary-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {inCart ? 'done' : 'add_circle'}
                          </span>
                          <span className="whitespace-nowrap">{inCart ? '已預選' : '預選'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Micro-Delight Campus Visual Showcase Card */}
          <div className="w-full bg-surface-card rounded-2xl p-4 shadow-sm border border-border-subtle flex items-center gap-4 mt-2">
            <div className="w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center shrink-0 overflow-hidden relative">
              <img
                alt="北護現代臨床模擬實驗室實景"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3trWoWSLF9pJeTlJtWYkbUeukWoCe5qy7POa71IbJl9neSLmSXr0vEiyA4oPPWy9mDzvWdN6UaL-RhnZBkMN2t9N2IMaTxHx8mmcu6-oT1t4GG2bPOCssiVwDJd3xV9tqxwUi3Xg0knh6yoiE5aR2aipESRFaP9UOnYv8f4XlvHNhojnyIAwz9z00-q-PV5x-oIEjcpgQ9X_eMCH-7ZK4mXgXixyKuCc4eRkOtfoA9q8ncyYe2etr"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="material-symbols-outlined text-primary text-[28px] absolute pointer-events-none">
                local_hospital
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 text-primary text-xs font-bold mb-0.5">
                <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                <span>選課小秘書 跨域小叮嚀</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                資管系跨域選課提醒：修習「智慧健康科技微學程」與護理學院合開之《智慧護理與臨床工作流程模擬》可同步抵免系外選修學分上限。
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Simulation Bar (Level 3 Elevation Sticky) */}
      <div className="sticky bottom-20 xl:bottom-6 z-40 w-full mt-6">
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-surface-card/95 backdrop-blur-md shadow-xl border border-border-subtle max-w-2xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-on-surface truncate">已加入模擬排課</span>
                <span className="px-2 py-0.2 rounded-full bg-secondary text-white text-xs font-bold">
                  {cart.length} 門
                </span>
              </div>
              <span className="text-xs text-text-muted truncate">
                累計 <strong className="text-primary font-bold">{totalCredits.toFixed(1)}</strong> 學分 (上限 25.0)
              </span>
            </div>
          </div>

          <button
            onClick={onGoToSimulation}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md hover:bg-primary-container active:scale-95 transition-all shrink-0"
          >
            <span>進入模擬工作台</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
