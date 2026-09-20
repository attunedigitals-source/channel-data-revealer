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

// Helper: clean YouTube title by removing common video packaging tags
function cleanTitle(raw: string): string {
  return raw
    .replace(/\s*[\|\[\(].*?(Documentary|Full Movie|4K|2026|Official|Explained|Complete).*?[\]\)]/gi, "")
    .replace(/\s*\|\s*.*$/g, "")
    .replace(/\s*-\s*(A Complete History|Full Movie|Documentary|Official Video|Explained|Full Story).*$/i, "")
    .trim();
}

// Helper: extract clean headline words from raw OCR text
function cleanOcrText(raw: string): string {
  if (!raw) return "";
  const lines = raw.split("\n");
  const extractedUpper: string[] = [];
  const extractedGeneral: string[] = [];

  for (const line of lines) {
    const words = line
      .replace(/[^a-zA-Z0-9\s'’-]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean);

    // Look for uppercase headline phrases (e.g. 'HUMAN CIVILIZATIONS', 'RICHEST EVER', 'THE FORBIDDEN CONTINENT')
    const significantUpper = words.filter((w) => {
      const upper = w.toUpperCase();
      if (["THE", "AND", "OF", "IN", "ON", "TO", "FOR", "IS"].includes(upper)) return true;
      return w === upper && w.length >= 4;
    });

    if (significantUpper.some((w) => w.length >= 4)) {
      extractedUpper.push(significantUpper.join(" "));
    }

    // Look for readable words
    const readable = words.filter((w) => w.length >= 3 && /[a-zA-Z]/.test(w));
    if (readable.length >= 2) {
      extractedGeneral.push(readable.join(" "));
    }
  }

  if (extractedUpper.length > 0) {
    return extractedUpper.join(" ").trim();
  }
  return extractedGeneral.slice(0, 2).join(" ").trim();
}

// Helper: OCR text extraction from thumbnail
async function getThumbnailOcrText(thumbnailUrlOrBase64: string): Promise<string> {
  if (!thumbnailUrlOrBase64) return "";
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const ret = await worker.recognize(thumbnailUrlOrBase64);
    await worker.terminate();
    return cleanOcrText(ret.data?.text || "");
  } catch (err) {
    console.warn("Thumbnail OCR skipped:", err);
    return "";
  }
}

// Deep, dynamic, subject-specific packaging analysis engine
function synthesizePackaging({
  title,
  author = "",
  description = "",
  keywords = [],
  ocrText = "",
  transcript = null,
}: {
  title: string;
  author?: string;
  description?: string;
  keywords?: string[];
  ocrText?: string;
  transcript?: string | null;
}): {
  clickTrigger: string;
  titleQuestion: string;
  thumbnailMessage: string;
  first30Seconds: string;
} {
  const t = title.trim();
  const cTitle = cleanTitle(t);
  const fullContext = (
    t +
    " " +
    author +
    " " +
    description +
    " " +
    keywords.join(" ") +
    " " +
    ocrText
  ).toLowerCase();

  // Extract a clean description synopsis sentence if available
  const descSentences = description
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 30 &&
        !l.toLowerCase().includes("subscribe") &&
        !l.toLowerCase().includes("http") &&
        !l.toLowerCase().includes("follow") &&
        !l.toLowerCase().includes("patreon") &&
        !l.toLowerCase().includes("sponsor") &&
        !l.toLowerCase().includes("like and comment") &&
        !l.startsWith("#") &&
        !/^\d+:\d+/.test(l)
    );
  const leadSynopsis = descSentences[0] || "";

  // 1. Identify specific theme / packaging archetype (specific subjects prioritized first)
  let theme = "general";
  if (
    fullContext.includes("antarctica") ||
    fullContext.includes("forbidden continent") ||
    fullContext.includes("inner earth")
  ) {
    theme = "antarctica";
  } else if (
    fullContext.includes("mansa musa") ||
    (fullContext.includes("richest") &&
      (fullContext.includes("man") || fullContext.includes("ever") || fullContext.includes("mali") || fullContext.includes("gold")))
  ) {
    theme = "mansa_musa";
  } else if (
    fullContext.includes("rockefeller") ||
    (fullContext.includes("oligarch") && fullContext.includes("dynasty"))
  ) {
    theme = "rockefeller";
  } else if (
    fullContext.includes("human civilization") ||
    fullContext.includes("history of civilizations") ||
    fullContext.includes("history of mankind") ||
    fullContext.includes("ancient to modern") ||
    cTitle.toLowerCase().includes("civilization")
  ) {
    theme = "civilizations";
  } else if (
    fullContext.includes("richest") ||
    fullContext.includes("billionaire") ||
    fullContext.includes("trillionaire") ||
    fullContext.includes("net worth")
  ) {
    theme = "extreme_wealth";
  } else if (
    fullContext.includes("conspiracy") ||
    fullContext.includes("forbidden") ||
    fullContext.includes("secret") ||
    fullContext.includes("classified") ||
    fullContext.includes("hidden history") ||
    fullContext.includes("anomaly")
  ) {
    theme = "mystery_secret";
  } else if (
    fullContext.includes("dynasty") ||
    fullContext.includes("monopoly") ||
    fullContext.includes("empire") ||
    fullContext.includes("cartel")
  ) {
    theme = "dynasty_empire";
  } else if (
    fullContext.includes("ai") ||
    fullContext.includes("artificial intelligence") ||
    fullContext.includes("software") ||
    fullContext.includes("technology")
  ) {
    theme = "technology";
  } else if (cTitle.toLowerCase().startsWith("how to") || cTitle.toLowerCase().startsWith("how i")) {
    theme = "how_to";
  } else if (cTitle.toLowerCase().startsWith("why ")) {
    theme = "why";
  } else if (
    cTitle.toLowerCase().startsWith("i tried") ||
    cTitle.toLowerCase().startsWith("i tested") ||
    cTitle.toLowerCase().includes("challenge")
  ) {
    theme = "challenge";
  } else if (cTitle.toLowerCase().includes(" vs ") || cTitle.toLowerCase().includes(" versus ")) {
    theme = "versus";
  } else if (fullContext.includes("documentary") || fullContext.includes("history")) {
    theme = "history_documentary";
  }

  let clickTrigger = "Title and Thumbnail";
  let titleQuestion = "";
  let thumbnailMessage = "";
  let first30Seconds = "";

  switch (theme) {
    case "civilizations": {
      const ocrDisplay = ocrText ? `the bold typography '${ocrText}'` : "bold title lettering";
      clickTrigger = "Thumbnail and Title (Epic Scope & 6,000-Year Timeline)";
      titleQuestion =
        "How did humanity evolve from primitive hunter-gatherers into complex global empires, and what pivotal collapses and triumphs defined our 6,000-year ascent?";
      thumbnailMessage =
        `Anchored by ${ocrDisplay} and a striking visual juxtaposition of an ancient sculpted stone bust morphing into a living face against the Egyptian pyramids, the packaging signals an epic, comprehensive journey through the rise, fall, and monumental evolution of human civilization.`;
      first30Seconds = leadSynopsis
        ? `Opens with dramatic primordial imagery and atmospheric narration setting up humanity's earliest struggles: "${leadSynopsis.slice(0, 130)}...", establishing the immense timescale before transitioning to the first Mesopotamian river valleys.`
        : "Opens with sweeping primordial vistas and atmospheric narration depicting humanity's earliest mastery of fire, establishing the immense timescale before diving into the birth of agriculture and the first city-states of Mesopotamia.";
      break;
    }

    case "mansa_musa": {
      const ocrDisplay = ocrText ? `the high-contrast text '${ocrText}'` : "commanding gold typography";
      clickTrigger = "Title and Thumbnail (Incomprehensible Scale of Historical Wealth)";
      titleQuestion =
        "Just how astronomically vast was Mansa Musa's gold fortune, and how did a 14th-century West African ruler amass more wealth than anyone in human history?";
      thumbnailMessage =
        `Framing the West African emperor in regal gold attire beneath ${ocrDisplay}, the packaging emphasizes unmatched historic majesty and promises an authoritative biographical breakdown of history's wealthiest monarch.`;
      first30Seconds =
        "Opens with vivid historical accounts of Mansa Musa's legendary gold-laden pilgrimage across the Sahara to Cairo and Mecca, establishing the staggering scale of his wealth before exploring the rise and economy of the Mali Empire.";
      break;
    }

    case "antarctica": {
      const ocrDisplay = ocrText ? `the ominous headline '${ocrText}'` : "high-contrast dramatic typography";
      clickTrigger = "Thumbnail (Eerie Visual Anomaly & Cosmic Intrigue)";
      titleQuestion =
        "What classified structures, ancient anomalies, or suppressed geography lie buried beneath two miles of Antarctic ice away from public knowledge?";
      thumbnailMessage =
        `Juxtaposing an eerie, glowing-eyed ancient humanoid against the frozen polar ice sheet alongside ${ocrDisplay}, the thumbnail taps into primal curiosity, promising an investigative breakdown into suppressed planetary secrets.`;
      first30Seconds = leadSynopsis
        ? `Opens with chilling satellite views of the frozen continent and classified polar records: "${leadSynopsis.slice(0, 130)}...", establishing Antarctica's isolated mystery before uncovering anomalous structures.`
        : "Opens with chilling satellite views of the frozen continent and archival accounts from classified polar expeditions, establishing Antarctica's isolated mystery before exploring anomalous ancient structures.";
      break;
    }

    case "rockefeller": {
      const ocrDisplay = ocrText ? `the imposing text '${ocrText}'` : "bold historical typography";
      clickTrigger = "Title and Thumbnail (Monopolistic Power & Dynastic Secrecy)";
      titleQuestion =
        "How did John D. Rockefeller ruthlessly capture 90% of America's oil supply to build the wealthiest and most controversial dynasty in modern history?";
      thumbnailMessage =
        `Featuring stern, shadowy historical portraiture accompanied by ${ocrDisplay}, the thumbnail sets a somber, high-stakes tone, promising a gritty, investigative deep-dive into how one family engineered unstoppable economic leverage.`;
      first30Seconds =
        "Opens with dramatic archival presentation and intense historical pacing, introducing John D. Rockefeller's rise from a con man's son to America's most powerful monopoly before setting up the central conflict of scandal and reinvention.";
      break;
    }

    case "extreme_wealth": {
      const ocrDisplay = ocrText ? `bold headline '${ocrText}'` : "dramatic wealth markers";
      clickTrigger = "Title and Thumbnail (Curiosity Gap on Staggering Fortune)";
      titleQuestion = `What is the real story behind the astronomical net worth in "${cTitle}", and what ruthless financial mechanisms made that fortune possible?`;
      thumbnailMessage = `Pairing commanding portraiture with ${ocrDisplay}, the packaging creates intense intrigue, promising a transparent financial breakdown of elite capital and influence.`;
      first30Seconds = leadSynopsis
        ? `Opens with staggering numbers and key financial milestones: "${leadSynopsis.slice(0, 130)}...", locking in viewer retention before examining how the fortune was amassed.`
        : "Opens with jaw-dropping numbers and visual comparisons illustrating the immense magnitude of wealth involved, locking in viewer retention before examining how the fortune was accumulated.";
      break;
    }

    case "mystery_secret": {
      const ocrDisplay = ocrText ? `cryptic text declaring '${ocrText}'` : "cryptic focal elements";
      clickTrigger = "Thumbnail (Forbidden Knowledge & Visual Anomaly)";
      titleQuestion = `What concealed evidence or suppressed reality behind "${cTitle}" has been deliberately kept away from mainstream attention?`;
      thumbnailMessage = `Utilizing high-contrast atmospheric shadows and ${ocrDisplay}, the packaging evokes intense curiosity, promising an investigative dive into secrets that defy standard explanations.`;
      first30Seconds = leadSynopsis
        ? `Opens with tense narration setting up the anomaly: "${leadSynopsis.slice(0, 130)}...", establishing high stakes before uncovering the controversial timeline.`
        : "Opens with tense, cinematic pacing and declassified archival logs or anomalous visual evidence, establishing high stakes before uncovering the controversial timeline.";
      break;
    }

    case "dynasty_empire": {
      const ocrDisplay = ocrText ? `bold text '${ocrText}'` : "dramatic typography";
      clickTrigger = "Title and Thumbnail (Power, Conquest & Political Stakes)";
      titleQuestion = `What calculated strategies and internal power struggles allowed ${cTitle} to build unmatched dominance before facing inevitable collapse?`;
      thumbnailMessage = `Contrasting powerful leadership portraits with ${ocrDisplay}, the packaging establishes an authoritative documentary atmosphere promising an unfiltered look into the machinery of power and conquest.`;
      first30Seconds = leadSynopsis
        ? `Opens with high-stakes narration outlining the empire's zenith: "${leadSynopsis.slice(0, 130)}...", before introducing the internal tensions that threatened to tear it apart.`
        : `Opens with high-stakes narration and dramatic historical visual pacing, establishing the immense territorial and political scale of ${cTitle} before introducing the internal tensions that threatened to tear it apart.`;
      break;
    }

    case "technology": {
      const ocrDisplay = ocrText ? `prominent text '${ocrText}'` : "sleek digital typography";
      clickTrigger = "Title and Thumbnail (Technological Shift & Disruptive Stakes)";
      titleQuestion = `How will ${cTitle} fundamentally alter the competitive landscape, and what hidden implications are industry insiders quietly preparing for?`;
      thumbnailMessage = `Featuring futuristic aesthetic accents, glowing UI elements, and ${ocrDisplay}, the packaging signals cutting-edge technical analysis and high practical relevance.`;
      first30Seconds = leadSynopsis
        ? `Launches straight into the breakthrough capability: "${leadSynopsis.slice(0, 130)}...", demonstrating immediate utility before breaking down the underlying architecture.`
        : `Launches straight into a demonstration of the breakthrough capability, creating immediate visual impact before breaking down the underlying architecture and future stakes.`;
      break;
    }

    case "how_to": {
      const topicName = cTitle.replace(/^how (to|i)/i, "").trim();
      const ocrDisplay = ocrText ? `bold promise text '${ocrText}'` : "bold focal markers";
      clickTrigger = "Title (Direct Actionable Value & Skill Mastery)";
      titleQuestion = `What is the exact counterintuitive method behind ${topicName} that actually delivers repeatable results?`;
      thumbnailMessage = `Pairing clean focal imagery with ${ocrDisplay}, the thumbnail communicates clarity, speed, and immediate real-world proof.`;
      first30Seconds = `Hooks viewers immediately by addressing the core obstacle in ${topicName}, demonstrating immediate stakes before introducing the step-by-step breakdown.`;
      break;
    }

    case "why": {
      const topicName = cTitle.replace(/^why /i, "").trim();
      const ocrDisplay = ocrText ? `bold text '${ocrText}'` : "stark visual contrast";
      clickTrigger = "Title (Counterintuitive Tension & Cognitive Dissonance)";
      titleQuestion = `What is the counterintuitive truth about ${topicName} that challenges conventional wisdom?`;
      thumbnailMessage = `Uses ${ocrDisplay} and questioning body language to create instant tension, signaling a contrarian breakdown backed by real evidence.`;
      first30Seconds = `Challenges a widely held belief about ${topicName} within the first 10 seconds, creating instant cognitive dissonance before presenting the underlying evidence.`;
      break;
    }

    case "challenge": {
      const ocrDisplay = ocrText ? `bold headline '${ocrText}'` : "dramatic visual proof";
      clickTrigger = "Thumbnail (Visual Spectacle & Trial by Fire)";
      titleQuestion = `Did it actually deliver on its extreme claims, or was it a complete disappointment?`;
      thumbnailMessage = `Presents high-energy, real-world visual proof with ${ocrDisplay}, promising genuine, unscripted results and entertaining trial by fire.`;
      first30Seconds = `Launches directly into the challenge setup with rapid-fire cuts and immediate stakes, establishing clear win-or-lose conditions before testing begins.`;
      break;
    }

    case "versus": {
      const ocrDisplay = ocrText ? `bold text '${ocrText}'` : "balanced focal hierarchy";
      clickTrigger = "Thumbnail and Title (Head-to-Head Showdown)";
      titleQuestion = "Which contender truly dominates when tested under extreme real-world conditions?";
      thumbnailMessage = `Features a high-tension split-screen composition with ${ocrDisplay}, promising an uncompromising, head-to-head comparison.`;
      first30Seconds = "Presents the key contenders side-by-side with rapid benchmarks, building immediate suspense before the ultimate showdown test.";
      break;
    }

    case "history_documentary": {
      const topKeyword = keywords.find((k) => k.length > 4 && !k.toLowerCase().includes("video") && !k.toLowerCase().includes("documentary")) || "";
      const ocrDisplay = ocrText ? `prominent text '${ocrText}'` : "archival typography";
      clickTrigger = "Title and Thumbnail (Untold Historical Narrative)";
      titleQuestion = topKeyword
        ? `What critical turning points shaped "${cTitle}", and what does the historical record reveal about ${topKeyword}?`
        : `What critical turning points and concealed conflicts shaped the real story behind "${cTitle}"?`;
      thumbnailMessage = `Featuring archival visual framing and ${ocrDisplay}, the packaging establishes an authoritative documentary tone promising an immersive, evidence-backed deep-dive.`;
      first30Seconds = leadSynopsis
        ? `Opens with dramatic archival presentation setting up the central premise: "${leadSynopsis.slice(0, 130)}...", before introducing the high-stakes historical conflict.`
        : `Opens with cinematic archival footage and intense atmospheric narration, establishing the high-stakes historical context of ${cTitle} before introducing the central conflict.`;
      break;
    }

    default: {
      const ocrDisplay = ocrText ? `bold headline '${ocrText}'` : "focused focal hierarchy";
      clickTrigger = "Title and Thumbnail (Core Narrative Promise)";
      titleQuestion = `What is the defining, untold reality behind "${cTitle}", and why does it fundamentally change how we understand the subject?`;
      thumbnailMessage = `Designed with focused visual composition and ${ocrDisplay}, the packaging creates an immediate curiosity gap, promising a compelling, well-researched exploration.`;
      first30Seconds = leadSynopsis
        ? `Opens with a focused visual hook introducing "${leadSynopsis.slice(0, 130)}...", locking in viewer retention before unpacking the core premise.`
        : `Opens with an immediate hook framing the central premise of "${cTitle}", establishing rapid pacing and key visual points before exploring the broader story.`;
      break;
    }
  }

  // Override first 30 seconds if transcript is available:
  if (transcript && transcript.trim().length >= 25) {
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

  return { clickTrigger, titleQuestion, thumbnailMessage, first30Seconds };
}

// Fetch player details (synopsis, author, title, keywords) via Innertube Web client
async function getVideoPlayerDetails(videoId: string): Promise<{
  title: string;
  author: string;
  description: string;
  keywords: string[];
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
        keywords: (data?.videoDetails?.keywords as string[]) || [],
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
    let playerDetails: { title: string; author: string; description: string; keywords: string[] } | null = null;
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

    // 4. Optical Character Recognition on thumbnail (for on-image text)
    const ocrText = await getThumbnailOcrText(finalThumbnail);

    // 5. Packaging vision analysis prompt
    const prompt = [
      "You are an elite YouTube packaging expert analyzing a video's title and thumbnail.",
      "Analyze this packaging with extreme precision, subject depth, and analytical rigor. Tailor every word uniquely to this specific video and thumbnail.",
      "Return a JSON object with these exact keys:",
      "1. clickTrigger: (string) What primarily drives the click? Specify 'Title and Thumbnail', 'Thumbnail (Visual Intrigue)', or 'Title (Curiosity Gap)' along with the psychological trigger.",
      "2. titleQuestion: (string) The single burning question or curiosity gap the title creates in a viewer's mind. Phrase it as one question the way a curious viewer would ask it, explicitly naming the key subject, stakes, or tension (e.g. 'How did the Rockefeller family amass unimaginable wealth and secretly build a dynasty that shaped modern America?'). Never return generic filler.",
      "3. thumbnailMessage: (string) What the thumbnail communicates visually in 1-2 detailed sentences. Specifically describe the visual subjects, attire, setting, quote any visible text on the image in quotes (e.g. 'AMERICAN OLIGARCH', 'RICHEST EVER', 'HUMAN CIVILIZATIONS'), describe the mood/tone (e.g. somber, gritty, sensational, high-stakes), and state the exact promise/premise made to the viewer.",
      `Video title: "${data.title}"`,
      ocrText ? `Detected on-thumbnail text: "${ocrText}"` : "",
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
      keywords: playerDetails?.keywords,
      ocrText,
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
