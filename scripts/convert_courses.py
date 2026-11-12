"""
把學校匯出的「全校修課資料表」(.xls) 轉成網站用的 JSON。

用法：
    pip install xlrd
    python scripts/convert_courses.py <放 xls 的資料夾>

輸出到 src/data/generated/：
    courses.json         最新學期的課程（網站選課頁使用）
    course-history.json  其餘學期的歷年開課紀錄（以課名彙整）
    demo-plans.json      示範學生的課表、預選清單與已及格科目

學校資料沒有的欄位：
    名額上限 → 以歷年同名課程單班最高修課人數推估（capacityEstimated）
    評價星數、平均分數、及格率 → 固定的模擬值（畫面標示「模擬資料」）
    先修條件 → 僅示範：課名為「…(二)」且歷年有「…(一)」時，設為需先修 (一)
"""
import collections, glob, json, math, os, re, sys, unicodedata

import xlrd

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'generated')
os.makedirs(OUT, exist_ok=True)

# 系所代碼前兩碼 → 系所、學院（依課表名稱推定，請依學校公告核對）
DEPTS = {
    '11': ('護理系', '護理學院'),
    '13': ('高齡與長期照護事業系', '護理學院'),
    '1C': ('護理助產及婦女健康系', '護理學院'),
    '1D': ('醫護教育暨數位學習系', '護理學院'),
    '21': ('健康事業管理系', '健康科技學院'),
    '22': ('資訊管理系', '健康科技學院'),
    '23': ('休閒產業與健康促進系', '健康科技學院'),
    '24': ('長期照護系', '健康科技學院'),
    '25': ('語言治療與聽力學系', '健康科技學院'),
    '31': ('嬰幼兒保育系', '人類發展與健康學院'),
    '32': ('運動保健系', '人類發展與健康學院'),
    '33': ('生死與健康心理諮商系', '人類發展與健康學院'),
    '41': ('技優專班', '智慧健康照護跨領域學院'),
    '42': ('技優專班', '智慧健康照護跨領域學院'),
}
PROGRAMS = {'140': '四技', '120': '二技'}
CATEGORY = {'專業必修(系所)': '專業必修', '專業選修(系所)': '專業選修', '通識必修(通識)': '博雅通識', '通識選修(通識)': '博雅通識'}
DAY = '一二三四五六日'
ACCENT = {'專業必修': 'primary', '專業選修': 'secondary', '博雅通識': 'general-sky'}

num = lambda s: int(float(s)) if str(s).strip() else 0
periods = lambda s: [int(x) for x in str(s).split(',') if x.strip().isdigit()]
norm = lambda s: unicodedata.normalize('NFKC', str(s)).strip()


def span(ps):
    return str(ps[0]) if len(ps) == 1 else f'{min(ps)}-{max(ps)}'


def read_rows():
    null = open(os.devnull, 'w')
    for f in sorted(glob.glob(os.path.join(SRC, '*.xls'))):
        sh = xlrd.open_workbook(f, logfile=null).sheet_by_index(0)
        head = sh.row_values(4)
        for r in range(5, sh.nrows):
            v = dict(zip(head, sh.row_values(r)))
            if v.get('學期'):
                yield v


by_sem = collections.defaultdict(dict)
for v in read_rows():
    key = v['科目代碼(新碼全碼)']
    c = by_sem[v['學期']].setdefault(key, {
        'id': key, 'no': v['編號'], 'semester': v['學期'], 'name': norm(v['科目中文名稱']),
        'englishName': str(v['科目英文名稱']).strip(), 'deptCode': v['系所代碼'], 'grade': str(v['年級']),
        'className': norm(v['課表名稱(舊碼)']),
        'teacher': str(v['授課教師姓名']).strip() or str(v['主開課教師姓名']).strip(),
        'enrolled': num(v['上課人數']), 'credits': num(v['學分數']), 'category': v['課別名稱'],
        'note': str(v['課表備註']).strip(), 'summary': str(v['課程中文摘要']).strip(), 'slots': []})
    ps = periods(v['上課節次'])
    if v['上課星期'] and ps:
        slot = {'day': num(v['上課星期']), 'periods': ps, 'room': str(v['上課地點']).strip()}
        if slot not in c['slots']:
            c['slots'].append(slot)

