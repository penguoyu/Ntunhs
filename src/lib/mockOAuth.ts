/**
 * 模擬「北護 SSO」OAuth 2.0 授權伺服器（Authorization Code + PKCE）。
 *
 * ⚠ 這是課堂展示用的模擬：授權伺服器與權杖端點都在瀏覽器裡執行，
 * JWT 以前端寫死的示範金鑰簽章（HS256），不是真正的學校 SSO，也不能防止竄改。
 * 真實系統中，/authorize 與 /token 位於學校的認證伺服器，簽章金鑰只存在伺服器端。
 */
import { UserAccount } from '../types';

export const SSO_ISSUER = 'https://sso.ntunhs.edu.tw（模擬）';
export const SSO_AUTHORIZE_ENDPOINT = 'https://sso.ntunhs.edu.tw/oauth2/authorize';
export const SSO_TOKEN_ENDPOINT = 'https://sso.ntunhs.edu.tw/oauth2/token';
export const CLIENT_ID = 'ntunhs-course-master';
export const REDIRECT_URI = 'https://penguoyu.github.io/Ntunhs/callback';
export const SCOPES = ['openid', 'profile', 'student:read'];
export const SCOPE_LABELS: Record<string, string> = {
  openid: '確認您的身分（學號 / 工號）',
  profile: '讀取姓名、Email 與所屬系所',
  'student:read': '讀取學籍資料（年級、班級），用於自動帶入系所課程',
};

/** 展示用簽章金鑰；真實系統絕不會把金鑰放在前端 */
const DEMO_SIGNING_KEY = 'ntunhs-sso-demo-signing-key-group5';
const CODE_TTL_MS = 60_000;
const TOKEN_TTL_S = 60 * 60;
const CODE_STORE_KEY = 'ntunhs_sso_codes';
export const TOKEN_STORE_KEY = 'ntunhs_sso_token';

/* ---------- base64url 與隨機字串 ---------- */

const enc = new TextEncoder();

const bytesToB64url = (bytes: Uint8Array) => {
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const strToB64url = (s: string) => bytesToB64url(enc.encode(s));
const b64urlToBytes = (s: string): Uint8Array<ArrayBuffer> => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  return Uint8Array.from(atob(pad), c => c.charCodeAt(0));
};
const b64urlToStr = (s: string) => new TextDecoder().decode(b64urlToBytes(s));

export const randomString = (byteLength = 32) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToB64url(bytes);
};

/* ---------- PKCE ---------- */

export const pkceChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(verifier));
  return bytesToB64url(new Uint8Array(digest));
};

/* ---------- JWT (HS256) ---------- */

const hmacKey = () =>
  crypto.subtle.importKey('raw', enc.encode(DEMO_SIGNING_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);

export interface SsoClaims {
  iss: string;
  aud: string;
  sub: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  student_id?: string;
  department: string;
  scope: string;
  iat: number;
  exp: number;
}

const signJwt = async (claims: SsoClaims) => {
  const header = strToB64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = strToB64url(JSON.stringify(claims));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(`${header}.${payload}`));
  return `${header}.${payload}.${bytesToB64url(new Uint8Array(sig))}`;
};

export const decodeJwt = (token: string) => {
  const [h, p] = token.split('.');
  return { header: JSON.parse(b64urlToStr(h)), payload: JSON.parse(b64urlToStr(p)) as SsoClaims };
};

/** 用戶端驗證權杖：簽章、發行者、受眾、到期時間 */
export const verifyJwt = async (token: string): Promise<{ ok: true; claims: SsoClaims } | { ok: false; reason: string }> => {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: '權杖格式錯誤' };
  const [h, p, s] = parts;
  let sigBytes: Uint8Array<ArrayBuffer>;
  try {
    sigBytes = b64urlToBytes(s);
  } catch {
    return { ok: false, reason: '權杖格式錯誤' };
  }
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(), sigBytes, enc.encode(`${h}.${p}`));
  if (!valid) return { ok: false, reason: '簽章驗證失敗（權杖可能被竄改）' };
  const { payload } = decodeJwt(token);
  if (payload.iss !== SSO_ISSUER) return { ok: false, reason: '發行者 (iss) 不符' };
  if (payload.aud !== CLIENT_ID) return { ok: false, reason: '受眾 (aud) 不是本系統' };
  if (payload.exp * 1000 < Date.now()) return { ok: false, reason: '權杖已過期' };
  return { ok: true, claims: payload };
};

/* ---------- 模擬授權伺服器 ---------- */

interface PendingCode {
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string;
  expiresAt: number;
}

const readCodes = (): Record<string, PendingCode> => {
  try {
    return JSON.parse(sessionStorage.getItem(CODE_STORE_KEY) || '{}');
  } catch {
    return {};
  }
};
const writeCodes = (codes: Record<string, PendingCode>) => {
  try {
    sessionStorage.setItem(CODE_STORE_KEY, JSON.stringify(codes));
  } catch {
    /* 無法儲存時，授權碼只在本次流程有效 */
  }
};

/** GET /oauth2/authorize：使用者登入並同意後，核發一次性授權碼 */
export const authorize = (params: {
  user: UserAccount;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string;
}) => {
  const code = randomString(18);
  const codes = readCodes();
  codes[code] = {
    userId: params.user.id,
    clientId: params.clientId,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge,
    scope: params.scope,
    expiresAt: Date.now() + CODE_TTL_MS,
  };
  writeCodes(codes);
  return code;
};

export type TokenResult =
  | { ok: true; access_token: string; token_type: 'Bearer'; expires_in: number; scope: string }
  | { ok: false; error: string; error_description: string };

/** POST /oauth2/token：以授權碼 + code_verifier 換取 JWT */
export const exchangeToken = async (
  params: { code: string; codeVerifier: string; clientId: string; redirectUri: string },
  users: UserAccount[],
): Promise<TokenResult> => {
  const codes = readCodes();
  const entry = codes[params.code];
  // 授權碼只能使用一次
  delete codes[params.code];
  writeCodes(codes);

  if (!entry) return { ok: false, error: 'invalid_grant', error_description: '授權碼不存在或已使用過' };
  if (entry.expiresAt < Date.now()) return { ok: false, error: 'invalid_grant', error_description: '授權碼已逾時（60 秒）' };
  if (entry.clientId !== params.clientId || entry.redirectUri !== params.redirectUri)
    return { ok: false, error: 'invalid_client', error_description: 'client_id 或 redirect_uri 不符' };
  if ((await pkceChallenge(params.codeVerifier)) !== entry.codeChallenge)
    return { ok: false, error: 'invalid_grant', error_description: 'PKCE 驗證失敗：code_verifier 與 code_challenge 不符' };

  const user = users.find(u => u.id === entry.userId);
  if (!user || user.status !== 'active')
    return { ok: false, error: 'access_denied', error_description: '帳號不存在或已停用' };

  const now = Math.floor(Date.now() / 1000);
  const access_token = await signJwt({
    iss: SSO_ISSUER,
    aud: CLIENT_ID,
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    student_id: user.studentId,
    department: user.department,
    scope: entry.scope,
    iat: now,
    exp: now + TOKEN_TTL_S,
  });
  return { ok: true, access_token, token_type: 'Bearer', expires_in: TOKEN_TTL_S, scope: entry.scope };
};

export const saveToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_STORE_KEY, token);
  } catch {
    /* ignore */
  }
};
export const loadToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORE_KEY);
  } catch {
    return null;
  }
};
export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORE_KEY);
  } catch {
    /* ignore */
  }
};
