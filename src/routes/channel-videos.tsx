import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import {
  ArrowLeft,
  Video,
  Users,
  Search,
  Download,
  FileSpreadsheet,
  Play,
  Eye,
  Clock,
  Flame,
  Calendar,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  KeyRound,
  X,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Share2,
} from "lucide-react";
import {
  fetchChannelVideos,
  type ChannelVideoTile,
  type ChannelDetails,
} from "@/lib/channel-videos.functions";
import { getApiConfigStatus } from "@/lib/youtube.functions";
import { ApiKeyModal, API_KEY_STORAGE_KEY, AI_KEY_STORAGE_KEY } from "@/components/ApiKeyModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/channel-videos")({
  validateSearch: (search: Record<string, unknown>) => ({
    url: typeof search.url === "string" ? search.url : "",
    name: typeof search.name === "string" ? search.name : "",
  }),
  head: () => ({
    meta: [
      { title: "Competitor Channel Videos — Visual Tile Library & Export" },
      {
        name: "description",
        content:
          "Browse all videos of a competitor YouTube channel in high-density visual tiles. Analyze view counts, publication dates, and export parameters to Excel and CSV.",
      },
    ],
  }),
  component: ChannelVideosPage,
});

const openExternal = (url: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const w = window.top ?? window;
  try {
    const opened = w.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.open(url, "_blank", "noopener,noreferrer");
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export function ChannelVideosPage() {
  const searchParams = Route.useSearch();
  const initialUrl = searchParams?.url || "https://www.youtube.com/@veritasium";
  const [channelInput, setChannelInput] = useState(initialUrl);

  const [channel, setChannel] = useState<ChannelDetails | null>(null);
  const [videos, setVideos] = useState<ChannelVideoTile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [medianViews, setMedianViews] = useState(0);
  const [dataSource, setDataSource] = useState<"api" | "scrape">("scrape");

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<"all" | "videos" | "shorts">("all");
  const [sortOption, setSortOption] = useState<"views" | "date" | "multiplier" | "duration" | "oldest">("views");
  const [minMultiplier, setMinMultiplier] = useState<number>(1);
  const [selectedTile, setSelectedTile] = useState<ChannelVideoTile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // API Key management
  const [apiKey, setApiKey] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [hasServerKey, setHasServerKey] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const getVideosFn = useServerFn(fetchChannelVideos);
  const checkServerKey = useServerFn(getApiConfigStatus);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (stored) setApiKey(stored);
      const storedAi = localStorage.getItem(AI_KEY_STORAGE_KEY);
      if (storedAi) setAiApiKey(storedAi);
    } catch {}

    checkServerKey()
      .then((res) => {
        if (res?.hasServerKey) setHasServerKey(true);
      })
      .catch(() => {});
  }, [checkServerKey]);

  // Main channel query mutation
  const fetchMutation = useMutation({
    mutationFn: async (targetUrl: string) => {
      return getVideosFn({
        data: {
          url: targetUrl,
          apiKey: apiKey || undefined,
          maxResults: 50,
        },
      });
    },
    onSuccess: (data) => {
      setChannel(data.channel);
      setVideos(data.videos);
      setNextPageToken(data.nextPageToken);
      setMedianViews(data.medianViews);
      setDataSource(data.source);
    },
  });

  // Load more mutation
  const loadMoreMutation = useMutation({
    mutationFn: async () => {
      if (!channel?.url || !nextPageToken) return;
      return getVideosFn({
        data: {
          url: channel.url,
          apiKey: apiKey || undefined,
          pageToken: nextPageToken,
          maxResults: 50,
        },
      });
    },
    onSuccess: (data) => {
      if (!data) return;
      setVideos((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        const newOnes = data.videos.filter((v) => !seen.has(v.id));
        return [...prev, ...newOnes];
      });
      setNextPageToken(data.nextPageToken);
    },
  });

  // Initial load
  useEffect(() => {
    if (initialUrl) {
      fetchMutation.mutate(initialUrl);
    }
  }, [initialUrl]);

  function handleChannelSubmit(e: FormEvent) {
    e.preventDefault();
    if (channelInput.trim()) {
      fetchMutation.mutate(channelInput.trim());
    }
  }

  function handleCopy(url: string, id: string, e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // Format Filter
    if (formatFilter === "videos") {
      result = result.filter((v) => !v.isShort);
    } else if (formatFilter === "shorts") {
      result = result.filter((v) => v.isShort);
    }

    // Min Multiplier
    if (minMultiplier > 1) {
      result = result.filter((v) => v.multiplier >= minMultiplier);
    }

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((v) => v.title.toLowerCase().includes(q));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === "views") return b.viewsNum - a.viewsNum;
      if (sortOption === "multiplier") return b.multiplier - a.multiplier;
      if (sortOption === "duration") return b.durationSec - a.durationSec;
      if (sortOption === "date") {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) return dateB - dateA;
        return 0;
      }
      if (sortOption === "oldest") {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
        return 0;
      }
      return 0;
    });

    return result;
  }, [videos, formatFilter, minMultiplier, searchQuery, sortOption]);

  // Export to Excel (.xlsx)
  async function exportToExcel() {
    if (filteredVideos.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const utils = XLSX.utils || (XLSX as any).default?.utils;
      const write = XLSX.write || (XLSX as any).default?.write;

      const data = filteredVideos.map((v, index) => ({
        "No.": index + 1,
        "Title": v.title,
        "Date Uploaded": v.publishedDate || v.publishedAt,
        "Number of Views": v.viewsNum,
        "Views (Formatted)": v.viewsText,
        "Duration": v.durationText,
        "Duration (Seconds)": v.durationSec,
        "Format": v.isShort ? "Short" : "Video",
        "Outlier Multiplier": v.multiplierText,
        "Views/Subscribers Ratio": v.viewsSubRatio || "N/A",
        "Video URL": v.url,
        "Channel Name": channel?.title || v.channelTitle,
        "Channel URL": channel?.url || v.channelUrl,
      }));

      const worksheet = utils.json_to_sheet(data);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 45 },
        { wch: 18 },
        { wch: 16 },
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
        { wch: 10 },
        { wch: 14 },
        { wch: 18 },
        { wch: 40 },
        { wch: 22 },
        { wch: 35 },
      ];

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Channel Videos");
      const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const channelSlug = (channel?.title || "channel")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .slice(0, 30);
      const fileName = `${channelSlug}_videos_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export to Excel failed:", err);
      alert("Failed to export Excel file. Please try again.");
    }
  }

  // Export to CSV
  function exportToCsv() {
    if (filteredVideos.length === 0) return;
    const data = filteredVideos.map((v, index) => ({
      "No.": index + 1,
      "Title": v.title,
      "Date Uploaded": v.publishedDate || v.publishedAt,
      "Number of Views": v.viewsNum,
      "Views (Formatted)": v.viewsText,
      "Duration": v.durationText,
      "Duration (Seconds)": v.durationSec,
      "Format": v.isShort ? "Short" : "Video",
      "Outlier Multiplier": v.multiplierText,
      "Views/Subscribers Ratio": v.viewsSubRatio || "N/A",
      "Video URL": v.url,
      "Channel Name": channel?.title || v.channelTitle,
      "Channel URL": channel?.url || v.channelUrl,
    }));

    const escapeCsv = (val: any) => {
      if (val == null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = Object.keys(data[0]!);
    const csvRows: string[] = [headers.map((h) => `"${h}"`).join(",")];

    for (const row of data) {
      const values = headers.map((h) => escapeCsv((row as any)[h]));
      csvRows.push(values.join(","));
    }

    const csvContent = "\uFEFF" + csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const channelSlug = (channel?.title || "channel")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 30);
    const fileName = `${channelSlug}_videos_${new Date().toISOString().slice(0, 10)}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const topMultiplier = useMemo(() => {
    if (videos.length === 0) return "1.0x";
    const max = Math.max(...videos.map((v) => v.multiplier));
    return `${max.toFixed(1)}x`;
  }, [videos]);

  return (
    <div className="min-h-screen bg-[#090a10] text-[#e3e8f8] flex flex-col font-sans selection:bg-pink-500/30 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-[#1b1f2d] bg-[#0d0f17]/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              hash="competition-analysis"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161925] hover:bg-[#1f2334] border border-[#23283c] text-xs font-semibold text-[#a5b0cf] hover:text-white transition-all shadow-sm group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Competition Analysis</span>
            </Link>

            <span className="text-[#2b3149] hidden sm:inline">|</span>

            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Video className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Channel Video Explorer</span>
                  <Badge variant="secondary" className="bg-pink-500/15 text-pink-300 border border-pink-500/30 text-[10px] font-mono px-1.5 py-0">
                    TILES VIEW
                  </Badge>
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Channel URL Switcher */}
            <form onSubmit={handleChannelSubmit} className="relative w-64 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555d77]" />
              <Input
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder="Enter channel URL or @handle..."
                className="pl-8.5 pr-8 h-8 text-xs bg-[#131520] border-[#252a3c] text-white rounded-lg focus:border-pink-500"
              />
              {fetchMutation.isPending ? (
                <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-pink-400 animate-spin" />
              ) : (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-pink-500/20 text-pink-300 hover:bg-pink-500/40 px-1.5 py-0.5 rounded font-medium"
                >
                  Go
                </button>
              )}
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setKeyModalOpen(true)}
              className="h-8 gap-1.5 border-[#282d40] bg-[#161824] text-xs hover:bg-[#202436] text-[#c0c7e2]"
            >
              <KeyRound className="h-3.5 w-3.5 text-pink-400" />
              <span>API Key</span>
              {hasServerKey ? (
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0 text-[9px] px-1 py-0 h-3.5">
                  Server
                </Badge>
              ) : apiKey ? (
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0 text-[9px] px-1 py-0 h-3.5">
                  Active
                </Badge>
              ) : null}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Channel Hero Banner */}
        {channel ? (
          <div className="rounded-2xl border border-[#24293c] bg-gradient-to-br from-[#141624] via-[#10121b] to-[#0c0d15] p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                {channel.avatarUrl ? (
                  <img
                    src={channel.avatarUrl}
                    alt={channel.title}
                    className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl border-2 border-pink-500/30 object-cover shadow-lg"
                  />
                ) : (
                  <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-pink-500/15 border-2 border-pink-500/30 flex items-center justify-center text-pink-400 font-extrabold text-2xl">
                    {channel.title.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {channel.title}
                    </h2>
                    <a
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={openExternal(channel.url)}
                      className="inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-medium transition-colors"
                    >
                      <span>{channel.handle}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8a94b3] mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-[#5f6885]" />
                      <strong className="text-white font-semibold">{channel.subscribers}</strong> subscribers
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5 text-[#5f6885]" />
                      <strong className="text-white font-semibold">{channel.videoCount}</strong> total videos
                    </span>
                    <span>•</span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Source: {dataSource === "api" ? "YouTube API v3" : "Public Web Scraper"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats & Quick Metrics Pills */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="rounded-xl bg-[#171a28] border border-[#272d42] px-3.5 py-2 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#717b99] block">
                    Median Views
                  </span>
                  <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">
                    {medianViews > 0 ? medianViews.toLocaleString() : "N/A"}
                  </span>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-500/30 px-3.5 py-2 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400 block flex items-center justify-center gap-1">
                    <Flame className="h-3 w-3 fill-pink-400 text-pink-400" /> Top Outlier
                  </span>
                  <span className="text-sm font-extrabold text-pink-300 font-mono mt-0.5 block">
                    {topMultiplier}
                  </span>
                </div>

                <div className="rounded-xl bg-[#171a28] border border-[#272d42] px-3.5 py-2 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#717b99] block">
                    Loaded Tiles
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5 block">
                    {videos.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : fetchMutation.isPending ? (
          <div className="rounded-2xl border border-[#202436] bg-[#12141f] p-8 animate-pulse flex items-center gap-4">
            <div className="h-16 w-16 bg-[#1a1d2c] rounded-2xl"></div>
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-[#1a1d2c] rounded"></div>
              <div className="h-3 w-72 bg-[#1a1d2c] rounded"></div>
            </div>
          </div>
        ) : null}

        {/* Action Controls & Export Toolbar */}
        <div className="rounded-xl border border-[#202538] bg-[#10121c] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left filters: Search, Format, Multiplier, Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Search inside channel videos */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#556080]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter videos by title..."
                className="pl-8.5 pr-7 h-9 text-xs bg-[#161826] border-[#282e44] text-white rounded-lg focus:border-pink-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#717b99] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Format Filter: All, Long-form, Shorts */}
            <div className="flex items-center rounded-lg border border-[#282d42] bg-[#151724] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFormatFilter("all")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  formatFilter === "all" ? "bg-pink-500 text-white font-bold" : "text-[#8a94b3] hover:text-white"
                }`}
              >
                All ({videos.length})
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter("videos")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  formatFilter === "videos" ? "bg-pink-500 text-white font-bold" : "text-[#8a94b3] hover:text-white"
                }`}
              >
                Videos ({videos.filter((v) => !v.isShort).length})
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter("shorts")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  formatFilter === "shorts" ? "bg-pink-500 text-white font-bold" : "text-[#8a94b3] hover:text-white"
                }`}
              >
                Shorts ({videos.filter((v) => v.isShort).length})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-[#8a94b3]">
              <span className="text-[11px] font-semibold text-[#5c6685] uppercase">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="h-9 rounded-lg border border-[#282d42] bg-[#151724] px-2.5 text-xs text-white focus:border-pink-500 focus:outline-none cursor-pointer"
              >
                <option value="views">Most Views</option>
                <option value="multiplier">Highest Outlier Multiplier</option>
                <option value="date">Most Recent Upload</option>
                <option value="oldest">Oldest Upload</option>
                <option value="duration">Longest Duration</option>
              </select>
            </div>

            {/* Min Multiplier Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#8a94b3]">
              <span className="text-[11px] font-semibold text-[#5c6685] uppercase">Min Outlier:</span>
              <select
                value={minMultiplier}
                onChange={(e) => setMinMultiplier(Number(e.target.value))}
                className="h-9 rounded-lg border border-[#282d42] bg-[#151724] px-2.5 text-xs text-white focus:border-pink-500 focus:outline-none cursor-pointer"
              >
                <option value={1}>All Multipliers</option>
                <option value={2}>2x+ Outliers</option>
                <option value={3}>3x+ High Outliers</option>
                <option value={5}>5x+ Viral Outliers</option>
                <option value={10}>10x+ Mega Outliers</option>
              </select>
            </div>
          </div>

          {/* Right Export Buttons */}
          <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
            <span className="text-xs text-[#717b99] mr-1 hidden sm:inline">
              Showing <strong className="text-white font-semibold">{filteredVideos.length}</strong> videos
            </span>

            <Button
              type="button"
              disabled={filteredVideos.length === 0}
              onClick={exportToExcel}
              className="h-9 px-3.5 text-xs gap-1.5 font-bold cursor-pointer bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/40 shadow-sm"
              title="Export all parameters to Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export to Excel (.xlsx)</span>
            </Button>

            <Button
              type="button"
              disabled={filteredVideos.length === 0}
              onClick={exportToCsv}
              variant="outline"
              className="h-9 px-3.5 text-xs gap-1.5 font-bold cursor-pointer border-[#2a3044] bg-[#151825] hover:bg-[#202538] text-white shadow-sm"
              title="Export all parameters to CSV (.csv)"
            >
              <Download className="h-3.5 w-3.5 text-pink-400" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Error message */}
        {fetchMutation.isError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{(fetchMutation.error as Error).message}</span>
            </div>
            {(fetchMutation.error as Error).message.toLowerCase().includes("key") && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setKeyModalOpen(true)}
                className="h-7 text-xs"
              >
                Set API Key
              </Button>
            )}
          </div>
        )}

        {/* Visual Tiles Grid (Matching Outliers Section) */}
        {fetchMutation.isPending ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#141622] border border-[#202436] animate-pulse p-2.5 flex flex-col gap-2"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="h-7 bg-[#1c2032] rounded-xl"></div>
                  <div className="h-7 bg-[#1c2032] rounded-xl"></div>
                </div>
                <div className="aspect-[9/13] rounded-xl bg-[#171a28] p-2.5 flex flex-col justify-between">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="h-5 w-16 bg-[#22273c] rounded-full"></div>
                    <div className="h-5 w-10 bg-[#22273c] rounded-full"></div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-3/4 bg-[#22273c] rounded"></div>
                    <div className="h-3 w-1/2 bg-[#22273c] rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-[#202538] bg-[#12141f] p-12 text-center max-w-lg mx-auto my-12">
            <Video className="h-10 w-10 mx-auto text-[#48506e] mb-3" />
            <h3 className="text-base font-bold text-white mb-1.5">No Matching Videos Found</h3>
            <p className="text-xs text-[#717b99] mb-5">
              Try adjusting your format filter, title search, or minimum multiplier threshold.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFormatFilter("all");
                setMinMultiplier(1);
              }}
              className="bg-pink-500 hover:bg-pink-600 text-white text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          /* High-Density Visual Tiles Grid */
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredVideos.map((tile) => (
                <div
                  key={tile.id}
                  onClick={() => setSelectedTile(tile)}
                  className="group relative rounded-2xl bg-[#131522] border border-[#222738] hover:border-pink-500/60 shadow-lg hover:shadow-pink-500/10 cursor-pointer transition-all duration-300 p-2.5 flex flex-col gap-2"
                >
                  {/* Top Action Bar */}
                  <div className="grid grid-cols-2 gap-1.5 shrink-0">
                    <a
                      href={tile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={openExternal(tile.url)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-[#181a28] hover:bg-pink-500/20 text-[#8e98b0] hover:text-pink-300 border border-[#272d42] hover:border-pink-500/40 transition-colors"
                      title="Watch directly on YouTube"
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                      <span>Watch</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleCopy(tile.url, tile.id, e)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold bg-[#181a28] hover:bg-[#222638] text-[#8e98b0] hover:text-white border border-[#272d42] transition-colors"
                      title="Copy video link"
                    >
                      {copiedId === tile.id ? (
                        <>
                          <Check className="h-2.5 w-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-2.5 w-2.5" />
                          <span>Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Visual Thumbnail Card */}
                  <div className="relative aspect-[9/13] rounded-xl overflow-hidden bg-[#0a0b12]">
                    <img
                      src={tile.thumbnailUrl}
                      alt={tile.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${tile.id}/hqdefault.jpg`;
                      }}
                    />

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b12] via-transparent to-[#0a0b12]/30 pointer-events-none group-hover:via-transparent transition-colors" />

                    {/* Top-Right Badges: Views & Multiplier */}
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10 pointer-events-none">
                      {/* Views Pill */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10 shadow-md font-mono">
                        <Eye className="h-2.5 w-2.5 text-white/90 shrink-0" />
                        <span>{tile.viewsText}</span>
                      </div>

                      {/* Multiplier Badge */}
                      {tile.multiplier >= 1.5 ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff1e56] text-white text-[10px] font-extrabold shadow-md shadow-pink-500/25 font-mono">
                          <Flame className="h-2.5 w-2.5 fill-white text-white shrink-0" />
                          <span>{tile.multiplierText}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#a5b0cf] text-[9px] font-mono border border-white/10">
                          <span>{tile.multiplierText}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom-Right Duration Badge */}
                    <div className="absolute top-2 left-2 z-10 pointer-events-none">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[9px] font-mono border border-white/10">
                        <Clock className="h-2.5 w-2.5 text-white/70" />
                        <span>{tile.durationText}</span>
                      </div>
                    </div>

                    {/* Center Hover Play Cue */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="h-10 w-10 rounded-full bg-pink-500/90 text-white flex items-center justify-center shadow-lg shadow-pink-500/40 backdrop-blur scale-90 group-hover:scale-100 transition-transform">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Metadata Overlay */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 space-y-1 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                      <div className="text-xs font-semibold text-white line-clamp-2 leading-snug drop-shadow-sm group-hover:text-pink-300 transition-colors">
                        {tile.title}
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-0.5 text-[10px] text-white/70">
                        <span>{tile.publishedDate}</span>
                        {tile.viewsSubRatio && (
                          <span className="font-mono text-emerald-400 font-semibold">
                            {tile.viewsSubRatio}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Channel Videos Button */}
            {nextPageToken && (
              <div className="text-center pt-4">
                <Button
                  onClick={() => loadMoreMutation.mutate()}
                  disabled={loadMoreMutation.isPending}
                  className="bg-[#181b29] hover:bg-[#22263a] text-white border border-[#2b3149] px-6 h-11 text-xs font-bold gap-2 shadow-lg"
                >
                  {loadMoreMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-pink-400" />
                      <span>Loading Next 50 Videos...</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 text-pink-400" />
                      <span>Load More Videos ({videos.length} loaded so far)</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Video Details Preview Modal */}
      {selectedTile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedTile(null)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl border border-[#2a2f44] bg-[#121420] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedTile(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[#717b99] hover:text-white hover:bg-[#1f2334] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              {/* Thumbnail Container */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                <img
                  src={selectedTile.thumbnailUrl}
                  alt={selectedTile.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <Badge variant="secondary" className="bg-black/80 text-white border-0 text-xs font-mono">
                    <Eye className="h-3 w-3 mr-1" />
                    {selectedTile.viewsText}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#ff1e56] text-white border-0 text-xs font-extrabold font-mono">
                    <Flame className="h-3 w-3 fill-white mr-0.5" />
                    {selectedTile.multiplierText}
                  </Badge>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="bg-black/80 text-white border-0 text-xs font-mono">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedTile.durationText}
                  </Badge>
                </div>
              </div>

              {/* Title & Metadata */}
              <div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {selectedTile.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[#8a94b3] mt-2">
                  <span>{channel?.title || selectedTile.channelTitle}</span>
                  <span>•</span>
                  <span>Published {selectedTile.publishedDate || selectedTile.publishedAt}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedTile.isShort ? "Short" : "Long-form Video"}</span>
                </div>
              </div>

              {/* Statistics Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="rounded-xl bg-[#171a28] border border-[#272d42] p-3 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#717b99] block">
                    Views Count
                  </span>
                  <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">
                    {selectedTile.viewsNum.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl bg-[#171a28] border border-[#272d42] p-3 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#717b99] block">
                    Outlier Ratio
                  </span>
                  <span className="text-sm font-extrabold text-pink-400 font-mono mt-0.5 block">
                    {selectedTile.multiplierText}
                  </span>
                </div>

                <div className="rounded-xl bg-[#171a28] border border-[#272d42] p-3 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#717b99] block">
                    Views / Subs
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5 block">
                    {selectedTile.viewsSubRatio || "N/A"}
                  </span>
                </div>

                <div className="rounded-xl bg-[#171a28] border border-[#272d42] p-3 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#717b99] block">
                    Duration
                  </span>
                  <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">
                    {selectedTile.durationText}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-[#23283c]">
                <a
                  href={selectedTile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={openExternal(selectedTile.url)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Watch Video on YouTube</span>
                </a>

                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleCopy(selectedTile.url, selectedTile.id, e)}
                  className="h-10 px-4 text-xs font-semibold border-[#2b3248] bg-[#161928] text-white"
                >
                  {copiedId === selectedTile.id ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400 mr-1.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        open={keyModalOpen}
        onOpenChange={setKeyModalOpen}
        apiKey={apiKey}
        aiApiKey={aiApiKey}
        onSave={(key, aiKey) => {
          setApiKey(key);
          setAiApiKey(aiKey);
        }}
      />
    </div>
  );
}
export default ChannelVideosPage;
