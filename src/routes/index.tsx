import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Loader2, Play, Search } from "lucide-react";
import { analyzeChannel, type ChannelReport } from "@/lib/youtube.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Channel Sheet — YouTube Channel Data Extractor" },
      {
        name: "description",
        content:
          "Paste any YouTube channel URL and get subscribers, video count, niche, average length, upload frequency, best video and style in one row.",
      },
      { property: "og:title", content: "Channel Sheet — YouTube Channel Data Extractor" },
      {
        property: "og:description",
        content:
          "Turn any YouTube channel link into a clean data row: subs, videos, niche, upload frequency, best video and style.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const COLUMNS: { key: keyof ChannelReport; label: string }[] = [
  { key: "channel", label: "Channel" },
  { key: "url", label: "URL" },
  { key: "subscribers", label: "Subscribers" },
  { key: "videoCount", label: "Video Count" },
  { key: "niche", label: "Niche" },
  { key: "averageVideoLength", label: "Average Video Length" },
  { key: "uploadFrequency", label: "Upload Frequency" },
  { key: "bestVideo", label: "Best Video" },
  { key: "bestViews", label: "Best Views" },
  { key: "style", label: "Style" },
];

function Index() {
  const [url, setUrl] = useState("");
  const [rows, setRows] = useState<ChannelReport[]>([]);
  const run = useServerFn(analyzeChannel);

  const mutation = useMutation({
    mutationFn: (value: string) => run({ data: { url: value } }),
    onSuccess: (report) => {
      setRows((prev) => [report, ...prev.filter((r) => r.url !== report.url)]);
      setUrl("");
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (url.trim()) mutation.mutate(url.trim());
  }

  return (
    <main className="min-h-screen bg-background">
      <div
        className="border-b border-border"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-center gap-2 text-primary">
            <Play className="h-5 w-5 fill-current" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">Channel Sheet</span>
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Paste a YouTube channel link. Get the full data row.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Subscribers, video count, niche, average length, upload frequency, top video and content
            style — pulled live and laid out like a spreadsheet.
          </p>

          <form onSubmit={onSubmit} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/@mkbhd"
              aria-label="YouTube channel URL"
              maxLength={300}
              className="h-12 flex-1"
            />
            <Button type="submit" size="lg" disabled={mutation.isPending} className="h-12">
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Analyze
            </Button>
          </form>

          {mutation.isError && (
            <p className="mt-4 text-sm text-destructive">
              {(mutation.error as Error).message}
            </p>
          )}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div
          className="overflow-x-auto rounded-lg border border-border bg-card"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60">
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-4 py-14 text-center text-muted-foreground"
                  >
                    No channels yet — analyze one above to fill this row.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.url} className="border-b border-border last:border-0 hover:bg-accent/40">
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="px-4 py-4 align-top">
                      {c.key === "url" ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {row.url.replace("https://www.youtube.com/", "")}
                        </a>
                      ) : c.key === "bestVideo" ? (
                        row.bestVideoUrl ? (
                          <a
                            href={row.bestVideoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {row.bestVideo}
                          </a>
                        ) : (
                          <span>{row.bestVideo}</span>
                        )
                      ) : (
                        <span className={c.key === "channel" ? "font-medium" : ""}>{row[c.key]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
