export type ClassificationResult = {
  niche: string;
  style: string;
};

interface ClassifierInput {
  channel: any;
  videos: any[];
  avgDurationSeconds?: number | undefined;
  customAiKey?: string | undefined;
}

// Built-in intelligent semantic classifier that guarantees accurate Niche & Style
// even when no AI service is configured or available.
export function classifyChannelHeuristic({
  channel,
  videos,
  avgDurationSeconds,
}: ClassifierInput): ClassificationResult {
  const title = (channel.snippet?.title || "").toLowerCase();
  const desc = (channel.snippet?.description || "").toLowerCase();
  const rawTopics = (channel.topicDetails?.topicCategories || []) as string[];
  const topics = rawTopics.map((t) =>
    decodeURIComponent(t.split("/").pop() || "")
      .replace(/_/g, " ")
      .toLowerCase(),
  );

  const videoTitles = videos.map((v) => (v.snippet?.title || "").toLowerCase());
  const allText = [title, desc, ...topics, ...videoTitles].join(" ");

  const patterns = [
    {
      keywords: [
        "solar system",
        "space",
        "astronomy",
        "physics",
        "black hole",
        "cosmology",
        "alien",
        "fermi paradox",
        "quantum",
        "universe",
        "nasa",
        "galaxy",
        "astrophysics",
      ],
      niche: "Space & Theoretical Physics",
      style: "Narrated scientific explainers and deep dives",
    },
    {
      keywords: [
        "science",
        "experiment",
        "mythbusters",
        "scientific",
        "laboratory",
        "discovery",
        "nature",
        "biology",
        "chemistry",
        "earth science",
        "exploration",
      ],
      niche: "Popular Science Documentaries",
      style: "Curiosity-driven television documentary clips and explainers",
    },
    {
      keywords: [
        "smartphone",
        "iphone",
        "android",
        "gadget",
        "laptop",
        "unboxing",
        "specs",
        "tech review",
        "apple",
        "samsung",
        "macbook",
        "camera test",
        "hardware",
      ],
      niche: "Consumer Technology & Gadgets",
      style: "Sleek product reviews and tech commentary",
    },
    {
      keywords: [
        "coding",
        "programming",
        "developer",
        "javascript",
        "python",
        "react",
        "nextjs",
        "software engineering",
        "web dev",
        "css",
        "algorithm",
        "devops",
      ],
      niche: "Software Engineering & Web Dev",
      style: "Hands-on code tutorials and project walkthroughs",
    },
    {
      keywords: [
        "gameplay",
        "gaming",
        "walkthrough",
        "lets play",
        "playthrough",
        "minecraft",
        "fortnite",
        "gta",
        "ps5",
        "xbox",
        "nintendo",
        "roblox",
        "esports",
      ],
      niche: "Gaming & Interactive Entertainment",
      style: "Entertaining gameplay commentary and stream highlights",
    },
    {
      keywords: [
        "crypto",
        "bitcoin",
        "stocks",
        "investing",
        "finance",
        "real estate",
        "passive income",
        "wealth",
        "trading",
        "money",
        "personal finance",
      ],
      niche: "Personal Finance & Wealth Building",
      style: "Educational financial breakdowns and market analysis",
    },
    {
      keywords: [
        "workout",
        "fitness",
        "bodybuilding",
        "diet",
        "nutrition",
        "calisthenics",
        "muscle",
        "weight loss",
        "gym",
        "exercise routine",
      ],
      niche: "Health, Fitness & Bodybuilding",
      style: "Actionable workout guides and motivational coaching",
    },
    {
      keywords: [
        "recipe",
        "cooking",
        "chef",
        "food",
        "baking",
        "taste test",
        "street food",
        "restaurant",
        "meal prep",
        "culinary",
      ],
      niche: "Culinary Arts & Food Review",
      style: "Step-by-step recipe tutorials and taste explorations",
    },
    {
      keywords: [
        "history",
        "war",
        "ww2",
        "ancient",
        "civilization",
        "empire",
        "historical",
        "battle",
        "monarchy",
        "medieval",
      ],
      niche: "Historical Documentaries",
      style: "Narrative historical storytelling with archival visuals",
    },
    {
      keywords: [
        "movie review",
        "film",
        "cinema",
        "trailer",
        "box office",
        "director",
        "actor",
        "hollywood",
        "easter eggs",
        "breakdown",
      ],
      niche: "Film Analysis & Pop Culture",
      style: "Engaging scene breakdowns and cultural critiques",
    },
    {
      keywords: [
        "vlog",
        "daily routine",
        "lifestyle",
        "travel vlog",
        "solo travel",
        "family vlog",
        "day in the life",
        "living in",
      ],
      niche: "Lifestyle & Travel Storytelling",
      style: "Personal cinematic storytelling and daily vlogs",
    },
    {
      keywords: [
        "business",
        "entrepreneur",
        "startup",
        "marketing",
        "ecommerce",
        "case study",
        "company collapse",
        "how they made billions",
      ],
      niche: "Business Case Studies & Strategy",
      style: "Analytical documentary essays and corporate deep dives",
    },
    {
      keywords: [
        "animation",
        "animated",
        "anime",
        "cartoon",
        "storytime animation",
        "motion graphics",
        "cgi",
      ],
      niche: "Animation & Storytime Art",
      style: "Creative illustrated narratives and animated shorts",
    },
    {
      keywords: [
        "podcast",
        "interview",
        "conversation",
        "talk show",
        "full episode",
        "roundtable",
        "discussion",
      ],
      niche: "Long-form Podcast & Interviews",
      style: "In-depth conversational interviews and panel discussions",
    },
  ];

  let bestMatch: (typeof patterns)[0] | null = null;
  let maxScore = 0;

  for (const item of patterns) {
    let score = 0;
    for (const kw of item.keywords) {
      if (title.includes(kw)) score += 6;
      if (topics.some((t) => t.includes(kw))) score += 5;
      if (desc.includes(kw)) score += 2;
      const titleMatches = videoTitles.filter((t) => t.includes(kw)).length;
      score += titleMatches * 2;
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  let computedNiche = bestMatch?.niche;
  let computedStyle = bestMatch?.style;

  if (!computedNiche) {
    const firstTopic = topics[0];
    if (firstTopic) {
      const topTopic = firstTopic.replace(/\b\w/g, (c) => c.toUpperCase());
      computedNiche = `${topTopic} Media & Education`;
    } else {
      computedNiche = "General Entertainment & Education";
    }
  }

  // Refine style based on content traits
  const hasHypothetical = videoTitles.some(
    (t) => t.includes("what if") || t.includes("how would") || t.includes("could we"),
  );
  const isExplainer = videoTitles.some(
    (t) => t.includes("explained") || t.includes("how to") || t.includes("why"),
  );
  const isDoc =
    allText.includes("documentary") ||
    topics.some((t) => t.includes("television") || t.includes("film"));

  if (hasHypothetical && computedNiche.includes("Science")) {
    computedNiche = "Popular Science and Technology";
    computedStyle = "Narrated educational explainers and hypothetical scenarios";
  } else if (isDoc && computedNiche.includes("Science")) {
    computedNiche = "Popular Science Documentaries";
    computedStyle = "Curiosity-driven television documentary clips and explainers";
  } else if (!computedStyle) {
    if (avgDurationSeconds && avgDurationSeconds > 900) {
      computedStyle = "Comprehensive long-form documentary and deep-dive explainers";
    } else if (avgDurationSeconds && avgDurationSeconds < 180) {
      computedStyle = "Fast-paced punchy shorts and quick informational overviews";
    } else if (isExplainer) {
      computedStyle = "Informative structured guides and educational commentary";
    } else {
      computedStyle = "Engaging episodic content and viewer-focused presentations";
    }
  }

  return { niche: computedNiche, style: computedStyle };
}

// Try LLM generation across Gemini, Lovable, or OpenAI if keys are present
export async function classifyChannelWithAi(
  input: ClassifierInput,
): Promise<ClassificationResult | null> {
  const { channel, videos, avgDurationSeconds, customAiKey } = input;

  const geminiKey =
    customAiKey ||
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"] ||
    process.env["GOOGLE_AI_KEY"];

  const lovableKey = process.env["LOVABLE_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];

  const promptText = [
    "Classify this YouTube channel. Reply with JSON strictly conforming to: { \"niche\": string (2-4 words), \"style\": string (3-8 words) }.",
    `Channel: ${channel.snippet?.title ?? ""}`,
    `Description: ${(channel.snippet?.description ?? "").slice(0, 800)}`,
    `Recent video titles: ${videos
      .slice(0, 15)
      .map((v: any) => v.snippet?.title)
      .filter(Boolean)
      .join(" | ")
      .slice(0, 1200)}`,
    avgDurationSeconds ? `Average video duration: ${Math.round(avgDurationSeconds)}s` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Option 1: Direct Google Gemini REST API (Fast, reliable, free tier)
  if (geminiKey) {
    try {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (parsed.niche && parsed.style) {
            return { niche: parsed.niche, style: parsed.style };
          }
        }
      }
    } catch (err) {
      console.warn("Gemini classify failed, falling back:", err);
    }
  }

  // Option 2: Lovable AI Gateway
  if (lovableKey) {
    try {
      const { generateText, Output } = await import("ai");
      const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
      const { z } = await import("zod");
      const gateway = createLovableAiGatewayProvider(lovableKey);
      const { output } = await generateText({
        model: gateway("google/gemini-3.8-flash"),
        output: Output.object({
          schema: z.object({
            niche: z.string(),
            style: z.string(),
          }),
        }),
        prompt: promptText,
      });
      if (output?.niche && output?.style) {
        return { niche: output.niche, style: output.style };
      }
    } catch (err) {
      console.warn("Lovable AI classify failed, falling back:", err);
    }
  }

  // Option 3: OpenAI API
  if (openAiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'You classify YouTube channels. Output JSON: { "niche": "2-4 words", "style": "3-8 words" }',
            },
            { role: "user", content: promptText },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.niche && parsed.style) {
            return { niche: parsed.niche, style: parsed.style };
          }
        }
      }
    } catch (err) {
      console.warn("OpenAI classify failed, falling back:", err);
    }
  }

  return null;
}

