import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Catalog of the 16 Proven Primary Patterns and Short Codes
export interface MechanismDefinition {
  id: string;
  code: string;
  pattern: string;
  focus: string;
  description: string;
  sampleTrigger: string;
}

export const MECHANISMS_CATALOG: MechanismDefinition[] = [
  {
    id: "cg",
    code: "CG",
    pattern: "Comprehensive Guide",
    focus: "Definitive Masterclass",
    description: "Complete, all-in-one resource, exhaustive breakdown, or beginner-to-advanced blueprint.",
    sampleTrigger: "Definitive visual walkthrough, complete field manual, zero-to-hero breakdown.",
  },
  {
    id: "d",
    code: "D",
    pattern: "Discovery",
    focus: "Startling New Finding",
    description: "Startling new scientific, historical, radar, or physical finding; unexpected reveal.",
    sampleTrigger: "Archaeological excavation, deep radar scans, satellite anomalies, unearthing the unexpected.",
  },
  {
    id: "fs",
    code: "FS",
    pattern: "Forbidden/Secret",
    focus: "Classified / Concealed Knowledge",
    description: "Concealed, restricted, forbidden, or hidden knowledge kept behind closed doors.",
    sampleTrigger: "Redacted archives, declassified documents, banned theories, unspoken agreements.",
  },
  {
    id: "fq",
    code: "FQ",
    pattern: "Future Question",
    focus: "Speculative Future Scenario",
    description: "Speculative scenario about what happens next, impending tipping points, or future horizons.",
    sampleTrigger: "2035 projections, runaway tipping points, worst-case consequences, impending shift.",
  },
  {
    id: "ht_hidden",
    code: "HT",
    pattern: "Hidden Truth",
    focus: "Unmasking Misconceptions",
    description: "Unmasking misconceptions, exposing the uncomfortable reality, debunking popular myths.",
    sampleTrigger: "Commonly taught falsehoods, behind-the-curtain reality, counter-narrative truth.",
  },
  {
    id: "he",
    code: "HE",
    pattern: "Historical Event",
    focus: "Pivotal Historic Turning Point",
    description: "Catastrophic turning point, pivotal historical saga, disaster, or fateful decision.",
    sampleTrigger: "The single day that changed history, critical 48 hours, forgotten crisis, tragic collapse.",
  },
  {
    id: "hm",
    code: "HM",
    pattern: "How It's Made",
    focus: "Precision Craftsmanship",
    description: "Intricate manufacturing, engineering assembly, behind-the-scenes factory craftsmanship.",
    sampleTrigger: "Cleanroom engineering, raw elements to finished product, micro-precision assembly.",
  },
  {
    id: "ht_transform",
    code: "HT",
    pattern: "How/Transformation",
    focus: "Dramatic Evolution",
    description: "Zero-to-hero shift, radical pivot, complete metamorphosis, overcoming impossible odds.",
    sampleTrigger: "From humble origins to world power, dramatic turnaround, technological evolution.",
  },
  {
    id: "io",
    code: "IO",
    pattern: "Impossible Object",
    focus: "Engineering / Physics Anomaly",
    description: "Engineering, structural, or physical anomaly defying modern tools, weight, or logic.",
    sampleTrigger: "Megalithic stone precision, 1,000-ton monoliths, structures modern cranes cannot lift.",
  },
  {
    id: "ig",
    code: "IG",
    pattern: "Information Gap",
    focus: "Missing Piece / Vanished Past",
    description: "Intriguing mystery with a missing piece, sudden abandonment, or erased chronicle.",
    sampleTrigger: "Sudden unexplained evacuation, missing historical chapters, blank spots in archives.",
  },
  {
    id: "m",
    code: "M",
    pattern: "Mystery",
    focus: "Unexplained Phenomenon",
    description: "Deep unresolved enigma, eerie signal, cold case, or anomaly defying explanation.",
    sampleTrigger: "Abyssal sound anomalies, unexplainable instrument glitches, unsolvable cold cases.",
  },
  {
    id: "nl",
    code: "NL",
    pattern: "Numbered List",
    focus: "Ranked Insights & Shocking Facts",
    description: "Ranked insights, shocking facts, catastrophic errors, or overlooked curiosities.",
    sampleTrigger: "5 shocking facts, 7 fatal mistakes, top 6 mind-bending realities, 3 bizarre clues.",
  },
  {
    id: "q",
    code: "Q",
    pattern: "Question",
    focus: "Provocative Hypothetical Question",
    description: "Open provocative question, deep dilemma, philosophical puzzle, or survival test.",
    sampleTrigger: "What would happen if..., could humanity survive..., why did builders risk everything...",
  },
  {
    id: "s",
    code: "S",
    pattern: "Superlative",
    focus: "Peak Extremes & Records",
    description: "Peak extremes, the absolute deadliest, largest, rarest, or most dangerous on record.",
    sampleTrigger: "Earth's most extreme anomaly, absolute deadliest phenomenon, record-shattering scale.",
  },
  {
    id: "uc",
    code: "UC",
    pattern: "Unexpected Claim/Technology",
    focus: "Ahead-of-Its-Time Innovation",
    description: "Startling claim, ancient technology centuries ahead of its era, counter-intuitive reality.",
    sampleTrigger: "2,000 years ahead of its time, high-tech ancient metallurgy, counter-intuitive genius.",
  },
  {
    id: "ve",
    code: "VE",
    pattern: "Viewer Experience",
    focus: "Firsthand Immersion & POV",
    description: "Immersive firsthand journey, simulation, restricted access walkthrough, or survival test.",
    sampleTrigger: "24-hour survival challenge, uncensored walkthrough, what it actually feels like inside.",
  },
];

