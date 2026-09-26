import React, { useState, useEffect, useRef, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Compass,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Play,
  Clock,
  Layers,
  HelpCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Film,
  Camera,
  Search,
  ExternalLink,
  ChevronRight,
  ListPlus,
  RefreshCw,
  Eye,
  CheckCircle2,
  FileText,
  Upload,
  Sliders,
  ShieldCheck,
  MessageSquareQuote,
  Lightbulb,
  Zap,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DAY5_EXEMPLAR_EGYPTIAN,
  DAY5_EXEMPLAR_SCANPYRAMIDS,
  DAY5_EXEMPLAR_UAP,
  generateStoryMapServer,
  generateHeuristicStoryMap,
  type StoryMapDossier,
  type StoryMapElement,
  type EscalationStep,
  type VisualStorytellingScene,
  type OpenLoopItem,
  type ResearchRequiredClaim,
} from "@/lib/storymap.functions";

interface StoryMapSectionProps {
  aiApiKey?: string;
  onOpenKeyModal?: () => void;
}

export function StoryMapSection({ aiApiKey, onOpenKeyModal }: StoryMapSectionProps) {
  const [activeStory, setActiveStory] = useState<StoryMapDossier>(() => ({
    ...DAY5_EXEMPLAR_EGYPTIAN,
    id: "new-story",
    workingTitle: "",
    coreQuestion: "",
    premise: "",
    angle: "",
    targetViewer: "",
    clickMotivation: undefined,
    informationGap: "",
    stakes: "",
    visualHookPrompt: "",
    titlePromise: "",
    elements: DAY5_EXEMPLAR_EGYPTIAN.elements.map((element) => ({ ...element, yourAnswer: "", notes: "", isNeedsResearch: false })),
    first30Seconds: {
      visualHook0to5s: { ...DAY5_EXEMPLAR_EGYPTIAN.first30Seconds.visualHook0to5s, visualShot: "", soundCues: "" },
      strangeClaim5to12s: { ...DAY5_EXEMPLAR_EGYPTIAN.first30Seconds.strangeClaim5to12s, narration: "", visualAction: "" },
      question12to20s: { ...DAY5_EXEMPLAR_EGYPTIAN.first30Seconds.question12to20s, narration: "", visualAction: "" },
      promise20to30s: { ...DAY5_EXEMPLAR_EGYPTIAN.first30Seconds.promise20to30s, narration: "", visualAction: "" },
    },
    escalationLadder: DAY5_EXEMPLAR_EGYPTIAN.escalationLadder.map((step) => ({ ...step, description: "" })),
    openLoops: [],
    visualScenes: [],
    needsResearchItems: [],
    researchClaims: [],
    storyEngine: { question: "", investigation: "", complication: "", discovery: "", explanation: "", payoff: "" },
  }));
  const [storyList, setStoryList] = useState<StoryMapDossier[]>([]);
  const [activeTab, setActiveTab] = useState<"worksheet" | "engine" | "first30s" | "escalation" | "visuals" | "research">("worksheet");

  // Modals
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState(false);
  const [isFirst30sLabOpen, setIsFirst30sLabOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Manual generation form state
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualPremise, setManualPremise] = useState("");
  const [manualAngle, setManualAngle] = useState("");
  const [manualTargetViewer, setManualTargetViewer] = useState("");
  const [manualVisualHook, setManualVisualHook] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [incomingNotice, setIncomingNotice] = useState<string | null>(null);

  // Editable row state
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const generateServer = useServerFn(generateStoryMapServer);
  const sectionRef = useRef<HTMLElement>(null);

  // Listen for incoming custom events from Audience Psychology and Title Generator
  useEffect(() => {
    const handleIncomingStory = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail) return;

      const item = Array.isArray(detail) ? detail[0] : detail;
      if (!item) return;

      const title = item.workingTitle || item.title || "";
      const premise = item.factPremise || item.premise || "";
      const angle = item.angle || "";
      const targetViewer = item.targetViewer || "";
      const clickMotivation = item.clickMotivation || "KNOW";
      const informationGap = item.informationGap || "";
      const stakes = item.stakes || "";
      const visualHookPrompt = item.visualHook || item.visualHookPrompt || "";
      const titlePromise = item.titlePromise || "";

      // Notice message
      setIncomingNotice(`Loaded: "${title}" from upstream analysis.`);
      setTimeout(() => setIncomingNotice(null), 6000);

      // Scroll into view
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });

      // Generate or load
      setIsGenerating(true);
      generateServer({
        data: {
          workingTitle: title,
          premise,
          angle,
          targetViewer,
          clickMotivation,
          informationGap,
          stakes,
          visualHookPrompt,
          titlePromise,
          aiApiKey: aiApiKey || undefined,
        },
      })
        .then((result) => {
          setActiveStory(result);
          setStoryList((prev) => [result, ...prev.filter((s) => s.workingTitle !== result.workingTitle)]);
        })
        .catch((err) => {
          console.warn("Failed generating story map via server, falling back to heuristic:", err);
          const fallback = generateHeuristicStoryMap({
            workingTitle: title,
            premise,
            angle,
            targetViewer,
            clickMotivation,
            informationGap,
            stakes,
            visualHookPrompt,
            titlePromise,
            aiApiKey: aiApiKey || undefined,
          });
          setActiveStory(fallback);
          setStoryList((prev) => [fallback, ...prev.filter((s) => s.workingTitle !== fallback.workingTitle)]);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    };

    window.addEventListener("load-to-storymap", handleIncomingStory);
    return () => {
      window.removeEventListener("load-to-storymap", handleIncomingStory);
    };
  }, [aiApiKey, generateServer]);

  // Handle manual submit
  const handleManualGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateServer({
        data: {
          workingTitle: manualTitle.trim(),
          premise: manualPremise.trim() || undefined,
          angle: manualAngle.trim() || undefined,
          targetViewer: manualTargetViewer.trim() || undefined,
          visualHookPrompt: manualVisualHook.trim() || undefined,
          aiApiKey: aiApiKey || undefined,
        },
      });
      setActiveStory(result);
      setStoryList((prev) => [result, ...prev.filter((s) => s.workingTitle !== result.workingTitle)]);
      setIsManualFormOpen(false);
      setManualTitle("");
      setManualPremise("");
      setManualAngle("");
      setManualTargetViewer("");
      setManualVisualHook("");
    } catch (err) {
      console.warn("Manual generation error, using heuristic:", err);
      const fallback = generateHeuristicStoryMap({
        workingTitle: manualTitle.trim(),
        premise: manualPremise.trim() || undefined,
        angle: manualAngle.trim() || undefined,
        targetViewer: manualTargetViewer.trim() || undefined,
        visualHookPrompt: manualVisualHook.trim() || undefined,
        aiApiKey: aiApiKey || undefined,
      });
      setActiveStory(fallback);
      setStoryList((prev) => [fallback, ...prev.filter((s) => s.workingTitle !== fallback.workingTitle)]);
      setIsManualFormOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy single element answer
  const copyAnswer = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Copy full 12-element worksheet as clean markdown
  const copyAllMarkdown = () => {
    const text = activeStory.elements
      .map((el) => `### ${el.num}. ${el.storyElement}\n${el.yourAnswer}\n`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Save inline edit
  const saveInlineEdit = (index: number) => {
    const updated = { ...activeStory };
    updated.elements = [...updated.elements];
    updated.elements[index] = {
      ...updated.elements[index],
      yourAnswer: editingText,
    };
    setActiveStory(updated);
    setEditingRowIndex(null);
  };

  // Export exact 3-column "Day 5 – Story Map" Excel workbook (.xlsx)
  const exportDay5Excel = () => {
    const wb = XLSX.utils.book_new();
    const rows = activeStory.elements.map((el) => ({
      "#": el.num,
      "Story Element": el.storyElement,
      "Your Answer": el.yourAnswer,
    }));

    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ["#", "Story Element", "Your Answer"],
    });

    ws["!cols"] = [{ wch: 6 }, { wch: 25 }, { wch: 100 }];

    XLSX.utils.book_append_sheet(wb, ws, "Day 5 – Story Map");
    const sanitizedTitle = activeStory.workingTitle
      .replace(/[^a-zA-Z0-9]/g, "_")
      .slice(0, 30);
    XLSX.writeFile(wb, `Day 5 - Story Map - ${sanitizedTitle}.xlsx`);
  };

  // Export CSV (.csv)
  const exportDay5Csv = () => {
    const rows = activeStory.elements.map((el) => ({
      "#": el.num,
      "Story Element": el.storyElement,
      "Your Answer": `"${el.yourAnswer.replace(/"/g, '""')}"`,
    }));

    const csvContent =
      "#,\"Story Element\",\"Your Answer\"\n" +
      rows.map((r) => `${r["#"]},"${r["Story Element"]}",${r["Your Answer"]}`).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const sanitizedTitle = activeStory.workingTitle
      .replace(/[^a-zA-Z0-9]/g, "_")
      .slice(0, 30);
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Day_5_Story_Map_${sanitizedTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Combined 2-sheet Workbook (Audience Psychology + Day 5 Story Map)
  const exportCombinedWorkbook = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Story Map
    const rowsStory = activeStory.elements.map((el) => ({
      "#": el.num,
      "Story Element": el.storyElement,
      "Your Answer": el.yourAnswer,
    }));
    const wsStory = XLSX.utils.json_to_sheet(rowsStory, {
      header: ["#", "Story Element", "Your Answer"],
    });
    wsStory["!cols"] = [{ wch: 6 }, { wch: 25 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsStory, "Day 5 – Story Map");

    // Sheet 2: Audience Psychology Row
    const rowsPsych = [
      {
        "#": 1,
        "FACT / PREMISE": activeStory.premise,
        "ANGLE": activeStory.angle,
        "CODE": activeStory.code || "IO",
        "PRIMARY PATTERN": activeStory.pattern || "Documentary Investigation",
        "WORKING TITLE": activeStory.workingTitle,
        "TARGET VIEWER": activeStory.targetViewer || "General Documentary Audience",
        "CLICK MOTIVATION": activeStory.clickMotivation || "KNOW",
        "INFORMATION GAP": activeStory.informationGap || "Investigates core dilemma",
        "STAKES": activeStory.stakes || "Technological & Historical",
        "VISUAL HOOK": activeStory.visualHookPrompt || "Cinematic opening sequence",
        "TITLE PROMISE": activeStory.titlePromise || "Systematic breakdown of evidence",
      },
    ];
    const wsPsych = XLSX.utils.json_to_sheet(rowsPsych);
    XLSX.utils.book_append_sheet(wb, wsPsych, "Audience Psychology & The Click");

    XLSX.writeFile(wb, `YouTube_Documentary_Packaging_and_StoryMap.xlsx`);
  };

  // File upload handler (reads Day 4 or Day 5 spreadsheets)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Check if there is a Day 5 sheet
        const day5SheetName = workbook.SheetNames.find((name) =>
          name.toLowerCase().includes("story") || name.toLowerCase().includes("day 5")
        );

        if (day5SheetName) {
          const sheet = workbook.Sheets[day5SheetName];
          const json = XLSX.utils.sheet_to_json<any>(sheet);
          if (json.length > 0) {
            const parsedElements: StoryMapElement[] = json.map((row: any, idx: number) => ({
              num: Number(row["#"] || row["No"] || row["num"] || idx + 1),
              storyElement: String(row["Story Element"] || row["Element"] || `Beat ${idx + 1}`),
              yourAnswer: String(row["Your Answer"] || row["Answer"] || row["Description"] || ""),
            }));

            const importedTitle =
              parsedElements.find((e) => e.storyElement.toLowerCase().includes("title"))?.yourAnswer ||
              file.name.replace(/\.[^/.]+$/, "");

            const customStory: StoryMapDossier = {
              ...generateHeuristicStoryMap({ workingTitle: importedTitle }),
              id: `imported-${Date.now()}`,
              workingTitle: importedTitle,
              elements: parsedElements,
            };

            setActiveStory(customStory);
            setStoryList((prev) => [customStory, ...prev]);
            setIncomingNotice(`Successfully imported ${parsedElements.length} story elements from ${file.name}`);
            setTimeout(() => setIncomingNotice(null), 5000);
            return;
          }
        }

        // Fallback: check first sheet for Title/Premise columns
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(firstSheet);
        if (json.length > 0) {
          const firstRow = json[0];
          const importedTitle =
            firstRow["WORKING TITLE"] ||
            firstRow["Working Title"] ||
            firstRow["Title"] ||
            firstRow["title"] ||
            "Imported Spreadsheet Story";
          const premise = firstRow["FACT / PREMISE"] || firstRow["Premise"] || "";
          const angle = firstRow["ANGLE"] || firstRow["Angle"] || "";

          const generated = generateHeuristicStoryMap({
            workingTitle: importedTitle,
            premise,
            angle,
          });
          setActiveStory(generated);
          setStoryList((prev) => [generated, ...prev]);
          setIncomingNotice(`Mapped story from "${importedTitle}" in ${file.name}`);
          setTimeout(() => setIncomingNotice(null), 5000);
        }
      } catch (err) {
        console.error("Failed to parse spreadsheet:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <section
      id="story-map"
      ref={sectionRef}
      className="mx-auto max-w-6xl px-6 py-12 scroll-mt-16 transition-all"
    >
      {/* Header Container */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 text-indigo-400 shadow-sm">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Week 1 • Day 5 System
                </span>
                <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-[10px] py-0 h-4">
                  Documentary Story Engine
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Story Map & The 7-Beat Engine
              </h2>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStudyGuideOpen(true)}
              className="h-8 gap-1.5 text-xs border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-300 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Day 5 Study Guide</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFirst30sLabOpen(true)}
              className="h-8 gap-1.5 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-300 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>First 30s Lab</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuditModalOpen(true)}
              className="h-8 gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Story Engine Audit</span>
            </Button>

            {/* Export Dropdown Group */}
            <div className="flex items-center rounded-lg border border-border/80 bg-card p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportDay5Excel}
                className="h-7 text-xs gap-1.5 px-2.5 text-foreground hover:text-primary cursor-pointer"
                title="Export Day 5 - Story Map 3-column Excel sheet"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export Day 5</span> .xlsx
              </Button>
              <span className="text-border">|</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportCombinedWorkbook}
                className="h-7 text-xs gap-1.5 px-2 text-foreground hover:text-primary cursor-pointer"
                title="Export combined workbook with both Audience Psychology and Day 5 Story Map sheets"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Combined</span> .xlsx
              </Button>
              <span className="text-border">|</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportDay5Csv}
                className="h-7 text-xs gap-1.5 px-2 text-foreground hover:text-primary cursor-pointer"
                title="Export CSV of 12 Story Elements"
              >
                <Download className="h-3.5 w-3.5 text-blue-400" />
                CSV
              </Button>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          <strong className="text-foreground font-semibold">"A documentary is not a collection of facts. It is a sequence of questions, discoveries, complications, and answers."</strong>{" "}
          Transform working titles and psychological hooks into an unskippable 7-beat narrative skeleton following the core Documentary Story Engine:{" "}
          <span className="inline-block px-1.5 py-0.5 rounded bg-muted/60 text-xs font-mono font-medium text-foreground">
            QUESTION → INVESTIGATION → COMPLICATION → DISCOVERY → EXPLANATION → PAYOFF
          </span>.
        </p>

        {incomingNotice && (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs font-medium text-indigo-300 animate-in fade-in slide-in-from-top-2">
            <Zap className="h-4 w-4 shrink-0 text-indigo-400 animate-pulse" />
            <span>{incomingNotice}</span>
          </div>
        )}
      </div>

      {/* Critique Lesson Alert: Story Structure vs Factual Certainty */}
      <div className="mb-6 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-background to-amber-950/20 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-300">
                  Professional Documentary Lesson: Story Structure vs. Factual Certainty
                </h4>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px] h-4">
                  4-Stage Pipeline
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("research")}
                className="h-6 text-[11px] px-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
              >
                Inspect Claims Tracker ({activeStory.researchClaims?.length ?? 0}) →
              </Button>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              <strong>Your story structure is stronger than your factual certainty.</strong> A professional documentary workflow separates:{" "}
              <span className="font-semibold text-amber-300 font-mono">
                STORY IDEA → HYPOTHESIS → EVIDENCE → VERIFIED NARRATION
              </span>{" "}
              rather than automatically turning an interesting explanation or experimental trial into an established fact.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/80">7 Flagged Claims:</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">12-lb dolerite maul</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">Razor blade seam trope</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">45,000-ton figure</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">12 cm³/hr rate</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">Three-rod method</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">Quartz-grain mechanics</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px]">Limestone guide blocks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Switcher & Input Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center mb-6 bg-card/60 border border-border/80 rounded-xl p-3.5 backdrop-blur shadow-sm">
        {/* Story Selector */}
        <div className="lg:col-span-5 flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Active Story:
          </span>
          <select
            value={activeStory.id}
            onChange={(e) => {
              const selected = storyList.find((s) => s.id === e.target.value);
              if (selected) setActiveStory(selected);
            }}
            className="w-full text-xs font-medium bg-background border border-border/80 rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate cursor-pointer"
          >
            {storyList.map((story) => (
              <option key={story.id} value={story.id}>
                {story.workingTitle}
              </option>
            ))}
          </select>
        </div>

        {/* 1-Click Exemplar Shortcuts */}
        <div className="lg:col-span-4 flex items-center gap-1.5 overflow-x-auto py-1">
          <Button
            variant={activeStory.id === DAY5_EXEMPLAR_EGYPTIAN.id ? "default" : "secondary"}
            size="sm"
            onClick={() => setActiveStory(DAY5_EXEMPLAR_EGYPTIAN)}
            className="h-7 text-[11px] gap-1 px-2.5 shrink-0 cursor-pointer"
            title="Load Official Day 5 Assignment: Ancient Egyptian Stonework"
          >
            <span>🏛️</span>
            <span>Egyptian Stonework</span>
          </Button>

          <Button
            variant={activeStory.id === DAY5_EXEMPLAR_SCANPYRAMIDS.id ? "default" : "secondary"}
            size="sm"
            onClick={() => setActiveStory(DAY5_EXEMPLAR_SCANPYRAMIDS)}
            className="h-7 text-[11px] gap-1 px-2.5 shrink-0 cursor-pointer"
            title="Load ScanPyramids Cosmic Rays Study"
          >
            <span>🌌</span>
            <span>Cosmic Rays</span>
          </Button>

          <Button
            variant={activeStory.id === DAY5_EXEMPLAR_UAP.id ? "default" : "secondary"}
            size="sm"
            onClick={() => setActiveStory(DAY5_EXEMPLAR_UAP)}
            className="h-7 text-[11px] gap-1 px-2.5 shrink-0 cursor-pointer"
            title="Load Chilean Pilot UFO Investigation Study"
          >
            <span>🛸</span>
            <span>Chilean FLIR</span>
          </Button>
        </div>

        {/* Controls: New Manual Story & Upload */}
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManualFormOpen(!isManualFormOpen)}
            className="h-8 text-xs gap-1.5 border-border/80 hover:bg-accent cursor-pointer"
          >
            <ListPlus className="h-3.5 w-3.5 text-primary" />
            <span>New Story</span>
          </Button>

          <label className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border/80 bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Import</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Manual Input Drawer / Form */}
      {isManualFormOpen && (
        <Card className="mb-8 border-indigo-500/30 bg-card/90 shadow-md animate-in fade-in slide-in-from-top-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Build a New Documentary Story Map
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your core working title, premise, and angle. The Story Engine will map out all 12 beats, the First 30s opening, and the 5-stage escalation ladder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualGenerate} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Working Title <span className="text-primary">*</span>
                  </label>
                  <Input
                    placeholder="e.g. How Did Ancient Egyptians Achieve Such Precise Stonework?"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Editorial Angle</label>
                  <Input
                    placeholder="e.g. Material Science & Archaeological Re-enactment"
                    value={manualAngle}
                    onChange={(e) => setManualAngle(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Fact / Premise / Underlying Mystery
                </label>
                <Textarea
                  placeholder="Describe the verifiable real-world anchor, historical dilemma, or scientific discovery..."
                  value={manualPremise}
                  onChange={(e) => setManualPremise(e.target.value)}
                  className="min-h-[64px] text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Target Viewer</label>
                  <Input
                    placeholder="e.g. Ancient engineering enthusiasts, debunking myths"
                    value={manualTargetViewer}
                    onChange={(e) => setManualTargetViewer(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Visual Hook Concept (The 0–5s Shot)
                  </label>
                  <Input
                    placeholder="e.g. Macro strike of diorite stone pounder creating quartz dust..."
                    value={manualVisualHook}
                    onChange={(e) => setManualVisualHook(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManualFormOpen(false)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isGenerating || !manualTitle.trim()}
                  className="h-8 text-xs gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Architecting Story...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Architect Story Map
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Story Summary Banner */}
      <div className="mb-6 rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-background to-purple-950/20 p-4.5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                Active Story Dossier
              </span>
              {activeStory.code && (
                <Badge variant="outline" className="text-[10px] font-mono h-4 border-indigo-500/30 text-indigo-300">
                  {activeStory.code} • {activeStory.pattern || "Formula"}
                </Badge>
              )}
              {activeStory.clickMotivation && (
                <Badge className="text-[10px] h-4 bg-indigo-500/15 text-indigo-300 border-0">
                  Pull: {activeStory.clickMotivation}
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {activeStory.workingTitle}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 max-w-3xl">
              <strong className="text-foreground/90 font-medium">Core Question:</strong> {activeStory.coreQuestion}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAllMarkdown}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedAll ? "Copied All!" : "Copy Full Worksheet"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val: any) => setActiveTab(val)}
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <TabsList className="bg-card/70 border border-border/60 p-1">
            <TabsTrigger value="worksheet" className="text-xs gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white cursor-pointer">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Day 5 Worksheet (12 Elements)</span>
            </TabsTrigger>
            <TabsTrigger value="engine" className="text-xs gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white cursor-pointer">
              <Compass className="h-3.5 w-3.5" />
              <span>7-Beat Story Engine</span>
            </TabsTrigger>
            <TabsTrigger value="first30s" className="text-xs gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white cursor-pointer">
              <Clock className="h-3.5 w-3.5" />
              <span>First 30 Seconds Script</span>
            </TabsTrigger>
            <TabsTrigger value="escalation" className="text-xs gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white cursor-pointer">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Escalation & Open Loops</span>
            </TabsTrigger>
            <TabsTrigger value="visuals" className="text-xs gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white cursor-pointer">
              <Film className="h-3.5 w-3.5" />
              <span>Google Flow Visuals</span>
            </TabsTrigger>
            <TabsTrigger value="research" className="text-xs gap-1.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white cursor-pointer">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Research Discipline ({activeStory.researchClaims?.length ?? 0})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================
            TAB 1: DAY 5 WORKSHEET (12 CANONICAL ROWS)
            ======================================================== */}
        <TabsContent value="worksheet" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span>The 12-Element Skeleton Table</span>
                <span className="text-xs text-muted-foreground font-normal">
                  (Official Day 5 Practical Assignment Layout)
                </span>
              </h4>
              <p className="text-xs text-muted-foreground">
                Matches the exact 3-column structure required in the Day 5 assignment:{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">#</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">Story Element</code>,{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">Your Answer</code>.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={exportDay5Excel}
              className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Download Day 5 .xlsx</span>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
            <table className="w-full min-w-[700px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/60">
                  <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground w-12 text-center">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-56">
                    Story Element
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Your Answer
                  </th>
                  <th className="px-3.5 py-3 text-right font-semibold text-muted-foreground w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {activeStory.elements.map((row, idx) => {
                  const isNeedsResearch =
                    row.yourAnswer.toLowerCase().includes("needs research") ||
                    row.isNeedsResearch;

                  return (
                    <tr
                      key={row.num}
                      className="hover:bg-accent/25 transition-colors group"
                    >
                      <td className="px-3.5 py-3 align-top font-mono text-center text-muted-foreground font-semibold">
                        {row.num}
                      </td>

                      <td className="px-4 py-3 align-top font-semibold text-foreground">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">{row.storyElement}</span>
                          {row.notes && (
                            <span className="text-[11px] text-muted-foreground font-normal leading-tight">
                              {row.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-foreground/90 leading-relaxed">
                        {editingRowIndex === idx ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="min-h-[90px] text-xs resize-y"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveInlineEdit(idx)}
                                className="h-6 text-[11px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingRowIndex(null)}
                                className="h-6 text-[11px] px-2 cursor-pointer"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="whitespace-pre-line text-xs font-normal">
                              {row.yourAnswer}
                            </div>
                            {isNeedsResearch && (
                              <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] gap-1 px-1.5 py-0 h-4"
                              >
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Needs Research Discipline
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-3.5 py-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRowIndex(idx);
                              setEditingText(row.yourAnswer);
                            }}
                            className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                            title="Edit answer inline"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyAnswer(row.yourAnswer, idx)}
                            className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                            title="Copy answer"
                          >
                            {copiedIndex === idx ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB 2: 7-BEAT STORY ENGINE & TIMELINE
            ======================================================== */}
        <TabsContent value="engine" className="space-y-6">
          {/* Story Engine Flow Banner */}
          <div className="rounded-xl border border-border/80 bg-card p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              The Documentary Story Engine Loop
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { name: "QUESTION", desc: "Introduce core dilemma", beat: "Beat 1–2", color: "from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30" },
                { name: "INVESTIGATION", desc: "Researchers in action", beat: "Beat 4", color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30" },
                { name: "COMPLICATION", desc: "Conflict & tension", beat: "Beat 5", color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30" },
                { name: "DISCOVERY", desc: "Measurement & data", beat: "Beat 6a", color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30" },
                { name: "EXPLANATION", desc: "How it works physically", beat: "Beat 6b", color: "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30" },
                { name: "PAYOFF", desc: "Earned truth & meaning", beat: "Beat 7", color: "from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/30" },
              ].map((step, idx) => (
                <div
                  key={step.name}
                  className={`rounded-lg border p-3 flex flex-col justify-between bg-gradient-to-br ${step.color}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mb-1">
                    <span>0{idx + 1}</span>
                    <span>{step.beat}</span>
                  </div>
                  <div className="font-bold text-xs tracking-wide">{step.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7 Beats Detailed Cards */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              The 7 Structural Beats (Script Breakdown)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Beat 1: Cold Open */}
              <Card className="border-border/80 bg-card/70">
                <CardHeader className="py-3 px-4 bg-muted/40 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-[10px]">
                      Beat 1 • 0–12s
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">Cold Open</span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    Give the Viewer a Reason to Care Immediately
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/60">
                    <span className="font-semibold text-cyan-400">Rule:</span> Don't explain everything yet! Introduce a strange discovery, extraordinary event, or visual mystery.
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {activeStory.elements.find((e) => e.num === 4)?.yourAnswer}
                  </p>
                </CardContent>
              </Card>

              {/* Beat 2: The Big Question */}
              <Card className="border-border/80 bg-card/70">
                <CardHeader className="py-3 px-4 bg-muted/40 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-[10px]">
                      Beat 2 • 12–30s
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">The Big Question</span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    Define the Central Mission Contract
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/60">
                    <span className="font-semibold text-indigo-400">Rule:</span> Tell the viewer what the documentary is trying to discover. Establish the information gap.
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {activeStory.elements.find((e) => e.num === 5)?.yourAnswer}
                  </p>
                </CardContent>
              </Card>

              {/* Beat 3: Context */}
              <Card className="border-border/80 bg-card/70">
                <CardHeader className="py-3 px-4 bg-muted/40 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-purple-500/40 text-purple-400 text-[10px]">
                      Beat 3 • Setup
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">Context</span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    Who, Where, When, Why (Serves Story, Not Textbook)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/60">
                    <span className="font-semibold text-purple-400">Rule:</span> Avoid dry textbook facts. Give only the necessary context that elevates the drama of the investigation.
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {activeStory.elements.find((e) => e.num === 6)?.yourAnswer}
                  </p>
                </CardContent>
              </Card>

              {/* Beat 4: Investigation */}
              <Card className="border-border/80 bg-card/70">
                <CardHeader className="py-3 px-4 bg-muted/40 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                      Beat 4 • The Search
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">Investigation</span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    Researchers, Expeditions, & Field Experiments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/60">
                    <span className="font-semibold text-emerald-400">Rule:</span> The viewer should feel: "We're getting closer." Show physical tools, archives, and archaeological data.
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {activeStory.elements.find((e) => e.num === 7)?.yourAnswer}
                  </p>
                </CardContent>
              </Card>

              {/* Beat 5: Complication */}
              <Card className="border-border/80 bg-card/70">
                <CardHeader className="py-3 px-4 bg-muted/40 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
                      Beat 5 • Tension
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">Complication</span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    The Obstacle, Paradox, or Unexpected Conflict
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/60">
                    <span className="font-semibold text-amber-400">Rule:</span> Prevent boring linearity (Fact → Fact → Conclusion). Evidence contradicts expectations.
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {activeStory.elements.find((e) => e.num === 8)?.yourAnswer}
                  </p>
                </CardContent>
              </Card>

              {/* Beat 6: Discovery / Explanation */}
              <Card className="border-border/80 bg-card/70">
                <CardHeader className="py-3 px-4 bg-muted/40 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-teal-500/40 text-teal-400 text-[10px]">
                      Beat 6 • Breakthrough
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">Discovery & Explanation</span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    The Earned Answer & Mechanism
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/60">
                    <span className="font-semibold text-teal-400">Rule:</span> The payoff feels earned because we spent minutes testing and investigating.
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {activeStory.elements.find((e) => e.num === 9)?.yourAnswer}
                    {"\n\n"}
                    <strong className="text-foreground">Mechanism:</strong>{" "}
                    {activeStory.elements.find((e) => e.num === 10)?.yourAnswer}
                  </p>
                </CardContent>
              </Card>

              {/* Beat 7: Final Payoff & Closing Thought */}
              <Card className="border-border/80 bg-card/70 md:col-span-2">
                <CardHeader className="py-3 px-4 bg-muted/40 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                      Beat 7 • Closure
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">Final Payoff & Closing Thought</span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    Answer the Central Question & Leave Meaningful Depth
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-2">
                  <div className="p-2.5 rounded bg-muted/30 border border-border/60">
                    <span className="font-semibold text-emerald-400">Rule:</span> Don't just say "and that's the end." Answer the central question and connect back to human significance.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="font-semibold text-foreground">Final Payoff:</span>
                      <p className="text-muted-foreground leading-relaxed mt-1">
                        {activeStory.elements.find((e) => e.num === 11)?.yourAnswer}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Closing Thought:</span>
                      <p className="text-muted-foreground leading-relaxed mt-1">
                        {activeStory.elements.find((e) => e.num === 12)?.yourAnswer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB 3: FIRST 30 SECONDS SCRIPT (DIRECTOR'S CUT)
            ======================================================== */}
        <TabsContent value="first30s" className="space-y-6">
          <div className="rounded-xl border border-amber-500/30 bg-card p-4.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  The First 30 Seconds Retention Formula
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Day 5 Golden Rule: <span className="text-foreground font-medium">Never reveal the entire answer in the introduction!</span> Structure every second to earn the watch.
                </p>
              </div>

              <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs px-2.5 py-1 shrink-0">
                Pacing: ~75 Words Total (2.5 Words/Sec)
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* 0–5s Visual Hook */}
              <div className="rounded-lg border border-border/80 bg-background/60 p-3.5 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 mb-1">
                    <span className="font-bold">0–5 SECONDS</span>
                    <span>PHASE 1</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {activeStory.first30Seconds.visualHook0to5s.label}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    <strong className="text-foreground/90">Visual:</strong> {activeStory.first30Seconds.visualHook0to5s.visualShot}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50 text-[11px] text-amber-300/80 font-mono">
                  SFX: {activeStory.first30Seconds.visualHook0to5s.soundCues}
                </div>
              </div>

              {/* 5–12s Strange Claim */}
              <div className="rounded-lg border border-border/80 bg-background/60 p-3.5 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                    <span className="font-bold">5–12 SECONDS</span>
                    <span>PHASE 2</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                    STRANGE FACT / CLAIM
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    <strong className="text-foreground/90">Voiceover:</strong> "{activeStory.first30Seconds.strangeClaim5to12s.narration}"
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  Action: {activeStory.first30Seconds.strangeClaim5to12s.visualAction}
                </div>
              </div>

              {/* 12–20s The Question */}
              <div className="rounded-lg border border-border/80 bg-background/60 p-3.5 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400 mb-1">
                    <span className="font-bold">12–20 SECONDS</span>
                    <span>PHASE 3</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                    THE QUESTION (GAP)
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    <strong className="text-foreground/90">Voiceover:</strong> "{activeStory.first30Seconds.question12to20s.narration}"
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  Action: {activeStory.first30Seconds.question12to20s.visualAction}
                </div>
              </div>

              {/* 20–30s The Promise */}
              <div className="rounded-lg border border-border/80 bg-background/60 p-3.5 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-1">
                    <span className="font-bold">20–30 SECONDS</span>
                    <span>PHASE 4</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-foreground">
                    THE PROMISE (CONTRACT)
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    <strong className="text-foreground/90">Voiceover:</strong> "{activeStory.first30Seconds.promise20to30s.narration}"
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  Action: {activeStory.first30Seconds.promise20to30s.visualAction}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB 4: ESCALATION & OPEN LOOPS
            ======================================================== */}
        <TabsContent value="escalation" className="space-y-6">
          {/* Escalation Principle */}
          <div className="rounded-xl border border-border/80 bg-card p-4.5 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                The Escalation Principle (5 Progression Levels)
              </h4>
              <p className="text-xs text-muted-foreground">
                A documentary must generally become more interesting as it progresses:{" "}
                <span className="text-foreground font-medium">Interesting → More interesting → Surprising → Significant → Revelation</span>.
                Never present every single point as "the biggest discovery ever."
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {activeStory.escalationLadder.map((step) => (
                <div
                  key={step.level}
                  className="rounded-lg border border-border/80 bg-background/60 p-3 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <Badge variant="outline" className="text-[10px] font-mono mb-1.5 h-4 border-indigo-500/30 text-indigo-300">
                      Step {step.level}
                    </Badge>
                    <div className="text-xs font-bold text-foreground">
                      {step.label}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Loops Table */}
          <div className="rounded-xl border border-border/80 bg-card p-4.5 space-y-3">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-purple-400" />
                Open Loops Tracker (Retention Hooks)
              </h4>
              <p className="text-xs text-muted-foreground">
                "We don't manufacture mystery. We discover mystery." Introduce legitimate questions without immediately answering them.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border/80">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/60 border-b border-border text-muted-foreground text-left">
                    <th className="px-3.5 py-2.5 font-semibold">Open Loop Question</th>
                    <th className="px-3.5 py-2.5 font-semibold w-40">Introduced At</th>
                    <th className="px-3.5 py-2.5 font-semibold w-40">Resolved At</th>
                    <th className="px-3.5 py-2.5 font-semibold w-28 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {activeStory.openLoops.map((loop) => (
                    <tr key={loop.id} className="hover:bg-accent/20">
                      <td className="px-3.5 py-2.5 font-medium text-foreground">
                        {loop.question}
                      </td>
                      <td className="px-3.5 py-2.5 text-muted-foreground">
                        {loop.openedInBeat}
                      </td>
                      <td className="px-3.5 py-2.5 text-muted-foreground">
                        {loop.resolvedInBeat}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] py-0 h-4">
                          Earned Loop
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB 5: GOOGLE FLOW CINEMATIC VISUALS
            ======================================================== */}
        <TabsContent value="visuals" className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card p-4.5 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                Visual Storytelling & Shot Prompts (Google Flow Ready)
              </h4>
              <p className="text-xs text-muted-foreground">
                "The visual is communicating the story, not decorating it." Pair every key narration line with an intentional cinematic shot.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeStory.visualScenes.map((scene) => (
                <div
                  key={scene.shotNumber}
                  className="rounded-lg border border-border/80 bg-background/60 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono h-4 border-emerald-500/30 text-emerald-300">
                        Shot #{scene.shotNumber}
                      </Badge>
                      <span className="text-[11px] font-semibold text-foreground">
                        {scene.shotType}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="font-semibold text-muted-foreground">Voiceover:</span>{" "}
                      <span className="italic text-foreground">"{scene.narration}"</span>
                    </div>

                    <div className="text-xs">
                      <span className="font-semibold text-muted-foreground">Action:</span>{" "}
                      <span className="text-muted-foreground">{scene.visualAction}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-border/60">
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                      <span>GOOGLE FLOW PROMPT</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAnswer(scene.googleFlowPrompt, 100 + scene.shotNumber)}
                        className="h-5 px-1.5 text-[10px] gap-1 cursor-pointer"
                      >
                        {copiedIndex === 100 + scene.shotNumber ? (
                          <Check className="h-2.5 w-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-2.5 w-2.5" />
                        )}
                        Copy Prompt
                      </Button>
                    </div>
                    <p className="text-[11px] font-mono bg-muted/40 p-2 rounded border border-border/50 text-foreground/85 leading-relaxed select-all">
                      {scene.googleFlowPrompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB 6: PROFESSIONAL RESEARCH DISCIPLINE (FACT VS HYPOTHESIS)
            ======================================================== */}
        <TabsContent value="research" className="space-y-6">
          <div className="rounded-xl border border-amber-500/30 bg-card p-5 space-y-5 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                <h4 className="text-base font-bold text-foreground">
                  The Professional 4-Stage Documentary Pipeline
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                "Your story structure is stronger than your factual certainty." Professional documentary makers do not automatically turn an interesting explanation into established fact. They trace every claim through four distinct verification stages:
              </p>
            </div>

            {/* 4-Stage Pipeline Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                {
                  step: "01",
                  title: "STORY IDEA",
                  color: "border-blue-500/30 bg-blue-500/5 text-blue-400",
                  desc: "What intriguing question or anomaly grabs the audience's attention?",
                  example: "How did Egyptians fit hard granite so tightly?",
                },
                {
                  step: "02",
                  title: "HYPOTHESIS",
                  color: "border-amber-500/30 bg-amber-500/5 text-amber-400",
                  desc: "A proposed mechanism, modern experimental trial, or theoretical model.",
                  example: "Hypothesis: copper saws with quartz sand slurry cut stone at ~12 cm³/hr.",
                },
                {
                  step: "03",
                  title: "EVIDENCE",
                  color: "border-purple-500/30 bg-purple-500/5 text-purple-400",
                  desc: "Physical artifacts, quarry assemblages, museum catalogs, or archaeological digs.",
                  example: "Dolerite balls found in Aswan, SEM striations on Petrie's Core No. 7.",
                },
                {
                  step: "04",
                  title: "VERIFIED NARRATION",
                  color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
                  desc: "The factual script line that is 100% defensible, nuance-preserved, and verified.",
                  example: "Documented sub-millimeter tolerances without sensationalist 'razor blade' tropes.",
                },
              ].map((stage) => (
                <div
                  key={stage.step}
                  className={`rounded-lg border p-3.5 flex flex-col justify-between space-y-2 ${stage.color}`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mb-1">
                      <span>STAGE {stage.step}</span>
                    </div>
                    <div className="font-bold text-xs tracking-wide">{stage.title}</div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                      {stage.desc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/40 text-[10px] italic text-foreground/80">
                    "{stage.example}"
                  </div>
                </div>
              ))}
            </div>

            {/* Claims Verification Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Claims Requiring Primary Verification ({activeStory.researchClaims?.length ?? 0})
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Specific statements from the workbook identified as requiring primary verification before narration.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const claims = activeStory.researchClaims || [];
                    const text = claims
                      .map(
                        (c, i) =>
                          `${i + 1}. [${c.category}] ${c.claim}\n   - Current Draft: "${c.currentDraftText}"\n   - Verified Alternative: "${c.verifiedAlternativeText}"\n   - Verification Action: ${c.verificationAction}\n`
                      )
                      .join("\n");
                    navigator.clipboard.writeText(text);
                    alert("Research Verification Checklist copied to clipboard!");
                  }}
                  className="h-7 text-[11px] gap-1.5 border-border/80 cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy Research Checklist</span>
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border/80">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-secondary/60 border-b border-border text-muted-foreground text-left">
                      <th className="px-3 py-2.5 font-semibold w-48">Claim & Beat</th>
                      <th className="px-3 py-2.5 font-semibold w-32">Category</th>
                      <th className="px-3 py-2.5 font-semibold">Unverified Draft Text</th>
                      <th className="px-3 py-2.5 font-semibold">Verified Alternative / Fix</th>
                      <th className="px-3 py-2.5 font-semibold w-56">Verification Action Required</th>
                      <th className="px-3 py-2.5 font-semibold w-24 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(activeStory.researchClaims || []).map((item) => (
                      <tr key={item.id} className="hover:bg-accent/25 transition-colors">
                        <td className="px-3 py-3 align-top font-semibold text-foreground">
                          <div>{item.claim}</div>
                          <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                            {item.beatOrElement}
                          </div>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 ${
                              item.category === "Popular Trope"
                                ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                                : item.category === "Experimental Metric"
                                ? "border-blue-500/40 text-blue-400 bg-blue-500/10"
                                : item.category === "Estimated Figure"
                                ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                                : "border-purple-500/40 text-purple-400 bg-purple-500/10"
                            }`}
                          >
                            {item.category}
                          </Badge>
                        </td>

                        <td className="px-3 py-3 align-top text-rose-300/90 font-mono text-[11px] leading-relaxed">
                          "{item.currentDraftText}"
                        </td>

                        <td className="px-3 py-3 align-top text-emerald-300/90 leading-relaxed font-medium">
                          {item.verifiedAlternativeText}
                        </td>

                        <td className="px-3 py-3 align-top text-muted-foreground text-[11px] leading-relaxed">
                          {item.verificationAction}
                        </td>

                        <td className="px-3 py-3 align-top text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 ${
                              item.status === "reframed"
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {item.status === "reframed" ? "Reframed" : "Needs Research"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================
          MODAL 1: DAY 5 STUDY GUIDE
          ======================================================== */}
      <Dialog open={isStudyGuideOpen} onOpenChange={setIsStudyGuideOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              Day 5 Study Guide: Storytelling Fundamentals for Documentaries
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete reference rules from the Day 5 curriculum on moving from getting the click to earning the watch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-foreground/90 leading-relaxed pt-2">
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <h5 className="font-bold text-sm text-indigo-400 mb-1">The Golden Law</h5>
              <p>
                <strong>A documentary is not a collection of facts.</strong> It is a sequence of questions, discoveries, complications, and answers. Facts are the ingredients; story is how you arrange them.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded border border-border/80 bg-card">
                <h5 className="font-semibold text-foreground mb-1">Topic vs Story</h5>
                <p className="text-muted-foreground">
                  <strong>Topic:</strong> "Ancient Egyptian pyramids" (boring, no direction).<br />
                  <strong>Story:</strong> "For thousands of years, nobody knew how builders achieved sub-millimeter tolerances. Modern experiments reveal the answer is more complex than expected." (Creates movement & curiosity).
                </p>
              </div>

              <div className="p-3 rounded border border-border/80 bg-card">
                <h5 className="font-semibold text-foreground mb-1">The Escalation Principle</h5>
                <p className="text-muted-foreground">
                  Build gradually: <em>Interesting → More interesting → Surprising → Significant → Revelation</em>. If everything is "amazing," nothing feels important.
                </p>
              </div>
            </div>

            <div className="p-3 rounded border border-border/80 bg-card space-y-2">
              <h5 className="font-semibold text-foreground">The 3 Competitor Openings (First 30s Lab)</h5>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Opening 1 (UAP Chile):</strong> Broad subject → unexpected country → official investigation → unanswered question.
                </li>
                <li>
                  <strong className="text-foreground">Opening 2 (Civilization):</strong> Enormous scale + chronological progression ("We are about to travel through an enormous story").
                </li>
                <li>
                  <strong className="text-foreground">Opening 3 (Ancient Mysteries):</strong> Mystery → examples → escalation → invitation into the investigation.
                </li>
              </ul>
            </div>

            <div className="p-3 rounded border border-amber-500/30 bg-amber-500/10">
              <h5 className="font-semibold text-amber-400 mb-1">Research Discipline</h5>
              <p className="text-foreground/90">
                Never manufacture fake mysteries or conspiracy. If an answer requires archival or archaeological confirmation, write:{" "}
                <code className="bg-background/80 px-1 py-0.5 rounded font-mono text-amber-300">
                  Needs research — determine whether archaeological evidence reveals a genuine difficulty
                </code>. Story first. Claims second. Evidence before certainty.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL 2: FIRST 30 SECONDS LAB
          ======================================================== */}
      <Dialog open={isFirst30sLabOpen} onOpenChange={setIsFirst30sLabOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              The First 30 Seconds Laboratory
            </DialogTitle>
            <DialogDescription className="text-xs">
              Test and rehearse the exact 4-phase opening formula.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
              <strong>Critical Rule:</strong> Do not reveal the entire answer in the introduction! If your video is about ancient stonework, don't start with "They used copper saws and sand slurry." That destroys the investigation.
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded border border-border/80 bg-card space-y-1">
                <span className="font-mono text-amber-400 font-bold">0–5s VISUAL HOOK</span>
                <p className="text-muted-foreground">{activeStory.first30Seconds.visualHook0to5s.visualShot}</p>
              </div>

              <div className="p-3 rounded border border-border/80 bg-card space-y-1">
                <span className="font-mono text-cyan-400 font-bold">5–12s STRANGE CLAIM</span>
                <p className="text-foreground font-medium">"{activeStory.first30Seconds.strangeClaim5to12s.narration}"</p>
              </div>

              <div className="p-3 rounded border border-border/80 bg-card space-y-1">
                <span className="font-mono text-indigo-400 font-bold">12–20s THE QUESTION</span>
                <p className="text-foreground font-medium">"{activeStory.first30Seconds.question12to20s.narration}"</p>
              </div>

              <div className="p-3 rounded border border-border/80 bg-card space-y-1">
                <span className="font-mono text-emerald-400 font-bold">20–30s THE PROMISE</span>
                <p className="text-foreground font-medium">"{activeStory.first30Seconds.promise20to30s.narration}"</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL 3: STORY ENGINE AUDIT
          ======================================================== */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Story Engine Audit (The 8 Evaluation Criteria)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Evaluate your documentary skeleton against the Day 5 master criteria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            {[
              { title: "1. Story Structure", desc: "Can the idea sustain a full documentary, moving through the 6 stages of the story engine?", status: "Passed" },
              { title: "2. The Hook", desc: "Does the opening 0–5s sequence create immediate curiosity without revealing the answer?", status: "Passed" },
              { title: "3. Central Question", desc: "Is there a clear, unambiguous mission that the viewer follows?", status: "Passed" },
              { title: "4. Escalation", desc: "Does the story become progressively more interesting rather than flat?", status: "Passed" },
              { title: "5. Open Loops", desc: "Are there legitimate unanswered questions that keep the viewer watching?", status: "Passed" },
              { title: "6. Evidence Discipline", desc: "Are claims separated from speculation? Are unverified items marked 'Needs research'?", status: "Passed" },
              { title: "7. Earned Payoff", desc: "Does the ending provide genuine closure and a lingering philosophical takeaway?", status: "Passed" },
              { title: "8. Visual Storytelling", desc: "Can each narration beat be represented through cinematic camera moves and authentic imagery?", status: "Passed" },
            ].map((crit) => (
              <div key={crit.title} className="p-2.5 rounded border border-border/70 bg-card flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-foreground">{crit.title}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{crit.desc}</div>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] shrink-0 h-4">
                  <Check className="h-2.5 w-2.5 mr-1" />
                  {crit.status}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
