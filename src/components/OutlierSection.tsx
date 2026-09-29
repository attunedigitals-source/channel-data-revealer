import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Flame,
  Search,
  Sparkles,
  ArrowRight,
  Eye,
  Radio,
  Tag,
  Play,
  TrendingUp,
  Layers,
  ChevronRight,
} from "lucide-react";
import { CURATED_OUTLIERS } from "@/lib/outlier.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PREVIEW_OUTLIERS = CURATED_OUTLIERS.slice(0, 5);

export function OutlierSection() {
  const [quickQuery, setQuickQuery] = useState("");
  const navigate = useNavigate();

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate({
        to: "/outliers",
      });
    } else {
      navigate({
        to: "/outliers",
      });
    }
  };

  return (
    <section id="outlier-section" className="mx-auto max-w-6xl px-6 py-12 border-t border-border">
      {/* Header Banner */}
      <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-[#181124] via-[#10121c] to-[#0e1017] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle glow backdrop */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-400">
              <Flame className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
              <span>Viral Outliers Discovery</span>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded font-mono">NEW</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Pull Viral Outliers Per Channel & Niche
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Detect 10x to 50x outlier videos instantly. Inspect their thumbnail concepts, title hook formulas, view-to-sub ratios, and viral mechanics in high-density visual tiles.
            </p>

            {/* Quick search input */}
            <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Enter channel handle or niche (e.g. @filmitgirl, AI documentaries)..."
                  className="pl-10 h-10 bg-background/80 border-border/80 text-sm focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold h-10 px-5 rounded-xl shadow-lg shadow-pink-500/25 shrink-0"
              >
                <span>Launch Outliers Page</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>
          </div>

          <div className="lg:text-right shrink-0">
            <Link
              to="/outliers"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-300 font-bold text-sm transition-all hover:scale-[1.02] shadow-md group"
            >
              <span>Open Dedicated Explorer</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Live Preview Cards Grid */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Top Viral Outliers Today
            </span>
            <Link
              to="/outliers"
              className="text-xs text-muted-foreground hover:text-pink-400 flex items-center gap-1 transition-colors"
            >
              <span>View all in full screen</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {PREVIEW_OUTLIERS.map((tile) => (
              <Link
                key={tile.id}
                to="/outliers"
                className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-[#151722] border border-[#222536] hover:border-pink-500/70 shadow-lg cursor-pointer transition-all duration-300 flex flex-col justify-between"
              >
                {/* Thumbnail Background */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={tile.thumbnailUrl}
                    alt={tile.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${tile.id}/hqdefault.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/60 group-hover:via-black/20 transition-colors" />
                </div>

                {/* Top Action Pills */}
                <div className="relative z-10 p-2 flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-black/60 backdrop-blur text-white/90 border border-white/10">
                      <Radio className="h-2 w-2" />
                      Track
                    </span>
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-black/60 backdrop-blur text-white/90 border border-white/10">
                      <Tag className="h-2 w-2" />
                      Tag
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-semibold border border-white/10">
                      <Eye className="h-2.5 w-2.5" />
                      <span>{tile.viewsText}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[10px] font-extrabold shadow-sm">
                      <Flame className="h-2.5 w-2.5 fill-white text-white" />
                      <span>{tile.multiplierText}</span>
                    </div>
                  </div>
                </div>

                {/* Hover Play icon */}
                <div className="relative z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-9 w-9 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/40">
                    <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom details */}
                <div className="relative z-10 p-2.5 space-y-1 bg-gradient-to-t from-black/95 to-transparent">
                  <div className="text-[11px] font-semibold text-white line-clamp-2 leading-snug group-hover:text-pink-300 transition-colors">
                    {tile.title}
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <img
                      src={
                        tile.channelAvatarUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={tile.channelTitle}
                      className="h-4 w-4 rounded-full object-cover ring-1 ring-white/20 shrink-0"
                    />
                    <div className="truncate text-[10px] font-bold text-white leading-tight">
                      {tile.channelTitle}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