export interface TitleResultItem {
  id: string;
  num: number;
  topic: string;
  angle: string;
  code: string;
  pattern: string;
  workingTitle: string;
}

const GenerateTitlesInput = z.object({
  topics: z.array(z.string().trim().min(1)).min(1),
  anglesPerTopic: z.number().int().min(1).max(5).default(1),
  aiApiKey: z.string().trim().optional(),
});

// Comprehensive contextual knowledge base for viral, natural topic brainstorming
const TOPIC_KNOWLEDGE_BASE: Record<
  string,
  {
    name?: string;
    angles: string[];
    entities: string[];
  }
> = {
  moon: {
    name: "The Moon",
    angles: ["Dark Side Anomalies", "Hollow Structure Theory", "Apollo Mission Secrets", "Subsurface Lava Tubes", "Seismic Ringing", "Origin Collision"],
    entities: ["lunar lava tube caverns", "the mysterious dark side", "Apollo 11 classified transcripts", "seismic ringing anomalies", "subterranean ice reservoirs"],
  },
  lunar: {
    name: "The Moon",
    angles: ["Dark Side Anomalies", "Hollow Structure Theory", "Apollo Mission Secrets", "Subsurface Lava Tubes", "Seismic Ringing", "Origin Collision"],
    entities: ["lunar lava tube caverns", "the mysterious dark side", "Apollo 11 classified transcripts", "seismic ringing anomalies", "subterranean ice reservoirs"],
  },
  babylon: {
    name: "Ancient Babylon",
    angles: ["Hanging Gardens", "Cuneiform Curse Tablets", "Tower of Babel", "Sudden Collapse", "Mighty Ishtar Gates", "Astronomical Codes"],
    entities: ["the Hanging Gardens", "the Tower of Babel", "ancient cuneiform curse tablets", "the Gate of Ishtar", "Babylon's forgotten astronomical maps"],
  },
  mesopotamia: {
    name: "Mesopotamia",
    angles: ["Lost Ziggurats", "Cuneiform Secrets", "First Civilization Rise", "Sudden Collapse", "Sacred Canal Engineering"],
    entities: ["ancient ziggurat megastructures", "the Epic of Gilgamesh tablets", "Ur's royal tombs", "lost hydraulic canals"],
  },
  "lost cities": {
    name: "Lost Cities",
    angles: ["Underground Megastructures", "Sudden Abandonment", "Submerged Temples", "Desert Strongholds", "Vanished Civilizations", "Unwritten Chronicles"],
    entities: ["Derinkuyu underground complex", "Mohenjo-daro's sudden evacuation", "Amazonian LiDAR metropolises", "sunken Yonaguni megaliths", "desert cliffside citadels"],
  },
  "lost city": {
    name: "Lost Cities",
    angles: ["Underground Megastructures", "Sudden Abandonment", "Submerged Temples", "Desert Strongholds", "Vanished Civilizations", "Unwritten Chronicles"],
    entities: ["Derinkuyu underground complex", "Mohenjo-daro's sudden evacuation", "Amazonian LiDAR metropolises", "sunken Yonaguni megaliths", "desert cliffside citadels"],
  },
  city: {
    name: "Lost Cities",
    angles: ["Underground Megastructures", "Sudden Abandonment", "Submerged Temples", "Desert Strongholds", "Vanished Civilizations", "Unwritten Chronicles"],
    entities: ["Derinkuyu underground complex", "Mohenjo-daro's sudden evacuation", "Amazonian LiDAR metropolises", "sunken Yonaguni megaliths", "desert cliffside citadels"],
  },
  china: {
    name: "China",
    angles: ["Subterranean Megaprojects", "Great Wall Engineering", "Emperor Qin's Mercury Tomb", "High-Speed Rail Networks", "Ancient Seismographs", "Tech Super-Hubs"],
    entities: ["Emperor Qin's toxic mercury tomb", "the Great Wall's hidden fortresses", "subterranean high-speed tunnels", "ancient earthquake detectors", "deep mountain megastructures"],
  },
  egypt: {
    name: "Ancient Egypt",
    angles: ["Megalithic Engineering", "Discovery", "Lost Quarrying Tech", "Royal Curses", "Buried Crypts", "Great Pyramid Astronomy"],
    entities: [
      "the Great Pyramids",
      "1,000-ton granite obelisks",
      "precision stone-cutting saws",
      "Tutankhamun's subterranean vault",
      "ancient quarrying technology",
      "undisturbed royal crypts",
    ],
  },
  pyramid: {
    name: "The Great Pyramids",
    angles: ["Precision Engineering", "Hidden Shafts", "Acoustic Resonance", "Quarrying Feats", "Lost Builders", "Subterranean Void"],
    entities: ["the Great Pyramid's hidden void", "precision granite casing stones", "subterranean bedrock chambers", "ancient alignment astronomy"],
  },
  antarctica: {
    name: "Antarctica",
    angles: ["Discovery", "Subglacial Lakes", "Prehistoric Radar", "Ice Core Anomalies", "Deep Station Isolation"],
    entities: [
      "Lake Vostok",
      "two-mile-deep ice sheets",
      "ancient subglacial river systems",
      "isolated research outposts",
      "sub-ice magnetic anomalies",
    ],
  },
  rome: {
    name: "Roman Empire",
    angles: ["Lost Technology", "Hydraulic Engineering", "Lost Legions", "Colosseum Secrets", "Concrete Durability"],
    entities: [
      "self-healing Roman concrete",
      "aqueduct hydraulic precision",
      "the lost Ninth Legion",
      "subterranean Colosseum lift machinery",
      "imperial road networks",
    ],
  },
  space: {
    name: "Deep Space",
    angles: ["Black Hole Physics", "Lost Satellites", "Moon Anomalies", "Interstellar Horizon", "Rogue Planets"],
    entities: [
      "supermassive black holes",
      "rogue wandering planets",
      "the cosmic event horizon",
      "deep-space radio bursts",
      "interstellar void anomalies",
    ],
  },
  medicine: {
    name: "Ancient Medicine",
    angles: ["Ancient Surgery", "Toxic Treatments", "Herbal Alchemy", "Plague Survival", "Trepanation"],
    entities: [
      "skull trepanation techniques",
      "mercury and arsenic elixirs",
      "battlefield surgical tools",
      "medieval plague doctor remedies",
      "ancient herbal anesthetics",
    ],
  },
  ocean: {
    name: "The Deep Ocean",
    angles: ["Mariana Trench", "Ghost Ships", "Abyssal Creatures", "Bermuda Triangle", "Underwater Megastructures"],
    entities: [
      "Mariana Trench extreme pressure zones",
      "the ghost ship Mary Celeste",
      "bioluminescent deep-sea predators",
      "submerged megalithic structures",
      "unmapped abyssal trenches",
    ],
  },
  mars: {
    name: "Mars",
    angles: ["Lost Oceans", "Subsurface Caverns", "Rover Anomalies", "Olympus Mons", "Atmosphere Loss"],
    entities: ["ancient dried ocean beds", "the subsurface lava tubes of Olympus Mons", "the Face on Mars anomaly", "subsurface permafrost lakes"],
  },
  vikings: {
    name: "The Vikings",
    angles: ["Sunstone Navigation", "Ulfberht Steel Swords", "Berserker Alchemy", "Lost Settlements", "Raid Tactics"],
    entities: ["Ulfberht crucible steel swords", "crystalline sunstone navigation", "Vinland's lost settlements", "berserker sacred rituals"],
  },
  ai: {
    name: "Artificial Intelligence",
    angles: ["The Runaway Tipping Point", "Autonomous Black Boxes", "AGI Deadlines", "Hidden Vulnerabilities", "Robotic Swarms"],
    entities: ["neural network black boxes", "superintelligent autonomous systems", "autonomous drone swarms", "the alignment horizon"],
  },
};

