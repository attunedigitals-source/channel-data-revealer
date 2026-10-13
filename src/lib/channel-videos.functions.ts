import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveYoutubeKey, fetchWithRetry } from "./server-config";
import {
  parseIdentifier,
  isoDurationToSeconds,
  parseViewsText,
  parseSubscribersToNumber,
} from "./youtube.functions";

export type ChannelVideoTile = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
  publishedDate: string;
  publishedIso?: string;
  viewsNum: number;
  viewsText: string;
  durationSec: number;
  durationText: string;
  isShort: boolean;
  multiplier: number;
  multiplierText: string;
  viewsSubRatio?: string;
  channelTitle: string;
  channelUrl: string;
  likesNum?: number;
  commentsNum?: number;
};

export type ChannelDetails = {
  id: string;
  title: string;
  handle: string;
  url: string;
  avatarUrl: string;
  subscribers: string;
  subscriberCount: number;
  videoCount: string;
  videoCountNum: number;
  description?: string;
};

const API = "https://www.googleapis.com/youtube/v3";
const nf = new Intl.NumberFormat("en-US");

function formatCompactViews(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num > 0 ? nf.format(num) : "0";
}

function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
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

export function parseVideoTimestamp(publishedAt?: string, publishedDate?: string): number {
  if (publishedAt && publishedAt.trim()) {
    const t = new Date(publishedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (publishedDate && publishedDate.trim()) {
    const t = new Date(publishedDate).getTime();
    if (!isNaN(t) && t > 0) return t;

    const lower = publishedDate.toLowerCase();
    const numMatch = lower.match(/\d+/);
    const amount = numMatch ? parseInt(numMatch[0], 10) : 1;
    const now = Date.now();

    if (lower.includes("second")) return now - amount * 1000;
    if (lower.includes("minute")) return now - amount * 60 * 1000;
    if (lower.includes("hour")) return now - amount * 3600 * 1000;
    if (lower.includes("day")) return now - amount * 86400 * 1000;
    if (lower.includes("week")) return now - amount * 7 * 86400 * 1000;
    if (lower.includes("month")) return now - amount * 30 * 86400 * 1000;
    if (lower.includes("year")) return now - amount * 365 * 86400 * 1000;
  }
  return 0;
}

export const fetchChannelVideos = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        url: z.string().trim().min(2).max(300),
        apiKey: z.string().trim().optional(),
        pageToken: z.string().optional(),
        maxResults: z.number().optional().default(50),
      })
      .parse(input),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      channel: ChannelDetails;
      videos: ChannelVideoTile[];
      nextPageToken?: string;
      totalFound: number;
      medianViews: number;
      source: "api" | "scrape";
    }> => {
      const key = resolveYoutubeKey(data.apiKey);
      const rawUrl = data.url.trim();

      // Path 1: YouTube API v3 (High fidelity)
      if (key) {
        try {
          const ident = parseIdentifier(rawUrl);
          let channelItem: any | undefined;

          if (ident.type === "video") {
            const vidRes = await yt("videos", { part: "snippet", id: ident.value }, key);
            const vidChannelId = vidRes.items?.[0]?.snippet?.channelId;
            if (vidChannelId) {
              const r = await yt(
                "channels",
                { part: "snippet,statistics,contentDetails", id: vidChannelId },
                key,
              );
              channelItem = r.items?.[0];
            }
          } else if (ident.type === "id") {
            const r = await yt(
              "channels",
              { part: "snippet,statistics,contentDetails", id: ident.value },
              key,
            );
            channelItem = r.items?.[0];
          } else if (ident.type === "handle") {
            const r = await yt(
              "channels",
              { part: "snippet,statistics,contentDetails", forHandle: ident.value },
              key,
            );
            channelItem = r.items?.[0];
          }

          if (!channelItem) {
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
              channelItem = r.items?.[0];
            }
          }

          if (channelItem) {
            const channelTitle = channelItem.snippet?.title || "Creator";
            const handle = channelItem.snippet?.customUrl
              ? `@${channelItem.snippet.customUrl.replace(/^@/, "")}`
              : `@${channelTitle.replace(/\s+/g, "").toLowerCase()}`;
            const canonicalUrl = `https://www.youtube.com/${handle}`;
            const subCount = Number(channelItem.statistics?.subscriberCount ?? 0);
            const hiddenSubs = channelItem.statistics?.hiddenSubscriberCount === true;
            const subscribers = hiddenSubs
              ? "Hidden"
              : subCount > 0
                ? formatCompactViews(subCount)
                : "0";
            const videoCountNum = Number(channelItem.statistics?.videoCount ?? 0);
            const videoCount = nf.format(videoCountNum);
            const avatarUrl =
              channelItem.snippet?.thumbnails?.medium?.url ||
              channelItem.snippet?.thumbnails?.default?.url ||
              "";

            const channel: ChannelDetails = {
              id: channelItem.id || canonicalUrl,
              title: channelTitle,
              handle,
              url: canonicalUrl,
              avatarUrl,
              subscribers,
              subscriberCount: subCount,
              videoCount,
              videoCountNum,
              description: channelItem.snippet?.description,
            };

            const uploadsId: string | undefined =
              channelItem.contentDetails?.relatedPlaylists?.uploads;
            let videoIds: string[] = [];
            let ytNextToken: string | undefined;

            if (uploadsId) {
              const playlistParams: Record<string, string> = {
                part: "contentDetails,snippet",
                playlistId: uploadsId,
                maxResults: String(Math.min(data.maxResults || 50, 50)),
              };
              if (data.pageToken) {
                playlistParams["pageToken"] = data.pageToken;
              }

              const playlist = await yt("playlistItems", playlistParams, key);
              ytNextToken = playlist.nextPageToken;
              videoIds = (playlist.items ?? [])
                .map((i: any) => i.contentDetails?.videoId)
                .filter(Boolean);
            }

            if (videoIds.length > 0) {
              const vidRes = await yt(
                "videos",
                { part: "snippet,contentDetails,statistics", id: videoIds.join(",") },
                key,
              );
              const videosRaw: any[] = vidRes.items ?? [];

              // Compute median views for multiplier computation
              const viewsList = videosRaw
                .map((v) => Number(v.statistics?.viewCount ?? 0))
                .filter((v) => v > 0);
              let medianViews = 1000;
              if (viewsList.length > 0) {
                const sorted = [...viewsList].sort((a, b) => a - b);
                medianViews = sorted[Math.floor(sorted.length / 2)] || 1000;
              }

              const tiles: ChannelVideoTile[] = videosRaw.map((v) => {
                const viewsNum = Number(v.statistics?.viewCount ?? 0);
                const durSec = isoDurationToSeconds(v.contentDetails?.duration ?? "");
                const isShort = durSec <= 60 || (v.snippet?.title || "").toLowerCase().includes("#shorts");
                const mult = medianViews > 0 ? viewsNum / medianViews : 1.0;
                const pubDate = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt) : null;
                const publishedIso =
                  pubDate && !isNaN(pubDate.getTime())
                    ? pubDate.toISOString().slice(0, 10)
                    : "";
                const pubFormatted =
                  pubDate && !isNaN(pubDate.getTime())
                    ? pubDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recent";

                const thumbs = v.snippet?.thumbnails;
                const thumbUrl =
                  thumbs?.maxres?.url ||
                  thumbs?.standard?.url ||
                  thumbs?.high?.url ||
                  thumbs?.medium?.url ||
                  `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

                let viewsSubRatio: string | undefined;
                if (subCount > 0 && viewsNum > 0) {
                  const ratio = (viewsNum / subCount) * 100;
                  viewsSubRatio =
                    ratio >= 100
                      ? `${ratio.toFixed(0)}% (${(ratio / 100).toFixed(1)}x)`
                      : `${ratio.toFixed(1)}%`;
                }

                return {
                  id: v.id,
                  title: v.snippet?.title || "Untitled Video",
                  url: `https://www.youtube.com/watch?v=${v.id}`,
                  thumbnailUrl: thumbUrl,
                  publishedAt: v.snippet?.publishedAt || "",
                  publishedDate: pubFormatted,
                  publishedIso: publishedIso || undefined,
                  viewsNum,
                  viewsText: formatCompactViews(viewsNum),
                  durationSec: durSec,
                  durationText: formatDuration(durSec),
                  isShort,
                  multiplier: Number(mult.toFixed(1)),
                  multiplierText: `${mult.toFixed(1)}x`,
                  viewsSubRatio,
                  channelTitle,
                  channelUrl: canonicalUrl,
                  likesNum: Number(v.statistics?.likeCount ?? 0),
                  commentsNum: Number(v.statistics?.commentCount ?? 0),
                };
              });

              // Ensure videos are arranged by dates with the latest being at the top
              tiles.sort(
                (a, b) =>
                  parseVideoTimestamp(b.publishedAt, b.publishedDate) -
                  parseVideoTimestamp(a.publishedAt, a.publishedDate),
              );

              return {
                channel,
                videos: tiles,
                nextPageToken: ytNextToken,
                totalFound: videoCountNum || tiles.length,
                medianViews,
                source: "api",
              };
            }

            return {
              channel,
              videos: [],
              nextPageToken: undefined,
              totalFound: videoCountNum || 0,
              medianViews: 0,
              source: "api",
            };
          }
        } catch (apiErr) {
          console.warn("YouTube API call failed in fetchChannelVideos, falling back to public scrape:", apiErr);
        }
      }

      // Path 2: Public Scraper Fallback
      return scrapePublicChannelVideos(rawUrl);
    },
  );

