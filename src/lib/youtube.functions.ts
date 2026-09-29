import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getChannelNicheAndStyle, analyzeOutlierPackaging } from "./classifier";
import { resolveYoutubeKey, hasServerYoutubeKey, fetchWithRetry } from "./server-config";

const Input = z.object({
  url: z.string().trim().min(3).max(300),
  apiKey: z.string().trim().optional(),
  aiApiKey: z.string().trim().optional(),
});

export type ChannelReport = {
  channel: string;
  url: string;
  subscribers: string;
  videoCount: string;
  niche: string;
  averageVideoLength: string;
  uploadFrequency: string;
  bestVideo: string;
  bestVideoUrl: string;
  bestViews: string;
  style: string;
};

const API = "https://www.googleapis.com/youtube/v3";

export const getApiConfigStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { hasServerKey: hasServerYoutubeKey() };
});

export const validateApiKey = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ apiKey: z.string().trim().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const res = await fetchWithRetry(
        `${API}/channels?part=id&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${encodeURIComponent(data.apiKey)}`,
        {},
        { retries: 1 },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error?.message || `YouTube API error (${res.status})`;
        return { valid: false, message };
      }
      return { valid: true, message: "Valid YouTube API key!" };
    } catch (err: any) {
      return { valid: false, message: err.message || "Failed to connect to YouTube API" };
    }
  });

export function parseIdentifier(raw: string) {
  const value = raw.trim();
  const vidMatch =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/ ]{11})/i.exec(
      value,
    );
  if (vidMatch && vidMatch[1]) {
    return { type: "video" as const, value: vidMatch[1] };
  }
  const cleaned = value.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (cleaned.startsWith("youtube.com/") || cleaned.startsWith("m.youtube.com/")) {
    const path = cleaned.slice(cleaned.indexOf("/") + 1).split("?")[0] ?? "";
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "channel" && parts[1]) return { type: "id" as const, value: parts[1] };
    if (parts[0] === "user" && parts[1]) return { type: "search" as const, value: parts[1] };
    if (parts[0] === "c" && parts[1]) return { type: "search" as const, value: parts[1] };
    if (parts[0]?.startsWith("@")) return { type: "handle" as const, value: parts[0] };
  }
  if (value.startsWith("@")) return { type: "handle" as const, value };
  if (/^UC[\w-]{20,}$/.test(value)) return { type: "id" as const, value };
  return { type: "search" as const, value };
}

