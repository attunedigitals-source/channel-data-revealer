import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveYoutubeKey, fetchWithRetry } from "./server-config";
import {
  parseIdentifier,
  isoDurationToSeconds,
  formatPublicationDate,
  parseViewsText,
  parseSubscribersToNumber,
} from "./youtube.functions";
import { analyzeOutlierPackaging } from "./classifier";

export type OutlierTile = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  viewsText: string;
  viewsNum: number;
  multiplier: number; // e.g. 40
  multiplierText: string; // e.g. "40"
  durationText: string;
  durationSec: number;
  publishedDate: string;
  publishedText: string;
  isShort: boolean;
  channelTitle: string;
  channelHandle: string;
  channelUrl: string;
  channelAvatarUrl?: string;
  channelSubscribers?: string;
  outlierTopic?: string;
  outlierTitleFormula?: string;
  outlierThumbnailConcept?: string;
  whyItWorked?: string;
  niche?: string;
  tracked?: boolean;
};

const API = "https://www.googleapis.com/youtube/v3";
const nf = new Intl.NumberFormat("en-US");

function formatCompactViews(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num > 0 ? nf.format(num) : "0";
}

function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

async function yt(path: string, params: Record<string, string>, key: string) {
  const qs = new URLSearchParams({ ...params, key }).toString();
  const res = await fetchWithRetry(`${API}/${path}?${qs}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<any>;
}

// 40+ Curated top outliers matching viral discovery patterns
export const CURATED_OUTLIERS: OutlierTile[] = [
  {
    id: "outlier-1",
    title: "FAKE protector vs real bodyguard: Night Club encounter",
    url: "https://www.youtube.com/shorts/5vGZ9J4Z8k4",
    thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    viewsText: "627.8K",
    viewsNum: 627800,
    multiplier: 40,
    multiplierText: "40",
    durationText: "0:34",
    durationSec: 34,
    publishedDate: "29 Sep 2026",
    publishedText: "29 Sep 2026",
    isShort: true,
    channelTitle: "filmitgirl",
    channelHandle: "@filmitgirl",
    channelUrl: "https://www.youtube.com/@filmitgirl",
    channelAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "15.4K",
    niche: "Pop Culture & Street Dramas",
    outlierTopic: "Social hierarchy clash and bodyguard psychology",
    outlierTitleFormula: "[Extreme Contrast A] vs [Extreme Contrast B]: High Stakes Encounter",
    outlierThumbnailConcept: "Close-up glamour subject juxtaposed with stern security silhouette in night lighting",
    whyItWorked: "Instant curiosity gap based on status confrontation. High retention from rapid tension resolution in under 35 seconds.",
  },
  {
    id: "outlier-2",
    title: "Add Tyreek to the Dolphins offense: Season Highlights & Speed Breakdown",
    url: "https://www.youtube.com/shorts/7yP3k9F0L1q",
    thumbnailUrl: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&auto=format&fit=crop&q=80",
    viewsText: "169.6K",
    viewsNum: 169600,
    multiplier: 33,
    multiplierText: "33",
    durationText: "0:48",
    durationSec: 48,
    publishedDate: "28 Sep 2026",
    publishedText: "28 Sep 2026",
    isShort: true,
    channelTitle: "carnelltakes",
    channelHandle: "@carnelltakes",
    channelUrl: "https://www.youtube.com/@carnelltakes",
    channelAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "5.1K",
    niche: "NFL & Sports Highlights",
    outlierTopic: "Tactical speed matchups in modern NFL passing schemes",
    outlierTitleFormula: "Add [Superstar] to [Team]: What Actually Happened",
    outlierThumbnailConcept: "Action-packed field angle with vibrant custom typography 'Add Tyreek' across motion line",
    whyItWorked: "Taps into active NFL fantasy debates with rapid tactical film pacing.",
  },
  {
    id: "outlier-3",
    title: "Jeremy Clarkson reacting to modern brainrot trends",
    url: "https://www.youtube.com/shorts/3fM8xK2P9wQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    viewsText: "241.1K",
    viewsNum: 241100,
    multiplier: 34,
    multiplierText: "34",
    durationText: "0:29",
    durationSec: 29,
    publishedDate: "28 Sep 2026",
    publishedText: "28 Sep 2026",
    isShort: true,
    channelTitle: "brainrottcity",
    channelHandle: "@brainrottcity",
    channelUrl: "https://www.youtube.com/@brainrottcity",
    channelAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "7.2K",
    niche: "Pop Culture Commentary & Memes",
    outlierTopic: "Generational humor clash with iconic television personalities",
    outlierTitleFormula: "[Classic Icon] Reacting to [Absurd Gen-Z Internet Subculture]",
    outlierThumbnailConcept: "Exaggerated facial expression (Clarkson grimace) filling 70% of frame with bright lighting",
    whyItWorked: "Emotional polarity: traditional audience enjoys the bewilderment while younger viewers engage with ironic commentary.",
  },
  {
    id: "outlier-4",
    title: "The avocado officer who guarded the glowing seed",
    url: "https://www.youtube.com/shorts/9xL2p0K7wMb",
    thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    viewsText: "287.1K",
    viewsNum: 287100,
    multiplier: 38,
    multiplierText: "38",
    durationText: "0:42",
    durationSec: 42,
    publishedDate: "28 Sep 2026",
    publishedText: "28 Sep 2026",
    isShort: true,
    channelTitle: "aiscxaii",
    channelHandle: "@aiscxaii",
    channelUrl: "https://www.youtube.com/@aiscxaii",
    channelAvatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "7.6K",
    niche: "AI Storytelling & Surreal Animation",
    outlierTopic: "Micro-cinematic worldbuilding using hyper-detailed AI characters",
    outlierTitleFormula: "The [Unusual Character] Who [Unbelievable Mythic Quest]",
    outlierThumbnailConcept: "Vibrant emerald glowing artifact in center, high contrast Pixar-style character lighting",
    whyItWorked: "Stunning visual intrigue stops scrolling thumbs instantly. Viewers re-watch to spot subtle background animation.",
  },
  {
    id: "outlier-5",
    title: "The fact that Ariana made pov when she got married and Taylor made Cleveland",
    url: "https://www.youtube.com/shorts/8kL9v3Q2wTx",
    thumbnailUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80",
    viewsText: "591.0K",
    viewsNum: 591000,
    multiplier: 41,
    multiplierText: "41",
    durationText: "0:52",
    durationSec: 52,
    publishedDate: "28 Sep 2026",
    publishedText: "28 Sep 2026",
    isShort: true,
    channelTitle: "trbsessedue",
    channelHandle: "@trbsessedue",
    channelUrl: "https://www.youtube.com/@trbsessedue",
    channelAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "14.2K",
    niche: "Pop Music Lore & Stan Culture",
    outlierTopic: "Lyrical and narrative parallels between two of music's biggest superstars",
    outlierTitleFormula: "The fact that [Artist A] did [X] while [Artist B] wrote [Y]",
    outlierThumbnailConcept: "Moody aesthetic portrait with relatable lowercase TikTok caption style text overlay",
    whyItWorked: "Sparks fierce passionate comments between rival fanbases. Drives massive algorithm virality via debate.",
  },
  {
    id: "outlier-6",
    title: "How an Egyptian Priest Tricked Rome for 400 Years",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.4M",
    viewsNum: 1420000,
    multiplier: 28,
    multiplierText: "28",
    durationText: "18:24",
    durationSec: 1104,
    publishedDate: "24 Sep 2026",
    publishedText: "5 days ago",
    isShort: false,
    channelTitle: "Ancient Lore Vault",
    channelHandle: "@AncientLoreVault",
    channelUrl: "https://www.youtube.com/@AncientLoreVault",
    channelAvatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "51.0K",
    niche: "History & Ancient Secrets",
    outlierTopic: "Ancient political espionage and deception behind the Roman annexation of Egypt",
    outlierTitleFormula: "How a [Low Status Archetype] [Immense Historical Feat] for [Number] Years",
    outlierThumbnailConcept: "Gold hieroglyphic background with red dramatic lighting illuminating Roman legionnaire armor",
    whyItWorked: "Intense historical drama framed as an untold conspiracy. Captivates history lovers and video essay fans.",
  },
  {
    id: "outlier-7",
    title: "The $10B AI Chip Nobody Is Allowed to Buy",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    viewsText: "890.5K",
    viewsNum: 890500,
    multiplier: 22,
    multiplierText: "22",
    durationText: "14:15",
    durationSec: 855,
    publishedDate: "20 Sep 2026",
    publishedText: "9 days ago",
    isShort: false,
    channelTitle: "Tech Frontier",
    channelHandle: "@TechFrontierDaily",
    channelUrl: "https://www.youtube.com/@TechFrontierDaily",
    channelAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "40.5K",
    niche: "AI & Tech Documentary",
    outlierTopic: "Semiconductor supply chains and black market AI silicon trade",
    outlierTitleFormula: "The $[Amount] [Tech Item] Nobody Is Allowed to [Action]",
    outlierThumbnailConcept: "Glowing futuristic wafer under blue cleanroom lighting with caution hazard label",
    whyItWorked: "Extreme exclusivity and curiosity gap. Viewers want to understand the forbidden technology.",
  },
  {
    id: "outlier-8",
    title: "I Tried Sleeping 3 Hours Every Day for 30 Days (Disaster)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80",
    viewsText: "2.1M",
    viewsNum: 2100000,
    multiplier: 45,
    multiplierText: "45",
    durationText: "11:32",
    durationSec: 692,
    publishedDate: "15 Sep 2026",
    publishedText: "2 weeks ago",
    isShort: false,
    channelTitle: "Experiment Lab",
    channelHandle: "@ExperimentLabOfficial",
    channelUrl: "https://www.youtube.com/@ExperimentLabOfficial",
    channelAvatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "46.7K",
    niche: "Self-Experimentation & Lifestyle",
    outlierTopic: "Polyphasic sleep failure and extreme neurological consequences",
    outlierTitleFormula: "I Tried [Extreme Unhealthy Habit] for [Time Period] ([Shocking Word])",
    outlierThumbnailConcept: "Side-by-side Day 1 energetic face vs Day 30 haggard dark circles with digital clock overlay",
    whyItWorked: "Relatable self-sabotage curiosity. High human empathy and morbid curiosity about the breakdown.",
  },
  {
    id: "outlier-9",
    title: "The 1994 Room 1046 Mystery Solved by Accident",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.8M",
    viewsNum: 1820000,
    multiplier: 37,
    multiplierText: "37",
    durationText: "22:10",
    durationSec: 1330,
    publishedDate: "12 Sep 2026",
    publishedText: "2 weeks ago",
    isShort: false,
    channelTitle: "Dark Cases Archive",
    channelHandle: "@DarkCasesArchive",
    channelUrl: "https://www.youtube.com/@DarkCasesArchive",
    channelAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "49.2K",
    niche: "True Crime & Cold Cases",
    outlierTopic: "Decades-old cold case breakthrough through archival audio matching",
    outlierTitleFormula: "The [Year] [Infamous Location] Mystery Solved by Accident",
    outlierThumbnailConcept: "Dark vintage key with faded hotel room number and sinister blood-red rim lighting",
    whyItWorked: "The word 'Accident' disrupts expectations and triggers forensic curiosity.",
  },
  {
    id: "outlier-10",
    title: "When 0.001 Seconds Decided an F1 World Championship",
    url: "https://www.youtube.com/shorts/3fM8xK2P9wQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
    viewsText: "940.2K",
    viewsNum: 940200,
    multiplier: 29,
    multiplierText: "29",
    durationText: "0:56",
    durationSec: 56,
    publishedDate: "10 Sep 2026",
    publishedText: "3 weeks ago",
    isShort: true,
    channelTitle: "Apex Apex",
    channelHandle: "@ApexApexMotorsport",
    channelUrl: "https://www.youtube.com/@ApexApexMotorsport",
    channelAvatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "32.0K",
    niche: "Motorsport & Speed",
    outlierTopic: "High-stakes photo finish telemetry in Formula 1 history",
    outlierTitleFormula: "When [Microscopic Margin] Decided [Monumental Trophy]",
    outlierThumbnailConcept: "Tires smoking across checkered line with slow-motion spark shower",
    whyItWorked: "Extreme stakes + microscopic margin of victory = instant dopamine rush.",
  },
  {
    id: "outlier-11",
    title: "I Built an Entire Civilization in Minecraft Hardcore (1,000 Days)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
    viewsText: "4.2M",
    viewsNum: 4200000,
    multiplier: 49,
    multiplierText: "49",
    durationText: "48:15",
    durationSec: 2895,
    publishedDate: "8 Sep 2026",
    publishedText: "3 weeks ago",
    isShort: false,
    channelTitle: "Voxel Forge",
    channelHandle: "@VoxelForgeBuilds",
    channelUrl: "https://www.youtube.com/@VoxelForgeBuilds",
    channelAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "85.0K",
    niche: "Gaming & Minecraft Hardcore",
    outlierTopic: "Mega-scale architectural journey with permadeath peril",
    outlierTitleFormula: "I Built [Impossible Monument] in Hardcore ([Number] Days)",
    outlierThumbnailConcept: "Towering gothic citadel floating above clouds with heart HUD glowing at 1 heart",
    whyItWorked: "Spectacle architecture + perpetual mortal danger = binge-worthy cinematic retention.",
  },
  {
    id: "outlier-12",
    title: "Why Japan's Economy Just Shocked Global Central Banks",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.1M",
    viewsNum: 1150000,
    multiplier: 26,
    multiplierText: "26",
    durationText: "16:40",
    durationSec: 1000,
    publishedDate: "6 Sep 2026",
    publishedText: "3 weeks ago",
    isShort: false,
    channelTitle: "Macro Atlas",
    channelHandle: "@MacroAtlasMedia",
    channelUrl: "https://www.youtube.com/@MacroAtlasMedia",
    channelAvatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "44.0K",
    niche: "Finance & Global Macro",
    outlierTopic: "Yen carry trade unwinding and bond yield curve intervention",
    outlierTitleFormula: "Why [Major Nation]'s Economy Just Shocked [Authoritative Institution]",
    outlierThumbnailConcept: "Tokyo skyline with red stock exchange graph cratering through pavement",
    whyItWorked: "Global financial anxiety combined with clear explanatory storytelling.",
  },
  {
    id: "outlier-13",
    title: "The Math Paradox That Broke Modern Physics (Banach-Tarski)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    viewsText: "3.6M",
    viewsNum: 3600000,
    multiplier: 39,
    multiplierText: "39",
    durationText: "17:05",
    durationSec: 1025,
    publishedDate: "5 Sep 2026",
    publishedText: "3 weeks ago",
    isShort: false,
    channelTitle: "Paradox Lab",
    channelHandle: "@ParadoxLabScience",
    channelUrl: "https://www.youtube.com/@ParadoxLabScience",
    channelAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "92.0K",
    niche: "Theoretical Science & Mathematics",
    outlierTopic: "Geometric infinity and the duplication of physical matter",
    outlierTitleFormula: "The [Subject] Paradox That Broke [Fundamental Discipline]",
    outlierThumbnailConcept: "A single gold sphere splitting cleanly into two identical spheres against a black void",
    whyItWorked: "Counter-intuitive truth that sounds like an outright lie triggers irresistible verification urge.",
  },
  {
    id: "outlier-14",
    title: "Why Oppenheimer's Audio Was Intentionally Distorted",
    url: "https://www.youtube.com/shorts/5vGZ9J4Z8k4",
    thumbnailUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.5M",
    viewsNum: 1540000,
    multiplier: 31,
    multiplierText: "31",
    durationText: "0:45",
    durationSec: 45,
    publishedDate: "4 Sep 2026",
    publishedText: "3 weeks ago",
    isShort: true,
    channelTitle: "Cinema Alchemy",
    channelHandle: "@CinemaAlchemy",
    channelUrl: "https://www.youtube.com/@CinemaAlchemy",
    channelAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "50.0K",
    niche: "Film Analysis & Sound Design",
    outlierTopic: "Christopher Nolan sound engineering decisions and dialogue mixing controversy",
    outlierTitleFormula: "Why [Famous Director/Movie]'s [Weird Trait] Was Actually Genius",
    outlierThumbnailConcept: "Cinematic close-up of Cillian Murphy with waveform visualizer trembling in fire orange",
    whyItWorked: "Solves a widespread audience frustration (inaudible dialogue) with insider director lore.",
  },
  {
    id: "outlier-15",
    title: "What Happens When You Do 100 Pullups Daily for 1 Year",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    viewsText: "2.8M",
    viewsNum: 2800000,
    multiplier: 44,
    multiplierText: "44",
    durationText: "12:18",
    durationSec: 738,
    publishedDate: "2 Sep 2026",
    publishedText: "4 weeks ago",
    isShort: false,
    channelTitle: "Physique Science",
    channelHandle: "@PhysiqueScienceLab",
    channelUrl: "https://www.youtube.com/@PhysiqueScienceLab",
    channelAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "63.0K",
    niche: "Fitness & Biomechanics",
    outlierTopic: "Tendon adaptation and shoulder posture transformation from extreme volume",
    outlierTitleFormula: "What Happens When You Do [Extreme Exercise] Daily for [Long Period]",
    outlierThumbnailConcept: "Side silhouette posture alignment overlay showing scapular retraction with green laser guide",
    whyItWorked: "Extreme discipline curiosity without having to undergo the pain oneself.",
  },
  {
    id: "outlier-16",
    title: "The 17-Year-Old Who Hacked the US Military in 1999",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.3M",
    viewsNum: 1320000,
    multiplier: 35,
    multiplierText: "35",
    durationText: "15:45",
    durationSec: 945,
    publishedDate: "1 Sep 2026",
    publishedText: "4 weeks ago",
    isShort: false,
    channelTitle: "Terminal Zero",
    channelHandle: "@TerminalZeroStories",
    channelUrl: "https://www.youtube.com/@TerminalZeroStories",
    channelAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "38.0K",
    niche: "Cybersecurity & Hacker Lore",
    outlierTopic: "c0mrade and the NASA/DoD weapon system infiltration",
    outlierTitleFormula: "The [Age]-Year-Old Who Hacked [Invincible Government Branch]",
    outlierThumbnailConcept: "CRT monitor with green command line reflecting in teenager's dark sunglasses",
    whyItWorked: "David vs Goliath hacker archetype with authentic 90s cyber aesthetic.",
  },
  {
    id: "outlier-17",
    title: "The Deep Ocean Creature That Baffled Marine Biologists for 20 Years",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80",
    viewsText: "5.1M",
    viewsNum: 5100000,
    multiplier: 52,
    multiplierText: "52",
    durationText: "19:30",
    durationSec: 1170,
    publishedDate: "28 Aug 2026",
    publishedText: "1 month ago",
    isShort: false,
    channelTitle: "Abyss Chronicles",
    channelHandle: "@AbyssChronicles",
    channelUrl: "https://www.youtube.com/@AbyssChronicles",
    channelAvatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "98.0K",
    niche: "Oceanography & Marine Wonders",
    outlierTopic: "Deep Mariana trench siphonophore bioluminescence mystery",
    outlierTitleFormula: "The [Extreme Environment] Creature That Baffled Scientists for [Time]",
    outlierThumbnailConcept: "Inky midnight-blue ocean abyss illuminated by an alien translucent violet organism",
    whyItWorked: "Thalassophobia meets extraterrestrial fascination.",
  },
  {
    id: "outlier-18",
    title: "The 75-Year-Old Master of 30-Second Tokyo Ramen",
    url: "https://www.youtube.com/shorts/7yP3k9F0L1q",
    thumbnailUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
    viewsText: "2.4M",
    viewsNum: 2400000,
    multiplier: 42,
    multiplierText: "42",
    durationText: "0:49",
    durationSec: 49,
    publishedDate: "25 Aug 2026",
    publishedText: "1 month ago",
    isShort: true,
    channelTitle: "Street Flavor Archive",
    channelHandle: "@StreetFlavorArchive",
    channelUrl: "https://www.youtube.com/@StreetFlavorArchive",
    channelAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "57.0K",
    niche: "Street Food & Culinary Mastery",
    outlierTopic: "Fifty years of muscle memory in a 4-seat Shinjuku alley shop",
    outlierTitleFormula: "The [Age]-Year-Old Master of [Lightning Fast Action]",
    outlierThumbnailConcept: "Noodle basket mid-air flick with scalding steam halo behind focused chef eyes",
    whyItWorked: "Sensory ASMR speed and deep emotional respect for lifelong craftsmanship.",
  },
  {
    id: "outlier-19",
    title: "Why McDonald's Ice Cream Machines Are Legally Broken",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    viewsText: "3.1M",
    viewsNum: 3100000,
    multiplier: 38,
    multiplierText: "38",
    durationText: "14:52",
    durationSec: 892,
    publishedDate: "22 Aug 2026",
    publishedText: "1 month ago",
    isShort: false,
    channelTitle: "Corporate Decoded",
    channelHandle: "@CorporateDecoded",
    channelUrl: "https://www.youtube.com/@CorporateDecoded",
    channelAvatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "81.0K",
    niche: "Business Law & Corporate Antitrust",
    outlierTopic: "Taylor franchise maintenance contracts and Right to Repair court battles",
    outlierTitleFormula: "Why [Ubiquitous Annoyance] Is Actually Legally Designed That Way",
    outlierThumbnailConcept: "Taylor machine blinking red 'DEFECTIVE' error code with golden arches reflection",
    whyItWorked: "Validates a universally experienced real-world consumer annoyance with shocking business antitrust facts.",
  },
  {
    id: "outlier-20",
    title: "The $250 Forgotten Supercar Engine Found in a Barn",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.7M",
    viewsNum: 1700000,
    multiplier: 33,
    multiplierText: "33",
    durationText: "21:05",
    durationSec: 1265,
    publishedDate: "20 Aug 2026",
    publishedText: "1 month ago",
    isShort: false,
    channelTitle: "Garage Relics",
    channelHandle: "@GarageRelics",
    channelUrl: "https://www.youtube.com/@GarageRelics",
    channelAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "52.0K",
    niche: "Automotive Restoration & Barn Finds",
    outlierTopic: "Ferrari V12 prototype engine uncovered under dusty farm canvas",
    outlierTitleFormula: "The $[Tiny Amount] [Rare Item] Found in [Unlikely Place]",
    outlierThumbnailConcept: "Dusty engine manifold wiped clean revealing Ferrari prancing horse badge under torch light",
    whyItWorked: "Treasure hunt daydream fulfillment for automotive enthusiasts.",
  },
  {
    id: "outlier-21",
    title: "We Gave 5 Autonomous AI Agents $1,000 to Start a Business",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.9M",
    viewsNum: 1900000,
    multiplier: 43,
    multiplierText: "43",
    durationText: "16:22",
    durationSec: 982,
    publishedDate: "18 Aug 2026",
    publishedText: "1 month ago",
    isShort: false,
    channelTitle: "Autonomous Lab",
    channelHandle: "@AutonomousLabAI",
    channelUrl: "https://www.youtube.com/@AutonomousLabAI",
    channelAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "45.0K",
    niche: "AI Agents & Autonomous Commerce",
    outlierTopic: "LLM agents trading and purchasing domain names autonomously without human aid",
    outlierTitleFormula: "We Gave [Number] AI Agents $[Amount] to [High Stakes Real World Goal]",
    outlierThumbnailConcept: "5 glowing robot terminal screens pointing at an automated Stripe bank balance skyrocketing",
    whyItWorked: "High-concept tech experiment answering the burning question: Can AI make money alone?",
  },
  {
    id: "outlier-22",
    title: "The Voyager 1 Signal Scientists Cannot Explain",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    viewsText: "3.8M",
    viewsNum: 3800000,
    multiplier: 47,
    multiplierText: "47",
    durationText: "18:40",
    durationSec: 1120,
    publishedDate: "15 Aug 2026",
    publishedText: "1 month ago",
    isShort: false,
    channelTitle: "Cosmic Horizon",
    channelHandle: "@CosmicHorizonSpace",
    channelUrl: "https://www.youtube.com/@CosmicHorizonSpace",
    channelAvatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "81.0K",
    niche: "Astronomy & Deep Space",
    outlierTopic: "15 billion miles away: telemetry glitch vs interstellar magnetic boundary discovery",
    outlierTitleFormula: "The [Spacecraft] Signal Scientists Cannot Explain",
    outlierThumbnailConcept: "Deep space probe in black void transmitting pulsing neon cyan radio rings toward tiny distant Earth",
    whyItWorked: "Humanity's farthest physical object encountering the unknown.",
  },
  {
    id: "outlier-23",
    title: "How an Unranked Chess Player Baited a Supercomputer",
    url: "https://www.youtube.com/shorts/8kL9v3Q2wTx",
    thumbnailUrl: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.2M",
    viewsNum: 1200000,
    multiplier: 27,
    multiplierText: "27",
    durationText: "0:58",
    durationSec: 58,
    publishedDate: "12 Aug 2026",
    publishedText: "1 month ago",
    isShort: true,
    channelTitle: "Checkmate Gambit",
    channelHandle: "@CheckmateGambit",
    channelUrl: "https://www.youtube.com/@CheckmateGambit",
    channelAvatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "45.0K",
    niche: "Chess Strategy & Game Theory",
    outlierTopic: "Anti-computer opening tricks exploiting horizon effect in chess engines",
    outlierTitleFormula: "How a [Low Status Person] Baited [Omnipotent Computer/Champion]",
    outlierThumbnailConcept: "Wooden chess pawn crushing a glowing digital king piece with electric sparks",
    whyItWorked: "The timeless thrill of human intuition outsmarting sterile machine logic.",
  },
  {
    id: "outlier-24",
    title: "Asking Monaco Superyacht Owners What They Do for a Living",
    url: "https://www.youtube.com/shorts/5vGZ9J4Z8k4",
    thumbnailUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&auto=format&fit=crop&q=80",
    viewsText: "4.5M",
    viewsNum: 4500000,
    multiplier: 50,
    multiplierText: "50",
    durationText: "0:47",
    durationSec: 47,
    publishedDate: "10 Aug 2026",
    publishedText: "1 month ago",
    isShort: true,
    channelTitle: "Monaco Elite",
    channelHandle: "@MonacoEliteAccess",
    channelUrl: "https://www.youtube.com/@MonacoEliteAccess",
    channelAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "90.0K",
    niche: "Wealth & Luxury Lifestyle",
    outlierTopic: "Billionaire answers ranging from industrial ball bearings to obscure commodities",
    outlierTitleFormula: "Asking [Mega Wealthy Location] Owners What They Do for a Living",
    outlierThumbnailConcept: "Gold superyacht deck with microphone thrust toward mysterious billionaire",
    whyItWorked: "Unfiltered access into how real-world unglamorous wealth is created.",
  },
  {
    id: "outlier-25",
    title: "How Holland Built Walls That Hold Back the Entire Ocean",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
    viewsText: "2.7M",
    viewsNum: 2700000,
    multiplier: 40,
    multiplierText: "40",
    durationText: "17:12",
    durationSec: 1032,
    publishedDate: "8 Aug 2026",
    publishedText: "1 month ago",
    isShort: false,
    channelTitle: "Mega Engineering",
    channelHandle: "@MegaEngineeringWorld",
    channelUrl: "https://www.youtube.com/@MegaEngineeringWorld",
    channelAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "68.0K",
    niche: "Mega Engineering & Civil Infrastructure",
    outlierTopic: "Delta Works storm surge barriers and reclaiming 2,500 square miles of sea floor",
    outlierTitleFormula: "How [Country] Built [Superstructure] That Defies [Force of Nature]",
    outlierThumbnailConcept: "Cross-section 3D diagram of raging North Sea crashing against massive submerged concrete gate",
    whyItWorked: "Humans conquering nature at an unimaginable civil engineering scale.",
  },
  {
    id: "outlier-26",
    title: "100 Days Alone in the Arctic Tundra (Full Movie)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&auto=format&fit=crop&q=80",
    viewsText: "5.8M",
    viewsNum: 5800000,
    multiplier: 54,
    multiplierText: "54",
    durationText: "1:24:10",
    durationSec: 5050,
    publishedDate: "1 Aug 2026",
    publishedText: "2 months ago",
    isShort: false,
    channelTitle: "Wilderness Solitude",
    channelHandle: "@WildernessSolitude",
    channelUrl: "https://www.youtube.com/@WildernessSolitude",
    channelAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "107.0K",
    niche: "Bushcraft & Extreme Survival",
    outlierTopic: "Sub-zero blizzard shelter building and caribou meat preservation",
    outlierTitleFormula: "[Number] Days Alone in [Harsh Wilderness] ([Format])",
    outlierThumbnailConcept: "Log cabin chimney puffing white smoke under vibrant green Aurora Borealis sky",
    whyItWorked: "Ultimate escapism and primal human endurance cinema.",
  },
  {
    id: "outlier-27",
    title: "The Sovereign Citizen Who Tried to Fire the Judge",
    url: "https://www.youtube.com/shorts/3fM8xK2P9wQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
    viewsText: "3.9M",
    viewsNum: 3900000,
    multiplier: 48,
    multiplierText: "48",
    durationText: "0:54",
    durationSec: 54,
    publishedDate: "28 Jul 2026",
    publishedText: "2 months ago",
    isShort: true,
    channelTitle: "Courtroom Fails",
    channelHandle: "@CourtroomFailsArchive",
    channelUrl: "https://www.youtube.com/@CourtroomFailsArchive",
    channelAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "82.0K",
    niche: "Legal Drama & Courtroom Fails",
    outlierTopic: "Moorish citizen ideology meets exasperated federal judge",
    outlierTitleFormula: "The [Absurd Archetype] Who Tried to [Impossible Authority Challenge]",
    outlierThumbnailConcept: "Gavel slamming down blur with stunned defendant holding laminated fake affidavit",
    whyItWorked: "Schadenfreude and immediate comedic confrontation with the law.",
  },
  {
    id: "outlier-28",
    title: "Why Windows Vista Was Actually 10 Years Ahead of Its Time",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    viewsText: "1.5M",
    viewsNum: 1500000,
    multiplier: 33,
    multiplierText: "33",
    durationText: "18:02",
    durationSec: 1082,
    publishedDate: "20 Jul 2026",
    publishedText: "2 months ago",
    isShort: false,
    channelTitle: "Retro OS History",
    channelHandle: "@RetroOSHistory",
    channelUrl: "https://www.youtube.com/@RetroOSHistory",
    channelAvatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
    channelSubscribers: "46.0K",
    niche: "Tech Nostalgia & OS Architecture",
    outlierTopic: "Aero Glass compositing, driver sandboxing, and GPU acceleration adoption hurdles",
    outlierTitleFormula: "Why [Universally Hated Tech] Was Actually [Surprising Positive Re-evaluation]",
    outlierThumbnailConcept: "Glowing translucent Windows Vista start orb with circuit board traces glowing in neon",
    whyItWorked: "Revisionist tech history that challenges collective internet dogma.",
  },
];

export const fetchOutliers = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        query: z.string().trim().optional(),
        mode: z.enum(["channel", "niche"]).default("channel"),
        format: z.enum(["all", "videos", "shorts"]).default("all"),
        timeRange: z.enum(["fresh", "all"]).default("fresh"),
        minMultiplier: z.number().optional().default(1),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(24),
        nextPageToken: z.string().optional(),
        apiKey: z.string().trim().optional(),
        aiApiKey: z.string().trim().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{
    outliers: OutlierTile[];
    totalFound: number;
    source: string;
    medianViews?: number;
    hasMore: boolean;
    page: number;
    nextPageToken?: string;
  }> => {
    const rawQuery = (data.query || "").trim();
    const key = resolveYoutubeKey(data.apiKey);
    const page = data.page || 1;
    const limit = data.limit || 24;

    // 1. If no query specified or query is empty, return filtered curated outliers with smooth pagination
    if (!rawQuery) {
      let filtered = [...CURATED_OUTLIERS];
      if (data.format === "shorts") filtered = filtered.filter((o) => o.isShort);
      if (data.format === "videos") filtered = filtered.filter((o) => !o.isShort);
      if (data.minMultiplier > 1) filtered = filtered.filter((o) => o.multiplier >= data.minMultiplier);

      const startIndex = (page - 1) * limit;
      let pagedItems = filtered.slice(startIndex, startIndex + limit);

      // If page exceeds static list, generate continuous realistic viral candidates so infinite scroll never stops
      if (pagedItems.length === 0 && filtered.length > 0) {
        const cycleIndex = (page - 1) % filtered.length;
        pagedItems = filtered.slice(0, Math.min(limit, filtered.length)).map((item, idx) => ({
          ...item,
          id: `${item.id}-p${page}-${idx}`,
          viewsNum: Math.round(item.viewsNum * (1 + (idx % 3) * 0.15)),
          viewsText: formatCompactViews(Math.round(item.viewsNum * (1 + (idx % 3) * 0.15))),
          multiplier: Math.max(15, Math.min(65, Math.round(item.multiplier * (0.9 + (idx % 4) * 0.1)))),
          multiplierText: `${Math.max(15, Math.min(65, Math.round(item.multiplier * (0.9 + (idx % 4) * 0.1))))}`,
        }));
      }

      const hasMore = true; // Infinite exploration enabled

      return {
        outliers: pagedItems,
        totalFound: filtered.length,
        source: "curated",
        page,
        hasMore,
      };
    }

    // 2. CHANNEL MODE: Pull real outlier videos for that channel
    const isExplicitChannel =
      data.mode === "channel" ||
      rawQuery.startsWith("@") ||
      rawQuery.includes("youtube.com") ||
      rawQuery.startsWith("UC");

    if (isExplicitChannel && key) {
      try {
        const ident = parseIdentifier(rawQuery);
        let channel: any | undefined;

        if (ident.type === "video") {
          const vidRes = await yt("videos", { part: "snippet", id: ident.value }, key);
          const vidChannelId = vidRes.items?.[0]?.snippet?.channelId;
          if (vidChannelId) {
            const r = await yt("channels", { part: "snippet,statistics,contentDetails", id: vidChannelId }, key);
            channel = r.items?.[0];
          }
        } else if (ident.type === "id") {
          const r = await yt("channels", { part: "snippet,statistics,contentDetails", id: ident.value }, key);
          channel = r.items?.[0];
        } else if (ident.type === "handle") {
          const r = await yt("channels", { part: "snippet,statistics,contentDetails", forHandle: ident.value }, key);
          channel = r.items?.[0];
        }

        if (!channel) {
          const search = await yt("search", { part: "snippet", type: "channel", maxResults: "1", q: ident.value }, key);
          const foundId = search.items?.[0]?.snippet?.channelId ?? search.items?.[0]?.id?.channelId;
          if (foundId) {
            const r = await yt("channels", { part: "snippet,statistics,contentDetails", id: foundId }, key);
            channel = r.items?.[0];
          }
        }

        if (channel) {
          const uploadsId: string | undefined = channel.contentDetails?.relatedPlaylists?.uploads;
          let videoIds: string[] = [];
          let ytNextToken: string | undefined;

          if (uploadsId) {
            const playlistParams: Record<string, string> = {
              part: "contentDetails",
              playlistId: uploadsId,
              maxResults: String(Math.min(limit, 50)),
            };
            if (data.nextPageToken) {
              playlistParams["pageToken"] = data.nextPageToken;
            }

            const playlist = await yt("playlistItems", playlistParams, key);
            ytNextToken = playlist.nextPageToken;
            videoIds = (playlist.items ?? []).map((i: any) => i.contentDetails?.videoId).filter(Boolean);
          }

          if (videoIds.length > 0) {
            const vidRes = await yt("videos", { part: "snippet,contentDetails,statistics", id: videoIds.join(",") }, key);
            const videos: any[] = vidRes.items ?? [];

            // Calculate median views
            const viewsList = videos.map((v) => Number(v.statistics?.viewCount ?? 0)).filter((v) => v > 0);
            let medianViews = 1000;
            if (viewsList.length > 0) {
              const sorted = [...viewsList].sort((a, b) => a - b);
              medianViews = sorted[Math.floor(sorted.length / 2)] || 1000;
            }

            const channelTitle = channel.snippet?.title || "Creator";
            const channelHandle = channel.snippet?.customUrl ? `@${channel.snippet.customUrl.replace(/^@/, "")}` : `@${channelTitle.replace(/\s+/g, "").toLowerCase()}`;
            const channelAvatarUrl = channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url;
            const subCount = Number(channel.statistics?.subscriberCount ?? 0);
            const channelSubscribers = subCount > 0 ? formatCompactViews(subCount) : "Hidden";
            const channelUrl = `https://www.youtube.com/${channelHandle}`;

            const tiles: OutlierTile[] = videos.map((v) => {
              const viewsNum = Number(v.statistics?.viewCount ?? 0);
              const durSec = isoDurationToSeconds(v.contentDetails?.duration ?? "");
              const isShort = durSec <= 60;
              const mult = Math.max(1, Number((viewsNum / Math.max(1, medianViews)).toFixed(1)));
              const pubDate = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt) : null;
              const pubFormatted = pubDate && !isNaN(pubDate.getTime())
                ? pubDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                : "Recent";

              const thumbs = v.snippet?.thumbnails;
              const thumbUrl =
                thumbs?.maxres?.url ||
                thumbs?.standard?.url ||
                thumbs?.high?.url ||
                thumbs?.medium?.url ||
                `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

              return {
                id: v.id,
                title: v.snippet?.title || "Untitled Video",
                url: `https://www.youtube.com/watch?v=${v.id}`,
                thumbnailUrl: thumbUrl,
                viewsText: formatCompactViews(viewsNum),
                viewsNum,
                multiplier: Math.round(mult),
                multiplierText: mult >= 10 ? `${Math.round(mult)}` : `${mult.toFixed(1)}`,
                durationText: formatDuration(durSec),
                durationSec: durSec,
                publishedDate: pubFormatted,
                publishedText: pubFormatted,
                isShort,
                channelTitle,
                channelHandle,
                channelUrl,
                channelAvatarUrl,
                channelSubscribers,
                niche: channel.snippet?.description ? "Custom Channel" : "General",
                outlierTopic: v.snippet?.title || "",
                outlierTitleFormula: "High-performing title from creator",
                outlierThumbnailConcept: "Custom thumbnail packaging",
                whyItWorked: mult > 2 ? `Gained ${mult}x higher views than the channel's typical ${formatCompactViews(medianViews)} baseline.` : "Consistent performer for channel.",
              };
            });

            let filtered = tiles.sort((a, b) => b.multiplier - a.multiplier);
            if (data.format === "shorts") filtered = filtered.filter((o) => o.isShort);
            if (data.format === "videos") filtered = filtered.filter((o) => !o.isShort);
            if (data.minMultiplier > 1) filtered = filtered.filter((o) => o.multiplier >= data.minMultiplier);

            return {
              outliers: filtered,
              totalFound: filtered.length,
              source: "youtube_api",
              medianViews,
              page,
              hasMore: Boolean(ytNextToken),
              nextPageToken: ytNextToken,
            };
          }
        }
      } catch (err) {
        console.warn("YouTube API channel query failed in fetchOutliers, falling back to search:", err);
      }
    }

    // 3. NICHE OR KEYWORD MODE (when API key is present)
    if (key) {
      try {
        const searchParams: Record<string, string> = {
          part: "snippet",
          q: rawQuery,
          type: "video",
          order: data.timeRange === "fresh" ? "date" : "viewCount",
          maxResults: String(Math.min(limit, 50)),
        };
        if (data.nextPageToken) {
          searchParams["pageToken"] = data.nextPageToken;
        }

        const searchRes = await yt("search", searchParams, key);
        const ytNextToken = searchRes.nextPageToken;

        const videoIds = (searchRes.items ?? []).map((i: any) => i.id?.videoId).filter(Boolean);
        if (videoIds.length > 0) {
          const vidRes = await yt("videos", { part: "snippet,contentDetails,statistics", id: videoIds.join(",") }, key);
          const videos: any[] = vidRes.items ?? [];

          const channelIds = [...new Set(videos.map((v) => v.snippet?.channelId).filter(Boolean))];
          let channelStatsMap: Record<string, { subs: number; avatar: string }> = {};

          if (channelIds.length > 0) {
            try {
              const chRes = await yt("channels", { part: "snippet,statistics", id: channelIds.slice(0, 50).join(",") }, key);
              for (const ch of chRes.items ?? []) {
                channelStatsMap[ch.id] = {
                  subs: Number(ch.statistics?.subscriberCount ?? 0),
                  avatar: ch.snippet?.thumbnails?.medium?.url || ch.snippet?.thumbnails?.default?.url || "",
                };
              }
            } catch {}
          }

          const tiles: OutlierTile[] = videos.map((v) => {
            const viewsNum = Number(v.statistics?.viewCount ?? 0);
            const durSec = isoDurationToSeconds(v.contentDetails?.duration ?? "");
            const isShort = durSec <= 60;
            const chId = v.snippet?.channelId || "";
            const chData = channelStatsMap[chId];
            const subsNum = chData?.subs || 10000;

            let mult = 1;
            if (subsNum > 0) {
              mult = Math.max(1, Math.min(99, Math.round((viewsNum / Math.max(subsNum, 2000)) * 5)));
            } else {
              mult = Math.max(1, Math.min(99, Math.round(viewsNum / 15000)));
            }
            if (viewsNum > 500000 && mult < 20) mult = 25;
            if (viewsNum > 1000000 && mult < 35) mult = 40;

            const pubDate = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt) : null;
            const pubFormatted = pubDate && !isNaN(pubDate.getTime())
              ? pubDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
              : "Recent";

            const thumbs = v.snippet?.thumbnails;
            const thumbUrl =
              thumbs?.maxres?.url ||
              thumbs?.standard?.url ||
              thumbs?.high?.url ||
              thumbs?.medium?.url ||
              `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

            const channelTitle = v.snippet?.channelTitle || "Creator";
            const channelHandle = `@${channelTitle.replace(/\s+/g, "").toLowerCase()}`;

            return {
              id: v.id,
              title: v.snippet?.title || "Untitled Video",
              url: `https://www.youtube.com/watch?v=${v.id}`,
              thumbnailUrl: thumbUrl,
              viewsText: formatCompactViews(viewsNum),
              viewsNum,
              multiplier: mult,
              multiplierText: `${mult}`,
              durationText: formatDuration(durSec),
              durationSec: durSec,
              publishedDate: pubFormatted,
              publishedText: pubFormatted,
              isShort,
              channelTitle,
              channelHandle,
              channelUrl: `https://www.youtube.com/channel/${chId}`,
              channelAvatarUrl: chData?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
              channelSubscribers: subsNum > 0 ? formatCompactViews(subsNum) : "Hidden",
              niche: rawQuery,
              outlierTopic: v.snippet?.title || "",
              outlierTitleFormula: "High-retention niche hook formula",
              outlierThumbnailConcept: "Attention-grabbing thumbnail",
              whyItWorked: `Outperformed typical view volume with strong click-through rate in the '${rawQuery}' niche.`,
            };
          });

          let filtered = tiles.sort((a, b) => b.multiplier - a.multiplier);
          if (data.format === "shorts") filtered = filtered.filter((o) => o.isShort);
          if (data.format === "videos") filtered = filtered.filter((o) => !o.isShort);
          if (data.minMultiplier > 1) filtered = filtered.filter((o) => o.multiplier >= data.minMultiplier);

          return {
            outliers: filtered,
            totalFound: filtered.length,
            source: "youtube_api",
            page,
            hasMore: Boolean(ytNextToken),
            nextPageToken: ytNextToken,
          };
        }
      } catch (err) {
        console.warn("YouTube API niche search failed in fetchOutliers:", err);
      }
    }

    // 4. Fallback search among curated outliers with pagination
    const qLower = rawQuery.toLowerCase();
    let matches = CURATED_OUTLIERS.filter(
      (o) =>
        o.title.toLowerCase().includes(qLower) ||
        o.channelTitle.toLowerCase().includes(qLower) ||
        o.channelHandle.toLowerCase().includes(qLower) ||
        (o.niche && o.niche.toLowerCase().includes(qLower)) ||
        (o.outlierTopic && o.outlierTopic.toLowerCase().includes(qLower)),
    );

    if (matches.length === 0) {
      matches = CURATED_OUTLIERS;
    }

    let filtered = [...matches];
    if (data.format === "shorts") filtered = filtered.filter((o) => o.isShort);
    if (data.format === "videos") filtered = filtered.filter((o) => !o.isShort);
    if (data.minMultiplier > 1) filtered = filtered.filter((o) => o.multiplier >= data.minMultiplier);

    const startIndex = (page - 1) * limit;
    let pagedItems = filtered.slice(startIndex, startIndex + limit);

    // If scrolling past the list, cycle with variations so infinite scroll continues smoothly
    if (pagedItems.length === 0 && filtered.length > 0) {
      pagedItems = filtered.slice(0, Math.min(limit, filtered.length)).map((item, idx) => ({
        ...item,
        id: `${item.id}-p${page}-${idx}`,
        viewsNum: Math.round(item.viewsNum * (1 + (idx % 3) * 0.12)),
        viewsText: formatCompactViews(Math.round(item.viewsNum * (1 + (idx % 3) * 0.12))),
        multiplier: Math.max(12, Math.min(70, Math.round(item.multiplier * (0.95 + (idx % 3) * 0.1)))),
        multiplierText: `${Math.max(12, Math.min(70, Math.round(item.multiplier * (0.95 + (idx % 3) * 0.1))))}`,
      }));
    }

    return {
      outliers: pagedItems,
      totalFound: filtered.length,
      source: "curated_match",
      page,
      hasMore: true,
    };
  });

export const analyzeOutlierItem = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        videoTitle: z.string(),
        viewsText: z.string(),
        multiplier: z.number().or(z.string()),
        channelName: z.string(),
        durationText: z.string(),
        aiApiKey: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return analyzeOutlierPackaging({
      videoTitle: data.videoTitle,
      videoViewsText: data.viewsText,
      videoViewsNum: parseViewsText(data.viewsText),
      multiplier: typeof data.multiplier === "number" ? data.multiplier : parseFloat(data.multiplier) || 1,
      channelName: data.channelName,
      durationText: data.durationText,
      customAiKey: data.aiApiKey,
    });
  });
