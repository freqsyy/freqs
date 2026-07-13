import { json } from "./_lib/util.mjs";
import { getSession } from "./_lib/auth.mjs";
import { transferOwnership } from "./_lib/users.mjs";

export default async function handler(req, res, ctx) {
  try {
    const id = ctx?.params?.id;
    const user = await getSession(req);
    if (!user) return json(res, 401, { error: "Не авторизован" });
    if (user.role !== "owner") {
      return json(res, 403, { error: "Только владелец передаёт права" });
    }
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    try {
      const result = await transferOwnership(user.id, id);
      return json(res, 200, { ok: true, from: noSecret(result.from), target: noSecret(result.target) });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  } catch (e) {
    console.error("users/[id]/transfer error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}

function noSecret(u) {
  const { hash, salt, ...safe } = u;
  return safe;
}
