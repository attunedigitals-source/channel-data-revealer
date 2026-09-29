/**
 * Small shared client for "prompt in, JSON out" AI calls (Gemini or OpenAI),
 * with optional image inputs so vision analysis actually looks at the image.
 *
 * Model names are env-overridable (GEMINI_MODEL / OPENAI_MODEL) so a provider
 * renaming or retiring a model doesn't require a code change.
 */

import { detectAiProvider, fetchWithTimeout } from "./server-config";

const GEMINI_MODEL = () => process.env["GEMINI_MODEL"]?.trim() || "gemini-2.0-flash";
const OPENAI_MODEL = () => process.env["OPENAI_MODEL"]?.trim() || "gpt-4o-mini";

export type ImageInput = { mimeType: string; base64: string };

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

/**
 * Load an image from a data: URL or a public http(s) URL so it can be sent
 * to a vision model. Returns null (never throws) if the input is empty,
 * unsupported, too large, or points at a private network address.
 *
 * Note: this blocks obvious private hostnames/IPs but cannot defend against
 * DNS rebinding; don't expose this to untrusted multi-tenant traffic without
 * also restricting egress at the network layer.
 */
export async function loadImageForVision(source: string | undefined): Promise<ImageInput | null> {
  const src = source?.trim();
  if (!src) return null;

  try {
    const dataMatch = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(src);
    if (dataMatch) {
      const mimeType = dataMatch[1]!.toLowerCase();
      const base64 = dataMatch[2]!;
      if (!ALLOWED_MIME.has(mimeType)) return null;
      if (Math.floor((base64.length * 3) / 4) > MAX_IMAGE_BYTES) return null;
      return { mimeType, base64 };
    }

    const url = new URL(src);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (isPrivateHost(url.hostname)) return null;

    const res = await fetchWithTimeout(url.toString(), { redirect: "error" }, 10_000);
    if (!res.ok) return null;
    const mimeType = (res.headers.get("content-type") || "").split(";")[0]!.trim().toLowerCase();
    if (!ALLOWED_MIME.has(mimeType)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;
    return { mimeType, base64: buf.toString("base64") };
  } catch {
    return null;
  }
}

function parseJsonLoose(raw: string): any {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

/** Send a prompt (plus optional images) and get back parsed JSON. Throws on any failure. */
export async function callAiJson(opts: {
  apiKey: string;
  prompt: string;
  images?: ImageInput[];
  temperature?: number;
  timeoutMs?: number;
}): Promise<any> {
  const { apiKey, prompt, images = [], temperature = 0.3, timeoutMs = 60_000 } = opts;
  const provider = detectAiProvider(apiKey);

  if (provider === "gemini") {
    const parts: any[] = [
      { text: prompt },
      ...images.map((i) => ({ inlineData: { mimeType: i.mimeType, data: i.base64 } })),
    ];
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL()}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: "application/json", temperature },
        }),
      },
      timeoutMs,
    );
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const json = await res.json();
    return parseJsonLoose(json.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
  }

  const content: any[] = [
    { type: "text", text: prompt },
    ...images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.mimeType};base64,${i.base64}` } })),
  ];
  const res = await fetchWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL(),
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
        temperature,
      }),
    },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const json = await res.json();
  return parseJsonLoose(json.choices?.[0]?.message?.content || "{}");
}
