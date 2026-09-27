import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
// OFFICIAL DAY 4 REFERENCE EXEMPLAR: EGYPTIAN STONEWORK PACKAGING
// ============================================================================

export const DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS: ThumbnailComparisonDossier = {
  id: "exemplar-egypt-stonework-thumbnails",
  targetTitle: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
  competitor1: {
    entityRole: "Competitor 1",
    title: "How Did Ancient Egyptians Cut Granite?",
    thumbnailUrl: "/thumbnails/competitor1-egypt.jpg",
    thumbnailSubject: "Ancient quarry worker wielding a primitive copper hand chisel and wooden mallet against a rough stone block under harsh midday desert sunlight, framed by a giant glowing yellow question mark.",
    thumbnailQuestion: "Can primitive copper tools actually fracture and shape crystalline granite rock?",
    titlePromise: "Promises an explanatory tutorial revealing the historical tools used to cut hard stone.",
    thumbnailPromise: "Promises to show the physical struggle and tools of ancient quarry workers in action.",
    howTheyWorkTogether: "The title poses a straightforward historical question, while the thumbnail dramatizes the manual labor with high-contrast text and a glowing question mark. However, it relies on a generic worker depiction and clichéd yellow text that slightly lowers perceived production value.",
    clickTriggers: ["Worker Action", "Glowing Question Mark", "Curiosity about Bronze Age tools"],
    visualStrengths: ["Clear human subject", "Warm desert color palette"],
    visualFlawsOrGaps: ["Harsh midday lighting lacks mystery", "Question mark feels clickbaity", "Does not show the impossible precision seam"],
  },
  competitor2: {
    entityRole: "Competitor 2",
    title: "The Mystery of the Great Pyramid Drill Cores",
    thumbnailUrl: "/thumbnails/competitor2-egypt.jpg",
    thumbnailSubject: "Extreme macro close-up of a circular stone drill hole showing spiral grooves, overlaid with a glowing red measurement vector (Φ15.01mm, 52 RPM) and neon yellow text 'IMPOSSIBLE DRILL?'.",
    thumbnailQuestion: "Did ancient builders possess high-speed rotary machine tools to cut these perfect spiral grooves?",
    titlePromise: "Promises to investigate the enigmatic physical evidence of tubular drill cores documented by Petrie.",
    thumbnailPromise: "Promises shocking technical proof of precision tolerances that defy standard history.",
    howTheyWorkTogether: "The title sets up the archaeological mystery (*The Mystery of the Great Pyramid Drill Cores*), while the thumbnail delivers instant technical curiosity via the neon measurement overlay. Together they create strong click urgency, but flirt with sensationalist pseudoscience tropes.",
    clickTriggers: ["Technical Measurements", "Macro Detail of Toolmarks", "High-contrast Neon Text"],
    visualStrengths: ["Macro focal point on actual artifact", "High color contrast (teal stone vs red laser)"],
    visualFlawsOrGaps: ["Feels slightly sensationalist", "Technical vector graphic can feel artificial to history purists"],
  },
  competitiveSynthesis: {
    sharedPattern: "Both competitors focus either entirely on human labor (Competitor 1) or entirely on sensationalized mystery graphics (Competitor 2). Neither combines authentic archaeological grounding with cinematic prestige aesthetics.",
    gapInTheMarket: "A visual vacuum exists for a prestige, BBC/National Geographic documentary look: showing the physical sub-millimeter seam and genuine tubular core artifact in cinematic golden-hour light without cheesy cartoon graphics or pseudoscience lasers.",
    visualDifferentiationAngle: "Combine the tactile physical artifact (green-patina bronze age copper tubular drill core with distinct striations) resting directly on a split pink granite block with an razor-tight seam, framed against the golden dawn pyramids. Let the sheer physical reality of the stone create the tension.",
    howToOutperformBoth: "Eliminate messy text clutter. Use a single, razor-sharp 2-word anchor ('0.5mm SEAM' or 'SOLVED?') with ultra-high micro-contrast lighting that immediately signals authority, rigor, and cinematic drama.",
  },
  ourStrategy: {
    entityRole: "Our Target Video",
    title: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
    thumbnailUrl: "/thumbnails/our-target-egypt.jpg",
    thumbnailSubject: "Cinematic macro shot: A weathered Old Kingdom tubular copper drill core showing authentic spiral striations resting upon a massive pink granite megalith with a laser-straight sub-millimeter joint, bathed in low-angle golden-hour rim lighting with pyramids in the misty background.",
    thumbnailQuestion: "How could primitive Bronze Age tools produce tolerances so tight that a razor blade cannot enter the joint?",
    titlePromise: "Promises a rigorous, authoritative investigation into the real mechanical methods and engineering tolerances of ancient stonemasons.",
    thumbnailPromise: "Promises a breathtaking, tactile visual encounter with the actual physical artifacts and cutting tolerances, grounded in real archaeology.",
    howTheyWorkTogether: "The title asks the high-stakes engineering question (*How Did Ancient Egyptians Achieve Such Precise Stonework?*), while the thumbnail confronts the viewer with the physical artifact and the precision seam. They do not repeat each other—the thumbnail turns the title's abstract question into an irresistible physical reality.",
    clickTriggers: ["Extreme Artifact Texture", "Cinematic Golden Hour Rim Light", "Sub-millimeter Joint Precision", "Prestige Documentary Tone"],
    visualStrengths: ["Highest visual fidelity", "No clickbait clutter", "Immediate authority", "Stands out in dark mode feed"],
    visualFlawsOrGaps: ["Requires thumbnail text to be extremely disciplined and minimal"],
  },
  ourAlternativeStrategy: {
    entityRole: "Our Target Video",
    title: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
    thumbnailUrl: "/thumbnails/our-target-egypt.jpg",
    thumbnailSubject: "Macro optical contrast: An engineer's steel precision straightedge held against a polished granite block showing zero light bleed beneath it, juxtaposed with loose quartz sand abrasive grains under extreme high-magnification.",
    thumbnailQuestion: "Can basic quartz desert sand and soft copper really grind crystalline quartz-bearing granite to optical flatness?",
    titlePromise: "Promises a forensic deconstruction of the physical mechanics, material removal physics, and abrasive grain action behind ancient Egyptian stonework.",
    thumbnailPromise: "Promises verifiable tolerance evidence (zero light bleed) paired with the microscopic mechanics of material removal.",
    howTheyWorkTogether: "The title poses the broader historical enigma, while the thumbnail visually pits the optical tolerance standard against the abrasive mechanism. Together they frame an intellectual duel: proving both the extreme standard and the scientific explanation.",
    clickTriggers: ["Optical Flatness Test", "Extreme Microscopic Abrasive Detail", "Scientific Rigor"],
    visualStrengths: ["High technical curiosity", "Clean graphical split", "Intellectual intrigue"],
    visualFlawsOrGaps: ["Slightly more technical; best for engineering/science leaning viewers"],
  },
  generatedThumbnail: {
    imageUrl: "/thumbnails/our-target-egypt.jpg",
    promptMidjourney: "Cinematic YouTube documentary thumbnail, 8k resolution, photorealistic. Close-up macro shot of an ancient Egyptian pink granite block with an impossibly smooth cut seam, a weathered bronze age copper tube drill core with concentric spiral striations resting on top, dramatic side rim lighting at sunset, golden hour warm amber highlights contrasting with deep dramatic shadows, mysterious atmosphere, rule of thirds, high contrast, documentary style like National Geographic --ar 16:9 --style raw --v 6.0",
    promptDalleFlux: "Photorealistic macro photograph for a YouTube documentary thumbnail. A massive weathered pink granite block with a razor-thin 0.5mm seam running down the center. Resting on the stone is an authentic cylindrical copper drill core with prominent spiral striations and verdigris patina. Low-angle golden hour sunset illumination, deep shadows, misty Giza pyramids softly blurred in the background. Ultra-detailed stone grain, 8k, cinematic lighting.",
    focalSubject: "Cylindrical copper tubular drill core with green verdigris patina and concentric spiral striations, resting right beside a razor-tight granite joint.",
    compositionAndFraming: "Rule-of-thirds composition: drill core positioned along the upper-right intersection, precision seam leading the eye from lower-left to center-right. Deep depth of field on the stone texture with soft cinematic bokeh on the distant pyramids.",
    colorPaletteAndLighting: "Rich warm amber and terracotta granite tones contrasted against verdigris green copper patina and cool deep slate-gray shadows. Low-angle 45° directional raking light to exaggerate surface striations and joint tightness.",
    recommendedOverlayText: "0.5mm SEAM",
    recommendedBadge: "DOCUMENTARY",
    contrastStrategy: "Warm golden raking light on textured granite creates an instant contrast pop against dark feed backgrounds, pulling the eye in under 0.3 seconds.",
  },
  createdAt: "2026-09-27T02:00:00.000Z",
};

