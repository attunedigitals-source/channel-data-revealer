import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveAiKey } from "./server-config";
import { callAiJson, loadImageForVision } from "./ai-client.server";


export interface ThumbnailFivePillars {
  thumbnailSubject: string;   // "Thumbnail Subject"
  thumbnailQuestion: string;  // "Thumbnail Question"
  titlePromise: string;       // "Title Promise"
  thumbnailPromise: string;   // "Thumbnail Promise"
  howTheyWorkTogether: string;// "How they work Together"
}

export interface CompetitorAnalysisRow extends ThumbnailFivePillars {
  entityRole: "Competitor 1" | "Competitor 2" | "Synthesis & Gap" | "Our Target Video";
  title: string;
  thumbnailUrl: string;
  clickTriggers?: string[];
  visualStrengths?: string[];
  visualFlawsOrGaps?: string[];
}

export interface GeneratedThumbnailConcept {
  imageUrl?: string;
  svgDataUri?: string;
  promptMidjourney: string;
  promptDalleFlux: string;
  focalSubject: string;
  compositionAndFraming: string;
  colorPaletteAndLighting: string;
  recommendedOverlayText: string;
  recommendedBadge: string;
  contrastStrategy: string;
}

export interface ThumbnailComparisonDossier {
  id: string;
  targetTitle: string;
  competitor1: CompetitorAnalysisRow;
  competitor2: CompetitorAnalysisRow;
  competitiveSynthesis: {
    sharedPattern: string;
    gapInTheMarket: string;
    visualDifferentiationAngle: string;
    howToOutperformBoth: string;
  };
  ourStrategy: CompetitorAnalysisRow;
  ourAlternativeStrategy?: CompetitorAnalysisRow;
  generatedThumbnail: GeneratedThumbnailConcept;
  createdAt: string;
}

// ============================================================================
// FALLBACK WHEN NO AI VISION ANALYSIS IS AVAILABLE
// ============================================================================
//
// Analysing a thumbnail requires actually looking at it. Without an AI key
// with vision, this returns a dossier that says so plainly, rather than the
// invented "strengths/flaws" for images it never saw that earlier versions
// produced. The only generated content is a starter image-generation prompt
// built from the user's own title.