function getTopicContext(rawTopic: string) {
  const lower = rawTopic.toLowerCase().trim();
  for (const [k, v] of Object.entries(TOPIC_KNOWLEDGE_BASE)) {
    if (lower === k || lower.includes(k) || k.includes(lower)) {
      return { topicName: v.name || rawTopic, angles: v.angles, entities: v.entities };
    }
  }

  // Clean and title-case the topic name for arbitrary inputs
  const cleanedTopic = rawTopic
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Dynamic contextual angles and entities for any arbitrary topic
  return {
    topicName: cleanedTopic,
    angles: [
      "Hidden Anomalies",
      "Secret Origins",
      "Radical Innovations",
      "Critical Tipping Point",
      "The Dark Reality",
      "Megalithic Feats",
      "The Unspoken Rules",
      "Worst-Case Scenarios",
    ],
    entities: [
      `${cleanedTopic}'s core secrets`,
      `the hidden reality of ${cleanedTopic}`,
      `the untold side of ${cleanedTopic}`,
      `shocking anomalies in ${cleanedTopic}`,
      `the critical tipping point of ${cleanedTopic}`,
    ],
  };
}

// Clean entity string generator
function getEntityText(topic: string, angle: string, customEntity?: string): string {
  if (customEntity && customEntity.trim().length > 3) {
    return customEntity.trim();
  }
  const cleanTopic = topic.trim();
  const cleanAngle = angle.trim().replace(/^the\s+/i, "");
  return `${cleanTopic}'s ${cleanAngle}`;
}