// ============================================================================
// HEURISTIC COMPARISON & ANALYSIS ENGINE
// ============================================================================

export function generateHeuristicThumbnailComparison(input: {
  ourTitle: string;
  competitor1Title: string;
  competitor1ThumbUrl?: string;
  competitor2Title: string;
  competitor2ThumbUrl?: string;
  conceptNotes?: string;
}): ThumbnailComparisonDossier {
  const ourTitle = input.ourTitle.trim() || "How Did Ancient Egyptians Achieve Such Precise Stonework?";
  const c1Title = input.competitor1Title.trim() || "How Did Ancient Egyptians Cut Granite?";
  const c2Title = input.competitor2Title.trim() || "The Mystery of the Great Pyramid Drill Cores";

  const lowerOur = ourTitle.toLowerCase();
  const isEgyptian =
    lowerOur.includes("egypt") ||
    lowerOur.includes("pyramid") ||
    lowerOur.includes("stonework") ||
    lowerOur.includes("granite");

  if (isEgyptian) {
    return {
      ...DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS,
      targetTitle: ourTitle,
      competitor1: {
        ...DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.competitor1,
        title: c1Title,
        thumbnailUrl: input.competitor1ThumbUrl || DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.competitor1.thumbnailUrl,
      },
      competitor2: {
        ...DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.competitor2,
        title: c2Title,
        thumbnailUrl: input.competitor2ThumbUrl || DAY4_EXEMPLAR_EGYPTIAN_THUMBNAILS.competitor2.thumbnailUrl,
      },
    };
  }

  // Generalized Dynamic Heuristic Analysis for any custom niche
  const c1Thumb = input.competitor1ThumbUrl || `/thumbnails/competitor1-egypt.jpg`;
  const c2Thumb = input.competitor2ThumbUrl || `/thumbnails/competitor2-egypt.jpg`;

  return {
    id: `comp-analysis-${Date.now()}`,
    targetTitle: ourTitle,
    competitor1: {
      entityRole: "Competitor 1",
      title: c1Title,
      thumbnailUrl: c1Thumb,
      thumbnailSubject: `Central focal depiction related to "${c1Title.slice(0, 35)}..." with high-saturation foreground element and directional lighting.`,
      thumbnailQuestion: `What is the untold truth or unexpected reality behind "${c1Title.slice(0, 30)}..."?`,
      titlePromise: `Promises to explain the core premise of "${c1Title}" through direct informative narration.`,
      thumbnailPromise: `Promises visual verification of the key problem or spectacle before the audience clicks.`,
      howTheyWorkTogether: `The title provides the logical question, while the thumbnail supplies the visual drama. However, it risks visual clutter if text overlays duplicate title phrasing.`,
      clickTriggers: ["High Saturation", "Problem Teaser", "Direct Visual Subject"],
      visualStrengths: ["Clear focal point", "Readable at mobile scale"],
      visualFlawsOrGaps: ["Common industry formula", "Could achieve stronger curiosity contrast"],
    },
    competitor2: {
      entityRole: "Competitor 2",
      title: c2Title,
      thumbnailUrl: c2Thumb,
      thumbnailSubject: `Extreme close-up or conceptual contrast visual highlighting the consequence or mystery of "${c2Title.slice(0, 35)}...".`,
      thumbnailQuestion: `Is the widely accepted belief about "${c2Title.slice(0, 30)}..." actually wrong?`,
      titlePromise: `Promises to challenge standard assumptions and present an intriguing revelation.`,
      thumbnailPromise: `Promises high-stakes visual evidence or emotional tension that demands resolution.`,
      howTheyWorkTogether: `The title introduces tension (*"${c2Title}"*), and the thumbnail accentuates the dilemma with strong lighting contrast. They synergize well, but may rely on familiar niche tropes.`,
      clickTriggers: ["Tension Framing", "Curiosity Gap", "Bold Contrast"],
      visualStrengths: ["Intense lighting contrast", "Clear emotional/mystery hook"],
      visualFlawsOrGaps: ["May blend into similar videos in the feed", "Text overlay competes with focal image"],
    },
    competitiveSynthesis: {
      sharedPattern: `Both competitors rely on standard genre conventions: one focuses on direct exposition while the other relies on mystery/tension cues. Both use competing text overlays.`,
      gapInTheMarket: `Neither competitor captures the ultimate high-status cinematic curiosity gap: stripping away text clutter to let a singular, impossible visual artifact or consequence speak directly to the viewer's subconscious.`,
      visualDifferentiationAngle: `Create maximum visual contrast against both competitors by using an unexpected macro perspective, hyper-focused raking lighting, and an uncluttered composition with a single punchy 2-word curiosity trigger.`,
      howToOutperformBoth: `Ensure our title asks the decisive question, while our thumbnail showcases the visual evidence or stakes that makes ignoring the video impossible.`,
    },
    ourStrategy: {
      entityRole: "Our Target Video",
      title: ourTitle,
      thumbnailUrl: `/thumbnails/our-target-egypt.jpg`,
      thumbnailSubject: `A single hyper-detailed focal subject representing the ultimate proof or stakes of "${ourTitle}", captured in dramatic cinematic raking light with deep contrast.`,
      thumbnailQuestion: `How is this visual anomaly or consequence possible in reality?`,
      titlePromise: `Promises an authentic, behind-the-scenes revelation that definitively answers "${ourTitle}".`,
      thumbnailPromise: `Promises that the viewer will witness the definitive evidence firsthand, without fluff or recycled tropes.`,
      howTheyWorkTogether: `Our title frames the intellectual curiosity (*"${ourTitle}"*), while our thumbnail delivers the visual punchline or dilemma. They multiply each other by avoiding word repetition, forcing the click to bridge the gap.`,
      clickTriggers: ["Visual Anomaly", "Cinematic Raking Lighting", "Zero Clutter", "Pique Curiosity Gap"],
      visualStrengths: ["Dominates feed in mobile view", "High micro-contrast", "Pure prestige documentary packaging"],
      visualFlawsOrGaps: ["Requires strict adherence to minimal text"],
    },
    ourAlternativeStrategy: {
      entityRole: "Our Target Video",
      title: ourTitle,
      thumbnailUrl: `/thumbnails/our-target-egypt.jpg`,
      thumbnailSubject: `Alternative high-curiosity angle: Extreme macro split or forensic inspection visual revealing a critical physical clue for "${ourTitle}".`,
      thumbnailQuestion: `Does this shocking physical evidence completely change what we thought about "${ourTitle.slice(0, 30)}..."?`,
      titlePromise: `Promises an investigative, forensic investigation into the hidden mechanics of "${ourTitle}".`,
      thumbnailPromise: `Promises undeniable empirical evidence and forensic visual stakes that force the viewer to click.`,
      howTheyWorkTogether: `The title poses the broader question, while the thumbnail supplies the tangible forensic anomaly. Together they form an airtight curiosity loop.`,
      clickTriggers: ["Forensic Inspection", "High Stakes", "Curiosity Loop"],
      visualStrengths: ["High tension", "Instant intrigue"],
      visualFlawsOrGaps: ["Must maintain documentary credibility without sensationalism"],
    },
    generatedThumbnail: {
      imageUrl: `/thumbnails/our-target-egypt.jpg`,
      promptMidjourney: `Cinematic YouTube documentary thumbnail for "${ourTitle}". Ultra-detailed photorealistic 8k macro shot, singular powerful focal subject, dramatic directional raking light, deep volumetric shadows, rich atmospheric color grading, golden hour contrast, rule of thirds, documentary quality --ar 16:9 --style raw --v 6.0`,
      promptDalleFlux: `A photorealistic YouTube video thumbnail for a high-budget documentary titled "${ourTitle}". Focus on an intriguing, highly detailed central object with tangible texture. Cinematic lighting with strong contrast between warm highlights and cool shadows. Atmospheric depth of field, 8k resolution, award-winning cinematography.`,
      focalSubject: `High-impact tactile subject directly demonstrating the core tension of "${ourTitle}".`,
      compositionAndFraming: `Strong off-center rule of thirds alignment, negative space on the left third for high-contrast viewing on mobile devices.`,
      colorPaletteAndLighting: `High dynamic range: warm golden or amber key light against cool teal/slate shadows to create maximum color separation.`,
      recommendedOverlayText: "REVEALED",
      recommendedBadge: "DOCUMENTARY",
      contrastStrategy: "Intense luminance contrast between foreground subject and background creates an irresistible visual magnet in crowded YouTube feeds.",
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

export const analyzeThumbnailComparisonServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => ThumbnailComparisonInput.parse(d))
  .handler(async ({ data }) => {
    const envKey = (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "").trim();
    const effectiveAiKey = (data.aiApiKey || envKey).trim();

    if (!effectiveAiKey) {
      return generateHeuristicThumbnailComparison(data);
    }

    try {
      const isGemini =
        effectiveAiKey.startsWith("AIza") ||
        effectiveAiKey.length === 39 ||
        effectiveAiKey.length === 40;

      const prompt = `You are an elite YouTube Packaging Director and Visual Click-Rate Strategist adhering to the Day 4 Curriculum (Audience Psychology, Titles, Thumbnails, and the Click).

TASK:
Analyze 2 competitor video packages (Title + Thumbnail) viz-a-viz their visual storytelling and click psychology, then engineer a winning, high-CTR thumbnail strategy and visual prompt for OUR video title.

INPUT DATA:
- Competitor 1 Title: "${data.competitor1Title}"
  Competitor 1 Thumbnail: "${data.competitor1ThumbUrl || "Described via title/genre"}"
- Competitor 2 Title: "${data.competitor2Title}"
  Competitor 2 Thumbnail: "${data.competitor2ThumbUrl || "Described via title/genre"}"
- OUR Target Title: "${data.ourTitle}"
${data.conceptNotes ? `- Additional Context/Angle: "${data.conceptNotes}"` : ""}

CRITICAL PACKAGING RULES (DAY 4 LESSONS):
1. The Rule of Multiplication: Title and Thumbnail MUST NOT repeat each other. They must multiply each other.
   - If the title asks a question, the thumbnail must show visual proof, emotional stakes, or an impossible clue.
   - Never copy title words into thumbnail text. Use maximum 1-3 words of complementary text (or zero text).
2. The 5 Core Pillars to Analyze for EACH package:
   - Thumbnail Subject: What is visually in the frame? (Focal subject, framing, lighting, contrast).
   - Thumbnail Question: What subconscious question does the visual alone pose in the viewer's brain?
   - Title Promise: What explanation, story, or value proposition does the title promise?
   - Thumbnail Promise: What visceral experience, proof, or emotional payoff does the imagery promise?
   - How they work Together: The precise cognitive synergy between the title and thumbnail that triggers the click.
3. Competitive Gap Analysis:
   - Identify the visual blind spot or clichéd tropes used by both competitors.
   - Design our thumbnail to visually dominate and outperform both competitors in a side-by-side feed.

Return a clean, valid JSON object matching this schema:
{
  "competitor1": {
    "thumbnailSubject": "Detailed visual description of focal point, lighting, and composition",
    "thumbnailQuestion": "The visceral question triggered by the image",
    "titlePromise": "What explanation or story the title promises",
    "thumbnailPromise": "What visual payoff the thumbnail promises",
    "howTheyWorkTogether": "Detailed analysis of how title and thumbnail interact and where it succeeds/fails",
    "clickTriggers": ["trigger 1", "trigger 2"],
    "visualStrengths": ["strength 1"],
    "visualFlawsOrGaps": ["gap 1"]
  },
  "competitor2": {
    "thumbnailSubject": "Detailed visual description of focal point, lighting, and composition",
    "thumbnailQuestion": "The visceral question triggered by the image",
    "titlePromise": "What explanation or story the title promises",
    "thumbnailPromise": "What visual payoff the thumbnail promises",
    "howTheyWorkTogether": "Detailed analysis of how title and thumbnail interact and where it succeeds/fails",
    "clickTriggers": ["trigger 1", "trigger 2"],
    "visualStrengths": ["strength 1"],
    "visualFlawsOrGaps": ["gap 1"]
  },
  "competitiveSynthesis": {
    "sharedPattern": "Common formula or tropes both competitors use",
    "gapInTheMarket": "The unexploited visual angle in the niche",
    "visualDifferentiationAngle": "How our thumbnail visually separates itself",
    "howToOutperformBoth": "Concrete strategic steps to achieve higher CTR than both competitors"
  },
  "ourStrategy": {
    "thumbnailSubject": "Master visual description of our recommended thumbnail subject",
    "thumbnailQuestion": "The irresistible question our thumbnail poses",
    "titlePromise": "What our title promises",
    "thumbnailPromise": "What our thumbnail imagery promises",
    "howTheyWorkTogether": "The seamless multiplication effect between our title and thumbnail",
    "clickTriggers": ["trigger 1", "trigger 2"],
    "visualStrengths": ["strength 1", "strength 2"],
    "visualFlawsOrGaps": ["editorial caution note"]
  },
  "generatedThumbnail": {
    "promptMidjourney": "Complete, ready-to-use Midjourney v6 prompt with parameters --ar 16:9 --style raw --v 6.0",
    "promptDalleFlux": "Complete prompt tailored for Flux.1 or DALL-E 3",
    "focalSubject": "Exact subject to render",
    "compositionAndFraming": "Camera angle, shot type, rule of thirds placement",
    "colorPaletteAndLighting": "Lighting setup and color grading tokens",
    "recommendedOverlayText": "1-3 words max, or empty if textless",
    "recommendedBadge": "Sticker/badge text e.g. DOCUMENTARY or SOLVED",
    "contrastStrategy": "How the thumbnail pops against YouTube dark and light themes"
  }
}`;

      let rawContent = "";
      if (isGemini) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveAiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3,
            },
          }),
        });
        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }
        const dataJson = await response.json();
        rawContent = dataJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
          }),
        });
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        const dataJson = await response.json();
        rawContent = dataJson.choices?.[0]?.message?.content || "";
      }

      const parsed = JSON.parse(rawContent);

      return {
        id: `comp-analysis-${Date.now()}`,
        targetTitle: data.ourTitle,
        competitor1: {
          entityRole: "Competitor 1",
          title: data.competitor1Title,
          thumbnailUrl: data.competitor1ThumbUrl || "/thumbnails/competitor1-egypt.jpg",
          thumbnailSubject: parsed.competitor1?.thumbnailSubject || "Focal subject of competitor 1",
          thumbnailQuestion: parsed.competitor1?.thumbnailQuestion || "Question raised by competitor 1 thumbnail",
          titlePromise: parsed.competitor1?.titlePromise || "Promise made by competitor 1 title",
          thumbnailPromise: parsed.competitor1?.thumbnailPromise || "Promise made by competitor 1 thumbnail",
          howTheyWorkTogether: parsed.competitor1?.howTheyWorkTogether || "Synergy of competitor 1",
          clickTriggers: parsed.competitor1?.clickTriggers || [],
          visualStrengths: parsed.competitor1?.visualStrengths || [],
          visualFlawsOrGaps: parsed.competitor1?.visualFlawsOrGaps || [],
        },
        competitor2: {
          entityRole: "Competitor 2",
          title: data.competitor2Title,
          thumbnailUrl: data.competitor2ThumbUrl || "/thumbnails/competitor2-egypt.jpg",
          thumbnailSubject: parsed.competitor2?.thumbnailSubject || "Focal subject of competitor 2",
          thumbnailQuestion: parsed.competitor2?.thumbnailQuestion || "Question raised by competitor 2 thumbnail",
          titlePromise: parsed.competitor2?.titlePromise || "Promise made by competitor 2 title",
          thumbnailPromise: parsed.competitor2?.thumbnailPromise || "Promise made by competitor 2 thumbnail",
          howTheyWorkTogether: parsed.competitor2?.howTheyWorkTogether || "Synergy of competitor 2",
          clickTriggers: parsed.competitor2?.clickTriggers || [],
          visualStrengths: parsed.competitor2?.visualStrengths || [],
          visualFlawsOrGaps: parsed.competitor2?.visualFlawsOrGaps || [],
        },
        competitiveSynthesis: {
          sharedPattern: parsed.competitiveSynthesis?.sharedPattern || "Standard niche patterns",
          gapInTheMarket: parsed.competitiveSynthesis?.gapInTheMarket || "Unmet audience curiosity gap",
          visualDifferentiationAngle: parsed.competitiveSynthesis?.visualDifferentiationAngle || "Higher contrast focal framing",
          howToOutperformBoth: parsed.competitiveSynthesis?.howToOutperformBoth || "Maximize micro-contrast and eliminate text clutter",
        },
        ourStrategy: {
          entityRole: "Our Target Video",
          title: data.ourTitle,
          thumbnailUrl: "/thumbnails/our-target-egypt.jpg",
          thumbnailSubject: parsed.ourStrategy?.thumbnailSubject || "Master focal subject for our thumbnail",
          thumbnailQuestion: parsed.ourStrategy?.thumbnailQuestion || "Core curiosity dilemma",
          titlePromise: parsed.ourStrategy?.titlePromise || "Documentary promise of our title",
          thumbnailPromise: parsed.ourStrategy?.thumbnailPromise || "Visual proof promised by thumbnail",
          howTheyWorkTogether: parsed.ourStrategy?.howTheyWorkTogether || "Multiplication synergy",
          clickTriggers: parsed.ourStrategy?.clickTriggers || [],
          visualStrengths: parsed.ourStrategy?.visualStrengths || [],
          visualFlawsOrGaps: parsed.ourStrategy?.visualFlawsOrGaps || [],
        },
        generatedThumbnail: {
          imageUrl: "/thumbnails/our-target-egypt.jpg",
          promptMidjourney: parsed.generatedThumbnail?.promptMidjourney || "",
          promptDalleFlux: parsed.generatedThumbnail?.promptDalleFlux || "",
          focalSubject: parsed.generatedThumbnail?.focalSubject || "",
          compositionAndFraming: parsed.generatedThumbnail?.compositionAndFraming || "",
          colorPaletteAndLighting: parsed.generatedThumbnail?.colorPaletteAndLighting || "",
          recommendedOverlayText: parsed.generatedThumbnail?.recommendedOverlayText || "SOLVED",
          recommendedBadge: parsed.generatedThumbnail?.recommendedBadge || "DOCUMENTARY",
          contrastStrategy: parsed.generatedThumbnail?.contrastStrategy || "",
        },
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("AI Thumbnail Comparison failed, using heuristic engine:", err);
      return generateHeuristicThumbnailComparison(data);
    }
  });
