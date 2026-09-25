import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface StoryMapElement {
  num: number;
  storyElement: string;
  yourAnswer: string;
  notes?: string;
  isNeedsResearch?: boolean;
}

export interface First30SecondsPlan {
  visualHook0to5s: {
    timing: "0–5s";
    label: "VISUAL HOOK";
    visualShot: string;
    soundCues: string;
  };
  strangeClaim5to12s: {
    timing: "5–12s";
    label: "STRANGE FACT / EVENT / CLAIM";
    narration: string;
    visualAction: string;
  };
  question12to20s: {
    timing: "12–20s";
    label: "THE QUESTION (INFORMATION GAP)";
    narration: string;
    visualAction: string;
  };
  promise20to30s: {
    timing: "20–30s";
    label: "THE PROMISE (MISSION CONTRACT)";
    narration: string;
    visualAction: string;
  };
}

export interface EscalationStep {
  level: number;
  label: "Level 1: Interesting" | "Level 2: More Interesting" | "Level 3: Surprising" | "Level 4: Significant" | "Level 5: Revelation";
  description: string;
}

export interface OpenLoopItem {
  id: string;
  question: string;
  openedInBeat: string;
  resolvedInBeat: string;
}

export interface VisualStorytellingScene {
  shotNumber: number;
  shotType: string; // e.g. "Macro Close-Up", "Cinematic Tracking", "Slow Reveal"
  narration: string;
  visualAction: string;
  googleFlowPrompt: string;
}

export interface StoryMapDossier {
  id: string;
  workingTitle: string;
  coreQuestion: string;
  premise: string;
  angle: string;
  code?: string;
  pattern?: string;
  targetViewer?: string;
  clickMotivation?: "KNOW" | "SEE" | "UNDERSTAND" | "EXPERIENCE";
  informationGap?: string;
  stakes?: string;
  visualHookPrompt?: string;
  titlePromise?: string;
  elements: StoryMapElement[]; // 12 canonical rows
  first30Seconds: First30SecondsPlan;
  escalationLadder: EscalationStep[];
  openLoops: OpenLoopItem[];
  visualScenes: VisualStorytellingScene[];
  needsResearchItems: string[];
  storyEngine: {
    question: string;
    investigation: string;
    complication: string;
    discovery: string;
    explanation: string;
    payoff: string;
  };
}

// 12 Standard Story Map Elements as defined in Day 5 Study
export const STORY_ELEMENT_NAMES = [
  "Working Title",
  "Core Question",
  "Why Does It Matter?",
  "Cold Open",
  "Big Question",
  "Context",
  "Investigation",
  "Complication",
  "Discovery / Evidence",
  "Explanation",
  "Final Payoff",
  "Closing Thought",
] as const;