async function yt(path: string, params: Record<string, string>, key: string) {
  const qs = new URLSearchParams({ ...params, key }).toString();
  const res = await fetchWithRetry(`${API}/${path}?${qs}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<any>;
}

export function isoDurationToSeconds(iso: string) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const [, d, h, mi, s] = m;
  return Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(mi ?? 0) * 60 + Number(s ?? 0);
}

function formatDuration(totalSeconds: number) {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

const nf = new Intl.NumberFormat("en-US");

export const analyzeChannel = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ChannelReport> => {
    const key = resolveYoutubeKey(data.apiKey);
    if (!key) {
      throw new Error("Missing YouTube API key. Click 'API Key' to add your key or configure YOUTUBE_API_KEY.");
    }

    const ident = parseIdentifier(data.url);

    let channel: any | undefined;
    if (ident.type === "video") {
      const vidRes = await yt("videos", { part: "snippet", id: ident.value }, key);
      const vidChannelId = vidRes.items?.[0]?.snippet?.channelId;
      if (vidChannelId) {
        const r = await yt(
          "channels",
          { part: "snippet,statistics,contentDetails,topicDetails", id: vidChannelId },
          key,
        );
        channel = r.items?.[0];
      }
    } else if (ident.type === "id") {
      const r = await yt(
        "channels",
        { part: "snippet,statistics,contentDetails,topicDetails", id: ident.value },
        key,
      );
      channel = r.items?.[0];
    } else if (ident.type === "handle") {
      const r = await yt(
        "channels",
        { part: "snippet,statistics,contentDetails,topicDetails", forHandle: ident.value },
        key,
      );
      channel = r.items?.[0];
    }

    if (!channel) {
      const search = await yt(
        "search",
        { part: "snippet", type: "channel", maxResults: "1", q: ident.value },
        key,
      );
      const foundId = search.items?.[0]?.snippet?.channelId ?? search.items?.[0]?.id?.channelId;
      if (foundId) {
        const r = await yt(
          "channels",
          { part: "snippet,statistics,contentDetails,topicDetails", id: foundId },
          key,
        );
        channel = r.items?.[0];
      }
    }

    if (!channel) throw new Error("No channel found for that URL. Double-check the link.");

    const uploadsId: string | undefined = channel.contentDetails?.relatedPlaylists?.uploads;
    let videoIds: string[] = [];
    let uploadDates: string[] = [];

    if (uploadsId) {
      const playlist = await yt(
        "playlistItems",
        {
          part: "contentDetails",
          playlistId: uploadsId,
          maxResults: "50",
        },
        key,
      );
      const items = playlist.items ?? [];
      videoIds = items.map((i: any) => i.contentDetails?.videoId).filter(Boolean);
      uploadDates = items.map((i: any) => i.contentDetails?.videoPublishedAt).filter(Boolean);
    }

    let videos: any[] = [];
    if (videoIds.length > 0) {
      const r = await yt(
        "videos",
        { part: "snippet,contentDetails,statistics", id: videoIds.join(",") },
        key,
      );
      videos = r.items ?? [];
    }

    const durations = videos
      .map((v) => isoDurationToSeconds(v.contentDetails?.duration ?? ""))
      .filter((n) => n > 0);
    const avgLength = durations.length
      ? formatDuration(durations.reduce((a, b) => a + b, 0) / durations.length)
      : "N/A";

    let uploadFrequency = "N/A";
    if (uploadDates.length >= 2) {
      const times = uploadDates.map((d) => new Date(d).getTime()).sort((a, b) => b - a);
      const first = times[0]!;
      const last = times[times.length - 1]!;
      const days = (first - last) / 86_400_000;
      const perWeek = days > 0 ? ((times.length - 1) / days) * 7 : 0;
      uploadFrequency =
        perWeek >= 1
          ? `${perWeek.toFixed(1)} videos/week`
          : perWeek > 0
            ? `${(perWeek * 4.345).toFixed(1)} videos/month`
            : "N/A";
    }

    // Best video = highest view count across every upload on the channel.
    // Shorts (<= 60s) are excluded so the winner is a real video.
    let best: any | undefined;
    let bestShort: any | undefined;
    const pickBest = (list: any[]) => {
      for (const v of list) {
        const views = Number(v.statistics?.viewCount ?? 0);
        const isShort = isoDurationToSeconds(v.contentDetails?.duration ?? "") <= 60;
        if (isShort) {
          if (!bestShort || views > Number(bestShort.statistics?.viewCount ?? -1)) bestShort = v;
        } else if (!best || views > Number(best.statistics?.viewCount ?? -1)) {
          best = v;
        }
      }
    };
    pickBest(videos);

    // Query channel-wide all-time top videos to factor whole channel archive into best video
    const handle: string | undefined = channel.snippet?.customUrl;
    const canonicalUrl = handle
      ? `https://www.youtube.com/${handle.startsWith("@") ? handle : "@" + handle}`
      : `https://www.youtube.com/channel/${channel.id}`;

    try {
      const popVideos = await getPopularVideosFromChannel(canonicalUrl || channel.id);
      if (popVideos.length > 0) {
        const popIds = popVideos.slice(0, 50).map((v) => v.id).filter(Boolean);
        const popStats = await yt(
          "videos",
          { part: "snippet,contentDetails,statistics", id: popIds.join(",") },
          key,
        );
        if (popStats?.items) {
          pickBest(popStats.items);
        }
      }
    } catch (popErr) {
      console.warn("Popular videos query in analyzeChannel failed:", popErr);
    }

    if (!best) best = bestShort;


    const avgDurationSeconds = durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const { niche, style } = await getChannelNicheAndStyle({
      channel,
      videos,
      avgDurationSeconds,
      customAiKey: data.aiApiKey?.trim(),
    });

    const hiddenSubs = channel.statistics?.hiddenSubscriberCount === true;

    return {
      channel: channel.snippet?.title ?? "Unknown",
      url: canonicalUrl,
      subscribers: hiddenSubs ? "Hidden" : nf.format(Number(channel.statistics?.subscriberCount ?? 0)),
      videoCount: nf.format(Number(channel.statistics?.videoCount ?? 0)),
      niche,
      averageVideoLength: avgLength,
      uploadFrequency,
      bestVideo: best?.snippet?.title ?? "N/A",
      bestVideoUrl: best ? `https://www.youtube.com/watch?app=desktop&v=${best.id}` : "",
      bestViews: best ? nf.format(Number(best.statistics?.viewCount ?? 0)) : "N/A",
      style,
    };
  });

export type CompetitorReport = {
  id: string;
  channelName: string;
  channelUrl: string;
  avatarUrl?: string;
  subscribers: string;
  videoCount: string;
  typicalVideoLength: string;
  uploadFrequency: string;
  topVideoViews: string;
  topVideoTitle?: string;
  topVideoUrl?: string;
  // Outlier Video fields
  outlierVideoTitle: string;
  outlierVideoUrl: string;
  outlierPublicationDate: string;
  outlierVideoViews: string;
  outlierViewsSubRatio: string;
  outlierVideoLength: string;
  outlierTopic: string;
  outlierTitleFormula: string;
  outlierThumbnailConcept: string;
  whyItWorked: string;
  outlierMultiplier?: string;
  analysisSource: "api" | "public_scrape";
};

