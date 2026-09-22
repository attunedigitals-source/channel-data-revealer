import { useState, useMemo, useRef, FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Trash2,
  HelpCircle,
  Search,
  BookOpen,
  ArrowRight,
  Layers,
  Wand2,
  FileText,
  KeyRound,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MECHANISMS_CATALOG,
  TitleResultItem,
  generateTitlesServer,
} from "@/lib/title.functions";

const SAMPLE_TOPICS = [
  "Ancient Egypt",
  "Antarctica",
  "Roman Empire",
  "Space",
  "Ancient Medicine",
  "Ocean",
  "Lost Cities",
];

interface TitleGeneratorSectionProps {
  aiApiKey?: string;
  onOpenKeyModal?: () => void;
}

export function TitleGeneratorSection({
  aiApiKey,
  onOpenKeyModal,
}: TitleGeneratorSectionProps) {
  // Mode: "single" or "bulk"
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single topic state
  const [singleTopic, setSingleTopic] = useState("");

  // Bulk topics state
  const [bulkText, setBulkText] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Volume: angles per topic (default 1, max 5)
  const [anglesPerTopic, setAnglesPerTopic] = useState<number>(1);

  // Generation state & results
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<TitleResultItem[]>([]);
  const [lastMode, setLastMode] = useState<"ai" | "heuristic" | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Catalog Dialog
  const [catalogOpen, setCatalogOpen] = useState(false);

  const runGenerate = useServerFn(generateTitlesServer);

  // Parse bulk text into clean array of topics
  const parsedBulkTopics = useMemo(() => {
    return bulkText
      .split(/[\r\n,;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !t.startsWith("#"));
  }, [bulkText]);

  // Handle single submit
  async function handleSingleSubmit(e: FormEvent) {
    e.preventDefault();
    const topic = singleTopic.trim();
    if (!topic || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await runGenerate({
        data: {
          topics: [topic],
          anglesPerTopic,
          aiApiKey: aiApiKey || undefined,
        },
      });

      setResults((prev) => {
        // Prepend new results
        const combined = [...res.results, ...prev];
        return combined.map((item, idx) => ({ ...item, num: idx + 1 }));
      });
      setLastMode(res.mode as any);
      setSingleTopic("");
    } catch (err: any) {
      console.error("Title generation error:", err);
      alert(`Generation failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle bulk generate
  async function handleBulkGenerate() {
    if (parsedBulkTopics.length === 0 || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await runGenerate({
        data: {
          topics: parsedBulkTopics,
          anglesPerTopic,
          aiApiKey: aiApiKey || undefined,
        },
      });

      setResults((prev) => {
        const combined = [...res.results, ...prev];
        return combined.map((item, idx) => ({ ...item, num: idx + 1 }));
      });
      setLastMode(res.mode as any);
    } catch (err: any) {
      console.error("Bulk title generation error:", err);
      alert(`Generation failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle re-roll for single item
  async function handleReroll(item: TitleResultItem) {
    try {
      const res = await runGenerate({
        data: {
          topics: [item.topic],
          anglesPerTopic: 1,
          aiApiKey: aiApiKey || undefined,
        },
      });

      if (res.results.length > 0) {
        const fresh = res.results[0];
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? {
                  ...r,
                  angle: fresh.angle,
                  code: fresh.code,
                  pattern: fresh.pattern,
                  workingTitle: fresh.workingTitle,
                }
              : r,
          ),
        );
      }
    } catch (err) {
      console.error("Re-roll error:", err);
    }
  }

  // File upload handling (.xlsx, .csv, .txt)
  async function handleFileUpload(file: File) {
    setFileLoading(true);
    setFileError(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      let extractedTopics: string[] = [];

      if (extension === "xlsx" || extension === "xls" || extension === "csv") {
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length > 0) {
          // Detect header row or grab first column
          let topicColIndex = 0;
          const headerRow = rows[0] || [];
          for (let c = 0; c < headerRow.length; c++) {
            const h = String(headerRow[c] || "").toLowerCase();
            if (
              h.includes("topic") ||
              h.includes("title") ||
              h.includes("keyword") ||
              h.includes("niche")
            ) {
              topicColIndex = c;
              break;
            }
          }

          const startRow = typeof headerRow[topicColIndex] === "string" && isNaN(Number(headerRow[topicColIndex])) ? 1 : 0;
          for (let r = startRow; r < rows.length; r++) {
            const cell = rows[r]?.[topicColIndex];
            if (cell != null) {
              const val = String(cell).trim();
              if (val && val.length > 1 && !val.toLowerCase().startsWith("http")) {
                extractedTopics.push(val);
              }
            }
          }
        }
      } else {
        // Plain text file (.txt)
        const text = await file.text();
        extractedTopics = text
          .split(/[\r\n]+/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && !line.startsWith("#"));
      }

      if (extractedTopics.length === 0) {
        setFileError(`No topics detected in "${file.name}". Ensure it contains topic names.`);
      } else {
        setUploadedFileName(`${file.name} (${extractedTopics.length} topics)`);
        setBulkText((prev) => {
          const existing = prev.trim();
          const newText = extractedTopics.join("\n");
          return existing ? `${existing}\n${newText}` : newText;
        });
      }
    } catch (err: any) {
      console.error("File upload error:", err);
      setFileError(`Failed reading file: ${err?.message || "Invalid format"}`);
    } finally {
      setFileLoading(false);
    }
  }

  // Paste samples
  function handlePasteSamples() {
    setBulkText(SAMPLE_TOPICS.join("\n"));
  }

  // Download Sample Template CSV
  function handleDownloadTemplate() {
    const csvContent = "Topic\nAncient Egypt\nAntarctica\nRoman Empire\nSpace\nAncient Medicine\nOcean\nLost Cities\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_topics_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Copy single title
  function handleCopyTitle(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Copy all titles
  function handleCopyAllTitles() {
    if (results.length === 0) return;
    const allText = results.map((r) => r.workingTitle).join("\n");
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  // Export to Excel (.xlsx)
  async function handleExportExcel() {
    if (results.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const exportData = results.map((r) => ({
        "#": r.num,
        Topic: r.topic,
        Angle: r.angle,
        Code: r.code,
        "Primary Pattern": r.pattern,
        "Working Title": r.workingTitle,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 24 },
        { wch: 22 },
        { wch: 8 },
        { wch: 28 },
        { wch: 65 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Generated Titles");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `youtube_titles_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      alert("Failed to export Excel. Please use CSV export instead.");
    }
  }

  // Export to CSV (.csv)
  function handleExportCsv() {
    if (results.length === 0) return;
    const headers = ["#", "Topic", "Angle", "Code", "Primary Pattern", "Working Title"];
    const escapeCsv = (val: string | number) => {
      const s = String(val ?? "").trim();
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvRows = [headers.join(",")];
    for (const r of results) {
      csvRows.push(
        [
          r.num,
          escapeCsv(r.topic),
          escapeCsv(r.angle),
          escapeCsv(r.code),
          escapeCsv(r.pattern),
          escapeCsv(r.workingTitle),
        ].join(","),
      );
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `youtube_titles_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!searchFilter.trim()) return results;
    const q = searchFilter.toLowerCase();
    return results.filter(
      (r) =>
        r.topic.toLowerCase().includes(q) ||
        r.angle.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.pattern.toLowerCase().includes(q) ||
        r.workingTitle.toLowerCase().includes(q),
    );
  }, [results, searchFilter]);

  // Unique topics count
  const uniqueTopicsCount = useMemo(() => {
    return new Set(results.map((r) => r.topic.toLowerCase())).size;
  }, [results]);

  return (
    <section id="title-generator" className="border-t border-border bg-card/40 py-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                AI Title Packaging
              </span>
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-3">
              <span>Title Generator</span>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary font-normal">
                Topic → Angle → Mechanism → Title
              </Badge>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Generate high-CTR YouTube titles using 16 proven psychological patterns and custom angles.
              Every title is uniquely crafted with distinct grammatical hooks — without repetitive starter formulas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCatalogOpen(true)}
              className="h-9 gap-1.5 border-border/80 text-xs bg-background/60 hover:bg-accent cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>16 Mechanisms Catalog</span>
            </Button>

            {onOpenKeyModal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenKeyModal}
                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>AI Key: {aiApiKey ? "Active" : "Optional"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Input Box Card */}
        <div className="mt-8 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          {/* Mode Switcher & Volume Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            {/* Tabs: Single vs Bulk */}
            <div className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  mode === "single"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Single Topic
              </button>
              <button
                type="button"
                onClick={() => setMode("bulk")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  mode === "bulk"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Bulk Topics Upload
              </button>
            </div>

            {/* Angles Volume Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">Angles per Topic:</span>
              </span>
              <div className="inline-flex rounded-lg border border-border/80 bg-background/80 p-0.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAnglesPerTopic(num)}
                    className={`h-7 w-7 rounded text-xs font-semibold transition-all cursor-pointer ${
                      anglesPerTopic === num
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground hidden lg:inline">
                ({anglesPerTopic === 1 ? "1 Angle per topic" : `${anglesPerTopic} Angles per topic`})
              </span>
            </div>
          </div>

          {/* Mode 1: Single Topic */}
          {mode === "single" && (
            <form onSubmit={handleSingleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  value={singleTopic}
                  onChange={(e) => setSingleTopic(e.target.value)}
                  placeholder="Enter a topic (e.g. Ancient Egypt, Roman Empire, Space, Quantum Computing)..."
                  maxLength={150}
                  className="h-12 text-sm bg-background/60 pr-10"
                />
                {singleTopic && (
                  <button
                    type="button"
                    onClick={() => setSingleTopic("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={!singleTopic.trim() || isGenerating}
                className="h-12 px-6 gap-2 text-sm font-semibold cursor-pointer shrink-0"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                <span>Generate Titles</span>
              </Button>
            </form>
          )}

          {/* Mode 2: Bulk Topics Upload */}
          {mode === "bulk" && (
            <div className="mt-6 space-y-4">
              {/* Dropzone */}
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
                  if ((e.target as HTMLElement).closest("button")) return;
                  fileInputRef.current?.click();
                }}
                className={`rounded-xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
                  isDraggingFile
                    ? "border-primary bg-primary/10"
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
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>Upload Topics Spreadsheet or Text File</span>
                        <span className="text-[10px] font-normal text-muted-foreground font-mono">
                          (.xlsx, .csv, .txt)
                        </span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Drag and drop your file or click to browse. Automatically extracts topics.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadTemplate();
                      }}
                      className="h-8 gap-1 text-[11px] border-border/80 bg-background/80 hover:bg-accent cursor-pointer"
                    >
                      <Download className="h-3 w-3 text-muted-foreground" />
                      <span>Template</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="h-8 gap-1 text-[11px] border-border/80 bg-background/80 hover:bg-accent cursor-pointer"
                    >
                      <Upload className="h-3 w-3 text-primary" />
                      <span>Choose File</span>
                    </Button>
                  </div>
                </div>

                {uploadedFileName && (
                  <div className="mt-3 flex items-center justify-between rounded-md bg-primary/10 px-3 py-1.5 text-xs text-primary border border-primary/20">
                    <span className="truncate">Loaded: {uploadedFileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFileName(null);
                      }}
                      className="hover:text-primary/70 ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}

                {fileError && (
                  <div className="mt-3 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 text-left">
                    {fileError}
                  </div>
                )}
              </div>

              {/* Textarea for bulk paste */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Or Paste Topics Below (one per line):
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handlePasteSamples}
                    className="h-6 text-[11px] text-primary hover:text-primary/80 px-2 cursor-pointer"
                  >
                    Paste 7 Sample Topics
                  </Button>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Ancient Egypt&#10;Antarctica&#10;Roman Empire&#10;Space&#10;Ancient Medicine&#10;Ocean&#10;Lost Cities"
                  rows={4}
                  className="w-full rounded-xl border border-border/80 bg-background/60 p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Bulk Action Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{parsedBulkTopics.length}</span>{" "}
                  {parsedBulkTopics.length === 1 ? "topic" : "topics"} ready to generate (
                  {parsedBulkTopics.length * anglesPerTopic} total titles)
                </div>

                <Button
                  type="button"
                  onClick={handleBulkGenerate}
                  disabled={parsedBulkTopics.length === 0 || isGenerating}
                  className="h-11 px-6 gap-2 text-xs font-semibold cursor-pointer"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>Generate All ({parsedBulkTopics.length * anglesPerTopic})</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-10 space-y-4">
            {/* Results Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Total Generated:</span>
                  <Badge variant="secondary" className="font-semibold text-foreground text-xs">
                    {results.length}
                  </Badge>
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Unique Topics:</span>
                  <Badge variant="secondary" className="font-semibold text-foreground text-xs">
                    {uniqueTopicsCount}
                  </Badge>
                </div>
                {lastMode && (
                  <>
                    <span className="text-border">•</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        lastMode === "ai"
                          ? "border-primary/40 text-primary bg-primary/10"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {lastMode === "ai" ? "Gemini AI Engine" : "Smart Packaging Engine"}
                    </Badge>
                  </>
                )}
              </div>

              {/* Search filter and Export actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter titles..."
                    className="h-8 w-40 text-xs pl-8 bg-background/50"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAllTitles}
                  className="h-8 gap-1.5 text-xs border-border/80 bg-background/60 hover:bg-accent cursor-pointer"
                >
                  {copiedAll ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>{copiedAll ? "Copied All!" : "Copy All"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="h-8 gap-1.5 text-xs border-border/80 bg-background/60 hover:bg-accent cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Excel (.xlsx)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  className="h-8 gap-1.5 text-xs border-border/80 bg-background/60 hover:bg-accent cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                  <span>CSV</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Clear all generated titles?")) {
                      setResults([]);
                    }
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  title="Clear all results"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Results Table (Matching media_1790106736848.png layout) */}
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
              <table className="w-full min-w-[850px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-14">
                      #
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-44">
                      Topic
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-40">
                      Angle
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24">
                      Code
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Working Title
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">
                      <div className="flex items-center justify-end gap-1">
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Action</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredResults.map((row) => (
                    <tr
                      key={row.id}
                      className="group hover:bg-accent/30 transition-colors"
                    >
                      {/* # Number */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono align-top">
                        {row.num}
                      </td>

                      {/* Topic */}
                      <td className="px-4 py-3.5 text-xs font-medium text-foreground align-top">
                        {row.topic}
                      </td>

                      {/* Angle */}
                      <td className="px-4 py-3.5 text-xs text-foreground/90 align-top">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">
                          {row.angle}
                        </span>
                      </td>

                      {/* Short Code */}
                      <td className="px-4 py-3.5 text-xs align-top">
                        <span
                          title={row.pattern}
                          className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold font-mono text-primary cursor-help"
                        >
                          {row.code}
                        </span>
                      </td>

                      {/* Working Title */}
                      <td className="px-4 py-3.5 text-sm font-semibold text-foreground/95 leading-relaxed align-top">
                        {row.workingTitle}
                      </td>

                      {/* Copy & Re-roll Actions */}
                      <td className="px-4 py-3.5 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCopyTitle(row.id, row.workingTitle)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                            title="Copy Title to Clipboard"
                          >
                            {copiedId === row.id ? (
                              <Check className="h-4 w-4 text-emerald-500 animate-in zoom-in-50" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReroll(row)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-primary transition-colors cursor-pointer"
                            title="Re-generate this title"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Catalog Reference Dialog */}
        <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>16 Proven Primary Patterns & Short Codes</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                All 16 mechanisms stored in the app used to randomly assign angles and craft viral working titles.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/60">
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground w-12">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground w-48">
                      Primary Pattern
                    </th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground w-16">
                      Code
                    </th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">
                      Focus & Psychological Trigger
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {MECHANISMS_CATALOG.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-accent/20">
                      <td className="px-3 py-2.5 text-muted-foreground font-mono">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">{m.pattern}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-primary">{m.code}</td>
                      <td className="px-3 py-2.5 text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground/90">{m.focus}:</span>{" "}
                        {m.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
