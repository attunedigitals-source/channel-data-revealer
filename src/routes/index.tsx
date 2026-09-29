import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Film,
  Flame,
  ImagePlus,
  KeyRound,
  Layers,
  LayoutGrid,
  ListPlus,
  Loader2,
  Play,
  Search,
  Sparkles,
  Square,
  Table as TableIcon,
  Trash2,
  Upload,
  Users,
  X,
  Brain,
  Compass,
  ShieldCheck,
} from "lucide-react";
import { analyzeChannel, getApiConfigStatus, type ChannelReport } from "@/lib/youtube.functions";
import { CompetitorSection } from "@/components/CompetitorSection";
import { OutlierSection } from "@/components/OutlierSection";
import { ThumbnailAnalysisCreationSection } from "@/components/ThumbnailAnalysisCreationSection";
import { TitleGeneratorSection } from "@/components/TitleGeneratorSection";
import { AudiencePsychologySection } from "@/components/AudiencePsychologySection";
import { StoryMapSection } from "@/components/StoryMapSection";
import { FactVerificationSection } from "@/components/FactVerificationSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
          <header className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-primary">
              <Play className="h-5 w-5 fill-current" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Channel Sheet</span>
            </div>

            <nav className="hidden sm:flex items-center gap-1 rounded-full border border-border/80 bg-background/60 backdrop-blur px-3 py-1 text-xs">
              <a
                href="#channel-sheet"
                className="px-2.5 py-1 text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Channel Data
              </a>
              <span className="text-border">•</span>
              <a
                href="#competition-analysis"
                className="px-2.5 py-1 text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                Competition Analysis
              </a>
              <span className="text-border">•</span>
              <Link
                to="/outliers"
                className="px-2.5 py-1 text-pink-400 hover:text-pink-300 font-semibold transition-colors flex items-center gap-1.5"
              >
                <Flame className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
                Viral Outliers
                <Badge variant="secondary" className="bg-pink-500/20 text-pink-400 border-0 text-[9px] px-1 py-0 h-3.5 font-bold">
                  NEW
                </Badge>
              </Link>
              <span className="text-border">•</span>
              <a
                href="#thumbnail-lab"
                className="px-2.5 py-1 text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1.5"
              >
                <ImagePlus className="h-3.5 w-3.5 text-primary" />
                Thumbnail Studio
              </a>
              <span className="text-border">•</span>
              <a
                href="#title-generator"
                className="px-2.5 py-1 text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Title Generator
              </a>
              <span className="text-border">•</span>
              <a
                href="#audience-psychology"
                className="px-2.5 py-1 text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1.5"
              >
                <Brain className="h-3.5 w-3.5 text-primary" />
                Audience Psychology
              </a>
              <span className="text-border">•</span>
              <a
                href="#story-map"
                className="px-2.5 py-1 text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1.5"
              >
                <Compass className="h-3.5 w-3.5 text-indigo-400" />
                Story Map
              </a>
              <span className="text-border">•</span>
              <a
                href="#fact-verification"
                className="px-2.5 py-1 text-muted-foreground hover:text-foreground font-medium transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                Fact Verification
              </a>
            </nav>

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

      <section id="channel-sheet" className="mx-auto max-w-6xl px-6 py-12">
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

      <CompetitorSection
        apiKey={apiKey}
        aiApiKey={aiApiKey}
        onOpenKeyModal={() => setKeyModalOpen(true)}
      />

      <OutlierSection />

      <ThumbnailAnalysisCreationSection
        apiKey={apiKey}
        aiApiKey={aiApiKey}
        onOpenKeyModal={() => setKeyModalOpen(true)}
      />

      <TitleGeneratorSection
        aiApiKey={aiApiKey}
        onOpenKeyModal={() => setKeyModalOpen(true)}
      />

      <AudiencePsychologySection
        aiApiKey={aiApiKey}
        onOpenKeyModal={() => setKeyModalOpen(true)}
      />

      <StoryMapSection
        aiApiKey={aiApiKey}
        onOpenKeyModal={() => setKeyModalOpen(true)}
      />

      <FactVerificationSection
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