async function scrapePublicChannelVideos(targetUrl: string): Promise<{
  channel: ChannelDetails;
  videos: ChannelVideoTile[];
  nextPageToken?: string;
  totalFound: number;
  medianViews: number;
  source: "api" | "scrape";
}> {
  let url = targetUrl.trim();
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
      Cookie: "SOCS=CAESEwgDEgk2MTQ5MDUwOTQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+cb.20210328-17-p0.en+FX+478;",
    },
  });

  if (!res.ok) {
    throw new Error(`Could not access channel videos (HTTP ${res.status}). Verify the channel URL.`);
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
  const channelName = meta?.title || header?.pageTitle || ogTitleMatch || "Unknown Channel";
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
  const subscriberCount = parseSubscribersToNumber(subscribers);

  // Video Count
  let videoCount = "N/A";
  const vidCountMatch =
    html.match(/"videosCountText":\{"runs":\[\{"text":"([^"]+)"/)?.[1] ||
    html.match(/"videoCountText":\{"runs":\[\{"text":"([^"]+)"/)?.[1] ||
    html.match(/([0-9][0-9.,KMBkmb]*)\s*videos/i)?.[1];
  if (vidCountMatch) {
    videoCount = vidCountMatch.trim();
  }
  const videoCountNum = parseInt(videoCount.replace(/[^\d]/g, ""), 10) || 0;

  const channel: ChannelDetails = {
    id: cleanBase,
    title: channelName,
    handle: `@${cleanBase.split("/").pop()?.replace(/^@/, "") || channelName}`,
    url: canonicalUrl,
    avatarUrl,
    subscribers,
    subscriberCount,
    videoCount: videoCount !== "N/A" ? videoCount : "Available",
    videoCountNum,
  };

  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find(
    (t: any) => t.tabRenderer?.title === "Videos" || t.tabRenderer?.selected,
  );
  const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  const rawTiles: ChannelVideoTile[] = [];

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
      const viewsNum = parseViewsText(vViewsText);

      if (vId) {
        rawTiles.push({
          id: vId,
          title: vTitle,
          url: `https://www.youtube.com/watch?v=${vId}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
          publishedAt: vPublishedText,
          publishedDate: vPublishedText || "Recent",
          viewsNum,
          viewsText: vViewsText ? vViewsText.replace(/views?/i, "").trim() : formatCompactViews(viewsNum),
          durationSec: durSec,
          durationText: vDurationText || formatDuration(durSec),
          isShort: durSec <= 60 || vTitle.toLowerCase().includes("#shorts"),
          multiplier: 1.0,
          multiplierText: "1.0x",
          channelTitle: channelName,
          channelUrl: canonicalUrl,
        });
      }
    } else {
      const vr = item.richItemRenderer?.content?.videoRenderer || item.videoRenderer;
      if (vr && vr.videoId) {
        const vTitle = vr.title?.runs?.[0]?.text || "Untitled Video";
        const vDurationText =
          vr.lengthText?.simpleText ||
          vr.thumbnailOverlays?.find((o: any) => o.thumbnailOverlayTimeStatusRenderer)
            ?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ||
          "";
        const vViewsText = vr.viewCountText?.simpleText || "";
        const vPublishedText = vr.publishedTimeText?.simpleText || "";

        const durSec = parseDurationText(vDurationText);
        const viewsNum = parseViewsText(vViewsText);

        rawTiles.push({
          id: vr.videoId,
          title: vTitle,
          url: `https://www.youtube.com/watch?v=${vr.videoId}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
          publishedAt: vPublishedText,
          publishedDate: vPublishedText || "Recent",
          viewsNum,
          viewsText: vViewsText ? vViewsText.replace(/views?/i, "").trim() : formatCompactViews(viewsNum),
          durationSec: durSec,
          durationText: vDurationText || formatDuration(durSec),
          isShort: durSec <= 60 || vTitle.toLowerCase().includes("#shorts"),
          multiplier: 1.0,
          multiplierText: "1.0x",
          channelTitle: channelName,
          channelUrl: canonicalUrl,
        });
      }
    }
  }

  // Calculate median views
  const viewsList = rawTiles.map((v) => v.viewsNum).filter((n) => n > 0);
  let medianViews = 1000;
  if (viewsList.length > 0) {
    const sorted = [...viewsList].sort((a, b) => a - b);
    medianViews = sorted[Math.floor(sorted.length / 2)] || 1000;
  }

  // Set multipliers and views/sub ratios
  const tiles: ChannelVideoTile[] = rawTiles.map((v) => {
    const mult = medianViews > 0 && v.viewsNum > 0 ? v.viewsNum / medianViews : 1.0;
    let viewsSubRatio: string | undefined;
    if (subscriberCount > 0 && v.viewsNum > 0) {
      const ratio = (v.viewsNum / subscriberCount) * 100;
      viewsSubRatio =
        ratio >= 100
          ? `${ratio.toFixed(0)}% (${(ratio / 100).toFixed(1)}x)`
          : `${ratio.toFixed(1)}%`;
    }

    return {
      ...v,
      multiplier: Number(mult.toFixed(1)),
      multiplierText: `${mult.toFixed(1)}x`,
      viewsSubRatio,
    };
  });

  // Ensure scraped videos are arranged by dates with the latest being at the top
  tiles.sort(
    (a, b) =>
      parseVideoTimestamp(b.publishedAt, b.publishedDate) -
      parseVideoTimestamp(a.publishedAt, a.publishedDate),
  );

  return {
    channel,
    videos: tiles,
    nextPageToken: undefined,
    totalFound: videoCountNum || tiles.length,
    medianViews,
    source: "scrape",
  };
}
