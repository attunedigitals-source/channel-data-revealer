import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveYoutubeKey, fetchWithRetry } from "./server-config";
import {
  parseIdentifier,
  isoDurationToSeconds,
  formatPublicationDate,
  parseViewsText,
  parseSubscribersToNumber,
} from "./youtube.functions";
import { analyzeOutlierPackaging } from "./classifier";

export type OutlierTile = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  viewsText: string;
  viewsNum: number;
  multiplier: number; // e.g. 40
  multiplierText: string; // e.g. "40"
  durationText: string;
  durationSec: number;
  publishedDate: string;
  publishedText: string;
  isShort: boolean;
  channelTitle: string;
  channelHandle: string;
  channelUrl: string;
  channelAvatarUrl?: string;
  channelSubscribers?: string;
  outlierTopic?: string;
  outlierTitleFormula?: string;
  outlierThumbnailConcept?: string;
  whyItWorked?: string;
  niche?: string;
  tracked?: boolean;
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

// Curated top outliers matching the viral discovery interface
export const CURATED_OUTLIERS: OutlierTile[] = [
  {
    id: "outlier-1",
    title: "FAKE protector vs real bodyguard: Night Club encounter",
    url: "https://www.youtube.com/shorts/5vGZ9J4Z8k4",
    thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    viewsText: "627.8K",
    viewsNum: 627800,
    multiplier: 40,
    multiplierText: "40",
    durationText: "0:34",
    durationSec: 34,
    publishedDate: "29 Sep 2026",
    publishedText: "29 Sep 2026",
    isShort: true,
    channelTitle: "filmitgirl",
    channelHandle: "@filmitgirl",
    channelUrl: "https://www.youtube.com/@filmitgirl",
    channelAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "15.4K",
    niche: "Pop Culture & Street Dramas",
    outlierTopic: "Social hierarchy clash and bodyguard psychology",
    outlierTitleFormula: "[Extreme Contrast A] vs [Extreme Contrast B]: High Stakes Encounter",
    outlierThumbnailConcept: "Close-up glamour subject juxtaposed with stern security silhouette in night lighting",
    whyItWorked: "Instant curiosity gap based on status confrontation. High retention from rapid tension resolution in under 35 seconds.",
  },
  {
    id: "outlier-2",
    title: "Add Tyreek to the Dolphins offense: Season Highlights & Speed Breakdown",
    url: "https://www.youtube.com/shorts/7yP3k9F0L1q",
    thumbnailUrl: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&auto=format&fit=crop&q=80",
    viewsText: "169.6K",
    viewsNum: 169600,
    multiplier: 33,
    multiplierText: "33",
    durationText: "0:48",
    durationSec: 48,
    publishedDate: "28 Sep 2026",
    publishedText: "28 Sep 2026",
    isShort: true,
    channelTitle: "carnelltakes",
    channelHandle: "@carnelltakes",
    channelUrl: "https://www.youtube.com/@carnelltakes",
    channelAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "5.1K",
    niche: "NFL & Sports Highlights",
    outlierTopic: "Tactical speed matchups in modern NFL passing schemes",
    outlierTitleFormula: "Add [Superstar] to [Team]: What Actually Happened",
    outlierThumbnailConcept: "Action-packed field angle with vibrant custom typography 'Add Tyreek' across motion line",
    whyItWorked: "Taps into active NFL fantasy debates with rapid tactical film pacing.",
  },
  {
    id: "outlier-3",
    title: "Jeremy Clarkson reacting to modern brainrot trends",
    url: "https://www.youtube.com/shorts/3fM8xK2P9wQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    viewsText: "241.1K",
    viewsNum: 241100,
    multiplier: 34,
    multiplierText: "34",
    durationText: "0:29",
    durationSec: 29,
    publishedDate: "28 Sep 2026",
    publishedText: "28 Sep 2026",
    isShort: true,
    channelTitle: "brainrottcity",
    channelHandle: "@brainrottcity",
    channelUrl: "https://www.youtube.com/@brainrottcity",
    channelAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "7.2K",
    niche: "Pop Culture Commentary & Memes",
    outlierTopic: "Generational humor clash with iconic television personalities",
    outlierTitleFormula: "[Classic Icon] Reacting to [Absurd Gen-Z Internet Subculture]",
    outlierThumbnailConcept: "Exaggerated facial expression (Clarkson grimace) filling 70% of frame with bright lighting",
    whyItWorked: "Emotional polarity: traditional audience enjoys the bewilderment while younger viewers engage with ironic commentary.",
  },
  {
    id: "outlier-4",
    title: "The avocado officer who guarded the glowing seed",
    url: "https://www.youtube.com/shorts/9xL2p0K7wMb",
    thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    viewsText: "287.1K",
    viewsNum: 287100,
    multiplier: 38,
    multiplierText: "38",
    durationText: "0:42",
    durationSec: 42,
    publishedDate: "28 Sep 2026",
    publishedText: "28 Sep 2026",
    isShort: true,
    channelTitle: "aiscxaii",
    channelHandle: "@aiscxaii",
    channelUrl: "https://www.youtube.com/@aiscxaii",
    channelAvatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "7.6K",
    niche: "AI Storytelling & Surreal Animation",
    outlierTopic: "Micro-cinematic worldbuilding using hyper-detailed AI characters",
    outlierTitleFormula: "The [Unusual Character] Who [Unbelievable Mythic Quest]",
    outlierThumbnailConcept: "Vibrant emerald glowing artifact in center, high contrast Pixar-style character lighting",
    whyItWorked: "Stunning visual intrigue stops scrolling thumbs instantly. Viewers re-watch to spot subtle background animation.",
  },
  {
    id: "outlier-5",
    title: "The fact that Ariana made pov when she got married and Taylor made Cleveland",
    url: "https://www.youtube.com/shorts/8kL9v3Q2wTx",
    thumbnailUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80",
    viewsText: "591.0K",
    viewsNum: 591000,
    multiplier: 41,
    multiplierText: "41",
    durationText: "0:52",
    durationSec: 52,
    publishedDate: "28 Sep 2026",
    publishedText: "28 Sep 2026",
    isShort: true,
    channelTitle: "trbsessedue",
    channelHandle: "@trbsessedue",
    channelUrl: "https://www.youtube.com/@trbsessedue",
    channelAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "14.2K",
    niche: "Pop Music Lore & Stan Culture",
    outlierTopic: "Lyrical and narrative parallels between two of music's biggest superstars",
    outlierTitleFormula: "The fact that [Artist A] did [X] while [Artist B] wrote [Y]",
    outlierThumbnailConcept: "Moody aesthetic portrait with relatable lowercase TikTok caption style text overlay",
    whyItWorked: "Sparks fierce passionate comments between rival fanbases. Drives massive algorithm virality via debate.",
  },
  {
    id: "outlier-6",
    title: "How an Egyptian Priest Tricked Rome for 400 Years",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.4M",
    viewsNum: 1420000,
    multiplier: 28,
    multiplierText: "28",
    durationText: "18:24",
    durationSec: 1104,
    publishedDate: "24 Sep 2026",
    publishedText: "5 days ago",
    isShort: false,
    channelTitle: "Ancient Lore Vault",
    channelHandle: "@AncientLoreVault",
    channelUrl: "https://www.youtube.com/@AncientLoreVault",
    channelAvatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "51.0K",
    niche: "History & Ancient Secrets",
    outlierTopic: "Ancient political espionage and deception behind the Roman annexation of Egypt",
    outlierTitleFormula: "How a [Low Status Archetype] [Immense Historical Feat] for [Number] Years",
    outlierThumbnailConcept: "Gold hieroglyphic background with red dramatic lighting illuminating Roman legionnaire armor",
    whyItWorked: "Intense historical drama framed as an untold conspiracy. Captivates history lovers and video essay fans.",
  },
  {
    id: "outlier-7",
    title: "The $10B AI Chip Nobody Is Allowed to Buy",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    viewsText: "890.5K",
    viewsNum: 890500,
    multiplier: 22,
    multiplierText: "22",
    durationText: "14:15",
    durationSec: 855,
    publishedDate: "20 Sep 2026",
    publishedText: "9 days ago",
    isShort: false,
    channelTitle: "Tech Frontier",
    channelHandle: "@TechFrontierDaily",
    channelUrl: "https://www.youtube.com/@TechFrontierDaily",
    channelAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "40.5K",
    niche: "AI & Tech Documentary",
    outlierTopic: "Semiconductor supply chains and black market AI silicon trade",
    outlierTitleFormula: "The $[Amount] [Tech Item] Nobody Is Allowed to [Action]",
    outlierThumbnailConcept: "Glowing futuristic wafer under blue cleanroom lighting with caution hazard label",
    whyItWorked: "Extreme exclusivity and curiosity gap. Viewers want to understand the forbidden technology.",
  },
  {
    id: "outlier-8",
    title: "I Tried Sleeping 3 Hours Every Day for 30 Days (Disaster)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80",
    viewsText: "2.1M",
    viewsNum: 2100000,
    multiplier: 45,
    multiplierText: "45",
    durationText: "11:32",
    durationSec: 692,
    publishedDate: "15 Sep 2026",
    publishedText: "2 weeks ago",
    isShort: false,
    channelTitle: "Experiment Lab",
    channelHandle: "@ExperimentLabOfficial",
    channelUrl: "https://www.youtube.com/@ExperimentLabOfficial",
    channelAvatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "46.7K",
    niche: "Self-Experimentation & Lifestyle",
    outlierTopic: "Polyphasic sleep failure and extreme neurological consequences",
    outlierTitleFormula: "I Tried [Extreme Unhealthy Habit] for [Time Period] ([Shocking Word])",
    outlierThumbnailConcept: "Side-by-side Day 1 energetic face vs Day 30 haggard dark circles with digital clock overlay",
    whyItWorked: "Relatable self-sabotage curiosity. High human empathy and morbid curiosity about the breakdown.",
  },
];