// 1. Day 5 Practical Exercise Exemplar (Egyptian Stonework - Official Assignment)
export const DAY5_EXEMPLAR_EGYPTIAN: StoryMapDossier = {
  id: "day5-exemplar-egypt",
  workingTitle: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
  coreQuestion: "How did ancient Egyptian craftsmen shape, hollow, and align ultra-hard igneous rocks like granite and basalt to sub-millimeter tolerances using Bronze Age copper tools and pounding stones without steel or powered machinery?",
  premise: "Ancient Egyptian builders produced and fitted large stone structures using tools and techniques including stone pounders, copper tools, abrasives and sledges; the exact methods used for some precision work remain an area of archaeological study.",
  angle: "Precision Stonework & Material Physics",
  code: "IO",
  pattern: "Impossible Object",
  targetViewer: "People interested in ancient engineering, archaeology, physical crafts, and debunking lost-technology myths.",
  clickMotivation: "KNOW",
  informationGap: "We know colossal megaliths fit together tightly, but the exact abrasive techniques and mechanical tolerances without iron/steel tools remain actively investigated.",
  stakes: "Technological & Historical: Tests whether Bronze Age humans could achieve monumental architectural alignment using natural physics, or if modern assumptions underestimate ancient ingenuity.",
  visualHookPrompt: "Close-up cinematic macro shot of a massive diorite stone pounder repeatedly impacting crystalline rose granite, sending dust clouds over a colossal megalithic joint.",
  titlePromise: "The video will break down the physical experiments, copper-abrasive slurries, and quarry evidence showing how ancient masons shaped hard stone.",
  elements: [
    {
      num: 1,
      storyElement: "Working Title",
      yourAnswer: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
      notes: "Clear, grounded question title without sensationalist or manufactured claims.",
    },
    {
      num: 2,
      storyElement: "Core Question",
      yourAnswer: "How did ancient craftsmen shape, hollow, and joint crystalline igneous rocks (rose granite, diorite, basalt) using stone pounders, copper blades, and mineral abrasives without steel or rotary power machinery?",
      notes: "Focuses the investigation on physical material behavior rather than speculative mystery.",
    },
    {
      num: 3,
      storyElement: "Why Does It Matter?",
      yourAnswer: "Hard igneous rocks like Aswan granite have a Mohs hardness of 6 to 7—harder than the copper and bronze tools available in the Bronze Age. Explaining how ancient builders overcame this material barrier proves the true height of human empirical engineering, directly dispelling pseudoscientific 'lost technology' claims.",
      notes: "Establishes technological and historical stakes.",
    },
    {
      num: 4,
      storyElement: "Cold Open",
      yourAnswer: "Visual: Extreme macro shot of a 12-pound spherical black diorite pounder striking crystalline pink granite in slow motion; fine quartz dust explodes into raking sunlight across a seam so tight no light passes through.\nNarration: 'This stone block was shaped more than 4,500 years ago. Its surface is remarkably flat, and its seams are so tight you cannot slide a razor blade between them.'",
      notes: "Beat 1: Kinetic visual hook + strange fact without revealing the answer.",
    },
    {
      num: 5,
      storyElement: "Big Question",
      yourAnswer: "Visual: Pull back from the microscopic joint to reveal the colossal King's Chamber granite sarcophagus and unfinished obelisk in Aswan.\nNarration: 'Yet the people who carved it possessed no iron, no steel, and no diamond saws. So how did ancient Egyptian craftsmen achieve this level of precision with the tools available to them? To answer that, we have to look past the finished monuments and into the toolmarks left behind in the ancient quarries.'",
      notes: "Beat 2: Establishes the mission and promise for the entire video.",
    },
    {
      num: 6,
      storyElement: "Context",
      yourAnswer: "During the Old and Middle Kingdoms (c. 2600–1800 BCE), Egyptian state projects quarried millions of tons of limestone and over 45,000 tons of hard igneous stone. Their metallurgy was limited to arsenical copper and bronze—alloys far softer than quartz crystals in granite. The dilemma is not whether they built it—the physical artifacts stand before us—but the exact physical mechanisms of material removal and precision measurement.",
      notes: "Beat 3: Who, When, Where, Why without reading like a dry textbook.",
    },
    {
      num: 7,
      storyElement: "Investigation",
      yourAnswer: "Experimental archaeologists, notably Denys Stocks and Mark Lehner, replicated ancient stonework techniques at Giza and Aswan. They systematically tested three distinct craft workflows: (1) heavy percussive fracturing using spherical dolerite pounders dropped from controlled heights, (2) tubular and flat saw cutting using copper blades fed with wet quartz sand abrasive slurry, and (3) precision surface dressing using flat wooden reference planes coated with red ochre pigment.",
      notes: "Beat 4: Moving into the physical workshop and experimental test sites.",
    },
    {
      num: 8,
      storyElement: "Complication",
      yourAnswer: "The Abrasive Paradox: Quartz sand has a Mohs hardness of 7—the exact same hardness as the quartz grains within the granite matrix. If the abrasive isn't harder than the stone, how could they saw massive sarcophagi without destroying tons of precious copper blades? Moreover, how were circular core drills stabilized without modern mechanical drill presses slipping across the convex rock face?",
      notes: "Beat 5: Introduces genuine technical tension and difficulty instead of a flat sequence of facts.",
    },
    {
      num: 9,
      storyElement: "Discovery / Evidence",
      yourAnswer: "Scanning electron microscopy (SEM) of Petrie's famous drill core No. 7 and microscopic striations in unfinished quarry trenches revealed that the cutting was not done by copper teeth, but by quartz sand granules rolling and fracturing under immense downward pressure. The copper blade acted as a sacrificial carrier; the sharp angular quartz facets sheared microscopic mineral grains away. Furthermore, limestone guide blocks pinned to the rock face stabilized tubular drills.",
      notes: "Beat 6 (Part 1): Physical evidence and measurements that resolve the complication.",
    },
    {
      num: 10,
      storyElement: "Explanation",
      yourAnswer: "The precision was achieved not by high speed, but through continuous mechanical attrition and optical calibration: (1) dolerite pounding crushed crystalline bonds under impact, removing bulk rock; (2) copper blades and abrasive sand slurry sliced channels at roughly 12 cm³ per hour; and (3) surface flatness was measured using the 'three-rod method' with taut strings and red ochre rubbing blocks, iteratively grinding high spots down until total planar contact was achieved.",
      notes: "Beat 6 (Part 2): The clear scientific and mechanical explanation.",
    },
    {
      num: 11,
      storyElement: "Final Payoff",
      yourAnswer: "The tight joints were not created by laser-like cutting, but by grinding matching stone faces against each other in situ with abrasive sand until they seated perfectly together. What appeared to be impossible engineering is revealed as an extraordinary mastery of physics, mineral friction, and organized craft labor repeated across generations.",
      notes: "Beat 7 (Part 1): Fully answers the central question and gives closure.",
    },
    {
      num: 12,
      storyElement: "Closing Thought",
      yourAnswer: "The true achievement of ancient Egyptian stonemasons is not that they possessed fantastical lost machinery, but that human patience, empirical observation of stone behavior, and communal dedication could transform raw geology into timeless precision using nothing more than rock, sand, and water.",
      notes: "Beat 7 (Part 2): Philosophical resonance that gives lasting depth.",
    },
  ],
  first30Seconds: {
    visualHook0to5s: {
      timing: "0–5s",
      label: "VISUAL HOOK",
      visualShot: "Extreme macro 4K close-up of a dark spherical dolerite pounder striking crystalline rose granite; quartz dust explodes under low-angle golden light across a razor-thin megalithic joint.",
      soundCues: "Resonant, heavy stone-on-stone impact followed by the sharp crunch of shattered quartz grains and silence.",
    },
    strangeClaim5to12s: {
      timing: "5–12s",
      label: "STRANGE FACT / EVENT / CLAIM",
      narration: "This block was shaped more than 4,500 years ago. Its surface is remarkably flat, and its seams are so tight you cannot slide a razor blade between them.",
      visualAction: "A researcher gently attempts to slide a 0.05mm steel feeler gauge into the joint between two colossal casing stones; it stops dead with zero penetration.",
    },
    question12to20s: {
      timing: "12–20s",
      label: "THE QUESTION (INFORMATION GAP)",
      narration: "Yet the people who carved it possessed no iron, no steel, and no diamond-tipped saws. So how did ancient craftsmen achieve this level of precision with the tools available to them?",
      visualAction: "Camera pulls back through the dim King's Chamber in the Great Pyramid, showcasing the colossal, perfectly squared granite roof beams overhead.",
    },
    promise20to30s: {
      timing: "20–30s",
      label: "THE PROMISE (MISSION CONTRACT)",
      narration: "To answer that, we have to look past the finished monuments and into the toolmarks, abrasive slurries, and quarry experiments of the people who actually built it.",
      visualAction: "Rapid cinematic montage: an ancient chisel groove under forensic magnifying lamp, a modern experimental archaeologist feeding sand to a copper blade, and a drone sweep over the Aswan unfinished obelisk trench.",
    },
  },
  escalationLadder: [
    {
      level: 1,
      label: "Level 1: Interesting",
      description: "Megalithic stonework in Old Kingdom Egypt exhibits tight joints and mirror-like surfaces that seem to defy Bronze Age tooling.",
    },
    {
      level: 2,
      label: "Level 2: More Interesting",
      description: "Metallurgical records confirm Egyptians had no hardened steel or iron; their copper chisels are softer than the quartz crystals inside the granite.",
    },
    {
      level: 3,
      label: "Level 3: Surprising",
      description: "Archaeological tool experiments prove that copper blades don't cut granite directly—the copper acts as a carrier for quartz sand slurry that grinds the stone through friction.",
    },
    {
      level: 4,
      label: "Level 4: Significant",
      description: "Microscopic analysis of drill cores and saw cuts reveals spiral striations caused by rolling abrasive grains under heavy downward weight, not diamond teeth.",
    },
    {
      level: 5,
      label: "Level 5: Revelation",
      description: "The precision was achieved by pairing repetitive dolerite impact fracturing with optical 'three-rod' triangulation and in-situ abrasive grinding—showing that human organization and material science achieved what modern culture mistakenly attributes to lost technology.",
    },
  ],
  openLoops: [
    {
      id: "loop-1",
      question: "How can soft copper tools cut into igneous rock that is significantly harder than copper itself?",
      openedInBeat: "Beat 2 (Big Question)",
      resolvedInBeat: "Beat 6 (Discovery / Explanation)",
    },
    {
      id: "loop-2",
      question: "Why do drill cores have fine spiral striations that look like modern machine feed rates?",
      openedInBeat: "Beat 5 (Complication)",
      resolvedInBeat: "Beat 6 (Discovery / Evidence)",
    },
    {
      id: "loop-3",
      question: "How were blocks fitted together with zero tolerance on irregular surfaces without modern CAD?",
      openedInBeat: "Beat 4 (Investigation)",
      resolvedInBeat: "Beat 7 (Final Payoff)",
    },
  ],
  visualScenes: [
    {
      shotNumber: 1,
      shotType: "Extreme Macro Close-Up (Shallow DOF)",
      narration: "This stone block was shaped more than 4,500 years ago.",
      visualAction: "Camera glides across the crystalline rose granite texture, catching microscopic mica flecks glinting under warm sunlight.",
      googleFlowPrompt: "Photorealistic 8K macro shot of ancient Egyptian rose granite surface, crystalline texture, quartz and pink feldspar minerals, warm low-angle cinematic lighting, shallow depth of field, slow smooth camera push.",
    },
    {
      shotNumber: 2,
      shotType: "Medium Cinematic Shot",
      narration: "A researcher slides a feeler gauge across the joint. Zero gap.",
      visualAction: "Hands of an archaeologist carefully testing the seam between two limestone casing blocks with historical measurement tools.",
      googleFlowPrompt: "Archaeologist in dusty linen shirt inspecting ancient stone seam with precision steel ruler, ancient temple background in soft focus, documentary style, authentic historical expedition lighting.",
    },
    {
      shotNumber: 3,
      shotType: "Overhead Quarry Drone Shot",
      narration: "To understand how they did it, we have to travel 500 miles south to the granite quarries of Aswan.",
      visualAction: "High-angle drone sweep over the 1,000-ton Unfinished Obelisk lying in its bedrock trench.",
      googleFlowPrompt: "Epic cinematic aerial drone shot descending into ancient Aswan granite quarry, dramatic desert sunlight, revealing deep carved trench and colossal unfinished obelisk embedded in living bedrock.",
    },
    {
      shotNumber: 4,
      shotType: "High-Speed Macro Strike",
      narration: "Workers dropped spherical dolerite pounders thousands of times per shift.",
      visualAction: "Slow-motion 240fps capture of a 10-pound black dolerite ball smashing into pink granite, micro-fracturing the rock face into powder.",
      googleFlowPrompt: "Ultra-slow-motion high-speed 240fps capture of a heavy black dolerite stone hammer hitting pink granite stone, dust and mineral chips exploding on impact, volumetric dust rays.",
    },
    {
      shotNumber: 5,
      shotType: "Forensic Laboratory Close-Up",
      narration: "Under the microscope, the mystery of the drill cores began to reveal its true mechanism.",
      visualAction: "Digital microscope screen displaying striations and crushed quartz grains embedded inside an ancient drill groove.",
      googleFlowPrompt: "Scientific documentary shot of a digital microscope screen displaying high-resolution scanning electron microscope imagery of ancient stone drill striations, forensic laboratory setting, blue and amber ambient light.",
    },
  ],
  needsResearchItems: [],
  storyEngine: {
    question: "What tools and mechanical techniques allowed Bronze Age Egyptian craftsmen to shape and fit ultra-hard granite without steel?",
    investigation: "Experimental archaeologists test dolerite pounding balls, copper saw blades with abrasive quartz slurry, and red ochre scraping blocks.",
    complication: "Copper is much softer than quartz, and sand wears away tools rapidly; how could saws cut sarcophagi without vanishing into copper shavings?",
    discovery: "Microscopic analysis proves copper was merely a sacrificial holder; quartz sand grains roll under pressure, micro-chipping granite at the crystalline boundary.",
    explanation: "A complete three-stage craft system combining percussive impact extraction, mechanical abrasive friction, and optical 'three-rod' leveling.",
    payoff: "The blocks were matched by grinding surfaces against each other in situ, proving that empirical discipline and organized human labor built the wonders.",
  },
};

