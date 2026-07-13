import { json, readJson } from "./_lib/util.mjs";
import { getSession } from "./_lib/auth.mjs";
import { getContent, saveContent } from "./_lib/content.mjs";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const content = await getContent();
      return json(res, 200, content);
    }

    if (req.method === "PUT") {
      const user = await getSession(req);
      if (!user) return json(res, 401, { error: "Не авторизован" });
      if (!["owner", "admin", "editor"].includes(user.role)) {
        return json(res, 403, { error: "Недостаточно прав" });
      }
      const body = await readJson(req);
      const saved = await saveContent(body);
      return json(res, 200, { ok: true, updatedAt: saved.updatedAt });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error("content error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}
