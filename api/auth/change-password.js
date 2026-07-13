import { json, readJson } from "../_lib/util.mjs";
import { getSession, changePassword } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const user = await getSession(req);
    if (!user) return json(res, 401, { error: "Не авторизован" });
    const body = await readJson(req);
    const oldP = String(body.old || "");
    const newP = String(body.new || "");
    try {
      await changePassword(user.id, oldP, newP);
      return json(res, 200, { ok: true });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  } catch (e) {
    console.error("change-password error", e);
    return json(res, 500, { error: "Внутренняя ошибка" });
  }
}