// Highly curiosity-driven generators for all 16 mechanisms
const CURIOSITY_GENERATORS: Record<string, ((t: string, a: string, e: string) => string)[]> = {
  // Q: Question - MUST be an authentic, provocative, high-stakes curiosity question ending with ?
  q: [
    (t, a, e) => `Did Scientists Just Find an Artificial Structure on ${t}?`,
    (t, a, e) => `What Would Happen If ${t} Suddenly Lost Its ${a}?`,
    (t, a, e) => `Could ${e} Actually Explain Why History Kept It Hidden?`,
    (t, a, e) => `Why Did Authorities Abruptly Stop Investigating ${e}?`,
    (t, a, e) => `What Is Actually Lurking Beneath ${e}?`,
    (t, a, e) => `Is ${e} the Greatest Unsolved Riddle in History?`,
    (t, a, e) => `What If Everything We Were Told About ${e} Was Backwards?`,
    (t, a, e) => `Could Humanity Survive the Worst-Case Failure of ${e}?`,
    (t, a, e) => `Why Did Ancient Builders Risk Everything to Create ${e}?`,
    (t, a, e) => `Is There an Undiscovered Anomaly Hidden Inside ${e}?`,
  ],

  // D: Discovery - Startling finding, unexpected unearthing, radar anomaly
  d: [
    (t, a, e) => `Deep Beneath ${t}, Radar Just Detected an Impossible ${a}`,
    (t, a, e) => `Drilling Into ${t}: What Scientists Actually Found Inside ${a}`,
    (t, a, e) => `Satellite Scans Over ${t} Just Pinpointed an Anomalous ${a}`,
    (t, a, e) => `"We Didn't Expect This": Startling New Evidence of ${a} in ${t}`,
    (t, a, e) => `Excavations at ${t} Yielded an Artifact That Defies Modern Science: ${a}`,
    (t, a, e) => `After Centuries of Searching, ${t}'s Lost ${a} Was Finally Located`,
    (t, a, e) => `A Random Archaeological Scan in ${t} Completely Upended History: ${a}`,
    (t, a, e) => `Sensors on ${t} Just Recorded an Unprecedented Surge in ${a}`,
  ],

  // FS: Forbidden/Secret - Classified, redacted, suppressed, censored knowledge
  fs: [
    (t, a, e) => `Declassified Archives: What Was Quietly Covered Up About ${e}`,
    (t, a, e) => `Locked Behind Heavy Vault Doors: ${t}'s Most Guarded ${a}`,
    (t, a, e) => `"Do Not Disclose This": The Banned Records on ${e}`,
    (t, a, e) => `Classified Files Reveal What Truly Happened to ${e}`,
    (t, a, e) => `${t}'s Darkest Secret: Why ${a} Was Deliberately Erased From History`,
    (t, a, e) => `The Forbidden Treaty: What Authorities Concealed Regarding ${e}`,
    (t, a, e) => `Behind Closed Doors: The Suppressed Truth About ${e}`,
    (t, a, e) => `Redacted Records: The Censored Chapter of ${e}`,
  ],

  // FQ: Future Question - Speculative scenario, impending collapse, 2035 horizon
  fq: [
    (t, a, e) => `2035 Horizon: What Happens When ${e} Hits Critical Mass?`,
    (t, a, e) => `Could ${t}'s Accelerating ${a} Trigger an Irreversible Global Collapse?`,
    (t, a, e) => `Imagine If ${e} Suddenly Collapsed Tomorrow Morning`,
    (t, a, e) => `Are We Nearing the Irreversible Breaking Point in ${e}?`,
    (t, a, e) => `When ${e} Reaches Its Limit, This Is What Follows`,
    (t, a, e) => `If ${e} Fails, Here Is the Terrifying Domino Effect`,
    (t, a, e) => `The Approaching Shift in ${e} That Nobody Is Prepared For`,
    (t, a, e) => `What Will Tomorrow Look Like If ${e} Accelerates Unchecked?`,
  ],

  // ht_hidden: Hidden Truth - Unmasking misconceptions, busting myths, dark reality
  ht_hidden: [
    (t, a, e) => `Almost Everything We Were Taught About ${e} Is Factually Wrong`,
    (t, a, e) => `The Dark Reality Behind ${t}'s Celebrated ${a}`,
    (t, a, e) => `Debunking the Biggest Historical Lie Surrounding ${e}`,
    (t, a, e) => `Behind the Facade: The Disturbing Reality of ${e}`,
    (t, a, e) => `Historians Reluctantly Admit the Disturbing Truth About ${e}`,
    (t, a, e) => `We Believed a Complete Myth: The Real Story of ${e}`,
    (t, a, e) => `Exposing the Fatal Flaw in ${t}'s Famous ${a}`,
    (t, a, e) => `Don't Fall for the Propaganda Surrounding ${e}`,
  ],

  // he: Historical Event - Catastrophic turning points, fateful 48 hours, disaster
  he: [
    (t, a, e) => `The Single Day That Completely Destroyed ${e}`,
    (t, a, e) => `Inside the Critical 48 Hours That Decided the Fate of ${e}`,
    (t, a, e) => `When ${e} Collapsed and Stunned the Entire World`,
    (t, a, e) => `Revisiting the Fateful Moment That Ended ${e}`,
    (t, a, e) => `${t}'s Forgotten Crisis: The Calamity That Reshaped ${a}`,
    (t, a, e) => `How One Miscalculated Order Caused ${e} to Fall`,
    (t, a, e) => `From Golden Age to Ashes: The Untold Epic of ${e}`,
    (t, a, e) => `The Overlooked Spark That Doomed ${e}`,
  ],

  // hm: How It's Made - Precision engineering, teardowns, manufacturing secrets
  hm: [
    (t, a, e) => `Inside the High-Tech Facility Engineering ${e}`,
    (t, a, e) => `Raw Elements to Finished Marvel: How ${t} Built Its ${a}`,
    (t, a, e) => `Watch How Master Craftsmen Assembled ${e}`,
    (t, a, e) => `The Microscopic Precision Demanded by ${e}`,
    (t, a, e) => `Tearing Down ${e}: What's Actually on the Inside`,
    (t, a, e) => `Step Inside the Secret Cleanroom Powering ${e}`,
    (t, a, e) => `${e}: An Industrial Triumph Defying Modern Standards`,
    (t, a, e) => `From Molten Slag to Precision Machine: Manufacturing ${e}`,
  ],

  // ht_transform: How/Transformation - Radical evolution, zero-to-hero, exponential shift
  ht_transform: [
    (t, a, e) => `From Humble Beginnings to Global Dominance: ${e} Shift`,
    (t, a, e) => `How a Single Desperate Pivot Saved ${e} From Annihilation`,
    (t, a, e) => `${t}'s Radical Metamorphosis: How It Reinvented ${a}`,
    (t, a, e) => `Then vs Now: The Mind-Blowing Evolution of ${e}`,
    (t, a, e) => `Starting With Nothing: The Exponential Rise of ${e}`,
    (t, a, e) => `Turning Catastrophic Defeat Into Victory: ${e} Overhaul`,
    (t, a, e) => `The Quantum Leap: How ${t} Mastered ${a} in Under a Decade`,
    (t, a, e) => `Witnessing the Rapid Transformation of ${e}`,
  ],

  // io: Impossible Object - Structural/engineering anomaly defying modern tools
  io: [
    (t, a, e) => `Modern Cranes Cannot Lift What ${t} Builders Moved for ${a}`,
    (t, a, e) => `Carved Without Steel: The Mind-Bending Megaliths of ${e}`,
    (t, a, e) => `This Ancient Anomaly in ${t} Defies Structural Physics: ${a}`,
    (t, a, e) => `How Did Ancient Builders Assemble ${e} Without Mortar?`,
    (t, a, e) => `Structural Engineers Still Can't Replicate ${e}`,
    (t, a, e) => `Defying Gravity and Scale: The Impossible Architecture of ${e}`,
    (t, a, e) => `${t}'s Precision Saws: An Engineering Feat We Still Can't Explain: ${a}`,
    (t, a, e) => `An Impossible 1,000-Ton Puzzle: Inside ${e}`,
  ],

  // ig: Information Gap - Missing puzzle piece, sudden abandonment, erased chronicle
  ig: [
    (t, a, e) => `Nobody Knows Why ${t} Was Suddenly Abandoned: The Riddle of ${a}`,
    (t, a, e) => `Where Did ${t}'s Legendary ${a} Vanish To?`,
    (t, a, e) => `Lost to History: The Unwritten Mystery of ${e}`,
    (t, a, e) => `Archaeologists Struck a Complete Dead End Investigating ${e}`,
    (t, a, e) => `The Missing Clue That Still Baffles Every Expert on ${e}`,
    (t, a, e) => `Why Centuries of Recorded History Remain Silent on ${e}`,
    (t, a, e) => `${t}'s Erased Records: The Missing Chronicle of ${a}`,
    (t, a, e) => `A Sudden Blank Spot in Time: What Really Happened to ${e}?`,
  ],

  // m: Mystery - Deep unresolved anomaly, eerie signal, cold case
  m: [
    (t, a, e) => `Deep Inside ${t}, an Eerie Phenomenon Baffles Researchers: ${a}`,
    (t, a, e) => `Something Uncanny Is Taking Place Around ${e}`,
    (t, a, e) => `The Cold Case That Defies Modern Science: ${e}`,
    (t, a, e) => `A Cryptic Signal From ${e} That Researchers Cannot Explain`,
    (t, a, e) => `Why Instruments Keep Glitching Whenever They Scan ${e}`,
    (t, a, e) => `${t}'s Deepest Riddle: The Unresolved Phenomenon of ${a}`,
    (t, a, e) => `Whispers From the Depths: What Happened to ${e}?`,
    (t, a, e) => `The Baffling Acoustic Signal Emanating From ${e}`,
  ],

  // nl: Numbered List - Ranked shocking facts, fatal blunders, mind-bending clues
  nl: [
    (t, a, e) => `5 Disturbing Discoveries Surrounding ${e} Never Explained`,
    (t, a, e) => `7 Fatal Mistakes in ${e} That Led to Total Catastrophe`,
    (t, a, e) => `Top 6 Mind-Bending Realities Hidden Inside ${e}`,
    (t, a, e) => `3 Bizarre Anomalies Documented in ${e}`,
    (t, a, e) => `${t}'s ${a}: 5 Overlooked Clues That Challenge Everything We Knew`,
    (t, a, e) => `8 Disturbing Anomalies Uncovered Around ${e}`,
    (t, a, e) => `Ranked: The 5 Deadliest Blunders in ${e}`,
    (t, a, e) => `4 Radical Truths About ${e} That Alter History`,
  ],

  // s: Superlative - Absolute peak extremes, deadliest, largest, rarest
  s: [
    (t, a, e) => `The Absolute Most Dangerous Spot in ${t}: ${a}`,
    (t, a, e) => `Earth's Most Powerful ${a} Lies Buried Inside ${t}`,
    (t, a, e) => `Breaking Every Record: The Unprecedented Scale of ${e}`,
    (t, a, e) => `${t}'s Deadliest ${a}: Pushing Limits to the Absolute Edge`,
    (t, a, e) => `Unrivaled Scale: Inside ${t}'s Most Extreme Crisis Over ${a}`,
    (t, a, e) => `The Rarest, Most Terrifying Phenomenon in ${t}'s History: ${a}`,
    (t, a, e) => `Surpassing All Limits: The Wildest Crisis in ${e}`,
    (t, a, e) => `The Most Extreme ${a} That Defies Every Natural Law in ${t}`,
  ],

  // uc: Unexpected Claim/Technology - Centuries ahead of its time, startling claim
  uc: [
    (t, a, e) => `2,000 Years Ahead of Its Time: ${e}`,
    (t, a, e) => `${t}'s Ancient ${a} Was Staggeringly High-Tech`,
    (t, a, e) => `Why Doing the Complete Opposite Saved ${e}`,
    (t, a, e) => `Scientists Now Confirm: ${e} Is 10x More Advanced Than Believed`,
    (t, a, e) => `They Laughed at ${e} Until New Evidence Proved It True`,
    (t, a, e) => `An Impossible Technological Leap Unearthed Inside ${e}`,
    (t, a, e) => `The Astonishing High-Tech Genius Behind ${e}`,
    (t, a, e) => `Defying Its Era: How ${t} Mastered ${a} Millennia Early`,
  ],

  // ve: Viewer Experience - Firsthand immersion, POV, 24-hour survival, walk-through
  ve: [
    (t, a, e) => `I Spent 24 Hours Inside ${t}'s Most Restricted ${a}`,
    (t, a, e) => `Step Inside ${t}'s High-Security ${a} (Unrestricted Walkthrough)`,
    (t, a, e) => `What It Truly Feels Like to Experience ${e}`,
    (t, a, e) => `Journeying Through ${t}: An Unfiltered Expedition Into ${a}`,
    (t, a, e) => `A Rare Firsthand Exploration of ${e}`,
    (t, a, e) => `Surviving the Unthinkable: Deep Dive Into ${e}`,
    (t, a, e) => `Behind the Security Gates: Walking Through ${t}'s Most Dangerous ${a}`,
    (t, a, e) => `POV: What Happens When You Step Foot Inside ${e}`,
  ],

  // cg: Comprehensive Guide - Exhaustive visual breakdown, masterclass, full guide
  cg: [
    (t, a, e) => `Mastering ${t} (${a}): The Definitive Visual Breakdown`,
    (t, a, e) => `Everything You Need to Know About ${e}`,
    (t, a, e) => `${t} Explained: A Complete Masterclass on ${a}`,
    (t, a, e) => `Decoding ${e} From Scratch`,
    (t, a, e) => `Step-by-Step Blueprint: Understanding ${e}`,
    (t, a, e) => `${a} Inside ${t}: The Complete Field Guide`,
    (t, a, e) => `From Foundations to Mastery: Navigating ${e}`,
    (t, a, e) => `Building a Complete Working Knowledge of ${e}`,
  ],
};

