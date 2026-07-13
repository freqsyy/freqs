import { json, readJson } from "./_lib/util.mjs";
import { needsSetup, createFirstOwner } from "./_lib/users.mjs";
import { getSession, createSession } from "./_lib/auth.mjs";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const needed = await needsSetup();
      return json(res, 200, { needsSetup: needed });
    }
    if (req.method === "POST") {
      // запрещаем повторный setup, если уже есть юзеры
      if (!(await needsSetup())) {
        return json(res, 409, { error: "Сайт уже настроен" });
      }
      const body = await readJson(req);
      const login = String(body.login || "").trim();
      const password = String(body.password || "");
      if (login.length < 3) {
        return json(res, 400, { error: "Логин минимум 3 символа" });
      }
      if (password.length < 6) {
        return json(res, 400, { error: "Пароль минимум 6 символов" });
      }
      const owner = await createFirstOwner(login, password);
      // сразу открываем сессию владельцу
      await createSession(res, owner.id);
      const { hash, salt, ...safe } = owner;
      return json(res, 201, { ok: true, user: safe });
    }
    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error("setup error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}