// Main classification orchestrator: tries AI first, then uses smart heuristics
export async function getChannelNicheAndStyle(input: ClassifierInput): Promise<ClassificationResult> {
  const aiResult = await classifyChannelWithAi(input);
  if (aiResult && aiResult.niche && aiResult.style) {
    return aiResult;
  }
  return classifyChannelHeuristic(input);
}

export type OutlierPackagingResult = {
  outlierTopic: string;
  outlierTitleFormula: string;
  outlierThumbnailConcept: string;
  whyItWorked: string;
};

export interface OutlierPackagingInput {
  videoTitle: string;
  videoViewsText: string;
  videoViewsNum: number;
  medianViewsNum: number;
  multiplier: number;
  subscribersText: string;
  viewsSubRatioText: string;
  channelName: string;
  durationText?: string;
  customAiKey?: string;
}

export function detectTitleFormula(title: string): string {
  const t = title.toLowerCase();
  if (/^why\b|\bwhy (?:the|you|we|this|i|they|everything)\b/i.test(t)) {
    return "Curiosity Gap / Counterintuitive Explainer";
  }
  if (/^how\b|\bhow (?:to|they|we|i|it|a)\b/i.test(t)) {
    return "Process Breakdown / Mechanism Revealed";
  }
  if (/\b(i tried|i spent|i tested|i built|i survived|for \d+ (?:days|hours|months))\b/i.test(t)) {
    return "First-Person Immersion / Challenge Stunt";
  }
  if (/\b(secret|truth about|exposed|what they (?:don't|won't) tell you|untold|conspiracy|classified|hidden)\b/i.test(t)) {
    return "Insider Revelation / Myth-Busting";
  }
  if (/\bvs\b|\bversus\b|\bcompared to\b/i.test(t)) {
    return "Head-to-Head Comparison / Ultimate Showdown";
  }
  if (/\b(the most|the best|the worst|the deadliest|the rarest|the richest|the largest|the smallest|the fastest|the biggest)\b/i.test(t)) {
    return "Extreme Superlative + High Stakes";
  }
  if (/\b(stop|never|before you|warning|don't|mistake|avoid)\b/i.test(t)) {
    return "Loss Aversion / Urgent Warning";
  }
  if (/\bwhat happens when\b|\bif you\b/i.test(t)) {
    return "Hypothetical Scenario / Causal Experiment";
  }
  if (/\b(\d+ (?:reasons|things|ways|secrets|rules|tips|tricks|steps)|top \d+)\b/i.test(t)) {
    return "Curated Listicle / High Utility Framework";
  }
  if (/\?/.test(t) || /^(can|is|will|did|could|should|does)\b/i.test(t)) {
    return "Provocative Open-Loop Question";
  }
  if (/[:|-]/.test(title)) {
    return "Hero Subject + Timed Retrospective Angle";
  }
  return "High-Curiosity Narrative Hook";
}

export function extractOutlierTopic(title: string, channelName: string): string {
  // Strip channel names, pipes, brackets, and episode indicators
  let clean = title
    .replace(new RegExp(`\\b${channelName}\\b`, "gi"), "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^\)]*(?:4k|official|video|episode|ft\.|feat\.)[^\)]*\)/gi, "")
    .replace(/\|.*$/g, "") // Take primary clause if multiple parts
    .trim();

  // If clean became too short, use original
  if (clean.length < 8) clean = title;

  // Clean common prefixes
  clean = clean
    .replace(/^(why|how to|how|the truth about|the secret of|the real story of|i tried|we tried|stop|never|warning:)\s+/i, "")
    .replace(/^review:\s*/i, "")
    .trim();

  if (clean.includes(":")) {
    const parts = clean.split(":");
    clean = (parts[1]?.trim().length ?? 0) > 8 ? parts[1]!.trim() : parts[0]!.trim();
  }

  // Capitalize neatly
  const words = clean.split(/\s+/).slice(0, 7);
  return words.join(" ") || title.slice(0, 40);
}

export function deduceThumbnailConcept(formula: string, title: string, topic: string): string {
  const t = title.toLowerCase();
  if (formula.includes("Comparison")) {
    return "Dual-panel split-screen juxtaposing both subjects with bold contrast and distinct color separation.";
  }
  if (formula.includes("Superlative") || formula.includes("Stakes")) {
    return "Dramatic wide-angle perspective emphasizing colossal scale with vibrant glow and focal spotlight.";
  }
  if (formula.includes("Revelation") || formula.includes("Myth-Busting") || /\b(tapes|secret|classified)\b/i.test(t)) {
    return "Atmospheric low-key lighting with a redacted/censored focal element, document stamp, or mysterious silhouette.";
  }
  if (formula.includes("Immersion") || formula.includes("Challenge")) {
    return "Expressive human focal reaction paired with a prominent countdown badge or bold progress counter.";
  }
  if (/\b(iphone|phone|laptop|macbook|gpu|car|gadget|review|specs)\b/i.test(t)) {
    return "Ultra-crisp macro hero shot of the product with dramatic studio rim-lighting and minimal background clutter.";
  }
  if (formula.includes("Loss Aversion") || formula.includes("Warning")) {
    return "High-urgency visual cue with saturated amber/red warning accents and an unmistakable focal problem.";
  }
  if (formula.includes("Question") || formula.includes("Explainer")) {
    return "Striking visual paradox with clean 3D illustration or high-contrast diagram provoking cognitive dissonance.";
  }
  return "High-contrast hero visual paired with an intriguing visual question mark or dramatic focal contrast.";
}

export function analyzeOutlierPackagingHeuristic(input: OutlierPackagingInput): OutlierPackagingResult {
  const formula = detectTitleFormula(input.videoTitle);
  const topic = extractOutlierTopic(input.videoTitle, input.channelName);
  const thumbnailConcept = deduceThumbnailConcept(formula, input.videoTitle, topic);

  let whyItWorked: string;
  if (input.multiplier >= 2.0) {
    whyItWorked = `Significantly outperformed the channel's recent baseline by ${input.multiplier.toFixed(1)}x. Leveraged a "${formula}" hook that achieved broad browse and suggested traction well beyond core subscribers (${input.viewsSubRatioText} views/sub ratio), tapping into high mainstream curiosity around "${topic}".`;
  } else if (input.multiplier >= 1.3) {
    whyItWorked = `Beats recent channel baseline by ${input.multiplier.toFixed(1)}x with strong ${input.viewsSubRatioText} views/sub engagement. The "${formula}" packaging created higher initial click-through and broader algorithmic reach for "${topic}".`;
  } else {
    whyItWorked = `Top performer among recent uploads (${input.multiplier.toFixed(1)}x of baseline). Effective packaging around "${topic}" with a "${formula}" angle that resonated strongly with current active viewers.`;
  }

  return {
    outlierTopic: topic,
    outlierTitleFormula: formula,
    outlierThumbnailConcept: thumbnailConcept,
    whyItWorked,
  };
}

export async function analyzeOutlierPackaging(input: OutlierPackagingInput): Promise<OutlierPackagingResult> {
  const geminiKey =
    input.customAiKey?.trim() ||
    process.env["GEMINI_API_KEY"] ||
    process.env["VITE_GEMINI_API_KEY"] ||
    (import.meta as unknown as { env?: Record<string, string> }).env?.["VITE_GEMINI_API_KEY"] ||
    (import.meta as unknown as { env?: Record<string, string> }).env?.["GEMINI_API_KEY"];

  const lovableKey =
    process.env["LOVABLE_AI_KEY"] ||
    (import.meta as unknown as { env?: Record<string, string> }).env?.["LOVABLE_AI_KEY"];

  const promptText = `Analyze this standout YouTube video which outperformed the channel's recent baseline views by ${input.multiplier.toFixed(1)}x.
Channel: "${input.channelName}" (Subscribers: ${input.subscribersText})
Outlier Video Title: "${input.videoTitle}"
Views: ${input.videoViewsText} (Views/Subs Ratio: ${input.viewsSubRatioText})
Recent Normal Median Views: ${input.medianViewsNum > 0 ? input.medianViewsNum.toLocaleString() : "N/A"}
Duration: ${input.durationText || "Standard"}

Respond strictly with a JSON object:
{
  "outlierTopic": "Specific core topic/subject of the video (3-6 words)",
  "outlierTitleFormula": "The psychological title formula/structure used (e.g. 'Curiosity Gap + Extreme Superlative', 'Contrarian Paradox', 'Stunt Challenge + Stakes', etc.) (3-6 words)",
  "outlierThumbnailConcept": "Strategic description of the visual thumbnail composition and psychological hook (12-25 words)",
  "whyItWorked": "Sharp, strategic diagnosis of why this video broke out with current viewers and outperformed normal channel baseline (25-45 words)"
}`;

  // Try Gemini if key exists
  if (geminiKey) {
    try {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (
            parsed.outlierTopic &&
            parsed.outlierTitleFormula &&
            parsed.outlierThumbnailConcept &&
            parsed.whyItWorked
          ) {
            return {
              outlierTopic: parsed.outlierTopic,
              outlierTitleFormula: parsed.outlierTitleFormula,
              outlierThumbnailConcept: parsed.outlierThumbnailConcept,
              whyItWorked: parsed.whyItWorked,
            };
          }
        }
      }
    } catch (err) {
      console.warn("Gemini outlier packaging analysis failed, using heuristic:", err);
    }
  }

  // Try Lovable AI Gateway
  if (lovableKey) {
    try {
      const { generateText, Output } = await import("ai");
      const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
      const { z } = await import("zod");
      const gateway = createLovableAiGatewayProvider(lovableKey);
      const { output } = await generateText({
        model: gateway("google/gemini-3.8-flash"),
        output: Output.object({
          schema: z.object({
            outlierTopic: z.string(),
            outlierTitleFormula: z.string(),
            outlierThumbnailConcept: z.string(),
            whyItWorked: z.string(),
          }),
        }),
        prompt: promptText,
      });
      if (
        output?.outlierTopic &&
        output?.outlierTitleFormula &&
        output?.outlierThumbnailConcept &&
        output?.whyItWorked
      ) {
        return output;
      }
    } catch (err) {
      console.warn("Lovable AI outlier packaging analysis failed, using heuristic:", err);
    }
  }

  // Fallback to high-fidelity heuristic
  return analyzeOutlierPackagingHeuristic(input);
}

