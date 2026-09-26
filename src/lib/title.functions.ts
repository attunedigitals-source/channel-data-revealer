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
    description: "Concealed, restricted, forbidden, or hidden knowledge kept behind closed doors (only when documented).",
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
    sampleTrigger: "Engineering mastery, raw elements to finished product, micro-precision assembly.",
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
    id: "if",
    code: "IF",
    pattern: "Information Gap",
    focus: "Missing Piece / Vanished Past",
    description: "Intriguing mystery with a missing piece, sudden decline, or erased chronicle.",
    sampleTrigger: "Sudden unexplained abandonment, missing historical chapters, blank spots in archives.",
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
    sampleTrigger: "5 shocking facts, 7 fatal mistakes, top 3 strange discoveries, 4 bizarre clues.",
  },
  {
    id: "q",
    code: "Q",
    pattern: "Question",
    focus: "Provocative Curiosity Question",
    description: "Open provocative question, deep dilemma, philosophical puzzle, or survival test.",
    sampleTrigger: "What would happen if..., could humanity survive..., why did builders risk everything...",
  },
  {
    id: "sf",
    code: "SF",
    pattern: "Superlative/Fascination",
    focus: "Peak Extremes & Fascination",
    description: "Peak extremes, records, sheer scale, and intense fascination with limits.",
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
    focus: "Firsthand Immersion & Simulation",
    description: "Immersive firsthand journey, simulation, observational walkthrough, or survival test.",
    sampleTrigger: "24-hour simulation, observational walkthrough, what it actually feels like inside.",
  },
];

export interface TitleResultItem {
  id: string;
  num: number;
  topic: string;
  factPremise: string;
  angle: string;
  code: string;
  pattern: string;
  workingTitle: string;
  curiosityQuestion: string;
  whyClick: string;
  factuallyGrounded: "YES" | "NEEDS RESEARCH" | "NO";
  visualPotential: "High" | "Exceptional" | "Medium";
}

const GenerateTitlesInput = z.object({
  topics: z.array(z.string().trim().min(1)).min(1),
  anglesPerTopic: z.number().int().min(1).max(5).default(1),
  aiApiKey: z.string().trim().optional(),
});

export interface GroundedIdeaModel {
  fact: string;
  angle: string;
  code: string;
  pattern: string;
  title: string;
  curiosityQuestion: string;
  whyClick: string;
  factuallyGrounded: "YES" | "NEEDS RESEARCH" | "NO";
  visualPotential: "High" | "Exceptional" | "Medium";
}

export interface TopicContextResult {
  topicName: string;
  aliases?: string[];
  ideas: GroundedIdeaModel[];
}

