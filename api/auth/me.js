import { meHandler } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    const { json } = await import("../_lib/util.mjs");
    return json(res, 405, { error: "Method not allowed" });
  }
  return meHandler(req, res);
}