export function formatPublicationDate(publishedDate?: string, publishedText?: string): string {
  if (publishedDate) {
    const d = new Date(publishedDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return publishedDate;
  }
  if (publishedText && publishedText.trim()) {
    return publishedText.trim();
  }
  return "N/A";
}

export function parseBatchChannelUrls(text: string): string[] {
  if (!text) return [];

  // Match full YouTube URLs anywhere in text
  const ytUrlRegex =
    /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:@[\w.-]+|channel\/[\w-]+|c\/[\w.-]+|user\/[\w.-]+|watch\?v=[\w-]+|shorts\/[\w-]+)|youtu\.be\/[\w-]+)/gi;

  const matches = text.match(ytUrlRegex);
  const seen = new Set<string>();
  const validUrls: string[] = [];

  const addUrl = (raw: string) => {
    let url = raw.trim();
    if (!url) return;
    if (url.startsWith("@")) {
      url = `https://www.youtube.com/${url}`;
    } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (
        url.startsWith("youtube.com") ||
        url.startsWith("www.youtube.com") ||
        url.startsWith("m.youtube.com")
      ) {
        url = `https://${url}`;
      } else if (/^UC[\w-]{20,}$/.test(url)) {
        url = `https://www.youtube.com/channel/${url}`;
      } else if (/^[a-zA-Z0-9_.-]{3,30}$/.test(url)) {
        // If it's a plain string without @, ignore common column headers and pure numbers
        const lower = url.toLowerCase();
        const blacklist = [
          "no", "no.", "channel", "name", "channelname", "subscribers", "subs",
          "views", "videos", "videocount", "typicalvideolength",
          "uploadfrequency", "frequency", "topvideo", "notes", "url",
          "link", "youtube", "status", "category", "niche", "style",
          "outlier", "topic", "formula", "thumbnail", "whyitworked", "true", "false",
        ];
        if (!blacklist.includes(lower) && isNaN(Number(url))) {
          url = `https://www.youtube.com/@${url}`;
        } else {
          return;
        }
      } else {
        return;
      }
    }
    const cleanUrl = (url.split("?")[0] || url)
      .replace(/\/videos$/, "")
      .replace(/\/featured$/, "")
      .replace(/\/$/, "");
    if (!seen.has(cleanUrl.toLowerCase())) {
      seen.add(cleanUrl.toLowerCase());
      validUrls.push(cleanUrl);
    }
  };

  // If explicit YouTube links exist, prioritize them
  if (matches && matches.length > 0) {
    for (const m of matches) {
      addUrl(m);
    }
  }

  // Also parse line by line / comma for handles starting with @ or plain handles
  const rawItems = text
    .split(/[\r\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const item of rawItems) {
    if (item.startsWith("@")) {
      addUrl(item);
    } else if (/^UC[\w-]{20,}$/.test(item)) {
      addUrl(item);
    } else if (!matches || matches.length === 0) {
      addUrl(item);
    }
  }

  return validUrls;
}

function parseDurationText(str?: string): number {
  if (!str) return 0;
  const parts = str.trim().split(":").map(Number);
  if (parts.some((p) => isNaN(p))) return 0;
  if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined && parts[2] !== undefined) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1 && parts[0] !== undefined) {
    return parts[0];
  }
  return 0;
}

export function parseViewsText(str?: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/views?/i, "").trim().toLowerCase();
  let mult = 1;
  if (/(?:million|\bm\b)/i.test(cleaned) || cleaned.endsWith("m")) mult = 1e6;
  else if (/(?:thousand|\bk\b)/i.test(cleaned) || cleaned.endsWith("k")) mult = 1e3;
  else if (/(?:billion|\bb\b)/i.test(cleaned) || cleaned.endsWith("b")) mult = 1e9;
  const num = parseFloat(cleaned.replace(/[^\d.]/g, ""));
  return isNaN(num) ? 0 : Math.round(num * mult);
}

export function parseSubscribersToNumber(subscribers?: string): number {
  if (!subscribers) return 0;
  const s = subscribers.trim().toLowerCase();
  if (s.includes("hidden") || s === "n/a") return 0;
  let mult = 1;
  if (/(?:million|\bm\b)/i.test(s) || s.endsWith("m")) mult = 1e6;
  else if (/(?:thousand|\bk\b)/i.test(s) || s.endsWith("k")) mult = 1e3;
  else if (/(?:billion|\bb\b)/i.test(s) || s.endsWith("b")) mult = 1e9;
  const num = parseFloat(s.replace(/subscribers?/i, "").replace(/[^\d.]/g, ""));
  return isNaN(num) ? 0 : Math.round(num * mult);
}

export type RecentVideoCandidate = {
  id: string;
  title: string;
  viewsText: string;
  viewsNum: number;
  durationText: string;
  durationSec: number;
  url: string;
  publishedDate?: string;
  publishedText?: string;
};

