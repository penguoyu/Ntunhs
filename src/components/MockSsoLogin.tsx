import React, { useState } from 'react';
import { UserAccount } from '../types';
import { DEMO_PASSWORD_HASH, sha256Hex } from '../data/users';
import {
  CLIENT_ID,
  REDIRECT_URI,
  SCOPES,
  SCOPE_LABELS,
  SSO_AUTHORIZE_ENDPOINT,
  SSO_TOKEN_ENDPOINT,
  authorize,
  decodeJwt,
  exchangeToken,
  pkceChallenge,
  randomString,
  saveToken,
  verifyJwt,
  SsoClaims,
} from '../lib/mockOAuth';

interface MockSsoLoginProps {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}

type Stage = 'start' | 'sso-login' | 'consent' | 'callback' | 'token' | 'done' | 'error';

const STEPS: { key: Stage[]; title: string }[] = [
  { key: ['start'], title: '產生 PKCE 與 state' },
  { key: ['sso-login'], title: '導向 SSO 登入' },
  { key: ['consent'], title: '使用者同意授權' },
  { key: ['callback'], title: '帶授權碼導回' },
  { key: ['token'], title: '授權碼換 JWT' },
  { key: ['done'], title: '驗證權杖並登入' },
];

const short = (s: string, n = 10) => (s.length > n * 2 ? `${s.slice(0, n)}…${s.slice(-4)}` : s);
const fmtTime = (sec: number) =>
  new Date(sec * 1000).toLocaleString('zh-TW', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

const Explain: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-primary leading-relaxed">
    <span className="material-symbols-outlined text-[15px] align-[-3px] mr-1">info</span>
    {children}
  </div>
);

const Http: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-all overflow-x-auto">
    {children}
  </pre>
);

