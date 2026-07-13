import { json } from "./_lib/util.mjs";
import { getSession } from "./_lib/auth.mjs";
import { makeOwner } from "./_lib/users.mjs";

export default async function handler(req, res, ctx) {
  try {
    const id = ctx?.params?.id;
    const user = await getSession(req);
    if (!user) return json(res, 401, { error: "Не авторизован" });
    if (user.role !== "owner") {
      return json(res, 403, { error: "Только владелец назначает совладельцев" });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    try {
      const target = await makeOwner(id);
      const { hash, salt, ...safe } = target;
      return json(res, 200, { ok: true, user: safe });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  } catch (e) {
    console.error("users/[id]/make-owner error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}
