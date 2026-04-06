// Supabase Edge Function: deezer-proxy
// Proxies Deezer public API to avoid browser CORS limitations.

const DEEZER_BASE = "https://api.deezer.com";

function corsHeaders(origin: string | null) {
  // Allow browser clients. If you want to lock this down, replace "*" with your domain(s).
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, accept",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    Vary: "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "content-type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);

    // Supports both:
    // - /functions/v1/deezer-proxy/search?q=...
    // - /functions/v1/deezer-proxy/track/123
    const pathParts = url.pathname.split("/").filter(Boolean);
    const fnIndex = pathParts.findIndex((p) => p === "deezer-proxy");
    const upstreamPath =
      fnIndex >= 0 ? "/" + pathParts.slice(fnIndex + 1).join("/") : "/";

    const upstreamUrl = new URL(DEEZER_BASE + upstreamPath);
    url.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v));

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "audiodb-edge-deezer-proxy/1.0",
        Accept: "application/json",
      },
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...headers,
        "content-type": contentType,
        // Cache at the edge; Deezer data is public and fairly stable.
        "cache-control": "public, max-age=60",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Proxy failed", details: String(e) }), {
      status: 500,
      headers: { ...headers, "content-type": "application/json" },
    });
  }
});

