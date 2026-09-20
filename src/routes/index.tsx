import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, type FormEvent } from "react";
import {
  AlertCircle,
  Download,
  ImagePlus,
  KeyRound,
  LayoutGrid,
  Loader2,
  Play,
  Search,
  Sparkles,
  Table as TableIcon,
  X,
} from "lucide-react";
import { analyzeChannel, getApiConfigStatus, type ChannelReport } from "@/lib/youtube.functions";
import {
  analyzeThumbnail,
  fetchVideoMetadata,
  type ThumbnailReport,
} from "@/lib/thumbnail.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ApiKeyModal, API_KEY_STORAGE_KEY, AI_KEY_STORAGE_KEY } from "@/components/ApiKeyModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Channel Sheet — YouTube Channel Data Extractor" },
      {
        name: "description",
        content:
          "Paste any YouTube channel URL and get subscribers, video count, niche, average length, upload frequency, best video and style in one row.",
      },
      { property: "og:title", content: "Channel Sheet — YouTube Channel Data Extractor" },
      {
        property: "og:description",
        content:
          "Turn any YouTube channel link into a clean data row: subs, videos, niche, upload frequency, best video and style.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const COLUMNS: { key: keyof ChannelReport; label: string }[] = [
  { key: "channel", label: "Channel" },
  { key: "url", label: "URL" },
  { key: "subscribers", label: "Subscribers" },
  { key: "videoCount", label: "Video Count" },
  { key: "niche", label: "Niche" },
  { key: "averageVideoLength", label: "Average Video Length" },
  { key: "uploadFrequency", label: "Upload Frequency" },
  { key: "bestVideo", label: "Best Video" },
  { key: "bestViews", label: "Best Views" },
  { key: "style", label: "Style" },
];

// The preview runs inside a sandboxed frame, where a plain target="_blank"
// popup inherits the sandbox and YouTube refuses to load. Opening from the
// top-level window escapes that.
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