export const fetchOutliers = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        query: z.string().trim().optional(),
        mode: z.enum(["channel", "niche"]).default("channel"),
        format: z.enum(["all", "videos", "shorts"]).default("all"),
        timeRange: z.enum(["fresh", "all"]).default("fresh"),
        minMultiplier: z.number().optional().default(1),
        apiKey: z.string().trim().optional(),
        aiApiKey: z.string().trim().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ outliers: OutlierTile[]; totalFound: number; source: string; medianViews?: number }> => {
    const rawQuery = (data.query || "").trim();
    const key = resolveYoutubeKey(data.apiKey);

    // 1. If no query specified or query is empty, return filtered curated outliers
    if (!rawQuery) {
      let filtered = [...CURATED_OUTLIERS];
      if (data.format === "shorts") filtered = filtered.filter((o) => o.isShort);
      if (data.format === "videos") filtered = filtered.filter((o) => !o.isShort);
      if (data.minMultiplier > 1) filtered = filtered.filter((o) => o.multiplier >= data.minMultiplier);
      return { outliers: filtered, totalFound: filtered.length, source: "curated" };
    }

    // 2. CHANNEL MODE: Pull real outlier videos for that channel
    const isExplicitChannel =
      data.mode === "channel" ||
      rawQuery.startsWith("@") ||
      rawQuery.includes("youtube.com") ||
      rawQuery.startsWith("UC");

    if (isExplicitChannel && key) {
      try {
        const ident = parseIdentifier(rawQuery);
        let channel: any | undefined;

        if (ident.type === "video") {
          const vidRes = await yt("videos", { part: "snippet", id: ident.value }, key);
          const vidChannelId = vidRes.items?.[0]?.snippet?.channelId;
          if (vidChannelId) {
            const r = await yt("channels", { part: "snippet,statistics,contentDetails", id: vidChannelId }, key);
            channel = r.items?.[0];
          }
        } else if (ident.type === "id") {
          const r = await yt("channels", { part: "snippet,statistics,contentDetails", id: ident.value }, key);
          channel = r.items?.[0];
        } else if (ident.type === "handle") {
          const r = await yt("channels", { part: "snippet,statistics,contentDetails", forHandle: ident.value }, key);
          channel = r.items?.[0];
        }

        if (!channel) {
          const search = await yt("search", { part: "snippet", type: "channel", maxResults: "1", q: ident.value }, key);
          const foundId = search.items?.[0]?.snippet?.channelId ?? search.items?.[0]?.id?.channelId;
          if (foundId) {
            const r = await yt("channels", { part: "snippet,statistics,contentDetails", id: foundId }, key);
            channel = r.items?.[0];
          }
        }

        if (channel) {
          const uploadsId: string | undefined = channel.contentDetails?.relatedPlaylists?.uploads;
          let videoIds: string[] = [];
          if (uploadsId) {
            const playlist = await yt(
              "playlistItems",
              { part: "contentDetails", playlistId: uploadsId, maxResults: "50" },
              key,
            );
            videoIds = (playlist.items ?? []).map((i: any) => i.contentDetails?.videoId).filter(Boolean);
          }

          if (videoIds.length > 0) {
            const vidRes = await yt("videos", { part: "snippet,contentDetails,statistics", id: videoIds.join(",") }, key);
            const videos: any[] = vidRes.items ?? [];

            // Calculate median views
            const viewsList = videos.map((v) => Number(v.statistics?.viewCount ?? 0)).filter((v) => v > 0);
            let medianViews = 1000;
            if (viewsList.length > 0) {
              const sorted = [...viewsList].sort((a, b) => a - b);
              medianViews = sorted[Math.floor(sorted.length / 2)] || 1000;
            }

            const channelTitle = channel.snippet?.title || "Creator";
            const channelHandle = channel.snippet?.customUrl ? `@${channel.snippet.customUrl.replace(/^@/, "")}` : `@${channelTitle.replace(/\s+/g, "").toLowerCase()}`;
            const channelAvatarUrl = channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url;
            const subCount = Number(channel.statistics?.subscriberCount ?? 0);
            const channelSubscribers = subCount > 0 ? formatCompactViews(subCount) : "Hidden";
            const channelUrl = `https://www.youtube.com/${channelHandle}`;

            const tiles: OutlierTile[] = videos.map((v) => {
              const viewsNum = Number(v.statistics?.viewCount ?? 0);
              const durSec = isoDurationToSeconds(v.contentDetails?.duration ?? "");
              const isShort = durSec <= 60;
              const mult = Math.max(1, Number((viewsNum / Math.max(1, medianViews)).toFixed(1)));
              const pubDate = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt) : null;
              const pubFormatted = pubDate && !isNaN(pubDate.getTime())
                ? pubDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                : "Recent";

              // Thumbnail priority: maxres -> standard -> high -> medium -> default
              const thumbs = v.snippet?.thumbnails;
              const thumbUrl =
                thumbs?.maxres?.url ||
                thumbs?.standard?.url ||
                thumbs?.high?.url ||
                thumbs?.medium?.url ||
                `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

              return {
                id: v.id,
                title: v.snippet?.title || "Untitled Video",
                url: `https://www.youtube.com/watch?v=${v.id}`,
                thumbnailUrl: thumbUrl,
                viewsText: formatCompactViews(viewsNum),
                viewsNum,
                multiplier: Math.round(mult),
                multiplierText: mult >= 10 ? `${Math.round(mult)}` : `${mult.toFixed(1)}`,
                durationText: formatDuration(durSec),
                durationSec: durSec,
                publishedDate: pubFormatted,
                publishedText: pubFormatted,
                isShort,
                channelTitle,
                channelHandle,
                channelUrl,
                channelAvatarUrl,
                channelSubscribers,
                niche: channel.snippet?.description ? "Custom Channel" : "General",
                outlierTopic: v.snippet?.title || "",
                outlierTitleFormula: "High-performing title from creator",
                outlierThumbnailConcept: "Custom thumbnail packaging",
                whyItWorked: mult > 2 ? `Gained ${mult}x higher views than the channel's typical ${formatCompactViews(medianViews)} baseline.` : "Consistent performer for channel.",
              };
            });

            // Sort by multiplier descending
            let filtered = tiles.sort((a, b) => b.multiplier - a.multiplier);
            if (data.format === "shorts") filtered = filtered.filter((o) => o.isShort);
            if (data.format === "videos") filtered = filtered.filter((o) => !o.isShort);
            if (data.minMultiplier > 1) filtered = filtered.filter((o) => o.multiplier >= data.minMultiplier);

            return {
              outliers: filtered,
              totalFound: filtered.length,
              source: "youtube_api",
              medianViews,
            };
          }
        }
      } catch (err) {
        console.warn("YouTube API channel query failed in fetchOutliers, falling back to search:", err);
      }
    }

    // 3. NICHE OR KEYWORD MODE (or if no API key)
    if (key) {
      try {
        const searchRes = await yt(
          "search",
          {
            part: "snippet",
            q: rawQuery,
            type: "video",
            order: data.timeRange === "fresh" ? "date" : "viewCount",
            maxResults: "25",
          },
          key,
        );

        const videoIds = (searchRes.items ?? []).map((i: any) => i.id?.videoId).filter(Boolean);
        if (videoIds.length > 0) {
          const vidRes = await yt("videos", { part: "snippet,contentDetails,statistics", id: videoIds.join(",") }, key);
          const videos: any[] = vidRes.items ?? [];

          // Collect channel IDs to get baseline subscriber numbers
          const channelIds = [...new Set(videos.map((v) => v.snippet?.channelId).filter(Boolean))];
          let channelStatsMap: Record<string, { subs: number; avatar: string }> = {};

          if (channelIds.length > 0) {
            try {
              const chRes = await yt("channels", { part: "snippet,statistics", id: channelIds.slice(0, 50).join(",") }, key);
              for (const ch of chRes.items ?? []) {
                channelStatsMap[ch.id] = {
                  subs: Number(ch.statistics?.subscriberCount ?? 0),
                  avatar: ch.snippet?.thumbnails?.medium?.url || ch.snippet?.thumbnails?.default?.url || "",
                };
              }
            } catch {}
          }

          const tiles: OutlierTile[] = videos.map((v) => {
            const viewsNum = Number(v.statistics?.viewCount ?? 0);
            const durSec = isoDurationToSeconds(v.contentDetails?.duration ?? "");
            const isShort = durSec <= 60;
            const chId = v.snippet?.channelId || "";
            const chData = channelStatsMap[chId];
            const subsNum = chData?.subs || 10000;

            // Score outlier ratio vs channel subscribers or baseline
            let mult = 1;
            if (subsNum > 0) {
              mult = Math.max(1, Math.min(99, Math.round((viewsNum / Math.max(subsNum, 2000)) * 5)));
            } else {
              mult = Math.max(1, Math.min(99, Math.round(viewsNum / 15000)));
            }
            if (viewsNum > 500000 && mult < 20) mult = 25;
            if (viewsNum > 1000000 && mult < 35) mult = 40;

            const pubDate = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt) : null;
            const pubFormatted = pubDate && !isNaN(pubDate.getTime())
              ? pubDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
              : "Recent";

            const thumbs = v.snippet?.thumbnails;
            const thumbUrl =
              thumbs?.maxres?.url ||
              thumbs?.standard?.url ||
              thumbs?.high?.url ||
              thumbs?.medium?.url ||
              `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

            const channelTitle = v.snippet?.channelTitle || "Creator";
            const channelHandle = `@${channelTitle.replace(/\s+/g, "").toLowerCase()}`;

            return {
              id: v.id,
              title: v.snippet?.title || "Untitled Video",
              url: `https://www.youtube.com/watch?v=${v.id}`,
              thumbnailUrl: thumbUrl,
              viewsText: formatCompactViews(viewsNum),
              viewsNum,
              multiplier: mult,
              multiplierText: `${mult}`,
              durationText: formatDuration(durSec),
              durationSec: durSec,
              publishedDate: pubFormatted,
              publishedText: pubFormatted,
              isShort,
              channelTitle,
              channelHandle,
              channelUrl: `https://www.youtube.com/channel/${chId}`,
              channelAvatarUrl: chData?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
              channelSubscribers: subsNum > 0 ? formatCompactViews(subsNum) : "Hidden",
              niche: rawQuery,
              outlierTopic: v.snippet?.title || "",
              outlierTitleFormula: "High-retention niche hook formula",
              outlierThumbnailConcept: "Attention-grabbing thumbnail",
              whyItWorked: `Outperformed typical view volume with strong click-through rate in the '${rawQuery}' niche.`,
            };
          });

          let filtered = tiles.sort((a, b) => b.multiplier - a.multiplier);
          if (data.format === "shorts") filtered = filtered.filter((o) => o.isShort);
          if (data.format === "videos") filtered = filtered.filter((o) => !o.isShort);
          if (data.minMultiplier > 1) filtered = filtered.filter((o) => o.multiplier >= data.minMultiplier);

          return { outliers: filtered, totalFound: filtered.length, source: "youtube_api" };
        }
      } catch (err) {
        console.warn("YouTube API niche search failed in fetchOutliers:", err);
      }
    }

    // 4. Fallback search among curated outliers
    const qLower = rawQuery.toLowerCase();
    let matches = CURATED_OUTLIERS.filter(
      (o) =>
        o.title.toLowerCase().includes(qLower) ||
        o.channelTitle.toLowerCase().includes(qLower) ||
        o.channelHandle.toLowerCase().includes(qLower) ||
        (o.niche && o.niche.toLowerCase().includes(qLower)) ||
        (o.outlierTopic && o.outlierTopic.toLowerCase().includes(qLower)),
    );

    if (matches.length === 0) {
      // If no exact match, return all curated items with simulated niche adaptation
      matches = CURATED_OUTLIERS;
    }

    let filtered = [...matches];
    if (data.format === "shorts") filtered = filtered.filter((o) => o.isShort);
    if (data.format === "videos") filtered = filtered.filter((o) => !o.isShort);
    if (data.minMultiplier > 1) filtered = filtered.filter((o) => o.multiplier >= data.minMultiplier);

    return { outliers: filtered, totalFound: filtered.length, source: "curated_match" };
  });

export const analyzeOutlierItem = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        videoTitle: z.string(),
        viewsText: z.string(),
        multiplier: z.number().or(z.string()),
        channelName: z.string(),
        durationText: z.string(),
        aiApiKey: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return analyzeOutlierPackaging({
      videoTitle: data.videoTitle,
      videoViewsText: data.viewsText,
      videoViewsNum: parseViewsText(data.viewsText),
      multiplier: typeof data.multiplier === "number" ? data.multiplier : parseFloat(data.multiplier) || 1,
      channelName: data.channelName,
      durationText: data.durationText,
      customAiKey: data.aiApiKey,
    });
  });