export async function detectOutlierVideo({
  candidates,
  subscribersText,
  subscriberCount,
  uploadFrequency,
  channelName,
  customAiKey,
}: {
  candidates: RecentVideoCandidate[];
  subscribersText: string;
  subscriberCount?: number | undefined;
  uploadFrequency: string;
  channelName: string;
  customAiKey?: string | undefined;
}): Promise<{
  outlierVideoTitle: string;
  outlierVideoUrl: string;
  outlierPublicationDate: string;
  outlierVideoViews: string;
  outlierViewsSubRatio: string;
  outlierVideoLength: string;
  outlierTopic: string;
  outlierTitleFormula: string;
  outlierThumbnailConcept: string;
  whyItWorked: string;
  outlierMultiplier: string;
}> {
  if (!candidates || candidates.length === 0) {
    return {
      outlierVideoTitle: "N/A",
      outlierVideoUrl: "",
      outlierPublicationDate: "N/A",
      outlierVideoViews: "N/A",
      outlierViewsSubRatio: "N/A",
      outlierVideoLength: "N/A",
      outlierTopic: "N/A",
      outlierTitleFormula: "N/A",
      outlierThumbnailConcept: "N/A",
      whyItWorked: "N/A",
      outlierMultiplier: "1.0x",
    };
  }

  // Filter: prioritize long-form videos (> 60s) unless channel has only shorts
  const longForm = candidates.filter(
    (c) => c.durationSec > 60 || (!c.durationSec && !c.title.toLowerCase().includes("#shorts")),
  );
  const pool = longForm.length >= 3 ? longForm : candidates;

  // Determine adaptive window size based on upload frequency and volume:
  // - High frequency / daily uploaders (> 2.5 vids/wk or > 10/mo): ~18-25 videos (~3-4 weeks)
  // - Regular / weekly uploaders (0.8 - 2.5 vids/wk or 3-10/mo): ~10-14 videos (~2-3 months)
  // - Low frequency / sporadic / high-effort (< 0.8 vids/wk or < 3/mo): ~6-8 videos (~6-12 months)
  let windowSize = 12;
  const freqLower = (uploadFrequency || "").toLowerCase();
  const freqMatch = freqLower.match(/([\d.]+)\s*videos?\/(week|month)/i);
  if (freqMatch && freqMatch[1]) {
    const num = parseFloat(freqMatch[1]);
    const unit = freqMatch[2]?.toLowerCase();
    if (unit === "week") {
      if (num >= 2.5) windowSize = 22;
      else if (num >= 0.8) windowSize = 12;
      else windowSize = 7;
    } else if (unit === "month") {
      if (num >= 10) windowSize = 22;
      else if (num >= 3) windowSize = 12;
      else windowSize = 7;
    }
  } else if (freqLower.includes("2-3 videos/week") || freqLower.includes("daily")) {
    windowSize = 22;
  } else if (freqLower.includes("1-2 videos/week")) {
    windowSize = 12;
  } else if (freqLower.includes("month") || freqLower.includes("sporadic")) {
    windowSize = 7;
  }

  // Slice recent window bounded by available candidate pool
  const effectiveWindowSize = Math.min(Math.max(windowSize, 3), pool.length);
  const recentWindow = pool.slice(0, effectiveWindowSize);

  // If the newest video (index 0) was uploaded less than 24-48 hours ago and hasn't finished
  // its initial view surge, avoid letting it drag down the median baseline calculation
  const isWarmingUp = (c: RecentVideoCandidate) => {
    if (!c.publishedText) return false;
    const pt = c.publishedText.toLowerCase();
    return pt.includes("hour") || pt.includes("minute") || pt.includes("1 day ago");
  };

  const baselineCandidates =
    recentWindow.length > 3 && isWarmingUp(recentWindow[0]!)
      ? recentWindow.slice(1)
      : recentWindow;

  // Compute Median Views of recent window (channel baseline for current audience)
  const viewsList = baselineCandidates.map((v) => v.viewsNum).filter((v) => v > 0);
  let medianViews = 0;
  if (viewsList.length > 0) {
    const sorted = [...viewsList].sort((a, b) => a - b);
    medianViews = sorted[Math.floor(sorted.length / 2)]!;
  }

  // Find outlier candidate with the highest views in recent window
  let best = recentWindow[0]!;
  for (const v of recentWindow) {
    if (v.viewsNum > best.viewsNum) {
      best = v;
    }
  }

  const multiplier = medianViews > 0 ? best.viewsNum / medianViews : 1.0;
  const multText = `${multiplier.toFixed(1)}x`;

  // Views / Subscribers Ratio
  const subsNum =
    subscriberCount && subscriberCount > 0
      ? subscriberCount
      : parseSubscribersToNumber(subscribersText);

  let viewsSubRatioText = "N/A (Hidden Subs)";
  if (subsNum > 0 && best.viewsNum > 0) {
    const ratio = (best.viewsNum / subsNum) * 100;
    viewsSubRatioText =
      ratio >= 100
        ? `${ratio.toFixed(0)}% (${(ratio / 100).toFixed(1)}x)`
        : `${ratio.toFixed(1)}%`;
  }

  const viewsFormatted =
    best.viewsNum >= 1e6
      ? `${(best.viewsNum / 1e6).toFixed(1)}M views`
      : best.viewsNum >= 1e3
        ? `${(best.viewsNum / 1e3).toFixed(1)}K views`
        : best.viewsNum > 0
          ? `${nf.format(best.viewsNum)} views`
          : best.viewsText || "N/A";

  const videoLength = best.durationText || (best.durationSec ? formatDuration(best.durationSec) : "N/A");

  // Qualitative Packaging Synthesis
  const packaging = await analyzeOutlierPackaging({
    videoTitle: best.title,
    videoViewsText: viewsFormatted,
    videoViewsNum: best.viewsNum,
    medianViewsNum: medianViews,
    multiplier,
    subscribersText,
    viewsSubRatioText,
    channelName,
    durationText: videoLength,
    customAiKey,
  });

  return {
    outlierVideoTitle: best.title,
    outlierVideoUrl: best.url || (best.id ? `https://www.youtube.com/watch?v=${best.id}` : ""),
    outlierPublicationDate: formatPublicationDate(best.publishedDate, best.publishedText),
    outlierVideoViews: viewsFormatted,
    outlierViewsSubRatio: viewsSubRatioText,
    outlierVideoLength: videoLength,
    outlierTopic: packaging.outlierTopic,
    outlierTitleFormula: packaging.outlierTitleFormula,
    outlierThumbnailConcept: packaging.outlierThumbnailConcept,
    whyItWorked: packaging.whyItWorked,
    outlierMultiplier: multText,
  };
}