// 2. ScanPyramids Exemplar (Directly referenced in Day 5 study)
export const DAY5_EXEMPLAR_SCANPYRAMIDS: StoryMapDossier = {
  id: "day5-exemplar-scanpyramids",
  workingTitle: "What Did Cosmic Rays Detect Inside the Great Pyramid?",
  coreQuestion: "How did a team of international physicists discover a 30-meter hidden void inside the Great Pyramid of Giza without drilling or moving a single stone?",
  premise: "In 2017, the ScanPyramids project detected an unexpected 30-meter void above the Grand Gallery of the Great Pyramid using non-invasive cosmic ray muon radiography.",
  angle: "Particle Physics & Ancient Mystery",
  code: "CP",
  pattern: "Curiosity Paradox",
  targetViewer: "Documentary lovers interested in cutting-edge science, archaeology, and secret spaces in ancient monuments.",
  clickMotivation: "KNOW",
  informationGap: "For 4,500 years we believed the interior architecture of the Great Pyramid was fully mapped, but cosmic ray tomography revealed an enormous phantom chamber.",
  stakes: "Scientific & Archaeological: Validates non-destructive particle physics as the future of archaeology, while challenging our understanding of pyramid engineering.",
  visualHookPrompt: "Dark interior of the Grand Gallery with glowing blue cosmic ray trajectories penetrating through thousands of tons of ancient stone into nuclear emulsion plates.",
  titlePromise: "The video will explain how subatomic muons from outer space mapped a hidden void inside the world's most famous monument.",
  elements: [
    {
      num: 1,
      storyElement: "Working Title",
      yourAnswer: "What Did Cosmic Rays Detect Inside the Great Pyramid?",
      notes: "Direct, investigative, and intriguing.",
    },
    {
      num: 2,
      storyElement: "Core Question",
      yourAnswer: "How did astrophysicists discover an unexpected 30-meter void deep within the Great Pyramid using subatomic particles from deep space, and what is its true structural purpose?",
    },
    {
      num: 3,
      storyElement: "Why Does It Matter?",
      yourAnswer: "The Great Pyramid is the most studied ancient structure on Earth. Finding an unexplored space the size of a passenger airliner proves that even iconic historical monuments still hold secrets that only 21st-century particle physics can reveal.",
    },
    {
      num: 4,
      storyElement: "Cold Open",
      yourAnswer: "Visual: Pitch-black corridor inside the Great Pyramid. Suddenly, ethereal blue particle tracks illuminate the stone walls, tracing downward from the night sky through the ceiling blocks.\nNarration: 'For thousands of years, nobody knew what was hidden inside the Great Pyramid. Then scientists found something they weren't expecting. They weren't using drills. They weren't removing stones. They were looking for something invisible.'",
    },
    {
      num: 5,
      storyElement: "Big Question",
      yourAnswer: "Visual: 3D holographic wireframe of the pyramid showing the King's Chamber, Queen's Chamber, and a giant glowing void floating directly above the Grand Gallery.\nNarration: 'Hidden above one of the world's most visited ancient corridors lies a space at least 30 meters long that nobody has entered for 45 centuries. So what did the detectors actually see—and why is it there?'",
    },
    {
      num: 6,
      storyElement: "Context",
      yourAnswer: "Launched in 2015 by Cairo University and the HIP Institute, the ScanPyramids mission sought to scan Old Kingdom pyramids using thermal infrared, photogrammetry, and muon radiography. Cosmic rays constantly collide with Earth's upper atmosphere, producing muons that rain down at near light speed. Dense rock absorbs muons, while empty voids let them pass through freely.",
    },
    {
      num: 7,
      storyElement: "Investigation",
      yourAnswer: "Three independent scientific teams placed different muon detector technologies around the pyramid: Nagoya University used nuclear emulsion plates inside the Queen's Chamber; KEK Japan used electronic scintillator hodoscopes; and CEA France used micro-pattern gaseous detectors (Micromegas) outside the pyramid.",
    },
    {
      num: 8,
      storyElement: "Complication",
      yourAnswer: "False Positives & Density Variations: The pyramid is not solid stone—it is filled with packing mortar, irregular limestone rubble, and varying internal densities. How could researchers be certain the excess muon flux wasn't just a patch of low-density rubble or an artifact of sensor drift?",
    },
    {
      num: 9,
      storyElement: "Discovery / Evidence",
      yourAnswer: "Statistical Convergence: All three independent detector systems recorded a statistically significant excess of muons (over 5-sigma confidence) coming from the exact same spatial angle above the Grand Gallery. In 2023, high-resolution endoscope footage through the Chevron zone confirmed a 9-meter corridor behind the north face, validating the muon data beyond doubt.",
    },
    {
      num: 10,
      storyElement: "Explanation",
      yourAnswer: "Cosmic ray tomography works like a giant natural X-ray: muons pass through empty cavities with less attenuation than solid stone. By calculating the deficit in absorbed particles across triangular lines of sight, physicists reconstructed the geometry of the 'Big Void'—a space at least 30 meters long with a cross-section similar to the Grand Gallery.",
    },
    {
      num: 11,
      storyElement: "Final Payoff",
      yourAnswer: "The discovery proves the void is an intentional architectural feature, likely a relieving chamber or construction ramp cavity designed to alleviate crushing vertical weight above the Grand Gallery's corbelled ceiling.",
    },
    {
      num: 12,
      storyElement: "Closing Thought",
      yourAnswer: "We may now know more about the internal layout of the Great Pyramid than anyone who saw it thousands of years ago. But the discovery also reminds us that the greatest monuments on Earth still keep secrets in plain sight, waiting for new eyes to see them.",
    },
  ],
  first30Seconds: {
    visualHook0to5s: {
      timing: "0–5s",
      label: "VISUAL HOOK",
      visualShot: "Cinematic shot of the Giza plateau at twilight; a stylized animation of high-energy cosmic rays streaking from starry space down into the apex of the Great Pyramid.",
      soundCues: "Deep sub-bass drone accompanied by high-frequency Geiger-counter audio clicks that synchronize with light pulses.",
    },
    strangeClaim5to12s: {
      timing: "5–12s",
      label: "STRANGE FACT / EVENT / CLAIM",
      narration: "Hidden inside one of the world's most studied monuments, scientists discovered an empty space the size of a passenger airplane that nobody knew existed.",
      visualAction: "A 3D laser scan of the Great Pyramid goes translucent, highlighting a colossal 30-meter void suspended directly over the Grand Gallery.",
    },
    question12to20s: {
      timing: "12–20s",
      label: "THE QUESTION (INFORMATION GAP)",
      narration: "They didn't use sledgehammers, drills, or explosives. They detected it using particles born in deep space. But what is this space—and why did the builders seal it?",
      visualAction: "Physicists in white cleanroom suits examining silver nuclear emulsion film in a dimly lit underground chamber.",
    },
    promise20to30s: {
      timing: "20–30s",
      label: "THE PROMISE (MISSION CONTRACT)",
      narration: "This is the story of how particle physicists scanned 6 million tons of solid rock to solve a 4,500-year-old architectural puzzle.",
      visualAction: "Cinematic push down the ascending passage of the Great Pyramid transitioning into a high-tech computer simulation.",
    },
  },
  escalationLadder: [
    {
      level: 1,
      label: "Level 1: Interesting",
      description: "Infrared thermal cameras detect an unusual heat signature near the base of the Great Pyramid at sunrise.",
    },
    {
      level: 2,
      label: "Level 2: More Interesting",
      description: "Physicists propose using cosmic ray muons—natural subatomic particles—to see through solid rock without digging.",
    },
    {
      level: 3,
      label: "Level 3: Surprising",
      description: "Detectors placed inside the Queen's Chamber pick up an anomalous excess of muons, indicating an unexpected empty space overhead.",
    },
    {
      level: 4,
      label: "Level 4: Significant",
      description: "Two independent international teams confirm the exact same signal with different detector technologies, verifying a 30-meter void.",
    },
    {
      level: 5,
      label: "Level 5: Revelation",
      description: "Fiber-optic endoscopic cameras deployed through stone joints physically photograph the corridor, confirming that modern physics successfully peered through 4,500 years of stone.",
    },
  ],
  openLoops: [
    {
      id: "loop-1",
      question: "Could the muon reading just be porous rock or loose sand rather than an empty chamber?",
      openedInBeat: "Beat 5 (Complication)",
      resolvedInBeat: "Beat 6 (Discovery / Evidence)",
    },
    {
      id: "loop-2",
      question: "What purpose did this 30-meter chamber serve in the original pyramid construction?",
      openedInBeat: "Beat 2 (Big Question)",
      resolvedInBeat: "Beat 7 (Final Payoff)",
    },
  ],
  visualScenes: [
    {
      shotNumber: 1,
      shotType: "Cinematic Twilight Aerial",
      narration: "For thousands of years, nobody knew what was hidden inside the Great Pyramid.",
      visualAction: "Slow cinematic aerial dolly shot over the pyramids of Giza as the desert sun sets and the Milky Way emerges above.",
      googleFlowPrompt: "Breathtaking cinematic aerial drone shot of the Great Pyramid of Giza at dusk, ancient stone texture, desert horizon, starry night sky beginning to glow with cosmic nebulae.",
    },
    {
      shotNumber: 2,
      shotType: "Interior Tracking Shot",
      narration: "Then scientists found something they weren't expecting.",
      visualAction: "Camera moves low through the narrow, echoing Grand Gallery, flashlight beam highlighting the 8-meter corbelled vault.",
      googleFlowPrompt: "Atmospheric tracking shot inside the Grand Gallery of the Great Pyramid, warm flashlight beam illuminating ancient corbelled limestone ceiling, dust motes in light beam.",
    },
    {
      shotNumber: 3,
      shotType: "Scientific Visualization",
      narration: "They were looking for something invisible: subatomic particles called muons.",
      visualAction: "CGI visualization of blue cosmic ray tracks penetrating the pyramid stone and impacting a glowing rectangular detector.",
      googleFlowPrompt: "Futuristic scientific CGI visualization of blue glowing subatomic particle tracks penetrating 3D architectural cross-section of an ancient pyramid, data readout, holographic style.",
    },
  ],
  needsResearchItems: [],
  storyEngine: {
    question: "What is hidden inside the Great Pyramid, and how can we detect it without damaging the monument?",
    investigation: "ScanPyramids deploys muon emulsion plates and gas hodoscopes to track cosmic rays passing through the stone.",
    complication: "Pyramids have irregular mortar and voids; how do physicists prove it is a real chamber and not random density fluctuations?",
    discovery: "Three distinct detector technologies simultaneously confirm a 30-meter void with greater than 5-sigma statistical certainty.",
    explanation: "Muons pass through air voids without being absorbed, creating a precise density shadow map of the interior.",
    payoff: "The void served as a vital structural relief mechanism to protect the Grand Gallery, demonstrating visionary ancient engineering.",
  },
};

