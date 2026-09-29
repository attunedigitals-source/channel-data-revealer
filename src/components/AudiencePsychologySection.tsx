import { useState, useMemo, useRef, useEffect, FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Brain,
  Target,
  Eye,
  HelpCircle,
  Sparkles,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Trash2,
  Search,
  BookOpen,
  FileText,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Film,
  Zap,
  BarChart3,
  Layers,
  ArrowRight,
  Flame,
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
  PsychologyInputItem,
  PsychologyAnalysisResult,
  ClickMotivationType,
  analyzePsychologyServer,
  formatRatingsText,
} from "@/lib/psychology.functions";

interface AudiencePsychologySectionProps {
  aiApiKey?: string;
  onOpenKeyModal?: () => void;
}

const CLICK_MOTIVATION_CONFIG: Record<
  ClickMotivationType,
  { label: string; bg: string; text: string; border: string; desc: string; icon: string }
> = {
  KNOW: {
    label: "KNOW",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    desc: "Viewer wants information or technique (How was it done?)",
    icon: "📘",
  },
  SEE: {
    label: "SEE",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    desc: "Viewer wants visual spectacle (Show me the hidden world!)",
    icon: "👁️",
  },
  UNDERSTAND: {
    label: "UNDERSTAND",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    desc: "Viewer knows the concept but wants the mechanism/paradox explained",
    icon: "💡",
  },
  EXPERIENCE: {
    label: "EXPERIENCE",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    desc: "Viewer wants to mentally simulate or feel the situation firsthand",
    icon: "🚀",
  },
};