// Robust generator resolver that normalizes both ID and short code (case-insensitive)
function resolveMechanismPool(codeOrId: string) {
  let key = codeOrId.toLowerCase().trim().replace(/[^a-z_]/g, "");
  if (key === "ht") {
    // If generic code HT is given, pick between hidden truth and transformation
    key = Math.random() > 0.5 ? "ht_hidden" : "ht_transform";
  }
  return CURIOSITY_GENERATORS[key] || CURIOSITY_GENERATORS.cg;
}

// Synthesize title with rich curiosity hooks and ZERO predetermined start statements
function synthesizeHeuristicTitle(
  topic: string,
  angle: string,
  codeOrId: string,
  customEntity?: string,
): string {
  const t = topic.trim();
  const a = angle.trim();
  const e = getEntityText(t, a, customEntity);

  const pool = resolveMechanismPool(codeOrId);
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(t, a, e);
}

// Generate titles via Heuristic Engine
function generateHeuristicsBatch(
  topics: string[],
  anglesPerTopic: number,
): TitleResultItem[] {
  const results: TitleResultItem[] = [];
  const usedStartWords: string[] = [];
  let rowId = 1;

  for (const rawTopic of topics) {
    const ctx = getTopicContext(rawTopic);
    const displayTopic = ctx.topicName || rawTopic;

    const anglesPool = [...ctx.angles].sort(() => Math.random() - 0.5);
    const chosenAngles = anglesPool.slice(0, anglesPerTopic);

    // If anglesPerTopic > available in pool, supplement
    while (chosenAngles.length < anglesPerTopic) {
      chosenAngles.push(`Angle ${chosenAngles.length + 1}`);
    }

    const usedMechIds = new Set<string>();

    for (let i = 0; i < chosenAngles.length; i++) {
      const angle = chosenAngles[i];

      // Pick a mechanism not yet used for this topic if possible
      let availableMechs = MECHANISMS_CATALOG.filter((m) => !usedMechIds.has(m.id));
      if (availableMechs.length === 0) availableMechs = [...MECHANISMS_CATALOG];
      const mech = availableMechs[Math.floor(Math.random() * availableMechs.length)];
      usedMechIds.add(mech.id);

      const entity = ctx.entities[i % ctx.entities.length] || `${displayTopic}'s ${angle}`;

      // Synthesize title avoiding repeating recent start words
      let title = "";
      for (let attempt = 0; attempt < 8; attempt++) {
        const candidate = synthesizeHeuristicTitle(displayTopic, angle, mech.id, entity);
        const startWord = candidate
          .split(/\s+/)[0]
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();

        // Enforce diversity: no duplicate start words in recent 3 items, and strictly limit "the"
        if (!usedStartWords.slice(-3).includes(startWord)) {
          title = candidate;
          usedStartWords.push(startWord);
          break;
        }
      }

      if (!title) {
        title = synthesizeHeuristicTitle(displayTopic, angle, mech.id, entity);
        const startWord = title
          .split(/\s+/)[0]
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();
        usedStartWords.push(startWord);
      }

      results.push({
        id: `${displayTopic}-${angle}-${mech.code}-${rowId}`,
        num: rowId++,
        topic: displayTopic,
        angle,
        code: mech.code,
        pattern: mech.pattern,
        workingTitle: title,
      });
    }
  }

  return results;
}

