import { json, readJson } from "./_lib/util.mjs";
import { getSession } from "./_lib/auth.mjs";
import { changeRole, deleteUser } from "./_lib/users.mjs";

export default async function handler(req, res, ctx) {
  try {
    const id = ctx?.params?.id;
    const user = await getSession(req);
    if (!user) return json(res, 401, { error: "Не авторизован" });
    if (user.role !== "owner") {
      return json(res, 403, { error: "Только владелец управляет правами" });
    }

    if (req.method === "PUT") {
      const body = await readJson(req);
      const newRole = String(body.role || "");
      try {
        const target = await changeRole(id, newRole);
        const { hash, salt, ...safe } = target;
        return json(res, 200, { ok: true, user: safe });
      } catch (e) {
        return json(res, 400, { error: e.message });
      }
    }

    if (req.method === "DELETE") {
      try {
        await deleteUser(id, user);
        return json(res, 200, { ok: true });
      } catch (e) {
        return json(res, 400, { error: e.message });
      }
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    console.error("users/[id] error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}