export function AudiencePsychologySection({
  aiApiKey,
  onOpenKeyModal,
}: AudiencePsychologySectionProps) {
  // Input mode: "input" (direct/generator) | "upload" (file) | "exemplars"
  const [inputMode, setInputMode] = useState<"input" | "upload">("input");

  // Single idea input state
  const [singleTitle, setSingleTitle] = useState("");
  const [singlePremise, setSinglePremise] = useState("");
  const [singleAngle, setSingleAngle] = useState("");
  const [singleCode, setSingleCode] = useState("Q");
  const [singlePattern, setSinglePattern] = useState("Question");

  // Upload state
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadedItems, setUploadedItems] = useState<PsychologyInputItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis state & results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<PsychologyAnalysisResult[]>([]);
  const [lastMode, setLastMode] = useState<"ai" | "unrated" | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [filterMotivation, setFilterMotivation] = useState<ClickMotivationType | "ALL">("ALL");
  const [viewDetailMode, setViewDetailMode] = useState<"full" | "compact">("full");

  // Selected item for 8-Question Click Test modal
  const [testModalItem, setTestModalItem] = useState<PsychologyAnalysisResult | null>(null);

  // Dialogs
  const [guideOpen, setGuideOpen] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const runAnalyze = useServerFn(analyzePsychologyServer);

  // Auto-listen for items dispatched from Title Generator section
  useEffect(() => {
    function handleIncomingTitles(e: Event) {
      const customEvent = e as CustomEvent<any[]>;
      const items = customEvent.detail;
      if (Array.isArray(items) && items.length > 0) {
        const mapped: PsychologyInputItem[] = items.map((r, idx) => ({
          id: r.id || `gen-${idx + 1}`,
          num: r.num || idx + 1,
          factPremise: r.factPremise || "",
          angle: r.angle || "",
          code: r.code || "Q",
          pattern: r.pattern || "Curiosity Pattern",
          workingTitle: r.workingTitle || "",
          topic: r.topic || "",
        }));

        setUploadedItems(mapped);
        setUploadedFileName(`Imported from Title Generator (${mapped.length} ideas)`);
        setInputMode("upload");

        // Automatically run analysis
        triggerBatchAnalysis(mapped);
      }
    }

    window.addEventListener("load-to-psychology", handleIncomingTitles);
    return () => {
      window.removeEventListener("load-to-psychology", handleIncomingTitles);
    };
  }, []);

  // Trigger batch analysis
  async function triggerBatchAnalysis(items: PsychologyInputItem[]) {
    if (items.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const res = await runAnalyze({
        data: {
          items,
          aiApiKey: aiApiKey || undefined,
        },
      });

      setResults((prev) => {
        const combined = [...res.results, ...prev];
        return combined.map((item, idx) => ({ ...item, num: idx + 1 }));
      });
      setLastMode(res.mode);
    } catch (err: any) {
      console.error("Audience Psychology analysis error:", err);
      alert(`Analysis failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Handle single submit
  async function handleSingleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!singleTitle.trim() || !singlePremise.trim() || isAnalyzing) return;

    const newItem: PsychologyInputItem = {
      id: `single-${Date.now()}`,
      num: results.length + 1,
      workingTitle: singleTitle.trim(),
      factPremise: singlePremise.trim(),
      angle: singleAngle.trim() || "Thematic Angle",
      code: singleCode.trim() || "Q",
      pattern: singlePattern.trim() || "Curiosity Pattern",
    };

    await triggerBatchAnalysis([newItem]);
    setSingleTitle("");
    setSinglePremise("");
    setSingleAngle("");
  }

  // File upload handling (.xlsx, .csv, .txt)
  async function handleFileUpload(file: File) {
    setFileLoading(true);
    setFileError(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      let extracted: PsychologyInputItem[] = [];

      if (extension === "xlsx" || extension === "xls" || extension === "csv") {
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (firstSheetName && workbook.Sheets[firstSheetName]) {
          const sheet = workbook.Sheets[firstSheetName]!;
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (rows.length > 1) {
            const headerRow = (rows[0] || []).map((h: any) => String(h || "").toLowerCase().trim());
            let titleIdx = headerRow.findIndex((h: string) => h.includes("title") || h.includes("working"));
            let factIdx = headerRow.findIndex((h: string) => h.includes("fact") || h.includes("premise"));
            let angleIdx = headerRow.findIndex((h: string) => h.includes("angle"));
            let codeIdx = headerRow.findIndex((h: string) => h === "code" || h.includes("code"));
            let patternIdx = headerRow.findIndex((h: string) => h.includes("pattern"));
            let numIdx = headerRow.findIndex((h: string) => h === "#" || h.includes("num") || h.includes("idea"));

            // Default fallback column indexes if header names vary
            if (titleIdx === -1 && rows[0].length >= 6) titleIdx = 5;
            if (factIdx === -1 && rows[0].length >= 2) factIdx = 1;
            if (angleIdx === -1 && rows[0].length >= 3) angleIdx = 2;
            if (codeIdx === -1 && rows[0].length >= 4) codeIdx = 3;
            if (patternIdx === -1 && rows[0].length >= 5) patternIdx = 4;
            if (numIdx === -1) numIdx = 0;

            for (let r = 1; r < rows.length; r++) {
              const row = rows[r];
              if (!row || row.length === 0) continue;
              const titleVal = String(row[titleIdx] ?? "").trim();
              const factVal = String(row[factIdx] ?? "").trim();
              const angleVal = String(row[angleIdx] ?? "").trim();
              const codeVal = String(row[codeIdx] ?? "Q").trim();
              const patternVal = String(row[patternIdx] ?? "Curiosity Pattern").trim();
              const numVal = Number(row[numIdx]) || r;

              if (titleVal && titleVal.length > 2) {
                extracted.push({
                  id: `up-${r}`,
                  num: numVal,
                  workingTitle: titleVal,
                  factPremise: factVal || "Defensible factual premise.",
                  angle: angleVal || "Specific Documentary Angle",
                  code: codeVal || "Q",
                  pattern: patternVal || "Curiosity Pattern",
                });
              }
            }
          }
        }
      } else {
        const text = await file.text();
        const lines = text
          .split(/[\r\n]+/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && !line.startsWith("#"));

        extracted = lines.map((titleLine, idx) => ({
          id: `txt-${idx + 1}`,
          num: idx + 1,
          workingTitle: titleLine,
          factPremise: "Historical or scientific factual inquiry.",
          angle: "Core Investigation",
          code: "Q",
          pattern: "Question",
        }));
      }

      if (extracted.length === 0) {
        setFileError(`No valid titles detected in "${file.name}". Please ensure it contains working titles.`);
      } else {
        setUploadedFileName(`${file.name} (${extracted.length} ideas)`);
        setUploadedItems(extracted);
      }
    } catch (err: any) {
      console.error("File upload error:", err);
      setFileError(`Failed reading file: ${err?.message || "Invalid format"}`);
    } finally {
      setFileLoading(false);
    }
  }

  function handleDownloadTemplate() {
    const csvContent =
      "#," +
      "Fact / Premise," +
      "Angle," +
      "Code," +
      "Primary Pattern," +
      "Working Title," +
      "TARGET VIEWER," +
      "CLICK MOTIVATION," +
      "INFORMATION GAP," +
      "STAKES," +
      "VISUAL HOOK," +
      "TITLE PROMISE," +
      "DIAGNOSTIC RATINGS\n" +
      '1,"Commercial airliners are shaped so airflow over the curved wing surface creates a pressure difference that generates lift.","Flight Mechanics","IO","Impossible Object","How Do Airplanes Actually Stay in the Air?","","","","","","",""\n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "psychology_click_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Export to Excel (.xlsx) exactly matching "Pyschology and The Click.xlsx"
  async function handleExportExcel() {
    if (results.length === 0) return;
    try {
      const XLSX = await import("xlsx");
      const exportData = results.map((r) => ({
        "#": r.num,
        "Fact / Premise": r.factPremise,
        Angle: r.angle,
        Code: r.code,
        "Primary Pattern": r.pattern,
        "Working Title": r.workingTitle,
        "TARGET VIEWER": r.targetViewer,
        "CLICK MOTIVATION": r.clickMotivation,
        "INFORMATION GAP": r.informationGap,
        STAKES: r.stakes,
        "VISUAL HOOK": r.visualHook,
        "TITLE PROMISE": r.titlePromise,
        "DIAGNOSTIC RATINGS": r.diagnosticRatingsText,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 45 },
        { wch: 22 },
        { wch: 8 },
        { wch: 24 },
        { wch: 55 },
        { wch: 45 },
        { wch: 18 },
        { wch: 50 },
        { wch: 50 },
        { wch: 50 },
        { wch: 50 },
        { wch: 24 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audience Psychology & The Click");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `psychology_and_the_click_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  // Export to CSV (.csv) matching all 13 columns
  function handleExportCsv() {
    if (results.length === 0) return;
    const headers = [
      "#",
      "Fact / Premise",
      "Angle",
      "Code",
      "Primary Pattern",
      "Working Title",
      "TARGET VIEWER",
      "CLICK MOTIVATION",
      "INFORMATION GAP",
      "STAKES",
      "VISUAL HOOK",
      "TITLE PROMISE",
      "DIAGNOSTIC RATINGS",
    ];

    const escapeCsv = (val: string | number) => {
      const s = String(val ?? "").trim();
      if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvRows = [headers.join(",")];
    for (const r of results) {
      csvRows.push(
        [
          r.num,
          escapeCsv(r.factPremise),
          escapeCsv(r.angle),
          escapeCsv(r.code),
          escapeCsv(r.pattern),
          escapeCsv(r.workingTitle),
          escapeCsv(r.targetViewer),
          escapeCsv(r.clickMotivation),
          escapeCsv(r.informationGap),
          escapeCsv(r.stakes),
          escapeCsv(r.visualHook),
          escapeCsv(r.titlePromise),
          escapeCsv(r.diagnosticRatingsText),
        ].join(","),
      );
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `psychology_and_the_click_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleCopyItemTitle(id: string, text: string) {
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

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (filterMotivation !== "ALL" && r.clickMotivation !== filterMotivation) {
        return false;
      }
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        r.workingTitle.toLowerCase().includes(q) ||
        r.angle.toLowerCase().includes(q) ||
        r.targetViewer.toLowerCase().includes(q) ||
        r.informationGap.toLowerCase().includes(q) ||
        r.stakes.toLowerCase().includes(q) ||
        r.visualHook.toLowerCase().includes(q)
      );
    });
  }, [results, searchFilter, filterMotivation]);

  // Click motivation counts
  const motivationCounts = useMemo(() => {
    const counts = { KNOW: 0, SEE: 0, UNDERSTAND: 0, EXPERIENCE: 0 };
    for (const r of results) {
      if (counts[r.clickMotivation] !== undefined) {
        counts[r.clickMotivation]++;
      }
    }
    return counts;
  }, [results]);

  return (
    <section id="audience-psychology" className="border-t border-border bg-card/30 py-16">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Brain className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Packaging Architecture
              </span>
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-3">
              <span>Audience Psychology & The Click</span>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary font-normal">
                Click = Interest × Curiosity × Relevance × Trust
              </Badge>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Why would a stranger stop scrolling and click your video? Break down every idea into its target viewer,
              click motivation (Know / See / Understand / Experience), closable information gap, stakes, mental movie visual hook, and diagnostic radar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGuideOpen(true)}
              className="h-9 gap-1.5 border-primary/30 text-xs bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>Packaging Guide</span>
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

        {/* Input Card */}
        <div className="mt-8 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setInputMode("input")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  inputMode === "input"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Single Idea Entry
              </button>
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  inputMode === "upload"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upload Workbook (.xlsx / .csv)
              </button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Required Inputs:</span>
              <span className="font-mono text-foreground font-medium">
                #, Fact/Premise, Angle, Code, Pattern, Working Title
              </span>
            </div>
          </div>

          {/* Mode 1: Single Idea Form */}
          {inputMode === "input" && (
            <form onSubmit={handleSingleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Working Title *
                  </label>
                  <Input
                    value={singleTitle}
                    onChange={(e) => setSingleTitle(e.target.value)}
                    placeholder="e.g. How Do Airplanes Actually Stay in the Air?"
                    required
                    className="h-10 text-xs bg-background/60"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Angle / Lens *
                  </label>
                  <Input
                    value={singleAngle}
                    onChange={(e) => setSingleAngle(e.target.value)}
                    placeholder="e.g. Precision Stonework"
                    required
                    className="h-10 text-xs bg-background/60"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Fact / Premise * (The defensible factual foundation)
                </label>
                <textarea
                  value={singlePremise}
                  onChange={(e) => setSinglePremise(e.target.value)}
                  placeholder="e.g. Commercial airliner wings are shaped so airflow moving over the curved surface creates a pressure difference that generates lift; the exact flow behavior at extreme speeds remains an area of active aerodynamics research."
                  rows={2}
                  required
                  className="w-full rounded-xl border border-border/80 bg-background/60 p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Pattern Code:</span>
                  <input
                    value={singleCode}
                    onChange={(e) => setSingleCode(e.target.value.toUpperCase())}
                    placeholder="IO"
                    maxLength={3}
                    className="h-8 w-14 rounded border border-border/80 bg-background/60 text-center font-mono text-xs font-bold text-primary uppercase focus:outline-none"
                  />
                  <input
                    value={singlePattern}
                    onChange={(e) => setSinglePattern(e.target.value)}
                    placeholder="Impossible Object"
                    className="h-8 w-40 rounded border border-border/80 bg-background/60 px-2 text-xs text-foreground focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!singleTitle.trim() || !singlePremise.trim() || isAnalyzing}
                  className="h-10 px-5 gap-2 text-xs font-semibold cursor-pointer"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                  <span>Analyze Audience Psychology</span>
                </Button>
              </div>
            </form>
          )}

          {/* Mode 2: Upload Spreadsheet */}
          {inputMode === "upload" && (
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
                        <span>Upload Title Workbook or Spreadsheet</span>
                        <span className="text-[10px] font-normal text-muted-foreground font-mono">
                          (.xlsx, .csv)
                        </span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Extracts #, Fact/Premise, Angle, Code, Primary Pattern, and Working Title automatically.
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
                    <span className="truncate font-medium">Loaded: {uploadedFileName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFileName(null);
                        setUploadedItems([]);
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

              {uploadedItems.length > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    <strong className="text-foreground font-semibold">{uploadedItems.length}</strong> ideas ready for audience psychology analysis.
                  </span>
                  <Button
                    type="button"
                    onClick={() => triggerBatchAnalysis(uploadedItems)}
                    disabled={isAnalyzing}
                    className="h-10 px-6 gap-2 text-xs font-semibold cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    <span>Run Analysis ({uploadedItems.length})</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-10 space-y-4">
            {/* Motivation Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["KNOW", "SEE", "UNDERSTAND", "EXPERIENCE"] as ClickMotivationType[]).map((type) => {
                const conf = CLICK_MOTIVATION_CONFIG[type];
                const count = motivationCounts[type];
                const isActive = filterMotivation === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterMotivation((prev) => (prev === type ? "ALL" : type))}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/80 bg-card hover:border-primary/40 hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{conf.icon}</span>
                      <span className="font-mono text-base font-bold text-foreground">{count}</span>
                    </div>
                    <div className={`mt-1 text-xs font-semibold ${conf.text}`}>
                      {conf.label}
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                      {conf.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Analyzed Ideas:</span>
                  <Badge variant="secondary" className="font-semibold text-foreground text-xs">
                    {results.length}
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
                      {lastMode === "ai" ? "AI analysis" : "Not analyzed (no AI key)"}
                    </Badge>
                  </>
                )}

                {filterMotivation !== "ALL" && (
                  <>
                    <span className="text-border">•</span>
                    <button
                      type="button"
                      onClick={() => setFilterMotivation("ALL")}
                      className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Filtered by {filterMotivation} <span>(Clear)</span>
                    </button>
                  </>
                )}
              </div>

              {/* Actions & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-md border border-border/80 bg-background/60 p-0.5 mr-1">
                  <button
                    type="button"
                    onClick={() => setViewDetailMode("full")}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      viewDetailMode === "full"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Full Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewDetailMode("compact")}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      viewDetailMode === "compact"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Compact Table
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search psychology..."
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
                  <span>{copiedAll ? "Copied All!" : "Copy Titles"}</span>
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
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = filteredResults[0] || results[0];
                    if (target) {
                      window.dispatchEvent(new CustomEvent("load-to-storymap", { detail: [target] }));
                      const el = document.getElementById("story-map");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  disabled={filteredResults.length === 0}
                  className="h-8 gap-1.5 text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                  title="Send active idea to Story Map"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Story Map</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Clear all psychology analysis results?")) {
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

            {/* Results Table (matching Pyschology and The Click.xlsx) */}
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">
                      #
                    </th>
                    <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-64">
                      Working Title
                    </th>
                    <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">
                      Motivation
                    </th>
                    {viewDetailMode === "full" && (
                      <>
                        <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-48">
                          Target Viewer
                        </th>
                        <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-56">
                          Information Gap
                        </th>
                        <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-48">
                          Stakes
                        </th>
                        <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-52">
                          Visual Hook
                        </th>
                        <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-48">
                          Title Promise
                        </th>
                      </>
                    )}
                    <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-40">
                      Diagnostic Radar
                    </th>
                    <th className="px-3.5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredResults.map((row) => {
                    const motConf = CLICK_MOTIVATION_CONFIG[row.clickMotivation] || CLICK_MOTIVATION_CONFIG.UNDERSTAND;
                    return (
                      <tr key={row.id} className="group hover:bg-accent/30 transition-colors">
                        {/* # */}
                        <td className="px-3.5 py-3 text-xs text-muted-foreground font-mono align-top">
                          {row.num}
                        </td>

                        {/* Working Title & Angle */}
                        <td className="px-3.5 py-3 text-xs align-top">
                          <p className="font-semibold text-foreground text-sm leading-snug">
                            {row.workingTitle}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground/80">
                              {row.angle}
                            </span>
                            <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-primary">
                              {row.code}
                            </span>
                          </div>
                          {viewDetailMode === "compact" && (
                            <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2">
                              {row.factPremise}
                            </p>
                          )}
                        </td>

                        {/* Click Motivation */}
                        <td className="px-3.5 py-3 text-xs align-top">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold border ${motConf.bg} ${motConf.text} ${motConf.border}`}
                          >
                            <span>{motConf.icon}</span>
                            <span>{motConf.label}</span>
                          </span>
                        </td>

                        {/* Full View Details */}
                        {viewDetailMode === "full" && (
                          <>
                            {/* Target Viewer */}
                            <td className="px-3.5 py-3 text-xs text-foreground/90 leading-relaxed align-top">
                              <p className="line-clamp-3">{row.targetViewer}</p>
                            </td>

                            {/* Information Gap */}
                            <td className="px-3.5 py-3 text-xs text-muted-foreground leading-relaxed align-top">
                              <p className="line-clamp-3 italic">
                                "{row.informationGap}"
                              </p>
                            </td>

                            {/* Stakes */}
                            <td className="px-3.5 py-3 text-xs text-foreground/90 leading-relaxed align-top">
                              <p className="line-clamp-3">{row.stakes}</p>
                            </td>

                            {/* Visual Hook */}
                            <td className="px-3.5 py-3 text-xs text-purple-300/90 leading-relaxed align-top">
                              <div className="flex items-start gap-1">
                                <Film className="h-3 w-3 shrink-0 mt-0.5 text-purple-400" />
                                <p className="line-clamp-3">{row.visualHook}</p>
                              </div>
                            </td>

                            {/* Title Promise */}
                            <td className="px-3.5 py-3 text-xs text-muted-foreground leading-relaxed align-top">
                              <p className="line-clamp-3">{row.titlePromise}</p>
                            </td>
                          </>
                        )}

                        {/* Diagnostic Ratings (Visual Mini Radar) */}
                        <td className="px-3.5 py-3 text-xs align-top">
                          <div className="space-y-1 text-[10px]">
                            <div className="flex items-center justify-between gap-1 font-mono">
                              <span className="text-muted-foreground">Interest:</span>
                              <span className="font-bold text-emerald-400">{row.diagnosticRatings.interest}/5</span>
                            </div>
                            <div className="flex items-center justify-between gap-1 font-mono">
                              <span className="text-muted-foreground">Curiosity:</span>
                              <span className="font-bold text-emerald-400">{row.diagnosticRatings.curiosity}/5</span>
                            </div>
                            <div className="flex items-center justify-between gap-1 font-mono">
                              <span className="text-muted-foreground">Visual:</span>
                              <span className="font-bold text-purple-400">{row.diagnosticRatings.visualPotential}/5</span>
                            </div>
                            <div className="flex items-center justify-between gap-1 font-mono">
                              <span className="text-muted-foreground">Credibility:</span>
                              <span className="font-bold text-emerald-400">{row.diagnosticRatings.credibility}/5</span>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-3 text-right align-top">
                          <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setTestModalItem(row)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                              title="Take 8-Question Click Test"
                            >
                              <Target className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyItemTitle(row.id, row.workingTitle)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                              title="Copy Working Title"
                            >
                              {copiedId === row.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent("load-to-storymap", { detail: [row] }));
                                const el = document.getElementById("story-map");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="rounded p-1.5 text-indigo-400 hover:bg-indigo-500/15 hover:text-indigo-300 transition-colors cursor-pointer"
                              title="Map into 7-Beat Story Map"
                            >
                              <Compass className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8-Question Click Test Dialog */}
        <Dialog open={!!testModalItem} onOpenChange={(open) => !open && setTestModalItem(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {testModalItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span>The 8-Question Click Test</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Verifying packaging strength for: <strong>"{testModalItem.workingTitle}"</strong>
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-3.5 text-xs">
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">1</span>
                      WHO is this video for?
                    </span>
                    <p className="text-muted-foreground pl-5">{testModalItem.targetViewer}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">2</span>
                      WHAT do they want? (Click Motivation: {testModalItem.clickMotivation})
                    </span>
                    <p className="text-muted-foreground pl-5">
                      {CLICK_MOTIVATION_CONFIG[testModalItem.clickMotivation].desc}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">3</span>
                      WHAT is the information gap? (Known → Unknown)
                    </span>
                    <p className="text-muted-foreground pl-5">{testModalItem.informationGap}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">4</span>
                      WHY should they care? & WHAT are the stakes?
                    </span>
                    <p className="text-muted-foreground pl-5">{testModalItem.stakes}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">5</span>
                      CAN they visualize it? (The Mental Movie)
                    </span>
                    <p className="text-purple-300/90 pl-5">{testModalItem.visualHook}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">6</span>
                      WHAT does the title promise?
                    </span>
                    <p className="text-muted-foreground pl-5">{testModalItem.titlePromise}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">7</span>
                      CAN the video actually deliver that promise?
                    </span>
                    <p className="text-emerald-400 pl-5 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Yes. The factual foundation ({testModalItem.factPremise.slice(0, 80)}...) is defensible and investigate-able.</span>
                    </p>
                  </div>

                  {/* Diagnostic Radar Breakdown */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                    <h5 className="font-semibold text-xs text-primary mb-2 flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>8 Diagnostic Ratings (Weakness Radar):</span>
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                      <div className="rounded bg-background p-2 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Interest:</span>
                        <strong className="text-foreground">{testModalItem.diagnosticRatings.interest}/5</strong>
                      </div>
                      <div className="rounded bg-background p-2 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Curiosity:</span>
                        <strong className="text-foreground">{testModalItem.diagnosticRatings.curiosity}/5</strong>
                      </div>
                      <div className="rounded bg-background p-2 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Specificity:</span>
                        <strong className="text-foreground">{testModalItem.diagnosticRatings.specificity}/5</strong>
                      </div>
                      <div className="rounded bg-background p-2 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Stakes:</span>
                        <strong className="text-foreground">{testModalItem.diagnosticRatings.stakes}/5</strong>
                      </div>
                      <div className="rounded bg-background p-2 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Visual:</span>
                        <strong className="text-purple-400">{testModalItem.diagnosticRatings.visualPotential}/5</strong>
                      </div>
                      <div className="rounded bg-background p-2 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Credibility:</span>
                        <strong className="text-emerald-400">{testModalItem.diagnosticRatings.credibility}/5</strong>
                      </div>
                      <div className="rounded bg-background p-2 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Story:</span>
                        <strong className="text-foreground">{testModalItem.diagnosticRatings.storyPotential}/5</strong>
                      </div>
                      <div className="rounded bg-background p-2 border border-border">
                        <span className="text-muted-foreground block text-[10px]">Relevance:</span>
                        <strong className="text-foreground">{testModalItem.diagnosticRatings.audienceRelevance}/5</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Packaging Guide Dialog */}
        <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>Audience Psychology & The Click — Packaging Masterclass</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                How to package an idea so the viewer immediately understands why they should watch.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4 text-xs text-foreground/90">
              {/* Click Formula Box */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  <span>The Click Formula</span>
                </h4>
                <div className="mt-2 text-sm font-mono font-bold text-foreground">
                  CLICK = INTEREST × CURIOSITY × RELEVANCE × TRUST
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  These four elements multiply together. If even one element is zero or critically weak, the click becomes impossible.
                </p>
              </div>

              {/* 4 Reasons People Click */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground">Four Reasons People Click</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                    <span className="font-bold text-blue-400 block text-xs">1. KNOW</span>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      The viewer wants information or a technique. <em>"How Do Container Ships Stay Balanced at Sea?"</em> The viewer wants to know how.
                    </p>
                  </div>
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                    <span className="font-bold text-purple-400 block text-xs">2. SEE</span>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      The viewer wants to visually see something extraordinary. <em>"Inside the World's Deepest Underground City"</em> The visual experience is part of the attraction.
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <span className="font-bold text-emerald-400 block text-xs">3. UNDERSTAND</span>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      The viewer knows about the concept but doesn't understand it. <em>"Why Does Time Slow Down Near a Black Hole?"</em> They want the mechanism explained.
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <span className="font-bold text-amber-400 block text-xs">4. EXPERIENCE</span>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      The viewer wants to mentally experience or simulate a situation. <em>"What Would Happen If You Spent 24 Hours Near a Black Hole?"</em> (Ideal for generative AI film).
                    </p>
                  </div>
                </div>
              </div>

              {/* Curiosity vs Confusion */}
              <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                <h4 className="font-bold text-xs text-foreground">Curiosity ≠ Confusion (The Closable Gap)</h4>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  <strong>Bad curiosity:</strong> <em>"They discovered THIS and nobody can explain it!"</em> The viewer doesn't know who, what, or why they should care. That's confusion.
                </p>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  <strong>Good curiosity:</strong> <em>"What Did Cosmic-Ray Scans Actually Find Inside the Great Pyramid?"</em> The subject is clear, but there is a specific, closable gap: <strong>KNOWN → UNKNOWN → ANSWER</strong>.
                </p>
              </div>

              {/* Title + Thumbnail = One Promise */}
              <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                <h4 className="font-bold text-xs text-foreground">Title + Thumbnail = One Complementary Promise</h4>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  Never make the title and thumbnail text repeat the same words. The thumbnail shows the visual anomaly (e.g. Pyramid cross-section with highlighted empty space), and the title asks the question (e.g. <em>"What Did Cosmic-Ray Scans Actually Find Inside the Great Pyramid?"</em>).
                </p>
              </div>

              {/* Why We Don't Sum Diagnostic Numbers */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <h4 className="font-bold text-xs text-amber-500 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Rule: Do NOT Sum Diagnostic Ratings</span>
                </h4>
                <p className="text-muted-foreground leading-relaxed text-[11px] mt-1">
                  We are not building a mathematical ranking system. We're learning to identify weaknesses. If an idea has Interest: 5, Curiosity: 5, but Credibility: 2, it does not mean it's "22/40"—it means: <em>"Interesting idea, but the factual foundation needs work before making the video."</em>
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
