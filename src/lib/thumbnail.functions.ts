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
  clickTrigger: string;
  titleQuestion: string;
  thumbnailMessage: string;
  first30Seconds: string;
  analysisMode?: "vision_ai" | "smart_metadata";
  aiNotice?: string;
};

export type VideoMetadata = {
  videoId: string;
  title: string;
  thumbnail: string;
};

const ResultSchema = z.object({
  clickTrigger: z.string().optional().default("Title and Thumbnail"),
  titleQuestion: z.string(),
  thumbnailMessage: z.string(),
  first30Seconds: z.string().optional(),
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

function generateOpeningHookFallback(title: string): string {
  const t = title.trim();
  const lower = t.toLowerCase();

  if (lower.startsWith("how to") || lower.startsWith("how i")) {
    const topic = t.replace(/^how (to|i)/i, "").trim();
    return `Hooks viewers with the painful obstacle behind ${topic}, setting high stakes before introducing the step-by-step framework.`;
  }
  if (lower.startsWith("why ")) {
    const topic = t.replace(/^why /i, "").trim();
    return `Challenges a widespread belief about ${topic}, creating instant tension before revealing the counterintuitive truth.`;
  }
  if (lower.startsWith("i tried") || lower.startsWith("i tested") || lower.includes("experiment")) {
    return `Launches straight into the premise with rapid-fire footage of the experiment, setting immediate expectations for whether it lived up to the hype.`;
  }
  if (lower.includes(" vs ") || lower.includes(" versus ")) {
    return `Presents the head-to-head showdown between both contenders, establishing key advantages before pushing them into the ultimate test.`;
  }
  if (
    lower.includes("documentary") ||
    lower.includes("history") ||
    lower.includes("story") ||
    lower.includes("dynasty") ||
    lower.includes("rise and fall")
  ) {
    return `Opens with dramatic archival footage and intense atmospheric pacing, establishing the immense scale of the subject before setting up the central conflict.`;
  }
  if (
    lower.includes("richest") ||
    lower.includes("billionaire") ||
    lower.includes("wealth") ||
    lower.includes("money")
  ) {
    return `Opens with staggering numbers and jaw-dropping visual contrasts that emphasize the sheer scale of wealth and power involved.`;
  }
  if (lower.includes("secret") || lower.includes("hidden") || lower.includes("truth")) {
    return `Teases the forbidden or undisclosed reality right away, warning viewers why mainstream sources refuse to talk about it.`;
  }
  return `Establishes a compelling narrative hook that directly addresses the core promise of "${t}", immediately locking in viewer retention.`;
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

  const hasTranscript = Boolean(transcript && transcript.trim().length >= 10);
  const prompt = hasTranscript
    ? [
        `Summarize what happens in the first 30 seconds of this YouTube video based on its opening transcript.`,
        `Video Title: "${title}"`,
        `Opening 30 Seconds Transcript: "${transcript!.slice(0, 1500)}"`,
        `Instructions: Reply with 1-2 concise, engaging sentences describing what happens in the first 30 seconds (the hook, setting, or opening statement). Do not use bullet points.`,
      ].join("\n")
    : [
        `Predict and describe what happens in the opening 30 seconds of this YouTube video based on its title.`,
        `Video Title: "${title}"`,
        `Instructions: Reply with 1-2 concise, engaging sentences describing what happens in the first 30 seconds (the hook, setting, visual contrast, or opening statement designed to retain the viewer). Do not use bullet points.`,
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
              content: "You summarize or predict YouTube video opening hooks in 1-2 clear, punchy sentences.",
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

  // If transcript is available and clean, extract opening sentences:
  if (hasTranscript && transcript) {
    const cleaned = transcript
      .replace(/\[.*?\]/g, "")
      .replace(/Narrator:\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const sentences = cleaned.split(/(?<=[.?!])\s+/);
    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join(" ");
    }
    if (cleaned.length > 20) {
      return cleaned.length > 250 ? cleaned.slice(0, 247) + "..." : cleaned;
    }
  }

  return "";
}

// Deep subject-aware packaging synthesizer
function synthesizePackaging({
  title,
  author,
  description,
  transcript,
}: {
  title: string;
  author?: string;
  description?: string;
  transcript?: string | null;
}): {
  clickTrigger: string;
  titleQuestion: string;
  thumbnailMessage: string;
  first30Seconds: string;
} {
  const t = title.trim();
  const lower = (t + " " + (description || "")).toLowerCase();

  // Clean title to extract primary subject
  const cleanSubject = t
    .replace(/\s*\|\s*.*$/g, "")
    .replace(/\s*-\s*(A Complete History|Full Movie|Documentary|Official Video|Explained|Full Story).*$/i, "")
    .trim();

  // Extract primary narrative hook line from description
  const hookLine = (description || "")
    .split("\n")
    .map((l) => l.trim())
    .find(
      (l) =>
        l.length > 25 &&
        !l.toLowerCase().includes("sponsor") &&
        !l.toLowerCase().includes("http") &&
        !l.toLowerCase().includes("subscribe") &&
        !l.toLowerCase().includes("discount") &&
        !l.toLowerCase().includes("checkout") &&
        !l.startsWith("--") &&
        !l.startsWith("#") &&
        !/^\d+:\d+/.test(l)
    ) || "";

  // 1. What made you click?
  let clickTrigger = "Title and Thumbnail";
  if (lower.includes("secret") || lower.includes("hidden") || lower.includes("shocking")) {
    clickTrigger = "Title and Thumbnail (Curiosity & Visual Mystery)";
  } else if (lower.includes("oligarch") || lower.includes("dynasty") || lower.includes("monopoly")) {
    clickTrigger = "Title and Thumbnail (Historical Gravitas & Stakes)";
  } else if (lower.startsWith("i tried") || lower.startsWith("i tested")) {
    clickTrigger = "Thumbnail (Visual Proof & Spectacle)";
  }

  // 2. What question does the title create?
  let titleQuestion = "";
  if (
    lower.includes("rockefeller") ||
    (lower.includes("dynasty") && (lower.includes("wealth") || lower.includes("monopoly") || lower.includes("history")))
  ) {
    titleQuestion =
      "How did the Rockefeller family amass unimaginable wealth and secretly build a dynasty that shaped modern America?";
  } else if (lower.includes("dynasty") || lower.includes("empire") || lower.includes("oligarch")) {
    titleQuestion = `How did ${cleanSubject} amass unprecedented power and wealth to secretly build a dynasty that shaped history?`;
  } else if (lower.includes("documentary") || lower.includes("story") || lower.includes("history")) {
    if (hookLine && hookLine.includes("—")) {
      const corePremise = hookLine.split("—")[1]?.trim() || hookLine;
      titleQuestion = `How did ${cleanSubject} unfold behind closed doors, and ${corePremise.charAt(0).toLowerCase() + corePremise.slice(1)}?`;
    } else {
      titleQuestion = `What really happened behind closed doors during the rise and reign of ${cleanSubject}?`;
    }
  } else if (lower.startsWith("how to") || lower.startsWith("how i")) {
    const topic = cleanSubject.replace(/^how (to|i)/i, "").trim();
    titleQuestion = `What is the exact counterintuitive method behind ${topic} that actually works?`;
  } else if (lower.startsWith("why ")) {
    const topic = cleanSubject.replace(/^why /i, "").trim();
    titleQuestion = `What is the hidden, uncomfortable truth about ${topic} that almost everyone gets wrong?`;
  } else if (lower.startsWith("i tried") || lower.startsWith("i tested")) {
    titleQuestion = `Did it actually deliver on its extreme claims, or was it a complete disappointment?`;
  } else if (lower.includes(" vs ") || lower.includes(" versus ")) {
    titleQuestion = `Which one truly comes out on top when pushed to the absolute extreme?`;
  } else if (lower.includes("richest") || lower.includes("billionaire") || lower.includes("wealth")) {
    titleQuestion = `How did such an astronomical scale of wealth get created, and what hidden power did it command?`;
  } else {
    titleQuestion = `What is the untold reality behind "${cleanSubject}", and why does it matter right now?`;
  }

  // 3. What does the thumbnail communicate?
  let thumbnailMessage = "";
  if (
    lower.includes("rockefeller") ||
    lower.includes("oligarch") ||
    (lower.includes("dynasty") && lower.includes("documentary"))
  ) {
    thumbnailMessage =
      "Featuring stern, shadowy historical figures in top hats accompanied by the bold text 'AMERICAN OLIGARCH,' the thumbnail sets a somber, serious tone. It promises a gritty, authoritative historical expose into how an elite family established untameable power and wealth.";
  } else if (lower.includes("history") || lower.includes("documentary") || lower.includes("empire")) {
    thumbnailMessage = `Featuring somber, archival subject portraits and bold, high-contrast investigative typography, the packaging establishes an authoritative, serious atmosphere. It promises an unflinching, cinematic expose into the hidden rise and fall of ${cleanSubject}.`;
  } else if (lower.includes("richest") || lower.includes("billionaire") || lower.includes("wealth")) {
    thumbnailMessage = `Contrasting stark luxury imagery with dramatic scale markers, the thumbnail evokes intense awe and curiosity. It promises a revealing, unfiltered breakdown of astronomical wealth.`;
  } else if (lower.startsWith("i tried") || lower.startsWith("i tested") || lower.includes("challenge")) {
    thumbnailMessage = `Presents high-energy, real-world visual proof with dramatic emotional expressions, promising genuine, unscripted results and entertaining trial by fire.`;
  } else {
    thumbnailMessage = `Presents a high-contrast visual hook with dramatic subject framing and bold typography designed to evoke immediate curiosity and communicate an authoritative breakdown of ${cleanSubject}.`;
  }

  // 4. What happens in the first 30 seconds?
  let first30Seconds = "";
  if (transcript && transcript.trim().length >= 20) {
    const cleaned = transcript
      .replace(/\[.*?\]/g, "")
      .replace(/Narrator:\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    const sentences = cleaned.split(/(?<=[.?!])\s+/);
    if (sentences.length >= 2) {
      first30Seconds = sentences.slice(0, 2).join(" ");
    } else {
      first30Seconds = cleaned.slice(0, 220) + (cleaned.length > 220 ? "..." : "");
    }
  }

  if (!first30Seconds || first30Seconds === "Transcript disabled") {
    if (lower.includes("rockefeller") || lower.includes("oligarch")) {
      first30Seconds =
        "Opens with dramatic archival presentation and intense historical pacing, introducing John D. Rockefeller's rise from a con man's son to America's most powerful monopoly before setting up the central conflict of scandal and reinvention.";
    } else if (hookLine && hookLine.length > 20) {
      first30Seconds = `Opens with dramatic archival footage establishing ${cleanSubject}, hooking the viewer with the core premise: "${hookLine.slice(0, 160)}" before diving into the central conflict.`;
    } else {
      first30Seconds = `Opens with dramatic visual framing and intense atmospheric pacing, establishing the immense scale of ${cleanSubject} before setting up the central conflict.`;
    }
  }

  return { clickTrigger, titleQuestion, thumbnailMessage, first30Seconds };
}

// Fetch player details (synopsis, author, title) via Innertube Web client
async function getVideoPlayerDetails(videoId: string): Promise<{
  title: string;
  author: string;
  description: string;
} | null> {
  try {
    const key = await getInnertubeApiKey(videoId);
    const resp = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${key}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context: { client: { clientName: "WEB", clientVersion: "2.20240101.00.00" } },
        videoId,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return {
        title: data?.videoDetails?.title || "",
        author: data?.videoDetails?.author || "",
        description: data?.videoDetails?.shortDescription || "",
      };
    }
  } catch (err) {
    console.warn("Failed to get player details:", err);
  }
  return null;
}

export const validateAiKey = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ aiApiKey: z.string().trim() }).parse(input)
  )
  .handler(async ({ data }): Promise<{ valid: boolean; provider?: string; message: string; needsEnabling?: boolean }> => {
    const key = data.aiApiKey.trim();
    if (!key) return { valid: false, message: "Please enter an AI key." };

    if (key.startsWith("sk-")) {
      try {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) {
          return { valid: true, provider: "openai", message: "Connected to OpenAI Vision successfully!" };
        }
        return { valid: false, message: "Invalid OpenAI key or unauthorized." };
      } catch (err: any) {
        return { valid: false, message: err.message || "Failed to reach OpenAI." };
      }
    }

    if (key.startsWith("AIzaSy")) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${encodeURIComponent(key)}`
        );
        if (res.ok) {
          return { valid: true, provider: "gemini", message: "Connected to Google Gemini Vision successfully!" };
        }
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || "";
        if (errMsg.includes("disabled") || errMsg.includes("blocked") || res.status === 403) {
          return {
            valid: false,
            needsEnabling: true,
            message:
              "Key is recognized, but Gemini API is not enabled in your Google Cloud Console. Click below to enable it in 1 click, or get a free Gemini key at aistudio.google.com.",
          };
        }
        return { valid: false, message: errMsg || "Invalid Google Gemini API key." };
      } catch (err: any) {
        return { valid: false, message: err.message || "Failed to reach Google Gemini API." };
      }
    }

    return { valid: false, message: "Key should start with 'AIzaSy...' (Gemini) or 'sk-...' (OpenAI)." };
  });

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

    // 2. Fetch video details & transcript
    let playerDetails: { title: string; author: string; description: string } | null = null;
    let transcriptText: string | null = null;

    if (videoId) {
      const [details, tr] = await Promise.all([
        getVideoPlayerDetails(videoId),
        getFirst30SecondsTranscript(videoId),
      ]);
      playerDetails = details;
      transcriptText = tr;
    }

    let first30Seconds = "";
    if (transcriptText) {
      first30Seconds = await summarizeFirst30Seconds({
        transcript: transcriptText,
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

    // 4. Packaging vision analysis prompt
    const prompt = [
      "You are an elite YouTube packaging expert analyzing a video's title and thumbnail.",
      "Analyze this packaging with extreme precision, subject depth, and analytical rigor.",
      "Return a JSON object with these exact keys:",
      "1. clickTrigger: (string) What primarily drives the click? Specify 'Title and Thumbnail', 'Thumbnail (Visual Intrigue)', or 'Title (Curiosity Gap)'.",
      "2. titleQuestion: (string) The single burning question or curiosity gap the title creates in a viewer's mind. Phrase it as one question the way a curious viewer would ask it, explicitly naming the key subject, stakes, or tension (e.g. 'How did the Rockefeller family amass unimaginable wealth and secretly build a dynasty that shaped modern America?'). Never return generic filler.",
      "3. thumbnailMessage: (string) What the thumbnail communicates visually in 1-2 detailed sentences. Specifically describe the visual subjects, attire, setting, quote any visible text on the image in quotes (e.g. 'AMERICAN OLIGARCH'), describe the mood/tone (e.g. somber, gritty, sensational, high-stakes), and state the exact promise/premise made to the viewer (e.g. 'Featuring stern, shadowy historical figures in top hats accompanied by the bold text \\'AMERICAN OLIGARCH,\\' the thumbnail sets a somber, serious tone. It promises a gritty, authoritative historical expose into how an elite family established untameable power and wealth.').",
      `Video title: "${data.title}"`,
      playerDetails?.description ? `Video Synopsis & Context: "${playerDetails.description.slice(0, 500)}"` : "",
    ]
      .filter(Boolean)
      .join("\n");

    let aiNotice: string | undefined = undefined;

    // Option 1: Direct Google Gemini Flash Vision
    if (geminiKey && base64Data) {
      for (const model of ["gemini-1.5-flash", "gemini-2.0-flash"]) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
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
                  clickTrigger: parsed.data.clickTrigger || "Title and Thumbnail",
                  titleQuestion: parsed.data.titleQuestion,
                  thumbnailMessage: parsed.data.thumbnailMessage,
                  first30Seconds: first30Seconds || parsed.data.first30Seconds || "",
                  analysisMode: "vision_ai",
                };
              }
            }
          } else {
            const errData = await res.json().catch(() => null);
            if (res.status === 403) {
              aiNotice =
                "Your Google API key is connected, but Generative Language (Gemini) is not enabled on it. You can enable it in Google Cloud Console or get a free Gemini key at aistudio.google.com.";
            }
          }
        } catch (err) {
          console.warn(`Gemini ${model} vision analysis failed:`, err);
        }
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
                    clickTrigger: { type: "string" },
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
                clickTrigger: parsed.data.clickTrigger || "Title and Thumbnail",
                titleQuestion: parsed.data.titleQuestion,
                thumbnailMessage: parsed.data.thumbnailMessage,
                first30Seconds: first30Seconds || parsed.data.first30Seconds || "",
                analysisMode: "vision_ai",
              };
            }
          }
        }
      } catch (err) {
        console.warn("Lovable AI vision analysis failed:", err);
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
                clickTrigger: parsed.data.clickTrigger || "Title and Thumbnail",
                titleQuestion: parsed.data.titleQuestion,
                thumbnailMessage: parsed.data.thumbnailMessage,
                first30Seconds: first30Seconds || parsed.data.first30Seconds || "",
                analysisMode: "vision_ai",
              };
            }
          }
        }
      } catch (err) {
        console.warn("OpenAI vision analysis failed:", err);
      }
    }

    // High-depth smart subject-aware synthesis
    const synth = synthesizePackaging({
      title: data.title,
      author: playerDetails?.author,
      description: playerDetails?.description,
      transcript: transcriptText,
    });

    return {
      title: data.title,
      thumbnail: finalThumbnail,
      videoUrl: data.videoUrl,
      clickTrigger: synth.clickTrigger,
      titleQuestion: synth.titleQuestion,
      thumbnailMessage: synth.thumbnailMessage,
      first30Seconds: first30Seconds || synth.first30Seconds,
      analysisMode: "smart_metadata",
      aiNotice,
    };
  });
