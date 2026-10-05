import React, { useState, useMemo } from 'react';
import { Course, StudentProfile, SDG_LIST } from '../types';

interface CourseSearchProps {
  courses: Course[];
  cart: string[];
  favorites: string[];
  scheduleCourses?: Course[];
  onToggleCart: (courseId: string) => void;
  onToggleFavorite: (courseId: string) => void;
  onViewCourseDetail: (course: Course) => void;
  onGoToSimulation: () => void;
  student: StudentProfile;
  totalCredits: number;
}

export const CourseSearch: React.FC<CourseSearchProps> = ({
  courses,
  cart,
  favorites,
  scheduleCourses,
  onToggleCart,
  onToggleFavorite,
  onViewCourseDetail,
  onGoToSimulation,
  student,
  totalCredits,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState('全部');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [advancedTeacher, setAdvancedTeacher] = useState('');
  const [advancedCategory, setAdvancedCategory] = useState('全部');
  const [advancedCredits, setAdvancedCredits] = useState('全部');
  const [advancedDay, setAdvancedDay] = useState('全部');
  const [advancedEMI, setAdvancedEMI] = useState(false);
  const [advancedSDG, setAdvancedSDG] = useState('全部');
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

  const simCartCourses = useMemo(() => courses.filter(c => cart.includes(c.id)), [courses, cart]);

  const getCourseConflict = (targetCourse: Course) => {
    if (!targetCourse.day || !targetCourse.periods || targetCourse.periods.length === 0) {
      return { hasConflict: false, conflictingWith: [] as Course[] };
    }
    const combined = [...(scheduleCourses || []), ...simCartCourses];
    const matching = combined.filter(c =>
      c.id !== targetCourse.id &&
      c.day === targetCourse.day &&
      c.periods?.some(p => targetCourse.periods?.includes(p))
    );
    const unique = Array.from(new Map(matching.map(c => [c.id, c])).values());
    return {
      hasConflict: unique.length > 0,
      conflictingWith: unique,
    };
  };

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
        const matchSdgs = (q.includes('sdg') || q.includes('永續') || q.includes('指標')) && (
          (course.sdgs && course.sdgs.length > 0) ||
          course.tags.some(t => t.toLowerCase().includes('sdg') || t.toLowerCase().includes('永續'))
        );
        if (!matchName && !matchCode && !matchTeacher && !matchDesc && !matchTags && !matchSdgs) {
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
      if (selectedQuickFilter === '不衝堂優先') {
        const { hasConflict } = getCourseConflict(course);
        if (hasConflict) return false;
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

      // Advanced teacher filter
      if (advancedTeacher.trim()) {
        const t = advancedTeacher.trim().toLowerCase();
        if (!course.teacher.toLowerCase().includes(t)) {
          return false;
        }
      }

      // Advanced category filter
      if (advancedCategory !== '全部') {
        if (advancedCategory === '必修' && !course.category.includes('必修')) return false;
        if (advancedCategory === '選修' && !course.category.includes('選修')) return false;
        if (advancedCategory === '通識' && course.college !== '通識中心' && !course.category.includes('通識')) return false;
        if (advancedCategory !== '必修' && advancedCategory !== '選修' && advancedCategory !== '通識') {
          if (course.category !== advancedCategory) return false;
        }
      }

      // Advanced credits filter
      if (advancedCredits !== '全部') {
        const creditNum = parseInt(advancedCredits, 10);
        if (!isNaN(creditNum) && course.credits !== creditNum) {
          return false;
        }
      }

      // Advanced day filter
      if (advancedDay !== '全部') {
        const dayNum = parseInt(advancedDay, 10);
        if (!isNaN(dayNum) && course.day !== dayNum) {
          return false;
        }
      }

      // Advanced EMI filter
      if (advancedEMI && !course.isEMI) {
        return false;
      }

      // Quick filter SDGs
      if (selectedQuickFilter === 'SDGs 永續目標' && (!course.sdgs || course.sdgs.length === 0)) {
        return false;
      }

      // Advanced SDG filter
      if (advancedSDG !== '全部') {
        const targetId = parseInt(advancedSDG, 10);
        const courseSdgs = course.sdgs && course.sdgs.length > 0 ? course.sdgs : [3, 4];
        if (!courseSdgs.includes(targetId)) {
          return false;
        }
      }

      return true;
    });
  }, [
    courses,
    searchQuery,
    selectedQuickFilter,
    selectedCollege,
    prereqOnly,
    availableOnly,
    advancedTeacher,
    advancedCategory,
    advancedCredits,
    advancedDay,
    advancedEMI,
    advancedSDG,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedQuickFilter !== '全部') count++;
    if (selectedCollege.length < 10) count++;
    if (prereqOnly) count++;
    if (availableOnly) count++;
    if (advancedTeacher.trim()) count++;
    if (advancedCategory !== '全部') count++;
    if (advancedCredits !== '全部') count++;
    if (advancedDay !== '全部') count++;
    if (advancedEMI) count++;
    if (advancedSDG !== '全部') count++;
    return count;
  }, [
    searchQuery,
    selectedQuickFilter,
    selectedCollege,
    prereqOnly,
    availableOnly,
    advancedTeacher,
    advancedCategory,
    advancedCredits,
    advancedDay,
    advancedEMI,
    advancedSDG,
  ]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedQuickFilter('全部');
    setSelectedCollege(['IM', 'HA', 'SLP', 'NUR', 'LTC', 'NMW', 'DPC', 'EX', 'IEC', 'GE']);
    setPrereqOnly(false);
    setAvailableOnly(false);
    setAdvancedTeacher('');
    setAdvancedCategory('全部');
    setAdvancedCredits('全部');
    setAdvancedDay('全部');
    setAdvancedEMI(false);
    setAdvancedSDG('全部');
    clearSlots();
  };

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
                className={`flex-1 md:flex-initial h-12 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                  isAdvancedFilterOpen
                    ? 'bg-primary text-white ring-2 ring-primary/30 ring-offset-2'
                    : 'bg-surface-container hover:bg-surface-container-high text-primary'
                }`}
                title="展開/收合進階精準篩選面板"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isAdvancedFilterOpen ? 'expand_less' : 'tune'}
                </span>
                <span>{isAdvancedFilterOpen ? '收合進階檢索' : '進階檢索'}</span>
                {activeFilterCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isAdvancedFilterOpen ? 'bg-white text-primary' : 'bg-primary text-white'
                  }`}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={resetAllFilters}
                className="h-12 px-4 rounded-xl bg-surface-container text-primary text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors cursor-pointer"
                title="清空所有搜尋關鍵字與進階條件"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span className="hidden sm:inline">重置條件</span>
              </button>
            </div>
          </div>

          {/* Advanced Multi-Dimensional Filter Panel (Expanded on Desktop & Mobile) */}
          {isAdvancedFilterOpen && (
            <div className="mt-2 p-5 bg-surface-container-lowest border border-primary/20 rounded-2xl shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">進階多維度精準檢索面板</h3>
                    <p className="text-[11px] text-text-muted">支援授課教師、修別、上課星期、學分數與全英語授課交叉檢索</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      已啟用 {activeFilterCount} 個篩選條件
                    </span>
                  )}
                  <button
                    onClick={() => setIsAdvancedFilterOpen(false)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    title="收合進階檢索面板"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>

              {/* Advanced Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. 授課教師 */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                    授課教師姓名
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="輸入教師姓名 (如：洪教授)"
                      value={advancedTeacher}
                      onChange={e => setAdvancedTeacher(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-xl bg-surface-card border border-border-subtle text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                    {advancedTeacher && (
                      <button
                        onClick={() => setAdvancedTeacher('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. 課程修別 */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-secondary">category</span>
                    課程修別性質
                  </label>
                  <select
                    value={advancedCategory}
                    onChange={e => setAdvancedCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-card border border-border-subtle text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                  >
                    <option value="全部">全部修別</option>
                    <option value="專業必修">專業必修</option>
                    <option value="專業選修">專業選修</option>
                    <option value="博雅通識">博雅通識</option>
                    <option value="跨系選修">跨系選修 / 跨領域</option>
                    <option value="臨床實習">臨床實習</option>
                  </select>
                </div>

                {/* 3. 授課星期 */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-general-sky">calendar_month</span>
                    上課星期
                  </label>
                  <select
                    value={advancedDay}
                    onChange={e => setAdvancedDay(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-card border border-border-subtle text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                  >
                    <option value="全部">全部星期 (週一 ~ 週五)</option>
                    <option value="1">星期一 (Mon)</option>
                    <option value="2">星期二 (Tue)</option>
                    <option value="3">星期三 (Wed)</option>
                    <option value="4">星期四 (Thu)</option>
                    <option value="5">星期五 (Fri)</option>
                  </select>
                </div>

                {/* 4. 學分數 */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">counter_1</span>
                    學分數
                  </label>
                  <select
                    value={advancedCredits}
                    onChange={e => setAdvancedCredits(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-card border border-border-subtle text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                  >
                    <option value="全部">不拘學分</option>
                    <option value="1">1 學分</option>
                    <option value="2">2 學分</option>
                    <option value="3">3 學分</option>
                    <option value="4">4 學分及以上</option>
                  </select>
                </div>

                {/* 5. SDGs 永續目標 */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-bold text-on-surface mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">eco</span>
                    <span>對應 SDGs 聯合國永續發展目標 (北護校務重點指標)</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={advancedSDG}
                      onChange={e => setAdvancedSDG(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-surface-card border border-border-subtle text-xs text-on-surface font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer flex-1 min-w-[220px]"
                    >
                      <option value="全部">全部 SDGs 永續目標 (不拘)</option>
                      {SDG_LIST.map(sdg => (
                        <option key={sdg.id} value={sdg.id.toString()}>
                          {sdg.code} {sdg.name} ({sdg.enName})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {[3, 4, 9, 10, 17].map(id => {
                        const item = SDG_LIST.find(s => s.id === id);
                        if (!item) return null;
                        const isSelected = advancedSDG === id.toString();
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setAdvancedSDG(isSelected ? '全部' : id.toString())}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                              isSelected
                                ? 'text-white shadow-xs'
                                : 'bg-surface-card hover:bg-surface-container text-text-secondary border border-border-subtle'
                            }`}
                            style={isSelected ? { backgroundColor: item.color } : {}}
                          >
                            <span className="material-symbols-outlined text-[13px]">{item.icon}</span>
                            <span>{item.code} {item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick toggles row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={e => setAvailableOnly(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span>僅顯示尚有餘額</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={prereqOnly}
                      onChange={e => setPrereqOnly(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span>僅顯示先修及格課程</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={advancedEMI}
                      onChange={e => setAdvancedEMI(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span>EMI 全英語授課</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetAllFilters}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    清除條件
                  </button>
                  <button
                    onClick={() => setIsAdvancedFilterOpen(false)}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                  >
                    完成並檢視結果 ({filteredCourses.length})
                  </button>
                </div>
              </div>
            </div>
          )}

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
                        {(() => {
                          const { hasConflict, conflictingWith } = getCourseConflict(course);
                          if (hasConflict) {
                            const dayZh = ['一', '二', '三', '四', '五'][course.day! - 1] || `${course.day}`;
                            return (
                              <span
                                className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 border border-rose-300 dark:border-rose-800"
                                title={`⚠️ 與預排課程《${conflictingWith.map(c => c.name).join('、')}》時段衝突 (週${dayZh} 第${course.periods?.join(',')}節)`}
                              >
                                <span className="material-symbols-outlined text-[13px] text-rose-600">warning</span>
                                時段衝堂 (與《{conflictingWith[0]?.name.slice(0, 5)}...》)
                              </span>
                            );
                          }
                          return (
                            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/20 text-secondary font-semibold text-xs flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              衝突安全 (無衝堂)
                            </span>
                          );
                        })()}
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
                      <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => onViewCourseDetail(course)}
                          className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="查看完整課程大綱、SDGs 永續目標與評定標準"
                        >
                          <span className="material-symbols-outlined text-[15px]">menu_book</span>
                          <span>課程大綱</span>
                        </button>

                        <button
                          onClick={() => onToggleCart(course.id)}
                          className={`h-9 px-3.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${
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
