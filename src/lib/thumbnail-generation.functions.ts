import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GenerateThumbnailInput = z.object({
  title: z.string().trim().min(1),
  concept: z.string().trim().min(1),
  aiApiKey: z.string().trim().optional(),
});

export const generateThumbnailImage = createServerFn({ method: "POST" })
  .validator((data: unknown) => GenerateThumbnailInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = data.aiApiKey || process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"];
    if (!apiKey) throw new Error("Add a Gemini AI key in API Configuration to create a thumbnail.");

    const prompt = `Create a cinematic, high-contrast 16:9 YouTube documentary thumbnail image. The title promise is: "${data.title}". Visual concept: "${data.concept}". Compose one clear focal subject, bold readable shapes, strong light-dark separation, and a simple background that remains legible at small mobile size. Make the image feel like a premium historical/science investigation. No lettering, words, logos, borders, or collage. Do not depict unsupported details as a real photograph; use a clearly cinematic illustration or reconstruction aesthetic.`;
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: "gemini-3.1-flash-image",
        input: prompt,
        response_format: { type: "image", aspect_ratio: "16:9", image_size: "1K" },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Gemini thumbnail generation failed:", response.status, detail.slice(0, 500));
      throw new Error(
        response.status === 429
          ? "AI image quota reached. Try again later."
          : "Gemini could not create the thumbnail. Check your AI key and try again.",
      );
    }

    const result = (await response.json()) as {
      output_image?: { data?: string; mime_type?: string };
    };
    if (!result.output_image?.data)
      throw new Error("Gemini returned no image. Try a simpler thumbnail concept.");
    return {
      data: result.output_image.data,
      mimeType: result.output_image.mime_type || "image/png",
    };
  });
