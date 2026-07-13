import { json, readJson } from "./_lib/util.mjs";
import { getSession, createSession, destroySession, verifyUserPassword } from "./_lib/auth.mjs";
import { getUserByLogin } from "./_lib/users.mjs";

export default async function handler(req, res) {
  try {
    if (req.method === "GET" && req.url.startsWith("/api/auth/me")) {
      const user = await getSession(req);
      return json(res, 200, { user: user || null });
    }

    if (req.method === "POST" && req.url.startsWith("/api/auth/login")) {
      const body = await readJson(req);
      const login = String(body.login || "").trim();
      const password = String(body.password || "");
      const user = await getUserByLogin(login);
      if (!user || !(await verifyUserPassword(password, user))) {
        return json(res, 401, { error: "Неверный логин или пароль" });
      }
      await createSession(res, user.id);
      const { hash, salt, ...safe } = user;
      return json(res, 200, { ok: true, user: safe });
    }

    if (req.method === "POST" && req.url.startsWith("/api/auth/logout")) {
      destroySession(res, req);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error("auth error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}
