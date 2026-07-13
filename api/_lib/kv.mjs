import { kv } from "@vercel/kv";

export { kv };

// Ключи в KV-хранилище
export const KEYS = {
  content: "site:content",
  users: "site:users",
};