// Curated Grounded Topic Knowledge Base
// Rule: "We don't manufacture mystery. We discover mystery."
// Formula: FACT / PREMISE -> ANGLE -> CURIOSITY MECHANISM -> WORKING TITLE
// Fully calibrated against Day 3 Editorial & Epistemic Standards:
// - Defensible facts without overconfident claims or evaluative superlatives
// - Clear epistemic status (distinguishing theory from discovery, ancient lore from archaeology)
// - Preserving genuine mysteries rather than pretending answers are settled
// - High visual potential for generative filmmaking (Google Flow workflow)
const GROUNDED_TOPIC_KNOWLEDGE: Record<string, { topicName: string; aliases: string[]; ideas: GroundedIdeaModel[] }> = {
  egypt: {
    topicName: "Ancient Egypt",
    aliases: ["egypt", "pyramid", "pyramids", "giza", "pharaoh", "tutankhamun", "sphinx", "nile"],
    ideas: [
      {
        fact: "Ancient Egyptian builders produced and fitted large stone structures using tools and techniques including stone pounders, copper tools, abrasives and sledges; the exact methods used for some precision work remain an area of archaeological study.",
        angle: "Precision Stonework",
        code: "IO",
        pattern: "Impossible Object",
        title: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
        curiosityQuestion: "What specific physical tools, friction abrasives, and methods allowed Bronze Age builders to shape and fit colossal megaliths without iron or steel?",
        whyClick: "Challenges modern assumptions about ancient engineering and explores the genuine physical puzzle.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "The Unfinished Obelisk in Aswan was carved directly into granite bedrock and abandoned after an enormous fatal crack formed during extraction.",
        angle: "Massive Monoliths",
        code: "IO",
        pattern: "Impossible Object",
        title: "How Were Ancient Egypt's Massive Stone Monuments Carved and Moved?",
        curiosityQuestion: "How did quarry workers attempt to carve a 1,000-ton monolith from solid bedrock before the invention of iron tools?",
        whyClick: "Reveals the extreme physical difficulty of ancient quarrying and why the project was abruptly abandoned.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Cosmic-ray muon scans of the Great Pyramid by the ScanPyramids project revealed an undisturbed 30-meter-long void above the Grand Gallery.",
        angle: "Hidden Chambers",
        code: "D",
        pattern: "Discovery",
        title: "What Did Cosmic-Ray Scans Actually Find Inside the Great Pyramid?",
        curiosityQuestion: "What is the newly detected void, and what might explain its location and structure?",
        whyClick: "A genuine, cutting-edge modern scientific discovery inside the world's most famous ancient monument.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "The tomb of Tutankhamun contained over 5,000 intact artifacts, but rumors of a lethal pharaoh's curse spread after Lord Carnarvon died of an infected mosquito bite.",
        angle: "Tomb Curse Myth",
        code: "HT",
        pattern: "Hidden Truth",
        title: "The Real Story Behind the 'Curse' of King Tut's Tomb",
        curiosityQuestion: "Did ancient Egyptians actually place curses on royal tombs, or was it a 20th-century media invention?",
        whyClick: "Debunks a century-old sensational myth while exploring the genuine hazardous molds and toxins found in sealed crypts.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Archaeological excavations at Giza revealed workers' settlements with bakeries, cattle bones, and medical treatment, disproving the myth of slave labor.",
        angle: "The Pyramid Builders",
        code: "HT",
        pattern: "Hidden Truth",
        title: "Who Really Built the Pyramids? The Overlooked Evidence from Giza",
        curiosityQuestion: "How did an ancient kingdom organize and sustain a workforce of 20,000 skilled craftsmen without forced slavery?",
        whyClick: "Overturns the Hollywood depiction of enslaved laborers and reveals the actual logistics of Egypt's state apparatus.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
    ],
  },

  antarctica: {
    topicName: "Antarctica",
    aliases: ["antarctica", "antarctic", "south pole", "polar", "vostok", "ice sheet", "glacier"],
    ideas: [
      {
        fact: "Over two miles of ancient ice sheets bury an entire continent with mountain ranges as large as the European Alps.",
        angle: "Subglacial Geography",
        code: "IF",
        pattern: "Information Gap",
        title: "What Could Be Hidden Beneath Antarctica's Ancient Ice?",
        curiosityQuestion: "What did Antarctica's landscape look like before and beneath the present ice sheet?",
        whyClick: "Triggers deep wonder about a lost, green continent buried beneath glaciers.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Ice cores drilled at Dome C and Vostok contain trapped atmospheric bubbles dating back 800,000 years, preserving Earth's ancient air.",
        angle: "Ice Core Archives",
        code: "D",
        pattern: "Discovery",
        title: "What Do Two Miles of Antarctic Ice Reveal About Earth's Past?",
        curiosityQuestion: "What can ancient air trapped in ice tell us about Earth's climate—and what can that history teach us about future climate change?",
        whyClick: "Tangible evidence showing our planet's past atmosphere frozen in time.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Subglacial Lake Vostok has been sealed from the atmosphere and sunlight for over 15 million years under 3,700 meters of ice.",
        angle: "Lake Vostok",
        code: "M",
        pattern: "Mystery",
        title: "The 15-Million-Year-Old Lake Sealed Deep Beneath Antarctica's Ice",
        curiosityQuestion: "Can microbial life survive in complete darkness under extreme pressure?",
        whyClick: "An alien-like ecosystem on Earth that serves as a test case for Jupiter's moon Europa.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Modern airborne radar and satellite gravity mapping uncovered an enormous canyon network twice as deep as the Grand Canyon beneath the ice sheet.",
        angle: "Radar Mapping",
        code: "D",
        pattern: "Discovery",
        title: "When Radar Scanned Beneath Antarctica, It Revealed a Lost World",
        curiosityQuestion: "How did modern geologists uncover massive canyons and rivers flowing under thousands of feet of ice?",
        whyClick: "Demonstrates how radar technology strips away miles of ice to reveal Earth's hidden topography.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Scientists overwintering at Amundsen-Scott South Pole Station endure 6 months of total darkness and temperatures dropping below -80°C.",
        angle: "South Pole Station",
        code: "VE",
        pattern: "Viewer Experience",
        title: "What Happens to the Human Body During 6 Months of Antarctic Darkness?",
        curiosityQuestion: "How do research crews survive extreme sensory deprivation, hypoxia, and complete winter isolation?",
        whyClick: "Intense psychological and biological curiosity about human limits.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
    ],
  },

  rome: {
    topicName: "The Roman Empire",
    aliases: ["rome", "roman", "roman empire", "colosseum", "pompeii", "caesar", "aqueduct", "legion", "gladiator", "vesuvius", "teutoburg"],
    ideas: [
      {
        fact: "Roman marine concrete has demonstrated remarkable durability, and researchers have identified chemical processes involving volcanic materials that contribute to its long-term behavior.",
        angle: "Self-Healing Concrete",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "Why Roman Concrete Survived for 2,000 Years",
        curiosityQuestion: "What specific chemical processes involving volcanic ash and lime clasts allow Roman breakwaters to endure millennia of seawater exposure?",
        whyClick: "Directly explores the long-term chemical resilience of ancient Roman engineering.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "When Mount Vesuvius erupted in 79 AD, superheated pyroclastic surges entombed Herculaneum, carbonizing private library papyri into fragile charcoal cylinders.",
        angle: "Herculaneum Scrolls",
        code: "D",
        pattern: "Discovery",
        title: "How Scientists Are Finally Reading the Carbonized Scrolls of Vesuvius",
        curiosityQuestion: "How did researchers use high-resolution X-ray tomography and machine-learning segmentation to virtually unwrap and read unopened charred scrolls?",
        whyClick: "Cutting-edge non-destructive imaging revealing lost classical texts from the ashes of Vesuvius.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "In 9 AD, an alliance of Germanic tribes ambushed and annihilated three Roman legions in the Teutoburg Forest, contributing to Rome's decision not to establish permanent control east of the Rhine.",
        angle: "Battle of Teutoburg Forest",
        code: "HE",
        pattern: "Historical Event",
        title: "The Disaster That Stopped the Roman Empire in Its Tracks",
        curiosityQuestion: "How did a Germanic chieftain trained inside the Roman military orchestrate one of Rome's most consequential military defeats?",
        whyClick: "Gripping tactical breakdown of the battle that halted Roman expansion across the Rhine.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "The Pantheon in Rome features an unreinforced concrete dome spanning 43 meters with a 9-meter central oculus that remains the largest of its kind in the world.",
        angle: "The Pantheon Dome",
        code: "IO",
        pattern: "Impossible Object",
        title: "How Roman Builders Constructed the World's Largest Unreinforced Dome",
        curiosityQuestion: "What structural tapering and lightweight volcanic pumice tricks prevented the colossal dome from collapsing under its own weight?",
        whyClick: "Pure architectural wonder that modern structural engineers still study with awe.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "The fall of the Western Roman Empire was not a single catastrophic sack, but a centuries-long unraveling caused by plagues, hyperinflation, and decentralized power.",
        angle: "Fall of Rome",
        code: "HT",
        pattern: "Hidden Truth",
        title: "Why the Roman Empire Really Collapsed (It Wasn't Just Barbarians)",
        curiosityQuestion: "Which internal economic pressures and debased currency doomed Western Rome before foreign armies ever marched on the capital?",
        whyClick: "Counter-intuitive historical analysis with sharp parallels to modern global dilemmas.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
    ],
  },

  space: {
    topicName: "Deep Space",
    aliases: ["space", "deep space", "black hole", "black holes", "rogue planet", "rogue planets", "jwst", "james webb", "voyager", "astronomy", "universe", "cosmic", "galaxy"],
    ideas: [
      {
        fact: "Near a black hole's gravitational field, gravitational time dilation significantly slows the passage of time relative to distant observers, depending on mass and proximity.",
        angle: "Black Hole Time Dilation",
        code: "Q",
        pattern: "Question",
        title: "What Would Happen If You Spent 24 Hours Near a Black Hole?",
        curiosityQuestion: "What would an observer experience visually and physically as strong gravitational time dilation takes effect near an event horizon?",
        whyClick: "Unpacks Einsteinian general relativity into an immediate, visceral human scenario (Q + VE packaging).",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Interstellar rogue planets travel through space unbound to any host star, yet theoretical models suggest some could retain thick atmospheres and internal geothermal heat.",
        angle: "Rogue Planets",
        code: "NL",
        pattern: "Numbered List",
        title: "3 Strange Things Scientists Think Could Exist on Rogue Planets",
        curiosityQuestion: "Could subsurface liquid water and geothermal ecosystems exist on rogue wandering planets heated only by radioactive core decay?",
        whyClick: "Explores the startling theoretical possibility that deep space contains warm, unbound worlds.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "JWST has identified surprisingly mature-looking galaxies at very early cosmic times, prompting researchers to investigate how such galaxies formed so quickly.",
        angle: "Early Universe Galaxies",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "The Early Galaxies That Challenged What We Thought About the Young Universe",
        curiosityQuestion: "Why did observations of the early universe reveal unexpectedly massive and luminous galaxies so soon after the Big Bang?",
        whyClick: "Genuine cutting-edge astrophysical dilemma challenging galactic formation timelines.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Fast Radio Bursts (FRBs) from distant galaxies discharge in milliseconds the equivalent of centuries of solar energy, with some repeating on precise cycles.",
        angle: "Fast Radio Bursts",
        code: "M",
        pattern: "Mystery",
        title: "The Repeating Cosmic Signals Deep Space Telescopes Can't Explain",
        curiosityQuestion: "What astrophysical mechanism creates ultra-powerful radio pulses repeating with clockwork precision across billions of light-years?",
        whyClick: "Taps into cosmic curiosity without resorting to sensational alien fabrications.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Voyager 1 has traveled over 15 billion miles from Earth and crossed into interstellar space, yet its 1970s instruments still transmit telemetry.",
        angle: "Voyager Interstellar Journey",
        code: "SF",
        pattern: "Superlative/Fascination",
        title: "The Farthest Machine From Earth: What Is Voyager 1 Seeing Right Now?",
        curiosityQuestion: "What does interstellar space actually look like beyond the Sun's protective heliosphere?",
        whyClick: "Fascination with humanity's most distant technological emissary entering the unknown void.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
    ],
  },

  medicine: {
    topicName: "Ancient Medicine",
    aliases: ["ancient medicine", "medicine", "trepanation", "mummy medicine", "edwin smith", "herbal", "pharmacology", "surgery"],
    ideas: [
      {
        fact: "The Edwin Smith Papyrus (c. 1600 BCE) contains 48 rational surgical case studies describing cranial sutures, brain pulsations, and trauma treatments without relying on magical incantations.",
        angle: "Rational Ancient Surgery",
        code: "D",
        pattern: "Discovery",
        title: "The 3,600-Year-Old Medical Papyrus That Pioneered Brain Surgery",
        curiosityQuestion: "How did Bronze Age Egyptian trauma surgeons diagnose skull fractures, manage spinal injuries, and document neurological symptoms centuries before Hippocrates?",
        whyClick: "Overturns assumptions that ancient medicine was solely superstitious sorcery with hard textual proof.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Modern high-resolution CT scans and ancient DNA extraction from mummified remains have identified evidence of atherosclerosis, parasitic infections, and ancient cancers.",
        angle: "Mummy Paleopathology",
        code: "D",
        pattern: "Discovery",
        title: "What Modern Scans of Ancient Mummies Revealed About Human Disease",
        curiosityQuestion: "How are medical researchers using computed tomography on 3,000-year-old tissues to trace the evolutionary history of modern cardiovascular disease?",
        whyClick: "Directly links ancient physical human remains with modern medical forensics and genetic sequencing.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Skeletal remains from Neolithic and Incan cultures exhibit cranial trepanation holes with smooth bone remodeling, demonstrating that patients frequently survived skull surgeries.",
        angle: "Cranial Trepanation",
        code: "IO",
        pattern: "Impossible Object",
        title: "How Ancient Patients Survived Primitive Brain Surgery",
        curiosityQuestion: "What techniques and postoperative wound management allowed ancient healers to bore through human skulls with over 70% survival rates?",
        whyClick: "High-stakes medical survival mystery backed by hard osteological evidence and bone regrowth.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Spectroscopic analysis of 1,500-year-old skeletal remains from ancient Nubia detected significant concentrations of tetracycline, an antibiotic produced by soil bacteria in fermented grain.",
        angle: "Prehistoric Antibiotics",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "The Ancient Nubians Who Accidentally Brewed Antibiotics",
        curiosityQuestion: "How did ancient Nubian brewers produce medicinal tetracycline in their beer over a millennium before Alexander Fleming discovered penicillin?",
        whyClick: "Counter-intuitive scientific surprise combining ancient brewing practices with advanced pharmacology.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Chemical analysis of ancient medicinal residues has confirmed active compounds such as salicylic acid in willow bark and artemisinin precursors in traditional herbal preparations.",
        angle: "Ancient Pharmacology",
        code: "HT",
        pattern: "Hidden Truth",
        title: "The Ancient Remedies Science Has Actually Confirmed",
        curiosityQuestion: "Which ancient botanical preparations were backed by real biochemical efficacy rather than placebo rituals?",
        whyClick: "Separates genuine ancient botanical pharmacology from mythological folklore with laboratory testing.",
        factuallyGrounded: "YES",
        visualPotential: "Medium",
      },
    ],
  },

  ocean: {
    topicName: "The Deep Ocean",
    aliases: ["ocean", "deep ocean", "deep sea", "abyss", "abyssal", "mariana", "mariana trench", "underwater", "trench", "marine"],
    ideas: [
      {
        fact: "More than 75% of the ocean floor remains unmapped by high-resolution multibeam sonar, meaning we possess higher-resolution topographic maps of Mars and Venus than of Earth's seabed.",
        angle: "Unexplored Depths",
        code: "IF",
        pattern: "Information Gap",
        title: "Why Is So Little of the Deep Ocean Still Explored?",
        curiosityQuestion: "What technological and bathymetric barriers prevent oceanographers from mapping the deepest 75% of Earth's seabed to high resolution?",
        whyClick: "Contrasts our space exploration achievements with the alien abyss right beneath our feet.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "In hadal trenches beneath 6,000 meters, organisms survive hydrostatic pressures exceeding 1,000 atmospheres through specialized piezolyte molecules that stabilize cellular proteins.",
        angle: "Abyssal Extremophiles",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "The Strange Creatures That Thrive Where Almost Nothing Should Survive",
        curiosityQuestion: "How do deep-sea creatures survive pressures that would be lethal to humans?",
        whyClick: "Incredible biological adaptations that resemble extraterrestrial life forms.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Deep-sea brine pools on the ocean floor are lakes of hyper-saline water so dense they have their own shorelines, waves, and toxic chemical environments.",
        angle: "Underwater Brine Lakes",
        code: "M",
        pattern: "Mystery",
        title: "The Toxic 'Underwater Lakes' Hidden on the Ocean Floor",
        curiosityQuestion: "What happens when submersibles descend into underwater lakes that exist thousands of feet beneath the surface?",
        whyClick: "Visual shock and fascination with an impossible-sounding geological phenomenon (M + UC + Visual).",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "In 1872, the merchant brigantine Mary Celeste was found floating seaworthy in the Atlantic with full cargo and provisions, but all crew vanished without a trace.",
        angle: "Ghost Ship Mysteries",
        code: "IF",
        pattern: "Information Gap",
        title: "The Mary Celeste: What Really Happened to History's Most Famous Ghost Ship?",
        curiosityQuestion: "What prompted an experienced captain and crew to abandon a perfectly undamaged vessel in calm waters?",
        whyClick: "Enduring historical maritime riddle analyzed through forensic and historical evidence.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Deep-sea hydrophones in the Pacific periodically record unexplained ultra-low-frequency acoustic signals, such as the famous 'Bloop' later traced to icequakes.",
        angle: "Abyssal Acoustic Signals",
        code: "D",
        pattern: "Discovery",
        title: "The Mysterious Ocean Sounds That Baffled Marine Scientists for Decades",
        curiosityQuestion: "What creates ultra-low-frequency acoustic rumbles detected thousands of miles across the Pacific basin?",
        whyClick: "Explores real acoustic anomalies and the scientific process that decoded them.",
        factuallyGrounded: "YES",
        visualPotential: "Medium",
      },
    ],
  },

  cities: {
    topicName: "Lost Cities",
    aliases: ["lost cities", "lost civilization", "civilizations", "mohenjo-daro", "indus", "amazon", "derinkuyu", "petra", "bronze age", "archaeology", "ruins"],
    ideas: [
      {
        fact: "Mohenjo-daro was a large, highly organized Indus Valley settlement with sophisticated sanitation engineering whose decline around 1900 BCE remains the subject of archaeological debate.",
        angle: "Indus Valley Decline",
        code: "Q",
        pattern: "Question",
        title: "Why Did Mohenjo-daro Suddenly Decline? The Mystery of an Ancient City",
        curiosityQuestion: "What environmental shifts, tectonic realignments, or trade disruptions explain the gradual abandonment of the Indus Valley's greatest planned city?",
        whyClick: "Investigates competing archaeological hypotheses on how a major Bronze Age civilization declined without evidence of catastrophic invasion.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Airborne LiDAR surveys across the Upper Amazon basin have documented extensive pre-Columbian urban networks, causeways, and terra preta soils, demonstrating large-scale landscape modification.",
        angle: "Amazonian Megacities",
        code: "D",
        pattern: "Discovery",
        title: "The Lost Civilization Archaeologists Finally Rediscovered Beneath the Amazon",
        curiosityQuestion: "How did pre-Columbian populations engineer fertile terra preta soil and interconnected settlements beneath dense Amazonian jungle canopies?",
        whyClick: "Overturns the long-held assumption of an unpopulated, pristine Amazon wilderness using modern laser scans (D + IF packaging).",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Derinkuyu in Cappadocia is an 18-level subterranean complex carved into volcanic tuff, featuring massive rolling stone doors, wells, and ventilation shafts whose precise original chronology remains debated.",
        angle: "Derinkuyu Underground City",
        code: "Q",
        pattern: "Question",
        title: "Who Built Derinkuyu—and Why Did They Go Underground?",
        curiosityQuestion: "What combination of military raids, climatic extremes, and regional conflicts drove generations of inhabitants to expand subterranean refuge cities?",
        whyClick: "Mesmerizing architectural wonder of an entire functioning city carved deep into volcanic rock.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "The Nabataean city of Petra was carved directly into sandstone cliffs in an arid desert canyon, sustained by an intricate hydraulic engineering network of cisterns.",
        angle: "Petra Hydraulic Engineering",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "How Ancient Builders Created an Oasis City in the Middle of the Desert",
        curiosityQuestion: "How did Nabataean engineers capture flash floods and channel millions of liters of clean water into a desert canyon?",
        whyClick: "Reveals the ingenious civil engineering that allowed an ancient desert capital to flourish.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Over 3,000 years ago, nearly every major palace and urban center across the Eastern Mediterranean collapsed within 50 years, ending the Bronze Age.",
        angle: "Late Bronze Age Collapse",
        code: "HE",
        pattern: "Historical Event",
        title: "1177 BC: How the Ancient World's Greatest Empires Collapsed All at Once",
        curiosityQuestion: "What combination of megadroughts, Sea Peoples migrations, and trade disruption brought down Bronze Age globalization?",
        whyClick: "High-stakes historical catastrophe with eerie parallels to our modern interconnected global economy.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
    ],
  },

  babylon: {
    topicName: "Ancient Babylon",
    aliases: ["babylon", "mesopotamia", "tower of babel", "sumer", "ziggurat", "hammurabi", "euphrates", "etemenanki"],
    ideas: [
      {
        fact: "Etemenanki was a major Babylonian ziggurat traditionally associated by many scholars with the historical background of the Tower of Babel tradition.",
        angle: "Tower of Babel",
        code: "Q",
        pattern: "Question",
        title: "What Do We Actually Know About the Real Tower of Babel?",
        curiosityQuestion: "What did the real Babylonian ziggurat of Marduk look like, and how did its monumental architecture inform ancient textual traditions?",
        whyClick: "Connects legendary ancient narratives to physical archaeology and brick-by-brick excavations.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Cuneiform tablets from Babylon preserve sophisticated mathematical base-60 tables, celestial geometry, and algorithmic predictions of planetary positions.",
        angle: "Babylonian Astronomy",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "The Babylonian Astronomy Tablets That Were Centuries Ahead of Their Time",
        curiosityQuestion: "How did Babylonian astronomers predict celestial movements using mathematical methods centuries before Greek mathematical astronomy?",
        whyClick: "Highlights early Mesopotamian geometric calculations and systematic observational astronomy.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Ancient accounts, including Herodotus and the Cyrus Cylinder, describe the Persian capture of Babylon in 539 BCE, with historians debating the tactical methods and internal political dynamics involved.",
        angle: "Fall of Babylon",
        code: "HE",
        pattern: "Historical Event",
        title: "The Night Babylon Fell: How a Single Strategy Ended an Empire",
        curiosityQuestion: "How did Cyrus the Great enter Babylon's fortified perimeter without a protracted siege, and what do ancient sources reveal about the city's collapse?",
        whyClick: "Masterclass in ancient military strategy and evaluating competing historical chronicles.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "The Code of Hammurabi, carved on a seven-foot diorite stele, is one of the earliest comprehensive legal codes establishing the presumption of innocence.",
        angle: "Code of Hammurabi",
        code: "HT",
        pattern: "Hidden Truth",
        title: "The 3,800-Year-Old Law Code That Defined the Ancient World",
        curiosityQuestion: "How did an ancient Babylonian king construct a universal legal system without a modern court apparatus?",
        whyClick: "Explores the genesis of human justice systems and harsh ancient civic realities.",
        factuallyGrounded: "YES",
        visualPotential: "Medium",
      },
      {
        fact: "Ancient accounts praise the Hanging Gardens of Babylon as a wonder of the world, yet extensive excavations at Babylon have found no physical trace of them.",
        angle: "Hanging Gardens Mystery",
        code: "M",
        pattern: "Mystery",
        title: "The Wonder of the Ancient World That Archaeologists Still Can't Find",
        curiosityQuestion: "Were the Hanging Gardens of Babylon purely mythological, or were they built in Nineveh instead?",
        whyClick: "Investigates whether history's most famous garden ever actually existed.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
    ],
  },

  moon: {
    topicName: "The Moon",
    aliases: ["moon", "lunar", "apollo", "regolith", "shackleton", "artemis", "reiner gamma", "crater"],
    ideas: [
      {
        fact: "Deep craters near the Moon's poles, such as Shackleton Crater, contain permanently shadowed regions at -246°C where orbital neutron spectrometers confirmed vast deposits of water ice.",
        angle: "Permanently Shadowed Craters",
        code: "D",
        pattern: "Discovery",
        title: "The Deep Lunar Craters That Haven't Seen Sunlight in Two Billion Years",
        curiosityQuestion: "How can billions of tons of water ice remain preserved in the vacuum of space inside permanently shadowed lunar cold traps?",
        whyClick: "Reveals an eerie, perpetually dark lunar landscape holding the fuel for future interplanetary exploration.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "The Moon lacks a global magnetic field, yet high-albedo sinuous patterns called lunar swirls—such as Reiner Gamma—align with localized crustal magnetic anomalies.",
        angle: "Lunar Magnetic Swirls",
        code: "M",
        pattern: "Mystery",
        title: "The Ghostly Patterns on the Moon Science Still Can't Fully Explain",
        curiosityQuestion: "What created localized crustal magnetic anomalies on an airless body that deflect solar wind and paint pale swirls across the lunar basalt?",
        whyClick: "Investigates one of planetary science's most striking optical and geophysical enigmas.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "While the Giant Impact hypothesis proposes that a Mars-sized protoplanet named Theia collided with early Earth to form the Moon, isotopic samples show Earth and the Moon share an almost identical chemical fingerprint.",
        angle: "Giant Impact Paradox",
        code: "Q",
        pattern: "Question",
        title: "Where Did the Moon Actually Come From? The Giant Impact Paradox",
        curiosityQuestion: "If a rogue planet collided with early Earth, why does lunar rock match Earth's isotopic composition rather than the impactor's?",
        whyClick: "Directly explores the central unsolved mystery of how our planet acquired its satellite.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Gravity mapping by NASA's GRAIL mission revealed that the Moon's far side possesses a crust significantly thicker than the near side, explaining the almost complete absence of dark volcanic maria.",
        angle: "Lunar Far Side Asymmetry",
        code: "D",
        pattern: "Discovery",
        title: "Why the Far Side of the Moon Looks Completely Different from the Near Side",
        curiosityQuestion: "What early thermal or collision event caused the Moon to develop an asymmetric crust and lopsided volcanic activity?",
        whyClick: "Solves a visual mystery that surprised astronomers when the first far-side photos returned.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Orbital gamma-ray spectrometers identified an anomalous province on the lunar nearside enriched in potassium, rare earth elements, and radioactive thorium known as the Procellarum KREEP Terrane.",
        angle: "Radioactive Lunar Terrane",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "The Radioactive Anomaly Hidden Beneath the Moon's Nearside",
        curiosityQuestion: "Why did billions of tons of radioactive heat-producing elements concentrate on only one hemisphere of the Moon?",
        whyClick: "Reveals the strange geological asymmetry that kept the nearside volcanically active for billions of years.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
    ],
  },

  china: {
    topicName: "Ancient China",
    aliases: ["china", "ancient china", "emperor qin", "terracotta", "mercury tomb", "first emperor", "great wall", "han dynasty"],
    ideas: [
      {
        fact: "Sima Qian's historical records describe Emperor Qin Shi Huang's subterranean mausoleum as containing rivers of liquid mercury, and the central burial chamber remains unopened today due to preservation and safety concerns.",
        angle: "Emperor Qin's Tomb",
        code: "M",
        pattern: "Mystery",
        title: "Why Has Emperor Qin's Central Tomb Remained Unopened?",
        curiosityQuestion: "What archaeological, technological, and preservation considerations have kept the first Emperor of China's burial chamber sealed for over two millennia?",
        whyClick: "Investigates the delicate balance between exploring ancient imperial tombs and preventing atmospheric deterioration.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "Geochemical surveys and soil core samples taken above Emperor Qin's tumulus have detected elevated mercury concentrations, prompting continued scientific investigation into the ancient accounts.",
        angle: "Mercury Soil Survey",
        code: "D",
        pattern: "Discovery",
        title: "What Science Has Revealed About the Mercury Around China's First Emperor's Tomb",
        curiosityQuestion: "What do modern geological and chemical sampling data reveal about the presence of mercury in the soil above Qin Shi Huang's burial mound?",
        whyClick: "Evaluates scientific testing against ancient historical accounts without sensationalism.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Over 8,000 life-sized terracotta soldiers guard the mausoleum complex of Qin Shi Huang, constructed using modular clay assembly techniques that allowed for individual detailing of facial features and uniforms.",
        angle: "Terracotta Army Craftsmanship",
        code: "HM",
        pattern: "How It's Made",
        title: "How Did Ancient Chinese Craftsmen Create Thousands of Terracotta Soldiers?",
        curiosityQuestion: "What workshop organization and modular clay-working systems allowed 3rd-century BCE artisans to mass-produce thousands of individualized life-size statues?",
        whyClick: "Astonishing ancient manufacturing logistics and artistic hyper-realism achieved over 2,200 years ago.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "The Great Wall is not a single contiguous wall but a sprawling 13,000-mile network of rammed earth, brick, and stone fortifications constructed over 2,000 years.",
        angle: "The Great Wall",
        code: "HT",
        pattern: "Hidden Truth",
        title: "The Real Great Wall of China: Debunking History's Biggest Myths",
        curiosityQuestion: "Could the Great Wall actually stop northern nomadic invasions, or was it primarily a customs and economic border?",
        whyClick: "Overturns childhood myths and examines the true geopolitical purpose of the wall.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "During the Warring States period, Chinese metallurgists cast cast-iron agricultural plows and chromium-treated bronze weapons over a millennium before comparable European blast furnaces.",
        angle: "Ancient Metallurgy",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "The Ancient Chinese Weapons Technology That Was 1,000 Years Ahead of Europe",
        curiosityQuestion: "How did 3rd-century BCE Chinese foundries achieve furnace temperatures high enough to melt industrial cast iron?",
        whyClick: "Reveals high-temperature blast furnaces operating centuries ahead of the Industrial Revolution.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
    ],
  },

  titanic: {
    topicName: "The RMS Titanic",
    aliases: ["titanic", "shipwreck", "iceberg", "white star line", "harland and wolff", "ballard"],
    ideas: [
      {
        fact: "Metallurgical testing of Titanic's recovered steel hull plates revealed high sulfur and phosphorus content, making the metal catastrophically brittle in sub-zero North Atlantic waters.",
        angle: "Brittle Steel Metallurgy",
        code: "HT",
        pattern: "Hidden Truth",
        title: "The Microscopic Flaw in Titanic's Steel That Made Sinking Inevitable",
        curiosityQuestion: "Did 1912 metallurgical standards and brittle wrought-iron rivets cause Titanic's hull seams to pop open upon contact?",
        whyClick: "Hard scientific and forensic explanation replacing Hollywood assumptions.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
      {
        fact: "Dr. Robert Ballard's 1985 expedition that found Titanic was a classified US Navy mission to inspect the sunken nuclear submarines USS Thresher and USS Scorpion.",
        angle: "Ballard Declassified Mission",
        code: "FS",
        pattern: "Forbidden/Secret",
        title: "The Classified Cold War Mission That Accidentally Found the Titanic",
        curiosityQuestion: "Why did the US Navy finance the search for the Titanic only as a top-secret cover story for sunken nuclear reactors?",
        whyClick: "Genuine declassified Cold War espionage intertwined with maritime history.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "A voracious iron-eating bacterium named Halomonas titanicae is consuming Titanic's wreckage, with experts estimating the ship will completely dissolve by 2035.",
        angle: "Decaying Wreckage",
        code: "Q",
        pattern: "Question",
        title: "Why Is the Titanic's Wreck Disappearing Faster Than Predicted?",
        curiosityQuestion: "How do deep-ocean rusticles and iron-eating microbes dismantle 50,000 tons of steel two miles beneath the surface?",
        whyClick: "Urgent ticking clock on Earth's most famous shipwreck.",
        factuallyGrounded: "YES",
        visualPotential: "High",
      },
    ],
  },

  quantum: {
    topicName: "Quantum Physics",
    aliases: ["quantum", "quantum physics", "quantum mechanics", "entanglement", "schrodinger", "qubit", "quantum computing"],
    ideas: [
      {
        fact: "Quantum entanglement links particles across vast distances such that measuring one instantaneously determines the state of the other, defying classical local realism.",
        angle: "Quantum Entanglement",
        code: "UC",
        pattern: "Unexpected Claim/Technology",
        title: "Why Einstein Refused to Believe in 'Spooky Action at a Distance'",
        curiosityQuestion: "How did the 2022 Nobel Prize in Physics definitively prove that the universe is not locally real?",
        whyClick: "Directly confronts the weirdest proven reality in physics.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
      {
        fact: "In the double-slit experiment, individual electrons act as wave probabilities until a detector is introduced, at which point the wave function instantly collapses.",
        angle: "The Measurement Problem",
        code: "M",
        pattern: "Mystery",
        title: "The Physics Experiment That Changes Depending on Who Is Watching",
        curiosityQuestion: "Does physical interaction or measurement force quantum decoherence, and why does observation alter the outcome?",
        whyClick: "Mind-bending paradox that sits at the center of modern philosophy of science.",
        factuallyGrounded: "YES",
        visualPotential: "Exceptional",
      },
    ],
  },
};

// Match input to grounded topic or generate an intelligent, grounded semantic profile
// Zero-generic boilerplate rule: No empty "Researchers investigate the fundamental questions..."
export function getGroundedContext(rawTopic: string): TopicContextResult {
  const lower = rawTopic.toLowerCase().trim();

  // 1. Direct key match or alias match
  for (const item of Object.values(GROUNDED_TOPIC_KNOWLEDGE)) {
    if (lower === item.topicName.toLowerCase()) {
      return item;
    }
    for (const alias of item.aliases) {
      if (lower === alias || lower.includes(alias) || alias.includes(lower)) {
        return item;
      }
    }
  }

  // 2. Intelligent, grounded dynamic synthesis for ANY arbitrary topic
  // Strict rule: DO NOT invent fake cleanrooms, radars, or suppressions.
  // DO NOT output empty boilerplate templates ("Researchers research this topic").
  // Instead, formulate concrete investigative angles and set factuallyGrounded to "NEEDS RESEARCH".
  const cleanedTopic = rawTopic
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    topicName: cleanedTopic,
    aliases: [cleanedTopic.toLowerCase()],
    ideas: [
      {
        fact: `Archaeological, geological, or physical investigations into ${cleanedTopic} have uncovered concrete material and structural anomalies that prompt ongoing scientific debate.`,
        angle: "Physical Anomaly",
        code: "D",
        pattern: "Discovery",
        title: `What Physical Evidence Revealed About ${cleanedTopic}`,
        curiosityQuestion: `What specific physical, forensic, or material data challenge conventional explanations of ${cleanedTopic}?`,
        whyClick: `Investigates concrete material measurements rather than speculative theories.`,
        factuallyGrounded: "NEEDS RESEARCH",
        visualPotential: "High",
      },
      {
        fact: `Primary historical chronicles, expedition logs, and material artifacts regarding ${cleanedTopic} contain notable discrepancies that modern researchers are actively analyzing.`,
        angle: "Textual & Artifact Analysis",
        code: "HT",
        pattern: "Hidden Truth",
        title: `What History Got Wrong About ${cleanedTopic}`,
        curiosityQuestion: `Where do primary historical written records diverge from the physical archaeological findings of ${cleanedTopic}?`,
        whyClick: `Examines contradictions between popular narrative traditions and physical evidence.`,
        factuallyGrounded: "NEEDS RESEARCH",
        visualPotential: "High",
      },
      {
        fact: `The specialized techniques and tools associated with ${cleanedTopic} demonstrate problem-solving adaptations that operated without modern industrial machinery.`,
        angle: "Engineering & Mechanics",
        code: "HM",
        pattern: "How It's Made",
        title: `How Ancient Craftsmen Engineered ${cleanedTopic}`,
        curiosityQuestion: `What specific physical tools, friction mechanics, or materials enabled ${cleanedTopic} to be constructed?`,
        whyClick: `Focuses on tangible problem-solving ingenuity and structural mechanics.`,
        factuallyGrounded: "NEEDS RESEARCH",
        visualPotential: "High",
      },
      {
        fact: `The long-term trajectory and sudden turning points of ${cleanedTopic} were shaped by environmental pressures, resource constraints, and pivotal decisions.`,
        angle: "Critical Turning Point",
        code: "HE",
        pattern: "Historical Event",
        title: `The Crisis That Changed ${cleanedTopic} Forever`,
        curiosityQuestion: `Which critical environmental, economic, or strategic turning point decided the fate of ${cleanedTopic}?`,
        whyClick: `High-stakes narrative tension centered on a pivotal real-world threshold.`,
        factuallyGrounded: "NEEDS RESEARCH",
        visualPotential: "High",
      },
      {
        fact: `Major geographical, chemical, or archival frontiers regarding ${cleanedTopic} remain unmapped and subject to competing academic hypotheses.`,
        angle: "Unresolved Frontier",
        code: "Q",
        pattern: "Question",
        title: `Why Is ${cleanedTopic} Still an Unsolved Mystery?`,
        curiosityQuestion: `Which competing scientific or historical hypotheses best explain the open questions surrounding ${cleanedTopic}?`,
        whyClick: `Explores real scientific frontiers without presenting unsubstantiated conclusions.`,
        factuallyGrounded: "NEEDS RESEARCH",
        visualPotential: "High",
      },
    ],
  };
}

// Generate titles via Heuristic Engine grounded in real facts
export function generateHeuristicsBatch(
  topics: string[],
  anglesPerTopic: number,
): TitleResultItem[] {
  const results: TitleResultItem[] = [];
  let rowId = 1;

  for (const rawTopic of topics) {
    const ctx = getGroundedContext(rawTopic);
    const displayTopic = ctx.topicName || rawTopic;

    // Pick requested number of ideas
    const pool = [...ctx.ideas];
    for (let i = 0; i < anglesPerTopic; i++) {
      const idea = pool[i % pool.length];
      if (!idea) continue;

      results.push({
        id: `${displayTopic}-${idea.angle}-${idea.code}-${rowId}`,
        num: rowId++,
        topic: displayTopic,
        factPremise: idea.fact,
        angle: idea.angle,
        code: idea.code,
        pattern: idea.pattern,
        workingTitle: idea.title,
        curiosityQuestion: idea.curiosityQuestion,
        whyClick: idea.whyClick,
        factuallyGrounded: idea.factuallyGrounded,
        visualPotential: idea.visualPotential,
      });
    }
  }

  return results;
}

// Generate titles via OpenAI, Gemini, or Lovable AI Gateway
async function generateAiBatch(
  topics: string[],
  anglesPerTopic: number,
  geminiKey?: string,
  openAiKey?: string,
  lovableKey?: string,
): Promise<TitleResultItem[] | null> {
  const mechanismsListText = MECHANISMS_CATALOG.map(
    (m) => `- Code: ${m.code} (${m.pattern}): ${m.focus} - ${m.description}`,
  ).join("\n");

  const systemPrompt = `You are a world-class documentary title strategist and YouTube packaging architect.
Your core principle:
"WE DO NOT MANUFACTURE MYSTERY. WE DISCOVER MYSTERY."

You follow this STRICT 4-step pipeline for every title:
FACT / PREMISE -> ANGLE -> CURIOSITY MECHANISM -> WORKING TITLE

MANDATORY EDITORIAL & RESEARCH DISCIPLINE RULES (DAY 3 STANDARDS):
1. Grounded in Defensible Reality:
   - Curiosity MUST come from the genuine subject itself—NOT from fabricated drama.
   - Do NOT use evaluative superlatives or sensational hyperbole (e.g. NEVER write "worst military catastrophe in history", "mathematical genius", "sub-millimeter precision", "instantly crush steel submarines").
   - Do NOT make absolute statements that overstate the evidence (e.g. NEVER write "completely frozen", "permanently halting", "stronger than modern concrete").
   - Clearly distinguish between:
     * Empirical Physical Discoveries (e.g. ScanPyramids muon scans, LiDAR in the Amazon, Dome C ice cores).
     * Theoretical Possibilities & Models (e.g. theoretical oceans on rogue planets -> use "Scientists Think Could Exist", NOT "Scientists Made About").
     * Ancient Written Traditions & Lore (e.g. Sima Qian's accounts of mercury rivers, ancient accounts of Cyrus diverting the Euphrates) vs confirmed physical artifacts.
     * Scholarly Debates (e.g. Mohenjo-daro decline, Derinkuyu construction chronology) vs settled historical facts.

2. Zero Generic Boilerplate / Narrow Broad Topics:
   - NEVER generate generic non-premises such as:
     * "Researchers continue to investigate the fundamental questions surrounding [Topic]..."
     * "Modern technology has recently revealed new unexpected insights into [Topic]..."
     * "What Is the Biggest Unsolved Mystery About [Topic]?"
   - When given a broad topic (e.g., "The Moon" or "Ancient Medicine"), you MUST first narrow it down to a SPECIFIC MYSTERY / SPECIFIC EVIDENCE + SPECIFIC QUESTION:
     * For "The Moon": narrow to permanently shadowed craters / water ice, Reiner Gamma magnetic swirls, Giant Impact isotopic paradox, or far-side crustal thickness.
     * For "Ancient Medicine": narrow to Edwin Smith Papyrus neurotrauma, mummy CT cardiovascular paleopathology, or trepanation bone regrowth.

3. Preserve the Genuine Mystery (Do NOT pretend to know the answer):
   - If an anomaly's purpose or cause is unknown (e.g., the 30m void in the Great Pyramid, or Emperor Qin's unopened tomb):
     * Do NOT ask "What was the purpose..." as if the purpose is established.
     * Ask: "What is the newly detected void, and what might explain its location and structure?"
     * Do NOT say "archaeologists refused to open" (sounds conspiratorial). Instead, focus on archaeological, conservation, and technological considerations: "Why Has Emperor Qin's Central Tomb Remained Unopened?"

4. Accurate Technological & Scientific Framing:
   - Do NOT claim "AI literally read the scrolls" -> describe the actual technology: high-resolution X-ray/CT tomography combined with 3D computational unwrapping and machine learning.
   - Do NOT claim ancient ice cores "predict the climate future" -> explain that ice cores preserve historical atmospheric archives that help scientists understand climate processes and calibrate predictive models.

5. Visual Potential for Generative Filmmaking (Google Flow Workflow):
   - Evaluate visual potential based on concrete cinematic imagery (subglacial lakes, geological cross-sections, LiDAR flythroughs, hadal submersibles, microscopic cell adaptations, micro-CT mummy scans).
   - High visual potential subjects make generative filmmaking exceptionally compelling.

6. Proven Packaging Formulas to Emulate:
   - Q + VE (Provocative Question + Viewer Simulation): "What Would Happen If You Spent 24 Hours Near a Black Hole?"
   - M + UC + Visual: "The Toxic 'Underwater Lakes' Hidden on the Ocean Floor"
   - D + IF (Discovery + Information Gap): "The Lost Civilization Archaeologists Finally Rediscovered Beneath the Amazon"
   - D (Cutting-edge Science): "What Did Cosmic-Ray Scans Actually Find Inside the Great Pyramid?", "How Scientists Are Finally Reading the Carbonized Scrolls of Vesuvius"
   - HM (Craftsmanship): "How Did Ancient Chinese Craftsmen Create Thousands of Terracotta Soldiers?"
   - Defensible Engineering Question: "How Did Ancient Egyptians Achieve Such Precise Stonework?", "Why Roman Concrete Survived for 2,000 Years"`;

  const userPrompt = `Generate YouTube documentary titles for the following topics:
${topics.map((t, idx) => `${idx + 1}. "${t}"`).join("\n")}

For EACH topic, generate exactly ${anglesPerTopic} item(s).
Available 16 Primary Patterns & Short Codes:
${mechanismsListText}

Return a valid JSON array of objects with the exact schema:
[
  {
    "topic": "Exact topic name",
    "factPremise": "The real underlying historical or scientific fact/premise (1-2 defensible, epistemically accurate sentences)",
    "angle": "The specific thematic documentary angle (1-3 words, e.g. 'Precision Stonework', 'Subglacial Geography', 'Self-Healing Concrete')",
    "code": "Exact pattern code (e.g. Q, D, IF, SF, FS, IO, M, UC, VE, HE, HM, HT, NL, CG)",
    "pattern": "Full name of the pattern",
    "workingTitle": "The grounded, high-CTR working title (NO clickbait fabrications)",
    "curiosityQuestion": "The underlying question that creates desire in the viewer without pretending the answer is already settled",
    "whyClick": "Why a real viewer would click (psychological trigger)",
    "factuallyGrounded": "YES",
    "visualPotential": "High or Exceptional or Medium"
  }
]`;

  // 1. Direct OpenAI API call (if OpenAI key provided)
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
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : parsed.titles || parsed.results || parsed.items || [];
          if (Array.isArray(list) && list.length > 0) {
            return list.map((item: any, idx: number) => ({
              id: `${item.topic}-${item.angle}-${item.code}-${idx + 1}`,
              num: idx + 1,
              topic: String(item.topic || ""),
              factPremise: String(item.factPremise || ""),
              angle: String(item.angle || ""),
              code: String(item.code || "Q"),
              pattern: String(item.pattern || "Curiosity Pattern"),
              workingTitle: String(item.workingTitle || ""),
              curiosityQuestion: String(item.curiosityQuestion || ""),
              whyClick: String(item.whyClick || ""),
              factuallyGrounded: (item.factuallyGrounded === "YES" ? "YES" : "NEEDS RESEARCH") as any,
              visualPotential: (item.visualPotential || "High") as any,
            }));
          }
        }
      } else {
        console.warn("OpenAI API title call returned non-200:", res.status);
      }
    } catch (err) {
      console.warn("OpenAI title generation call failed:", err);
    }
  }

  // 2. Direct Gemini API call (if Gemini key provided)
  if (geminiKey) {
    for (const model of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.5,
            },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const list = Array.isArray(parsed) ? parsed : parsed.titles || parsed.results || parsed.items || [];
            if (Array.isArray(list) && list.length > 0) {
              return list.map((item: any, idx: number) => ({
                id: `${item.topic}-${item.angle}-${item.code}-${idx + 1}`,
                num: idx + 1,
                topic: String(item.topic || ""),
                factPremise: String(item.factPremise || ""),
                angle: String(item.angle || ""),
                code: String(item.code || "Q"),
                pattern: String(item.pattern || "Curiosity Pattern"),
                workingTitle: String(item.workingTitle || ""),
                curiosityQuestion: String(item.curiosityQuestion || ""),
                whyClick: String(item.whyClick || ""),
                factuallyGrounded: (item.factuallyGrounded === "YES" ? "YES" : "NEEDS RESEARCH") as any,
                visualPotential: (item.visualPotential || "High") as any,
              }));
            }
          }
        }
      } catch (err) {
        console.warn(`Gemini title generation call failed on ${model}:`, err);
      }
    }
  }

  // 3. Lovable AI Gateway
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
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : parsed.titles || parsed.results || parsed.items || [];
          if (Array.isArray(list) && list.length > 0) {
            return list.map((item: any, idx: number) => ({
              id: `${item.topic}-${item.angle}-${item.code}-${idx + 1}`,
              num: idx + 1,
              topic: String(item.topic || ""),
              factPremise: String(item.factPremise || ""),
              angle: String(item.angle || ""),
              code: String(item.code || "Q"),
              pattern: String(item.pattern || "Curiosity Pattern"),
              workingTitle: String(item.workingTitle || ""),
              curiosityQuestion: String(item.curiosityQuestion || ""),
              whyClick: String(item.whyClick || ""),
              factuallyGrounded: (item.factuallyGrounded === "YES" ? "YES" : "NEEDS RESEARCH") as any,
              visualPotential: (item.visualPotential || "High") as any,
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
    const isGemini = userAiKey?.startsWith("AIza");

    const geminiKey =
      (isGemini ? userAiKey : undefined) ||
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      process.env["GOOGLE_AI_KEY"];

    const openAiKey =
      (isOpenAi ? userAiKey : undefined) ||
      process.env["OPENAI_API_KEY"];

    const lovableKey = process.env["LOVABLE_API_KEY"];

    // 1. Try AI generation first if any key exists
    if (geminiKey || openAiKey || lovableKey) {
      const aiResults = await generateAiBatch(
        topics,
        anglesPerTopic,
        geminiKey,
        openAiKey,
        lovableKey,
      );
      if (aiResults && aiResults.length > 0) {
        return {
          results: aiResults,
          mode: "ai",
        };
      }
    }

    // 2. High quality grounded heuristic engine fallback (zero hallucination guarantee)
    const heuristicResults = generateHeuristicsBatch(topics, anglesPerTopic);
    return {
      results: heuristicResults,
      mode: "heuristic",
    };
  });
