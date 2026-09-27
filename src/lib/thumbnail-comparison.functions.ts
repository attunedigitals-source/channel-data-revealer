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

// ============================================================================
// CURATED THUMBNAIL VARIATIONS & PRESETS LIBRARY
// ============================================================================

export interface ThumbnailVariationPreset {
  id: string;
  name: string;
  badge: string;
  overlayText: string;
  colorFilter: "warm" | "teal" | "vivid" | "noir";
  focalSubject: string;
  thumbnailQuestion: string;
  titlePromise: string;
  thumbnailPromise: string;
  howTheyWorkTogether: string;
  promptMidjourney: string;
  promptDalleFlux: string;
}

export const CURATED_THUMBNAIL_PRESETS: ThumbnailVariationPreset[] = [
  {
    id: "preset-seam",
    name: "0.5mm Precision Seam",
    badge: "DOCUMENTARY",
    overlayText: "0.5mm SEAM",
    colorFilter: "warm",
    focalSubject: "Extreme macro close-up of a laser-straight granite casing block joint so tight a 0.5mm razor cannot enter.",
    thumbnailQuestion: "How could primitive Bronze Age tools produce joint tolerances tighter than a razor blade?",
    titlePromise: "Authoritative investigation separating verified engineering mechanics from persistent ancient construction myths.",
    thumbnailPromise: "High-tactile visual proof of undeniable sub-millimeter stone joint tolerances.",
    howTheyWorkTogether: "Title poses the foundational mystery, thumbnail delivers the physical joint standard. They multiply curiosity without word repetition.",
    promptMidjourney: "Cinematic macro shot of an ancient Egyptian pink granite block joint with razor-thin 0.5mm seam, bronze age copper tubular drill core resting on top with green patina, sunset golden hour rim lighting, 8k resolution, National Geographic documentary --ar 16:9 --style raw --v 6.0",
    promptDalleFlux: "Photorealistic macro photograph of an ancient Egyptian granite wall with an impossibly tight 0.5mm seam. Low angle golden sunset light creating dramatic raking shadows, displaying raw crystal granite grain, 8k resolution.",
  },
  {
    id: "preset-core",
    name: "Petrie Core #7 (Grooves)",
    badge: "FORENSIC",
    overlayText: "SPIRAL CORES",
    colorFilter: "teal",
    focalSubject: "Cylindrical granite core UC16036 showing distinct spiral abrasive striations alongside an ancient copper tubular drill bit.",
    thumbnailQuestion: "Did ancient drillers use high-speed machine rotation or abrasive slurry friction to cut these grooves?",
    titlePromise: "Forensic laboratory investigation into the physical drill cores documented by Flinders Petrie.",
    thumbnailPromise: "Forensic inspection of toolmarks and concentric micro-grooves preserved in ancient stone.",
    howTheyWorkTogether: "Title asks how Egyptians achieved such precision, thumbnail provides the forensic toolmark artifact. The viewer clicks to see if rotary machines or sand slurry made them.",
    promptMidjourney: "Forensic museum laboratory photography of an ancient Egyptian tubular drill core from Giza, visible spiral abrasive cutting grooves, resting next to an annealed copper tube with quartz abrasive paste, dramatic teal and amber rim lighting, 8k --ar 16:9 --style raw --v 6.0",
    promptDalleFlux: "Close-up laboratory macro shot of an ancient granite drill core with concentric spiral grooving. Dramatic museum spotlighting, high contrast texture, photorealistic, 8k.",
  },
  {
    id: "preset-straightedge",
    name: "Optical Flatness Test",
    badge: "TOLERANCE",
    overlayText: "ZERO LIGHT",
    colorFilter: "vivid",
    focalSubject: "Precision steel engineer's straightedge held across an ancient diorite casing stone showing zero light bleed beneath the edge.",
    thumbnailQuestion: "How could ancient stone carvers calibrate surfaces to optical flatness without modern surface plates?",
    titlePromise: "Examines the metrology, three-rod methods, and sighting procedures used to achieve flat surfaces.",
    thumbnailPromise: "Definitive visual demonstration of optical flatness tolerance (zero light gap) on monumental stone.",
    howTheyWorkTogether: "Title introduces the stonework precision question, thumbnail shows the definitive modern metrology test being applied. The viewer clicks to discover the calibration secret.",
    promptMidjourney: "Extreme macro photograph of a modern precision engineer straightedge pressed against an ancient Egyptian diorite granite block, back-lit with bright light showing zero light escaping beneath the blade, hyper-detailed, award-winning cinematography --ar 16:9 --style raw --v 6.0",
    promptDalleFlux: "Photorealistic macro close-up of a metal straightedge ruler testing the flatness of an ancient polished Egyptian stone block. Intense back-lighting highlighting the perfect flush contact, 8k resolution.",
  },
  {
    id: "preset-quarry",
    name: "Megalithic Extraction",
    badge: "FIELD REPORT",
    overlayText: "UNFINISHED",
    colorFilter: "warm",
    focalSubject: "Aswan unfinished obelisk quarry trench with spherical dolerite pounding balls resting in concave scoop marks.",
    thumbnailQuestion: "Could millions of blows from 12-pound hand-held dolerite rocks really extract a 1,000-ton monolith?",
    titlePromise: "Reveals the primary extraction methods, thermal shock, and pounding pounder evidence from royal quarries.",
    thumbnailPromise: "Visceral encounter with the sheer scale of ancient megalithic quarry trenches and physical pounders.",
    howTheyWorkTogether: "Title asks about stonework precision, thumbnail confronts the viewer with the monumental scale of extraction. Bridges raw geology with delicate finish.",
    promptMidjourney: "Dramatic wide-angle low perspective inside the Aswan unfinished obelisk trench, massive pink granite walls with concave pounding scoops, battered spherical dolerite maul in the foreground, golden desert dust particles floating in sunlight rays --ar 16:9 --style raw --v 6.0",
    promptDalleFlux: "Cinematic photograph inside an ancient Egyptian granite quarry. Giant monolithic stone trench with ancient round hammer stones resting in the dust. Volumetric sun rays cutting through desert haze, 8k.",
  },
  {
    id: "preset-slurry",
    name: "Abrasive Sand Friction",
    badge: "SOLVED?",
    overlayText: "SAND SLURRY",
    colorFilter: "noir",
    focalSubject: "Macro cross-section of a copper saw blade cutting through hard rose granite with crushed quartz sand slurry foaming at the kerf.",
    thumbnailQuestion: "Does quartz sand slurry possess enough hardness to spall crystalline igneous granite?",
    titlePromise: "Deconstructs the tribological physics and experimental archaeology of copper-abrasive cutting.",
    thumbnailPromise: "A microscopic view of ancient stone-cutting mechanics in action: soft metal carrying hard rock grains.",
    howTheyWorkTogether: "Title frames the mystery of how it was done, thumbnail visually reveals the scientific solution (abrasive slurry). Provokes the click to see if science solves the mystery.",
    promptMidjourney: "Macro documentary shot of an ancient copper saw blade cutting into a pink granite block, quartz sand abrasive slurry foaming along the narrow kerf slot, high micro-contrast, moody deep shadows, National Geographic style --ar 16:9 --style raw --v 6.0",
    promptDalleFlux: "Close-up cinematic shot of an ancient stonecutting experiment: flat copper saw blade in a granite groove with abrasive quartz sand and water slurry, ultra-detailed rock crystal textures, 8k.",
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
  aiApiKey: z.string().trim().optional(),
});

export const regenerateThumbnailConceptServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => RegenerateThumbnailInput.parse(d))
  .handler(async ({ data }) => {
    const envKey = (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "").trim();
    const effectiveAiKey = (data.aiApiKey || envKey).trim();

    // If no API key or fallback, find best preset or dynamic variation
    if (!effectiveAiKey) {
      const lowerFeedback = (data.feedback || "").toLowerCase();
      const lowerStyle = (data.styleAngle || "").toLowerCase();

      let matched = CURATED_THUMBNAIL_PRESETS[1]; // default to Core
      if (lowerFeedback.includes("flat") || lowerStyle.includes("straightedge") || lowerStyle.includes("optical")) {
        matched = CURATED_THUMBNAIL_PRESETS[2];
      } else if (lowerFeedback.includes("quarry") || lowerFeedback.includes("pound") || lowerStyle.includes("megalith")) {
        matched = CURATED_THUMBNAIL_PRESETS[3];
      } else if (lowerFeedback.includes("sand") || lowerFeedback.includes("slurry") || lowerStyle.includes("abrasive")) {
        matched = CURATED_THUMBNAIL_PRESETS[4];
      } else if (lowerFeedback.includes("seam") || lowerFeedback.includes("joint") || lowerStyle.includes("precision")) {
        matched = CURATED_THUMBNAIL_PRESETS[0];
      } else {
        // Pick random preset different from first
        const randIdx = Math.floor(Math.random() * CURATED_THUMBNAIL_PRESETS.length);
        matched = CURATED_THUMBNAIL_PRESETS[randIdx];
      }

      return {
        concept: {
          imageUrl: "/thumbnails/our-target-egypt.jpg",
          promptMidjourney: matched.promptMidjourney,
          promptDalleFlux: matched.promptDalleFlux,
          focalSubject: matched.focalSubject,
          compositionAndFraming: "Rule of thirds, dramatic raking key light, deep background depth of field.",
          colorPaletteAndLighting: `${matched.colorFilter} tones with high micro-contrast.`,
          recommendedOverlayText: matched.overlayText,
          recommendedBadge: matched.badge,
          contrastStrategy: "High luminance differential between foreground subject and background backdrop.",
        },
        ourStrategy: {
          entityRole: "Our Target Video" as const,
          title: data.ourTitle,
          thumbnailUrl: "/thumbnails/our-target-egypt.jpg",
          thumbnailSubject: matched.focalSubject,
          thumbnailQuestion: matched.thumbnailQuestion,
          titlePromise: matched.titlePromise,
          thumbnailPromise: matched.thumbnailPromise,
          howTheyWorkTogether: matched.howTheyWorkTogether,
        },
        feedbackApplied: data.feedback || "Generated fresh high-contrast alternative angle",
      };
    }

    try {
      const isGemini =
        effectiveAiKey.startsWith("AIza") ||
        effectiveAiKey.length === 39 ||
        effectiveAiKey.length === 40;

      const prompt = `You are an elite YouTube Documentary Thumbnail Director.
The creator was NOT satisfied with the previous thumbnail generated for their video title:
"${data.ourTitle}"

CREATOR FEEDBACK / REASON FOR REGENERATION:
"${data.feedback || "The previous concept was not compelling enough; generate a fresh, distinctive high-CTR alternative"}"
DESIRED DIRECTION: "${data.styleAngle || "High-tension documentary visual"}"

TASK:
Generate an entirely NEW thumbnail visual concept and 5 packaging pillars that fix the creator's critique.
Apply Day 4 Rule of Multiplication: Title poses question, thumbnail delivers visual proof or impossible dilemma. Never repeat title words in thumbnail text. Maximum 1-3 words of complementary text.

Return a clean, valid JSON object matching this schema:
{
  "thumbnailSubject": "Detailed visual description of new focal subject, lighting, and composition",
  "thumbnailQuestion": "The subconscious question this new image poses",
  "titlePromise": "What our title promises",
  "thumbnailPromise": "What this new visual promises",
  "howTheyWorkTogether": "The psychological multiplication synergy between title and this new thumbnail",
  "promptMidjourney": "Complete new Midjourney v6 prompt with --ar 16:9 --style raw --v 6.0",
  "promptDalleFlux": "Complete prompt for Flux.1 or DALL-E 3",
  "recommendedOverlayText": "1-3 words max high-impact hook",
  "recommendedBadge": "Category badge e.g. DOCUMENTARY or FORENSIC",
  "colorFilter": "warm or teal or vivid or noir",
  "feedbackApplied": "Summary of how creator's feedback was resolved"
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
              temperature: 0.5,
            },
          }),
        });
        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
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
            temperature: 0.5,
          }),
        });
        if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
        const dataJson = await response.json();
        rawContent = dataJson.choices?.[0]?.message?.content || "";
      }

      const parsed = JSON.parse(rawContent);

      return {
        concept: {
          imageUrl: "/thumbnails/our-target-egypt.jpg",
          promptMidjourney: parsed.promptMidjourney || "",
          promptDalleFlux: parsed.promptDalleFlux || "",
          focalSubject: parsed.thumbnailSubject || "",
          compositionAndFraming: "Rule of thirds, dramatic directional raking light.",
          colorPaletteAndLighting: `${parsed.colorFilter || "warm"} tones with high micro-contrast.`,
          recommendedOverlayText: parsed.recommendedOverlayText || "SOLVED",
          recommendedBadge: parsed.recommendedBadge || "DOCUMENTARY",
          contrastStrategy: "High luminance contrast designed to command the browse feed.",
        },
        ourStrategy: {
          entityRole: "Our Target Video" as const,
          title: data.ourTitle,
          thumbnailUrl: "/thumbnails/our-target-egypt.jpg",
          thumbnailSubject: parsed.thumbnailSubject || "",
          thumbnailQuestion: parsed.thumbnailQuestion || "",
          titlePromise: parsed.titlePromise || "",
          thumbnailPromise: parsed.thumbnailPromise || "",
          howTheyWorkTogether: parsed.howTheyWorkTogether || "",
        },
        feedbackApplied: parsed.feedbackApplied || data.feedback || "Generated fresh alternative",
      };
    } catch (err) {
      console.warn("Regeneration with AI failed, using fallback preset:", err);
      const fallbackPreset = CURATED_THUMBNAIL_PRESETS[Math.floor(Math.random() * CURATED_THUMBNAIL_PRESETS.length)];
      return {
        concept: {
          imageUrl: "/thumbnails/our-target-egypt.jpg",
          promptMidjourney: fallbackPreset.promptMidjourney,
          promptDalleFlux: fallbackPreset.promptDalleFlux,
          focalSubject: fallbackPreset.focalSubject,
          compositionAndFraming: "Rule of thirds composition.",
          colorPaletteAndLighting: `${fallbackPreset.colorFilter} tones.`,
          recommendedOverlayText: fallbackPreset.overlayText,
          recommendedBadge: fallbackPreset.badge,
          contrastStrategy: "High micro-contrast.",
        },
        ourStrategy: {
          entityRole: "Our Target Video" as const,
          title: data.ourTitle,
          thumbnailUrl: "/thumbnails/our-target-egypt.jpg",
          thumbnailSubject: fallbackPreset.focalSubject,
          thumbnailQuestion: fallbackPreset.thumbnailQuestion,
          titlePromise: fallbackPreset.titlePromise,
          thumbnailPromise: fallbackPreset.thumbnailPromise,
          howTheyWorkTogether: fallbackPreset.howTheyWorkTogether,
        },
        feedbackApplied: data.feedback || "Applied alternative visual preset",
      };
    }
  });