// 3. Chilean UAP Pilot Investigation (Referenced in Day 5 study)
export const DAY5_EXEMPLAR_UAP: StoryMapDossier = {
  id: "day5-exemplar-uap",
  workingTitle: "Why Did the Chilean Air Force Declassify Its Pilot UFO Files?",
  coreQuestion: "What did Chilean military radar, infrared cameras, and naval helicopter pilots record off the coast of Santiago that official government scientists investigated for two years without identifying?",
  premise: "In November 2014, a Chilean Navy helicopter crew recorded a nine-minute infrared video of an unidentified aerial phenomenon releasing a thermal plume that ground radar and air traffic control could not detect.",
  angle: "Official Military Investigation & Declassified Evidence",
  code: "OV",
  pattern: "Official vs Reality",
  targetViewer: "Viewers interested in credible aerospace anomalies, aviation safety, military sensor data, and serious government research.",
  clickMotivation: "KNOW",
  informationGap: "UAP videos are often blurry cellphone clips; here, military-grade infrared sensors and trained pilots captured an unexplained event that government scientists verified as authentic.",
  stakes: "Aerospace Safety & National Defense: Explores whether unexplainable sensor anomalies represent novel atmospheric physics, black-budget aerospace craft, or sensor artifacts.",
  visualHookPrompt: "Cockpit HUD view through a forward-looking infrared (FLIR) pod tracking a hot black diamond object ejecting a massive thermal cloud over the Pacific ocean.",
  titlePromise: "The video examines the sensor data, radar logs, and official conclusions of the Chilean CEFAA committee.",
  elements: [
    {
      num: 1,
      storyElement: "Working Title",
      yourAnswer: "Why Did the Chilean Air Force Declassify Its Pilot UFO Files?",
      notes: "Specific, credible, grounded in official government committee work.",
    },
    {
      num: 2,
      storyElement: "Core Question",
      yourAnswer: "What did Chilean naval aviators and a high-definition forward-looking infrared camera actually track for nine minutes over the Chilean coast that government scientists were unable to explain?",
    },
    {
      num: 3,
      storyElement: "Why Does It Matter?",
      yourAnswer: "Unlike anonymous internet claims, this case originated from trained military pilots, calibrated multi-sensor pods, and was investigated by CEFAA—a civilian/military government committee staffed by meteorologists, radar engineers, and astronomers.",
    },
    {
      num: 4,
      storyElement: "Cold Open",
      yourAnswer: "Visual: Black-and-white military FLIR screen over open ocean. A dark object maneuvers smoothly at 4,000 feet, then suddenly expels an enormous plume of hot gas or liquid that trails for miles.\nNarration: 'On November 11, 2014, a Chilean Navy helicopter crew was on routine patrol when their infrared camera locked onto something that shouldn't have been there.'",
    },
    {
      num: 5,
      storyElement: "Big Question",
      yourAnswer: "Visual: Flight radar map of central Chile showing the helicopter's track while nearby civilian airports show zero aircraft in the area.\nNarration: 'Air traffic control had no radar return. The pilots received no transponder reply. For two years, a government committee examined the footage frame by frame. So what did the data actually reveal?'",
    },
    {
      num: 6,
      storyElement: "Context",
      yourAnswer: "Chile has long been at the forefront of transparent aerial phenomena research through CEFAA (Committee for the Study of Anomalous Aerial Phenomena), embedded within Chile's Directorate General of Civil Aeronautics (DGAC). Its mandate is aviation safety: analyzing unexplained encounters reported by commercial and military pilots.",
    },
    {
      num: 7,
      storyElement: "Investigation",
      yourAnswer: "The helicopter was equipped with a state-of-the-art Wescam MX-15 multi-spectral sensor. For nine minutes, the sensor operator tracked the target across both visible and infrared spectrums, capturing two distinct ejections of material. CEFAA brought in nuclear physicists, meteorologists, and photographic analysts to cross-examine radar recordings and satellite data.",
    },
    {
      num: 8,
      storyElement: "Complication",
      yourAnswer: "The Contradiction: If it was a commercial aircraft discharging cabin waste or fuel, why did two independent ground radar stations fail to detect it, and why did the target appear as a distinct thermal object with no aerodynamic surfaces in the infrared band?",
    },
    {
      num: 9,
      storyElement: "Discovery / Evidence",
      yourAnswer: "Astronomers and independent analysts eventually tracked international commercial flights that departed Santiago around the same window. The line-of-sight angle aligned closely with an Iberia flight climbing out of Santiago toward Europe, whose transponder signal was shielded from local ground radar by coastal mountains, while atmospheric conditions made its contrail appear dense and warm in forward infrared.",
    },
    {
      num: 10,
      storyElement: "Explanation",
      yourAnswer: "The apparent anomaly was caused by optical parallax and forward-scattering infrared signatures: the jet was nearly 40 miles further away than the pilots estimated, creating the illusion that it was hovering at the helicopter's altitude. The 'ejection' was twin aerodynamic contrails merging in humid coastal air.",
    },
    {
      num: 11,
      storyElement: "Final Payoff",
      yourAnswer: "The resolution demonstrates the immense value of rigorous, transparent investigation: rather than dismissing the pilots or hyping an alien spacecraft, methodical cross-referencing of satellite telemetry and flight trajectories explained a seemingly baffling military encounter.",
    },
    {
      num: 12,
      storyElement: "Closing Thought",
      yourAnswer: "The real lesson of the Chilean investigation is not about extraterrestrials—it is about human perception and the discipline of science. When governments take pilot reports seriously and publish the evidence openly, mystery gives way to genuine understanding.",
    },
  ],
  first30Seconds: {
    visualHook0to5s: {
      timing: "0–5s",
      label: "VISUAL HOOK",
      visualShot: "Authentic cockpit sensor interface with crosshairs locked onto a dark silhouette against ocean clouds; the object suddenly discharges a massive thermal plume.",
      soundCues: "Static radio chatter, cockpit hum, and high-frequency sensor lock tone.",
    },
    strangeClaim5to12s: {
      timing: "5–12s",
      label: "STRANGE FACT / EVENT / CLAIM",
      narration: "A military helicopter crew tracked an unidentified object off the coast of Chile for nine continuous minutes—while two ground radar stations showed nothing in the sky.",
      visualAction: "Split screen: helicopter FLIR display showing the hot craft next to an air traffic controller's radar screen showing empty airspace.",
    },
    question12to20s: {
      timing: "12–20s",
      label: "THE QUESTION (INFORMATION GAP)",
      narration: "How could a high-definition thermal camera record an object expelling an unknown substance into the atmosphere without any radar signature?",
      visualAction: "Thermal zoom into the plume dispersing across the Pacific ocean horizon.",
    },
    promise20to30s: {
      timing: "20–30s",
      label: "THE PROMISE (MISSION CONTRACT)",
      narration: "To solve this case, a team of official scientists spent two years analyzing the flight data, satellite telemetry, and physics of the encounter.",
      visualAction: "Declassified government files stamped CEFAA opening on a conference table alongside radar playback software.",
    },
  },
  escalationLadder: [
    {
      level: 1,
      label: "Level 1: Interesting",
      description: "A naval patrol helicopter spots an unusual aerial target in daylight and switches on its thermal tracking system.",
    },
    {
      level: 2,
      label: "Level 2: More Interesting",
      description: "The object releases an enormous heat trail, but when pilots contact air traffic control, radar operators confirm no aircraft is logged.",
    },
    {
      level: 3,
      label: "Level 3: Surprising",
      description: "Chile's official government research committee convenes military officers and civilian astrophysicists to review raw sensor recordings.",
    },
    {
      level: 4,
      label: "Level 4: Significant",
      description: "Independent flight telemetry recreates the exact line of sight, revealing a distant commercial airliner obscured by mountain topography.",
    },
    {
      level: 5,
      label: "Level 5: Revelation",
      description: "Atmospheric optical parallax and contrail condensation explain the military-grade illusion, providing a textbook masterclass in aviation forensics.",
    },
  ],
  openLoops: [
    {
      id: "loop-1",
      question: "Why did two primary military radar installations fail to detect the object if it was so clearly visible on FLIR?",
      openedInBeat: "Beat 2 (Big Question)",
      resolvedInBeat: "Beat 6 (Discovery / Evidence)",
    },
    {
      id: "loop-2",
      question: "What was the mysterious thermal plume discharged into the ocean sky?",
      openedInBeat: "Beat 1 (Cold Open)",
      resolvedInBeat: "Beat 6 (Explanation)",
    },
  ],
  visualScenes: [
    {
      shotNumber: 1,
      shotType: "Cockpit Pilot Point of View",
      narration: "On November 11, 2014, a Chilean Navy helicopter was flying a routine coastal patrol.",
      visualAction: "Over-the-shoulder view of twin naval pilots in green flight suits gazing through windshield at the coastal fog of Valparaíso.",
      googleFlowPrompt: "Cockpit interior view of naval helicopter pilots over Pacific coastal cloud bank, sunlight glinting off instrument panel, authentic documentary style.",
    },
    {
      shotNumber: 2,
      shotType: "FLIR Sensor Reticle",
      narration: "Their forward-looking infrared pod locked onto something unusual.",
      visualAction: "Authentic monochrome FLIR display targeting a dark glowing diamond object in white-hot mode.",
      googleFlowPrompt: "High-definition monochrome forward-looking infrared camera screen view, crosshairs tracking a hot aerodynamic signature over hazy ocean, military telemetry overlay.",
    },
  ],
  needsResearchItems: [],
  storyEngine: {
    question: "What did a Chilean Navy helicopter record releasing a thermal plume over the ocean?",
    investigation: "CEFAA committee reviews Wescam MX-15 infrared footage, pilot audio, and civilian air traffic radar logs.",
    complication: "Ground radar showed no aircraft in the sector, and pilots were certain the object was close and silent.",
    discovery: "Deep telemetry reveals a scheduled commercial airliner 40 miles behind the horizon along the exact line of sight.",
    explanation: "Optical parallax made a high-altitude contrail look like a low-altitude craft ejecting unknown matter.",
    payoff: "A victory for transparent scientific inquiry over sensationalism.",
  },
};

