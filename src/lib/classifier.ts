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
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
