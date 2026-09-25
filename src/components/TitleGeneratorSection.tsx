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
  Search,
  BookOpen,
  Layers,
  Wand2,
  FileText,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Lightbulb,
  Brain,
  Compass,
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
  "The Roman Empire",
  "Deep Space",
  "Ancient Medicine",
  "The Deep Ocean",
  "Lost Cities",
  "Ancient Babylon",
  "The Moon",
  "Ancient China",
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

  // View mode: "compact" vs "full" (Full Editorial Intelligence)
  const [tableDetailMode, setTableDetailMode] = useState<"full" | "compact">("full");

  // Generation state & results
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<TitleResultItem[]>([]);
  const [lastMode, setLastMode] = useState<"ai" | "heuristic" | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Reference Dialogs
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [standardsOpen, setStandardsOpen] = useState(false);

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

      if (res.results.length > 0 && res.results[0]) {
        const fresh = res.results[0];
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? {
                  ...r,
                  factPremise: fresh.factPremise,
                  angle: fresh.angle,
                  code: fresh.code,
                  pattern: fresh.pattern,
                  workingTitle: fresh.workingTitle,
                  curiosityQuestion: fresh.curiosityQuestion,
                  whyClick: fresh.whyClick,
                  factuallyGrounded: fresh.factuallyGrounded,
                  visualPotential: fresh.visualPotential,
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
        if (firstSheetName && workbook.Sheets[firstSheetName]) {
          const sheet = workbook.Sheets[firstSheetName]!;
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (rows.length > 0) {
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

            const headerVal = headerRow[topicColIndex];
            const startRow = typeof headerVal === "string" && isNaN(Number(headerVal)) ? 1 : 0;
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
        }
      } else {
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

  function handlePasteSamples() {
    setBulkText(SAMPLE_TOPICS.join("\n"));
  }

  function handleDownloadTemplate() {
    const csvContent = "Topic\n" + SAMPLE_TOPICS.join("\n") + "\n";
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

  function handleCopyTitle(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCopyAllTitles() {
    if (results.length === 0) return;
    const allText = results.map((r) => r.workingTitle).join("\n");
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  // Export to Excel (.xlsx) with all requested editorial columns
  async function handleExportExcel() {
    if (results.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const exportData = results.map((r) => ({
        "#": r.num,
        Topic: r.topic,
        "Fact / Premise": r.factPremise,
        Angle: r.angle,
        Code: r.code,
        "Primary Pattern": r.pattern,
        "Working Title": r.workingTitle,
        "Curiosity Question": r.curiosityQuestion,
        "Why Would Someone Click?": r.whyClick,
        "Factually Grounded?": r.factuallyGrounded,
        "Visual Potential": r.visualPotential,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 22 },
        { wch: 45 },
        { wch: 22 },
        { wch: 8 },
        { wch: 26 },
        { wch: 60 },
        { wch: 45 },
        { wch: 45 },
        { wch: 20 },
        { wch: 16 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Title Ideas & Analysis");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `title_editorial_workbook_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  // Export to CSV (.csv) with all 10 columns
  function handleExportCsv() {
    if (results.length === 0) return;
    const headers = [
      "#",
      "Topic",
      "Fact / Premise",
      "Angle",
      "Code",
      "Primary Pattern",
      "Working Title",
      "Curiosity Question",
      "Why Would Someone Click?",
      "Factually Grounded?",
      "Visual Potential",
    ];

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
          escapeCsv(r.factPremise),
          escapeCsv(r.angle),
          escapeCsv(r.code),
          escapeCsv(r.pattern),
          escapeCsv(r.workingTitle),
          escapeCsv(r.curiosityQuestion),
          escapeCsv(r.whyClick),
          escapeCsv(r.factuallyGrounded),
          escapeCsv(r.visualPotential),
        ].join(","),
      );
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `title_editorial_workbook_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const filteredResults = useMemo(() => {
    if (!searchFilter.trim()) return results;
    const q = searchFilter.toLowerCase();
    return results.filter(
      (r) =>
        r.topic.toLowerCase().includes(q) ||
        r.angle.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.pattern.toLowerCase().includes(q) ||
        r.workingTitle.toLowerCase().includes(q) ||
        r.factPremise.toLowerCase().includes(q) ||
        r.curiosityQuestion.toLowerCase().includes(q),
    );
  }, [results, searchFilter]);

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
                Fact-Grounded Title Strategy
              </span>
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-3">
              <span>Title Generator</span>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary font-normal">
                Fact/Premise → Angle → Mechanism → Title
              </Badge>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              We don't manufacture mystery — we discover mystery. Every title begins with a real, defensible fact,
              finds a compelling angle, applies a proven curiosity mechanism, and crafts a believable, high-CTR working title.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStandardsOpen(true)}
              className="h-9 gap-1.5 border-primary/30 text-xs bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Editorial Discipline Guide</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCatalogOpen(true)}
              className="h-9 gap-1.5 border-border/80 text-xs bg-background/60 hover:bg-accent cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>16 Mechanisms</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
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
            <div className="mt-6 space-y-3">
              <form onSubmit={handleSingleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    value={singleTopic}
                    onChange={(e) => setSingleTopic(e.target.value)}
                    placeholder="Enter a documentary topic (e.g. Ancient Egypt, Antarctica, Roman Empire, Ancient Medicine)..."
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

              {/* Quick Curated Topic Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <span className="text-[11px] font-medium text-foreground/80 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-primary" /> Curated Topics:
                </span>
                {SAMPLE_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSingleTopic(t)}
                    className="rounded-md border border-border/80 bg-background/50 px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-all cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode 2: Bulk Topics Upload */}
          {mode === "bulk" && (
            <div className="mt-6 space-y-4">
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
                    Paste 10 Broad Topics
                  </Button>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={SAMPLE_TOPICS.join("\n")}
                  rows={4}
                  className="w-full rounded-xl border border-border/80 bg-background/60 p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{parsedBulkTopics.length}</span>{" "}
                  {parsedBulkTopics.length === 1 ? "topic" : "topics"} ready to generate (
                  {parsedBulkTopics.length * anglesPerTopic} total ideas)
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
                  <span>Total Ideas:</span>
                  <Badge variant="secondary" className="font-semibold text-foreground text-xs">
                    {results.length}
                  </Badge>
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Subjects:</span>
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
                      {lastMode === "ai" ? "Gemini AI Strategy" : "Fact-Grounded Engine"}
                    </Badge>
                  </>
                )}
              </div>

              {/* View Switcher, Search filter and Export actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-md border border-border/80 bg-background/60 p-0.5 mr-1">
                  <button
                    type="button"
                    onClick={() => setTableDetailMode("full")}
                    className={`rounded px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      tableDetailMode === "full"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Editorial Intelligence
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableDetailMode("compact")}
                    className={`rounded px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      tableDetailMode === "compact"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Compact View
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter by keyword..."
                    className="h-8 w-36 text-xs pl-8 bg-background/50"
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
                  variant="default"
                  size="sm"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("load-to-psychology", { detail: results }));
                    document.getElementById("audience-psychology")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm"
                  title="Send all results to Audience Psychology and The Click analysis"
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>Audience Psychology ({results.length})</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("load-to-storymap", { detail: results }));
                    document.getElementById("story-map")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="h-8 gap-1.5 text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 cursor-pointer shadow-sm"
                  title="Send top generated title into a 7-Beat Story Map (Day 5)"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Story Map</span>
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

            {/* Results Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
              <table className="w-full min-w-[950px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
                      #
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-36">
                      Topic
                    </th>
                    {tableDetailMode === "full" && (
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-64">
                        Fact / Premise
                      </th>
                    )}
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-36">
                      Angle
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">
                      Code
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Working Title
                    </th>
                    {tableDetailMode === "full" && (
                      <>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-60">
                          Curiosity Question
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">
                          Grounded?
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24">
                          Visual
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredResults.map((row) => (
                    <tr key={row.id} className="group hover:bg-accent/30 transition-colors">
                      {/* # Number */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono align-top">
                        {row.num}
                      </td>

                      {/* Topic */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-foreground align-top">
                        {row.topic}
                      </td>

                      {/* Fact / Premise (in Full Mode) */}
                      {tableDetailMode === "full" && (
                        <td className="px-4 py-3.5 text-xs text-muted-foreground leading-relaxed align-top">
                          <p className="line-clamp-3" title={row.factPremise}>
                            {row.factPremise}
                          </p>
                        </td>
                      )}

                      {/* Angle */}
                      <td className="px-4 py-3.5 text-xs text-foreground/90 align-top">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/85">
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
                      <td className="px-4 py-3.5 text-sm font-semibold text-foreground leading-relaxed align-top">
                        <span>{row.workingTitle}</span>
                        {tableDetailMode === "full" && row.whyClick && (
                          <p className="mt-1 text-[11px] font-normal text-muted-foreground/80 line-clamp-2">
                            <span className="font-medium text-foreground/70">Click Trigger:</span> {row.whyClick}
                          </p>
                        )}
                      </td>

                      {/* Curiosity Question (in Full Mode) */}
                      {tableDetailMode === "full" && (
                        <td className="px-4 py-3.5 text-xs text-muted-foreground/90 leading-relaxed align-top">
                          <p className="line-clamp-3 italic font-serif">
                            "{row.curiosityQuestion}"
                          </p>
                        </td>
                      )}

                      {/* Factually Grounded? */}
                      {tableDetailMode === "full" && (
                        <td className="px-4 py-3.5 text-xs align-top">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                              row.factuallyGrounded === "YES"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : row.factuallyGrounded === "NEEDS RESEARCH"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}
                          >
                            {row.factuallyGrounded === "YES" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            <span>{row.factuallyGrounded}</span>
                          </span>
                        </td>
                      )}

                      {/* Visual Potential */}
                      {tableDetailMode === "full" && (
                        <td className="px-4 py-3.5 text-xs align-top">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              row.visualPotential === "Exceptional"
                                ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {row.visualPotential}
                          </span>
                        </td>
                      )}

                      {/* Copy & Re-roll Actions */}
                      <td className="px-4 py-3.5 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent("load-to-psychology", { detail: [row] }));
                              document.getElementById("audience-psychology")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-primary transition-colors cursor-pointer"
                            title="Analyze in Audience Psychology & The Click"
                          >
                            <Brain className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent("load-to-storymap", { detail: [row] }));
                              document.getElementById("story-map")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="rounded p-1.5 text-indigo-400 hover:bg-indigo-500/15 hover:text-indigo-300 transition-colors cursor-pointer"
                            title="Map into 7-Beat Story Map (Day 5)"
                          >
                            <Compass className="h-3.5 w-3.5" />
                          </button>

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
                <span>16 Proven Primary Patterns & Standardized Codes</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                All 16 mechanisms stored in the app. Formula: Fact/Premise → Angle → Curiosity Mechanism → Title.
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

        {/* Editorial Standards & Packaging Guide Dialog */}
        <Dialog open={standardsOpen} onOpenChange={setStandardsOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Documentary Packaging Standard & Editorial Discipline Guide</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Master principles calibrated from the Day 3 workbook review: "Find a real mystery and package it clearly."
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-5 text-xs text-foreground/90">
              {/* Core Formula Box */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>The 4-Step Packaging Pipeline</span>
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-mono font-medium text-foreground">
                  <span className="rounded bg-background px-2 py-1 border border-border">1. Fact / Premise</span>
                  <span className="text-primary font-bold">→</span>
                  <span className="rounded bg-background px-2 py-1 border border-border">2. Angle</span>
                  <span className="text-primary font-bold">→</span>
                  <span className="rounded bg-background px-2 py-1 border border-border">3. Curiosity Mechanism</span>
                  <span className="text-primary font-bold">→</span>
                  <span className="rounded bg-primary text-primary-foreground px-2 py-1">4. Working Title</span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                  Never start from: <em>"I need a mysterious title."</em> Always start from: <em>"Here is something genuinely interesting. What is the most compelling way to package it?"</em>
                </p>
              </div>

              {/* 5 Golden Rules */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-foreground">5 Golden Editorial Rules</h4>

                <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[11px] font-bold">1</span>
                    <span>Epistemic Discipline & Defensible Premises</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-7">
                    Avoid overconfident claims. Distinguish between <strong>empirical discoveries</strong> (e.g. ScanPyramids muon void), <strong>theoretical models</strong> (e.g. rogue planet subsurface oceans), <strong>ancient written lore</strong> (e.g. Cyrus diverting Euphrates), and <strong>unsettled debates</strong> (e.g. Mohenjo-daro decline). Eliminate evaluative superlatives (<em>"worst catastrophe in history"</em>, <em>"genius"</em>) and absolute claims (<em>"completely frozen"</em>, <em>"stronger than modern"</em>).
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[11px] font-bold">2</span>
                    <span>Zero Generic Boilerplate / Narrow Broad Topics</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-7">
                    Never write generic template sentences like <em>"Researchers continue to investigate the fundamental questions surrounding [Topic]..."</em> or <em>"What is the biggest mystery about [Topic]?"</em>. Always narrow down to: <strong>Specific Mystery + Specific Evidence + Specific Question</strong> (e.g. Moon → Permanently Shadowed Craters / Water Ice; Ancient Medicine → Edwin Smith Papyrus trauma neurosurgery).
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[11px] font-bold">3</span>
                    <span>Preserve the Genuine Mystery</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-7">
                    If an anomaly's purpose or cause is unknown (e.g. Great Pyramid void, Emperor Qin's unopened tomb), explore the competing hypotheses without pretending the answer is settled or claiming researchers <em>"refused to open"</em>. Focus on preservation, safety, and technological challenges: <em>"Why Has Emperor Qin's Central Tomb Remained Unopened?"</em>.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[11px] font-bold">4</span>
                    <span>Accurate Technological & Scientific Framing</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-7">
                    Never oversimplify technological breakthroughs (e.g. don't write <em>"AI read the scrolls"</em> — describe the actual technology: high-resolution X-ray/CT tomography + 3D computational unwrapping + machine learning). Remember that ancient ice cores don't <em>"predict the future"</em>; they provide historical atmospheric records to calibrate climate models.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[11px] font-bold">5</span>
                    <span>Visual Potential for Generative Filmmaking (Google Flow Workflow)</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-7">
                    Package subjects with vivid visual possibilities: subglacial environments, geological cross-sections, drilling rigs, deep-ocean trenches, LiDAR flythroughs, microscopic cellular life, and micro-CT mummy scans. This visual potential is critical for generative video production.
                  </p>
                </div>
              </div>

              {/* Proven Packaging Formulas Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground">Top Proven Packaging Formulas</h4>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border">
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-32">Formula</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Exemplar Working Title</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-40">Psychological Trigger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold text-primary">Q + VE</td>
                        <td className="px-3 py-2 font-medium text-foreground">"What Would Happen If You Spent 24 Hours Near a Black Hole?"</td>
                        <td className="px-3 py-2 text-muted-foreground">Visceral human simulation of extreme physics</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold text-primary">M + UC + Visual</td>
                        <td className="px-3 py-2 font-medium text-foreground">"The Toxic 'Underwater Lakes' Hidden on the Ocean Floor"</td>
                        <td className="px-3 py-2 text-muted-foreground">Impossible-sounding geological reality</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold text-primary">D + IF</td>
                        <td className="px-3 py-2 font-medium text-foreground">"The Lost Civilization Archaeologists Finally Rediscovered Beneath the Amazon"</td>
                        <td className="px-3 py-2 text-muted-foreground">Hard laser evidence overturning conventional history</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold text-primary">D (Cutting-Edge)</td>
                        <td className="px-3 py-2 font-medium text-foreground">"What Did Cosmic-Ray Scans Actually Find Inside the Great Pyramid?"</td>
                        <td className="px-3 py-2 text-muted-foreground">Modern particle physics revealing ancient secrets</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold text-primary">HM</td>
                        <td className="px-3 py-2 font-medium text-foreground">"How Did Ancient Chinese Craftsmen Create Thousands of Terracotta Soldiers?"</td>
                        <td className="px-3 py-2 text-muted-foreground">Fascination with ancient precision engineering</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold text-primary">Defensible Q</td>
                        <td className="px-3 py-2 font-medium text-foreground">"How Did Ancient Egyptians Achieve Such Precise Stonework?"</td>
                        <td className="px-3 py-2 text-muted-foreground">Direct physical puzzle without sensationalism</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
