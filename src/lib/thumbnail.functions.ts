import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  title: z.string().trim().min(1).max(300),
  thumbnail: z.string().min(20), // data URL: data:<mime>;base64,...
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

export const analyzeThumbnail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ThumbnailReport> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!lovableKey) throw new Error("AI is not configured for this app yet.");

    if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(data.thumbnail)) {
      throw new Error("That doesn't look like an image. Please upload a JPG or PNG thumbnail.");
    }

    // The AI SDK hangs on image parts through this provider, so call the
    // gateway's chat completions endpoint directly with a strict JSON schema.
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
              {
                type: "text",
                text: [
                  "You are a YouTube packaging expert analyzing a video's title and thumbnail.",
                  "1. titleQuestion: The single burning question or curiosity gap the title creates in a viewer's mind. Write it as one question, phrased the way the viewer would ask it.",
                  "2. thumbnailMessage: What the thumbnail communicates visually (subject, emotion, text, colors, composition, and the promise it makes) in 1-2 sentences.",
                  `Video title: "${data.title}"`,
                ].join("\n"),
              },
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

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AI analysis failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as any;
    const content: string | undefined = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("The AI returned an empty response. Try again.");

    const parsed = ResultSchema.safeParse(JSON.parse(content));
    if (!parsed.success) throw new Error("The AI response was malformed. Try again.");

    return {
      title: data.title,
      thumbnail: data.thumbnail,
      titleQuestion: parsed.data.titleQuestion,
      thumbnailMessage: parsed.data.thumbnailMessage,
    };
  });
