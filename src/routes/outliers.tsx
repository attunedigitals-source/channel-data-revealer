import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef, useCallback, type FormEvent } from "react";
import {
  Flame,
  Play,
  Users,
  Search,
  Calendar,
  Globe,
  Tag,
  Radio,
  Eye,
  ExternalLink,
  Sparkles,
  Clock,
  ChevronDown,
  Check,
  X,
  KeyRound,
  LayoutGrid,
  Bot,
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
  Video,
  SlidersHorizontal,
  Bookmark,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Sparkle,
  Share2,
} from "lucide-react";
import { fetchOutliers, CURATED_OUTLIERS, type OutlierTile } from "@/lib/outlier.functions";
import { getApiConfigStatus } from "@/lib/youtube.functions";
import { ApiKeyModal, API_KEY_STORAGE_KEY, AI_KEY_STORAGE_KEY } from "@/components/ApiKeyModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/outliers")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    mode: (search.mode === "niche" ? "niche" : "channel") as "channel" | "niche",
  }),
  head: () => ({
    meta: [
      { title: "Viral Outliers — Channel & Niche Outlier Tile Explorer" },
      {
        name: "description",
        content:
          "Discover 10x-50x viral outlier videos per channel or niche. Pull thumbnails, view counts, and analyze packaging formulas in high-density tiles.",
      },
      { property: "og:title", content: "Viral Outliers — Channel & Niche Outlier Tile Explorer" },
      {
        property: "og:description",
        content:
          "Discover 10x-50x viral outlier videos per channel or niche. Pull thumbnails, view counts, and analyze packaging formulas in high-density tiles.",
      },
    ],
  }),
  component: OutliersPage,
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

const CHANNEL_PRESETS = [
  { label: "filmitgirl", query: "@filmitgirl" },
  { label: "carnelltakes", query: "@carnelltakes" },
  { label: "brainrottcity", query: "@brainrottcity" },
  { label: "aiscxaii", query: "@aiscxaii" },
  { label: "trbsessedue", query: "@trbsessedue" },
  { label: "cleoabram", query: "@cleoabram" },
  { label: "veritasium", query: "@veritasium" },
  { label: "MrBeast", query: "@MrBeast" },
];

const NICHE_PRESETS = [
  { label: "Pop Culture & Street Drama", query: "pop culture street drama shorts" },
  { label: "NFL & Sports Highlights", query: "nfl game highlights speed breakdown" },
  { label: "Meme Commentary & Brainrot", query: "clarkson brainrot commentary shorts" },
  { label: "AI Animation & Storytelling", query: "ai 3d animation fantasy story shorts" },
  { label: "History & Ancient Mysteries", query: "ancient secrets documentary" },
  { label: "AI & Tech Documentaries", query: "ai semiconductor chip mystery" },
  { label: "Self-Experimentation", query: "i tried sleeping 3 hours every day" },
  { label: "Faceless True Crime", query: "unsolved mystery interrogation room" },
];

