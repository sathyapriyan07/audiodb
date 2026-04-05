import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEEZER_BASE = "https://api.deezer.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const parts = (req.query.path ?? []) as string[] | string;
    const pathParts = Array.isArray(parts) ? parts : [parts];
    const upstreamPath = "/" + pathParts.filter(Boolean).join("/");

    const url = new URL(DEEZER_BASE + upstreamPath);
    for (const [k, v] of Object.entries(req.query)) {
      if (k === "path") continue;
      if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, vv));
      else if (typeof v === "string") url.searchParams.set(k, v);
    }

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "audiodb-admin-import/1.0",
        Accept: "application/json",
      },
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const body = await upstream.text();

    res.status(upstream.status);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.send(body);
  } catch (err: any) {
    res.status(500).json({ error: "Deezer proxy failed", details: err?.message ?? String(err) });
  }
}

