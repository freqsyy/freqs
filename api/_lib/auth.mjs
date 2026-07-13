import crypto from "node:crypto";
import { kv } from "./kv.mjs";
import {
  getUserById,
  verifyUserPassword,
  changePassword as changeUserPassword,
} from "./users.mjs";

const COOKIE = "noctis_sid";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 дней в секундах

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    console.warn("[auth] SESSION_SECRET не задан — используется небезопасная заглушка.");
    return "dev-insecure-secret-change-me";
  }
  return s;
}

function hmac(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("hex");
}

// --- Сессии ---
export async function createSession(res, userId) {
  const token = crypto.randomBytes(18).toString("hex");
  await kv.set(`session:${token}`, userId, { ex: SESSION_TTL });
  const value = `${token}.${hmac(token)}`;
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}`
  );
}

export function destroySession(res, req) {
  const token = parseToken(req);
  if (token) kv.del(`session:${token}`).catch(() => {});
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function parseToken(req) {
  const header = req.headers.cookie || "";
  const m = header.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return null;
  const [token, sig] = m[1].split(".");
  if (!token || !sig) return null;
  if (hmac(token) !== sig) return null; // подпись не бьётся — отказ
  return token;
}

export async function getSession(req) {
  const token = parseToken(req);
  if (!token) return null;
  const userId = await kv.get(`session:${token}`);
  if (!userId) return null;
  const user = await getUserById(userId);
  if (!user) return null;
  const { hash, salt, ...safe } = user;
  return safe;
}

// Middleware-проверка: возвращает юзера или null
export async function requireAuth(req) {
  const user = await getSession(req);
  return user || null;
}

export function requireRole(user, ...roles) {
  return !!user && roles.includes(user.role);
}

// Хелпер для функций: достать юзера или вернуть 401/403
export function authGuard(req, res, ...roles) {
  return (async () => {
    const user = await getSession(req);
    if (!user) return { user: null, status: 401, body: { error: "Не авторизован" } };
    if (roles.length && !roles.includes(user.role)) {
      return { user, status: 403, body: { error: "Недостаточно прав" } };
    }
    return { user, status: 200, body: null };
  })();
}

// Проверка пароля (для логина) — делегируем в users.mjs
export { verifyUserPassword };

// Смена пароля (старый -> новый), для текущего юзера
export async function changePassword(userId, oldPassword, newPassword) {
  return changeUserPassword(userId, oldPassword, newPassword);
}

export { COOKIE };
