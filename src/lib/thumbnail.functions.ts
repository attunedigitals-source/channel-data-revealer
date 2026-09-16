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

export const analyzeThumbnail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ThumbnailReport> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!lovableKey) throw new Error("AI is not configured for this app yet.");

    if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(data.thumbnail)) {
      throw new Error("That doesn't look like an image. Please upload a JPG or PNG thumbnail.");
    }

    const { generateText, Output } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(lovableKey);

    const { output } = await generateText({
      model: gateway("google/gemini-3.8-flash"),
      output: Output.object({
        schema: z.object({
          titleQuestion: z.string(),
          thumbnailMessage: z.string(),
        }),
      }),
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
            {
              type: "file",
              data: data.thumbnail,
              mediaType: (data.thumbnail.match(/^data:(image\/[a-zA-Z0-9.+-]+);/)?.[1] ??
                "image/jpeg") as `image/${string}`,
            },
          ],
        },
      ],
    });

    return {
      title: data.title,
      thumbnail: data.thumbnail,
      titleQuestion: output.titleQuestion,
      thumbnailMessage: output.thumbnailMessage,
    };
  });