// Generate titles via Gemini API or Lovable AI Gateway
async function generateAiBatch(
  topics: string[],
  anglesPerTopic: number,
  geminiKey?: string,
  lovableKey?: string,
): Promise<TitleResultItem[] | null> {
  const mechanismsListText = MECHANISMS_CATALOG.map(
    (m) => `- ${m.pattern} (Code: ${m.code}): ${m.focus} - ${m.description}`,
  ).join("\n");

  const prompt = `You are an elite YouTube packaging expert and viral title strategist.
Generate YouTube titles following this strict formula:
Topic -> Angle -> Mechanism -> Title.

Topics to process:
${topics.map((t, idx) => `${idx + 1}. "${t}"`).join("\n")}

For EACH topic, generate exactly ${anglesPerTopic} item(s).
Available 16 Primary Patterns & Short Codes:
${mechanismsListText}

FOR EACH ANGLE GENERATED:
1. "topic": Exact topic provided.
2. "angle": A punchy 1 to 3 word thematic angle or concept (e.g. "Dark Side Anomalies", "Hanging Gardens", "Subterranean Megaprojects", "Apollo Secrets", "Lost Technology").
3. "code": Exact 1-2 letter short code from the 16 mechanisms (e.g. "Q", "D", "FS", "NL", "S", "UC", "VE", "IO", "M", "IG", "HT", "HE", "HM", "FQ", "CG").
4. "pattern": Full name of the primary pattern (e.g. "Question", "Discovery", "Forbidden/Secret", "Numbered List", "Superlative").
5. "workingTitle": The viral working title built using Topic + Angle + Mechanism.

CRITICAL USER MANDATE ON TITLES & CURIOSITY CODES:
- The Working Title MUST strictly reflect the curiosity trigger of the assigned Code:
  * If Code is Q (Question): The title MUST be a provocative, high-stakes curiosity question ending in '?' (e.g. "Did Scientists Just Find an Artificial Structure on the Moon?").
  * If Code is D (Discovery): The title MUST center on an unexpected finding, radar detection, or excavation reveal.
  * If Code is FS (Forbidden/Secret): The title MUST evoke classified, censored, or restricted knowledge.
  * If Code is NL (Numbered List): The title MUST feature a specific number (5, 7, 6, 8) highlighting ranked insights or shocking facts.
  * If Code is S (Superlative): The title MUST feature an absolute peak extreme (deadliest, largest, rarest).
  * If Code is UC (Unexpected Claim/Tech): The title MUST feature ahead-of-its-time technology or a counter-intuitive reality.
  * If Code is VE (Viewer Experience): The title MUST provide a firsthand immersion, sensory POV, or walk-through.
  * If Code is IO (Impossible Object): The title MUST center on an engineering or physical anomaly modern cranes or physics cannot replicate.
  * If Code is M (Mystery): The title MUST evoke an eerie anomaly, strange signal, or cold case.
  * If Code is IG (Information Gap): The title MUST highlight an unanswered riddle or sudden disappearance.
  * If Code is HE (Historical Event): The title MUST focus on a catastrophic turning point or critical 48 hours.
  * If Code is HM (How It's Made): The title MUST focus on precision manufacturing or teardowns behind closed doors.
  * If Code is HT (How/Transformation): The title MUST focus on a radical evolution or zero-to-hero rise.
  * If Code is HT (Hidden Truth): The title MUST debunk a myth or expose an uncomfortable reality.
  * If Code is FQ (Future Question): The title MUST address a future tipping point or speculative countdown.
  * If Code is CG (Comprehensive Guide): Only for CG can it be a complete masterclass or definitive guide.
- The Working Title MUST NOT have predetermined or repetitive start statements!
- DO NOT start every title with "The...", "How...", "Why...", "What happens when...", "7 Things...", or "Nobody knows...".
- Each title MUST be unique and have a distinct grammatical start and sentence structure (direct declarative statements, active verbs, dialogue/quotes, colon breaks, paradoxes, time or place anchors, questions).

Return a JSON array of objects with the exact schema:
[
  {
    "topic": "string",
    "angle": "string",
    "code": "string",
    "pattern": "string",
    "workingTitle": "string"
  }
]`;

  // 1. Direct Gemini API call
  if (geminiKey) {
    for (const model of ["gemini-1.5-flash", "gemini-2.0-flash"]) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.map((item: any, idx: number) => ({
                id: `${item.topic}-${item.angle}-${item.code}-${idx + 1}`,
                num: idx + 1,
                topic: String(item.topic || ""),
                angle: String(item.angle || ""),
                code: String(item.code || "UC"),
                pattern: String(item.pattern || "Viral Pattern"),
                workingTitle: String(item.workingTitle || ""),
              }));
            }
          }
        }
      } catch (err) {
        console.warn(`Gemini title generation call failed on ${model}:`, err);
      }
    }
  }

  // 2. Lovable AI Gateway
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
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : parsed.titles || parsed.results || [];
          if (Array.isArray(list) && list.length > 0) {
            return list.map((item: any, idx: number) => ({
              id: `${item.topic}-${item.angle}-${item.code}-${idx + 1}`,
              num: idx + 1,
              topic: String(item.topic || ""),
              angle: String(item.angle || ""),
              code: String(item.code || "UC"),
              pattern: String(item.pattern || "Viral Pattern"),
              workingTitle: String(item.workingTitle || ""),
            }));
          }
        }
      }
    } catch (err) {
      console.warn("Lovable AI Gateway title call failed:", err);
    }
  }

  return null;
}

// Server function exposed to frontend
export const generateTitlesServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => GenerateTitlesInput.parse(d))
  .handler(async ({ data }) => {
    const { topics, anglesPerTopic, aiApiKey } = data;

    const userAiKey = aiApiKey?.trim();
    const isOpenAi = userAiKey?.startsWith("sk-");

    const geminiKey =
      (!isOpenAi ? userAiKey : undefined) ||
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      process.env["GOOGLE_AI_KEY"];

    const lovableKey = process.env["LOVABLE_API_KEY"];

    // Try AI generation first if key exists
    if (geminiKey || lovableKey) {
      const aiResults = await generateAiBatch(
        topics,
        anglesPerTopic,
        geminiKey,
        lovableKey,
      );
      if (aiResults && aiResults.length > 0) {
        return {
          results: aiResults,
          mode: "ai",
        };
      }
    }

    // High quality offline heuristic engine fallback
    const heuristicResults = generateHeuristicsBatch(topics, anglesPerTopic);
    return {
      results: heuristicResults,
      mode: "heuristic",
    };
  });
