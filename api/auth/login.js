import { loginHandler } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    const { json } = await import("../_lib/util.mjs");
    return json(res, 405, { error: "Method not allowed" });
  }
  return loginHandler(req, res);
}
