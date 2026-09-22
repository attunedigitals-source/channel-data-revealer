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
  Flame,
  TrendingUp,
  Lightbulb,
  Zap,
  Info,
  FileText,
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
  { key: "outlierVideo", label: "Outlier Video" },
  { key: "outlierVideoViews", label: "Outlier Video Views" },
  { key: "outlierViewsSubRatio", label: "Outlier Video Views/Subscribers Ratio" },
  { key: "outlierVideoLength", label: "Outlier Video Length" },
  { key: "outlierTopic", label: "Outlier Topic" },
  { key: "outlierTitleFormula", label: "Outlier Title Formula" },
  { key: "outlierThumbnailConcept", label: "Outlier Thumbnail Concept" },
  { key: "whyItWorked", label: "Why it might have worked" },
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
  aiApiKey?: string;
  onOpenKeyModal?: () => void;
}

export function CompetitorSection({ apiKey, aiApiKey, onOpenKeyModal }: CompetitorSectionProps) {
  const [tabMode, setTabMode] = useState<"single" | "bulk">("single");
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [reports, setReports] = useState<CompetitorReport[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedDetailReport, setSelectedDetailReport] = useState<CompetitorReport | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Bulk state
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    currentChannel?: string;
  } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const abortBatchRef = useRef(false);

  function downloadSampleTemplate() {
    const csvContent = "\uFEFFChannel Name,Channel URL,Notes\r\nVeritasium,https://www.youtube.com/@veritasium,Science & Physics\r\nMKBHD,https://www.youtube.com/@mkbhd,Consumer Tech\r\nCleo Abram,https://www.youtube.com/@cleoabram,Optimistic Tech\r\nKurzgesagt,https://www.youtube.com/@Kurzgesagt,Animation & Science\r\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "competitor_channels_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleFileUpload(file: File) {
    if (!file) return;
    setFileUploadError(null);
    setFileLoading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let textContent = "";

      if (ext === "csv" || ext === "xlsx" || ext === "xls") {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const detectedFromSheets: string[] = [];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;
          const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (!jsonRows || jsonRows.length === 0) continue;

          // Check if header row exists with a URL/channel column
          const headerRow = jsonRows[0];
          let targetColIdx = -1;
          if (Array.isArray(headerRow)) {
            for (let c = 0; c < headerRow.length; c++) {
              const h = String(headerRow[c] ?? "").trim().toLowerCase();
              if (
                h.includes("url") ||
                h.includes("link") ||
                h.includes("channel") ||
                h.includes("youtube") ||
                h.includes("handle")
              ) {
                targetColIdx = c;
                break;
              }
            }
          }

          if (targetColIdx !== -1) {
            for (let r = 1; r < jsonRows.length; r++) {
              const cell = jsonRows[r]?.[targetColIdx];
              if (cell != null) {
                const s = String(cell).trim();
                if (s) detectedFromSheets.push(s);
              }
            }
          } else {
            // Fallback: search all cells in row for YouTube links or handles
            for (const row of jsonRows) {
              if (Array.isArray(row)) {
                for (const cell of row) {
                  if (cell != null) {
                    const s = String(cell).trim();
                    if (s.includes("youtube.com") || s.startsWith("@") || /^UC[\w-]{20,}$/.test(s)) {
                      detectedFromSheets.push(s);
                    }
                  }
                }
              }
            }
          }
        }
        textContent = detectedFromSheets.length > 0 ? detectedFromSheets.join("\n") : await file.text();
      } else {
        textContent = await file.text();
      }

      const detectedUrls = parseBatchChannelUrls(textContent);
      if (detectedUrls.length === 0) {
        setFileUploadError(
          `No YouTube channel URLs or handles found in "${file.name}". Please ensure file contains channel links (e.g. youtube.com/@channel) or @handles.`,
        );
      } else {
        setUploadedFileName(`${file.name} (${detectedUrls.length} channels)`);
        setBulkText((prev) => {
          const existing = prev.trim();
          const newText = detectedUrls.join("\n");
          return existing ? `${existing}\n${newText}` : newText;
        });
      }
    } catch (err: any) {
      console.error("File upload error:", err);
      setFileUploadError(`Failed reading file: ${err?.message || "Invalid file format"}`);
    } finally {
      setFileLoading(false);
    }
  }

  const runAnalysis = useServerFn(analyzeCompetitorChannel);

  const singleMutation = useMutation({
    mutationFn: (url: string) =>
      runAnalysis({ data: { url, apiKey: apiKey || undefined, aiApiKey: aiApiKey || undefined } }),
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
          data: { url: currentTarget, apiKey: apiKey || undefined, aiApiKey: aiApiKey || undefined },
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
        "Outlier Video": sanitizeCell(r.outlierVideoTitle || "N/A"),
        "Outlier Video URL": sanitizeCell(r.outlierVideoUrl || ""),
        "Outlier Video Views": sanitizeCell(r.outlierVideoViews || "N/A"),
        "Outlier Multiplier": sanitizeCell(r.outlierMultiplier || "N/A"),
        "Outlier Video Views/Subscribers Ratio": sanitizeCell(r.outlierViewsSubRatio || "N/A"),
        "Outlier Video Length": sanitizeCell(r.outlierVideoLength || "N/A"),
        "Outlier Topic": sanitizeCell(r.outlierTopic || "N/A"),
        "Outlier Title Formula": sanitizeCell(r.outlierTitleFormula || "N/A"),
        "Outlier Thumbnail Concept": sanitizeCell(r.outlierThumbnailConcept || "N/A"),
        "Why It Might Have Worked": sanitizeCell(r.whyItWorked || "N/A"),
      }));

      const worksheet = utils.json_to_sheet(data);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 26 },
        { wch: 34 },
        { wch: 16 },
        { wch: 14 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 40 },
        { wch: 35 },
        { wch: 45 },
        { wch: 35 },
        { wch: 20 },
        { wch: 18 },
        { wch: 30 },
        { wch: 20 },
        { wch: 28 },
        { wch: 32 },
        { wch: 40 },
        { wch: 55 },
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
      "Outlier Video",
      "Outlier Video URL",
      "Outlier Video Views",
      "Outlier Multiplier",
      "Outlier Video Views/Subscribers Ratio",
      "Outlier Video Length",
      "Outlier Topic",
      "Outlier Title Formula",
      "Outlier Thumbnail Concept",
      "Why It Might Have Worked",
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
      escapeCsv(r.outlierVideoTitle || "N/A"),
      escapeCsv(r.outlierVideoUrl || ""),
      escapeCsv(r.outlierVideoViews || "N/A"),
      escapeCsv(r.outlierMultiplier || "N/A"),
      escapeCsv(r.outlierViewsSubRatio || "N/A"),
      escapeCsv(r.outlierVideoLength || "N/A"),
      escapeCsv(r.outlierTopic || "N/A"),
      escapeCsv(r.outlierTitleFormula || "N/A"),
      escapeCsv(r.outlierThumbnailConcept || "N/A"),
      escapeCsv(r.whyItWorked || "N/A"),
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

              {/* File Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                onClick={(e) => {
                  // Only trigger file picker if not clicking an internal button
                  if ((e.target as HTMLElement).closest("button")) return;
                  fileInputRef.current?.click();
                }}
                className={`mb-4 rounded-xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
                  isDraggingFile
                    ? "border-primary bg-primary/10 shadow-inner"
                    : "border-border/80 bg-background/50 hover:border-primary/50 hover:bg-background/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                    e.target.value = "";
                  }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-left">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                      {fileLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>Upload Channels Spreadsheet or Text File</span>
                        <span className="text-[10px] font-normal text-muted-foreground font-mono">(.xlsx, .csv, .txt)</span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Drag and drop your spreadsheet or click anywhere to parse YouTube channel links or @handles automatically.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                    {uploadedFileName && (
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="secondary"
                          className="text-[11px] py-1 px-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 flex items-center gap-1 font-medium"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{uploadedFileName}</span>
                        </Badge>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFileName(null);
                          }}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                          title="Dismiss file tag"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSampleTemplate();
                      }}
                      className="h-8 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground border border-border/70"
                      title="Download sample CSV template"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Template
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={fileLoading || isBatchRunning}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="h-8 text-xs gap-1.5 cursor-pointer shadow-sm hover:border-primary/50"
                    >
                      <Upload className="h-3.5 w-3.5 text-primary" />
                      Browse File
                    </Button>
                  </div>
                </div>

                {fileUploadError && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2 text-left">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fileUploadError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Channel URLs (pasted or uploaded):
                </span>
                <span className="text-[11px] text-muted-foreground">
                  One per line or comma-separated
                </span>
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
              <table className="w-full min-w-[1700px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[200px]">
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                      Top Video Views
                    </th>
                    {/* Outlier Video Columns */}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-amber-500/90 min-w-[220px]">
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-amber-500" />
                        <span>Outlier Video</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-amber-500/90 min-w-[140px]">
                      Outlier Video Views
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-emerald-500/90 min-w-[160px]">
                      Outlier Views/Subs Ratio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[120px]">
                      Outlier Video Length
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[160px]">
                      Outlier Topic
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                      Outlier Title Formula
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[220px]">
                      Outlier Thumbnail Concept
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[260px]">
                      Why it might have worked
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
                            <span className="text-[11px] text-muted-foreground block truncate max-w-[200px]">
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
                              className="text-[11px] text-muted-foreground hover:text-foreground line-clamp-1 mt-0.5 max-w-[200px]"
                              title={r.topVideoTitle}
                            >
                              {r.topVideoTitle}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Outlier Video */}
                      <td className="px-4 py-4 align-top max-w-[230px]">
                        {r.outlierVideoTitle && r.outlierVideoTitle !== "N/A" ? (
                          <div>
                            <a
                              href={r.outlierVideoUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={r.outlierVideoUrl ? openExternal(r.outlierVideoUrl) : undefined}
                              className="font-medium text-xs text-foreground hover:text-primary transition-colors line-clamp-2 flex items-start gap-1.5"
                              title={r.outlierVideoTitle}
                            >
                              <Play className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              <span>{r.outlierVideoTitle}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setSelectedDetailReport(r)}
                              className="text-[10px] text-amber-500 hover:underline mt-1 inline-flex items-center gap-0.5 cursor-pointer font-medium"
                            >
                              <Lightbulb className="h-2.5 w-2.5" /> Strategy Breakdown
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </td>

                      {/* Outlier Video Views */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-foreground font-mono">
                            {r.outlierVideoViews}
                          </span>
                          {r.outlierMultiplier && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-500 border-amber-500/25 font-mono w-fit"
                            >
                              {r.outlierMultiplier} baseline
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Outlier Views/Subscribers Ratio */}
                      <td className="px-4 py-4 align-top">
                        <Badge
                          variant="secondary"
                          className="font-semibold text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono"
                        >
                          {r.outlierViewsSubRatio}
                        </Badge>
                      </td>

                      {/* Outlier Video Length */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{r.outlierVideoLength}</span>
                        </div>
                      </td>

                      {/* Outlier Topic */}
                      <td className="px-4 py-4 align-top max-w-[170px]">
                        <span className="inline-block text-xs font-medium text-foreground bg-secondary/70 px-2 py-0.5 rounded border border-border/70 line-clamp-2">
                          {r.outlierTopic}
                        </span>
                      </td>

                      {/* Outlier Title Formula */}
                      <td className="px-4 py-4 align-top max-w-[180px]">
                        <span className="inline-block text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 line-clamp-2">
                          {r.outlierTitleFormula}
                        </span>
                      </td>

                      {/* Outlier Thumbnail Concept */}
                      <td className="px-4 py-4 align-top max-w-[210px]">
                        <p
                          className="text-xs text-muted-foreground line-clamp-2 cursor-pointer hover:text-foreground transition-colors"
                          title="Click to view full strategy"
                          onClick={() => setSelectedDetailReport(r)}
                        >
                          {r.outlierThumbnailConcept}
                        </p>
                      </td>

                      {/* Why it might have worked */}
                      <td className="px-4 py-4 align-top min-w-[240px] max-w-[320px]">
                        <p
                          className="text-xs text-muted-foreground leading-relaxed line-clamp-3 cursor-pointer hover:text-foreground transition-colors"
                          title="Click to view full strategy"
                          onClick={() => setSelectedDetailReport(r)}
                        >
                          {r.whyItWorked}
                        </p>
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
                        <Badge variant="secondary" className="text-xs font-bold px-2 py-0 bg-primary/15 text-primary border-0 font-mono">
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

                    {/* Recent Outlier Video Feature */}
                    <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3.5 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-amber-500" /> Recent Outlier
                        </span>
                        <div className="flex items-center gap-1.5">
                          {r.outlierMultiplier && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-500 border-amber-500/30 font-mono">
                              {r.outlierMultiplier}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 bg-emerald-500/15 text-emerald-500 border-0 font-mono">
                            {r.outlierViewsSubRatio}
                          </Badge>
                        </div>
                      </div>

                      {r.outlierVideoTitle && r.outlierVideoTitle !== "N/A" && (
                        <div>
                          <a
                            href={r.outlierVideoUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={r.outlierVideoUrl ? openExternal(r.outlierVideoUrl) : undefined}
                            className="text-xs text-foreground hover:text-amber-500 block font-semibold line-clamp-2 transition-colors"
                          >
                            {r.outlierVideoTitle}
                          </a>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
                            <span>{r.outlierVideoViews}</span>
                            <span>•</span>
                            <span>{r.outlierVideoLength}</span>
                          </div>
                        </div>
                      )}

                      {/* Topic & Formula Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-amber-500/15">
                        <span className="text-[10px] bg-background/80 text-foreground px-2 py-0.5 rounded border border-border/60">
                          {r.outlierTopic}
                        </span>
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                          {r.outlierTitleFormula}
                        </span>
                      </div>

                      {/* Why it worked snippet */}
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {r.whyItWorked}
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedDetailReport(r)}
                        className="text-[11px] text-amber-500 hover:underline inline-flex items-center gap-1 font-medium self-start cursor-pointer mt-0.5"
                      >
                        <Lightbulb className="h-3 w-3" />
                        Full Strategy Breakdown
                      </button>
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

        {/* Outlier Strategy Deep Dive Modal */}
        {selectedDetailReport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedDetailReport(null)}
          >
            <div
              className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Close Button */}
              <button
                type="button"
                onClick={() => setSelectedDetailReport(null)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 pr-8 pb-4 border-b border-border">
                {selectedDetailReport.avatarUrl ? (
                  <img
                    src={selectedDetailReport.avatarUrl}
                    alt={selectedDetailReport.channelName}
                    className="h-12 w-12 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {selectedDetailReport.channelName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span>{selectedDetailReport.channelName}</span>
                    <a
                      href={selectedDetailReport.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={openExternal(selectedDetailReport.channelUrl)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{selectedDetailReport.subscribers} subscribers</span>
                    <span>•</span>
                    <span>{selectedDetailReport.uploadFrequency}</span>
                    <span>•</span>
                    <span>{selectedDetailReport.videoCount} total videos</span>
                  </div>
                </div>
              </div>

              {/* Outlier Breakdown Content */}
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-amber-500" /> Standout Recent Outlier Video
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-500 border-amber-500/30 font-mono">
                        {selectedDetailReport.outlierMultiplier} vs Recent Baseline
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-500 border-0 font-mono">
                        {selectedDetailReport.outlierViewsSubRatio} Views/Subs
                      </Badge>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-foreground">
                    {selectedDetailReport.outlierVideoTitle}
                  </h4>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span className="text-foreground font-semibold">
                      {selectedDetailReport.outlierVideoViews}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {selectedDetailReport.outlierVideoLength}
                    </span>
                    {selectedDetailReport.outlierVideoUrl && (
                      <a
                        href={selectedDetailReport.outlierVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={openExternal(selectedDetailReport.outlierVideoUrl)}
                        className="ml-auto text-primary hover:underline flex items-center gap-1 font-sans font-medium"
                      >
                        <Play className="h-3 w-3" /> Watch on YouTube
                      </a>
                    )}
                  </div>
                </div>

                {/* Packaging Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/80 bg-background/60 p-3.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Outlier Topic
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {selectedDetailReport.outlierTopic}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-background/60 p-3.5">
                    <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider block mb-1">
                      Title Formula
                    </span>
                    <span className="text-sm font-semibold text-amber-500">
                      {selectedDetailReport.outlierTitleFormula}
                    </span>
                  </div>
                </div>

                {/* Thumbnail Concept */}
                <div className="rounded-xl border border-border/80 bg-background/60 p-4">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" /> Thumbnail Concept & Visual Strategy
                  </span>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {selectedDetailReport.outlierThumbnailConcept}
                  </p>
                </div>

                {/* Why It Worked */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Why It Might Have Worked
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">
                    {selectedDetailReport.whyItWorked}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
