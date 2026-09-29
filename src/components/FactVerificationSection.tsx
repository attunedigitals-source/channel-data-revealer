import React, { useState, useEffect, useRef, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  BookOpen,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Upload,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  ListPlus,
  Compass,
  FileText,
  Zap,
  Layers,
  Flame,
  MessageSquareQuote,
  Eye,
  Sliders,
  ExternalLink,
  ChevronRight,
  Info,
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
  type FactVerificationDossier,
  type FactVerificationRecord,
  type ClaimType,
  type ClaimStatus,
  type ClaimConfidence,
  type ClaimImportance,
  type SourceTier,
  CLAIM_TYPE_OPTIONS,
  CLAIM_STATUS_OPTIONS,
  CLAIM_CONFIDENCE_OPTIONS,
  CLAIM_IMPORTANCE_OPTIONS,
  SOURCE_TIER_OPTIONS,
  generateUnverifiedFallback,
  verifyClaimsServer,
  calculateDossierStats,
} from "@/lib/factverification.functions";

interface FactVerificationSectionProps {
  aiApiKey?: string;
  onOpenKeyModal?: () => void;
}

export function FactVerificationSection({ aiApiKey, onOpenKeyModal }: FactVerificationSectionProps) {
  // Starts with clean unpopulated state (zero pre-populated results)
  const [dossier, setDossier] = useState<FactVerificationDossier | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<FactVerificationRecord | null>(null);

  // Modals
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState(false);
  const [isChainVisualizerOpen, setIsChainVisualizerOpen] = useState(false);
  const [isSourceHierarchyOpen, setIsSourceHierarchyOpen] = useState(false);
  const [isNarrationDrawerOpen, setIsNarrationDrawerOpen] = useState(false);

  // Manual claims form
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualClaimsText, setManualClaimsText] = useState("");
  const [isResearching, setIsResearching] = useState(false);

  // UI state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedTable, setCopiedTable] = useState(false);
  const [incomingNotice, setIncomingNotice] = useState<string | null>(null);

  const verifyServer = useServerFn(verifyClaimsServer);
  const sectionRef = useRef<HTMLElement>(null);

  // Listen for incoming claims from Story Map & The 7-Beat Engine
  useEffect(() => {
    const handleIncomingClaims = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail) return;

      const storyTitle = detail.storyTitle || detail.title || "Documentary Investigation";
      const coreQuestion = detail.coreQuestion || detail.question || "";
      const rawClaims = Array.isArray(detail.claims) ? detail.claims : [];

      if (rawClaims.length === 0) return;

      setIncomingNotice(`Received ${rawClaims.length} claims from "${storyTitle}" for fact verification.`);
      setTimeout(() => setIncomingNotice(null), 6000);

      sectionRef.current?.scrollIntoView({ behavior: "smooth" });

      setIsResearching(true);
      const formattedClaims = rawClaims.map((item: any) => ({
        claim: typeof item === "string" ? item : item.claim || item.currentDraftText || "",
        claimType: item.category || undefined,
        importance: "HIGH",
        storyBeat: item.beatOrElement || undefined,
      }));

      verifyServer({
        data: {
          storyTitle,
          coreQuestion,
          claims: formattedClaims,
          aiApiKey: aiApiKey || undefined,
        },
      })
        .then((result) => {
          setDossier(result);
        })
        .catch((err) => {
          console.warn("Fact verification request failed:", err);
          const fallback = generateUnverifiedFallback({
            storyTitle,
            coreQuestion,
            claims: formattedClaims,
            reason: "Verification request failed. Try again, or verify these claims manually.",
          });
          setDossier(fallback);
        })
        .finally(() => {
          setIsResearching(false);
        });
    };

    window.addEventListener("load-to-fact-verification", handleIncomingClaims);
    return () => {
      window.removeEventListener("load-to-fact-verification", handleIncomingClaims);
    };
  }, [aiApiKey, verifyServer]);

  // Handle Manual Batch Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClaimsText.trim()) return;

    const lines = manualClaimsText
      .split("\n")
      .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setIsResearching(true);
    const storyTitle = manualTitle.trim() || "Custom Documentary Investigation";
    const claims = lines.map((claim) => ({ claim }));

    try {
      const result = await verifyServer({
        data: {
          storyTitle,
          claims,
          aiApiKey: aiApiKey || undefined,
        },
      });
      setDossier(result);
      setIsManualFormOpen(false);
      setManualTitle("");
      setManualClaimsText("");
    } catch (err) {
      console.warn("Manual fact verification request failed:", err);
      const fallback = generateUnverifiedFallback({
        storyTitle,
        claims,
        reason: "Verification request failed. Try again, or verify these claims manually.",
      });
      setDossier(fallback);
      setIsManualFormOpen(false);
      setManualTitle("");
      setManualClaimsText("");
    } finally {
      setIsResearching(false);
    }
  };

  // Handle spreadsheet upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) return;
        const sheet = workbook.Sheets[firstSheetName];
        if (!sheet) return;
        const json = XLSX.utils.sheet_to_json<any>(sheet);

        if (json.length === 0) return;

        // Check if file already has 9-column fact verification structure
        const firstRow = json[0];
        const hasClaimCol = firstRow["Claim"] || firstRow["claim"] || firstRow["CLAIM"];
        const hasSourceCol = firstRow["Source"] || firstRow["source"];

        if (hasClaimCol && hasSourceCol) {
          const importedRecords: FactVerificationRecord[] = json.map((row: any, idx: number) => ({
            num: Number(row["#"] || idx + 1),
            claim: String(row["Claim"] || row["claim"] || ""),
            claimType: String(row["Claim Type"] || row["claimType"] || "Interpretation") as ClaimType,
            importance: String(row["Importance"] || row["importance"] || "HIGH") as ClaimImportance,
            source: String(row["Source"] || row["source"] || "Documentary research archive"),
            evidence: String(row["Evidence"] || row["evidence"] || "Primary and secondary references"),
            status: String(row["Status"] || row["status"] || "NEEDS RESEARCH") as ClaimStatus,
            confidence: String(row["Confidence"] || row["confidence"] || "MEDIUM") as ClaimConfidence,
            notes: String(row["Notes"] || row["notes"] || ""),
            sourceTier: (row["Source Tier"] || "Tier 2: Academic / Scholarly") as SourceTier,
            suggestedNarration: row["Suggested Narration"] || undefined,
            evidenceCategory: row["Evidence Category"] || undefined,
          }));

          const customDossier: FactVerificationDossier = {
            id: `imported-${Date.now()}`,
            storyTitle: file.name.replace(/\.[^/.]+$/, ""),
            records: importedRecords,
            summaryStats: calculateDossierStats(importedRecords),
          };

          setDossier(customDossier);
          setIncomingNotice(`Imported ${importedRecords.length} verified claims from ${file.name}`);
          setTimeout(() => setIncomingNotice(null), 5000);
          return;
        }

        // Otherwise extract raw claims from "Claim", "Story Element", or "FACT / PREMISE"
        const extractedClaims: { claim: string }[] = [];
        json.forEach((row: any) => {
          const claim =
            row["Claim"] ||
            row["claim"] ||
            row["Your Answer"] ||
            row["FACT / PREMISE"] ||
            row["WORKING TITLE"] ||
            row["Title"] ||
            row["Fact"];
          if (claim && typeof claim === "string" && claim.trim().length > 5) {
            extractedClaims.push({ claim: claim.trim() });
          }
        });

        if (extractedClaims.length > 0) {
          setIsResearching(true);
          const storyTitle = file.name.replace(/\.[^/.]+$/, "");
          verifyServer({
            data: {
              storyTitle,
              claims: extractedClaims,
              aiApiKey: aiApiKey || undefined,
            },
          })
            .then((result) => setDossier(result))
            .catch(() => {
              const fallback = generateUnverifiedFallback({
                storyTitle,
                claims: extractedClaims,
                reason: "Verification request failed. Try again, or verify these claims manually.",
              });
              setDossier(fallback);
            })
            .finally(() => setIsResearching(false));
          setIncomingNotice(`Researching ${extractedClaims.length} claims extracted from ${file.name}...`);
        }
      } catch (err) {
        console.error("Failed to parse spreadsheet:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };



  // Clear / reset
  const handleClear = () => {
    setDossier(null);
    setSelectedRecord(null);
    setStatusFilter("ALL");
  };

  // Filtered claims
  const filteredRecords = useMemo(() => {
    if (!dossier) return [];
    return dossier.records.filter((rec) => {
      const matchesStatus = statusFilter === "ALL" || rec.status === statusFilter;
      const matchesSearch =
        searchQuery === "" ||
        rec.claim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.evidence.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.notes.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [dossier, statusFilter, searchQuery]);

  // Export exact 9-column Excel (.xlsx)
  const exportExcel = () => {
    if (!dossier) return;
    const wb = XLSX.utils.book_new();
    const rows = dossier.records.map((r) => ({
      "#": r.num,
      Claim: r.claim,
      "Claim Type": r.claimType,
      Importance: r.importance,
      Source: r.source,
      Evidence: r.evidence,
      Status: r.status,
      Confidence: r.confidence,
      Notes: r.notes,
    }));

    const ws = XLSX.utils.json_to_sheet(rows, {
      header: [
        "#",
        "Claim",
        "Claim Type",
        "Importance",
        "Source",
        "Evidence",
        "Status",
        "Confidence",
        "Notes",
      ],
    });

    ws["!cols"] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 25 },
      { wch: 14 },
      { wch: 35 },
      { wch: 45 },
      { wch: 20 },
      { wch: 14 },
      { wch: 45 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Fact Verification");
    const sanitized = dossier.storyTitle.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    XLSX.writeFile(wb, `Fact_Verification_${sanitized}.xlsx`);
  };

  // Export exact 9-column CSV (.csv)
  const exportCsv = () => {
    if (!dossier) return;
    const escapeCsv = (str: string | number) => {
      const s = String(str ?? "").trim();
      if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = [
      "#",
      "Claim",
      "Claim Type",
      "Importance",
      "Source",
      "Evidence",
      "Status",
      "Confidence",
      "Notes",
    ];

    const rows = dossier.records.map((r) =>
      [
        r.num,
        escapeCsv(r.claim),
        escapeCsv(r.claimType),
        escapeCsv(r.importance),
        escapeCsv(r.source),
        escapeCsv(r.evidence),
        escapeCsv(r.status),
        escapeCsv(r.confidence),
        escapeCsv(r.notes),
      ].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const sanitized = dossier.storyTitle.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Fact_Verification_${sanitized}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Markdown Table
  const copyMarkdownTable = () => {
    if (!dossier) return;
    const header = "| # | Claim | Claim Type | Importance | Source | Evidence | Status | Confidence | Notes |";
    const separator = "|---|---|---|---|---|---|---|---|---|";
    const rows = dossier.records.map(
      (r) =>
        `| ${r.num} | ${r.claim.replace(/\|/g, "/")} | ${r.claimType} | ${r.importance} | ${r.source.replace(/\|/g, "/")} | ${r.evidence.replace(/\|/g, "/")} | ${r.status} | ${r.confidence} | ${r.notes.replace(/\|/g, "/")} |`
    );

    const fullText = [header, separator, ...rows].join("\n");
    navigator.clipboard.writeText(fullText);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  // Status badge styling helper
  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case "VERIFIED":
        return "border-emerald-500/40 text-emerald-400 bg-emerald-500/10";
      case "PARTIALLY VERIFIED":
        return "border-cyan-500/40 text-cyan-400 bg-cyan-500/10";
      case "DISPUTED":
        return "border-amber-500/40 text-amber-400 bg-amber-500/10";
      case "NEEDS RESEARCH":
        return "border-purple-500/40 text-purple-400 bg-purple-500/10";
      case "EXCLUDE":
        return "border-rose-500/40 text-rose-400 bg-rose-500/10 font-bold";
      default:
        return "border-border text-muted-foreground";
    }
  };

  // Confidence badge styling helper
  const getConfidenceBadge = (conf: ClaimConfidence) => {
    switch (conf) {
      case "HIGH":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "LOW":
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  // Claim Type badge styling helper
  const getClaimTypeBadge = (type: ClaimType) => {
    switch (type) {
      case "Archaeological evidence":
        return "border-amber-500/30 text-amber-300 bg-amber-500/5";
      case "Scientific fact":
        return "border-cyan-500/30 text-cyan-300 bg-cyan-500/5";
      case "Historical fact":
        return "border-indigo-500/30 text-indigo-300 bg-indigo-500/5";
      case "Experimental reconstruction":
        return "border-emerald-500/30 text-emerald-300 bg-emerald-500/5";
      case "Quantitative claim":
        return "border-blue-500/30 text-blue-300 bg-blue-500/5 font-mono";
      case "Interpretation":
        return "border-purple-500/30 text-purple-300 bg-purple-500/5";
      case "Attribution":
        return "border-pink-500/30 text-pink-300 bg-pink-500/5";
      default:
        return "border-border text-foreground";
    }
  };

  return (
    <section
      id="fact-verification"
      ref={sectionRef}
      className="mx-auto max-w-6xl px-6 py-12 scroll-mt-16 transition-all"
    >
      {/* Header Container */}
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-400 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Week 1 • Fact Verification System
                </span>
                <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px] py-0 h-4">
                  Fact Verification & Source Discipline
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Research & Fact Verification
              </h2>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStudyGuideOpen(true)}
              className="h-8 gap-1.5 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-300 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Verification Guide</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChainVisualizerOpen(true)}
              className="h-8 gap-1.5 text-xs border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-300 cursor-pointer"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Research Chain</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSourceHierarchyOpen(true)}
              className="h-8 gap-1.5 text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Source Tiers</span>
            </Button>

            {/* Export Dropdown Group (only when records exist) */}
            {dossier && (
              <div className="flex items-center rounded-lg border border-border/80 bg-card p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportExcel}
                  className="h-7 text-xs gap-1.5 px-2.5 text-foreground hover:text-primary cursor-pointer"
                  title="Export 9-column Fact Verification Excel sheet"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Export</span> .xlsx
                </Button>
                <span className="text-border">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportCsv}
                  className="h-7 text-xs gap-1.5 px-2 text-foreground hover:text-primary cursor-pointer"
                  title="Export 9-column CSV"
                >
                  <Download className="h-3.5 w-3.5 text-blue-400" />
                  CSV
                </Button>
                <span className="text-border">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyMarkdownTable}
                  className="h-7 text-xs gap-1.5 px-2 text-foreground hover:text-primary cursor-pointer"
                  title="Copy full table as Markdown"
                >
                  {copiedTable ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{copiedTable ? "Copied!" : "Markdown"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          <strong className="text-foreground font-semibold">"Interesting ≠ true. Popular ≠ verified. Plausible ≠ proven."</strong>{" "}
          Determine what you can actually claim to your audience by putting story elements through the documentary research chain:{" "}
          <span className="inline-block px-1.5 py-0.5 rounded bg-muted/60 text-xs font-mono font-medium text-foreground">
            STORY QUESTION → CLAIM → SOURCE → EVIDENCE → VERIFICATION → CONFIDENCE LEVEL → NARRATION
          </span>.
        </p>

        {incomingNotice && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-300 animate-in fade-in slide-in-from-top-2">
            <Zap className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
            <span>{incomingNotice}</span>
          </div>
        )}
      </div>

      {/* Manual Input Drawer */}
      {isManualFormOpen && (
        <Card className="mb-8 border-amber-500/30 bg-card/90 shadow-md animate-in fade-in slide-in-from-top-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Batch Research & Fact Verification
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your documentary working title and paste claims (one per line). The engine will trace each claim to primary/scholarly sources, assess physical evidence, assign confidence, and generate responsible narration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Documentary Subject / Working Title <span className="text-primary">*</span>
                </label>
                <Input
                  placeholder="e.g. How Do Airplanes Actually Stay in the Air?"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">
                    Claims to Verify (One per line) <span className="text-primary">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Paste claims from your script, outline, or research notes
                  </span>
                </div>
                <Textarea
                  placeholder={`e.g.\nDolerite pounders were used to crush granite in quarries.\nA single dolerite pounder weighed exactly 12 pounds.\nSeams are so tight a razor blade cannot fit between them.\nCopper tools alone could cut granite without abrasives.\nQuartz sand was used as an abrasive slurry.\nThe three-rod method with string verified true planes.`}
                  value={manualClaimsText}
                  onChange={(e) => setManualClaimsText(e.target.value)}
                  required
                  rows={6}
                  className="text-xs font-mono"
                />
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
                  disabled={isResearching || !manualClaimsText.trim()}
                  className="h-8 text-xs gap-1.5 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isResearching ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Conducting Source Research...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Research & Verify Claims
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Empty State / Launchpad (Unpopulated Initial State) */}
      {!dossier && (
        <div className="rounded-2xl border border-dashed border-border/90 bg-card/40 p-8 sm:p-12 text-center backdrop-blur shadow-sm mb-8 animate-in fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-5 shadow-inner">
            <ShieldCheck className="h-8 w-8 animate-pulse" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">
            Research & Fact Verification Dossier
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            No claims have been researched yet. Prevent misinformation and ensure your documentary narration rests on solid evidence using one of the methods below:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
            {/* Option 1: From Story Map */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 flex flex-col justify-between hover:border-amber-500/50 transition-all group">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Compass className="h-5 w-5" />
                  </span>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
                    Recommended
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-amber-300 transition-colors">
                  From Story Map Section
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  In the <strong>Story Map & 7-Beat Engine</strong> above, click <span className="font-mono text-amber-300">"Inspect Claims Tracker →"</span> to send workbook claims directly here.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const el = document.getElementById("story-map");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full text-xs h-8 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                >
                  Go to Story Map ↑
                </Button>
              </div>
            </div>

            {/* Option 2: Manual Batch Entry */}
            <div className="rounded-xl border border-border/80 bg-card p-5 flex flex-col justify-between hover:border-primary/50 transition-all group">
              <div className="space-y-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
                  <ListPlus className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Enter Claims Manually
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Paste or type specific statements from your script or outline to verify sources, evidence, and certainty language.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  size="sm"
                  onClick={() => setIsManualFormOpen(true)}
                  className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Add Claims
                </Button>
              </div>
            </div>

            {/* Option 3: Import Spreadsheet */}
            <div className="rounded-xl border border-border/80 bg-card p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all group">
              <div className="space-y-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-300 transition-colors">
                  Import Spreadsheet
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload an existing 9-column Fact Verification workbook or any exported sheet in <code className="bg-muted px-1 py-0.5 rounded text-[10px]">.xlsx</code>, <code className="bg-muted px-1 py-0.5 rounded text-[10px]">.xls</code>, or <code className="bg-muted px-1 py-0.5 rounded text-[10px]">.csv</code>.
                </p>
              </div>
              <div className="pt-4">
                <label className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 cursor-pointer transition-colors w-full">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Select File...</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Option 4: How verification works */}
            <div className="rounded-xl border border-border/80 bg-card p-5 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 w-fit">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">How verification works</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Claims are researched with live web search (via your Gemini or OpenAI key), and every source is
                  cross-checked against real search results before being marked verified. Without an AI key, claims
                  are returned as "Needs research" rather than guessed.
                </p>
              </div>
              {!aiApiKey && onOpenKeyModal && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenKeyModal}
                    className="w-full text-[11px] h-7 justify-start gap-1.5 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                  >
                    Add an AI key to enable verification
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Populated Results View */}
      {dossier && (
        <div className="space-y-6 animate-in fade-in">
          {/* Active Dossier Header Bar */}
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 via-background to-orange-950/20 p-4.5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    Fact Verification Dossier
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono h-4 border-amber-500/30 text-amber-300">
                    {dossier.records.length} Researched Claims
                  </Badge>
                  <Badge className="text-[10px] h-4 bg-emerald-500/15 text-emerald-300 border-0">
                    {dossier.summaryStats.verified} Verified
                  </Badge>
                  {dossier.summaryStats.excluded > 0 && (
                    <Badge className="text-[10px] h-4 bg-rose-500/20 text-rose-300 border-0 font-bold">
                      {dossier.summaryStats.excluded} Excluded
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {dossier.storyTitle}
                </h3>
                {dossier.coreQuestion && (
                  <p className="text-xs text-muted-foreground line-clamp-2 max-w-3xl">
                    <strong className="text-foreground/90 font-medium">Core Question:</strong> {dossier.coreQuestion}
                  </p>
                )}
              </div>

              {/* Actions: New Claims, Import, Clear */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManualFormOpen(!isManualFormOpen)}
                  className="h-8 text-xs gap-1.5 border-border/80 hover:bg-accent cursor-pointer"
                >
                  <ListPlus className="h-3.5 w-3.5 text-primary" />
                  <span>Add Claims</span>
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

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 text-xs gap-1 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  title="Clear dossier and reset to empty state"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>

            {/* Quick Stat Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-4 pt-3 border-t border-border/60 text-xs">
              <div className="p-2 rounded bg-background/50 border border-border/50 text-center">
                <span className="text-[10px] text-muted-foreground block font-medium">TOTAL CLAIMS</span>
                <span className="text-base font-bold font-mono text-foreground">{dossier.summaryStats.total}</span>
              </div>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-emerald-400 block font-medium">VERIFIED</span>
                <span className="text-base font-bold font-mono text-emerald-400">{dossier.summaryStats.verified}</span>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20 text-center">
                <span className="text-[10px] text-cyan-400 block font-medium">PARTIAL</span>
                <span className="text-base font-bold font-mono text-cyan-400">{dossier.summaryStats.partiallyVerified}</span>
              </div>
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] text-amber-400 block font-medium">DISPUTED</span>
                <span className="text-base font-bold font-mono text-amber-400">{dossier.summaryStats.disputed}</span>
              </div>
              <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-center">
                <span className="text-[10px] text-purple-400 block font-medium">NEEDS RESEARCH</span>
                <span className="text-base font-bold font-mono text-purple-400">{dossier.summaryStats.needsResearch}</span>
              </div>
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-[10px] text-rose-400 block font-medium">EXCLUDE / KILL</span>
                <span className="text-base font-bold font-mono text-rose-400">{dossier.summaryStats.excluded}</span>
              </div>
            </div>
          </div>

          {/* Table Controls: Status Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 p-2.5 rounded-xl border border-border/80">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {(["ALL", "VERIFIED", "PARTIALLY VERIFIED", "DISPUTED", "NEEDS RESEARCH", "EXCLUDE"] as const).map(
                (status) => {
                  const count =
                    status === "ALL"
                      ? dossier.records.length
                      : dossier.records.filter((r) => r.status === status).length;
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        isActive
                          ? "bg-amber-600 text-white font-semibold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {status} ({count})
                    </button>
                  );
                }
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search claims, sources, evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background/80"
              />
            </div>
          </div>

          {/* Exact 9-Column Fact Verification Table */}
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
            <table className="w-full min-w-[1000px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/60">
                  <th className="px-3 py-3 text-center font-semibold text-muted-foreground w-10">
                    #
                  </th>
                  <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground w-64">
                    Claim
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-muted-foreground w-40">
                    Claim Type
                  </th>
                  <th className="px-2.5 py-3 text-center font-semibold text-muted-foreground w-24">
                    Importance
                  </th>
                  <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground w-56">
                    Source
                  </th>
                  <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground w-64">
                    Evidence
                  </th>
                  <th className="px-2.5 py-3 text-center font-semibold text-muted-foreground w-36">
                    Status
                  </th>
                  <th className="px-2.5 py-3 text-center font-semibold text-muted-foreground w-24">
                    Confidence
                  </th>
                  <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground">
                    Notes
                  </th>
                  <th className="px-2.5 py-3 text-right font-semibold text-muted-foreground w-20">
                    Narration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRecords.map((row) => (
                  <tr
                    key={row.num}
                    className={`hover:bg-accent/30 transition-colors group ${
                      row.status === "EXCLUDE" ? "bg-rose-950/10" : ""
                    }`}
                  >
                    <td className="px-3 py-3.5 align-top font-mono text-center text-muted-foreground font-semibold">
                      {row.num}
                    </td>

                    <td className="px-3.5 py-3.5 align-top space-y-1">
                      <div className="font-medium text-foreground leading-snug">
                        {row.claim}
                      </div>
                      {row.storyBeat && (
                        <span className="inline-block text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded">
                          {row.storyBeat}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3.5 align-top">
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 h-4.5 font-normal ${getClaimTypeBadge(
                          row.claimType
                        )}`}
                      >
                        {row.claimType}
                      </Badge>
                    </td>

                    <td className="px-2.5 py-3.5 align-top text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.importance === "HIGH"
                            ? "bg-rose-500/15 text-rose-300"
                            : row.importance === "MEDIUM"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-slate-500/15 text-slate-300"
                        }`}
                      >
                        {row.importance}
                      </span>
                    </td>

                    <td className="px-3.5 py-3.5 align-top space-y-1">
                      <div className="text-foreground/90 leading-relaxed font-medium">
                        {row.source}
                      </div>
                      {row.sourceTier && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <span>{row.sourceTier}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-3.5 py-3.5 align-top">
                      <p className="text-foreground/85 leading-relaxed text-[11px]">
                        {row.evidence}
                      </p>
                    </td>

                    <td className="px-2.5 py-3.5 align-top text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0.5 px-2 h-auto tracking-wide font-semibold ${getStatusBadge(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </Badge>
                    </td>

                    <td className="px-2.5 py-3.5 align-top text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0.2 h-4 font-mono font-bold ${getConfidenceBadge(
                          row.confidence
                        )}`}
                      >
                        {row.confidence}
                      </Badge>
                    </td>

                    <td className="px-3.5 py-3.5 align-top">
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        {row.notes}
                      </p>
                    </td>

                    <td className="px-2.5 py-3.5 align-top text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(row);
                          setIsNarrationDrawerOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-400 cursor-pointer"
                        title="View Language of Certainty & Suggested Narration Script"
                      >
                        <MessageSquareQuote className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: VERIFICATION GUIDE
          ======================================================== */}
      <Dialog open={isStudyGuideOpen} onOpenChange={setIsStudyGuideOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              Verification Guide: Documentary Research & Fact Verification
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete reference rules from the methodology on determining what you can actually claim in narration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-foreground/90 leading-relaxed pt-2">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h5 className="font-bold text-sm text-amber-400 mb-1">The Core Principle</h5>
              <p className="text-foreground font-semibold">
                Interesting ≠ true. Popular ≠ verified. Plausible ≠ proven.
              </p>
              <p className="mt-1 text-muted-foreground">
                A claim can be widely repeated, included in prior documentaries, mentioned by big YouTubers, and supported by impressive websites—and still require primary source verification.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <span>The Six Evidence Categories</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                  <div className="font-bold text-emerald-400">1. Established Evidence</div>
                  <p className="text-muted-foreground text-[11px]">
                    Strong direct evidence and broad scholarly support. Direct narration allowed: <em>"Archaeologists have found..."</em>
                  </p>
                </div>
                <div className="p-2.5 rounded border border-cyan-500/30 bg-cyan-500/5 space-y-1">
                  <div className="font-bold text-cyan-400">2. Strongly Supported Interpretation</div>
                  <p className="text-muted-foreground text-[11px]">
                    Evidence is substantial, but conclusion involves interpretation: <em>"The evidence suggests...", "Researchers believe..."</em>
                  </p>
                </div>
                <div className="p-2.5 rounded border border-amber-500/30 bg-amber-500/5 space-y-1">
                  <div className="font-bold text-amber-400">3. Disputed Interpretation</div>
                  <p className="text-muted-foreground text-[11px]">
                    Qualified researchers disagree. Never present one view as settled fact: <em>"Some researchers argue..., while others..."</em>
                  </p>
                </div>
                <div className="p-2.5 rounded border border-blue-500/30 bg-blue-500/5 space-y-1">
                  <div className="font-bold text-blue-400">4. Experimental Reconstruction</div>
                  <p className="text-muted-foreground text-[11px]">
                    Proven feasible in modern tests. But <strong>Can work ≠ definitely was done that way</strong>: <em>"Experiments have demonstrated that..."</em>
                  </p>
                </div>
                <div className="p-2.5 rounded border border-purple-500/30 bg-purple-500/5 space-y-1">
                  <div className="font-bold text-purple-400">5. Unverified Claim</div>
                  <p className="text-muted-foreground text-[11px]">
                    Sounds plausible but lacks sufficient reliable evidence. Mark as <em>Needs research</em>; do not narrate as settled fact.
                  </p>
                </div>
                <div className="p-2.5 rounded border border-rose-500/30 bg-rose-500/5 space-y-1">
                  <div className="font-bold text-rose-400">6. Claim to Exclude (Kill)</div>
                  <p className="text-muted-foreground text-[11px]">
                    Evidence contradicts it or damages channel credibility. Remove completely: <strong>Killing weak ideas is editorial strength</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded border border-border bg-card space-y-1">
              <h5 className="font-semibold text-foreground">The Three Source Rule</h5>
              <p className="text-muted-foreground text-[11px]">
                Aim for at least three independent sources. <em>Crucial caveat:</em> Three websites repeating the same blog post are not three independent confirmations. Trace claims back to original field excavation reports or peer-reviewed papers.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/25 space-y-2">
              <h5 className="font-bold text-xs text-indigo-400 flex items-center gap-1.5">
                <span>🎯</span>
                <span>Verification Standards: What We Must Be Careful About</span>
              </h5>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc pl-4">
                <li>
                  <strong className="text-foreground">Experimental Feasibility ≠ Historical Proof:</strong> An experiment demonstrating that a mechanism works (e.g. copper carrying quartz slurry) is NOT proof that ancient craftsmen used that exact mechanism. Classify as <em>PARTIALLY VERIFIED / MEDIUM</em>, not <em>VERIFIED / HIGH</em>.
                </li>
                <li>
                  <strong className="text-foreground">Specific Method vs. General Tools (The Three-Rod Rule):</strong> Surviving wooden rods and tomb scenes prove basic leveling practices existed, but do NOT prove the specific three-rod calibration triangulation method. Mark as <em>NEEDS RESEARCH</em> until specifically documented.
                </li>
                <li>
                  <strong className="text-foreground">Auditable Source Citations:</strong> Never use generic bucket labels like <em>"Scholarly publications"</em>. Always cite: <code className="text-[10px] text-amber-300">Author — Title — Year — Publication/Institution</code> (e.g. <em className="text-foreground">Stocks, Denys A. — Experiments in Egyptian Archaeology — 2003 — Routledge</em>).
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL 2: RESEARCH CHAIN VISUALIZER
          ======================================================== */}
      <Dialog open={isChainVisualizerOpen} onOpenChange={setIsChainVisualizerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Compass className="h-5 w-5 text-indigo-400" />
              The Documentary Research Chain
            </DialogTitle>
            <DialogDescription className="text-xs">
              The professional 7-step sequence connecting a curiosity-inducing question to responsible narration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            {[
              {
                step: "01",
                label: "STORY QUESTION",
                desc: "The central dilemma driving the documentary.",
                example: "How do commercial airplanes stay in the air with such heavy engines?",
                color: "border-blue-500/40 text-blue-400",
              },
              {
                step: "02",
                label: "CLAIM",
                desc: "A specific statement extracted from the story outline.",
                example: "Copper saws with abrasive slurry cut granite through rolling micro-fracturing.",
                color: "border-indigo-500/40 text-indigo-400",
              },
              {
                step: "03",
                label: "SOURCE",
                desc: "Locating primary excavation reports or peer-reviewed replications.",
                example: "NASA Technical Reports Server (2019); peer-reviewed aerodynamics journal article.",
                color: "border-purple-500/40 text-purple-400",
              },
              {
                step: "04",
                label: "EVIDENCE",
                desc: "Physical artifacts, toolmarks, or experimental data.",
                example: "Microscopic striation patterns on Petrie drill cores matching quartz grain crushing.",
                color: "border-cyan-500/40 text-cyan-400",
              },
              {
                step: "05",
                label: "VERIFICATION",
                desc: "Testing whether the physical evidence actually supports the specific claim.",
                example: "Verified: copper acts as a carrier; quartz sand does the cutting.",
                color: "border-emerald-500/40 text-emerald-400",
              },
              {
                step: "06",
                label: "CONFIDENCE LEVEL",
                desc: "Classifying certainty (HIGH, MEDIUM, LOW) and Evidence Category.",
                example: "Confidence: HIGH (Experimental Reconstruction).",
                color: "border-amber-500/40 text-amber-400",
              },
              {
                step: "07",
                label: "NARRATION PHRASING",
                desc: "Scripting voiceover using the calibrated Language of Certainty.",
                example: "'Experiments have demonstrated that copper tubes combined with quartz slurry can cut granite...'",
                color: "border-rose-500/40 text-rose-400",
              },
            ].map((st) => (
              <div
                key={st.step}
                className={`p-3 rounded-lg border ${st.color} bg-card space-y-1`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">{st.step} • {st.label}</span>
                  <span className="text-[10px] text-muted-foreground">{st.desc}</span>
                </div>
                <p className="text-foreground/90 font-medium text-[11px] pt-0.5">
                  Example: <em>"{st.example}"</em>
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL 3: SOURCE HIERARCHY MATRIX
          ======================================================== */}
      <Dialog open={isSourceHierarchyOpen} onOpenChange={setIsSourceHierarchyOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              The Five-Tier Source Hierarchy
            </DialogTitle>
            <DialogDescription className="text-xs">
              Not all sources carry equal weight. Use this hierarchy to evaluate evidence strength.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">Tier 1 — Primary / Institutional Evidence</span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">Highest Weight</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Archaeological excavation reports, peer-reviewed scientific papers, original experimental data, museum collection registries, and original historical texts.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-cyan-500/40 bg-cyan-500/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">Tier 2 — Academic / Scholarly Sources</span>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-0 text-[10px]">High Weight</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                University press publications, scholarly textbooks, and academic archaeological monographs. Excellent for scholarly interpretations and historical context.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-blue-500/40 bg-blue-500/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400">Tier 3 — Reputable Secondary Sources</span>
                <Badge className="bg-blue-500/20 text-blue-300 border-0 text-[10px]">Medium Weight</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Major museum educational portals (British Museum, Smithsonian, Louvre), established science/history publications (National Geographic, Nature News, Scientific American). Useful for cross-checking.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">Tier 4 — General Internet Sources</span>
                <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">Leads Only</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                History blogs, Wikipedia summaries, enthusiast forums. Useful for discovering initial leads, but never use as the sole foundation for an important claim.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400">Tier 5 — Social Media / Other YouTube Videos</span>
                <Badge className="bg-rose-500/20 text-rose-300 border-0 text-[10px]">Verify Everything</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                TikTok, Reddit, other YouTube documentaries. Useful only to identify claims that competitors are repeating. Never treat another YouTuber's video as proof of a historical fact.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL 4: THE LANGUAGE OF CERTAINTY (NARRATION SCRIPTING)
          ======================================================== */}
      <Dialog open={isNarrationDrawerOpen} onOpenChange={setIsNarrationDrawerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <MessageSquareQuote className="h-5 w-5 text-amber-400" />
              The Language of Certainty (Narration Phrasing)
            </DialogTitle>
            <DialogDescription className="text-xs">
              How to responsibly phrase this claim in your voiceover script without overstating certainty.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-lg border border-border/80 bg-card space-y-1">
                <span className="font-mono text-muted-foreground text-[10px]">VERIFIED CLAIM</span>
                <p className="text-sm font-semibold text-foreground">{selectedRecord.claim}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className={`text-[10px] ${getStatusBadge(selectedRecord.status)}`}>
                    {selectedRecord.status}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${getConfidenceBadge(selectedRecord.confidence)}`}>
                    Confidence: {selectedRecord.confidence}
                  </Badge>
                  {selectedRecord.evidenceCategory && (
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300">
                      {selectedRecord.evidenceCategory}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-400 text-xs font-bold uppercase tracking-wider">
                    SUGGESTED NARRATION PHRASING
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedRecord.suggestedNarration) {
                        navigator.clipboard.writeText(selectedRecord.suggestedNarration);
                        setCopiedIndex(selectedRecord.num);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }
                    }}
                    className="h-6 text-[10px] gap-1 cursor-pointer text-amber-300"
                  >
                    {copiedIndex === selectedRecord.num ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedIndex === selectedRecord.num ? "Copied!" : "Copy Narration"}</span>
                  </Button>
                </div>
                <p className="text-sm font-medium text-foreground italic leading-relaxed bg-background/60 p-3 rounded-lg border border-border/60">
                  "{selectedRecord.suggestedNarration || selectedRecord.claim}"
                </p>
              </div>

              <div className="space-y-2 text-muted-foreground text-[11px] leading-relaxed">
                <p>
                  <strong className="text-foreground">Why this wording matters:</strong> In professional documentary production, if an experiment demonstrates feasibility (e.g. cutting granite with copper and sand), saying <em>"Experiments have demonstrated that..."</em> is accurate and builds profound audience trust, while saying <em>"This proves Egyptians definitely did it this way"</em> invites debunking.
                </p>
                <p>
                  <strong className="text-foreground">Don't hide uncertainty:</strong> If historians genuinely don't know the exact answer, stating <em>"We don't know exactly how this was done, but surviving evidence gives several clues..."</em> draws viewers in rather than weakening the documentary.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
