import React, { useState, useMemo } from 'react';
import { Course, CourseCategory } from '../types';

interface AdminCourseManagementProps {
  courses: Course[];
  onAddCourse: (newCourse: Course) => void;
  onUpdateCourse: (updatedCourse: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onViewCourseDetail: (course: Course) => void;
  showToast: (msg: string) => void;
}

export const AdminCourseManagement: React.FC<AdminCourseManagementProps> = ({
  courses,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onViewCourseDetail,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'enrolled' | 'credits'>('id');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('cards');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Form state for Add/Edit
  const [formId, setFormId] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formEnglishName, setFormEnglishName] = useState('');
  const [formCredits, setFormCredits] = useState(2.0);
  const [formCategory, setFormCategory] = useState<CourseCategory>('專業選修');
  const [formCollege, setFormCollege] = useState<'健康科技學院' | '護理學院' | '人類發展與健康學院' | '通識中心'>('健康科技學院');
  const [formDepartment, setFormDepartment] = useState('資訊管理系 (IM)');
  const [formTeacher, setFormTeacher] = useState('');
  const [formTeacherTitle, setFormTeacherTitle] = useState('專任助理教授');
  const [formBuilding, setFormBuilding] = useState('資訊科技大樓');
  const [formRoom, setFormRoom] = useState('I502');
  const [formDay, setFormDay] = useState(1);
  const [formPeriods, setFormPeriods] = useState<number[]>([2, 3, 4]);
  const [formCapacity, setFormCapacity] = useState(45);
  const [formEnrolled, setFormEnrolled] = useState(0);
  const [formIsEMI, setFormIsEMI] = useState(false);
  const [formIsCross, setFormIsCross] = useState(true);
  const [formPrereq, setFormPrereq] = useState('無先修限制');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('新開課程, 智慧醫療');

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.teacher.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedCollege !== 'ALL' && c.college !== selectedCollege) {
        return false;
      }
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'id') return a.id.localeCompare(b.id);
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-TW');
      if (sortBy === 'credits') return b.credits - a.credits;
      if (sortBy === 'enrolled') return (b.enrolled / b.capacity) - (a.enrolled / a.capacity);
      return 0;
    });
  }, [courses, searchQuery, selectedCollege, selectedCategory, sortBy]);

  const openAddModal = () => {
    setFormId(`IM${Math.floor(3000 + Math.random() * 900)}`);
    setFormCode(`1132-${Math.floor(1000 + Math.random() * 900)}`);
    setFormName('');
    setFormEnglishName('');
    setFormCredits(2.0);
    setFormCategory('專業選修');
    setFormCollege('健康科技學院');
    setFormDepartment('資訊管理系 (IM)');
    setFormTeacher('');
    setFormTeacherTitle('副教授');
    setFormBuilding('資訊科技大樓');
    setFormRoom('I302');
    setFormDay(1);
    setFormPeriods([2, 3, 4]);
    setFormCapacity(45);
    setFormEnrolled(0);
    setFormIsEMI(false);
    setFormIsCross(true);
    setFormPrereq('無先修限制');
    setFormDescription('');
    setFormTags('新開課程, 智慧醫療');
    setIsAddModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormId(course.id);
    setFormCode(course.code);
    setFormName(course.name);
    setFormEnglishName(course.englishName || '');
    setFormCredits(course.credits);
    setFormCategory(course.category);
    setFormCollege(course.college);
    setFormDepartment(course.department);
    setFormTeacher(course.teacher);
    setFormTeacherTitle(course.teacherTitle || '專任教師');
    setFormBuilding(course.building);
    setFormRoom(course.room);
    setFormDay(course.day);
    setFormPeriods(course.periods);
    setFormCapacity(course.capacity);
    setFormEnrolled(course.enrolled);
    setFormIsEMI(!!course.isEMI);
    setFormIsCross(!!course.isCrossDisciplinary);
    setFormPrereq(course.prerequisite || '無先修限制');
    setFormDescription(course.description);
    setFormTags(course.tags.join(', '));
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTeacher.trim()) {
      showToast('請填寫課程名稱與授課教師！');
      return;
    }

    const dayNames = ['', '週一', '週二', '週三', '週四', '週五'];
    const timeStr = `${dayNames[formDay]} 第 ${formPeriods.join('-')} 節`;
    const location = `${formBuilding} ${formRoom}`;
    const tagsArray = formTags.split(',').map(s => s.trim()).filter(Boolean);

    if (editingCourse) {
      const updated: Course = {
        ...editingCourse,
        code: formCode,
        name: formName,
        englishName: formEnglishName,
        credits: formCredits,
        category: formCategory,
        college: formCollege,
        department: formDepartment,
        teacher: formTeacher,
        teacherTitle: formTeacherTitle,
        building: formBuilding,
        room: formRoom,
        location,
        day: formDay,
        periods: formPeriods,
        timeStr,
        capacity: formCapacity,
        enrolled: formEnrolled,
        isEMI: formIsEMI,
        isCrossDisciplinary: formIsCross,
        prerequisite: formPrereq,
        description: formDescription,
        tags: tagsArray.length > 0 ? tagsArray : editingCourse.tags,
      };
      onUpdateCourse(updated);
      showToast(`已成功修改課程：${updated.name} (${updated.id})`);
      setEditingCourse(null);
    } else {
      // Create new
      const newCourse: Course = {
        id: formId.trim() || `C${Date.now().toString().slice(-4)}`,
        code: formCode.trim() || `1132-${Math.floor(1000 + Math.random() * 900)}`,
        name: formName,
        englishName: formEnglishName,
        credits: formCredits,
        category: formCategory,
        college: formCollege,
        department: formDepartment,
        teacher: formTeacher,
        teacherTitle: formTeacherTitle,
        building: formBuilding,
        room: formRoom,
        location,
        day: formDay,
        periods: formPeriods,
        timeStr,
        enrolled: formEnrolled,
        capacity: formCapacity,
        isEMI: formIsEMI,
        isCrossDisciplinary: formIsCross,
        prerequisite: formPrereq,
        prerequisitePassed: true,
        description: formDescription || '國立臺北護理健康大學優質課程。',
        rating: 4.8,
        ratingCount: 1,
        passRate: 95.0,
        averageScore: 85.0,
        tags: tagsArray.length > 0 ? tagsArray : ['新開課程'],
        accentColor: formCategory === '博雅通識' ? 'general-sky' : formCollege === '護理學院' ? 'clinical-purple' : 'primary',
      };
      onAddCourse(newCourse);
      showToast(`已成功新增課程：${newCourse.name} (${newCourse.id})`);
      setIsAddModalOpen(false);
    }
  };

  const confirmDelete = () => {
    if (!deletingCourse) return;
    onDeleteCourse(deletingCourse.id);
    showToast(`已成功刪除課程：${deletingCourse.name} (${deletingCourse.id})`);
    setDeletingCourse(null);
  };

  return (
    <div className="flex flex-col w-full max-w-[1680px] mx-auto pb-16">
      {/* Top Banner / Actions Bar */}
      <section className="w-full bg-surface-card shadow-xs px-6 py-5 mb-6 rounded-2xl border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>課務管理工作台</span>
            </span>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-xs text-text-muted">113 學年度 第 2 學期</span>
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight mt-1">
            課程維護與開課管理 (Course Management)
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            提供課務組與開課單位即時新增、修改、刪除、查詢及容量額度調配
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>新增開課科目</span>
          </button>
        </div>
      </section>

      {/* Metric Counters Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">library_books</span>
          </div>
          <div>
            <div className="text-xs text-text-muted">開課總門數</div>
            <div className="text-2xl font-bold text-primary">{courses.length} 門</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">group</span>
          </div>
          <div>
            <div className="text-xs text-text-muted">總開課名額 (容量)</div>
            <div className="text-2xl font-bold text-secondary">
              {courses.reduce((acc, c) => acc + c.capacity, 0).toLocaleString()} 席
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">how_to_reg</span>
          </div>
          <div>
            <div className="text-xs text-text-muted">預選中選總人次</div>
            <div className="text-2xl font-bold text-amber-600">
              {courses.reduce((acc, c) => acc + c.enrolled, 0).toLocaleString()} 人
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">translate</span>
          </div>
          <div>
            <div className="text-xs text-text-muted">全英語 EMI 課程</div>
            <div className="text-2xl font-bold text-indigo-600">
              {courses.filter(c => c.isEMI).length} 門
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Query Toolbar */}
      <div className="bg-surface-card rounded-2xl p-4 shadow-xs border border-border-subtle mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-text-muted">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋課名、代碼 (如 IM3012)、教師、教室..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-subtle bg-surface-bg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
          <select
            value={selectedCollege}
            onChange={e => setSelectedCollege(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs font-semibold"
          >
            <option value="ALL">全部學院 (All Colleges)</option>
            <option value="健康科技學院">健康科技學院</option>
            <option value="護理學院">護理學院</option>
            <option value="人類發展與健康學院">人類發展與健康學院</option>
            <option value="通識中心">通識教育中心</option>
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs font-semibold"
          >
            <option value="ALL">全部類別 (All Categories)</option>
            <option value="專業必修">專業必修</option>
            <option value="必修">必修</option>
            <option value="專業選修">專業選修</option>
            <option value="跨系選修">跨系選修</option>
            <option value="跨領域選修">跨領域選修</option>
            <option value="博雅通識">博雅通識</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs font-semibold"
          >
            <option value="id">依課程代碼排序</option>
            <option value="name">依課程名稱排序</option>
            <option value="enrolled">依滿額率高至低</option>
            <option value="credits">依學分數高至低</option>
          </select>

          {/* View Mode Switcher: Cards vs Table */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewLayout('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewLayout === 'cards'
                  ? 'bg-surface-card text-primary shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
              title="卡片檢視 (適合手機)"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>卡片</span>
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewLayout === 'table'
                  ? 'bg-surface-card text-primary shadow-xs'
                  : 'text-text-muted hover:text-on-surface'
              }`}
              title="表格檢視"
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>表格</span>
            </button>
          </div>
        </div>
      </div>

      {/* Courses Master View (Cards for mobile / Table for desktop) */}
      {viewLayout === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCourses.map(course => {
            const fillPercent = Math.min(100, Math.round((course.enrolled / course.capacity) * 100));
            return (
              <div
                key={course.id}
                className="bg-surface-card rounded-2xl p-4 sm:p-5 shadow-xs border border-border-subtle flex flex-col justify-between gap-3 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary/10 text-primary">
                        {course.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        course.category.includes('必修')
                          ? 'bg-rose-100 text-rose-800'
                          : course.category === '博雅通識'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {course.category} {course.credits}學分
                      </span>
                      {course.isEMI && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                          EMI
                        </span>
                      )}
                    </div>
                    <h3
                      onClick={() => onViewCourseDetail(course)}
                      className="font-bold text-base text-on-surface hover:text-primary transition-colors cursor-pointer mt-1 truncate"
                    >
                      {course.name}
                    </h3>
                    <p className="text-xs text-text-muted truncate">{course.englishName}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(course)}
                      className="w-8 h-8 rounded-lg bg-surface-container hover:bg-primary/10 text-primary flex items-center justify-center transition-colors"
                      title="編輯此課程"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingCourse(course)}
                      className="w-8 h-8 rounded-lg bg-surface-container hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                      title="刪除此課程"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-low p-2.5 rounded-xl text-on-surface-variant">
                  <div>
                    <span className="text-text-muted text-[11px] block">開課單位</span>
                    <span className="font-semibold truncate block">{course.department}</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[11px] block">授課教師</span>
                    <span className="font-semibold truncate block">{course.teacher}</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[11px] block">時段</span>
                    <span className="font-semibold truncate block">{course.timeStr}</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-[11px] block">教室</span>
                    <span className="font-semibold truncate block">{course.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border-subtle text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono">
                      {course.enrolled} / {course.capacity} 席
                    </span>
                    <span className="text-[11px] text-text-muted">({fillPercent}%)</span>
                  </div>
                  <button
                    onClick={() => onViewCourseDetail(course)}
                    className="text-primary font-bold hover:underline flex items-center gap-0.5 text-xs"
                  >
                    <span>大綱與評分</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-low text-text-muted font-bold">
                  <th className="py-3 px-4">課程代碼 / 編號</th>
                  <th className="py-3 px-4">課程名稱</th>
                  <th className="py-3 px-4">開課系所 / 學院</th>
                  <th className="py-3 px-4">類別 / 學分</th>
                  <th className="py-3 px-4">授課教師</th>
                  <th className="py-3 px-4">時段與教室</th>
                  <th className="py-3 px-4">預選 / 上限</th>
                  <th className="py-3 px-4 text-center">操作維護</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredCourses.map(course => {
                  const fillPercent = Math.min(100, Math.round((course.enrolled / course.capacity) * 100));
                  return (
                    <tr key={course.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        <div className="flex items-center gap-1.5">
                          <span>{course.id}</span>
                          {course.isEMI && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                              EMI
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-muted font-normal">{course.code}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onViewCourseDetail(course)}
                          className="font-bold text-sm text-on-surface hover:text-primary transition-colors text-left"
                        >
                          {course.name}
                        </button>
                        <div className="text-[11px] text-text-muted truncate max-w-xs">
                          {course.englishName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{course.department}</div>
                        <div className="text-[11px] text-text-muted">{course.college}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          course.category.includes('必修')
                            ? 'bg-rose-100 text-rose-800'
                            : course.category === '博雅通識'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {course.category}
                        </span>
                        <div className="text-[11px] text-text-muted mt-1">{course.credits} 學分</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-on-surface">
                        {course.teacher}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">{course.timeStr}</div>
                        <div className="text-[11px] text-text-muted">{course.location}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono">
                            {course.enrolled} / {course.capacity}
                          </span>
                          <span className="text-[10px] text-text-muted">({fillPercent}%)</span>
                        </div>
                        <div className="w-20 h-1.5 rounded-full bg-border-subtle mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              fillPercent >= 100
                                ? 'bg-rose-500'
                                : fillPercent >= 80
                                ? 'bg-amber-500'
                                : 'bg-secondary'
                            }`}
                            style={{ width: `${fillPercent}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(course)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            title="修改課程資料"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingCourse(course)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                            title="刪除此課程"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredCourses.length === 0 && (
        <div className="p-12 text-center text-text-muted bg-surface-card rounded-2xl border border-border-subtle mt-4">
          <span className="material-symbols-outlined text-[48px] text-text-muted/60 mb-2">
            search_off
          </span>
          <p className="font-bold text-sm">查無符合條件的課程</p>
          <p className="text-xs mt-1">請嘗試變更搜尋關鍵字或清除篩選條件</p>
        </div>
      )}

      {/* Add / Edit Course Modal */}
      {(isAddModalOpen || editingCourse) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-surface-card rounded-3xl shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px]">
                  {editingCourse ? 'edit_note' : 'add_box'}
                </span>
                <h3 className="font-bold text-lg">
                  {editingCourse ? `編輯課程：${editingCourse.name} (${editingCourse.id})` : '新增北護開課科目'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCourse(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    課程識別 ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formId}
                    onChange={e => setFormId(e.target.value)}
                    placeholder="例如: IM3012"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    教務課務代碼
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    placeholder="例如: 1132-0088"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    中文課程名稱
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="例如: 醫療人工智慧概論"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    英文課程名稱
                  </label>
                  <input
                    type="text"
                    value={formEnglishName}
                    onChange={e => setFormEnglishName(e.target.value)}
                    placeholder="Introduction to Healthcare AI"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">開課學院</label>
                  <select
                    value={formCollege}
                    onChange={e => setFormCollege(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs"
                  >
                    <option value="健康科技學院">健康科技學院</option>
                    <option value="護理學院">護理學院</option>
                    <option value="人類發展與健康學院">人類發展與健康學院</option>
                    <option value="通識中心">通識教育中心</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">開課系所</label>
                  <input
                    type="text"
                    required
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value)}
                    placeholder="例如: 資訊管理系 (IM)"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">修別類別</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs"
                  >
                    <option value="專業必修">專業必修</option>
                    <option value="必修">必修</option>
                    <option value="專業選修">專業選修</option>
                    <option value="跨系選修">跨系選修</option>
                    <option value="跨領域選修">跨領域選修</option>
                    <option value="博雅通識">博雅通識</option>
                    <option value="臨床實習">臨床實習</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">學分數</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="6"
                    value={formCredits}
                    onChange={e => setFormCredits(parseFloat(e.target.value) || 2)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">授課教師</label>
                  <input
                    type="text"
                    required
                    value={formTeacher}
                    onChange={e => setFormTeacher(e.target.value)}
                    placeholder="例如: 陳政憲 教授"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">教師職稱/備註</label>
                  <input
                    type="text"
                    value={formTeacherTitle}
                    onChange={e => setFormTeacherTitle(e.target.value)}
                    placeholder="特聘教授 (分機 2841)"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">上課校舍大樓</label>
                  <select
                    value={formBuilding}
                    onChange={e => setFormBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs"
                  >
                    <option value="資訊科技大樓">資訊科技大樓</option>
                    <option value="學思樓">學思樓</option>
                    <option value="親仁樓">親仁樓</option>
                    <option value="科技大樓">科技大樓</option>
                    <option value="圖書館">圖書館</option>
                    <option value="體育館">體育館</option>
                    <option value="樂育樓">樂育樓</option>
                    <option value="癒花園">癒花園</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">教室編號</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={e => setFormRoom(e.target.value)}
                    placeholder="I502"
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">星期 (1-5)</label>
                  <select
                    value={formDay}
                    onChange={e => setFormDay(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-xs"
                  >
                    <option value={1}>週一 (Mon)</option>
                    <option value={2}>週二 (Tue)</option>
                    <option value={3}>週三 (Wed)</option>
                    <option value={4}>週四 (Thu)</option>
                    <option value={5}>週五 (Fri)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">修課名額上限</label>
                  <input
                    type="number"
                    min="5"
                    max="150"
                    value={formCapacity}
                    onChange={e => setFormCapacity(parseInt(e.target.value) || 40)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={formIsEMI}
                    onChange={e => setFormIsEMI(e.target.checked)}
                    className="rounded accent-primary w-4 h-4"
                  />
                  <span>EMI 全英語授課認證</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={formIsCross}
                    onChange={e => setFormIsCross(e.target.checked)}
                    className="rounded accent-primary w-4 h-4"
                  />
                  <span>開放跨院/跨領域選修</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">先修條件</label>
                <input
                  type="text"
                  value={formPrereq}
                  onChange={e => setFormPrereq(e.target.value)}
                  placeholder="無先修限制 或 需先修通過 XX 課程"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">課程大綱簡介</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="簡述課程核心目標、教學重點與實作內容..."
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  標籤 (以逗號隔開)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder="智慧醫療, 醫院實習, 認證採計"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCourse(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-bold hover:bg-surface-container"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>{editingCourse ? '確認儲存變更' : '新增並發布課程'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-card rounded-3xl p-6 shadow-2xl border border-border-subtle">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <h3 className="font-bold text-lg text-on-surface">確認刪除此開課科目？</h3>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              您即將刪除 <strong className="text-primary font-bold">{deletingCourse.name}</strong> ({deletingCourse.id})。
              此動作將同時自全校課程清單與學生預選課表中移除該課程，請確認是否執行。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-bold hover:bg-surface-container"
              >
                取消保留
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                確認徹底刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
