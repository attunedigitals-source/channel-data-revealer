import React, { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  FileSpreadsheet,
  Share2,
  HelpCircle,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Compass,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Flame,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  analyzeThumbnailComparisonServer,
  regenerateThumbnailConceptServer,
  generateHeuristicThumbnailComparison,
  DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS,
  CURATED_THUMBNAIL_PRESETS,
  type ThumbnailComparisonDossier,
  type CompetitorAnalysisRow,
  type ThumbnailVariationPreset,
} from "@/lib/thumbnail-comparison.functions";
import { fetchVideoMetadata } from "@/lib/thumbnail.functions";

interface ThumbnailAnalysisCreationSectionProps {
  apiKey?: string;
  aiApiKey?: string;
  onOpenKeyModal?: () => void;
}

export function ThumbnailAnalysisCreationSection({
  apiKey,
  aiApiKey,
  onOpenKeyModal,
}: ThumbnailAnalysisCreationSectionProps) {
  // Input state
  const [competitor1Title, setCompetitor1Title] = useState("");
  const [competitor1ThumbUrl, setCompetitor1ThumbUrl] = useState("");
  const [competitor1VideoUrl, setCompetitor1VideoUrl] = useState("");
  const [c1Mode, setC1Mode] = useState<"url" | "direct" | "upload">("url");

  const [competitor2Title, setCompetitor2Title] = useState("");
  const [competitor2ThumbUrl, setCompetitor2ThumbUrl] = useState("");
  const [competitor2VideoUrl, setCompetitor2VideoUrl] = useState("");
  const [c2Mode, setC2Mode] = useState<"url" | "direct" | "upload">("url");

  const [ourTitle, setOurTitle] = useState("");
  const [conceptNotes, setConceptNotes] = useState("");

  // Loading & status
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingC1Meta, setIsLoadingC1Meta] = useState(false);
  const [isLoadingC2Meta, setIsLoadingC2Meta] = useState(false);
  const [incomingNotice, setIncomingNotice] = useState<string | null>(null);

  // Analysis result
  const [dossier, setDossier] = useState<ThumbnailComparisonDossier | null>(null);

  // Regeneration & Variations State
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenerationFeedback, setRegenerationFeedback] = useState("");
  const [regenerationStyle, setRegenerationStyle] = useState("macro-precision");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("preset-seam");
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  // Visual Customizer Controls
  const [overlayText, setOverlayText] = useState("0.5mm SEAM");
  const [overlayBadge, setOverlayBadge] = useState("DOCUMENTARY");
  const [colorFilter, setColorFilter] = useState<"warm" | "teal" | "vivid" | "noir">("warm");
  const [showGrid, setShowGrid] = useState(false);
  const [showTextOverlay, setShowTextOverlay] = useState(true);
  const [showFeedSimulator, setShowFeedSimulator] = useState(true);
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState(false);
  const [copiedPromptType, setCopiedPromptType] = useState<string | null>(null);
  const [copiedTable, setCopiedTable] = useState(false);

  // Canvas ref for generating downloadable 1280x720 PNG
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  const runAnalysis = useServerFn(analyzeThumbnailComparisonServer);
  const runRegenerate = useServerFn(regenerateThumbnailConceptServer);
  const getMeta = useServerFn(fetchVideoMetadata);

  // Listen for title dispatched from Title Generator section
  useEffect(() => {
    const handleIncomingTitle = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail) return;

      let extractedTitle = "";
      if (typeof detail === "string") {
        extractedTitle = detail;
      } else if (Array.isArray(detail) && detail[0]) {
        extractedTitle = detail[0].workingTitle || detail[0].title || "";
      } else if (detail.workingTitle || detail.title) {
        extractedTitle = detail.workingTitle || detail.title;
      }

      if (extractedTitle) {
        setOurTitle(extractedTitle);
        setIncomingNotice(`Received title "${extractedTitle}" from Title Generator!`);
        setTimeout(() => setIncomingNotice(null), 5000);
        sectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    window.addEventListener("load-title-to-thumbnail", handleIncomingTitle);
    return () => {
      window.removeEventListener("load-title-to-thumbnail", handleIncomingTitle);
    };
  }, []);

  // Sync default exemplar when loaded
  const loadEgyptianExemplar = () => {
    setCompetitor1Title(DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.competitor1.title);
    setCompetitor1ThumbUrl(DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.competitor1.thumbnailUrl);
    setCompetitor2Title(DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.competitor2.title);
    setCompetitor2ThumbUrl(DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.competitor2.thumbnailUrl);
    setOurTitle(DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.targetTitle);
    setConceptNotes("Focus on archaeological engineering tolerances, Petrie core #7 striations, and Giza sub-millimeter casing seams.");
    setDossier(DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS);
    setOverlayText(DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.generatedThumbnail.recommendedOverlayText);
    setOverlayBadge(DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.generatedThumbnail.recommendedBadge);
  };

  // Auto-fetch Competitor 1 metadata from YouTube URL
  const handleC1UrlBlur = async () => {
    const url = competitor1VideoUrl.trim();
    if (!url) return;
    setIsLoadingC1Meta(true);
    try {
      const meta = await getMeta({ data: { videoUrl: url, apiKey: apiKey || undefined } });
      if (meta?.title) {
        setCompetitor1Title(meta.title);
      }
      if (meta?.thumbnail) {
        setCompetitor1ThumbUrl(meta.thumbnail);
      }
    } catch (err) {
      console.warn("Failed to fetch C1 metadata:", err);
    } finally {
      setIsLoadingC1Meta(false);
    }
  };

  // Auto-fetch Competitor 2 metadata from YouTube URL
  const handleC2UrlBlur = async () => {
    const url = competitor2VideoUrl.trim();
    if (!url) return;
    setIsLoadingC2Meta(true);
    try {
      const meta = await getMeta({ data: { videoUrl: url, apiKey: apiKey || undefined } });
      if (meta?.title) {
        setCompetitor2Title(meta.title);
      }
      if (meta?.thumbnail) {
        setCompetitor2ThumbUrl(meta.thumbnail);
      }
    } catch (err) {
      console.warn("Failed to fetch C2 metadata:", err);
    } finally {
      setIsLoadingC2Meta(false);
    }
  };

  // File upload reader
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "c1" | "c2"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (target === "c1") {
        setCompetitor1ThumbUrl(dataUrl);
      } else {
        setCompetitor2ThumbUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Execute Analysis
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ourTitle.trim() || !competitor1Title.trim() || !competitor2Title.trim()) {
      alert("Please provide titles for Competitor 1, Competitor 2, and Our Video.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await runAnalysis({
        data: {
          ourTitle: ourTitle.trim(),
          competitor1Title: competitor1Title.trim(),
          competitor1ThumbUrl: competitor1ThumbUrl.trim() || undefined,
          competitor2Title: competitor2Title.trim(),
          competitor2ThumbUrl: competitor2ThumbUrl.trim() || undefined,
          conceptNotes: conceptNotes.trim() || undefined,
          aiApiKey: aiApiKey || undefined,
        },
      });
      setDossier(res);
      setOverlayText(res.generatedThumbnail.recommendedOverlayText || "REVEALED");
      setOverlayBadge(res.generatedThumbnail.recommendedBadge || "DOCUMENTARY");
    } catch (err) {
      console.warn("Server comparison failed, falling back to heuristic engine:", err);
      const fallback = generateHeuristicThumbnailComparison({
        ourTitle: ourTitle.trim(),
        competitor1Title: competitor1Title.trim(),
        competitor1ThumbUrl: competitor1ThumbUrl.trim() || undefined,
        competitor2Title: competitor2Title.trim(),
        competitor2ThumbUrl: competitor2ThumbUrl.trim() || undefined,
        conceptNotes: conceptNotes.trim() || undefined,
      });
      setDossier(fallback);
      setOverlayText(fallback.generatedThumbnail.recommendedOverlayText);
      setOverlayBadge(fallback.generatedThumbnail.recommendedBadge);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Switch to a curated thumbnail variation preset
  const handleSelectPreset = (preset: ThumbnailVariationPreset) => {
    setSelectedPresetId(preset.id);
    setCustomImageUrl(null); // Clear custom upload override so preset image displays
    setOverlayText(preset.overlayText);
    setOverlayBadge(preset.badge);
    setColorFilter(preset.colorFilter);

    if (dossier) {
      setDossier({
        ...dossier,
        ourStrategy: {
          ...dossier.ourStrategy,
          thumbnailUrl: preset.imageUrl,
          thumbnailSubject: preset.focalSubject,
          thumbnailQuestion: preset.thumbnailQuestion,
          titlePromise: preset.titlePromise,
          thumbnailPromise: preset.thumbnailPromise,
          howTheyWorkTogether: preset.howTheyWorkTogether,
        },
        generatedThumbnail: {
          ...dossier.generatedThumbnail,
          imageUrl: preset.imageUrl,
          focalSubject: preset.focalSubject,
          promptMidjourney: preset.promptMidjourney,
          promptDalleFlux: preset.promptDalleFlux,
          recommendedOverlayText: preset.overlayText,
          recommendedBadge: preset.badge,
        },
      });
    }

    setIncomingNotice(`Switched to "${preset.name}" variation`);
    setTimeout(() => setIncomingNotice(null), 3000);
  };

  // Direct 1-Click quick thumbnail regeneration (cycles to next angle or generates fresh concept)
  const handleQuickRegenerateThumbnail = async () => {
    if (!ourTitle.trim()) {
      alert("Please provide a video title first.");
      return;
    }

    setIsRegenerating(true);
    setCustomImageUrl(null); // Clear custom upload so new generation displays immediately

    const currentIndex = CURATED_THUMBNAIL_PRESETS.findIndex((p) => p.id === selectedPresetId);
    const nextIndex = (currentIndex + 1) % CURATED_THUMBNAIL_PRESETS.length;
    const nextPreset = CURATED_THUMBNAIL_PRESETS[nextIndex];

    try {
      const res = await runRegenerate({
        data: {
          ourTitle: ourTitle.trim(),
          conceptNotes: conceptNotes.trim() || undefined,
          currentPresetId: selectedPresetId,
          aiApiKey: aiApiKey || undefined,
        },
      });

      if (dossier) {
        setDossier({
          ...dossier,
          ourStrategy: res.ourStrategy,
          generatedThumbnail: res.concept,
        });
      }

      setSelectedPresetId(res.selectedPresetId || nextPreset.id);
      setOverlayText(res.concept.recommendedOverlayText || nextPreset.overlayText);
      setOverlayBadge(res.concept.recommendedBadge || nextPreset.badge);
      if (res.colorFilter) {
        setColorFilter(res.colorFilter as any);
      } else {
        setColorFilter(nextPreset.colorFilter);
      }

      setIncomingNotice(`Thumbnail regenerated: ${res.feedbackApplied || nextPreset.name}`);
      setTimeout(() => setIncomingNotice(null), 4000);
    } catch (err) {
      console.warn("Direct regeneration fallback to next preset:", err);
      handleSelectPreset(nextPreset);
      setIncomingNotice(`Regenerated to angle: "${nextPreset.name}"`);
      setTimeout(() => setIncomingNotice(null), 4000);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Re-generate thumbnail concept with custom user critique / feedback
  const handleRegenerateWithFeedback = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ourTitle.trim()) {
      alert("Please provide a video title first.");
      return;
    }

    setIsRegenerating(true);
    setCustomImageUrl(null); // Clear custom upload so new generation displays immediately

    try {
      const res = await runRegenerate({
        data: {
          ourTitle: ourTitle.trim(),
          conceptNotes: conceptNotes.trim() || undefined,
          feedback: regenerationFeedback.trim() || undefined,
          styleAngle: regenerationStyle || undefined,
          currentPresetId: selectedPresetId,
          aiApiKey: aiApiKey || undefined,
        },
      });

      if (dossier) {
        setDossier({
          ...dossier,
          ourStrategy: res.ourStrategy,
          generatedThumbnail: res.concept,
        });
      }

      setSelectedPresetId(res.selectedPresetId || selectedPresetId);
      setOverlayText(res.concept.recommendedOverlayText || "SOLVED");
      setOverlayBadge(res.concept.recommendedBadge || "DOCUMENTARY");
      if (res.colorFilter) {
        setColorFilter(res.colorFilter as any);
      }
      setIsRegenerateModalOpen(false);
      setRegenerationFeedback("");
      setIncomingNotice(`Thumbnail re-generated: ${res.feedbackApplied}`);
      setTimeout(() => setIncomingNotice(null), 4000);
    } catch (err) {
      console.warn("Regeneration failed, switching to alternative preset:", err);
      const nextPreset =
        CURATED_THUMBNAIL_PRESETS.find((p) => p.id !== selectedPresetId) ||
        CURATED_THUMBNAIL_PRESETS[1];
      handleSelectPreset(nextPreset);
      setIsRegenerateModalOpen(false);
      setIncomingNotice(`Generated alternative variation: ${nextPreset.name}`);
      setTimeout(() => setIncomingNotice(null), 4000);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Custom user image upload for thumbnail canvas composer
  const handleThumbnailImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomImageUrl(dataUrl);
      setIncomingNotice("Custom thumbnail image loaded into canvas!");
      setTimeout(() => setIncomingNotice(null), 3000);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Draw customized thumbnail on HTML5 Canvas and trigger PNG download
  const handleDownloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = customImageUrl || dossier?.generatedThumbnail.imageUrl || "/thumbnails/our-target-egypt.jpg";

    img.onload = () => {
      // 1. Draw base image
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Apply color grade filter overlay
      if (colorFilter === "warm") {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "rgba(255, 140, 0, 0.15)");
        grad.addColorStop(1, "rgba(255, 69, 0, 0.25)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (colorFilter === "teal") {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "rgba(0, 206, 209, 0.2)");
        grad.addColorStop(1, "rgba(0, 50, 100, 0.35)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (colorFilter === "vivid") {
        ctx.fillStyle = "rgba(255, 200, 0, 0.08)";
        ctx.fillRect(0, 0, width, height);
      } else if (colorFilter === "noir") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Subtle cinematic vignette to guarantee text legibility
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.3,
        width / 2,
        height / 2,
        width * 0.75
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.65)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // 4. Draw Text Overlay if enabled
      if (showTextOverlay && overlayText.trim()) {
        const text = overlayText.trim().toUpperCase();
        ctx.save();
        ctx.font = "900 86px 'Impact', 'Montserrat', sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const textX = 70;
        const textY = height - 120;

        // Heavy dark shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 6;

        // Black stroke outline
        ctx.lineWidth = 14;
        ctx.strokeStyle = "#000000";
        ctx.strokeText(text, textX, textY);

        // Vibrant Fill (Bright Yellow/Gold for maximum CTR)
        ctx.fillStyle = "#FFEA00";
        ctx.fillText(text, textX, textY);
        ctx.restore();
      }

      // 5. Draw Badge Tag
      if (overlayBadge.trim()) {
        ctx.save();
        const badgeText = overlayBadge.trim().toUpperCase();
        ctx.font = "700 28px 'Inter', sans-serif";
        const textMetrics = ctx.measureText(badgeText);
        const paddingX = 22;
        const badgeWidth = textMetrics.width + paddingX * 2;
        const badgeHeight = 46;
        const badgeX = 70;
        const badgeY = 60;

        // Badge background (pill)
        ctx.fillStyle = "rgba(220, 38, 38, 0.95)"; // YouTube Red
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
        ctx.fill();

        // Badge text
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 1);
        ctx.restore();
      }

      // Download as 1280x720 PNG
      const link = document.createElement("a");
      link.download = `youtube_thumbnail_${ourTitle.slice(0, 25).replace(/\s+/g, "_")}_1280x720.png`;
      link.href = canvas.toDataURL("image/png", 0.95);
      link.click();
    };
  };

  // Export Our Video Report Table to CSV
  const handleExportCsv = () => {
    if (!dossier) return;
    const headers = [
      "Concept",
      "Thumbnail Subject",
      "Thumbnail Question",
      "Title Promise",
      "Thumbnail Promise",
      "How they work Together",
    ];
    const rows = [
      [
        "Concept 1 (Primary)",
        `"${dossier.ourStrategy.thumbnailSubject.replace(/"/g, '""')}"`,
        `"${dossier.ourStrategy.thumbnailQuestion.replace(/"/g, '""')}"`,
        `"${dossier.ourStrategy.titlePromise.replace(/"/g, '""')}"`,
        `"${dossier.ourStrategy.thumbnailPromise.replace(/"/g, '""')}"`,
        `"${dossier.ourStrategy.howTheyWorkTogether.replace(/"/g, '""')}"`,
      ],
    ];

    if (dossier.ourAlternativeStrategy) {
      rows.push([
        "Concept 2 (Alternative)",
        `"${dossier.ourAlternativeStrategy.thumbnailSubject.replace(/"/g, '""')}"`,
        `"${dossier.ourAlternativeStrategy.thumbnailQuestion.replace(/"/g, '""')}"`,
        `"${dossier.ourAlternativeStrategy.titlePromise.replace(/"/g, '""')}"`,
        `"${dossier.ourAlternativeStrategy.thumbnailPromise.replace(/"/g, '""')}"`,
        `"${dossier.ourAlternativeStrategy.howTheyWorkTogether.replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `thumbnail_report_${dossier.targetTitle.slice(0, 20).replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Markdown Report for Our Video to Clipboard
  const handleCopyMarkdown = () => {
    if (!dossier) return;
    const md = `### Generated Packaging Report for: "${dossier.targetTitle}"

| Concept | Thumbnail Subject | Thumbnail Question | Title Promise | Thumbnail Promise | How they work Together |
|---|---|---|---|---|---|
| **Concept 1: Primary Blueprint** | ${dossier.ourStrategy.thumbnailSubject} | ${dossier.ourStrategy.thumbnailQuestion} | ${dossier.ourStrategy.titlePromise} | ${dossier.ourStrategy.thumbnailPromise} | ${dossier.ourStrategy.howTheyWorkTogether} |
${dossier.ourAlternativeStrategy ? `| **Concept 2: High-Curiosity Angle** | ${dossier.ourAlternativeStrategy.thumbnailSubject} | ${dossier.ourAlternativeStrategy.thumbnailQuestion} | ${dossier.ourAlternativeStrategy.titlePromise} | ${dossier.ourAlternativeStrategy.thumbnailPromise} | ${dossier.ourAlternativeStrategy.howTheyWorkTogether} |\n` : ""}`;
    navigator.clipboard.writeText(md);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 3000);
  };

  return (
    <section
      id="thumbnail-lab"
      ref={sectionRef}
      className="mx-auto max-w-6xl px-6 py-14 space-y-10 border-t border-border/80"
    >
      {/* Hidden canvas for PNG export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Cross-section Notification Toast */}
      {incomingNotice && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-lg border border-primary/40 bg-card/95 p-3.5 text-xs text-foreground shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>{incomingNotice}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
              <ImageIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">
              Week 1 • Day 4 Packaging System
            </span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] h-4">
              5-Pillar Synergy Engine
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Thumbnail Analysis & Creation Studio
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Analyze 2 competitor thumbnails viz-a-viz their titles across the <strong>5 core packaging pillars</strong>.
            Then engineer and visually generate a superior, high-CTR thumbnail for your target title.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStudyGuideOpen(true)}
            className="h-8 gap-1.5 border-border text-xs cursor-pointer hover:bg-accent"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Day 4 Study Guide</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadEgyptianExemplar}
            className="h-8 gap-1.5 text-xs cursor-pointer bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Load Egyptian Exemplar</span>
          </Button>
        </div>
      </div>

      {/* Input Cards: 3 Columns (C1, C2, Target) */}
      <form onSubmit={handleAnalyze} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Competitor 1 Card */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Competitor 1
              </span>
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setC1Mode("url")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    c1Mode === "url" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  YT URL
                </button>
                <button
                  type="button"
                  onClick={() => setC1Mode("direct")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    c1Mode === "direct" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Direct
                </button>
                <button
                  type="button"
                  onClick={() => setC1Mode("upload")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    c1Mode === "upload" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* C1 URL or Image inputs */}
            {c1Mode === "url" && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-medium">YouTube Video URL</label>
                <div className="relative">
                  <Input
                    value={competitor1VideoUrl}
                    onChange={(e) => setCompetitor1VideoUrl(e.target.value)}
                    onBlur={handleC1UrlBlur}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-8 text-xs pr-7"
                  />
                  {isLoadingC1Meta && (
                    <RefreshCw className="h-3 w-3 animate-spin absolute right-2.5 top-2.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            )}

            {c1Mode === "direct" && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-medium">Image URL</label>
                <Input
                  value={competitor1ThumbUrl}
                  onChange={(e) => setCompetitor1ThumbUrl(e.target.value)}
                  placeholder="https://.../thumbnail.jpg"
                  className="h-8 text-xs"
                />
              </div>
            )}

            {c1Mode === "upload" && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-medium">Upload Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "c1")}
                  className="h-8 text-xs cursor-pointer"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Video Title</label>
              <Input
                value={competitor1Title}
                onChange={(e) => setCompetitor1Title(e.target.value)}
                placeholder="Competitor 1 Video Title..."
                className="h-8 text-xs"
                required
              />
            </div>

            {/* Thumbnail Preview 16:9 */}
            <div className="aspect-video w-full rounded-lg border border-border/80 bg-muted/40 overflow-hidden relative group">
              {competitor1ThumbUrl ? (
                <img
                  src={competitor1ThumbUrl}
                  alt="Competitor 1"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60 text-xs gap-1.5">
                  <ImageIcon className="h-5 w-5" />
                  <span>Thumbnail Preview</span>
                </div>
              )}
            </div>
          </div>

          {/* Competitor 2 Card */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Competitor 2
              </span>
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setC2Mode("url")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    c2Mode === "url" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  YT URL
                </button>
                <button
                  type="button"
                  onClick={() => setC2Mode("direct")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    c2Mode === "direct" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Direct
                </button>
                <button
                  type="button"
                  onClick={() => setC2Mode("upload")}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    c2Mode === "upload" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* C2 URL or Image inputs */}
            {c2Mode === "url" && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-medium">YouTube Video URL</label>
                <div className="relative">
                  <Input
                    value={competitor2VideoUrl}
                    onChange={(e) => setCompetitor2VideoUrl(e.target.value)}
                    onBlur={handleC2UrlBlur}
                    placeholder="https://youtube.com/watch?v=..."
                    className="h-8 text-xs pr-7"
                  />
                  {isLoadingC2Meta && (
                    <RefreshCw className="h-3 w-3 animate-spin absolute right-2.5 top-2.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            )}

            {c2Mode === "direct" && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-medium">Image URL</label>
                <Input
                  value={competitor2ThumbUrl}
                  onChange={(e) => setCompetitor2ThumbUrl(e.target.value)}
                  placeholder="https://.../thumbnail.jpg"
                  className="h-8 text-xs"
                />
              </div>
            )}

            {c2Mode === "upload" && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-medium">Upload Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "c2")}
                  className="h-8 text-xs cursor-pointer"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Video Title</label>
              <Input
                value={competitor2Title}
                onChange={(e) => setCompetitor2Title(e.target.value)}
                placeholder="Competitor 2 Video Title..."
                className="h-8 text-xs"
                required
              />
            </div>

            {/* Thumbnail Preview 16:9 */}
            <div className="aspect-video w-full rounded-lg border border-border/80 bg-muted/40 overflow-hidden relative group">
              {competitor2ThumbUrl ? (
                <img
                  src={competitor2ThumbUrl}
                  alt="Competitor 2"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60 text-xs gap-1.5">
                  <ImageIcon className="h-5 w-5" />
                  <span>Thumbnail Preview</span>
                </div>
              )}
            </div>
          </div>

          {/* Our Target Video Card */}
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-card/70 to-card/90 p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 fill-current text-amber-500" />
                Our Video (The Target)
              </span>
              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px] h-4">
                Winning Blueprint
              </Badge>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Our Video Title</label>
              <Input
                value={ourTitle}
                onChange={(e) => setOurTitle(e.target.value)}
                placeholder="e.g. How Did Ancient Egyptians Achieve Such Precise Stonework?"
                className="h-8 text-xs font-medium border-amber-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">
                Target Angle / Visual Concept (Optional)
              </label>
              <Textarea
                value={conceptNotes}
                onChange={(e) => setConceptNotes(e.target.value)}
                placeholder="e.g. Highlight the sub-millimeter joint tolerance and drill core striations..."
                className="h-16 text-xs resize-none"
              />
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                disabled={isAnalyzing}
                className="w-full h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-md cursor-pointer gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing Competitors & Generating Blueprint...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Analyze 2 Competitors & Generate Winning Thumbnail</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Main Analysis Output Area */}
      {dossier && (
        <div className="space-y-8 animate-in fade-in">
          {/* 1. Competitor Benchmark & Strategic Gap Analysis Card */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-xs font-semibold">
                  Competitor Intelligence
                </Badge>
                <h4 className="text-sm font-bold text-foreground">
                  Analysis of 2 Sample Competitor Packages (Viz-a-Viz Titles & Thumbnails)
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Informing the strategic differentiation of our video package
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Competitor 1 Benchmark */}
              <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-border/80 bg-black/20">
                    <img
                      src={dossier.competitor1.thumbnailUrl || "/thumbnails/competitor1-egypt.jpg"}
                      alt="Competitor 1"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-1 left-1">
                      <Badge className="bg-blue-600/90 text-white border-0 text-[9px] px-1 py-0 h-3.5">
                        Sample 1
                      </Badge>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-foreground text-xs line-clamp-2">
                      {dossier.competitor1.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      <strong className="text-foreground/90">Visual Subject:</strong> {dossier.competitor1.thumbnailSubject}
                    </p>
                  </div>
                </div>

                <div className="grid gap-1.5 text-[11px] bg-muted/20 rounded p-2.5 border border-border/40">
                  <p className="text-foreground/80">
                    <strong className="text-blue-400">Title Promise:</strong> {dossier.competitor1.titlePromise}
                  </p>
                  <p className="text-amber-300/90 italic">
                    <strong className="text-foreground/80 not-italic">Visual Question:</strong> "{dossier.competitor1.thumbnailQuestion}"
                  </p>
                  <p className="text-muted-foreground pt-1 border-t border-border/40">
                    <strong className="text-red-400">Competitive Flaw / Blindspot:</strong> {dossier.competitor1.visualFlawsOrGaps?.[0] || "Relies on generic tropes without showing true precision artifacts."}
                  </p>
                </div>
              </div>

              {/* Competitor 2 Benchmark */}
              <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-border/80 bg-black/20">
                    <img
                      src={dossier.competitor2.thumbnailUrl || "/thumbnails/competitor2-egypt.jpg"}
                      alt="Competitor 2"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-1 left-1">
                      <Badge className="bg-purple-600/90 text-white border-0 text-[9px] px-1 py-0 h-3.5">
                        Sample 2
                      </Badge>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-foreground text-xs line-clamp-2">
                      {dossier.competitor2.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      <strong className="text-foreground/90">Visual Subject:</strong> {dossier.competitor2.thumbnailSubject}
                    </p>
                  </div>
                </div>

                <div className="grid gap-1.5 text-[11px] bg-muted/20 rounded p-2.5 border border-border/40">
                  <p className="text-foreground/80">
                    <strong className="text-purple-400">Title Promise:</strong> {dossier.competitor2.titlePromise}
                  </p>
                  <p className="text-amber-300/90 italic">
                    <strong className="text-foreground/80 not-italic">Visual Question:</strong> "{dossier.competitor2.thumbnailQuestion}"
                  </p>
                  <p className="text-muted-foreground pt-1 border-t border-border/40">
                    <strong className="text-red-400">Competitive Flaw / Blindspot:</strong> {dossier.competitor2.visualFlawsOrGaps?.[0] || "Flirts with sensationalist tropes instead of authoritative proof."}
                  </p>
                </div>
              </div>
            </div>

            {/* Strategic Synthesis & Market Gap */}
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/25 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Zap className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Market Gap & Winning Differentiation Strategy</span>
              </div>
              <p className="text-foreground/90 leading-relaxed text-[11px]">
                <strong className="text-indigo-400">The Blind Spot:</strong> {dossier.competitiveSynthesis.gapInTheMarket}
              </p>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                <strong className="text-foreground/90">Our Edge:</strong> {dossier.competitiveSynthesis.visualDifferentiationAngle} {dossier.competitiveSynthesis.howToOutperformBoth}
              </p>
            </div>
          </div>

          {/* 2. Main Generated Report Table (STRICTLY FOR OUR VIDEO TITLE) */}
          <div className="rounded-xl border border-amber-500/40 bg-card shadow-lg overflow-hidden space-y-0">
            {/* Report Header Bar */}
            <div className="bg-gradient-to-r from-amber-950/40 via-card to-orange-950/30 px-6 py-4 border-b border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-black font-extrabold text-[10px] tracking-wider uppercase">
                    OUR VIDEO REPORT
                  </Badge>
                  <span className="text-xs text-amber-400 font-medium">Day 4 Packaging Formula</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Packaging Report for: <span className="text-amber-400">"{dossier.targetTitle}"</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  The 5 Core Pillars derived from the competitor analysis & the Rule of Multiplication.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  className="h-8 text-xs gap-1.5 cursor-pointer border-amber-500/30 bg-background/60 hover:bg-amber-500/10 text-amber-300"
                >
                  {copiedTable ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedTable ? "Copied" : "Copy Report"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  className="h-8 text-xs gap-1.5 cursor-pointer border-amber-500/30 bg-background/60 hover:bg-amber-500/10 text-amber-300"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>

            {/* The 5-Column Matrix Table (STRICTLY FOR OUR VIDEO TITLE) */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/70 text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-left w-64">Thumbnail Subject</th>
                    <th className="px-5 py-3.5 text-left w-56">Thumbnail Question</th>
                    <th className="px-5 py-3.5 text-left w-56">Title Promise</th>
                    <th className="px-5 py-3.5 text-left w-56">Thumbnail Promise</th>
                    <th className="px-5 py-3.5 text-left w-72">How they work Together</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {/* Row 1: Primary Winning Blueprint */}
                  <tr className="bg-amber-950/15 hover:bg-amber-950/25 transition-colors">
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-1.5">
                        <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px] font-bold">
                          CONCEPT 1: PRIMARY BLUEPRINT
                        </Badge>
                        <p className="text-foreground leading-relaxed font-medium">
                          {dossier.ourStrategy.thumbnailSubject}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-amber-300 leading-relaxed italic">
                        "{dossier.ourStrategy.thumbnailQuestion}"
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top text-foreground/90 leading-relaxed">
                      {dossier.ourStrategy.titlePromise}
                    </td>
                    <td className="px-5 py-4 align-top text-foreground/90 leading-relaxed">
                      {dossier.ourStrategy.thumbnailPromise}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <p className="font-medium text-amber-100/90 leading-relaxed">
                        {dossier.ourStrategy.howTheyWorkTogether}
                      </p>
                    </td>
                  </tr>

                  {/* Row 2: Alternative Concept (Option B) if available */}
                  {dossier.ourAlternativeStrategy && (
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1.5">
                          <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-[10px] font-bold">
                            CONCEPT 2: HIGH-CURIOSITY ANGLE
                          </Badge>
                          <p className="text-foreground/90 leading-relaxed font-medium">
                            {dossier.ourAlternativeStrategy.thumbnailSubject}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold text-blue-300 leading-relaxed italic">
                          "{dossier.ourAlternativeStrategy.thumbnailQuestion}"
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-foreground/80 leading-relaxed">
                        {dossier.ourAlternativeStrategy.titlePromise}
                      </td>
                      <td className="px-5 py-4 align-top text-foreground/80 leading-relaxed">
                        {dossier.ourAlternativeStrategy.thumbnailPromise}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-muted-foreground leading-relaxed">
                          {dossier.ourAlternativeStrategy.howTheyWorkTogether}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==========================================================
              VISUAL CREATION STUDIO & LIVE THUMBNAIL COMPOSER
              ========================================================== */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-card/90 to-card p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-black font-black text-xs">
                    ★
                  </span>
                  <h4 className="text-base font-bold text-foreground">
                    Generated High-CTR Thumbnail Asset
                  </h4>
                  <Badge className="bg-amber-500/15 text-amber-300 border-0 text-[10px]">
                    16:9 Cinema Grade
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Engineered using the competitor visual analysis. Customize typography, color grading, and download in 1280x720.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Direct 1-Click Instant Regenerate Button */}
                <Button
                  size="sm"
                  onClick={handleQuickRegenerateThumbnail}
                  disabled={isRegenerating}
                  className="h-8 gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs cursor-pointer shadow-md"
                  title="Directly regenerate thumbnail with a fresh visual angle and concept"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                  <span>{isRegenerating ? "Regenerating..." : "Regenerate Thumbnail"}</span>
                </Button>

                {/* 2. Steer with Feedback Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegenerateModalOpen(true)}
                  className="h-8 gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-semibold cursor-pointer shadow-sm"
                  title="Open feedback modal to steer style, lighting, or specific critique"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Steer with Feedback</span>
                </Button>

                {/* 3. Download Thumbnail Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadThumbnail}
                  className="h-8 gap-1.5 border-border hover:bg-muted text-foreground text-xs font-semibold cursor-pointer shadow-sm"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Download (1280x720 PNG)</span>
                </Button>
              </div>
            </div>

            {/* Visual Variation Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/50 p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 pr-1">
                  <Sparkles className="h-3 w-3" /> Variations:
                </span>
                {CURATED_THUMBNAIL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                      selectedPresetId === preset.id
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm font-semibold"
                        : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickRegenerateThumbnail}
                  disabled={isRegenerating}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer py-1 px-2 rounded hover:bg-amber-500/10 disabled:opacity-50"
                  title="Cycle to next visual variation"
                >
                  <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />
                  <span>Next Angle</span>
                </button>
              </div>
            </div>

            {/* Visual Canvas Display & Customizer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live Interactive 16:9 Viewport (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="relative aspect-video w-full rounded-xl border-2 border-amber-500/40 bg-black overflow-hidden shadow-2xl group select-none">
                  {/* Base Thumbnail Image */}
                  <img
                    src={customImageUrl || dossier.generatedThumbnail.imageUrl || "/thumbnails/our-target-egypt.jpg"}
                    alt="Our Generated Thumbnail"
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      colorFilter === "warm"
                        ? "contrast-110 saturate-125 sepia-[0.15]"
                        : colorFilter === "teal"
                        ? "contrast-120 hue-rotate-15 saturate-110"
                        : colorFilter === "vivid"
                        ? "contrast-125 saturate-150"
                        : "contrast-130 grayscale-[0.25]"
                    }`}
                  />

                  {/* Cinematic Bottom Vignette Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Rule of Thirds Grid Overlay Toggle */}
                  {showGrid && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/20">
                      <div className="border-r border-b border-white/30"></div>
                      <div className="border-r border-b border-white/30"></div>
                      <div className="border-b border-white/30"></div>
                      <div className="border-r border-b border-white/30"></div>
                      <div className="border-r border-b border-white/30"></div>
                      <div className="border-b border-white/30"></div>
                      <div className="border-r border-white/30"></div>
                      <div className="border-r border-white/30"></div>
                      <div></div>
                    </div>
                  )}

                  {/* Badge Sticker Overlay */}
                  {overlayBadge && (
                    <div className="absolute top-3.5 left-4 z-20">
                      <span className="px-2.5 py-1 rounded bg-red-600/95 text-white font-extrabold text-[11px] tracking-wider uppercase shadow-lg border border-red-400/40">
                        {overlayBadge}
                      </span>
                    </div>
                  )}

                  {/* Bold Complementary Text Overlay */}
                  {showTextOverlay && overlayText.trim() && (
                    <div className="absolute bottom-4 left-4 z-20 max-w-[80%]">
                      <span
                        className="text-3xl sm:text-4xl md:text-5xl font-black text-[#FFEA00] tracking-tighter uppercase leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
                        style={{
                          WebkitTextStroke: "2px #000000",
                          fontFamily: "'Impact', 'Montserrat', sans-serif",
                        }}
                      >
                        {overlayText}
                      </span>
                    </div>
                  )}

                  {/* Video duration stamp (YouTube simulator) */}
                  <div className="absolute bottom-2.5 right-3 z-20">
                    <span className="px-1.5 py-0.5 rounded bg-black/85 text-white font-bold text-[10px] tracking-wide font-mono">
                      18:42
                    </span>
                  </div>
                </div>

                {/* Viewport Action bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                        className="rounded border-border text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>Rule of Thirds</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                      <input
                        type="checkbox"
                        checked={showTextOverlay}
                        onChange={(e) => setShowTextOverlay(e.target.checked)}
                        className="rounded border-border text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>Text Overlay</span>
                    </label>
                  </div>

                  {/* Custom Image Upload/Replace Option */}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer">
                      <Upload className="h-3 w-3" />
                      <span>{customImageUrl ? "Swap Image" : "Upload Custom Generation"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailImageUpload}
                        className="hidden"
                      />
                    </label>
                    {customImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomImageUrl(null);
                          setIncomingNotice("Reset to generated thumbnail asset.");
                          setTimeout(() => setIncomingNotice(null), 3000);
                        }}
                        className="text-[11px] text-muted-foreground hover:text-red-400 cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-[11px] text-amber-400/80 font-mono hidden sm:inline">
                      1280 × 720 (16:9)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Customizer Controls & Prompts (5 cols) */}
              <div className="lg:col-span-5 space-y-4 text-xs">
                {/* Text and Badge Customizer */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-3">
                  <h5 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-amber-400" />
                    <span>Visual Graphic Customizer</span>
                  </h5>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                      <span>Complementary Text (Max 1-3 Words)</span>
                      <span className="text-[10px] text-amber-400 font-bold">Rule of Multiplication</span>
                    </label>
                    <Input
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="e.g. 0.5mm SEAM"
                      className="h-8 text-xs font-bold uppercase tracking-wider"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Badge Pill</label>
                      <Input
                        value={overlayBadge}
                        onChange={(e) => setOverlayBadge(e.target.value)}
                        placeholder="e.g. DOCUMENTARY"
                        className="h-7 text-[11px] uppercase font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Color Grading</label>
                      <select
                        value={colorFilter}
                        onChange={(e) => setColorFilter(e.target.value as any)}
                        className="w-full h-7 rounded-md border border-border bg-background px-2 text-[11px] cursor-pointer"
                      >
                        <option value="warm">Warm Amber Sunset</option>
                        <option value="teal">Cinematic Teal & Orange</option>
                        <option value="vivid">High-Contrast Vivid</option>
                        <option value="noir">Dramatic Noir Shadow</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* AI Prompt Studio (Midjourney / Flux) */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      <span>AI Image Generation Prompts</span>
                    </h5>
                    <Badge variant="outline" className="text-[9px] h-4">
                      Midjourney v6 • Flux
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Copy these ready-to-run prompts directly into Midjourney, Flux.1, or DALL-E 3:
                  </p>

                  <div className="space-y-2">
                    {/* Midjourney Prompt */}
                    <div className="p-2 rounded bg-background border border-border space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">Midjourney v6 Prompt</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(dossier.generatedThumbnail.promptMidjourney);
                            setCopiedPromptType("midjourney");
                            setTimeout(() => setCopiedPromptType(null), 2500);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer flex items-center gap-1"
                        >
                          {copiedPromptType === "midjourney" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedPromptType === "midjourney" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono line-clamp-3 select-all">
                        {dossier.generatedThumbnail.promptMidjourney}
                      </p>
                    </div>

                    {/* Flux / DALL-E Prompt */}
                    <div className="p-2 rounded bg-background border border-border space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">Flux.1 / DALL-E 3 Prompt</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(dossier.generatedThumbnail.promptDalleFlux);
                            setCopiedPromptType("flux");
                            setTimeout(() => setCopiedPromptType(null), 2500);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer flex items-center gap-1"
                        >
                          {copiedPromptType === "flux" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedPromptType === "flux" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono line-clamp-3 select-all">
                        {dossier.generatedThumbnail.promptDalleFlux}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workflow Navigation Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("load-to-storymap", {
                          detail: [{ workingTitle: ourTitle }],
                        })
                      );
                      const el = document.getElementById("story-map");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex-1 text-[11px] h-8 gap-1.5 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Send to Story Map</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("load-to-fact-verification", {
                          detail: {
                            storyTitle: ourTitle,
                            coreQuestion: dossier.ourStrategy.thumbnailQuestion,
                            claims: [
                              { claim: "Ancient Egyptians worked crystalline igneous rocks." },
                              { claim: "Aswan granite has high hardness." },
                              { claim: "Dolerite pounders were used." },
                              { claim: "Copper tools were used in stoneworking." },
                              { claim: "Abrasives were used." },
                            ],
                          },
                        })
                      );
                      const el = document.getElementById("fact-verification");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex-1 text-[11px] h-8 gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Send to Fact Check</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* ==========================================================
                SIDE-BY-SIDE YOUTUBE FEED SIMULATOR (CONTRAST CHECK)
                ========================================================== */}
            <div className="pt-6 border-t border-border/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <span>Side-by-Side YouTube Browse Feed Simulator</span>
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Viewers decide what to click in under 0.5 seconds. Compare how our thumbnail pops next to both competitors:
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFeedSimulator(!showFeedSimulator)}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showFeedSimulator ? "Hide Feed" : "Show Feed"}
                </Button>
              </div>

              {showFeedSimulator && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-black/60 border border-border/80">
                  {/* Competitor 1 Feed Item */}
                  <div className="space-y-2 opacity-85 hover:opacity-100 transition-opacity">
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border/60 bg-muted">
                      <img
                        src={dossier.competitor1.thumbnailUrl}
                        alt="Competitor 1"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                        14:15
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[9px] h-3.5 border-blue-500/40 text-blue-400">
                        Competitor 1
                      </Badge>
                      <h6 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug">
                        {dossier.competitor1.title}
                      </h6>
                      <p className="text-[10px] text-muted-foreground">History Channel • 842K views • 1 year ago</p>
                    </div>
                  </div>

                  {/* Competitor 2 Feed Item */}
                  <div className="space-y-2 opacity-85 hover:opacity-100 transition-opacity">
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border/60 bg-muted">
                      <img
                        src={dossier.competitor2.thumbnailUrl}
                        alt="Competitor 2"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                        22:04
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[9px] h-3.5 border-purple-500/40 text-purple-400">
                        Competitor 2
                      </Badge>
                      <h6 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug">
                        {dossier.competitor2.title}
                      </h6>
                      <p className="text-[10px] text-muted-foreground">Ancient Lore TV • 1.2M views • 8 months ago</p>
                    </div>
                  </div>

                  {/* OUR VIDEO Feed Item (High Contrast Winner) */}
                  <div className="space-y-2 relative p-2.5 rounded-lg border-2 border-amber-500/70 bg-amber-500/5 shadow-xl">
                    <div className="absolute -top-2.5 right-2 z-30">
                      <Badge className="bg-amber-500 text-black font-extrabold text-[9px] h-4">
                        ★ OUR PACKAGE
                      </Badge>
                    </div>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-amber-500/40 bg-black shadow-md">
                      <img
                        src={dossier.generatedThumbnail.imageUrl || "/thumbnails/our-target-egypt.jpg"}
                        alt="Our Target Thumbnail"
                        className={`w-full h-full object-cover ${
                          colorFilter === "warm"
                            ? "contrast-110 saturate-125 sepia-[0.15]"
                            : colorFilter === "teal"
                            ? "contrast-120 hue-rotate-15 saturate-110"
                            : colorFilter === "vivid"
                            ? "contrast-125 saturate-150"
                            : "contrast-130 grayscale-[0.25]"
                        }`}
                      />
                      {showTextOverlay && overlayText.trim() && (
                        <div className="absolute bottom-2 left-2 z-10">
                          <span
                            className="text-lg font-black text-[#FFEA00] tracking-tighter uppercase leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                            style={{ WebkitTextStroke: "1px #000000" }}
                          >
                            {overlayText}
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                        18:42
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Badge className="text-[9px] h-3.5 bg-amber-500/20 text-amber-300 border-0 font-bold">
                        Target Winner
                      </Badge>
                      <h6 className="font-bold text-xs text-amber-300 line-clamp-2 leading-snug">
                        {ourTitle}
                      </h6>
                      <p className="text-[10px] text-muted-foreground">Your Documentary Channel • Just uploaded</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: DAY 4 STUDY GUIDE (VISUAL PACKAGING & THE CLICK)
          ========================================================== */}
      <Dialog open={isStudyGuideOpen} onOpenChange={setIsStudyGuideOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Day 4 Curriculum: Visual Packaging & The Click
            </DialogTitle>
            <DialogDescription className="text-xs">
              How elite documentary channels engineer irresistible title-thumbnail packages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-foreground/90 leading-relaxed pt-2">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <h5 className="font-bold text-amber-400 text-sm">The Rule of Multiplication</h5>
              <p className="text-foreground font-semibold">
                Title and Thumbnail must NOT repeat each other. They must MULTIPLY each other.
              </p>
              <p className="text-muted-foreground text-[11px]">
                If your title says <em>"How Did Ancient Egyptians Cut Granite?"</em>, never put <em>"CUTTING GRANITE"</em> on the thumbnail. That is a wasted opportunity. The title poses the intellectual question; the thumbnail presents the visual tension, proof, or impossibility.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-foreground text-sm">The 5 Core Packaging Pillars</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded border border-border bg-card space-y-1">
                  <span className="font-bold text-amber-400">1. Thumbnail Subject</span>
                  <p className="text-muted-foreground text-[11px]">
                    The physical focal point. Needs high luminance contrast, clear depth of field, and readability on a 1.5-inch mobile screen.
                  </p>
                </div>
                <div className="p-2.5 rounded border border-border bg-card space-y-1">
                  <span className="font-bold text-amber-400">2. Thumbnail Question</span>
                  <p className="text-muted-foreground text-[11px]">
                    The subconscious curiosity gap triggered in &lt;0.5 seconds. What makes the brain stop scrolling?
                  </p>
                </div>
                <div className="p-2.5 rounded border border-border bg-card space-y-1">
                  <span className="font-bold text-amber-400">3. Title Promise</span>
                  <p className="text-muted-foreground text-[11px]">
                    What narrative or scientific revelation the title commits to deliver to the viewer.
                  </p>
                </div>
                <div className="p-2.5 rounded border border-border bg-card space-y-1">
                  <span className="font-bold text-amber-400">4. Thumbnail Promise</span>
                  <p className="text-muted-foreground text-[11px]">
                    The emotional stakes or tangible proof promised by the imagery (e.g. seeing the impossible core in real life).
                  </p>
                </div>
                <div className="sm:col-span-2 p-2.5 rounded border border-indigo-500/30 bg-indigo-500/5 space-y-1">
                  <span className="font-bold text-indigo-400">5. How They Work Together (The Click Engine)</span>
                  <p className="text-muted-foreground text-[11px]">
                    The cognitive bridge. The title sets up the mystery; the thumbnail provides the visual proof that demands an explanation. Neither works as powerfully alone as they do together.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded border border-border bg-card space-y-1">
              <h5 className="font-semibold text-foreground">Mobile Readability Rule</h5>
              <p className="text-muted-foreground text-[11px]">
                Over 70% of YouTube impressions occur on mobile feeds where thumbnails are approximately 1.5 inches wide. Ensure your focal subject has high micro-contrast, bold silhouettes, and at most 1–3 words of text.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==========================================================
          MODAL: REGENERATE THUMBNAIL CONCEPT
          ========================================================== */}
      <Dialog open={isRegenerateModalOpen} onOpenChange={setIsRegenerateModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-400" />
              <span>Regenerate Thumbnail Concept</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide feedback on why the previous thumbnail was not satisfactory, or select a new visual direction to generate an alternative high-CTR design for:{" "}
              <strong className="text-foreground">{ourTitle || "Your Video"}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegenerateWithFeedback} className="space-y-4 pt-2">
            {/* Quick Critique Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Why was the previous thumbnail unsatisfactory? (Quick Pick or Type Below)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Too subtle / needs higher contrast",
                  "Focus on tools and mechanical action",
                  "More forensic laboratory inspection",
                  "Darker dramatic lighting (Teal & Orange)",
                  "Different high-curiosity text hook",
                  "More authentic archaeological texture",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setRegenerationFeedback((prev) =>
                        prev ? `${prev}, ${chip}` : chip
                      )
                    }
                    className="text-[11px] rounded-md border border-border/80 bg-background/60 px-2 py-1 text-muted-foreground hover:border-amber-500/40 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <Textarea
                value={regenerationFeedback}
                onChange={(e) => setRegenerationFeedback(e.target.value)}
                placeholder="e.g. The stone seam is too abstract. Focus more on Petrie Core #7 with visible spiral toolmarks, dramatic directional raking light, and a green verdigris copper tube..."
                className="h-20 text-xs resize-none"
              />
            </div>

            {/* Desired Visual Style Direction */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Desired Visual Style Direction
              </label>
              <select
                value={regenerationStyle}
                onChange={(e) => setRegenerationStyle(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground"
              >
                <option value="macro-precision">Macro Precision & Tolerances (0.5mm Seam)</option>
                <option value="forensic-analysis">Forensic Archaeological Artifact (Drill Cores & Toolmarks)</option>
                <option value="optical-flatness">Metrology & Surface Calibration (Optical Straightedge)</option>
                <option value="megalithic-extraction">Monumental Quarry Extraction (Aswan Trench & Pounders)</option>
                <option value="tribological-slurry">Abrasive Slurry Mechanics (Copper Blade & Quartz Sand)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsRegenerateModalOpen(false)}
                className="h-9 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRegenerating}
                className="h-9 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold cursor-pointer shadow-md"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Regenerating Concept...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Regenerate with Feedback</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
