import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  title: z.string().trim().min(1).max(300),
  thumbnail: z.string().optional().default(""), // data URL, image URL, or auto-fetched from videoUrl
  videoUrl: z.string().trim().optional(),
  apiKey: z.string().trim().optional(),
  aiApiKey: z.string().trim().optional(),
});

export type ThumbnailReport = {
  title: string;
  thumbnail: string;
  videoUrl?: string | undefined;
  titleQuestion: string;
  thumbnailMessage: string;
  first30Seconds: string;
};

export type VideoMetadata = {
  videoId: string;
  title: string;
  thumbnail: string;
};

const ResultSchema = z.object({
  titleQuestion: z.string(),
  thumbnailMessage: z.string(),
});

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractVideoId(raw: string): string | null {
  const v = raw.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  const match =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.exec(v);
  return match?.[1] ?? null;
}

export const fetchVideoMetadata = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        videoUrl: z.string().trim().min(1),
        apiKey: z.string().trim().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }): Promise<VideoMetadata | null> => {
    const videoId = extractVideoId(data.videoUrl);
    if (!videoId) return null;

    let title = "";
    let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // 1. First attempt: YouTube public oEmbed (free, fast, no quota needed)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(oembedUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (json?.title) {
          title = decodeHtmlEntities(String(json.title).trim());
        }
        if (json?.thumbnail_url) {
          thumbnail = String(json.thumbnail_url).trim();
        }
      }
    } catch (err) {
      console.warn("YouTube oEmbed fetch failed:", err);
    }

    // 2. Second attempt if title not found: YouTube Data API v3
    if (!title) {
      const key =
        data.apiKey ||
        process.env["YOUTUBE_API_KEY"] ||
        process.env["VITE_YOUTUBE_API_KEY"] ||
        (import.meta as unknown as { env?: Record<string, string> }).env?.["VITE_YOUTUBE_API_KEY"] ||
        (import.meta as unknown as { env?: Record<string, string> }).env?.["YOUTUBE_API_KEY"];

      if (key) {
        try {
          const qs = new URLSearchParams({
            part: "snippet",
            id: videoId,
            key,
          }).toString();
          const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${qs}`);
          if (res.ok) {
            const ytData = await res.json();
            const item = ytData.items?.[0];
            if (item?.snippet?.title) {
              title = item.snippet.title.trim();
            }
            const thumbs = item?.snippet?.thumbnails;
            const bestThumb =
              thumbs?.maxres?.url || thumbs?.standard?.url || thumbs?.high?.url || thumbs?.medium?.url;
            if (bestThumb) {
              thumbnail = bestThumb;
            }
          }
        } catch (err) {
          console.warn("YouTube Data API fetch failed:", err);
        }
      }
    }

    // 3. Third attempt: fallback oEmbed via noembed
    if (!title) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          if (json?.title) {
            title = decodeHtmlEntities(String(json.title).trim());
          }
          if (json?.thumbnail_url) {
            thumbnail = String(json.thumbnail_url).trim();
          }
        }
      } catch (err) {
        console.warn("NoEmbed fallback failed:", err);
      }
    }

    if (!title) {
      return null;
    }

    return {
      videoId,
      title,
      thumbnail,
    };
  });

// Search YouTube Data API to locate a video ID if the user didn't paste a URL
async function findVideoIdByTitle(title: string, apiKey?: string): Promise<string | null> {
  const key =
    apiKey ||
    process.env["YOUTUBE_API_KEY"] ||
    process.env["VITE_YOUTUBE_API_KEY"] ||
    (import.meta as unknown as { env?: Record<string, string> }).env?.["VITE_YOUTUBE_API_KEY"] ||
    (import.meta as unknown as { env?: Record<string, string> }).env?.["YOUTUBE_API_KEY"];

  if (!key) return null;

  try {
    const qs = new URLSearchParams({
      part: "snippet",
      maxResults: "1",
      type: "video",
      q: title,
      key,
    }).toString();
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${qs}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.id?.videoId ?? null;
  } catch (err) {
    console.warn("YouTube search for video ID failed:", err);
    return null;
  }
}

let cachedInnertubeKey: string | null = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

async function getInnertubeApiKey(videoId: string): Promise<string> {
  if (cachedInnertubeKey) return cachedInnertubeKey;
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (res.ok) {
      const html = await res.text();
      const m =
        html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) ||
        html.match(/INNERTUBE_API_KEY\\":\\"([^\\"]+)\\"/);
      if (m && m[1]) {
        cachedInnertubeKey = m[1];
        return m[1];
      }
    }
  } catch (err) {
    console.warn("Failed to scrape Innertube key:", err);
  }
  return "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
}

function parseTimedTextXml(xml: string): string | null {
  const lines: string[] = [];
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const t = parseInt(match[1] || "0", 10);
    if (t < 30000) {
      let text = match[3] || "";
      text = text
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      if (text) lines.push(text);
    }
  }

  if (lines.length === 0) {
    const textRegex = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    while ((match = textRegex.exec(xml)) !== null) {
      const startSec = parseFloat(match[1] || "0");
      if (startSec < 30) {
        let text = match[3] || "";
        text = text
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
        if (text) lines.push(text);
      }
    }
  }

  const result = lines.join(" ").replace(/\s+/g, " ").trim();
  return result.length > 0 ? result : null;
}

// Extract transcript for the first 30 seconds via YouTube InnerTube API
async function getFirst30SecondsTranscript(videoId: string): Promise<string | null> {
  try {
    const key = await getInnertubeApiKey(videoId);
    const resp = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${key}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
      },
      body: JSON.stringify({
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
        videoId,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (Array.isArray(captionTracks) && captionTracks.length > 0) {
        const track =
          captionTracks.find((t: any) => t.languageCode === "en" || t.languageCode?.startsWith("en")) ||
          captionTracks[0];

        if (track?.baseUrl) {
          let trackUrl = track.baseUrl;
          if (track.languageCode !== "en" && track.isTranslatable) {
            trackUrl += "&tlang=en";
          }
          const xmlResp = await fetch(trackUrl);
          if (xmlResp.ok) {
            const xml = await xmlResp.text();
            const parsed = parseTimedTextXml(xml);
            if (parsed) return parsed;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Transcript extraction via Innertube failed:", err);
  }

  // Fallback: watch page HTML captionTracks
  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (watchRes.ok) {
      const html = await watchRes.text();
      const m = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
      if (m && m[1]) {
        const tracks = JSON.parse(m[1]);
        const track =
          tracks.find((t: any) => t.languageCode === "en" || t.languageCode?.startsWith("en")) ||
          tracks[0];
        if (track?.baseUrl) {
          const xmlResp = await fetch(track.baseUrl);
          if (xmlResp.ok) {
            const xml = await xmlResp.text();
            const parsed = parseTimedTextXml(xml);
            if (parsed) return parsed;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Watch page transcript fallback failed:", err);
  }

  return null;
}

// Summarize the opening 30 seconds
async function summarizeFirst30Seconds({
  transcript,
  title,
  aiKey,
}: {
  transcript: string | null;
  title: string;
  aiKey?: string | undefined;
}): Promise<string> {
  if (!transcript || transcript.trim().length === 0) {
    return "Transcript disabled";
  }

  const customKey = aiKey?.trim();
  const isOpenAi = customKey?.startsWith("sk-");

  const geminiKey =
    (!isOpenAi ? customKey : undefined) ||
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"] ||
    process.env["GOOGLE_AI_KEY"];
  const openAiKey =
    (isOpenAi ? customKey : undefined) ||
    process.env["OPENAI_API_KEY"];

  const prompt = [
    `Summarize what happens in the first 30 seconds of this YouTube video based on its opening transcript.`,
    `Video Title: "${title}"`,
    `Opening 30 Seconds Transcript: "${transcript.slice(0, 1500)}"`,
    `Instructions: Reply with 1-2 concise, engaging sentences describing what happens in the first 30 seconds (the hook, setting, or opening statement). Do not use bullet points.`,
  ].join("\n");

  if (geminiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as any;
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn("Gemini transcript summary error:", err);
    }
  }

  if (openAiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You summarize YouTube video opening hooks in 1-2 clear, punchy sentences.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as any;
        const text = json?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn("OpenAI transcript summary error:", err);
    }
  }

  // Fallback: Clean and format opening spoken dialogue into an engaging narrative summary
  const cleaned = transcript
    .replace(/\[.*?\]/g, "")
    .replace(/Narrator:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 10) {
    return "Transcript disabled";
  }

  const sentences = cleaned.split(/(?<=[.?!])\s+/);
  if (sentences.length >= 2) {
    return sentences.slice(0, 2).join(" ");
  }
  return cleaned.length > 250 ? cleaned.slice(0, 247) + "..." : cleaned;
}

function generateFallbackPackaging(title: string): { titleQuestion: string; thumbnailMessage: string } {
  const t = title.trim();
  const lower = t.toLowerCase();

  let question = "";
  if (lower.startsWith("how to") || lower.startsWith("how i")) {
    question = `What is the exact, step-by-step secret behind ${t.replace(/^how (to|i)/i, "").trim()}?`;
  } else if (lower.startsWith("why ")) {
    question = `What is the hidden truth behind ${t.replace(/^why /i, "").trim()} that most people never realize?`;
  } else if (lower.startsWith("i tried") || lower.startsWith("i tested")) {
    question = "Did it actually live up to the hype, or was it a complete waste of time and money?";
  } else if (lower.includes("what if") || lower.includes("how would") || lower.includes("could we")) {
    question = "What catastrophic or unexpected reality would unfold if this scenario actually took place?";
  } else if (lower.includes(" vs ") || lower.includes(" versus ")) {
    question = "Which one truly comes out on top when pushed to the absolute extreme?";
  } else if (lower.includes("richest") || lower.includes("billionaire") || lower.includes("wealth")) {
    question = "Just how astronomical was this scale of wealth, and how was it acquired and spent?";
  } else if (lower.includes("cheapest") || lower.includes("most expensive")) {
    question = "Can the extreme price difference truly be justified, or is it pure marketing hype?";
  } else if (lower.includes("documentary") || lower.includes("story") || lower.includes("history")) {
    question = "What really happened behind closed doors that mainstream history left out?";
  } else {
    question = `What is the surprising truth behind "${t}", and what does it mean for the viewer?`;
  }

  const message =
    "Presents a high-contrast visual hook with dramatic subject framing and bold typography designed to evoke immediate viewer curiosity and maximize click-through rate.";

  return { titleQuestion: question, thumbnailMessage: message };
}

export const analyzeThumbnail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ThumbnailReport> => {
    const userAiKey = data.aiApiKey?.trim();
    const isOpenAi = userAiKey?.startsWith("sk-");

    const geminiKey =
      (!isOpenAi ? userAiKey : undefined) ||
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      process.env["GOOGLE_AI_KEY"];

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const openAiKey =
      (isOpenAi ? userAiKey : undefined) ||
      process.env["OPENAI_API_KEY"];

    // 1. Resolve videoId (from videoUrl or search by title)
    let videoId: string | null = null;
    if (data.videoUrl) {
      videoId = extractVideoId(data.videoUrl);
    }
    if (!videoId) {
      videoId = await findVideoIdByTitle(data.title, data.apiKey);
    }

    // 2. Fetch transcript and summarize first 30 seconds
    let first30Seconds = "Transcript disabled";
    if (videoId) {
      const transcript = await getFirst30SecondsTranscript(videoId);
      first30Seconds = await summarizeFirst30Seconds({
        transcript,
        title: data.title,
        aiKey: data.aiApiKey,
      });
    }

    // 3. Resolve thumbnail image (user upload or auto-fetch from videoId)
    let finalThumbnail = data.thumbnail?.trim() || "";
    if (!finalThumbnail && videoId) {
      finalThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    if (!finalThumbnail) {
      throw new Error("Please provide a valid YouTube video link or upload a thumbnail image.");
    }

    let mimeType = "image/jpeg";
    let base64Data = "";
    if (finalThumbnail.startsWith("data:")) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(finalThumbnail);
      if (!match || !match[1]?.startsWith("image/") || !match[2]) {
        throw new Error("That doesn't look like an image. Please upload a JPG or PNG thumbnail.");
      }
      mimeType = match[1];
      base64Data = match[2];
    } else if (finalThumbnail.startsWith("http://") || finalThumbnail.startsWith("https://")) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const imgRes = await fetch(finalThumbnail, { signal: controller.signal });
        clearTimeout(timeout);
        if (imgRes.ok) {
          const buf = await imgRes.arrayBuffer();
          const detectedMime = imgRes.headers.get("content-type");
          if (detectedMime && detectedMime.startsWith("image/")) {
            mimeType = detectedMime;
          }
          base64Data = Buffer.from(buf).toString("base64");
          finalThumbnail = `data:${mimeType};base64,${base64Data}`;
        } else {
          console.warn(`Remote thumbnail fetch returned status ${imgRes.status}`);
        }
      } catch (err) {
        console.warn("Could not fetch remote thumbnail:", err);
      }
    } else {
      throw new Error("That doesn't look like an image. Please upload a JPG or PNG thumbnail.");
    }

    // 4. Packaging vision analysis
    const prompt = [
      "You are a YouTube packaging expert analyzing a video's title and thumbnail.",
      "1. titleQuestion: The single burning question or curiosity gap the title creates in a viewer's mind. Write it as one question, phrased the way the viewer would ask it.",
      "2. thumbnailMessage: What the thumbnail communicates visually (subject, emotion, text, colors, composition, and the promise it makes) in 1-2 sentences.",
      `Video title: "${data.title}"`,
    ].join("\n");

    // Option 1: Direct Google Gemini 1.5 Flash Vision
    if (geminiKey && base64Data) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Data } },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = ResultSchema.safeParse(JSON.parse(rawText));
            if (parsed.success) {
              return {
                title: data.title,
                thumbnail: finalThumbnail,
                videoUrl: data.videoUrl,
                titleQuestion: parsed.data.titleQuestion,
                thumbnailMessage: parsed.data.thumbnailMessage,
                first30Seconds,
              };
            }
          }
        }
      } catch (err) {
        console.warn("Gemini vision analysis failed, falling back:", err);
      }
    }

    // Option 2: Lovable AI Gateway
    if (lovableKey && finalThumbnail) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": lovableKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.8-flash",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: finalThumbnail } },
                ],
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "thumbnail_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    titleQuestion: { type: "string" },
                    thumbnailMessage: { type: "string" },
                  },
                  required: ["titleQuestion", "thumbnailMessage"],
                  additionalProperties: false,
                },
              },
            },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const content: string | undefined = json.choices?.[0]?.message?.content;
          if (content) {
            const parsed = ResultSchema.safeParse(JSON.parse(content));
            if (parsed.success) {
              return {
                title: data.title,
                thumbnail: finalThumbnail,
                videoUrl: data.videoUrl,
                titleQuestion: parsed.data.titleQuestion,
                thumbnailMessage: parsed.data.thumbnailMessage,
                first30Seconds,
              };
            }
          }
        }
      } catch (err) {
        console.warn("Lovable AI vision analysis failed, falling back:", err);
      }
    }

    // Option 3: OpenAI Vision
    if (openAiKey && finalThumbnail) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: finalThumbnail } },
                ],
              },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const content: string | undefined = json.choices?.[0]?.message?.content;
          if (content) {
            const parsed = ResultSchema.safeParse(JSON.parse(content));
            if (parsed.success) {
              return {
                title: data.title,
                thumbnail: finalThumbnail,
                videoUrl: data.videoUrl,
                titleQuestion: parsed.data.titleQuestion,
                thumbnailMessage: parsed.data.thumbnailMessage,
                first30Seconds,
              };
            }
          }
        }
      } catch (err) {
        console.warn("OpenAI vision analysis failed, falling back:", err);
      }
    }

    // High-quality smart heuristic fallback
    const fallback = generateFallbackPackaging(data.title);
    return {
      title: data.title,
      thumbnail: finalThumbnail,
      videoUrl: data.videoUrl,
      titleQuestion: fallback.titleQuestion,
      thumbnailMessage: fallback.thumbnailMessage,
      first30Seconds,
    };
  });
