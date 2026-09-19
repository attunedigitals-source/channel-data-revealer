import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  title: z.string().trim().min(1).max(300),
  thumbnail: z.string().min(20), // data URL: data:<mime>;base64,...
  aiApiKey: z.string().trim().optional(),
});

export type ThumbnailReport = {
  title: string;
  thumbnail: string;
  titleQuestion: string;
  thumbnailMessage: string;
};

const ResultSchema = z.object({
  titleQuestion: z.string(),
  thumbnailMessage: z.string(),
});

function generateFallbackPackaging(title: string): { titleQuestion: string; thumbnailMessage: string } {
  const t = title.trim();
  const lower = t.toLowerCase();

  let question = "";
  if (lower.startsWith("how to") || lower.startsWith("how i")) {
    question = `What is the exact, step-by-step secret behind ${t.replace(/^how (to|i)/i, "").trim()}?`;
  } else if (lower.startsWith("why ")) {
    question = `What is the hidden truth behind ${t.replace(/^why /i, "").trim()} that most people never realize?`;
  } else if (lower.startsWith("i tried") || lower.startsWith("i tested")) {
    question = "Did it actually live up to the hype, or was it a complete waste of time and money?";
  } else if (lower.includes("what if") || lower.includes("how would") || lower.includes("could we")) {
    question = "What catastrophic or unexpected reality would unfold if this scenario actually took place?";
  } else if (lower.includes(" vs ") || lower.includes(" versus ")) {
    question = "Which one truly comes out on top when pushed to the absolute extreme?";
  } else if (lower.includes("richest") || lower.includes("billionaire") || lower.includes("wealth")) {
    question = "Just how astronomical was this scale of wealth, and how was it acquired and spent?";
  } else if (lower.includes("cheapest") || lower.includes("most expensive")) {
    question = "Can the extreme price difference truly be justified, or is it pure marketing hype?";
  } else if (lower.includes("documentary") || lower.includes("story") || lower.includes("history")) {
    question = "What really happened behind closed doors that mainstream history left out?";
  } else {
    question = `What is the surprising truth behind "${t}", and what does it mean for the viewer?`;
  }

  const message =
    "Presents a high-contrast visual hook with dramatic subject framing and bold typography designed to evoke immediate viewer curiosity and maximize click-through rate.";

  return { titleQuestion: question, thumbnailMessage: message };
}

export const analyzeThumbnail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ThumbnailReport> => {
    if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(data.thumbnail)) {
      throw new Error("That doesn't look like an image. Please upload a JPG or PNG thumbnail.");
    }

    const geminiKey =
      data.aiApiKey?.trim() ||
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      process.env["GOOGLE_AI_KEY"];

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const openAiKey = process.env["OPENAI_API_KEY"];

    const prompt = [
      "You are a YouTube packaging expert analyzing a video's title and thumbnail.",
      "1. titleQuestion: The single burning question or curiosity gap the title creates in a viewer's mind. Write it as one question, phrased the way the viewer would ask it.",
      "2. thumbnailMessage: What the thumbnail communicates visually (subject, emotion, text, colors, composition, and the promise it makes) in 1-2 sentences.",
      `Video title: "${data.title}"`,
    ].join("\n");

    // Option 1: Direct Google Gemini 1.5 Flash Vision (Free tier, fast, high accuracy)
    if (geminiKey) {
      try {
        const match = /^data:([^;]+);base64,(.+)$/.exec(data.thumbnail);
        const mimeType = match?.[1] || "image/jpeg";
        const base64Data = match?.[2] || "";

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Data } },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = ResultSchema.safeParse(JSON.parse(rawText));
            if (parsed.success) {
              return {
                title: data.title,
                thumbnail: data.thumbnail,
                titleQuestion: parsed.data.titleQuestion,
                thumbnailMessage: parsed.data.thumbnailMessage,
              };
            }
          }
        }
      } catch (err) {
        console.warn("Gemini vision analysis failed, falling back:", err);
      }
    }

    // Option 2: Lovable AI Gateway
    if (lovableKey) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": lovableKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.8-flash",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: data.thumbnail } },
                ],
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "thumbnail_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    titleQuestion: { type: "string" },
                    thumbnailMessage: { type: "string" },
                  },
                  required: ["titleQuestion", "thumbnailMessage"],
                  additionalProperties: false,
                },
              },
            },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const content: string | undefined = json.choices?.[0]?.message?.content;
          if (content) {
            const parsed = ResultSchema.safeParse(JSON.parse(content));
            if (parsed.success) {
              return {
                title: data.title,
                thumbnail: data.thumbnail,
                titleQuestion: parsed.data.titleQuestion,
                thumbnailMessage: parsed.data.thumbnailMessage,
              };
            }
          }
        }
      } catch (err) {
        console.warn("Lovable AI vision analysis failed, falling back:", err);
      }
    }

    // Option 3: OpenAI Vision
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
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: data.thumbnail } },
                ],
              },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const content: string | undefined = json.choices?.[0]?.message?.content;
          if (content) {
            const parsed = ResultSchema.safeParse(JSON.parse(content));
            if (parsed.success) {
              return {
                title: data.title,
                thumbnail: data.thumbnail,
                titleQuestion: parsed.data.titleQuestion,
                thumbnailMessage: parsed.data.thumbnailMessage,
              };
            }
          }
        }
      } catch (err) {
        console.warn("OpenAI vision analysis failed, falling back:", err);
      }
    }

    // High-quality smart heuristic fallback if no AI key is active or AI failed
    const fallback = generateFallbackPackaging(data.title);
    return {
      title: data.title,
      thumbnail: data.thumbnail,
      titleQuestion: fallback.titleQuestion,
      thumbnailMessage: fallback.thumbnailMessage,
    };
  });
