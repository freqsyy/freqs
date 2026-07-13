import { createClient } from "@vercel/kv";

// Ключи в KV-хранилище
export const KEYS = {
  content: "site:content",
  users: "site:users",
};

// Ищем REST URL/TOKEN среди переменных окружения с ЛЮБЫМ префиксом,
// который могла назначить интеграция Vercel (KV_, STORAGE_, UPSTASH_ и т.п.).
// Это избавляет от привязки к конкретным именам KV_REST_API_URL/TOKEN.
function pickEnv(suffix) {
  const env = process.env || {};
  const canonical = "KV_" + suffix;
  if (env[canonical]) return env[canonical];
  for (const key of Object.keys(env)) {
    if (key.endsWith(suffix) && env[key]) return env[key];
  }
  return undefined;
}

const url = pickEnv("REST_API_URL");
const token = pickEnv("REST_API_TOKEN");

// Если переменные найдены — создаём реального клиента.
// Если нет — «пустышка»: get вернёт null (сайт покажет дефолтный контент),
// set бросит понятную ошибку (нужна для админки).
export const kv =
  url && token
    ? createClient({ url, token })
    : {
        async get() {
          return null;
        },
        async set() {
          throw new Error(
            "KV не настроен: не найдены переменные REST_API_URL / REST_API_TOKEN"
          );
        },
      };

export const KV_READY = Boolean(url && token);
