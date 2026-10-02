import React, { useState, useMemo } from 'react';
import { Course } from '../types';

interface AdminCourseImportProps {
  currentCourses: Course[];
  onBatchImport: (incomingCourses: Course[], overwrite: boolean) => void;
  showToast: (msg: string) => void;
}

export const AdminCourseImport: React.FC<AdminCourseImportProps> = ({
  currentCourses,
  onBatchImport,
  showToast,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [parsedCourses, setParsedCourses] = useState<Course[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [importSource, setImportSource] = useState<'upload' | 'template' | 'api'>('upload');

  // Sample import data representing course search system export
  const sampleImportJson = JSON.stringify(
    [
      {
        id: "IM3999",
        code: "1132-9901",
        name: "智慧健康照護元宇宙與VR沉浸式模擬",
        englishName: "Healthcare Metaverse & VR Immersive Simulation",
        credits: 3.0,
        category: "跨領域選修",
        department: "資訊管理系 (IM)",
        college: "健康科技學院",
        teacher: "林冠華 教授",
        teacherTitle: "特聘教授 / VR醫學影像中心主持人",
        location: "資訊科技大樓 I503 VR實驗室",
        building: "資訊科技大樓",
        room: "I503",
        day: 2,
        periods: [7, 8],
        timeStr: "週二 15:30-17:20 (第 7-8 節)",
        enrolled: 15,
        capacity: 35,
        isEMI: true,
        isCrossDisciplinary: true,
        prerequisite: "無先修限制",
        prerequisitePassed: true,
        description: "導入 HTC Vive Pro 與 Apple Vision Pro 開發臨床病房火災疏散、CPR 急救沉浸式訓練環境。",
        rating: 4.9,
        ratingCount: 25,
        passRate: 98.0,
        averageScore: 88.5,
        tags: ["VR沉浸模擬", "元宇宙照護", "EMI全英語", "前瞻技術"],
        accentColor: "primary"
      },
      {
        id: "NUR3888",
        code: "1132-9902",
        name: "精準腫瘤免疫治療與臨床照護指引",
        englishName: "Precision Immuno-Oncology & Clinical Nursing",
        credits: 2.0,
        category: "專業選修",
        department: "護理系 (NUR)",
        college: "護理學院",
        teacher: "許美惠 講座教授",
        teacherTitle: "癌症中心照護總顧問",
        location: "學思樓 F402 急症模擬中心",
        building: "學思樓",
        room: "F402",
        day: 4,
        periods: [3, 4],
        timeStr: "週四 10:10-12:00 (第 3-4 節)",
        enrolled: 20,
        capacity: 30,
        isEMI: false,
        isCrossDisciplinary: true,
        prerequisite: "腫瘤護理學概念",
        prerequisitePassed: true,
        description: "針對 CAR-T 細胞免疫療法、PD-1/PD-L1 免疫查核點抑制劑引發之細胞激素釋放症候群 (CRS) 臨床監控。",
        rating: 4.8,
        ratingCount: 30,
        passRate: 96.0,
        averageScore: 86.0,
        tags: ["CAR-T免疫治療", "癌症照護指引", "臨床專題"],
        accentColor: "clinical-purple"
      }
    ],
    null,
    2
  );

  const handleParseJson = (text: string) => {
    setJsonText(text);
    setParseError(null);
    if (!text.trim()) {
      setParsedCourses(null);
      return;
    }

    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        setParseError('格式錯誤：JSON 頂層必須為課程物件陣列 (Array of Course Objects)');
        setParsedCourses(null);
        return;
      }

      // Check required fields
      const validCourses: Course[] = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.id || !item.name || !item.teacher) {
          setParseError(`第 ${i + 1} 筆課程缺少關鍵欄位 (id, name, 或 teacher)`);
          setParsedCourses(null);
          return;
        }

        validCourses.push({
          id: String(item.id),
          code: String(item.code || `1132-${1000 + i}`),
          name: String(item.name),
          englishName: String(item.englishName || ''),
          credits: Number(item.credits) || 2,
          category: item.category || '專業選修',
          college: item.college || '健康科技學院',
          department: item.department || '資訊管理系 (IM)',
          teacher: String(item.teacher),
          teacherTitle: item.teacherTitle || '專任教師',
          location: item.location || '學思樓 F401',
          building: item.building || '學思樓',
          room: item.room || 'F401',
          day: Number(item.day) || 1,
          periods: Array.isArray(item.periods) ? item.periods : [2, 3],
          timeStr: item.timeStr || '週一 第 2-3 節',
          enrolled: Number(item.enrolled) || 0,
          capacity: Number(item.capacity) || 40,
          isEMI: Boolean(item.isEMI),
          isCrossDisciplinary: Boolean(item.isCrossDisciplinary),
          prerequisite: item.prerequisite || '無先修限制',
          prerequisitePassed: true,
          description: item.description || '北護課程查詢系統輸出之課程內容。',
          rating: Number(item.rating) || 4.8,
          ratingCount: Number(item.ratingCount) || 10,
          passRate: Number(item.passRate) || 95.0,
          averageScore: Number(item.averageScore) || 85.0,
          tags: Array.isArray(item.tags) ? item.tags : ['匯入課程'],
          accentColor: item.accentColor || 'primary',
          syllabus: item.syllabus,
        });
      }

      setParsedCourses(validCourses);
    } catch (err: any) {
      setParseError(`JSON 解析失敗：${err.message}`);
      setParsedCourses(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      handleParseJson(content);
      showToast(`已載入檔案：${file.name} (${Math.round(file.size / 1024)} KB)`);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!parsedCourses || parsedCourses.length === 0) {
      showToast('無有效的課程資料可匯入');
      return;
    }

    onBatchImport(parsedCourses, overwriteExisting);
    showToast(`成功匯入 ${parsedCourses.length} 門課程！已同步更新至全校系統。`);
    setJsonText('');
    setParsedCourses(null);
  };

  const handleLoadSample = () => {
    handleParseJson(sampleImportJson);
    showToast('已填入「課程查詢系統標準輸出格式」範例資料');
  };

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(currentCourses, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `NTUNHS_Courses_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`已將全校 ${currentCourses.length} 門課程匯出為 JSON 檔案！`);
  };

  const handleExportCsv = () => {
    const headers = ['課程代碼', '課號', '課程名稱', '英文名稱', '學分', '類別', '學院', '系所', '授課教師', '時間時段', '上課教室', '已選人數', '容量上限'];
    const rows = currentCourses.map(c => [
      c.id,
      c.code,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.englishName || '').replace(/"/g, '""')}"`,
      c.credits,
      c.category,
      c.college,
      `"${c.department}"`,
      c.teacher,
      `"${c.timeStr}"`,
      `"${c.location}"`,
      c.enrolled,
      c.capacity,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NTUNHS_Courses_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`已將全校 ${currentCourses.length} 門課程匯出為 CSV 試算表！`);
  };

  // Compute diff against current courses
  const diffSummary = useMemo(() => {
    if (!parsedCourses) return null;
    const existingIds = new Set(currentCourses.map(c => c.id));
    const newItems = parsedCourses.filter(c => !existingIds.has(c.id));
    const overwriteItems = parsedCourses.filter(c => existingIds.has(c.id));
    return {
      total: parsedCourses.length,
      newCount: newItems.length,
      overwriteCount: overwriteItems.length,
    };
  }, [parsedCourses, currentCourses]);

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16">
      {/* Top Header Card */}
      <section className="w-full bg-surface-card shadow-xs px-4 sm:px-6 py-4 sm:py-5 mb-6 rounded-2xl border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">sync_alt</span>
              <span>教務資料介接與串聯</span>
            </span>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-xs text-text-muted">支援 JSON / CSV / 課查系統封裝檔</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-tight mt-1">
            匯入課程查詢系統輸出結果 (Batch Course Import & Sync)
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            可無縫匯入北護課程查詢系統、校務行政系統所匯出的最新開課資料集，並進行差異比對後一鍵套用
          </p>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>匯出 JSON</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
            <span>匯出 CSV</span>
          </button>
        </div>
      </section>

      {/* Main Import Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Input Methods & Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-card rounded-2xl p-5 shadow-xs border border-border-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                <span>匯入來源選擇與檔案解析</span>
              </div>
              <button
                onClick={handleLoadSample}
                className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">data_object</span>
                <span>載入課查系統範例格式</span>
              </button>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div className="mb-4">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-subtle hover:border-primary/50 rounded-2xl cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[28px]">file_upload</span>
                </div>
                <span className="text-sm font-bold text-on-surface">
                  點擊選取或拖曳課程輸出檔案至此處 (.json / .txt)
                </span>
                <span className="text-xs text-text-muted mt-1">
                  支援北護課程查詢系統輸出之完整 JSON 結構
                </span>
                <input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Direct JSON Editor Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-on-surface">
                  或直接貼上 JSON 輸出字串：
                </label>
                {parsedCourses && (
                  <span className="text-xs font-bold text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>語法正確，已解析 {parsedCourses.length} 門課程</span>
                  </span>
                )}
              </div>
              <textarea
                rows={10}
                value={jsonText}
                onChange={e => handleParseJson(e.target.value)}
                placeholder="貼上課程查詢系統導出之 JSON 陣列，例如: [ { &quot;id&quot;: &quot;IM3012&quot;, &quot;name&quot;: &quot;...&quot; } ]"
                className="w-full p-3.5 rounded-xl border border-border-subtle bg-surface-bg text-xs font-mono text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              ></textarea>
            </div>

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mt-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{parseError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Diff Preview & Apply Controls */}
        <div className="space-y-4">
          <div className="bg-surface-card rounded-2xl p-5 shadow-xs border border-border-subtle">
            <h4 className="font-bold text-sm text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px]">difference</span>
              <span>匯入差異分析與套用設定</span>
            </h4>

            {diffSummary ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-border-subtle text-xs space-y-2">
                  <div className="flex justify-between font-bold text-on-surface">
                    <span>準備匯入總數：</span>
                    <span className="font-mono text-primary text-sm">{diffSummary.total} 門</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>• 全新新增課程：</span>
                    <span className="font-bold font-mono">+{diffSummary.newCount} 門</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>• 既有同代碼課程：</span>
                    <span className="font-bold font-mono">{diffSummary.overwriteCount} 門</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={e => setOverwriteExisting(e.target.checked)}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span>若代碼相同則覆蓋更新原有課程內容</span>
                  </label>
                  <p className="text-[11px] text-text-muted mt-0.5 pl-6">
                    若取消勾選，遇重複代碼將自動略過保留原課程
                  </p>
                </div>

                <button
                  onClick={handleApplyImport}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <span className="material-symbols-outlined text-[20px]">published_with_changes</span>
                  <span>確認匯入並更新課程庫</span>
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-text-muted text-xs">
                <span className="material-symbols-outlined text-[36px] text-text-muted/60 mb-2">
                  pending_actions
                </span>
                <p>請先由左側上傳或貼上課程輸出資料</p>
                <p className="text-[11px] text-text-muted mt-1">系統將即時計算新舊課程比對差異</p>
              </div>
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 text-xs text-primary space-y-2">
            <div className="font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>輸出格式相容說明</span>
            </div>
            <p className="leading-relaxed text-[11px] text-on-surface-variant">
              本系統之「匯入課程查詢系統輸出結果」能自動相容解析：
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-on-surface-variant">
              <li>北護課程大綱與開課查詢系統匯出格式</li>
              <li>具備 id、name、teacher、periods 之標準 REST API 資料</li>
              <li>匯入後學生端「課程查詢」與「預選課模擬」將立即可見</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Table of incoming courses */}
      {parsedCourses && parsedCourses.length > 0 && (
        <div className="mt-6 bg-surface-card rounded-2xl p-5 shadow-xs border border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
            <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px]">preview</span>
              <span>即將匯入之課程預覽清單 ({parsedCourses.length} 門)</span>
            </h4>
            <span className="text-xs text-text-muted font-mono">
              請檢查各筆資料是否完整無誤
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low text-text-muted font-bold border-b border-border-subtle">
                  <th className="py-2.5 px-3">課程代碼</th>
                  <th className="py-2.5 px-3">課程名稱</th>
                  <th className="py-2.5 px-3">系所 / 學院</th>
                  <th className="py-2.5 px-3">授課教師</th>
                  <th className="py-2.5 px-3">學分 / 類別</th>
                  <th className="py-2.5 px-3">時段教室</th>
                  <th className="py-2.5 px-3">名額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {parsedCourses.map((c, i) => (
                  <tr key={i} className="hover:bg-surface-container-low">
                    <td className="py-2 px-3 font-mono font-bold text-primary">{c.id}</td>
                    <td className="py-2 px-3 font-bold text-on-surface">{c.name}</td>
                    <td className="py-2 px-3 text-text-muted">{c.department}</td>
                    <td className="py-2 px-3">{c.teacher}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container font-semibold">
                        {c.credits} 學分 • {c.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-text-muted">{c.timeStr} • {c.location}</td>
                    <td className="py-2 px-3 font-mono">{c.capacity} 席</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