export const MockSsoLogin: React.FC<MockSsoLoginProps> = ({ users, onLogin, onClose, showToast }) => {
  const [stage, setStage] = useState<Stage>('start');
  const [state, setState] = useState('');
  const [verifier, setVerifier] = useState('');
  const [challenge, setChallenge] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [ssoUser, setSsoUser] = useState<UserAccount | null>(null);
  const [code, setCode] = useState('');
  const [returnedState, setReturnedState] = useState('');
  const [token, setToken] = useState('');
  const [claims, setClaims] = useState<SsoClaims | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [tamperResult, setTamperResult] = useState('');
  const [busy, setBusy] = useState(false);

  const stepIndex = stage === 'error' ? -1 : STEPS.findIndex(s => s.key.includes(stage));
  const scope = SCOPES.join(' ');
  const authorizeUrl = `${SSO_AUTHORIZE_ENDPOINT}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI,
  )}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;

  const fail = (msg: string) => {
    setErrorMsg(msg);
    setStage('error');
  };

  const reset = () => {
    setStage('start');
    setState('');
    setVerifier('');
    setChallenge('');
    setPassword('');
    setSsoUser(null);
    setCode('');
    setReturnedState('');
    setToken('');
    setClaims(null);
    setErrorMsg('');
    setTamperResult('');
  };

  const begin = async () => {
    if (!window.crypto?.subtle) {
      showToast('瀏覽器不支援加密功能，請改用 localhost 或 HTTPS 網址開啟');
      return;
    }
    const v = randomString(32);
    setVerifier(v);
    setChallenge(await pkceChallenge(v));
    setState(randomString(12));
    setStage('sso-login');
  };

  const ssoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = account.trim().toLowerCase();
    const u = users.find(x => x.username.toLowerCase() === q || x.email.toLowerCase() === q || x.studentId === q);
    if (!u) return showToast('SSO：查無此帳號');
    if (u.status !== 'active') return showToast('SSO：此帳號已停用');
    if ((await sha256Hex(password)) !== (u.passwordHash ?? DEMO_PASSWORD_HASH)) {
      setPassword('');
      return showToast('SSO：帳號或密碼錯誤');
    }
    setSsoUser(u);
    setStage('consent');
  };

  const approve = () => {
    if (!ssoUser) return;
    const c = authorize({ user: ssoUser, clientId: CLIENT_ID, redirectUri: REDIRECT_URI, codeChallenge: challenge, scope });
    setCode(c);
    setReturnedState(state);
    setStage('callback');
  };

  const deny = () => fail('使用者拒絕授權 (error=access_denied)。課程系統不會取得任何個人資料。');

  const getToken = async () => {
    if (returnedState !== state) return fail('state 不符，可能是 CSRF 攻擊，已中止登入。');
    setBusy(true);
    const res = await exchangeToken({ code, codeVerifier: verifier, clientId: CLIENT_ID, redirectUri: REDIRECT_URI }, users);
    setBusy(false);
    if (!res.ok) return fail(`${res.error}：${res.error_description}`);
    setToken(res.access_token);
    setClaims(decodeJwt(res.access_token).payload);
    setStage('token');
  };

  const tamper = async () => {
    const [h, , s] = token.split('.');
    const payload = { ...decodeJwt(token).payload, role: 'admin' };
    const forged = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const r = await verifyJwt(`${h}.${forged}.${s}`);
    setTamperResult(r.ok ? '（意外）竄改後仍通過驗證' : `把 role 改成 admin 後：${r.reason}`);
  };

  const finish = async () => {
    const r = await verifyJwt(token);
    if (!r.ok) return fail(r.reason);
    const u = users.find(x => x.id === r.claims.sub);
    if (!u) return fail('權杖中的使用者不存在於本系統');
    saveToken(token);
    setStage('done');
    onLogin(u);
    showToast(`已透過北護 SSO (OAuth 2.0 模擬) 登入：${u.name}，自動帶入 ${r.claims.department}`);
    onClose();
  };

  const demoAccounts = users.filter(u => u.status === 'active').slice(0, 6);
  const [jh, jp, js] = token ? token.split('.') : ['', '', ''];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <span className="material-symbols-outlined text-[16px]">science</span>
        <span>
          <b>模擬展示</b>：授權伺服器與權杖端點都在瀏覽器中執行，並非真正的學校 SSO。
        </span>
      </div>

      {/* 流程進度 */}
      <ol className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {STEPS.map((s, i) => {
          const done = stepIndex > i;
          const active = stepIndex === i;
          return (
            <li
              key={s.title}
              className={`rounded-lg px-1.5 py-1.5 text-center text-[10.5px] leading-tight border ${
                active
                  ? 'bg-primary text-white border-primary'
                  : done
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-surface-container-low text-text-muted border-border-subtle'
              }`}
            >
              <div className="font-semibold">{done ? '✓' : i + 1}</div>
              <div>{s.title}</div>
            </li>
          );
        })}
      </ol>

      {stage === 'start' && (
        <div className="space-y-3">
          <Explain>
            課程系統是 OAuth 2.0 的<b>用戶端 (Client)</b>，不直接經手密碼。登入前先產生隨機的 <code>state</code>（防 CSRF）與
            <code> code_verifier</code>，再把它做 SHA-256 得到 <code>code_challenge</code>（PKCE，防止授權碼被攔截後冒用）。
          </Explain>
          <button
            onClick={begin}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary-container active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">shield_person</span>
            <span>以北護 SSO 登入（OAuth 2.0）</span>
          </button>
        </div>
      )}

      {stage === 'sso-login' && (
        <div className="space-y-3">
          <Explain>
            瀏覽器被導向學校的<b>授權伺服器</b>。帳號密碼只輸入在 SSO 頁面，課程系統看不到。網址列帶著 client_id、scope、state 與
            code_challenge。
          </Explain>
          <Http>{`GET ${authorizeUrl.replace('?', '\n  ?').replace(/&/g, '\n  &')}`}</Http>
          <div className="rounded-2xl border border-border-strong overflow-hidden">
            <div className="bg-slate-100 px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-600 border-b border-border-subtle">
              <span className="material-symbols-outlined text-[14px] text-emerald-700">lock</span>
              <span className="font-mono truncate">sso.ntunhs.edu.tw/oauth2/authorize</span>
            </div>
            <form onSubmit={ssoSignIn} className="p-4 space-y-3 bg-white">
              <div className="text-sm font-semibold text-on-surface">國立臺北護理健康大學 單一簽入 (模擬)</div>
              <input
                value={account}
                onChange={e => setAccount(e.target.value)}
                required
                placeholder="學號 / 工號 / Email"
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="密碼（示範：ntunhs2026）"
                className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface-bg text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {demoAccounts.map(u => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => {
                      setAccount(u.username);
                      setPassword('ntunhs2026');
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] border border-border-subtle bg-surface-container-low hover:border-primary/40"
                  >
                    {u.name}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container">
                登入 SSO
              </button>
            </form>
          </div>
        </div>
      )}

      {stage === 'consent' && ssoUser && (
        <div className="space-y-3">
          <Explain>
            SSO 驗證身分後，詢問使用者是否同意讓「北護課程通」讀取下列資料 (<b>scope</b>)。使用者可以拒絕。
          </Explain>
          <div className="rounded-2xl border border-border-strong p-4 space-y-3 bg-white">
            <div className="text-sm">
              <b>北護課程通</b> 想要存取您的帳號 <span className="font-semibold text-primary">{ssoUser.name}</span>
            </div>
            <ul className="space-y-1.5">
              {SCOPES.map(s => (
                <li key={s} className="flex items-start gap-2 text-xs">
                  <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                  <span>
                    <code className="font-mono text-[11px] bg-surface-container px-1 rounded">{s}</code> {SCOPE_LABELS[s]}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={deny} className="flex-1 py-2 rounded-xl border border-border-strong text-sm hover:bg-surface-container-low">
                拒絕
              </button>
              <button onClick={approve} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container">
                同意並授權
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'callback' && (
        <div className="space-y-3">
          <Explain>
            SSO 把瀏覽器導回課程系統，網址帶著一次性的<b>授權碼 (code)</b>，60 秒內有效。課程系統先確認回傳的 state
            和自己產生的相同，才繼續。
          </Explain>
          <Http>{`302 Found\nLocation: ${REDIRECT_URI}\n  ?code=${code}\n  &state=${returnedState}`}</Http>
          <div className="text-xs flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            state 檢查：{returnedState === state ? '相符' : '不相符'}
          </div>
          <button
            onClick={getToken}
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container disabled:opacity-60"
          >
            以授權碼換取權杖
          </button>
        </div>
      )}

      {stage === 'token' && claims && (
        <div className="space-y-3">
          <Explain>
            課程系統把授權碼和當初的 <code>code_verifier</code> 送到權杖端點。伺服器重算 SHA-256 與 code_challenge 相符後，回傳簽章過的
            <b> JWT</b>。JWT 由三段組成：標頭、內容 (claims)、簽章。
          </Explain>
          <Http>{`POST ${SSO_TOKEN_ENDPOINT}\ngrant_type=authorization_code\n&code=${short(code)}\n&code_verifier=${short(verifier)}\n&client_id=${CLIENT_ID}`}</Http>
          <div className="font-mono text-[11px] break-all rounded-xl border border-border-subtle p-3 bg-surface-bg leading-relaxed">
            <span className="text-rose-600">{jh}</span>.<span className="text-primary">{jp}</span>.
            <span className="text-secondary">{js}</span>
          </div>
          <table className="w-full text-xs border border-border-subtle rounded-xl overflow-hidden">
            <tbody>
              {[
                ['學號 (student_id)', claims.student_id ?? '—（教職員）'],
                ['姓名 (name)', claims.name],
                ['系所 (department)', claims.department],
                ['身分 (role)', claims.role === 'admin' ? '課程管理者' : '學生'],
                ['授權範圍 (scope)', claims.scope],
                ['簽發時間 (iat)', fmtTime(claims.iat)],
                ['到期時間 (exp)', `${fmtTime(claims.exp)}（1 小時）`],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-border-subtle last:border-0">
                  <td className="px-3 py-1.5 text-text-muted bg-surface-container-low w-36">{k}</td>
                  <td className="px-3 py-1.5 font-medium">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={tamper} className="flex-1 py-2 rounded-xl border border-border-strong text-xs hover:bg-surface-container-low">
              示範：竄改權杖內容
            </button>
            <button onClick={finish} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container">
              驗證簽章並登入
            </button>
          </div>
          {tamperResult && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{tamperResult}</div>}
        </div>
      )}

      {stage === 'error' && (
        <div className="space-y-3">
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-3">{errorMsg}</div>
          <button onClick={reset} className="w-full py-2.5 rounded-xl border border-border-strong text-sm hover:bg-surface-container-low">
            重新開始
          </button>
        </div>
      )}

      {stage !== 'start' && stage !== 'error' && (
        <button onClick={reset} className="text-[11px] text-text-muted hover:text-primary underline">
          重新開始流程
        </button>
      )}
    </div>
  );
};
