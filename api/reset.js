import { json } from "./_lib/util.mjs";
import { kv, KEYS } from "./_lib/kv.mjs";

// ВРЕМЕННЫЙ одноразовый endpoint для сброса админки (стирает site:users в KV).
// Удаляется сразу после использования. Токен — одноразовый.
const RESET_TOKEN = "n0ct1s-r3set-9f3a7b";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");
    if (token !== RESET_TOKEN) {
      return json(res, 401, { error: "Неверный токен сброса" });
    }
    await kv.del(KEYS.users);
    return json(res, 200, {
      ok: true,
      message: "site:users удалён. Открой /admin.html — там форма «Первый запуск». Задай freqsyy / adminartem.",
    });
  } catch (e) {
    console.error("reset error", e);
    return json(res, 500, { error: String(e?.message || e) });
  }
}
