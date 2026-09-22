import { useState, useMemo, useRef, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  Users,
  Search,
  Upload,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Download,
  FileSpreadsheet,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Square,
  Sparkles,
  ExternalLink,
  Play,
  Clock,
  Video,
  Eye,
  Calendar,
  X,
} from "lucide-react";
import {
  analyzeCompetitorChannel,
  parseBatchChannelUrls,
  type CompetitorReport,
} from "@/lib/youtube.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const COMPETITOR_COLUMNS = [
  { key: "index", label: "No." },
  { key: "channelName", label: "Channel Name" },
  { key: "subscribers", label: "Subscribers" },
  { key: "videoCount", label: "No of Videos" },
  { key: "typicalVideoLength", label: "Typical Video Length" },
  { key: "uploadFrequency", label: "Upload Frequency" },
  { key: "topVideoViews", label: "Top Video Views" },
] as const;

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

const SAMPLE_COMPETITORS = [
  "https://www.youtube.com/@veritasium",
  "https://www.youtube.com/@mkbhd",
  "https://www.youtube.com/@cleoabram",
  "https://www.youtube.com/@Kurzgesagt",
];

interface CompetitorSectionProps {
  apiKey?: string;
  onOpenKeyModal?: () => void;
}

export function CompetitorSection({ apiKey, onOpenKeyModal }: CompetitorSectionProps) {
  const [tabMode, setTabMode] = useState<"single" | "bulk">("single");
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [reports, setReports] = useState<CompetitorReport[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Bulk state
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    currentChannel?: string;
  } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const abortBatchRef = useRef(false);

  const runAnalysis = useServerFn(analyzeCompetitorChannel);

  const singleMutation = useMutation({
    mutationFn: (url: string) =>
      runAnalysis({ data: { url, apiKey: apiKey || undefined } }),
    onSuccess: (report) => {
      setReports((prev) => [
        report,
        ...prev.filter(
          (r) =>
            r.channelUrl.toLowerCase() !== report.channelUrl.toLowerCase() &&
            r.channelName.toLowerCase() !== report.channelName.toLowerCase(),
        ),
      ]);
      setSingleUrl("");
    },
  });

  const parsedBulkUrls = useMemo(() => parseBatchChannelUrls(bulkText), [bulkText]);

  function onSingleSubmit(e: FormEvent) {
    e.preventDefault();
    if (singleUrl.trim()) {
      singleMutation.mutate(singleUrl.trim());
    }
  }

  function handlePasteSamples() {
    setBulkText(SAMPLE_COMPETITORS.join("\n"));
  }

  async function handleStartBatch() {
    if (parsedBulkUrls.length === 0 || isBatchRunning) return;
    setIsBatchRunning(true);
    setBatchError(null);
    abortBatchRef.current = false;

    const total = parsedBulkUrls.length;
    let completedCount = 0;
    const newReports: CompetitorReport[] = [];

    for (let i = 0; i < total; i++) {
      if (abortBatchRef.current) break;

      const currentTarget = parsedBulkUrls[i] || "";
      setBatchProgress({
        current: i + 1,
        total,
        currentChannel: currentTarget.replace("https://www.youtube.com/", ""),
      });

      try {
        const report = await runAnalysis({
          data: { url: currentTarget, apiKey: apiKey || undefined },
        });

        if (!abortBatchRef.current) {
          newReports.unshift(report);
          setReports((prev) => [
            report,
            ...prev.filter(
              (r) =>
                r.channelUrl.toLowerCase() !== report.channelUrl.toLowerCase() &&
                r.channelName.toLowerCase() !== report.channelName.toLowerCase(),
            ),
          ]);
        }
      } catch (err: any) {
        console.warn(`Failed analyzing competitor [${currentTarget}]:`, err);
      }

      completedCount++;
    }

    setIsBatchRunning(false);
    setBatchProgress(null);
  }

  function handleStopBatch() {
    abortBatchRef.current = true;
    setIsBatchRunning(false);
    setBatchProgress(null);
  }

  function handleRemoveReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id && r.channelUrl !== id));
  }

  function handleClearAll() {
    if (reports.length === 0) return;
    if (window.confirm("Clear all competition analysis results?")) {
      setReports([]);
    }
  }

  function sanitizeCell(val: any, maxLen = 32000): string {
    if (val == null) return "";
    const s = String(val).trim();
    return s.length > maxLen ? s.slice(0, maxLen) : s;
  }

  async function exportToExcel() {
    if (reports.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const utils = XLSX.utils || (XLSX as any).default?.utils;
      const write = XLSX.write || (XLSX as any).default?.write;

      if (!utils || !write) {
        throw new Error("Excel export utilities not available.");
      }

      const data = reports.map((r, index) => ({
        "No.": index + 1,
        "Channel Name": sanitizeCell(r.channelName),
        "Channel URL": sanitizeCell(r.channelUrl),
        Subscribers: sanitizeCell(r.subscribers),
        "No of Videos": sanitizeCell(r.videoCount),
        "Typical Video Length": sanitizeCell(r.typicalVideoLength),
        "Upload Frequency": sanitizeCell(r.uploadFrequency),
        "Top Video Views": sanitizeCell(r.topVideoViews),
        "Top Video Title": sanitizeCell(r.topVideoTitle || "N/A"),
        "Top Video URL": sanitizeCell(r.topVideoUrl || ""),
      }));

      const worksheet = utils.json_to_sheet(data);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 28 },
        { wch: 36 },
        { wch: 18 },
        { wch: 16 },
        { wch: 24 },
        { wch: 22 },
        { wch: 20 },
        { wch: 45 },
        { wch: 40 },
      ];

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Competition Analysis");

      const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `competition_analysis_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Failed to export Excel file. Please use Export to CSV instead.");
    }
  }

  function exportToCsv() {
    if (reports.length === 0) return;

    const headers = [
      "No.",
      "Channel Name",
      "Channel URL",
      "Subscribers",
      "No of Videos",
      "Typical Video Length",
      "Upload Frequency",
      "Top Video Views",
      "Top Video Title",
      "Top Video URL",
    ];

    const escapeCsv = (val: string | number) => {
      const s = String(val ?? "").trim();
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = reports.map((r, index) => [
      index + 1,
      escapeCsv(r.channelName),
      escapeCsv(r.channelUrl),
      escapeCsv(r.subscribers),
      escapeCsv(r.videoCount),
      escapeCsv(r.typicalVideoLength),
      escapeCsv(r.uploadFrequency),
      escapeCsv(r.topVideoViews),
      escapeCsv(r.topVideoTitle || "N/A"),
      escapeCsv(r.topVideoUrl || ""),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `competition_analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section id="competition-analysis" className="border-t border-border bg-card/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Market Intelligence
              </span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Competition Analysis
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Benchmark rival YouTube channels: Subscribers, No of Videos, Typical Video Length, Upload Frequency & Top Video Views.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-lg border border-border bg-background/80 p-1">
            <Button
              type="button"
              variant={tabMode === "single" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTabMode("single")}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              Single Channel
            </Button>
            <Button
              type="button"
              variant={tabMode === "bulk" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTabMode("bulk")}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" />
              Bulk Upload
              {parsedBulkUrls.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] h-4 bg-primary/20 text-primary">
                  {parsedBulkUrls.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="mt-8">
          {tabMode === "single" ? (
            /* Single Channel Form */
            <form onSubmit={onSingleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Input
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  placeholder="Paste channel URL or handle (e.g. https://www.youtube.com/@veritasium)"
                  aria-label="Competitor Channel URL"
                  className="h-12 pr-10"
                />
                {singleUrl && (
                  <button
                    type="button"
                    onClick={() => setSingleUrl("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={singleMutation.isPending || !singleUrl.trim()}
                className="h-12 cursor-pointer gap-2 shrink-0"
              >
                {singleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Analyze Competitor
              </Button>
            </form>
          ) : (
            /* Bulk Channels Upload */
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold">Bulk Competitor Channel Analysis</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paste multiple channel links or handles (separated by new lines or commas).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePasteSamples}
                    className="h-8 text-xs gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    Paste Sample Channels
                  </Button>
                  {bulkText && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setBulkText("")}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`https://www.youtube.com/@veritasium\nhttps://www.youtube.com/@mkbhd\nhttps://www.youtube.com/@cleoabram\nhttps://www.youtube.com/@Kurzgesagt`}
                rows={5}
                className="font-mono text-xs leading-relaxed resize-y"
              />

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Detected:</span>
                  <Badge variant="outline" className="font-semibold text-foreground">
                    {parsedBulkUrls.length} {parsedBulkUrls.length === 1 ? "Channel" : "Channels"}
                  </Badge>
                  {parsedBulkUrls.length > 0 && (
                    <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ready for analysis
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isBatchRunning ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleStopBatch}
                      className="h-10 text-xs gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      Stop Batch
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={parsedBulkUrls.length === 0}
                      onClick={handleStartBatch}
                      className="h-10 text-xs gap-2 cursor-pointer shadow-sm"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Analyze All Channels ({parsedBulkUrls.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Indicator */}
              {batchProgress && (
                <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>
                        Analyzing {batchProgress.current} of {batchProgress.total}
                      </span>
                      {batchProgress.currentChannel && (
                        <span className="text-muted-foreground truncate max-w-xs font-mono text-[11px]">
                          ({batchProgress.currentChannel})
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-primary">
                      {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(batchProgress.current / batchProgress.total) * 100}
                    className="h-2"
                  />
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {singleMutation.isError && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive max-w-2xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{(singleMutation.error as Error).message}</span>
              </div>
              {(singleMutation.error as Error).message.toLowerCase().includes("key") && onOpenKeyModal && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={onOpenKeyModal}
                  className="h-7 text-xs cursor-pointer"
                >
                  Configure API Key
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results Controls Bar */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold tracking-tight">Competitor Benchmark</h3>
            <Badge variant="secondary" className="font-medium text-xs">
              {reports.length} {reports.length === 1 ? "Channel" : "Channels"} Analyzed
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
              <Button
                type="button"
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
                title="Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                Table
              </Button>
              <Button
                type="button"
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
                title="Cards View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </Button>
            </div>

            {/* Export Buttons */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reports.length === 0}
              onClick={exportToExcel}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer border-emerald-600/30 hover:bg-emerald-500/10 text-emerald-500"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Spreadsheet (.xlsx)
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reports.length === 0}
              onClick={exportToCsv}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export to CSV
            </Button>

            {reports.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                title="Clear All Results"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Results Container */}
        <div className="mt-6">
          {reports.length === 0 ? (
            /* Empty State */
            <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <h4 className="text-base font-semibold">No Competitor Channels Analyzed Yet</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-5">
                Analyze a single channel URL above or switch to Bulk Upload to benchmark multiple rivals side-by-side.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSingleUrl("https://www.youtube.com/@veritasium");
                  singleMutation.mutate("https://www.youtube.com/@veritasium");
                }}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Analyze Veritasium as Demo
              </Button>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div
              className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm"
              style={{ boxShadow: "var(--shadow-panel)" }}
            >
              <table className="w-full min-w-[950px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Channel Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Subscribers
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      No of Videos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Typical Video Length
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Upload Frequency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Top Video Views
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, index) => (
                    <tr
                      key={r.id || r.channelUrl}
                      className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors"
                    >
                      <td className="px-4 py-4 text-xs font-mono text-muted-foreground align-top">
                        {index + 1}
                      </td>

                      {/* Channel Name */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-3">
                          {r.avatarUrl ? (
                            <img
                              src={r.avatarUrl}
                              alt={r.channelName}
                              className="h-8 w-8 rounded-full border border-border object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {r.channelName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <a
                              href={r.channelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={openExternal(r.channelUrl)}
                              className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate"
                            >
                              <span>{r.channelName}</span>
                              <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                            </a>
                            <span className="text-[11px] text-muted-foreground block truncate max-w-[220px]">
                              {r.channelUrl.replace("https://www.youtube.com/", "")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Subscribers */}
                      <td className="px-4 py-4 align-top">
                        <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5 bg-secondary/80">
                          {r.subscribers}
                        </Badge>
                      </td>

                      {/* No of Videos */}
                      <td className="px-4 py-4 align-top font-mono text-xs">
                        {r.videoCount}
                      </td>

                      {/* Typical Video Length */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{r.typicalVideoLength}</span>
                        </div>
                      </td>

                      {/* Upload Frequency */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{r.uploadFrequency}</span>
                        </div>
                      </td>

                      {/* Top Video Views */}
                      <td className="px-4 py-4 align-top">
                        <div>
                          <span className="font-semibold text-primary text-xs flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {r.topVideoViews}
                          </span>
                          {r.topVideoTitle && r.topVideoTitle !== "N/A" && (
                            <a
                              href={r.topVideoUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={r.topVideoUrl ? openExternal(r.topVideoUrl) : undefined}
                              className="text-[11px] text-muted-foreground hover:text-foreground line-clamp-1 mt-0.5 max-w-[240px]"
                              title={r.topVideoTitle}
                            >
                              {r.topVideoTitle}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Remove */}
                      <td className="px-4 py-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveReport(r.id || r.channelUrl)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          title="Remove channel"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reports.map((r, index) => (
                <div
                  key={r.id || r.channelUrl}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-border/80 transition-all flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {r.avatarUrl ? (
                          <img
                            src={r.avatarUrl}
                            alt={r.channelName}
                            className="h-11 w-11 rounded-full border border-border object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {r.channelName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <a
                            href={r.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={openExternal(r.channelUrl)}
                            className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate text-base"
                          >
                            <span className="truncate">{r.channelName}</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-50 shrink-0" />
                          </a>
                          <span className="text-xs text-muted-foreground block truncate">
                            {r.channelUrl.replace("https://www.youtube.com/", "")}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground shrink-0">
                        #{index + 1}
                      </Badge>
                    </div>

                    {/* Metric Badges Grid */}
                    <div className="grid grid-cols-2 gap-2.5 mt-5">
                      <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                          Subscribers
                        </span>
                        <span className="text-sm font-bold text-foreground mt-0.5 block">
                          {r.subscribers}
                        </span>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                          No of Videos
                        </span>
                        <span className="text-sm font-bold text-foreground mt-0.5 block font-mono">
                          {r.videoCount}
                        </span>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                          Typical Length
                        </span>
                        <span className="text-sm font-bold text-foreground mt-0.5 block font-mono">
                          {r.typicalVideoLength}
                        </span>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/50 p-2.5">
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                          Frequency
                        </span>
                        <span className="text-sm font-bold text-foreground mt-0.5 block truncate">
                          {r.uploadFrequency}
                        </span>
                      </div>
                    </div>

                    {/* Top Video Views Feature */}
                    <div className="mt-3.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Top Video Views
                        </span>
                        <Badge variant="secondary" className="text-xs font-bold px-2 py-0 bg-primary/15 text-primary border-0">
                          {r.topVideoViews}
                        </Badge>
                      </div>
                      {r.topVideoTitle && r.topVideoTitle !== "N/A" && (
                        <a
                          href={r.topVideoUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={r.topVideoUrl ? openExternal(r.topVideoUrl) : undefined}
                          className="mt-1.5 text-xs text-foreground/90 hover:text-primary block line-clamp-2 transition-colors font-medium"
                        >
                          {r.topVideoTitle}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      Source:{" "}
                      <span className="font-medium text-foreground">
                        {r.analysisSource === "api" ? "YouTube API v3" : "Public Scrape"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReport(r.id || r.channelUrl)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
