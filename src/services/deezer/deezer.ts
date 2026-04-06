import { z } from "zod";

const DeezerArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
  link: z.string().optional(),
  picture: z.string().nullable().optional(),
  picture_medium: z.string().nullable().optional(),
  picture_xl: z.string().nullable().optional(),
});

const DeezerAlbumSchema = z.object({
  id: z.number(),
  title: z.string(),
  link: z.string().optional(),
  cover: z.string().nullable().optional(),
  cover_medium: z.string().nullable().optional(),
  cover_xl: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  artist: DeezerArtistSchema.optional(),
});

const DeezerTrackSchema = z.object({
  id: z.number(),
  title: z.string(),
  duration: z.number().int().nullable().optional(),
  preview: z.string().url().nullable().optional(),
  link: z.string().optional(),
  artist: DeezerArtistSchema,
  contributors: z.array(DeezerArtistSchema).optional(),
  album: DeezerAlbumSchema,
});

const SearchResponseSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number().optional(),
  next: z.string().optional(),
});

export type DeezerArtist = z.infer<typeof DeezerArtistSchema>;
export type DeezerAlbum = z.infer<typeof DeezerAlbumSchema>;
export type DeezerTrack = z.infer<typeof DeezerTrackSchema>;

function getSupabaseFunctionsBaseUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  try {
    const u = new URL(supabaseUrl);
    // https://<ref>.supabase.co -> https://<ref>.functions.supabase.co
    u.hostname = u.hostname.replace(".supabase.co", ".functions.supabase.co");
    u.pathname = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

async function fetchJsonWithContentTypeCheck(url: string) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Deezer API error (${res.status}): ${text || res.statusText}`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`Non-JSON response (content-type: ${contentType}): ${text.slice(0, 120)}`);
  }
  return (await res.json()) as unknown;
}

async function deezerGet<T>(path: string, params?: Record<string, string>) {
  const relPath = path.replace(/^\/+/, "");
  const url = new URL(`/api/deezer/${relPath}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  try {
    return (await fetchJsonWithContentTypeCheck(url.toString())) as T;
  } catch (e) {
    // Production fallback: if Vercel isn't deploying /api/* serverless functions,
    // use a Supabase Edge Function proxy instead.
    const fnBase = getSupabaseFunctionsBaseUrl();
    if (!fnBase) throw e;

    const fnUrl = new URL(`${fnBase}/deezer-proxy/${relPath}`);
    if (params) for (const [k, v] of Object.entries(params)) fnUrl.searchParams.set(k, v);

    const res = await fetch(fnUrl.toString(), {
      method: "GET",
      headers: {
        // Works whether verify_jwt is on or off (public key is okay to send).
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Deezer proxy failed (Supabase Edge Function). Deploy 'deezer-proxy' in Supabase. (${res.status}): ${text || res.statusText}`,
      );
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await res.text().catch(() => "");
      throw new Error(`Deezer proxy (Supabase) returned non-JSON: ${text.slice(0, 120)}`);
    }
    return (await res.json()) as T;
  }
}

export async function searchDeezerTracks(q: string) {
  const json = await deezerGet<any>("search", { q });
  const parsed = SearchResponseSchema.parse(json);
  return parsed.data.map((r) => DeezerTrackSchema.safeParse(r)).filter((p) => p.success).map((p) => p.data);
}

export async function searchDeezerAlbums(q: string) {
  const json = await deezerGet<any>("search/album", { q });
  const parsed = SearchResponseSchema.parse(json);
  return parsed.data.map((r) => DeezerAlbumSchema.safeParse(r)).filter((p) => p.success).map((p) => p.data);
}

export async function searchDeezerArtists(q: string) {
  const json = await deezerGet<any>("search/artist", { q });
  const parsed = SearchResponseSchema.parse(json);
  return parsed.data.map((r) => DeezerArtistSchema.safeParse(r)).filter((p) => p.success).map((p) => p.data);
}

export async function getDeezerTrack(id: number) {
  const json = await deezerGet<any>(`track/${id}`);
  return DeezerTrackSchema.parse(json);
}

export async function getDeezerAlbum(id: number) {
  const json = await deezerGet<any>(`album/${id}`);
  // album endpoint has extra fields including tracks; we keep album shape and pass-through
  return json as any;
}

export async function getDeezerArtist(id: number) {
  const json = await deezerGet<any>(`artist/${id}`);
  return json as any;
}