export const ALL_DAY5_EXEMPLARS: StoryMapDossier[] = [
  DAY5_EXEMPLAR_EGYPTIAN,
  DAY5_EXEMPLAR_SCANPYRAMIDS,
  DAY5_EXEMPLAR_UAP,
];

// Heuristic Story Map Architect for arbitrary inputs when AI key is unavailable
export function generateHeuristicStoryMap(input: {
  workingTitle: string;
  premise?: string | undefined;
  angle?: string | undefined;
  targetViewer?: string | undefined;
  clickMotivation?: string | undefined;
  informationGap?: string | undefined;
  stakes?: string | undefined;
  visualHookPrompt?: string | undefined;
  titlePromise?: string | undefined;
  aiApiKey?: string | undefined;
}): StoryMapDossier {
  const title = input.workingTitle.trim() || "Investigating the Unexplained";
  const premise = input.premise?.trim() || `A real-world investigation examining the evidence, history, and scientific mechanisms behind ${title}.`;
  const angle = input.angle?.trim() || "Empirical Investigation & Evidence";
  const targetViewer = input.targetViewer?.trim() || "Inquisitive documentary viewers who appreciate evidence-backed storytelling and deep investigations.";
  const clickMotivation = (input.clickMotivation?.trim().toUpperCase() as any) || "KNOW";
  const informationGap = input.informationGap?.trim() || `Viewers know the basic premise of ${title}, but do not know the hidden complications, competing theories, and final scientific resolution.`;
  const stakes = input.stakes?.trim() || "Historical & Scientific: Challenges conventional assumptions and reveals how verifiable evidence reshapes our understanding.";
  const visualHookPrompt = input.visualHookPrompt?.trim() || `Cinematic macro shot of the central subject of ${title}, bathed in dramatic raking light, creating an instant visual question.`;
  const titlePromise = input.titlePromise?.trim() || `The documentary promises to unpack the verified evidence, explore conflicting accounts, and deliver a grounded answer to ${title}.`;

  const coreQuestion = title.endsWith("?") ? title : `What is the true story and verified explanation behind ${title}?`;

  const coldOpenAnswer = `Visual: ${visualHookPrompt}\nNarration: 'For years, conventional wisdom told one story about this subject. But when investigators looked closer, they discovered something that didn't fit the standard explanation.'`;
  const bigQuestionAnswer = `Visual: Camera tracks from the initial artifact/event to the wider landscape or laboratory where researchers work.\nNarration: '${coreQuestion} To find out, we have to look past the surface claims and follow the paper trail, field experiments, and physical evidence.'`;
  const contextAnswer = `Context establishes the historical, cultural, or scientific background without reading like an encyclopedia. We establish the time period, key figures involved, and why this question continues to captivate researchers today.`;
  const investigationAnswer = `The search begins: field expeditions, laboratory tests, archaeological digs, and archival investigations. We showcase the actual researchers and tools employed to gather primary evidence.`;
  const complicationAnswer = `The Complication: Just as researchers expect a straightforward answer, conflicting data emerges. An ancient document contradicts archaeological findings, or laboratory test results show an unexpected anomaly.`;
  const discoveryAnswer = `The Breakthrough: New measurement techniques, newly uncovered archives, or re-examined forensic samples reveal a critical clue that shifts the entire investigation.`;
  const explanationAnswer = `The Mechanism: The scientific or historical explanation is systematically broken down. We explain how natural physical laws, human craftsmanship, or recorded events explain what previously seemed impossible.`;
  const payoffAnswer = `The Resolution: The central question is directly answered with clarity and nuance. The viewer receives a satisfying payoff earned through the multi-stage investigation.`;
  const closingThoughtAnswer = `The Closing Thought: A lingering philosophical reflection on what this discovery teaches us about human history, science, and the value of rigorous curiosity.`;

  const elements: StoryMapElement[] = [
    { num: 1, storyElement: "Working Title", yourAnswer: title },
    { num: 2, storyElement: "Core Question", yourAnswer: coreQuestion },
    { num: 3, storyElement: "Why Does It Matter?", yourAnswer: stakes },
    { num: 4, storyElement: "Cold Open", yourAnswer: coldOpenAnswer },
    { num: 5, storyElement: "Big Question", yourAnswer: bigQuestionAnswer },
    { num: 6, storyElement: "Context", yourAnswer: contextAnswer },
    { num: 7, storyElement: "Investigation", yourAnswer: investigationAnswer },
    { num: 8, storyElement: "Complication", yourAnswer: complicationAnswer },
    { num: 9, storyElement: "Discovery / Evidence", yourAnswer: discoveryAnswer },
    { num: 10, storyElement: "Explanation", yourAnswer: explanationAnswer },
    { num: 11, storyElement: "Final Payoff", yourAnswer: payoffAnswer },
    { num: 12, storyElement: "Closing Thought", yourAnswer: closingThoughtAnswer },
  ];

  const first30Seconds: First30SecondsPlan = {
    visualHook0to5s: {
      timing: "0–5s",
      label: "VISUAL HOOK",
      visualShot: visualHookPrompt,
      soundCues: "Striking ambient sound design, sudden silence, or deep orchestral rumble.",
    },
    strangeClaim5to12s: {
      timing: "5–12s",
      label: "STRANGE FACT / EVENT / CLAIM",
      narration: `A single surprising fact or observation that shatters expectations about ${title}.`,
      visualAction: "Macro reveal or archival evidence zoom that anchors the claim.",
    },
    question12to20s: {
      timing: "12–20s",
      label: "THE QUESTION (INFORMATION GAP)",
      narration: coreQuestion,
      visualAction: "Camera pulls back to establish the scale and mystery.",
    },
    promise20to30s: {
      timing: "20–30s",
      label: "THE PROMISE (MISSION CONTRACT)",
      narration: titlePromise,
      visualAction: "Fast montage of evidence, expeditions, and discoveries to come.",
    },
  };

  const escalationLadder: EscalationStep[] = [
    { level: 1, label: "Level 1: Interesting", description: `Initial observation: The subject of ${title} appears puzzling on the surface.` },
    { level: 2, label: "Level 2: More Interesting", description: `Standard explanations fail to account for a specific recorded anomaly or measurement.` },
    { level: 3, label: "Level 3: Surprising", description: `New investigative techniques reveal data that contradicts previous consensus.` },
    { level: 4, label: "Level 4: Significant", description: `Cross-disciplinary evidence confirms the anomaly is real and demands an updated model.` },
    { level: 5, label: "Level 5: Revelation", description: `A unified explanation resolves the mystery, leaving a deeper appreciation of the truth.` },
  ];

  const openLoops: OpenLoopItem[] = [
    {
      id: "loop-1",
      question: coreQuestion,
      openedInBeat: "Beat 2 (Big Question)",
      resolvedInBeat: "Beat 7 (Final Payoff)",
    },
    {
      id: "loop-2",
      question: "What unexpected obstacle or conflicting clue derailed early researchers?",
      openedInBeat: "Beat 5 (Complication)",
      resolvedInBeat: "Beat 6 (Discovery / Evidence)",
    },
  ];

  const visualScenes: VisualStorytellingScene[] = [
    {
      shotNumber: 1,
      shotType: "Cinematic Cold Open Macro",
      narration: "A single piece of evidence that started the entire investigation.",
      visualAction: "Slow motion push-in on the primary subject under high-contrast lighting.",
      googleFlowPrompt: `Cinematic 8K documentary macro shot relating to ${title}, dramatic volumetric lighting, subtle camera push, hyper-detailed texture.`,
    },
    {
      shotNumber: 2,
      shotType: "Wide Context Reveal",
      narration: "Establishing the historical scale and geographical setting.",
      visualAction: "Sweeping tracking shot showing the broader environment and historical site.",
      googleFlowPrompt: `Breathtaking cinematic wide shot showing landscape and historical environment for ${title}, authentic natural lighting, documentary atmosphere.`,
    },
  ];

  return {
    id: `storymap-${Date.now()}`,
    workingTitle: title,
    coreQuestion,
    premise,
    angle,
    targetViewer,
    clickMotivation,
    informationGap,
    stakes,
    visualHookPrompt,
    titlePromise,
    elements,
    first30Seconds,
    escalationLadder,
    openLoops,
    visualScenes,
    needsResearchItems: [],
    storyEngine: {
      question: coreQuestion,
      investigation: investigationAnswer,
      complication: complicationAnswer,
      discovery: discoveryAnswer,
      explanation: explanationAnswer,
      payoff: payoffAnswer,
    },
  };
}