latest = max(by_sem)

# ---------- 歷年紀錄（以課名彙整） ----------
history = collections.defaultdict(dict)
hist_max = collections.Counter()
for sem, cs in by_sem.items():
    if sem == latest:
        continue
    for c in cs.values():
        h = history[c['name']].setdefault(sem, {'sections': 0, 'enrolled': 0, 'teachers': []})
        h['sections'] += 1
        h['enrolled'] += c['enrolled']
        hist_max[c['name']] = max(hist_max[c['name']], c['enrolled'])
        for t in c['teacher'].split(','):
            if t and t not in h['teachers']:
                h['teachers'].append(t)
history_out = {
    name: [{'semester': s, **h} for s, h in sorted(sems.items())] for name, sems in history.items()
}

# ---------- 最新學期課程 ----------
def stable(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


courses = []
for c in by_sem[latest].values():
    if not c['slots']:
        continue
    dept, college = DEPTS.get(c['deptCode'][:2], ('其他', '通識中心'))
    program = PROGRAMS.get(c['deptCode'][2:], '')
    first, extra = c['slots'][0], c['slots'][1:]
    cap = max(c['enrolled'], hist_max.get(c['name'], 0))
    cap = int(math.ceil(max(cap, 1) / 5) * 5)
    if cap == c['enrolled'] and stable(c['id']) % 3:
        cap += 5
    requires = None
    for pattern, before in ((r'^(.*)\(二\)$', '{}(一)'), (r'^(.*?) ?II$', '{} I'), (r'^(.*?) ?II$', '{}I'), (r'^進階(.*)$', '{}')):
        m = re.match(pattern, c['name'])
        if m and before.format(m.group(1)) in history:
            requires = [[before.format(m.group(1))]]
            break
    category = CATEGORY.get(c['category'], '專業選修')
    time_str = '、'.join(f"週{DAY[s['day'] - 1]} 第 {span(s['periods'])} 節" for s in c['slots'])
    course = {
        'id': c['id'], 'code': f"{latest}-{c['no']}", 'name': c['name'], 'englishName': c['englishName'],
        'credits': c['credits'], 'category': category, 'department': dept, 'college': college,
        'program': program, 'className': c['className'], 'grade': c['grade'],
        'teacher': c['teacher'].replace(',', '、'),
        'location': first['room'] or '未排教室', 'building': (first['room'][:1] + ' 棟') if first['room'] else '',
        'room': first['room'] or '未排', 'day': first['day'], 'periods': first['periods'], 'timeStr': time_str,
        'enrolled': c['enrolled'], 'capacity': cap, 'capacityEstimated': True,
        'isEMI': bool(re.search(r'EMI|全英', c['note'] + c['name'])),
        'description': c['summary'] or '（學校資料未提供課程摘要）', 'note': c['note'],
        # 以下四項學校資料沒有，為固定的模擬值（同一門課每次轉檔結果相同），畫面上標示「模擬資料」
        'rating': round(3.6 + (stable(c['id']) % 13) / 10, 1), 'ratingCount': 8 + stable(c['id'] + 'n') % 60,
        'averageScore': round(76 + (stable(c['id'] + 's') % 120) / 10, 1),
        'passRate': round(90 + (stable(c['id'] + 'p') % 95) / 10, 1), 'tags': [t for t in [c['className'], program] if t],
        'accentColor': ACCENT.get(category, 'primary'), 'source': 'school',
    }
    if extra:
        course['extraSlots'] = extra
    if requires:
        course['requires'] = requires
        course['prerequisite'] = f"先修：{requires[0][0]}（示範規則）"
    courses.append(course)
courses.sort(key=lambda c: (c['department'], c['program'] != '四技', c['grade'], c['className'], c['code']))

# ---------- 示範學生 ----------
def slots(c):
    return [(c['day'], p) for p in c['periods']] + [(s['day'], p) for s in c.get('extraSlots', []) for p in s['periods']]


def clash(a, b):
    return bool(set(slots(a)) & set(slots(b)))


def build_plan(class_name, dept, grade, earlier):
    """class_name: 本學期所屬班級；grade: 年級；earlier: 過去就讀的 (學年, 班級前綴)，用來推算已及格科目"""
    passed = []
    for year, prefix in earlier:
        for sem in (year + '1', year + '2'):
            for c in by_sem.get(sem, {}).values():
                if c['className'].startswith(prefix) and c['name'] not in passed:
                    passed.append(c['name'])
    schedule = []
    for c in courses:
        if c['className'] == class_name and not any(clash(c, s) for s in schedule):
            schedule.append(c)
    # 同年級的系選修／通識（班級代碼含「日」者為全系合開）
    pool = [c for c in courses if c['department'] == dept and c['grade'] == grade and '日' in c['className']
            and c['day'] <= 5 and max(c['periods']) <= 10 and c['enrolled'] > 0
            and c['name'] not in passed and c['name'] not in {s['name'] for s in schedule}]
    for c in pool:
        if len(schedule) >= 6 or sum(x['credits'] for x in schedule) + c['credits'] > 16:
            break
        if not c.get('requires') and not any(clash(c, s) for s in schedule):
            schedule.append(c)
    rest = [c for c in pool if c not in schedule and c['enrolled'] < c['capacity']]
    free = [c for c in rest if not any(clash(c, s) for s in schedule)]
    busy = [c for c in rest if any(clash(c, s) for s in schedule)] or [
        c for c in courses if c['department'] == dept and c not in schedule and c['day'] <= 5 and c['credits'] <= 3
        and c['enrolled'] < c['capacity'] and len(c['periods']) <= 3 and c['name'] not in passed
        and c['name'] not in {s['name'] for s in schedule} and any(clash(c, s) for s in schedule)]
    free.sort(key=lambda c: 0 if c.get('requires') else 1)  # 先放一門未符先修的課，方便展示黃燈
    cart = []
    for c in free:
        if not any(clash(c, x) for x in cart):
            cart.append(c)
        if len(cart) == 2:
            break
    if busy:
        cart.insert(1 if cart else 0, busy[0])  # 刻意放一門衝堂課，方便展示提醒
    fav = [c['id'] for c in free if c not in cart][:2]
    return {'className': class_name, 'scheduleIds': [c['id'] for c in schedule], 'cart': [c['id'] for c in cart],
            'favorites': fav, 'passedCourses': passed}


plans = {
    'usr_stu_1': build_plan('資四三A', '資訊管理系', '3', [('113', '資四一'), ('114', '資四二')]),
    'usr_stu_2': build_plan('護四四A', '護理系', '4', [('112', '護四一'), ('113', '護四二'), ('114', '護四三')]),
    'usr_stu_3': build_plan('生四二A', '生死與健康心理諮商系', '2', [('114', '生四一')]),
    'usr_stu_4': build_plan('健四三A', '健康事業管理系', '3', [('113', '健四一'), ('114', '健四二')]),
}

dump = lambda name, data: json.dump(data, open(os.path.join(OUT, name), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
dump('courses.json', courses)
dump('course-history.json', history_out)
dump('demo-plans.json', plans)
print(f'{latest}: {len(courses)} 門課程，{len(history_out)} 個課名有歷年紀錄')
by_id = {c['id']: c for c in courses}
for k, p in plans.items():
    print(k, p['className'], [by_id[i]['name'] + ' ' + by_id[i]['timeStr'] for i in p['scheduleIds']], '| cart', [by_id[i]['name'] for i in p['cart']], '| passed', len(p['passedCourses']))
print('requires:', sum(1 for c in courses if c.get('requires')), 'full:', sum(1 for c in courses if c['enrolled'] >= c['capacity']), 'weekend:', sum(1 for c in courses if c['day'] > 5))
print(sorted({c['className'] for c in courses if c['className'][:2] in ('護四', '生四', '健四', '資四')}))
