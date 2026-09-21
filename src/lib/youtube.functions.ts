import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getChannelNicheAndStyle } from "./classifier";

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
  const hasServerKey = Boolean(
    process.env["YOUTUBE_API_KEY"] ||
      process.env["VITE_YOUTUBE_API_KEY"] ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.["VITE_YOUTUBE_API_KEY"] ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.["YOUTUBE_API_KEY"],
  );
  return { hasServerKey };
});

export const validateApiKey = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ apiKey: z.string().trim().min(1) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(
        `${API}/channels?part=id&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${encodeURIComponent(data.apiKey)}`,
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

function parseIdentifier(raw: string) {
  const value = raw.trim();
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
  const res = await fetch(`${API}/${path}?${qs}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<any>;
}

function isoDurationToSeconds(iso: string) {
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
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ChannelReport> => {
    const key =
      data.apiKey?.trim() ||
      process.env["YOUTUBE_API_KEY"] ||
      process.env["VITE_YOUTUBE_API_KEY"] ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.["VITE_YOUTUBE_API_KEY"] ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.["YOUTUBE_API_KEY"];
    if (!key) {
      throw new Error("Missing YouTube API key. Click 'API Key' to add your key or configure YOUTUBE_API_KEY.");
    }

    const ident = parseIdentifier(data.url);

    let channel: any | undefined;
    if (ident.type === "id") {
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
    const allVideoIds: string[] = [];

    if (uploadsId) {
      // Page through the uploads playlist so "best video" looks at the whole
      // library, not just the latest 50 (search.list only indexes a handful).
      let pageToken: string | undefined;
      const MAX_PAGES = 400; // up to 20,000 videos (whole channel)
      for (let page = 0; page < MAX_PAGES; page++) {
        const params: Record<string, string> = {
          part: "contentDetails",
          playlistId: uploadsId,
          maxResults: "50",
        };
        if (pageToken) params["pageToken"] = pageToken;
        const playlist = await yt("playlistItems", params, key);
        const items = playlist.items ?? [];
        for (const i of items) {
          const id = i.contentDetails?.videoId;
          if (id) allVideoIds.push(id);
        }
        if (page === 0) {
          videoIds = items
            .map((i: any) => i.contentDetails?.videoId)
            .filter(Boolean)
            .slice(0, 50);
          uploadDates = items
            .map((i: any) => i.contentDetails?.videoPublishedAt)
            .filter(Boolean);
        }
        pageToken = playlist.nextPageToken;
        if (!pageToken) break;
      }
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

    // Search all-time top videos by viewCount to ensure whole-channel history is factored in
    try {
      const searchTop = await yt(
        "search",
        {
          part: "snippet",
          channelId: channel.id,
          type: "video",
          order: "viewCount",
          maxResults: "10",
        },
        key,
      );
      if (searchTop?.items?.length) {
        const topIds = searchTop.items.map((i: any) => i.id?.videoId).filter(Boolean);
        if (topIds.length > 0) {
          const topStats = await yt(
            "videos",
            { part: "snippet,contentDetails,statistics", id: topIds.join(",") },
            key,
          );
          if (topStats?.items) {
            pickBest(topStats.items);
          }
        }
      }
    } catch (searchErr) {
      console.warn("API search by viewCount failed:", searchErr);
    }

    const seen = new Set(videoIds);
    const remaining = allVideoIds.filter((id) => !seen.has(id));
    const chunks: string[][] = [];
    for (let i = 0; i < remaining.length; i += 50) chunks.push(remaining.slice(i, i + 50));

    // Fetch stats batches in parallel waves so big channels stay fast.
    const WAVE = 10;
    for (let i = 0; i < chunks.length; i += WAVE) {
      const results = await Promise.all(
        chunks.slice(i, i + WAVE).map(async (chunk) => {
          try {
            const r = await yt(
              "videos",
              { part: "snippet,contentDetails,statistics", id: chunk.join(",") },
              key,
            );
            return (r.items ?? []) as any[];
          } catch (err) {
            console.error("Stats batch failed:", err);
            return [] as any[];
          }
        }),
      );
      for (const list of results) pickBest(list);
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

    const handle: string | undefined = channel.snippet?.customUrl;
    const canonicalUrl = handle
      ? `https://www.youtube.com/${handle.startsWith("@") ? handle : "@" + handle}`
      : `https://www.youtube.com/channel/${channel.id}`;

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
  analysisSource: "api" | "public_scrape";
};

export function parseBatchChannelUrls(text: string): string[] {
  if (!text) return [];
  const rawItems = text
    .split(/[\r\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const validUrls: string[] = [];

  for (let item of rawItems) {
    item = item.trim();
    if (!item) continue;
    let url = item;
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
      } else {
        url = `https://www.youtube.com/@${url}`;
      }
    }
    const cleanUrl = url
      .split("?")[0]
      .replace(/\/videos$/, "")
      .replace(/\/featured$/, "")
      .replace(/\/$/, "");
    if (!seen.has(cleanUrl.toLowerCase())) {
      seen.add(cleanUrl.toLowerCase());
      validUrls.push(cleanUrl);
    }
  }

  return validUrls;
}

function parseDurationText(str?: string): number {
  if (!str) return 0;
  const parts = str.trim().split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

function parseViewsText(str?: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/views?/i, "").trim().toLowerCase();
  let mult = 1;
  if (cleaned.endsWith("k")) mult = 1e3;
  else if (cleaned.endsWith("m")) mult = 1e6;
  else if (cleaned.endsWith("b")) mult = 1e9;
  const num = parseFloat(cleaned.replace(/[^\d.]/g, ""));
  return isNaN(num) ? 0 : Math.round(num * mult);
}

export async function scrapePublicCompetitor(targetUrl: string): Promise<CompetitorReport> {
  let url = targetUrl.trim();
  if (!url.startsWith("http")) {
    url = `https://www.youtube.com/${url.startsWith("@") ? url : "@" + url}`;
  }
  const cleanBase = url.replace(/\/videos$/, "").replace(/\/featured$/, "").replace(/\/$/, "");
  const videosUrl = `${cleanBase}/videos`;

  const res = await fetch(videosUrl, {
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
  if (jsonMatch) {
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
  const vidMatch =
    html.match(/"videosCountText":\{"runs":\[\{"text":"([^"]+)"/)?.[1] ||
    html.match(/"videoCountText":\{"runs":\[\{"text":"([^"]+)"/)?.[1] ||
    html.match(/([0-9][0-9.,KMBkmb]*)\s*videos/i)?.[1];
  if (vidMatch) {
    videoCount = vidMatch.trim();
  }

  // Parse videos from grid
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find(
    (t: any) => t.tabRenderer?.title === "Videos" || t.tabRenderer?.selected,
  );
  const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  const durations: number[] = [];
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
      const vViewsText = metaParts[0]?.text?.content || "";

      const durSec = parseDurationText(vDurationText);
      if (durSec > 0) durations.push(durSec);

      const viewsNum = parseViewsText(vViewsText);
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
        const vDurationText = vr.lengthText?.simpleText || "";
        const vId = vr.videoId;
        const vViewsText = vr.viewCountText?.simpleText || "";

        const durSec = parseDurationText(vDurationText);
        if (durSec > 0) durations.push(durSec);

        const viewsNum = parseViewsText(vViewsText);
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
  const innertubeKey =
    html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1] ||
    "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
  const popularTokenMatch =
    html.match(/"text":"Popular"[^}]+"token":"([^"]+)"/) ||
    html.match(/"chipViewModel":\{"text":"Popular".+?"token":"([^"]+)"/);

  if (popularTokenMatch && innertubeKey) {
    try {
      const token = popularTokenMatch[1];
      const browseRes = await fetch(
        `https://www.youtube.com/youtubei/v1/browse?key=${innertubeKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            context: { client: { clientName: "WEB", clientVersion: "2.20240315.01.00" } },
            continuation: token,
          }),
        },
      );

      if (browseRes.ok) {
        const browseData = (await browseRes.json()) as any;
        const actions = browseData.onResponseReceivedActions || [];
        for (const a of actions) {
          const reloadItems =
            a.reloadContinuationItemsCommand?.continuationItems ||
            a.appendContinuationItemsAction?.continuationItems ||
            [];

          for (const item of reloadItems) {
            const lvm = item.richItemRenderer?.content?.lockupViewModel;
            if (lvm) {
              const vTitle = lvm.metadata?.lockupMetadataViewModel?.title?.content || "Untitled Video";
              const vId = lvm.contentId;
              const metaParts =
                lvm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel
                  ?.metadataRows?.[0]?.metadataParts || [];
              const vViewsText = metaParts[0]?.text?.content || "";
              const viewsNum = parseViewsText(vViewsText);

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
                const vId = vr.videoId;
                const vViewsText = vr.viewCountText?.simpleText || "";
                const viewsNum = parseViewsText(vViewsText);

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
        }
      }
    } catch (popErr) {
      console.warn("Failed fetching popular continuation:", popErr);
    }
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
    analysisSource: "public_scrape",
  };
}

export const analyzeCompetitorChannel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      url: z.string().trim().min(2).max(300),
      apiKey: z.string().trim().optional(),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<CompetitorReport> => {
    const key =
      data.apiKey?.trim() ||
      process.env["YOUTUBE_API_KEY"] ||
      process.env["VITE_YOUTUBE_API_KEY"] ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.["VITE_YOUTUBE_API_KEY"] ||
      (import.meta as unknown as { env?: Record<string, string> }).env?.["YOUTUBE_API_KEY"];

    // If an API key is available, attempt the high-fidelity YouTube API route
    if (key) {
      try {
        const ident = parseIdentifier(data.url);
        let channel: any | undefined;

        if (ident.type === "id") {
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
          const allVideoIds: string[] = [];

          if (uploadsId) {
            let pageToken: string | undefined;
            const MAX_PAGES = 50; // fast wave for competitors
            for (let page = 0; page < MAX_PAGES; page++) {
              const params: Record<string, string> = {
                part: "contentDetails",
                playlistId: uploadsId,
                maxResults: "50",
              };
              if (pageToken) params["pageToken"] = pageToken;
              const playlist = await yt("playlistItems", params, key);
              const items = playlist.items ?? [];
              for (const i of items) {
                const id = i.contentDetails?.videoId;
                if (id) allVideoIds.push(id);
              }
              if (page === 0) {
                videoIds = items
                  .map((i: any) => i.contentDetails?.videoId)
                  .filter(Boolean)
                  .slice(0, 50);
                uploadDates = items
                  .map((i: any) => i.contentDetails?.videoPublishedAt)
                  .filter(Boolean);
              }
              pageToken = playlist.nextPageToken;
              if (!pageToken) break;
            }
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

          // Query search by viewCount across all videos on the channel
          try {
            const searchTop = await yt(
              "search",
              {
                part: "snippet",
                channelId: channel.id,
                type: "video",
                order: "viewCount",
                maxResults: "10",
              },
              key,
            );
            if (searchTop?.items?.length) {
              const topIds = searchTop.items.map((i: any) => i.id?.videoId).filter(Boolean);
              if (topIds.length > 0) {
                const topStats = await yt(
                  "videos",
                  { part: "snippet,contentDetails,statistics", id: topIds.join(",") },
                  key,
                );
                if (topStats?.items) {
                  pickBest(topStats.items);
                }
              }
            }
          } catch (searchErr) {
            console.warn("API search by viewCount failed:", searchErr);
          }

          const seen = new Set(videoIds);
          const remaining = allVideoIds.filter((id) => !seen.has(id)).slice(0, 500);
          const chunks: string[][] = [];
          for (let i = 0; i < remaining.length; i += 50) chunks.push(remaining.slice(i, i + 50));

          const WAVE = 5;
          for (let i = 0; i < chunks.length; i += WAVE) {
            const results = await Promise.all(
              chunks.slice(i, i + WAVE).map(async (chunk) => {
                try {
                  const r = await yt(
                    "videos",
                    { part: "snippet,contentDetails,statistics", id: chunk.join(",") },
                    key,
                  );
                  return (r.items ?? []) as any[];
                } catch {
                  return [] as any[];
                }
              }),
            );
            for (const list of results) pickBest(list);
          }

          if (!best) best = bestShort;

          const handle: string | undefined = channel.snippet?.customUrl;
          const canonicalUrl = handle
            ? `https://www.youtube.com/${handle.startsWith("@") ? handle : "@" + handle}`
            : `https://www.youtube.com/channel/${channel.id}`;

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
            analysisSource: "api",
          };
        }
      } catch (apiErr) {
        console.warn("YouTube API call for competitor failed, falling back to scraper:", apiErr);
      }
    }

    // Fallback path: Public Web Scraper
    return scrapePublicCompetitor(data.url);
  });

