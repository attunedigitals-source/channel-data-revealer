import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ url: z.string().trim().min(3).max(300) });

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
    const key = process.env["YOUTUBE_API_KEY"];
    if (!key) throw new Error("Missing YouTube API key. Add YOUTUBE_API_KEY to continue.");

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

    // Best video = highest view count across every upload we scanned.
    let best: any | undefined;
    const pickBest = (list: any[]) => {
      for (const v of list) {
        const views = Number(v.statistics?.viewCount ?? 0);
        if (!best || views > Number(best.statistics?.viewCount ?? -1)) best = v;
      }
    };
    pickBest(videos);

    const remaining = allVideoIds.filter((id) => !videoIds.includes(id));
    for (let i = 0; i < remaining.length; i += 50) {
      const chunk = remaining.slice(i, i + 50);
      try {
        const r = await yt("videos", { part: "snippet,statistics", id: chunk.join(",") }, key);
        pickBest(r.items ?? []);
      } catch (err) {
        console.error("Stats batch failed:", err);
      }
    }



    let niche = "Unavailable";
    let style = "Unavailable";
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (lovableKey) {
      try {
        const { generateText, Output } = await import("ai");
        const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
        const gateway = createLovableAiGatewayProvider(lovableKey);
        const { output } = await generateText({
          model: gateway("google/gemini-3.8-flash"),
          output: Output.object({
            schema: z.object({
              niche: z.string(),
              style: z.string(),
            }),
          }),
          prompt: [
            "Classify this YouTube channel. Reply with a short niche (2-4 words) and a short content style description (3-8 words).",
            `Channel: ${channel.snippet?.title ?? ""}`,
            `Description: ${(channel.snippet?.description ?? "").slice(0, 800)}`,
            `Recent video titles: ${videos
              .slice(0, 15)
              .map((v) => v.snippet?.title)
              .filter(Boolean)
              .join(" | ")
              .slice(0, 1200)}`,
            `Average video length: ${avgLength}`,
          ].join("\n"),
        });
        niche = output.niche;
        style = output.style;
      } catch (err) {
        console.error("AI classify failed:", err);
        niche = "Unavailable";
        style = "Unavailable";
      }
    }

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