export function OutliersPage() {
  const searchParams = Route.useSearch();
  const [query, setQuery] = useState(searchParams?.q || "");
  const [searchMode, setSearchMode] = useState<"channel" | "niche">(searchParams?.mode || "channel");
  const [contentTab, setContentTab] = useState<"videos" | "creators" | "slideshows">("videos");
  const [formatFilter, setFormatFilter] = useState<"all" | "videos" | "shorts">("all");
  const [freshnessFilter, setFreshnessFilter] = useState<"fresh" | "all">("fresh");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [minMultiplierFilter, setMinMultiplierFilter] = useState<number>(1);
  const [selectedTile, setSelectedTile] = useState<OutlierTile | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("virlo_tracked_outliers");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showTrackedOnly, setShowTrackedOnly] = useState(false);
  const [tiles, setTiles] = useState<OutlierTile[]>(() => CURATED_OUTLIERS.slice(0, 24));
  const [apiKey, setApiKey] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [hasServerKey, setHasServerKey] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  // Pagination & Continuous Infinite Scroll States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getOutliersFn = useServerFn(fetchOutliers);
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

  // Initial load: fetch full screen batch of outliers (24 tiles)
  const fetchMutation = useMutation({
    mutationFn: async (params: {
      query?: string;
      mode?: "channel" | "niche";
      format?: "all" | "videos" | "shorts";
      timeRange?: "fresh" | "all";
      minMultiplier?: number;
    }) => {
      setPage(1);
      setHasMore(true);
      setNextPageToken(undefined);
      const res = await getOutliersFn({
        data: {
          query: params.query ?? query,
          mode: params.mode ?? searchMode,
          format: params.format ?? formatFilter,
          timeRange: params.timeRange ?? freshnessFilter,
          minMultiplier: params.minMultiplier ?? minMultiplierFilter,
          page: 1,
          limit: 24, // Generous initial batch to fill the entire screen!
          apiKey: apiKey || undefined,
          aiApiKey: aiApiKey || undefined,
        },
      });
      return res;
    },
    onSuccess: (data) => {
      if (data?.outliers && data.outliers.length > 0) {
        setTiles(data.outliers);
      } else {
        setTiles([]);
      }
      setHasMore(data?.hasMore ?? false);
      setNextPageToken(data?.nextPageToken);
    },
    onError: (err) => {
      console.warn("Outliers query error, falling back to local dataset:", err);
      const qLower = (query || searchParams?.q || "").toLowerCase().trim();
      let pool = [...CURATED_OUTLIERS];
      if (qLower) {
        const matches = pool.filter(
          (o) =>
            o.title.toLowerCase().includes(qLower) ||
            o.channelTitle.toLowerCase().includes(qLower) ||
            o.channelHandle.toLowerCase().includes(qLower) ||
            (o.niche && o.niche.toLowerCase().includes(qLower)),
        );
        if (matches.length > 0) pool = matches;
      }
      if (formatFilter === "shorts") {
        pool = pool.filter((o) => o.isShort);
      }
      setTiles(pool.slice(0, 24));
      setHasMore(pool.length > 24);
    },
  });

  useEffect(() => {
    if (searchParams?.q) {
      setQuery(searchParams.q);
      setSearchMode(searchParams.mode || "channel");
      fetchMutation.mutate({ query: searchParams.q, mode: searchParams.mode || "channel" });
    } else {
      fetchMutation.mutate({});
    }
  }, [searchParams?.q, searchParams?.mode]);

  // Continuous infinite scroll loader
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || fetchMutation.isPending) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const currentOffset = tiles.length;
    try {
      const res = await getOutliersFn({
        data: {
          query: query.trim() || undefined,
          mode: searchMode,
          format: formatFilter,
          timeRange: freshnessFilter,
          minMultiplier: minMultiplierFilter,
          page: nextPage,
          offset: currentOffset,
          limit: 24,
          nextPageToken: nextPageToken,
          apiKey: apiKey || undefined,
          aiApiKey: aiApiKey || undefined,
        },
      });

      if (res?.outliers && res.outliers.length > 0) {
        let addedCount = 0;
        setTiles((prev) => {
          const existingTitles = new Set(prev.map((t) => t.title.toLowerCase().trim()));
          const existingIds = new Set(prev.map((t) => t.id));
          const trulyFresh = res.outliers.filter(
            (t) => !existingTitles.has(t.title.toLowerCase().trim()) && !existingIds.has(t.id)
          );
          addedCount = trulyFresh.length;
          if (trulyFresh.length === 0) {
            return prev;
          }
          return [...prev, ...trulyFresh];
        });
        if (addedCount === 0 || !res.hasMore) {
          setHasMore(false);
        } else {
          setPage(nextPage);
          setHasMore(Boolean(res.hasMore));
          setNextPageToken(res.nextPageToken);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more outliers:", err);
      // Fallback: only slice brand-new items from CURATED_OUTLIERS if no query
      if (!query.trim()) {
        let pool = [...CURATED_OUTLIERS];
        if (formatFilter === "shorts") {
          pool = pool.filter((o) => o.isShort);
        }
        const nextBatch = pool.slice(currentOffset, currentOffset + 24);
        if (nextBatch.length > 0) {
          let addedCount = 0;
          setTiles((prev) => {
            const existingTitles = new Set(prev.map((t) => t.title.toLowerCase().trim()));
            const existingIds = new Set(prev.map((t) => t.id));
            const fresh = nextBatch.filter(
              (t) => !existingTitles.has(t.title.toLowerCase().trim()) && !existingIds.has(t.id)
            );
            addedCount = fresh.length;
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
          if (addedCount === 0 || currentOffset + 24 >= pool.length) {
            setHasMore(false);
          } else {
            setPage(nextPage);
            setHasMore(true);
          }
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    fetchMutation.isPending,
    page,
    tiles.length,
    nextPageToken,
    query,
    searchMode,
    formatFilter,
    freshnessFilter,
    minMultiplierFilter,
    apiKey,
    aiApiKey,
    getOutliersFn,
  ]);

  // Scroll listener for the container
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!target || isLoadingMore || !hasMore || fetchMutation.isPending) return;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollTop + clientHeight >= scrollHeight - 400) {
      loadMore();
    }
  };

  // IntersectionObserver for bottom sentinel (observed against viewport!)
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore && hasMore && !fetchMutation.isPending) {
          loadMore();
        }
      },
      {
        root: null, // Viewport root ensures it triggers regardless of container or window scrolling!
        rootMargin: "450px",
        threshold: 0,
      }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, isLoadingMore, hasMore, fetchMutation.isPending]);

  // Window scroll listener as secondary guarantee
  useEffect(() => {
    const onWindowScroll = () => {
      if (isLoadingMore || !hasMore || fetchMutation.isPending) return;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = window.innerHeight || document.documentElement.clientHeight;
      if (scrollTop + clientHeight >= scrollHeight - 450) {
        loadMore();
      }
    };
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, [loadMore, isLoadingMore, hasMore, fetchMutation.isPending]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchMutation.mutate({
      query: query.trim(),
      mode: searchMode,
      format: formatFilter,
      timeRange: freshnessFilter,
      minMultiplier: minMultiplierFilter,
    });
  };

  const handleSelectPreset = (presetQuery: string, mode: "channel" | "niche") => {
    setQuery(presetQuery);
    setSearchMode(mode);
    fetchMutation.mutate({
      query: presetQuery,
      mode,
      format: formatFilter,
      timeRange: freshnessFilter,
      minMultiplier: minMultiplierFilter,
    });
  };

  const toggleTrack = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTrackedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("virlo_tracked_outliers", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Filter display list
  const displayTiles = useMemo(() => {
    let list = [...tiles];
    if (showTrackedOnly) {
      list = list.filter((t) => trackedIds.has(t.id));
    }
    if (formatFilter === "shorts") {
      list = list.filter((t) => t.isShort);
    }
    if (contentTab === "slideshows") {
      list = list.filter((t) => t.isShort);
    } else if (contentTab === "creators") {
      // Show unique creator tiles
      const seen = new Set<string>();
      list = list.filter((t) => {
        if (seen.has(t.channelTitle)) return false;
        seen.add(t.channelTitle);
        return true;
      });
    }
    return list;
  }, [tiles, showTrackedOnly, trackedIds, formatFilter, contentTab]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0e15] text-[#e2e4ee] font-sans antialiased selection:bg-pink-500/30 selection:text-white">
      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#1e2230] bg-[#10121a] p-4 justify-between shrink-0 h-full overflow-y-auto">
        <div className="space-y-6">
          {/* Logo & Workspace Title */}
          <div className="flex items-center justify-between px-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
                <Flame className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="font-bold text-lg tracking-wider text-white flex items-center gap-1">
                VIRLO <span className="text-[10px] text-pink-400 font-mono font-normal">v2</span>
              </span>
            </Link>
            <Link
              to="/"
              className="text-[#6d758d] hover:text-white p-1 rounded-md transition-colors"
              title="Return to Channel Data Sheet"
            >
              <LayoutGrid className="h-4 w-4" />
            </Link>
          </div>

          {/* User Account Tile */}
          <div className="flex items-center justify-between rounded-xl bg-[#161824] border border-[#232738] p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                OA
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">Olalekan Amunikoro'...</div>
                <div className="text-[10px] text-[#717b99] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Pro Creator
                </div>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#717b99] shrink-0" />
          </div>

          {/* Main Navigation */}
          <nav className="space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#8a94b3] hover:text-white hover:bg-[#181a28] rounded-lg transition-colors"
            >
              <LayoutGrid className="h-4 w-4 text-[#717b99]" />
              <span>Channel Sheet</span>
            </Link>
            <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-[#8a94b3] hover:text-white hover:bg-[#181a28] rounded-lg transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Bot className="h-4 w-4 text-[#717b99]" />
                <span>Vee Copilot</span>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500"></span>
            </div>
          </nav>

          {/* Research Category */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#555d77]">Research</div>
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#8a94b3] hover:text-white hover:bg-[#181a28] rounded-lg transition-colors cursor-pointer">
              <Bot className="h-4 w-4 text-[#717b99]" />
              <span>Agents</span>
            </div>
            {/* Active Outlier Tab */}
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-white bg-pink-500/15 border border-pink-500/30 rounded-lg shadow-sm">
              <Flame className="h-4 w-4 text-pink-400 fill-pink-500" />
              <span>Outlier</span>
              <span className="ml-auto text-[10px] bg-pink-500/25 text-pink-300 px-1.5 py-0.5 rounded font-mono">LIVE</span>
            </div>
            <a
              href="/#competition-analysis"
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#8a94b3] hover:text-white hover:bg-[#181a28] rounded-lg transition-colors"
            >
              <TrendingUp className="h-4 w-4 text-[#717b99]" />
              <span>Trends & Competitors</span>
            </a>
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#8a94b3] hover:text-white hover:bg-[#181a28] rounded-lg transition-colors cursor-pointer">
              <Tag className="h-4 w-4 text-[#717b99]" />
              <span>Tags</span>
            </div>
            <a
              href="/#fact-verification"
              className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#8a94b3] hover:text-white hover:bg-[#181a28] rounded-lg transition-colors"
            >
              <FileText className="h-4 w-4 text-[#717b99]" />
              <span>Reports</span>
            </a>
          </div>

          {/* Tracking Category */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#555d77]">Tracking</div>
            <button
              onClick={() => setShowTrackedOnly(!showTrackedOnly)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                showTrackedOnly ? "bg-pink-500/20 text-pink-300 border border-pink-500/40" : "text-[#8a94b3] hover:text-white hover:bg-[#181a28]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark className="h-4 w-4 text-[#717b99]" />
                <span>Tracked Outliers</span>
              </div>
              <Badge variant="secondary" className="bg-[#242838] text-white text-[10px] h-4 px-1.5">
                {trackedIds.size}
              </Badge>
            </button>
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#8a94b3] hover:text-white hover:bg-[#181a28] rounded-lg transition-colors cursor-pointer">
              <Users className="h-4 w-4 text-[#717b99]" />
              <span>Creators</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#8a94b3] hover:text-white hover:bg-[#181a28] rounded-lg transition-colors cursor-pointer">
              <Settings className="h-4 w-4 text-[#717b99]" />
              <span>Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#555d77] ml-auto" />
            </div>
          </div>
        </div>

        {/* Bottom Plan Card */}
        <div className="space-y-3 pt-4 border-t border-[#1e2230]">
          <div className="rounded-xl bg-gradient-to-br from-[#171926] to-[#1e192c] border border-pink-500/20 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white">Starter</span>
              <button className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm hover:brightness-110">
                Upgrade
              </button>
            </div>
            <div className="text-[11px] text-[#868fa8]">Trial · 7 days left</div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-[#717b99]">
            <span className="flex items-center gap-1.5 hover:text-white cursor-pointer">
              <HelpCircle className="h-3.5 w-3.5" /> Perks & Help
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> 4 ways to get more
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto"
      >
        {/* TOP ANNOUNCEMENT BANNER */}
        <div className="bg-[#12141f] border-b border-[#202434] px-4 py-2 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[#a8b1cf]">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            <span>
              You're on a free trial — <strong className="text-white font-semibold">7 days remaining</strong>
            </span>
          </div>
          <button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow transition-all">
            Activate Full Plan
          </button>
        </div>

        {/* HEADER BAR */}
        <header className="px-6 py-5 border-b border-[#1c202d] bg-[#0e1017]/80 backdrop-blur sticky top-0 z-30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="lg:hidden p-2 rounded-lg bg-[#181a26] text-white hover:bg-[#202436] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-9 w-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center">
              <Flame className="h-5 w-5 text-pink-500 fill-pink-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Viral Outliers
                <Badge variant="secondary" className="bg-pink-500/20 text-pink-300 border-0 text-[10px] font-mono">
                  {displayTiles.length} Videos
                </Badge>
              </h1>
              <p className="text-xs text-[#717b99]">
                Find 10x-50x viral outlier videos per channel or niche with instant visual thumbnail cards.
              </p>
            </div>
          </div>

          {/* Right Metrics / Key Modal trigger */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 bg-[#151722] border border-[#222638] rounded-full px-3 py-1 text-xs">
              <span className="flex items-center gap-1 text-amber-300 font-semibold font-mono">
                100 <span className="text-[13px]">🪙</span>
              </span>
              <span className="text-[#32374d]">|</span>
              <span className="flex items-center gap-1 text-cyan-300 font-semibold font-mono">
                0 <span className="text-[13px]">💎</span>
              </span>
              <span className="text-[#32374d]">|</span>
              <span className="flex items-center gap-1 text-pink-400 font-semibold font-mono">
                <Flame className="h-3.5 w-3.5 fill-pink-400 text-pink-400" /> 1
              </span>
            </div>

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

            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center font-bold text-xs text-white">
              OA
            </div>
          </div>
        </header>

        {/* CONTROLS & FILTER SECTION */}
        <section className="px-6 pt-5 pb-3 border-b border-[#1b1f2e] bg-[#0f111a] space-y-4">
          {/* Top Pill Modes */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141622] border border-[#202436]">
              <button
                onClick={() => setContentTab("videos")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  contentTab === "videos"
                    ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/40 shadow-sm"
                    : "text-[#7b84a2] hover:text-white hover:bg-[#1a1d2e]"
                }`}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Videos</span>
              </button>
              <button
                onClick={() => setContentTab("creators")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  contentTab === "creators"
                    ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/40 shadow-sm"
                    : "text-[#7b84a2] hover:text-white hover:bg-[#1a1d2e]"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Creators</span>
              </button>
              <button
                onClick={() => setContentTab("slideshows")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  contentTab === "slideshows"
                    ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/40 shadow-sm"
                    : "text-[#7b84a2] hover:text-white hover:bg-[#1a1d2e]"
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Slideshows / Shorts</span>
              </button>
            </div>

            {/* Quick Filter dropdown pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Fresh Content Filter */}
              <button
                onClick={() => {
                  const next = freshnessFilter === "fresh" ? "all" : "fresh";
                  setFreshnessFilter(next);
                  fetchMutation.mutate({ timeRange: next });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                  freshnessFilter === "fresh"
                    ? "border-pink-500/40 bg-pink-500/10 text-pink-300"
                    : "border-[#222638] bg-[#141622] text-[#868fa8] hover:text-white"
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-pink-400 fill-pink-500/30" />
                <span>{freshnessFilter === "fresh" ? "Fresh Content (<30d)" : "All Time"}</span>
              </button>

              {/* Format Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      formatFilter === "shorts"
                        ? "border-pink-500/50 bg-pink-500/15 text-pink-300 font-semibold shadow-sm"
                        : "border-[#222638] bg-[#141622] text-[#868fa8] hover:text-white hover:border-[#2d3248]"
                    }`}
                  >
                    <Video className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{formatFilter === "shorts" ? "Shorts" : "All Formats"}</span>
                    <ChevronDown className="h-3 w-3 text-[#6c7694]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="bg-[#141622] border border-[#262b3d] text-[#e2e4ee] p-1.5 rounded-xl shadow-2xl min-w-[160px] z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      if (formatFilter !== "all") {
                        setFormatFilter("all");
                        setPage(1);
                        setHasMore(true);
                        setNextPageToken(undefined);
                        fetchMutation.mutate({ format: "all" });
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                      formatFilter === "all"
                        ? "bg-pink-500/15 text-pink-300 font-semibold"
                        : "text-[#a0a9c6] hover:bg-[#1e2234] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-3.5 w-3.5 text-indigo-400" />
                      <span>All Formats</span>
                    </div>
                    {formatFilter === "all" && <Check className="h-3.5 w-3.5 text-pink-400 ml-2" />}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      if (formatFilter !== "shorts") {
                        setFormatFilter("shorts");
                        setPage(1);
                        setHasMore(true);
                        setNextPageToken(undefined);
                        fetchMutation.mutate({ format: "shorts" });
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                      formatFilter === "shorts"
                        ? "bg-pink-500/15 text-pink-300 font-semibold"
                        : "text-[#a0a9c6] hover:bg-[#1e2234] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Flame className="h-3.5 w-3.5 text-pink-400 fill-pink-500/30" />
                      <span>Shorts</span>
                    </div>
                    {formatFilter === "shorts" && <Check className="h-3.5 w-3.5 text-pink-400 ml-2" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Date Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222638] bg-[#141622] text-[#868fa8]">
                <Calendar className="h-3.5 w-3.5 text-pink-400" />
                <span>From 27 Sep 2026</span>
              </div>

              {/* Platform */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222638] bg-[#141622] text-[#868fa8]">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>All Platforms</span>
              </div>

              {/* Multiplier Threshold */}
              <button
                onClick={() => {
                  const next = minMultiplierFilter === 1 ? 10 : minMultiplierFilter === 10 ? 25 : 1;
                  setMinMultiplierFilter(next);
                  fetchMutation.mutate({ minMultiplier: next });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                  minMultiplierFilter > 1
                    ? "border-pink-500/50 bg-pink-500/15 text-pink-300 font-semibold"
                    : "border-[#222638] bg-[#141622] text-[#868fa8] hover:text-white"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-pink-400" />
                <span>{minMultiplierFilter > 1 ? `Min ${minMultiplierFilter}x Outliers` : "All Outliers"}</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC SEARCH BAR PER CHANNEL OR PER NICHE */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Channel vs Niche Selector */}
              <div className="flex rounded-xl bg-[#141622] border border-[#232738] p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSearchMode("channel")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    searchMode === "channel"
                      ? "bg-pink-500 text-white shadow"
                      : "text-[#808ba8] hover:text-white"
                  }`}
                >
                  Per Channel
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode("niche")}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    searchMode === "niche"
                      ? "bg-pink-500 text-white shadow"
                      : "text-[#808ba8] hover:text-white"
                  }`}
                >
                  Per Niche
                </button>
              </div>

              {/* Main Input Field */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606985]" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchMode === "channel"
                      ? "Paste channel URL or handle (e.g. @filmitgirl, @carnelltakes, @cleoabram)..."
                      : "Enter niche or keyword (e.g. AI Documentaries, NFL Highlights, Brainrot, True Crime)..."
                  }
                  className="pl-10 pr-24 h-11 bg-[#141622] border-[#252a3d] text-white placeholder:text-[#555d77] focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-xl text-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      fetchMutation.mutate({ query: "" });
                    }}
                    className="absolute right-24 top-1/2 -translate-y-1/2 text-[#717b99] hover:text-white p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <Button
                  type="submit"
                  disabled={fetchMutation.isPending}
                  className="absolute right-1 top-1 bottom-1 h-auto px-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold rounded-lg text-xs shadow-md shadow-pink-500/20"
                >
                  {fetchMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Pull Outliers</span>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Clickable Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-[11px] font-semibold text-[#656f8c] uppercase tracking-wider mr-1">
                {searchMode === "channel" ? "Presets:" : "Top Niches:"}
              </span>
              {searchMode === "channel" ? (
                <>
                  {CHANNEL_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p.query, "channel")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                        query === p.query
                          ? "bg-pink-500/20 border-pink-500 text-pink-300"
                          : "bg-[#141622] border-[#222638] text-[#868fa8] hover:text-white hover:border-[#32374e]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {NICHE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p.query, "niche")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                        query === p.query
                          ? "bg-pink-500/20 border-pink-500 text-pink-300"
                          : "bg-[#141622] border-[#222638] text-[#868fa8] hover:text-white hover:border-[#32374e]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </form>
        </section>

        {/* OUTLIER TILES GRID */}
        <main className="p-6 flex-1 bg-[#0b0c13]">
          {fetchMutation.isPending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] rounded-2xl bg-[#141622] border border-[#202436] animate-pulse p-3 flex flex-col justify-between"
                >
                  <div className="flex justify-between">
                    <div className="h-6 w-14 bg-[#202436] rounded-full"></div>
                    <div className="h-6 w-14 bg-[#202436] rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 bg-[#202436] rounded"></div>
                    <div className="h-3 w-1/2 bg-[#202436] rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayTiles.length === 0 ? (
            <div className="rounded-2xl border border-[#222638] bg-[#12141f] p-12 text-center max-w-lg mx-auto my-12">
              <div className="h-12 w-12 rounded-full bg-pink-500/10 text-pink-400 mx-auto flex items-center justify-center mb-4">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">No Outliers Found</h3>
              <p className="text-xs text-[#717b99] mb-6">
                Try searching for another channel handle or explore popular niches like "Pop Culture" or "AI Documentaries".
              </p>
              <Button
                onClick={() => {
                  setQuery("");
                  fetchMutation.mutate({ query: "" });
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white text-xs"
              >
                Reset to All Outliers
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayTiles.map((tile) => {
                const isTracked = trackedIds.has(tile.id);
                return (
                  <div
                    key={tile.id}
                    onClick={() => setSelectedTile(tile)}
                    className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#151722] border border-[#222536] hover:border-pink-500/60 shadow-lg hover:shadow-pink-500/10 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Background Thumbnail Image */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={tile.thumbnailUrl}
                        alt={tile.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback to high quality YouTube thumbnail format
                          (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${tile.id}/hqdefault.jpg`;
                        }}
                      />
                      {/* Gradient Overlays for Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b12] via-[#0a0b12]/30 to-[#0a0b12]/60 group-hover:via-[#0a0b12]/20 transition-colors" />
                    </div>

                    {/* TOP ACTION BAR ON TILE */}
                    <div className="relative z-10 p-2.5 flex items-start justify-between gap-1.5">
                      {/* Left: Track and Tag subtle buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => toggleTrack(tile.id, e)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur transition-all ${
                            isTracked
                              ? "bg-pink-500 text-white shadow-sm"
                              : "bg-black/50 hover:bg-black/80 text-white/90 border border-white/10"
                          }`}
                          title={isTracked ? "Tracked Outlier" : "Track this video"}
                        >
                          <Radio className="h-2.5 w-2.5" />
                          <span>{isTracked ? "Tracked" : "Track"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTile(tile);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 hover:bg-black/80 text-white/90 border border-white/10 backdrop-blur transition-colors"
                          title="Tags & Notes"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          <span>Tag</span>
                        </button>
                      </div>

                      {/* Right: Views Badge and Flame Multiplier Badge */}
                      <div className="flex flex-col items-end gap-1">
                        {/* Views Pill */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-semibold border border-white/10 shadow-sm">
                          <Eye className="h-3 w-3 text-white/80" />
                          <span>{tile.viewsText}</span>
                        </div>

                        {/* Outlier Flame Multiplier Badge (matching screenshot: vibrant pink/magenta pill) */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[11px] font-extrabold shadow-md shadow-pink-500/30">
                          <Flame className="h-3 w-3 fill-white text-white" />
                          <span>{tile.multiplierText}</span>
                        </div>
                      </div>
                    </div>

                    {/* CENTER HOVER PLAY CUE */}
                    <div className="relative z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="h-10 w-10 rounded-full bg-pink-500/90 text-white flex items-center justify-center shadow-lg shadow-pink-500/40 backdrop-blur scale-90 group-hover:scale-100 transition-transform">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* BOTTOM CREATOR & METADATA OVERLAY */}
                    <div className="relative z-10 p-3 space-y-1.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                      {/* Title snippet */}
                      <div className="text-xs font-semibold text-white line-clamp-2 leading-snug drop-shadow-sm group-hover:text-pink-300 transition-colors">
                        {tile.title}
                      </div>

                      {/* Creator avatar, handle and date */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <img
                          src={
                            tile.channelAvatarUrl ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                          }
                          alt={tile.channelTitle}
                          className="h-5 w-5 rounded-full object-cover ring-1 ring-white/20 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
                          }}
                        />
                        <div className="truncate flex-1">
                          <div className="text-[11px] font-bold text-white truncate drop-shadow-sm leading-tight">
                            {tile.channelTitle}
                          </div>
                          <div className="text-[10px] text-white/70 font-medium">
                            {tile.publishedDate || tile.publishedText}
                          </div>
                        </div>

                        {tile.durationText && (
                          <div className="text-[9px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white/90 border border-white/10 shrink-0">
                            {tile.durationText}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extra Loading Skeletons when infinite scrolling */}
            {isLoadingMore && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`loading-more-${i}`}
                    className="aspect-[9/16] rounded-2xl bg-[#141622] border border-[#202436] animate-pulse p-3 flex flex-col justify-between"
                  >
                    <div className="flex justify-between">
                      <div className="h-6 w-14 bg-[#202436] rounded-full"></div>
                      <div className="h-6 w-14 bg-[#202436] rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-3/4 bg-[#202436] rounded"></div>
                      <div className="h-3 w-1/2 bg-[#202436] rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Infinite Scroll Sentinel and Status Trigger */}
            <div ref={sentinelRef} className="py-10 flex flex-col items-center justify-center gap-3">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-semibold shadow-lg">
                  <Flame className="h-4 w-4 text-pink-400 fill-pink-500 animate-pulse" />
                  <span>Pulling more viral outliers...</span>
                </div>
              ) : hasMore ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadMore()}
                  className="border-[#262a3d] bg-[#141622] hover:bg-[#1e2234] text-xs text-[#a0a9c6] hover:text-white rounded-full px-5 py-2 shadow-sm transition-all"
                >
                  <Flame className="h-3.5 w-3.5 text-pink-400 fill-pink-500/30 mr-1.5" />
                  <span>Scroll down for more or click to load</span>
                  <ChevronDown className="h-3.5 w-3.5 ml-1.5 text-[#6c7694]" />
                </Button>
              ) : (
                <div className="text-xs text-[#555d77] font-medium flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-pink-400" />
                  <span>All available viral outliers loaded ({displayTiles.length} total)</span>
                </div>
              )}
            </div>
            </>
          )}
        </main>
      </div>

      {/* OUTLIER DETAILS / TEARDOWN MODAL */}
      {selectedTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#131520] border border-[#262b3d] shadow-2xl p-6 text-[#e2e4ee]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedTile(null)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full bg-[#1e2233] text-[#868fa8] hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 text-xs font-bold font-mono">
                <Flame className="h-3.5 w-3.5 fill-pink-500" />
                {selectedTile.multiplierText}x Outlier Score
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1c2030] text-[#a4aecd] text-xs font-medium">
                <Eye className="h-3.5 w-3.5" />
                {selectedTile.viewsText} views
              </span>
              {selectedTile.isShort && (
                <Badge variant="secondary" className="bg-rose-500/20 text-rose-300 text-[10px]">
                  YouTube Shorts
                </Badge>
              )}
            </div>

            {/* Video Preview & Title */}
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#232738] shadow-inner">
                <img
                  src={selectedTile.thumbnailUrl}
                  alt={selectedTile.title}
                  className="w-full h-full object-cover"
                />
                <a
                  href={selectedTile.url}
                  onClick={openExternal(selectedTile.url)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors group"
                >
                  <div className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-2xl shadow-pink-500/50 group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 fill-white ml-0.5" />
                  </div>
                </a>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white leading-snug">{selectedTile.title}</h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#868fa8]">
                  <span className="font-semibold text-white">{selectedTile.channelTitle}</span>
                  <span>•</span>
                  <span>{selectedTile.channelHandle}</span>
                  <span>•</span>
                  <span>Published: {selectedTile.publishedDate}</span>
                  {selectedTile.channelSubscribers && (
                    <>
                      <span>•</span>
                      <span>Subs: {selectedTile.channelSubscribers}</span>
                    </>
                  )}
                </div>
              </div>

              {/* WHY IT WORKED / PACKAGING ANALYSIS */}
              <div className="space-y-3 pt-2">
                <div className="rounded-xl bg-[#181a28] border border-[#252a3d] p-4 space-y-2">
                  <div className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Why It Outperformed (Viral Mechanics)
                  </div>
                  <p className="text-xs text-[#cad2e6] leading-relaxed">
                    {selectedTile.whyItWorked ||
                      `Generated massive engagement with ${selectedTile.multiplierText}x higher views than the channel's standard baseline, maximizing algorithmic velocity.`}
                  </p>
                </div>

                {selectedTile.outlierTitleFormula && (
                  <div className="rounded-xl bg-[#181a28] border border-[#252a3d] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Title Hook Formula
                    </div>
                    <code className="text-xs text-cyan-200 font-mono block bg-black/40 p-2 rounded">
                      {selectedTile.outlierTitleFormula}
                    </code>
                  </div>
                )}

                {selectedTile.outlierThumbnailConcept && (
                  <div className="rounded-xl bg-[#181a28] border border-[#252a3d] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Thumbnail Visual Concept
                    </div>
                    <p className="text-xs text-[#cad2e6]">{selectedTile.outlierThumbnailConcept}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#202538] flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTrack(selectedTile.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      trackedIds.has(selectedTile.id)
                        ? "bg-pink-500 text-white"
                        : "bg-[#202436] hover:bg-[#282d44] text-white"
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>{trackedIds.has(selectedTile.id) ? "Tracked Outlier" : "Track Outlier"}</span>
                  </button>
                  <a
                    href={selectedTile.url}
                    onClick={openExternal(selectedTile.url)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#202436] hover:bg-[#282d44] text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open on YouTube</span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/"
                    hash="thumbnail-lab"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white shadow-md shadow-pink-500/20 transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Model in Thumbnail Studio</span>
                  </Link>
                </div>
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
        onSaveKey={(k) => {
          setApiKey(k);
          try {
            localStorage.setItem(API_KEY_STORAGE_KEY, k);
          } catch {}
        }}
        onSaveAiKey={(ak) => {
          setAiApiKey(ak);
          try {
            if (ak) localStorage.setItem(AI_KEY_STORAGE_KEY, ak);
            else localStorage.removeItem(AI_KEY_STORAGE_KEY);
          } catch {}
        }}
        onClearKey={() => {
          setApiKey("");
          setAiApiKey("");
          try {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
            localStorage.removeItem(AI_KEY_STORAGE_KEY);
          } catch {}
        }}
      />
    </div>
  );
}