export type PopularVideoItem = {
  id: string;
  title: string;
  viewsText: string;
  viewsNum: number;
};

export async function getPopularVideosFromChannel(targetUrl: string): Promise<PopularVideoItem[]> {
  let url = (targetUrl || "").trim();
  if (!url) return [];
  if (!url.startsWith("http")) {
    if (url.startsWith("UC")) {
      url = `https://www.youtube.com/channel/${url}`;
    } else {
      url = `https://www.youtube.com/${url.startsWith("@") ? url : "@" + url}`;
    }
  }
  const cleanBase = url.replace(/\/videos$/, "").replace(/\/featured$/, "").replace(/\/$/, "");
  const videosUrl = `${cleanBase}/videos`;

  try {
    const res = await fetchWithRetry(videosUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": "SOCS=CAESEwgDEgk2MTQ5MDUwOTQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+cb.20210328-17-p0.en+FX+478;",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();

    const innertubeKey =
      html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1] ||
      "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

    let popularToken: string | null = null;
    const chipRegex = /"chipViewModel":\{"text":"([^"]+)".+?"token":"([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = chipRegex.exec(html)) !== null) {
      if (match[1]?.toLowerCase() === "popular" && match[2]) {
        popularToken = match[2];
        break;
      }
    }

    if (!popularToken) {
      const chipRegexFallback = /"text":"Popular"[^}]+?"token":"([^"]+)"/;
      const m2 = html.match(chipRegexFallback);
      if (m2?.[1]) popularToken = m2[1];
    }

    if (!popularToken) {
      const jsonMatch =
        html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/) ||
        html.match(/window\["ytInitialData"\]\s*=\s*({.+?});<\/script>/);
      if (jsonMatch?.[1]) {
        try {
          const str = jsonMatch[1];
          const tokenIdx = str.indexOf('"text":"Popular"');
          if (tokenIdx !== -1) {
            const sub = str.slice(tokenIdx, tokenIdx + 500);
            const tm = sub.match(/"token":"([^"]+)"/);
            if (tm?.[1]) popularToken = tm[1];
          }
        } catch {}
      }
    }

    if (!popularToken) return [];

    let currentToken = popularToken;
    const videos: PopularVideoItem[] = [];

    // Page up to 3 pages to gather 60-90 popular videos across the whole channel archive
    for (let page = 0; page < 3; page++) {
      const browseRes = await fetchWithRetry(
        `https://www.youtube.com/youtubei/v1/browse?key=${innertubeKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            context: {
              client: { clientName: "WEB", clientVersion: "2.20240315.01.00" },
            },
            continuation: currentToken,
          }),
        },
      );

      if (!browseRes.ok) break;
      const browseData = (await browseRes.json()) as any;
      const actions = browseData.onResponseReceivedActions || [];
      let nextToken: string | null = null;

      for (const a of actions) {
        const items =
          a.reloadContinuationItemsCommand?.continuationItems ||
          a.appendContinuationItemsAction?.continuationItems ||
          [];

        for (const item of items) {
          const lvm = item.richItemRenderer?.content?.lockupViewModel;
          if (lvm?.contentId) {
            const vTitle = lvm.metadata?.lockupMetadataViewModel?.title?.content || "Untitled Video";
            const metaParts =
              lvm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts || [];
            const vViewsText = metaParts[0]?.text?.content || "";
            videos.push({
              id: lvm.contentId,
              title: vTitle,
              viewsText: vViewsText,
              viewsNum: parseViewsText(vViewsText),
            });
          } else {
            const vr = item.richItemRenderer?.content?.videoRenderer || item.videoRenderer;
            if (vr?.videoId) {
              const vTitle = vr.title?.runs?.[0]?.text || "Untitled Video";
              const vViewsText = vr.viewCountText?.simpleText || "";
              videos.push({
                id: vr.videoId,
                title: vTitle,
                viewsText: vViewsText,
                viewsNum: parseViewsText(vViewsText),
              });
            }
          }
          if (item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
            nextToken = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
          }
        }
      }
      if (!nextToken) break;
      currentToken = nextToken;
    }

    return videos;
  } catch (err) {
    console.warn("getPopularVideosFromChannel failed:", err);
    return [];
  }
}

export async function scrapePublicCompetitor(targetUrl: string, customAiKey?: string): Promise<CompetitorReport> {
  let url = targetUrl.trim();
  const vidMatch =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/ ]{11})/i.exec(
      url,
    );
  if (vidMatch && vidMatch[1]) {
    try {
      const vidRes = await fetchWithRetry(`https://www.youtube.com/watch?v=${vidMatch[1]}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (vidRes.ok) {
        const vidHtml = await vidRes.text();
        const chUrl =
          vidHtml.match(/<link itemprop="url" href="([^"]+)"/)?.[1] ||
          vidHtml.match(/"channelUrl":"([^"]+)"/)?.[1] ||
          vidHtml.match(/"ownerProfileUrl":"([^"]+)"/)?.[1];
        if (chUrl) url = chUrl;
      }
    } catch {}
  }
  if (!url.startsWith("http")) {
    if (url.startsWith("UC")) {
      url = `https://www.youtube.com/channel/${url}`;
    } else {
      url = `https://www.youtube.com/${url.startsWith("@") ? url : "@" + url}`;
    }
  }
  const cleanBase = url.replace(/\/videos$/, "").replace(/\/featured$/, "").replace(/\/$/, "");
  const videosUrl = `${cleanBase}/videos`;

  const res = await fetchWithRetry(videosUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Could not access channel page (Status ${res.status}). Verify the channel URL.`);
  }

  const html = await res.text();
  const jsonMatch =
    html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/) ||
    html.match(/window\["ytInitialData"\]\s*=\s*({.+?});<\/script>/) ||
    html.match(/ytInitialData\s*=\s*({.+?});/);

  let data: any = null;
  if (jsonMatch && jsonMatch[1]) {
    try {
      data = JSON.parse(jsonMatch[1]);
    } catch {
      data = null;
    }
  }

  const meta = data?.metadata?.channelMetadataRenderer;
  const header = data?.header?.pageHeaderRenderer || data?.header?.c4TabbedHeaderRenderer;

  const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
  const channelName =
    meta?.title ||
    header?.pageTitle ||
    ogTitleMatch ||
    "Unknown Channel";

  const avatarUrl =
    meta?.avatar?.thumbnails?.[0]?.url ||
    html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ||
    "";

  const canonicalUrl =
    meta?.channelUrl ||
    html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ||
    cleanBase;

  // Subscribers
  let subscribers = "N/A";
  const subMatch =
    html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/)?.[1] ||
    html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/)?.[1] ||
    html.match(/([0-9][0-9.,KMBkmb]*\s*(?:million|thousand)?)\s*subscribers/i)?.[1];
  if (subMatch) {
    subscribers = subMatch.replace(/subscribers?/i, "").trim();
  }

  // Videos count
  let videoCount = "N/A";
  const vidCountMatch =
    html.match(/"videosCountText":\{"runs":\[\{"text":"([^"]+)"/)?.[1] ||
    html.match(/"videoCountText":\{"runs":\[\{"text":"([^"]+)"/)?.[1] ||
    html.match(/([0-9][0-9.,KMBkmb]*)\s*videos/i)?.[1];
  if (vidCountMatch) {
    videoCount = vidCountMatch.trim();
  }

  // Parse videos from grid
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find(
    (t: any) => t.tabRenderer?.title === "Videos" || t.tabRenderer?.selected,
  );
  const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  const durations: number[] = [];
  const recentCandidates: RecentVideoCandidate[] = [];
  let topVideo: { title: string; views: string; url: string } | null = null;
  let maxViews = -1;

  for (const item of contents) {
    const lvm = item.richItemRenderer?.content?.lockupViewModel;
    if (lvm) {
      const vTitle = lvm.metadata?.lockupMetadataViewModel?.title?.content || "Untitled Video";
      const vDurationText =
        lvm.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel
          ?.badges?.[0]?.thumbnailBadgeViewModel?.text || "";
      const vId = lvm.contentId;
      const metaParts =
        lvm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]
          ?.metadataParts || [];
      const vViewsText = metaParts[0]?.accessibilityLabel || metaParts[0]?.text?.content || "";
      const vPublishedText = metaParts[1]?.text?.content || "";

      const durSec = parseDurationText(vDurationText);
      if (durSec > 0) durations.push(durSec);

      const viewsNum = parseViewsText(vViewsText);
      if (vId) {
        recentCandidates.push({
          id: vId,
          title: vTitle,
          viewsText: vViewsText,
          viewsNum,
          durationText: vDurationText,
          durationSec: durSec,
          url: `https://www.youtube.com/watch?v=${vId}`,
          publishedText: vPublishedText,
        });
      }

      if (viewsNum > maxViews) {
        maxViews = viewsNum;
        topVideo = {
          title: vTitle,
          views: vViewsText || (viewsNum > 0 ? `${nf.format(viewsNum)} views` : "N/A"),
          url: vId ? `https://www.youtube.com/watch?v=${vId}` : "",
        };
      }
    } else {
      const vr = item.richItemRenderer?.content?.videoRenderer || item.videoRenderer;
      if (vr) {
        const vTitle = vr.title?.runs?.[0]?.text || "Untitled Video";
        const vDurationText =
          vr.lengthText?.simpleText ||
          vr.thumbnailOverlays?.find((o: any) => o.thumbnailOverlayTimeStatusRenderer)
            ?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ||
          "";
        const vId = vr.videoId;
        const vViewsText = vr.viewCountText?.simpleText || "";
        const vPublishedText = vr.publishedTimeText?.simpleText || "";

        const durSec = parseDurationText(vDurationText);
        if (durSec > 0) durations.push(durSec);

        const viewsNum = parseViewsText(vViewsText);
        if (vId) {
          recentCandidates.push({
            id: vId,
            title: vTitle,
            viewsText: vViewsText,
            viewsNum,
            durationText: vDurationText,
            durationSec: durSec,
            url: `https://www.youtube.com/watch?v=${vId}`,
            publishedText: vPublishedText,
          });
        }

        if (viewsNum > maxViews) {
          maxViews = viewsNum;
          topVideo = {
            title: vTitle,
            views: vViewsText || (viewsNum > 0 ? `${nf.format(viewsNum)} views` : "N/A"),
            url: vId ? `https://www.youtube.com/watch?v=${vId}` : "",
          };
        }
      }
    }
  }

  // Fetch Popular continuation to ensure all videos across channel history are factored into topVideoViews
  try {
    const popVideos = await getPopularVideosFromChannel(canonicalUrl || cleanBase);
    for (const v of popVideos) {
      const viewsNum = v.viewsNum || parseViewsText(v.viewsText);
      if (viewsNum > maxViews) {
        maxViews = viewsNum;
        topVideo = {
          title: v.title,
          views: v.viewsText || (viewsNum > 0 ? `${nf.format(viewsNum)} views` : "N/A"),
          url: v.id ? `https://www.youtube.com/watch?v=${v.id}` : "",
        };
      }
    }
  } catch (popErr) {
    console.warn("Failed fetching popular videos in scrapePublicCompetitor:", popErr);
  }

  const typicalVideoLength = durations.length
    ? formatDuration(durations.reduce((a, b) => a + b, 0) / durations.length)
    : "N/A";

  const uploadFrequency =
    durations.length >= 6
      ? "~2-3 videos/week"
      : durations.length >= 2
        ? "~1-2 videos/week"
        : durations.length > 0
          ? "~1 video/month"
          : "N/A";

  // Calculate Outlier Video (focused strictly on recent audience views with adaptive parameters)
  const outlier = await detectOutlierVideo({
    candidates: recentCandidates,
    subscribersText: subscribers,
    uploadFrequency,
    channelName,
    customAiKey,
  });

  return {
    id: cleanBase,
    channelName,
    channelUrl: canonicalUrl,
    avatarUrl,
    subscribers,
    videoCount,
    typicalVideoLength,
    uploadFrequency,
    topVideoViews: topVideo?.views || "N/A",
    topVideoTitle: topVideo?.title || "N/A",
    topVideoUrl: topVideo?.url || "",
    outlierVideoTitle: outlier.outlierVideoTitle,
    outlierVideoUrl: outlier.outlierVideoUrl,
    outlierPublicationDate: outlier.outlierPublicationDate,
    outlierVideoViews: outlier.outlierVideoViews,
    outlierViewsSubRatio: outlier.outlierViewsSubRatio,
    outlierVideoLength: outlier.outlierVideoLength,
    outlierTopic: outlier.outlierTopic,
    outlierTitleFormula: outlier.outlierTitleFormula,
    outlierThumbnailConcept: outlier.outlierThumbnailConcept,
    whyItWorked: outlier.whyItWorked,
    outlierMultiplier: outlier.outlierMultiplier,
    analysisSource: "public_scrape",
  };
}

