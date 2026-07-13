import { json, readJson } from "./_lib/util.mjs";
import { getSession } from "./_lib/auth.mjs";
import { listUsers, createUser } from "./_lib/users.mjs";

export default async function handler(req, res) {
  try {
    const user = await getSession(req);
    if (!user) return json(res, 401, { error: "Не авторизован" });
    if (!["owner", "admin"].includes(user.role)) {
      return json(res, 403, { error: "Недостаточно прав" });
    }

    if (req.method === "GET") {
      // не отдаём хэши
      const safe = (await listUsers()).map(({ hash, salt, ...u }) => u);
      return json(res, 200, { users: safe });
    }

    if (req.method === "POST") {
      // создавать админов/редакторов может только owner
      if (user.role !== "owner") {
        return json(res, 403, { error: "Только владелец создаёт админов" });
      }
      const body = await readJson(req);
      const login = String(body.login || "").trim();
      const password = String(body.password || "");
      const role = String(body.role || "editor");
      if (login.length < 3) return json(res, 400, { error: "Логин минимум 3 символа" });
      if (password.length < 6) return json(res, 400, { error: "Пароль минимум 6 символов" });
      if (!["admin", "editor"].includes(role)) {
        return json(res, 400, { error: "Роль может быть только admin или editor" });
      }
      try {
        const created = await createUser({ login, password, role });
        const { hash, salt, ...safe } = created;
        return json(res, 201, { ok: true, user: safe });
      } catch (e) {
        return json(res, 400, { error: e.message });
      }
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error("users error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}
