/**
 * Centralized, server-only resolution of API keys and small shared helpers
 * (timeouts, provider detection) used across every *.functions.ts file.
 *
 * IMPORTANT: None of these env vars should ever be prefixed with VITE_.
 * Vite inlines any VITE_-prefixed variable into the client bundle for code
 * that references it from client-side modules. These values are secrets
 * (the user's own YouTube/AI API keys or a shared server default) and must
 * only ever be read on the server, inside a createServerFn handler.
 */

export type AiProvider = "gemini" | "openai";

/** Resolve the YouTube Data API key: user-supplied key wins, then server env. */
export function resolveYoutubeKey(userKey?: string | undefined): string | undefined {
  const trimmed = userKey?.trim();
  if (trimmed) return trimmed;
  return process.env["YOUTUBE_API_KEY"]?.trim() || undefined;
}

/** Resolve an AI key (Gemini or OpenAI): user-supplied key wins, then server env. */
export function resolveAiKey(userKey?: string | undefined): string | undefined {
  const trimmed = userKey?.trim();
  if (trimmed) return trimmed;
  return (
    process.env["GEMINI_API_KEY"]?.trim() ||
    process.env["AI_API_KEY"]?.trim() ||
    process.env["OPENAI_API_KEY"]?.trim() ||
    undefined
  );
}

/** Whether a resolved server-side key exists at all, without revealing it. */
export function hasServerYoutubeKey(): boolean {
  return Boolean(process.env["YOUTUBE_API_KEY"]?.trim());
}

export function hasServerAiKey(): boolean {
  return Boolean(
    process.env["GEMINI_API_KEY"]?.trim() ||
      process.env["AI_API_KEY"]?.trim() ||
      process.env["OPENAI_API_KEY"]?.trim(),
  );
}

/**
 * Detect which provider an AI key belongs to. Gemini keys are 39 chars and
 * start with "AIza"; OpenAI keys start with "sk-". This is a heuristic, not
 * a guarantee — callers should still handle an API error from the wrong
 * provider gracefully.
 */
export function detectAiProvider(key: string): AiProvider {
  if (key.startsWith("sk-")) return "openai";
  return "gemini";
}

/**
 * fetch() with a hard timeout. Every external call (YouTube Data API,
 * Gemini/OpenAI, scraping YouTube's public pages) should go through this so
 * one slow upstream host can't hang a request indefinitely.
 */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: init.signal ?? controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Request to ${new URL(input).hostname} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Small retry wrapper for transient upstream failures (network blips, 429s,
 * 5xx). Does not retry on 4xx errors other than 429, since those are
 * caller mistakes (bad key, bad params) that won't succeed on retry.
 */
export async function fetchWithRetry(
  input: string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; retries?: number; backoffMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 15_000, retries = 2, backoffMs = 400 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(input, init, timeoutMs);
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Request failed after retries");
}