export const analyzeCompetitorChannel = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({
      url: z.string().trim().min(2).max(300),
      apiKey: z.string().trim().optional(),
      aiApiKey: z.string().trim().optional(),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<CompetitorReport> => {
    const key = resolveYoutubeKey(data.apiKey);

    // If an API key is available, attempt the high-fidelity YouTube API route
    if (key) {
      try {
        const ident = parseIdentifier(data.url);
        let channel: any | undefined;

        if (ident.type === "video") {
          const vidRes = await yt("videos", { part: "snippet", id: ident.value }, key);
          const vidChannelId = vidRes.items?.[0]?.snippet?.channelId;
          if (vidChannelId) {
            const r = await yt(
              "channels",
              { part: "snippet,statistics,contentDetails", id: vidChannelId },
              key,
            );
            channel = r.items?.[0];
          }
        } else if (ident.type === "id") {
          const r = await yt(
            "channels",
            { part: "snippet,statistics,contentDetails", id: ident.value },
            key,
          );
          channel = r.items?.[0];
        } else if (ident.type === "handle") {
          const r = await yt(
            "channels",
            { part: "snippet,statistics,contentDetails", forHandle: ident.value },
            key,
          );
          channel = r.items?.[0];
        }

        if (!channel) {
          const search = await yt(
            "search",
            { part: "snippet", type: "channel", maxResults: "1", q: ident.value },
            key,
          );
          const foundId = search.items?.[0]?.snippet?.channelId ?? search.items?.[0]?.id?.channelId;
          if (foundId) {
            const r = await yt(
              "channels",
              { part: "snippet,statistics,contentDetails", id: foundId },
              key,
            );
            channel = r.items?.[0];
          }
        }

        if (channel) {
          const uploadsId: string | undefined = channel.contentDetails?.relatedPlaylists?.uploads;
          let videoIds: string[] = [];
          let uploadDates: string[] = [];

          if (uploadsId) {
            const playlist = await yt(
              "playlistItems",
              {
                part: "contentDetails",
                playlistId: uploadsId,
                maxResults: "50",
              },
              key,
            );
            const items = playlist.items ?? [];
            videoIds = items.map((i: any) => i.contentDetails?.videoId).filter(Boolean);
            uploadDates = items.map((i: any) => i.contentDetails?.videoPublishedAt).filter(Boolean);
          }

          let videos: any[] = [];
          if (videoIds.length > 0) {
            const r = await yt(
              "videos",
              { part: "snippet,contentDetails,statistics", id: videoIds.join(",") },
              key,
            );
            videos = r.items ?? [];
          }

          const durations = videos
            .map((v) => isoDurationToSeconds(v.contentDetails?.duration ?? ""))
            .filter((n) => n > 0);
          const typicalVideoLength = durations.length
            ? formatDuration(durations.reduce((a, b) => a + b, 0) / durations.length)
            : "N/A";

          let uploadFrequency = "N/A";
          if (uploadDates.length >= 2) {
            const times = uploadDates.map((d) => new Date(d).getTime()).sort((a, b) => b - a);
            const first = times[0]!;
            const last = times[times.length - 1]!;
            const days = (first - last) / 86_400_000;
            const perWeek = days > 0 ? ((times.length - 1) / days) * 7 : 0;
            uploadFrequency =
              perWeek >= 1
                ? `${perWeek.toFixed(1)} videos/week`
                : perWeek > 0
                  ? `${(perWeek * 4.345).toFixed(1)} videos/month`
                  : "N/A";
          }

          let best: any | undefined;
          let bestShort: any | undefined;
          const pickBest = (list: any[]) => {
            for (const v of list) {
              const views = Number(v.statistics?.viewCount ?? 0);
              const isShort = isoDurationToSeconds(v.contentDetails?.duration ?? "") <= 60;
              if (isShort) {
                if (!bestShort || views > Number(bestShort.statistics?.viewCount ?? -1)) bestShort = v;
              } else if (!best || views > Number(best.statistics?.viewCount ?? -1)) {
                best = v;
              }
            }
          };
          pickBest(videos);

          const handle: string | undefined = channel.snippet?.customUrl;
          const canonicalUrl = handle
            ? `https://www.youtube.com/${handle.startsWith("@") ? handle : "@" + handle}`
            : `https://www.youtube.com/channel/${channel.id}`;

          // Factor in all-time viral/popular videos across whole channel history
          try {
            const popVideos = await getPopularVideosFromChannel(canonicalUrl || channel.id || data.url);
            if (popVideos.length > 0) {
              const popIds = popVideos.slice(0, 50).map((v) => v.id).filter(Boolean);
              const popStats = await yt(
                "videos",
                { part: "snippet,contentDetails,statistics", id: popIds.join(",") },
                key,
              );
              if (popStats?.items) {
                pickBest(popStats.items);
              }
            }
          } catch (popErr) {
            console.warn("Popular videos query in analyzeCompetitorChannel failed:", popErr);
          }

          if (!best) best = bestShort;

          const hiddenSubs = channel.statistics?.hiddenSubscriberCount === true;
          const subCount = Number(channel.statistics?.subscriberCount ?? 0);
          const subscribers = hiddenSubs
            ? "Hidden"
            : subCount >= 1e6
              ? `${(subCount / 1e6).toFixed(1)}M`
              : subCount >= 1e3
                ? `${(subCount / 1e3).toFixed(1)}K`
                : nf.format(subCount);

          const avatarUrl =
            channel.snippet?.thumbnails?.medium?.url ||
            channel.snippet?.thumbnails?.default?.url ||
            "";

          const apiCandidates: RecentVideoCandidate[] = videos.map((v) => {
            const durSec = isoDurationToSeconds(v.contentDetails?.duration ?? "");
            const viewsNum = Number(v.statistics?.viewCount ?? 0);
            return {
              id: v.id,
              title: v.snippet?.title ?? "Untitled Video",
              viewsText:
                viewsNum >= 1e6
                  ? `${(viewsNum / 1e6).toFixed(1)}M views`
                  : `${nf.format(viewsNum)} views`,
              viewsNum,
              durationText: formatDuration(durSec),
              durationSec: durSec,
              url: `https://www.youtube.com/watch?v=${v.id}`,
              publishedDate: v.snippet?.publishedAt,
            };
          });

          const outlier = await detectOutlierVideo({
            candidates: apiCandidates,
            subscribersText: subscribers,
            subscriberCount: subCount,
            uploadFrequency,
            channelName: channel.snippet?.title ?? "Unknown",
            customAiKey: data.aiApiKey,
          });

          return {
            id: channel.id || canonicalUrl,
            channelName: channel.snippet?.title ?? "Unknown",
            channelUrl: canonicalUrl,
            avatarUrl,
            subscribers,
            videoCount: nf.format(Number(channel.statistics?.videoCount ?? 0)),
            typicalVideoLength,
            uploadFrequency,
            topVideoViews: best
              ? Number(best.statistics?.viewCount ?? 0) >= 1e6
                ? `${(Number(best.statistics?.viewCount ?? 0) / 1e6).toFixed(1)}M views`
                : `${nf.format(Number(best.statistics?.viewCount ?? 0))} views`
              : "N/A",
            topVideoTitle: best?.snippet?.title ?? "N/A",
            topVideoUrl: best ? `https://www.youtube.com/watch?v=${best.id}` : "",
            outlierVideoTitle: outlier.outlierVideoTitle,
            outlierVideoUrl: outlier.outlierVideoUrl,
            outlierPublicationDate: outlier.outlierPublicationDate,
            outlierVideoViews: outlier.outlierVideoViews,
            outlierViewsSubRatio: outlier.outlierViewsSubRatio,
            outlierVideoLength: outlier.outlierVideoLength,
            outlierTopic: outlier.outlierTopic,
            outlierTitleFormula: outlier.outlierTitleFormula,
            outlierThumbnailConcept: outlier.outlierThumbnailConcept,
            whyItWorked: outlier.whyItWorked,
            outlierMultiplier: outlier.outlierMultiplier,
            analysisSource: "api",
          };
        }
      } catch (apiErr) {
        console.warn("YouTube API call for competitor failed, falling back to scraper:", apiErr);
      }
    }

    // Fallback path: Public Web Scraper
    return scrapePublicCompetitor(data.url, data.aiApiKey);
  });


