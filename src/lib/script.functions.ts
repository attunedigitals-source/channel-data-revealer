import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GenerateScriptInput = z.object({
  workingTitle: z.string().trim().min(1),
  coreQuestion: z.string().trim().min(1),
  audience: z.string().trim().optional(),
  storyMap: z.string().trim().optional(),
  claimLedger: z.string().trim().optional(),
  targetMinutes: z.number().int().min(3).max(60).default(12),
  aiApiKey: z.string().trim().optional(),
});

export const generateDocumentaryScript = createServerFn({ method: "POST" })
  .validator((data: unknown) => GenerateScriptInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = data.aiApiKey || process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"];
    if (!apiKey) throw new Error("Add a Gemini AI key in API Configuration to draft a script.");

    const prompt = `You are a careful documentary script editor. Draft an original, audience-friendly YouTube documentary script using only the supplied material. Do not invent facts, quotations, sources, archival footage, measurements, or scholarly consensus. When the supplied evidence does not substantiate a detail needed for the story, mark it [SOURCE NEEDED: describe what must be verified] in the draft. Distinguish archaeological evidence from interpretation and modern experimental reconstruction. Never manufacture mystery or overstate certainty.

VIDEO TITLE: ${data.workingTitle}
CENTRAL QUESTION: ${data.coreQuestion}
INTENDED VIEWER: ${data.audience || "Curious general audience"}
STORY MAP: ${data.storyMap || "No story map supplied; use a restrained seven-beat documentary structure."}
CLAIM LEDGER AND SOURCES: ${data.claimLedger || "No verified claims supplied. Mark factual assertions [SOURCE NEEDED] and focus the draft on questions and a research plan."}
TARGET RUNTIME: ${data.targetMinutes} minutes

Return a production-ready draft in plain text with these headings:
1. Cold open (0:00–0:30)
2. The central question and viewer promise
3. Context
4. Investigation
5. Complication
6. Evidence and explanation
7. Payoff and closing thought

For each section, label VISUAL, NARRATION, and SOURCE NOTES separately. Write original narration at a natural spoken pace, use short paragraphs, and include [SOURCE NEEDED] markers where evidence is missing. End with a short list of the highest-priority claims the creator must verify before recording.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 8192 },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("Gemini script generation failed:", response.status, detail.slice(0, 500));
      throw new Error(
        response.status === 429
          ? "AI quota reached. Try again later."
          : "Gemini could not draft this script. Check your AI key and try again.",
      );
    }

    const result = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const script = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    if (!script) throw new Error("Gemini returned an empty draft. Try again.");
    return script;
  });
