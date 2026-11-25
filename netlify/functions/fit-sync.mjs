// Synchronizácia dát appky ZenKodMyFit medzi zariadeniami (Netlify Blobs).
import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  const code = new URL(req.url).searchParams.get("code") || "";
  if (!/^[A-Za-z0-9]{20,64}$/.test(code)) return json({ error: "bad code" }, 400);
  const store = getStore("fit-sync");

  if (req.method === "GET") {
    const data = await store.get(code);
    return new Response(data || "null", { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  if (req.method === "PUT") {
    const text = await req.text();
    if (text.length > 3_000_000) return json({ error: "too large" }, 413);
    try { const d = JSON.parse(text); if (!d || typeof d !== "object" || !d.goals) throw 0; } catch { return json({ error: "bad data" }, 400); }
    await store.set(code, text);
    return json({ ok: true });
  }
  return json({ error: "method" }, 405);
};

export const config = { path: "/api/fit-sync" };