// Server Function: Generate AI Story Map
const GenerateStoryMapInput = z.object({
  workingTitle: z.string().trim().min(1),
  premise: z.string().trim().optional(),
  angle: z.string().trim().optional(),
  targetViewer: z.string().trim().optional(),
  clickMotivation: z.string().trim().optional(),
  informationGap: z.string().trim().optional(),
  stakes: z.string().trim().optional(),
  visualHookPrompt: z.string().trim().optional(),
  titlePromise: z.string().trim().optional(),
  aiApiKey: z.string().trim().optional(),
});

export const generateStoryMapServer = createServerFn({ method: "POST" })
  .validator((data: unknown) => GenerateStoryMapInput.parse(data))
  .handler(async ({ data }): Promise<StoryMapDossier> => {
    // If working title matches our Day 5 exemplar, return the master exemplar immediately
    if (data.workingTitle.toLowerCase().includes("ancient egyptians") && data.workingTitle.toLowerCase().includes("stonework")) {
      return DAY5_EXEMPLAR_EGYPTIAN;
    }
    if (data.workingTitle.toLowerCase().includes("cosmic rays") || data.workingTitle.toLowerCase().includes("scanpyramids")) {
      return DAY5_EXEMPLAR_SCANPYRAMIDS;
    }
    if (data.workingTitle.toLowerCase().includes("chilean") || data.workingTitle.toLowerCase().includes("ufo") || data.workingTitle.toLowerCase().includes("uap")) {
      return DAY5_EXEMPLAR_UAP;
    }

    const effectiveAiKey = data.aiApiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!effectiveAiKey) {
      return generateHeuristicStoryMap(data);
    }

    try {
      const isGemini = effectiveAiKey.startsWith("AIza") || !!process.env.GEMINI_API_KEY;
      const prompt = `You are a master documentary director and story architect specializing in premium YouTube documentaries (in the style of Vox, Veritasium, Lemmino, Johnny Harris, and BBC Horizon).

Follow these strict DAY 5 STORYTELLING RULES:
1. "A documentary is not a collection of facts. It is a sequence of questions, discoveries, complications, and answers."
2. The Documentary Story Engine: QUESTION → INVESTIGATION → COMPLICATION → DISCOVERY → EXPLANATION → PAYOFF.
3. The 7-Beat Documentary Structure:
   - Beat 1: COLD OPEN (Give reason to care immediately; DO NOT reveal the answer yet!)
   - Beat 2: THE BIG QUESTION (Mission statement and contract with the viewer)
   - Beat 3: CONTEXT (Who, Where, When, Why without being a dry textbook)
   - Beat 4: INVESTIGATION (Researchers, expeditions, tools, archival digging)
   - Beat 5: COMPLICATION (Tension, contradiction, expectation vs reality, genuine difficulty)
   - Beat 6: DISCOVERY / EXPLANATION (Earned answers, measurements, physical/historical mechanisms)
   - Beat 7: FINAL PAYOFF (Answers the central question + meaningful closing thought with depth)
4. First 30 Seconds Formula:
   - 0–5s: Visual Hook (Arresting, kinetic, macro shot)
   - 5–12s: Strange Fact / Event / Claim
   - 12–20s: Question (Information gap)
   - 20–30s: Promise (Mission contract)
5. Escalation Ladder: 5 progressive levels (Level 1: Interesting → Level 2: More Interesting → Level 3: Surprising → Level 4: Significant → Level 5: Revelation).
6. Research Discipline: If a fact is unverified or requires deeper archival/scientific confirmation, explicitly prefix or note it with "Needs research — [details]". NEVER invent fake conspiracies or manufactured mysteries.

PROJECT INPUT:
- Working Title: "${data.workingTitle}"
- Premise: "${data.premise || "N/A"}"
- Angle: "${data.angle || "N/A"}"
- Target Viewer: "${data.targetViewer || "N/A"}"
- Click Motivation: "${data.clickMotivation || "KNOW"}"
- Information Gap: "${data.informationGap || "N/A"}"
- Stakes: "${data.stakes || "N/A"}"
- Visual Hook Concept: "${data.visualHookPrompt || "N/A"}"
- Title Promise: "${data.titlePromise || "N/A"}"

Return ONLY a valid JSON object matching this schema (no markdown formatting, no code fencing):
{
  "workingTitle": "string",
  "coreQuestion": "string",
  "elements": [
    { "num": 1, "storyElement": "Working Title", "yourAnswer": "string", "notes": "string" },
    { "num": 2, "storyElement": "Core Question", "yourAnswer": "string", "notes": "string" },
    { "num": 3, "storyElement": "Why Does It Matter?", "yourAnswer": "string", "notes": "string" },
    { "num": 4, "storyElement": "Cold Open", "yourAnswer": "string", "notes": "string" },
    { "num": 5, "storyElement": "Big Question", "yourAnswer": "string", "notes": "string" },
    { "num": 6, "storyElement": "Context", "yourAnswer": "string", "notes": "string" },
    { "num": 7, "storyElement": "Investigation", "yourAnswer": "string", "notes": "string" },
    { "num": 8, "storyElement": "Complication", "yourAnswer": "string", "notes": "string" },
    { "num": 9, "storyElement": "Discovery / Evidence", "yourAnswer": "string", "notes": "string" },
    { "num": 10, "storyElement": "Explanation", "yourAnswer": "string", "notes": "string" },
    { "num": 11, "storyElement": "Final Payoff", "yourAnswer": "string", "notes": "string" },
    { "num": 12, "storyElement": "Closing Thought", "yourAnswer": "string", "notes": "string" }
  ],
  "first30Seconds": {
    "visualHook0to5s": { "timing": "0–5s", "label": "VISUAL HOOK", "visualShot": "string", "soundCues": "string" },
    "strangeClaim5to12s": { "timing": "5–12s", "label": "STRANGE FACT / EVENT / CLAIM", "narration": "string", "visualAction": "string" },
    "question12to20s": { "timing": "12–20s", "label": "THE QUESTION (INFORMATION GAP)", "narration": "string", "visualAction": "string" },
    "promise20to30s": { "timing": "20–30s", "label": "THE PROMISE (MISSION CONTRACT)", "narration": "string", "visualAction": "string" }
  },
  "escalationLadder": [
    { "level": 1, "label": "Level 1: Interesting", "description": "string" },
    { "level": 2, "label": "Level 2: More Interesting", "description": "string" },
    { "level": 3, "label": "Level 3: Surprising", "description": "string" },
    { "level": 4, "label": "Level 4: Significant", "description": "string" },
    { "level": 5, "label": "Level 5: Revelation", "description": "string" }
  ],
  "openLoops": [
    { "id": "loop-1", "question": "string", "openedInBeat": "string", "resolvedInBeat": "string" },
    { "id": "loop-2", "question": "string", "openedInBeat": "string", "resolvedInBeat": "string" }
  ],
  "visualScenes": [
    { "shotNumber": 1, "shotType": "string", "narration": "string", "visualAction": "string", "googleFlowPrompt": "string" },
    { "shotNumber": 2, "shotType": "string", "narration": "string", "visualAction": "string", "googleFlowPrompt": "string" },
    { "shotNumber": 3, "shotType": "string", "narration": "string", "visualAction": "string", "googleFlowPrompt": "string" }
  ],
  "needsResearchItems": ["string"],
  "storyEngine": {
    "question": "string",
    "investigation": "string",
    "complication": "string",
    "discovery": "string",
    "explanation": "string",
    "payoff": "string"
  }
}`;

      let rawContent = "";
      if (isGemini) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveAiKey}`;
        const response = await fetch(url, {
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
        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }
        const dataJson = await response.json();
        rawContent = dataJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        const dataJson = await response.json();
        rawContent = dataJson.choices?.[0]?.message?.content || "";
      }

      const parsed = JSON.parse(rawContent);

      return {
        id: `storymap-${Date.now()}`,
        workingTitle: parsed.workingTitle || data.workingTitle,
        coreQuestion: parsed.coreQuestion || data.workingTitle,
        premise: data.premise || "",
        angle: data.angle || "",
        targetViewer: data.targetViewer || "",
        clickMotivation: (data.clickMotivation as any) || "KNOW",
        informationGap: data.informationGap || "",
        stakes: data.stakes || "",
        visualHookPrompt: data.visualHookPrompt || "",
        titlePromise: data.titlePromise || "",
        elements: parsed.elements || generateHeuristicStoryMap(data).elements,
        first30Seconds: parsed.first30Seconds || generateHeuristicStoryMap(data).first30Seconds,
        escalationLadder: parsed.escalationLadder || generateHeuristicStoryMap(data).escalationLadder,
        openLoops: parsed.openLoops || generateHeuristicStoryMap(data).openLoops,
        visualScenes: parsed.visualScenes || generateHeuristicStoryMap(data).visualScenes,
        needsResearchItems: parsed.needsResearchItems || [],
        storyEngine: parsed.storyEngine || generateHeuristicStoryMap(data).storyEngine,
      };
    } catch (err) {
      console.warn("AI StoryMap generation failed, using heuristic fallback:", err);
      return generateHeuristicStoryMap(data);
    }
  });