export function generateUnanalyzedThumbnailComparison(input: {
  ourTitle: string;
  competitor1Title: string;
  competitor1ThumbUrl?: string | undefined;
  competitor2Title: string;
  competitor2ThumbUrl?: string | undefined;
  conceptNotes?: string | undefined;
}): ThumbnailComparisonDossier {
  const NA = "Not analyzed \u2014 add an AI key (with vision support) in API Settings to analyze this thumbnail.";
  const blankPillars: ThumbnailFivePillars = {
    thumbnailSubject: NA,
    thumbnailQuestion: NA,
    titlePromise: NA,
    thumbnailPromise: NA,
    howTheyWorkTogether: NA,
  };
  const ourTitle = input.ourTitle.trim();
  const notes = input.conceptNotes?.trim();

  return {
    id: `comp-analysis-${Date.now()}`,
    targetTitle: ourTitle,
    competitor1: {
      entityRole: "Competitor 1",
      title: input.competitor1Title.trim(),
      thumbnailUrl: input.competitor1ThumbUrl || "",
      ...blankPillars,
    },
    competitor2: {
      entityRole: "Competitor 2",
      title: input.competitor2Title.trim(),
      thumbnailUrl: input.competitor2ThumbUrl || "",
      ...blankPillars,
    },
    competitiveSynthesis: {
      sharedPattern: NA,
      gapInTheMarket: NA,
      visualDifferentiationAngle: NA,
      howToOutperformBoth: NA,
    },
    ourStrategy: {
      entityRole: "Our Target Video",
      title: ourTitle,
      thumbnailUrl: "",
      ...blankPillars,
    },
    generatedThumbnail: {
      promptMidjourney: `YouTube thumbnail for a video titled "${ourTitle}"${notes ? `. Concept: ${notes}` : ""}. Single clear focal subject, strong contrast, minimal text, readable at small size --ar 16:9`,
      promptDalleFlux: `A YouTube thumbnail for a video titled "${ourTitle}"${notes ? `. Concept: ${notes}` : ""}. One clear focal subject, high contrast, uncluttered composition, 16:9.`,
      focalSubject: notes || "Choose one clear subject that represents the video's core question.",
      compositionAndFraming: "Not analyzed.",
      colorPaletteAndLighting: "Not analyzed.",
      recommendedOverlayText: "",
      recommendedBadge: "",
      contrastStrategy: "Not analyzed.",
    },
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// SERVER FUNCTION: AI-POWERED THUMBNAIL COMPETITIVE ANALYSIS
// ============================================================================

const ThumbnailComparisonInput = z.object({
  ourTitle: z.string().trim().min(1),
  competitor1Title: z.string().trim().min(1),
  competitor1ThumbUrl: z.string().trim().optional(),
  competitor2Title: z.string().trim().min(1),
  competitor2ThumbUrl: z.string().trim().optional(),
  conceptNotes: z.string().trim().optional(),
  aiApiKey: z.string().trim().optional(),
});

const NOT_RETURNED = "Not returned by the AI.";

function pillars(p: any): ThumbnailFivePillars {
  return {
    thumbnailSubject: p?.thumbnailSubject || NOT_RETURNED,
    thumbnailQuestion: p?.thumbnailQuestion || NOT_RETURNED,
    titlePromise: p?.titlePromise || NOT_RETURNED,
    thumbnailPromise: p?.thumbnailPromise || NOT_RETURNED,
    howTheyWorkTogether: p?.howTheyWorkTogether || NOT_RETURNED,
  };
}

const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

export const analyzeThumbnailComparisonServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => ThumbnailComparisonInput.parse(d))
  .handler(async ({ data }): Promise<ThumbnailComparisonDossier> => {
    const effectiveAiKey = resolveAiKey(data.aiApiKey);
    if (!effectiveAiKey) {
      return generateUnanalyzedThumbnailComparison(data);
    }

    try {
      // Load the actual thumbnail images so the model analyses what is really
      // in them rather than guessing from a URL string.
      const [img1, img2] = await Promise.all([
        loadImageForVision(data.competitor1ThumbUrl),
        loadImageForVision(data.competitor2ThumbUrl),
      ]);
      const images = [img1, img2].filter((i): i is NonNullable<typeof i> => Boolean(i));

      const imageNote = [
        img1 ? "Image A is Competitor 1's thumbnail." : "Competitor 1's thumbnail image was NOT available.",
        img2 ? "Image B is Competitor 2's thumbnail." : "Competitor 2's thumbnail image was NOT available.",
      ].join(" ");

      const prompt = `You are a YouTube packaging strategist. Analyze two competitor video packages (title + thumbnail) and recommend a thumbnail strategy for OUR video.

INPUT:
- Competitor 1 title: "${data.competitor1Title}"
- Competitor 2 title: "${data.competitor2Title}"
- OUR target title: "${data.ourTitle}"
${data.conceptNotes ? `- Additional context: "${data.conceptNotes}"` : ""}
- ${imageNote}

HONESTY RULES:
- Only describe visual details you can actually see in the attached images. For any competitor whose image was not available, base the analysis on the title alone and start the "thumbnailSubject" field with "Image not available —".
- Do not invent statistics, view counts, or performance data.
- Recommendations for OUR video are proposals, not guarantees.

For each package analyze the 5 pillars: thumbnailSubject (what is visibly in the frame), thumbnailQuestion (what question the image alone raises), titlePromise, thumbnailPromise, howTheyWorkTogether. The title and thumbnail should complement, not repeat, each other; keep any overlay text to 1-3 words or none.

Return ONLY valid JSON of this shape:
{
  "competitor1": { "thumbnailSubject": "", "thumbnailQuestion": "", "titlePromise": "", "thumbnailPromise": "", "howTheyWorkTogether": "", "clickTriggers": [], "visualStrengths": [], "visualFlawsOrGaps": [] },
  "competitor2": { "thumbnailSubject": "", "thumbnailQuestion": "", "titlePromise": "", "thumbnailPromise": "", "howTheyWorkTogether": "", "clickTriggers": [], "visualStrengths": [], "visualFlawsOrGaps": [] },
  "competitiveSynthesis": { "sharedPattern": "", "gapInTheMarket": "", "visualDifferentiationAngle": "", "howToOutperformBoth": "" },
  "ourStrategy": { "thumbnailSubject": "", "thumbnailQuestion": "", "titlePromise": "", "thumbnailPromise": "", "howTheyWorkTogether": "", "clickTriggers": [], "visualStrengths": [], "visualFlawsOrGaps": [] },
  "generatedThumbnail": { "promptMidjourney": "", "promptDalleFlux": "", "focalSubject": "", "compositionAndFraming": "", "colorPaletteAndLighting": "", "recommendedOverlayText": "", "recommendedBadge": "", "contrastStrategy": "" }
}`;

      const parsed = await callAiJson({ apiKey: effectiveAiKey, prompt, images, temperature: 0.3 });

      return {
        id: `comp-analysis-${Date.now()}`,
        targetTitle: data.ourTitle,
        competitor1: {
          entityRole: "Competitor 1",
          title: data.competitor1Title,
          thumbnailUrl: data.competitor1ThumbUrl || "",
          ...pillars(parsed.competitor1),
          clickTriggers: strList(parsed.competitor1?.clickTriggers),
          visualStrengths: strList(parsed.competitor1?.visualStrengths),
          visualFlawsOrGaps: strList(parsed.competitor1?.visualFlawsOrGaps),
        },
        competitor2: {
          entityRole: "Competitor 2",
          title: data.competitor2Title,
          thumbnailUrl: data.competitor2ThumbUrl || "",
          ...pillars(parsed.competitor2),
          clickTriggers: strList(parsed.competitor2?.clickTriggers),
          visualStrengths: strList(parsed.competitor2?.visualStrengths),
          visualFlawsOrGaps: strList(parsed.competitor2?.visualFlawsOrGaps),
        },
        competitiveSynthesis: {
          sharedPattern: parsed.competitiveSynthesis?.sharedPattern || NOT_RETURNED,
          gapInTheMarket: parsed.competitiveSynthesis?.gapInTheMarket || NOT_RETURNED,
          visualDifferentiationAngle: parsed.competitiveSynthesis?.visualDifferentiationAngle || NOT_RETURNED,
          howToOutperformBoth: parsed.competitiveSynthesis?.howToOutperformBoth || NOT_RETURNED,
        },
        ourStrategy: {
          entityRole: "Our Target Video",
          title: data.ourTitle,
          thumbnailUrl: "",
          ...pillars(parsed.ourStrategy),
          clickTriggers: strList(parsed.ourStrategy?.clickTriggers),
          visualStrengths: strList(parsed.ourStrategy?.visualStrengths),
          visualFlawsOrGaps: strList(parsed.ourStrategy?.visualFlawsOrGaps),
        },
        generatedThumbnail: {
          promptMidjourney: parsed.generatedThumbnail?.promptMidjourney || "",
          promptDalleFlux: parsed.generatedThumbnail?.promptDalleFlux || "",
          focalSubject: parsed.generatedThumbnail?.focalSubject || "",
          compositionAndFraming: parsed.generatedThumbnail?.compositionAndFraming || "",
          colorPaletteAndLighting: parsed.generatedThumbnail?.colorPaletteAndLighting || "",
          recommendedOverlayText: parsed.generatedThumbnail?.recommendedOverlayText || "",
          recommendedBadge: parsed.generatedThumbnail?.recommendedBadge || "",
          contrastStrategy: parsed.generatedThumbnail?.contrastStrategy || "",
        },
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("AI thumbnail comparison failed:", err);
      return generateUnanalyzedThumbnailComparison(data);
    }
  });

// ============================================================================
// STYLE ANGLES (niche-neutral)
// ============================================================================
//
// These are visual *directions* that work for any topic. They contain no
// subject matter of their own; the subject always comes from the user's
// title. Selecting one only changes overlay/badge/colour treatment and steers
// the next AI regeneration.

export interface ThumbnailVariationPreset {
  id: string;
  name: string;
  badge: string;
  overlayText: string;
  colorFilter: "warm" | "teal" | "vivid" | "noir";
  imageUrl: string;
  /** Direction passed to the AI when regenerating in this style. */
  styleDirection: string;
}

export const CURATED_THUMBNAIL_PRESETS: ThumbnailVariationPreset[] = [
  {
    id: "style-macro",
    name: "Extreme Close-Up",
    badge: "",
    overlayText: "",
    colorFilter: "warm",
    imageUrl: "",
    styleDirection: "One tightly cropped, highly detailed subject filling most of the frame; shallow depth of field; warm key light.",
  },
  {
    id: "style-contrast",
    name: "Split Contrast",
    badge: "",
    overlayText: "",
    colorFilter: "teal",
    imageUrl: "",
    styleDirection: "Two halves in visual opposition (before/after, expectation/reality, them/us); strong colour separation between halves.",
  },
  {
    id: "style-minimal",
    name: "Minimal Single Subject",
    badge: "",
    overlayText: "",
    colorFilter: "vivid",
    imageUrl: "",
    styleDirection: "One bold subject on a clean, uncluttered background; maximum readability at small size; no more than 3 words of text.",
  },
  {
    id: "style-scale",
    name: "Scale & Drama",
    badge: "",
    overlayText: "",
    colorFilter: "noir",
    imageUrl: "",
    styleDirection: "Small human-scale element against a vast, dramatic environment; low-key lighting; strong sense of scale.",
  },
];

// ============================================================================
// SERVER FUNCTION: REGENERATE THUMBNAIL CONCEPT
// ============================================================================

const RegenerateThumbnailInput = z.object({
  ourTitle: z.string().trim().min(1),
  conceptNotes: z.string().trim().optional(),
  feedback: z.string().trim().optional(),
  styleAngle: z.string().trim().optional(),
  currentPresetId: z.string().trim().optional(),
  aiApiKey: z.string().trim().optional(),
});

export const regenerateThumbnailConceptServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => RegenerateThumbnailInput.parse(d))
  .handler(async ({ data }) => {
    const effectiveAiKey = resolveAiKey(data.aiApiKey);

    // Pick the style angle: explicit choice, otherwise advance to the next one.
    const presets = CURATED_THUMBNAIL_PRESETS;
    const explicit = presets.find((p) => p.id === data.styleAngle);
    const currentIdx = presets.findIndex((p) => p.id === data.currentPresetId);
    const chosen = explicit ?? presets[(currentIdx + 1) % presets.length] ?? presets[0]!;

    const starterPrompt = `YouTube thumbnail for a video titled "${data.ourTitle}"${data.conceptNotes ? `. Concept: ${data.conceptNotes}` : ""}. ${chosen.styleDirection}`;

    const emptyStrategy = {
      entityRole: "Our Target Video" as const,
      title: data.ourTitle,
      thumbnailUrl: "",
      thumbnailSubject: "Not analyzed \u2014 add an AI key in API Settings to generate a full concept.",
      thumbnailQuestion: "",
      titlePromise: "",
      thumbnailPromise: "",
      howTheyWorkTogether: "",
    };

    const fallback = (note: string) => ({
      concept: {
        imageUrl: "",
        promptMidjourney: `${starterPrompt} --ar 16:9 --style raw`,
        promptDalleFlux: starterPrompt,
        focalSubject: "",
        compositionAndFraming: chosen.styleDirection,
        colorPaletteAndLighting: `${chosen.colorFilter} tones.`,
        recommendedOverlayText: chosen.overlayText,
        recommendedBadge: chosen.badge,
        contrastStrategy: "",
      },
      ourStrategy: emptyStrategy,
      selectedPresetId: chosen.id,
      colorFilter: chosen.colorFilter,
      feedbackApplied: note,
    });

    if (!effectiveAiKey) {
      return fallback(`Style angle "${chosen.name}" selected. Add an AI key to generate a full concept.`);
    }

    try {
      const prompt = `You are a YouTube thumbnail director. The creator was not satisfied with the previous thumbnail for the video titled:
"${data.ourTitle}"
${data.conceptNotes ? `Creator's concept notes: "${data.conceptNotes}"` : ""}

CREATOR FEEDBACK: "${data.feedback || "Generate a fresh, distinctive alternative."}"
STYLE DIRECTION: "${chosen.styleDirection}"

Generate a NEW thumbnail concept in this style that addresses the feedback. Title and thumbnail should complement each other, not repeat; overlay text 1-3 words or none. Do not make factual claims about the video's subject that aren't in the title or notes.

Return ONLY valid JSON:
{
  "thumbnailSubject": "detailed description of focal subject, lighting and composition",
  "thumbnailQuestion": "the question this image raises in the viewer's mind",
  "titlePromise": "what the title promises",
  "thumbnailPromise": "what the visual promises",
  "howTheyWorkTogether": "how title and thumbnail complement each other",
  "promptMidjourney": "complete image prompt ending with --ar 16:9 --style raw",
  "promptDalleFlux": "complete prompt for an image model",
  "recommendedOverlayText": "1-3 words or empty",
  "recommendedBadge": "short badge text or empty",
  "colorFilter": "warm | teal | vivid | noir",
  "feedbackApplied": "one sentence on how the feedback was addressed"
}`;

      const parsed = await callAiJson({ apiKey: effectiveAiKey, prompt, temperature: 0.5 });
      const colorFilter = (["warm", "teal", "vivid", "noir"] as const).find((c) => c === parsed.colorFilter) ?? chosen.colorFilter;

      return {
        concept: {
          imageUrl: "",
          promptMidjourney: parsed.promptMidjourney || "",
          promptDalleFlux: parsed.promptDalleFlux || "",
          focalSubject: parsed.thumbnailSubject || "",
          compositionAndFraming: chosen.styleDirection,
          colorPaletteAndLighting: `${colorFilter} tones.`,
          recommendedOverlayText: parsed.recommendedOverlayText || "",
          recommendedBadge: parsed.recommendedBadge || "",
          contrastStrategy: "",
        },
        ourStrategy: {
          entityRole: "Our Target Video" as const,
          title: data.ourTitle,
          thumbnailUrl: "",
          thumbnailSubject: parsed.thumbnailSubject || "",
          thumbnailQuestion: parsed.thumbnailQuestion || "",
          titlePromise: parsed.titlePromise || "",
          thumbnailPromise: parsed.thumbnailPromise || "",
          howTheyWorkTogether: parsed.howTheyWorkTogether || "",
        },
        selectedPresetId: chosen.id,
        colorFilter,
        feedbackApplied: parsed.feedbackApplied || data.feedback || `Regenerated in style: "${chosen.name}"`,
      };
    } catch (err) {
      console.warn("AI thumbnail regeneration failed:", err);
      return fallback("AI regeneration failed. Showing a starter prompt only. Try again.");
    }
  });
