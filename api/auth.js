import { json } from "./_lib/util.mjs";
import { meHandler, loginHandler, logoutHandler } from "./_lib/auth.mjs";

// /api/auth — делегирует по методу+подпути (для обратной совместимости).
// Основные пути: /api/auth/me, /api/auth/login, /api/auth/logout (свои файлы).
export default async function handler(req, res) {
  try {
    const url = req.url || "";
    if (req.method === "GET" && url.includes("/auth/me")) return meHandler(req, res);
    if (req.method === "POST" && url.includes("/auth/login")) return loginHandler(req, res);
    if (req.method === "POST" && url.includes("/auth/logout")) return logoutHandler(req, res);
    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error("auth error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}