function Index() {
  const [url, setUrl] = useState("");
  const [rows, setRows] = useState<ChannelReport[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);

  const run = useServerFn(analyzeChannel);
  const checkServerKey = useServerFn(getApiConfigStatus);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (stored) setApiKey(stored);
      const storedAi = localStorage.getItem(AI_KEY_STORAGE_KEY);
      if (storedAi) setAiApiKey(storedAi);
    } catch {
      // ignore localStorage errors in restricted environments
    }

    checkServerKey()
      .then((res) => {
        if (res?.hasServerKey) setHasServerKey(true);
      })
      .catch(() => {});
  }, [checkServerKey]);

  const mutation = useMutation({
    mutationFn: (value: string) =>
      run({ data: { url: value, apiKey: apiKey || undefined, aiApiKey: aiApiKey || undefined } }),
    onSuccess: (report) => {
      setRows((prev) => [report, ...prev.filter((r) => r.url !== report.url)]);
      setUrl("");
    },
  });

  function handleSaveKey(newKey: string) {
    setApiKey(newKey);
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    } catch {}
  }

  function handleSaveAiKey(newAiKey: string) {
    setAiApiKey(newAiKey);
    try {
      if (newAiKey) {
        localStorage.setItem(AI_KEY_STORAGE_KEY, newAiKey);
      } else {
        localStorage.removeItem(AI_KEY_STORAGE_KEY);
      }
    } catch {}
  }

  function handleClearKey() {
    setApiKey("");
    setAiApiKey("");
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(AI_KEY_STORAGE_KEY);
    } catch {}
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (url.trim()) mutation.mutate(url.trim());
  }

  return (
    <main className="min-h-screen bg-background">
      <div
        className="border-b border-border"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Play className="h-5 w-5 fill-current" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Channel Sheet</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKeyModalOpen(true)}
              className="h-9 gap-2 border-border/80 bg-background/50 backdrop-blur text-xs hover:bg-accent cursor-pointer transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">API Key</span>
              {hasServerKey ? (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500 border-0 text-[10px] px-1.5 py-0 h-4 font-normal">
                  Server
                </Badge>
              ) : apiKey ? (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500 border-0 text-[10px] px-1.5 py-0 h-4 font-normal">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px] px-1.5 py-0 h-4 font-normal">
                  Configure
                </Badge>
              )}
            </Button>
          </header>

          <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Paste a YouTube channel link. Get the full data row.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Subscribers, video count, niche, average length, upload frequency, top video and content
            style — pulled live and laid out like a spreadsheet.
          </p>

          <form onSubmit={onSubmit} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/@mkbhd"
              aria-label="YouTube channel URL"
              maxLength={300}
              className="h-12 flex-1"
            />
            <Button type="submit" size="lg" disabled={mutation.isPending} className="h-12 cursor-pointer">
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Analyze
            </Button>
          </form>

          {mutation.isError && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{(mutation.error as Error).message}</span>
              </div>
              {(mutation.error as Error).message.toLowerCase().includes("key") && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setKeyModalOpen(true)}
                  className="h-8 shrink-0 text-xs gap-1.5 cursor-pointer shadow-sm"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Configure API Key
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div
          className="overflow-x-auto rounded-lg border border-border bg-card"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60">
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-4 py-14 text-center text-muted-foreground"
                  >
                    No channels yet — analyze one above to fill this row.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.url} className="border-b border-border last:border-0 hover:bg-accent/40">
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="px-4 py-4 align-top">
                       {c.key === "url" ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={openExternal(row.url)}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {row.url.replace("https://www.youtube.com/", "")}
                        </a>
                      ) : c.key === "bestVideo" ? (
                        row.bestVideoUrl ? (
                          <a
                            href={row.bestVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={openExternal(row.bestVideoUrl)}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {row.bestVideo}
                          </a>
                        ) : (
                          <span>{row.bestVideo}</span>
                        )
                      ) : (
                        <span className={c.key === "channel" ? "font-medium" : ""}>{row[c.key]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ThumbnailSection
        apiKey={apiKey}
        aiApiKey={aiApiKey}
        onOpenKeyModal={() => setKeyModalOpen(true)}
      />

      <ApiKeyModal
        open={keyModalOpen}
        onOpenChange={setKeyModalOpen}
        apiKey={apiKey}
        aiApiKey={aiApiKey}
        onSaveKey={handleSaveKey}
        onSaveAiKey={handleSaveAiKey}
        onClearKey={handleClearKey}
        hasServerKey={hasServerKey}
      />
    </main>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

interface ThumbnailSectionProps {
  apiKey?: string;
  aiApiKey?: string;
  onOpenKeyModal?: () => void;
}

function ThumbnailSection({ apiKey, aiApiKey, onOpenKeyModal }: ThumbnailSectionProps) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumb, setThumb] = useState<string | null>(null);
  const [reports, setReports] = useState<ThumbnailReport[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const run = useServerFn(analyzeThumbnail);
  const getMeta = useServerFn(fetchVideoMetadata);

  function exportToCsv() {
    if (reports.length === 0) return;
    const headers = [
      "Thumbnail",
      "What made you click?",
      "What question does the title create?",
      "What does the thumbnail communicate?",
      "What happens in the first 30 seconds?",
      "What is the central mystery/problem?",
      "What appears to be the payoff?",
    ];
    const csvRows = [
      headers.join(","),
      ...reports.map((r) =>
        [
          `"${(r.thumbnail || "").replace(/"/g, '""')}"`,
          `"${(r.clickTrigger || "Title and Thumbnail").replace(/"/g, '""')}"`,
          `"${(r.titleQuestion || "").replace(/"/g, '""')}"`,
          `"${(r.thumbnailMessage || "").replace(/"/g, '""')}"`,
          `"${(r.first30Seconds || "").replace(/"/g, '""')}"`,
          `"${(r.centralMystery || "").replace(/"/g, '""')}"`,
          `"${(r.payoff || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `packaging_analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const mutation = useMutation({
    mutationFn: (input: { title: string; thumbnail: string; videoUrl?: string }) =>
      run({
        data: {
          title: input.title,
          thumbnail: input.thumbnail,
          videoUrl: input.videoUrl || undefined,
          apiKey: apiKey || undefined,
          aiApiKey: aiApiKey || undefined,
        },
      }),
    onSuccess: (report) => {
      setReports((prev) => [report, ...prev]);
      setTitle("");
      setThumb(null);
      setVideoUrl("");
    },
  });

  useEffect(() => {
    const raw = videoUrl.trim();
    if (!raw) return;

    const match =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.exec(raw);
    const vid = match?.[1] || (/^[a-zA-Z0-9_-]{11}$/.test(raw) ? raw : null);

    if (!vid) return;

    // Fast visual thumbnail preview immediately
    setThumb((prev) => (prev?.startsWith("data:") ? prev : `https://img.youtube.com/vi/${vid}/hqdefault.jpg`));

    let isMounted = true;
    setIsLoadingMeta(true);

    getMeta({ data: { videoUrl: raw, apiKey: apiKey || undefined } })
      .then((meta) => {
        if (!isMounted || !meta) return;
        if (meta.title) {
          setTitle(meta.title);
        }
        if (meta.thumbnail) {
          setThumb((prev) => (prev?.startsWith("data:") ? prev : meta.thumbnail));
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch video metadata:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMeta(false);
      });

    return () => {
      isMounted = false;
    };
  }, [videoUrl, apiKey, getMeta]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Please pick an image under 5 MB.");
      return;
    }
    setThumb(await readAsDataUrl(file));
    e.target.value = "";
  }

  function onAnalyze(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || (!thumb && !videoUrl.trim()) || mutation.isPending) return;
    mutation.mutate({ title: title.trim(), thumbnail: thumb || "", videoUrl: videoUrl.trim() });
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div
        className="rounded-lg border border-border bg-card p-6 sm:p-8"
        style={{ boxShadow: "var(--shadow-panel)" }}
      >
        <div className="flex items-center gap-2 text-primary">
          <ImagePlus className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-[0.2em]">
            Title &amp; Thumbnail Lab
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Test your packaging before you publish.
        </h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Enter a video title and link or thumbnail to see what made viewers click, the question the title creates,
          what the thumbnail communicates, and what happens in the first 30 seconds.
        </p>

        <form onSubmit={onAnalyze} className="mt-6 flex flex-col gap-4">
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="YouTube Video Link (e.g. https://www.youtube.com/watch?v=...)"
            aria-label="YouTube video URL"
            className="h-12"
          />

          <div className="relative">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isLoadingMeta
                  ? "Fetching video title..."
                  : "e.g. Mansa Musa - History's Richest Man Documentary"
              }
              aria-label="Video title"
              maxLength={300}
              className={`h-12 ${isLoadingMeta ? "pr-10" : ""}`}
            />
            {isLoadingMeta && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center gap-1 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="flex h-28 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 sm:w-56">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Upload thumbnail"
                onChange={onFile}
              />
              {thumb ? (
                <img
                  src={thumb}
                  alt="Uploaded thumbnail preview"
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <ImagePlus className="h-5 w-5" />
                  Upload thumbnail
                </span>
              )}
            </label>
            {thumb && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setThumb(null)}
                className="self-start"
              >
                <X className="h-4 w-4" /> Remove
              </Button>
            )}
          </div>

          <div>
            <Button
              type="submit"
              size="lg"
              disabled={!title.trim() || (!thumb && !videoUrl.trim()) || mutation.isPending}
              className="h-12 cursor-pointer"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Analyze packaging
            </Button>
          </div>

          {mutation.isError && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{(mutation.error as Error).message}</span>
              </div>
              {onOpenKeyModal &&
                (() => {
                  const msg = ((mutation.error as Error).message || "").toLowerCase();
                  const isKeyError =
                    msg.includes("ai key") ||
                    msg.includes("api key") ||
                    msg.includes("unauthorized") ||
                    msg.includes("quota");
                  return isKeyError && !aiApiKey ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={onOpenKeyModal}
                      className="h-8 shrink-0 text-xs gap-1.5 cursor-pointer shadow-sm"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Configure AI Key
                    </Button>
                  ) : null;
                })()}
            </div>
          )}
        </form>

        {reports.length > 0 && (
          <div className="mt-10 flex flex-col gap-4">
            {/* Header & View Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  Packaging Reports ({reports.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
                  <Button
                    type="button"
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Cards
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer"
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    Spreadsheet
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={exportToCsv}
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export to CSV
                </Button>
              </div>
            </div>

            {/* Cards View */}
            {viewMode === "cards" && (
              <div className="flex flex-col gap-4">
                {reports.map((r, i) => (
                  <article
                    key={`${r.title}-${i}`}
                    className="flex flex-col gap-5 rounded-lg border border-border bg-secondary/30 p-4 sm:p-5 sm:flex-row"
                  >
                    <div className="shrink-0 sm:w-60">
                      <img
                        src={r.thumbnail}
                        alt={`Thumbnail for ${r.title}`}
                        className="h-36 w-full rounded-md object-cover border border-border/80 shadow-sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-base sm:text-lg leading-snug">{r.title}</h3>
                        {r.analysisMode === "vision_ai" ? (
                          <Badge
                            variant="secondary"
                            className="bg-primary/15 text-primary border-primary/30 text-[10px] gap-1 py-0.5 shrink-0"
                          >
                            <Sparkles className="h-3 w-3" /> Vision AI
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px] py-0.5 shrink-0">
                            Deep Packaging Analysis
                          </Badge>
                        )}
                      </div>

                      {/* What made you click? */}
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          What made you click?
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-primary">
                          {r.clickTrigger || "Title and Thumbnail"}
                        </p>
                      </div>

                      {/* Question the title creates */}
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Question the title creates
                        </p>
                        <p className="mt-0.5 text-sm font-medium leading-relaxed text-foreground">
                          {r.titleQuestion}
                        </p>
                      </div>

                      {/* What the thumbnail communicates */}
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          What does the thumbnail communicate?
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                          {r.thumbnailMessage}
                        </p>
                      </div>

                      {/* What happens in the first 30 seconds */}
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          What happens in the first 30 seconds
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                          {r.first30Seconds}
                        </p>
                      </div>

                      {/* What is the central mystery/problem? */}
                      {r.centralMystery && (
                        <div className="mt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            What is the central mystery/problem?
                          </p>
                          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                            {r.centralMystery}
                          </p>
                        </div>
                      )}

                      {/* What appears to be the payoff? */}
                      {r.payoff && (
                        <div className="mt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            What appears to be the payoff?
                          </p>
                          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                            {r.payoff}
                          </p>
                        </div>
                      )}

                      {r.aiNotice && (
                        <div className="mt-4 flex items-start justify-between gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                          <span>{r.aiNotice}</span>
                          {onOpenKeyModal && (
                            <button
                              type="button"
                              onClick={onOpenKeyModal}
                              className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
                            >
                              Configure
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Spreadsheet Table View (Matching Excel Reference) */}
            {viewMode === "table" && (
              <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
                <table className="w-full min-w-[1300px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-48">
                        Thumbnail
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-44">
                        What made you click?
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-64">
                        What question does the title create?
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        What does the thumbnail communicate?
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-72">
                        What happens in the first 30 seconds?
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-72">
                        What is the central mystery/problem?
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-72">
                        What appears to be the payoff?
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r, i) => (
                      <tr
                        key={`${r.title}-${i}`}
                        className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-4 py-3.5 align-top">
                          <img
                            src={r.thumbnail}
                            alt={`Thumbnail for ${r.title}`}
                            className="h-20 w-32 rounded-md object-cover border border-border/80 shadow-sm"
                          />
                          <p className="mt-1.5 line-clamp-2 text-xs font-medium text-foreground/90 max-w-[130px]">
                            {r.title}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 align-top font-semibold text-primary text-xs leading-relaxed">
                          {r.clickTrigger || "Title and Thumbnail"}
                        </td>
                        <td className="px-4 py-3.5 align-top text-xs leading-relaxed font-medium text-foreground">
                          {r.titleQuestion}
                        </td>
                        <td className="px-4 py-3.5 align-top text-xs leading-relaxed text-muted-foreground">
                          {r.thumbnailMessage}
                        </td>
                        <td className="px-4 py-3.5 align-top text-xs leading-relaxed text-muted-foreground">
                          {r.first30Seconds}
                        </td>
                        <td className="px-4 py-3.5 align-top text-xs leading-relaxed text-muted-foreground">
                          {r.centralMystery}
                        </td>
                        <td className="px-4 py-3.5 align-top text-xs leading-relaxed text-muted-foreground">
                          {r.payoff}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
