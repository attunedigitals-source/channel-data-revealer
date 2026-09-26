import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateDocumentaryScript } from "@/lib/script.functions";
import { generateThumbnailImage } from "@/lib/thumbnail-generation.functions";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clapperboard,
  ClipboardCheck,
  Clock3,
  Compass,
  Download,
  FileText,
  Film,
  FlaskConical,
  Gauge,
  Image,
  Layers3,
  Lightbulb,
  Loader2,
  Megaphone,
  Play,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  KeyRound,
  Target,
  TrendingUp,
} from "lucide-react";

type StageId =
  "overview" | "research" | "ideas" | "story" | "flow" | "production" | "publish" | "analytics";
type StudioData = {
  id: string;
  project: string;
  niche: string;
  audience: string;
  targetMinutes: string;
  coreQuestion: string;
  publishDate: string;
  competitorNotes: string;
  claimLedger: string;
  topicPool: string;
  workingTitle: string;
  titleAlternates: string;
  thumbnailConcept: string;
  storyMap: string;
  script: string;
  scenePrompts: string;
  flowNotes: string;
  productionNotes: string;
  description: string;
  tags: string;
  videoUrl: string;
  views: string;
  subscribers: string;
  watchHours: string;
  ctr: string;
  avgViewDuration: string;
  revenue: string;
  whatWorked: string;
  nextExperiment: string;
  checks: Record<string, boolean>;
};

const STORAGE_KEY = "channel-insight-production-studio-v1";
const initialData: StudioData = {
  id: "pilot-01",
  project: "Ancient Egyptian Stonework",
  niche: "Pilot story · niche decision pending",
  audience: "Curious viewers who love evidence-led history and cinematic discoveries",
  targetMinutes: "12",
  coreQuestion: "How did ancient Egyptian craftsmen shape hard granite with Bronze Age tools?",
  publishDate: "",
  competitorNotes: "",
  claimLedger: "",
  topicPool: "",
  workingTitle: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
  titleAlternates: "",
  thumbnailConcept:
    "Dolerite pounder striking pink granite; one bright seam reveals the scale of the stonework.",
  storyMap: "",
  script: "",
  scenePrompts: "",
  flowNotes:
    "Keep visual references consistent across scenes. Label reconstructions clearly; avoid presenting speculative details as archival footage.",
  productionNotes: "",
  description: "",
  tags: "",
  videoUrl: "",
  views: "",
  subscribers: "",
  watchHours: "",
  ctr: "",
  avgViewDuration: "",
  revenue: "",
  whatWorked: "",
  nextExperiment: "",
  checks: {},
};

const stages: { id: StageId; label: string; icon: typeof Search; summary: string }[] = [
  { id: "overview", label: "Overview", icon: Layers3, summary: "Your production desk" },
  {
    id: "research",
    label: "Research",
    icon: FlaskConical,
    summary: "Audience, competitors & evidence",
  },
  {
    id: "ideas",
    label: "Ideas & packaging",
    icon: Lightbulb,
    summary: "Angles, titles & thumbnail promise",
  },
  {
    id: "story",
    label: "Story & script",
    icon: FileText,
    summary: "Story map, verified claims & narration",
  },
  { id: "flow", label: "Flow & scenes", icon: Film, summary: "Visual plan for Google Flow" },
  {
    id: "production",
    label: "Production",
    icon: Clapperboard,
    summary: "Voice, edit, sound & quality control",
  },
  { id: "publish", label: "Publish", icon: Send, summary: "Metadata, upload checklist & release" },
  {
    id: "analytics",
    label: "Analytics & revenue",
    icon: Activity,
    summary: "Learn from each release",
  },
];

const stageChecks: Record<string, { id: string; label: string }[]> = {
  research: [
    { id: "r-competitors", label: "Review competitor formats and outlier videos" },
    { id: "r-demand", label: "Write down the audience question and why it matters" },
    { id: "r-claims", label: "Log key claims with sources, evidence and confidence" },
    { id: "r-independent", label: "Check important claims against independent sources" },
  ],
  ideas: [
    { id: "i-angle", label: "Choose a distinctive angle the evidence can support" },
    { id: "i-title", label: "Make the title promise specific and deliverable" },
    { id: "i-thumb", label: "Make the thumbnail communicate one visual idea" },
    { id: "i-package", label: "Review title and thumbnail together" },
  ],
  story: [
    { id: "s-hook", label: "Open with a visual question, not a list of facts" },
    { id: "s-evidence", label: "Separate evidence from interpretation in narration" },
    { id: "s-payoff", label: "Resolve the central question with an earned payoff" },
    { id: "s-citations", label: "Keep source notes beside claims that need support" },
  ],
  flow: [
    { id: "f-refs", label: "Create consistent character, object and location references" },
    { id: "f-shots", label: "Break the script into purposeful visual scenes" },
    { id: "f-recon", label: "Label historical reconstructions and uncertain details" },
    { id: "f-render", label: "Review generated shots for continuity and accuracy" },
  ],
  production: [
    { id: "p-voice", label: "Record or generate narration and check pronunciation" },
    { id: "p-edit", label: "Edit for clarity, pacing and visual variety" },
    { id: "p-sound", label: "Balance music, effects and narration" },
    { id: "p-fact", label: "Run factual, rights and final playback checks" },
  ],
  publish: [
    { id: "u-thumb", label: "Export and preview the final thumbnail at phone size" },
    { id: "u-meta", label: "Check title, description, chapters and disclosure" },
    { id: "u-captions", label: "Review captions, end screens and cards" },
    { id: "u-live", label: "Publish, verify playback and record the URL" },
  ],
};

function loadWorkspace(): { projects: StudioData[]; activeId: string } {
  if (typeof window === "undefined") return { projects: [initialData], activeId: initialData.id };
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { projects: [initialData], activeId: initialData.id };
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed.projects) && parsed.projects.length) {
      const seededStoryMap =
        "Cold open → central question → quarry evidence → tools and abrasives → experimental reconstruction → what remains uncertain → human payoff";
      const projects = parsed.projects.map((project: StudioData) => ({
        ...project,
        storyMap: project.storyMap === seededStoryMap ? "" : project.storyMap,
      }));
      const activeId = projects.some((project: StudioData) => project.id === parsed.activeId)
        ? parsed.activeId
        : projects[0].id;
      return { projects, activeId };
    }
    const migrated = {
      ...initialData,
      ...parsed,
      id: parsed.id || initialData.id,
      storyMap:
        parsed.storyMap ===
        "Cold open → central question → quarry evidence → tools and abrasives → experimental reconstruction → what remains uncertain → human payoff"
          ? ""
          : parsed.storyMap || "",
      checks: { ...initialData.checks, ...parsed.checks },
    };
    return { projects: [migrated], activeId: migrated.id };
  } catch {
    return { projects: [initialData], activeId: initialData.id };
  }
}

export function ProductionStudio({
  onOpenResearchTools,
  onOpenTitleTools,
  onOpenStoryTools,
  onOpenApiConfig,
  aiApiKey,
}: {
  onOpenResearchTools: () => void;
  onOpenTitleTools: () => void;
  onOpenStoryTools: () => void;
  onOpenApiConfig: () => void;
  aiApiKey: string;
}) {
  const [projects, setProjects] = useState<StudioData[]>([initialData]);
  const [activeId, setActiveId] = useState(initialData.id);
  const [loaded, setLoaded] = useState(false);
  const [stage, setStage] = useState<StageId>("overview");
  const [saved, setSaved] = useState(true);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");
  const generateScript = useServerFn(generateDocumentaryScript);
  const generateThumbnail = useServerFn(generateThumbnailImage);
  const data = projects.find((project) => project.id === activeId) || projects[0] || initialData;

  useEffect(() => {
    const workspace = loadWorkspace();
    setProjects(workspace.projects);
    setActiveId(workspace.activeId);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !loaded) return;
    setSaved(false);
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, activeId }));
        setSaved(true);
      } catch {
        setSaved(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [projects, activeId, loaded]);

  const change = (key: keyof StudioData, value: string) =>
    setProjects((current) =>
      current.map((project) => (project.id === activeId ? { ...project, [key]: value } : project)),
    );
  const toggleCheck = (id: string) =>
    setProjects((current) =>
      current.map((project) =>
        project.id === activeId
          ? { ...project, checks: { ...project.checks, [id]: !project.checks[id] } }
          : project,
      ),
    );
  const newVideo = () => {
    const video: StudioData = {
      ...initialData,
      id: `episode-${Date.now()}`,
      project: `New documentary ${projects.length + 1}`,
      niche: data.niche,
      workingTitle: "",
      thumbnailConcept: "",
      coreQuestion: "",
      storyMap: "",
      script: "",
      scenePrompts: "",
      competitorNotes: "",
      claimLedger: "",
      topicPool: "",
      checks: {},
    };
    setProjects((current) => [...current, video]);
    setActiveId(video.id);
    setThumbnailPreview("");
    setThumbnailError("");
    setStage("ideas");
  };
  const exportProject = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(data.project || "youtube-project").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleGenerateScript = async () => {
    if (!data.workingTitle.trim() || !data.coreQuestion.trim()) {
      setScriptError("Add a working title and central question before drafting.");
      return;
    }
    setGeneratingScript(true);
    setScriptError("");
    try {
      const draft = await generateScript({
        data: {
          workingTitle: data.workingTitle,
          coreQuestion: data.coreQuestion,
          audience: data.audience,
          storyMap: data.storyMap,
          claimLedger: data.claimLedger,
          targetMinutes: Math.min(60, Math.max(3, Number(data.targetMinutes) || 12)),
          aiApiKey: aiApiKey || undefined,
        },
      });
      change("script", draft);
    } catch (error) {
      setScriptError(error instanceof Error ? error.message : "Script drafting failed. Try again.");
    } finally {
      setGeneratingScript(false);
    }
  };
  const handleGenerateThumbnail = async () => {
    if (!data.workingTitle.trim() || !data.thumbnailConcept.trim()) {
      setThumbnailError("Add a title and thumbnail concept before generating.");
      return;
    }
    setGeneratingThumbnail(true);
    setThumbnailError("");
    try {
      const image = await generateThumbnail({
        data: {
          title: data.workingTitle,
          concept: data.thumbnailConcept,
          aiApiKey: aiApiKey || undefined,
        },
      });
      setThumbnailPreview(`data:${image.mimeType};base64,${image.data}`);
    } catch (error) {
      setThumbnailError(
        error instanceof Error ? error.message : "Thumbnail generation failed. Try again.",
      );
    } finally {
      setGeneratingThumbnail(false);
    }
  };
  const allCheckItems = Object.values(stageChecks).flat();
  const completeCount = allCheckItems.filter((item) => data.checks[item.id]).length;
  const completion = Math.round((completeCount / allCheckItems.length) * 100);
  const activeStage = stages.find((item) => item.id === stage)!;
  const revenue = Number(data.revenue) || 0;
  const views = Number(data.views) || 0;
  const rpm = views > 0 ? (revenue / views) * 1000 : 0;
  const monthlyViewsAtGoal = rpm > 0 ? Math.ceil((10000 / rpm) * 1000) : 0;

  return (
    <section className="studio-shell mx-auto max-w-[1440px] px-4 py-6 sm:px-7 lg:px-9">
      <div className="studio-layout">
        <aside className="studio-sidebar">
          <div className="studio-brand">
            <div className="studio-mark">
              <Play size={17} fill="currentColor" />
            </div>
            <div>
              <strong>STORYFRAME</strong>
              <span>Creator workspace</span>
            </div>
          </div>
          <div className="studio-workspace-label">WORKSPACE</div>
          <label className="studio-channel-picker">
            <span>ACTIVE VIDEO</span>
            <select
              value={activeId}
              onChange={(e) => {
                setActiveId(e.target.value);
                setThumbnailPreview("");
                setThumbnailError("");
              }}
              aria-label="Select active video project"
            >
              {projects.map((project, index) => (
                <option key={project.id} value={project.id}>
                  {project.project || `Video ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="studio-add-video" onClick={newVideo}>
            <Plus size={14} /> Add a video project
          </button>
          <nav className="studio-nav" aria-label="Production workflow">
            {stages.map((item) => {
              const Icon = item.icon;
              const selected = item.id === stage;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStage(item.id)}
                  className={`studio-nav-item ${selected ? "active" : ""}`}
                  aria-current={selected ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.id === "publish" && <span className="studio-nav-dot" />}
                </button>
              );
            })}
          </nav>
          <div className="studio-sidebar-bottom">
            <div className="studio-goal">
              <div className="studio-goal-icon">
                <Target size={16} />
              </div>
              <div>
                <span>12-MONTH TARGET</span>
                <strong>
                  $10,000 <small>/ month</small>
                </strong>
              </div>
              <div className="studio-goal-track">
                <i />
              </div>
              <p>Revenue goal is a planning target, not a forecast.</p>
            </div>
            <button className="studio-help" type="button" onClick={() => setStage("research")}>
              <BookOpen size={16} /> Learning path <ArrowRight size={14} />
            </button>
          </div>
        </aside>

        <div className="studio-main">
          <header className="studio-topbar">
            <div className="studio-breadcrumb">
              <span>{data.project || "Untitled video"}</span>
              <ChevronRight size={14} />
              <strong>{activeStage.label}</strong>
            </div>
            <div className="studio-top-actions">
              <span className="studio-save">
                <span className={saved ? "save-dot saved" : "save-dot"} />
                {saved ? "Saved locally" : "Saving…"}
              </span>
              <button type="button" className="studio-quiet-button" onClick={onOpenResearchTools}>
                <Search size={15} /> Research tools
              </button>
              <button
                type="button"
                className="studio-quiet-button studio-export-button"
                onClick={exportProject}
              >
                <Save size={14} /> Export
              </button>
              <button
                type="button"
                className="studio-quiet-button studio-api-button"
                onClick={onOpenApiConfig}
              >
                <KeyRound size={14} /> API keys
              </button>
              <button type="button" className="studio-primary-button" onClick={newVideo}>
                <Plus size={16} /> New video
              </button>
            </div>
          </header>

          <div className="studio-content">
            {stage === "overview" && (
              <Overview data={data} completion={completion} setStage={setStage} change={change} />
            )}
            {stage === "research" && (
              <StagePage
                eyebrow="DISCOVER & VERIFY"
                title="Build a story on evidence."
                description="Collect audience signals, study the market, and keep every important claim traceable to its source."
                icon={<FlaskConical size={19} />}
              >
                <div className="studio-grid two">
                  <Field
                    label="Competitor & audience notes"
                    hint="Patterns, formats, outliers and unanswered audience questions"
                  >
                    <textarea
                      value={data.competitorNotes}
                      onChange={(e) => change("competitorNotes", e.target.value)}
                      placeholder="What are viewers already watching? Where is there room for a fresh, well-supported angle?"
                    />
                  </Field>
                  <Field
                    label="Claim ledger"
                    hint="One claim per line · add source and confidence as you research"
                  >
                    <textarea
                      className="tall"
                      value={data.claimLedger}
                      onChange={(e) => change("claimLedger", e.target.value)}
                      placeholder="Claim — source — evidence — status — confidence\nExample: Dolerite pounders were found at the quarry — [source] — [what it demonstrates] — NEEDS REVIEW"
                    />
                  </Field>
                </div>
                <Checklist
                  items={stageChecks["research"]!}
                  checks={data.checks}
                  toggle={toggleCheck}
                />
                <StageFooter
                  onTools={onOpenResearchTools}
                  toolsLabel="Open competitor research tools"
                />
              </StagePage>
            )}
            {stage === "ideas" && (
              <StagePage
                eyebrow="IDEA → ANGLE → PACKAGE"
                title="Make the promise worth a click."
                description="Develop an original angle, then make the title and thumbnail promise the same compelling video."
                icon={<Lightbulb size={19} />}
              >
                <div className="studio-grid two">
                  <Field
                    label="Idea bank"
                    hint="Capture raw topics and questions; select one to develop"
                  >
                    <textarea
                      value={data.topicPool}
                      onChange={(e) => change("topicPool", e.target.value)}
                      placeholder="A topic is not yet a video idea. What specific question or discovery could carry a story?"
                    />
                  </Field>
                  <Field
                    label="Working title"
                    hint="Clear promise · specific curiosity · evidence can deliver"
                  >
                    <input
                      value={data.workingTitle}
                      onChange={(e) => change("workingTitle", e.target.value)}
                      placeholder="Write the title you want to test"
                    />
                    <textarea
                      value={data.titleAlternates}
                      onChange={(e) => change("titleAlternates", e.target.value)}
                      placeholder="Alternative title directions"
                    />
                  </Field>
                  <Field label="Thumbnail concept" hint="One dominant image, one visual idea">
                    <textarea
                      value={data.thumbnailConcept}
                      onChange={(e) => change("thumbnailConcept", e.target.value)}
                      placeholder="What does a viewer understand at a glance?"
                    />
                  </Field>
                  <div className="studio-thumbnail-maker">
                    <div className="thumbnail-maker-head">
                      <div>
                        <span>AI THUMBNAIL CONCEPT</span>
                        <p>Generates an original 16:9 visual from your title and concept.</p>
                      </div>
                      <button
                        type="button"
                        className="studio-primary-button"
                        onClick={handleGenerateThumbnail}
                        disabled={generatingThumbnail}
                      >
                        {generatingThumbnail ? (
                          <Loader2 className="studio-spinner" size={14} />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        {generatingThumbnail ? "Creating…" : "Create thumbnail"}
                      </button>
                    </div>
                    {thumbnailError && (
                      <p className="studio-script-error" role="alert">
                        {thumbnailError}
                      </p>
                    )}
                    {thumbnailPreview && (
                      <div className="studio-thumbnail-result">
                        <img
                          src={thumbnailPreview}
                          alt={`AI thumbnail concept for ${data.workingTitle}`}
                        />
                        <a href={thumbnailPreview} download="youtube-thumbnail-concept.png">
                          <Download size={14} /> Download image
                        </a>
                      </div>
                    )}
                  </div>
                  <Field
                    label="Audience & stakes"
                    hint="Who cares, and why does this matter to them?"
                  >
                    <textarea
                      value={data.audience}
                      onChange={(e) => change("audience", e.target.value)}
                      placeholder="Describe the intended viewer and the reason to keep watching"
                    />
                  </Field>
                </div>
                <Checklist
                  items={stageChecks["ideas"]!}
                  checks={data.checks}
                  toggle={toggleCheck}
                />
                <StageFooter onTools={onOpenTitleTools} toolsLabel="Open title and thumbnail lab" />
              </StagePage>
            )}
            {stage === "story" && (
              <StagePage
                eyebrow="INVESTIGATE → EXPLAIN → PAY OFF"
                title="Turn facts into a documentary."
                description="Shape the evidence into a story. Keep uncertainty visible, and make every reveal earn its place."
                icon={<FileText size={19} />}
              >
                <div className="studio-grid two">
                  <Field label="Central question" hint="The question that keeps this film moving">
                    <textarea
                      value={data.coreQuestion}
                      onChange={(e) => change("coreQuestion", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Story map"
                    hint="Cold open → question → context → investigation → complication → payoff"
                  >
                    <textarea
                      value={data.storyMap}
                      onChange={(e) => change("storyMap", e.target.value)}
                    />
                  </Field>
                </div>
                <Field
                  label="Script workspace"
                  hint="Draft narration here; keep source markers beside claims that need verification"
                >
                  <div className="studio-script-toolbar">
                    <label>
                      Target runtime
                      <input
                        type="number"
                        min={3}
                        max={60}
                        value={data.targetMinutes}
                        onChange={(e) => change("targetMinutes", e.target.value)}
                        aria-label="Target video runtime in minutes"
                      />
                      min
                    </label>
                    <button
                      type="button"
                      className="studio-primary-button"
                      onClick={handleGenerateScript}
                      disabled={generatingScript}
                    >
                      {generatingScript ? (
                        <Loader2 className="studio-spinner" size={14} />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      {generatingScript ? "Drafting…" : "Draft with AI"}
                    </button>
                    <span>
                      Draft uses your story map and claim ledger. Review every factual claim.
                    </span>
                  </div>
                  {scriptError && (
                    <p className="studio-script-error" role="alert">
                      {scriptError}
                    </p>
                  )}
                  <textarea
                    className="script-editor"
                    value={data.script}
                    onChange={(e) => change("script", e.target.value)}
                    placeholder="SCENE 01 · COLD OPEN\n[VISUAL] ...\n[NARRATION] ...\n[SOURCE NOTE] ...\n\nSCENE 02 · THE QUESTION\n..."
                  />
                </Field>
                <Checklist
                  items={stageChecks["story"]!}
                  checks={data.checks}
                  toggle={toggleCheck}
                />
                <StageFooter
                  onTools={onOpenStoryTools}
                  toolsLabel="Open story map & research tools"
                />
              </StagePage>
            )}
            {stage === "flow" && (
              <StagePage
                eyebrow="VISUALIZE THE STORY"
                title="Plan every shot before Flow."
                description="Turn narration into a visual sequence. Prepare reusable references and prompts for Google Flow; review every generation for continuity and factual clarity."
                icon={<Film size={19} />}
              >
                <div className="studio-flow-callout">
                  <div className="flow-callout-icon">
                    <Film size={18} />
                  </div>
                  <div>
                    <strong>Google Flow handoff</strong>
                    <p>
                      Prepare scene prompts and references here, then take them into Flow for
                      generation. Direct Flow generation is not connected in this workspace.
                    </p>
                  </div>
                  <a href="https://labs.google/fx/tools/flow" target="_blank" rel="noreferrer">
                    Open Flow <ArrowUpRight size={14} />
                  </a>
                </div>
                <div className="studio-grid two">
                  <Field
                    label="Scene list & Flow prompts"
                    hint="One scene per paragraph · describe shot, movement, light, period and continuity"
                  >
                    <textarea
                      className="tall"
                      value={data.scenePrompts}
                      onChange={(e) => change("scenePrompts", e.target.value)}
                      placeholder="SCENE 01 · 00:00–00:08\nWide aerial view over Aswan quarry at sunrise; slow descending camera...\n\nSCENE 02 · 00:08–00:16\nMacro reconstruction of a dolerite pounder..."
                    />
                  </Field>
                  <Field
                    label="References & continuity notes"
                    hint="Character, location, object, palette and reconstruction rules"
                  >
                    <textarea
                      className="tall"
                      value={data.flowNotes}
                      onChange={(e) => change("flowNotes", e.target.value)}
                    />
                  </Field>
                </div>
                <Checklist items={stageChecks["flow"]!} checks={data.checks} toggle={toggleCheck} />
                <StageFooter />
              </StagePage>
            )}
            {stage === "production" && (
              <StagePage
                eyebrow="MAKE & REVIEW"
                title="Bring the pieces together."
                description="Track narration, edit, sound design and the editorial checks that protect trust and quality."
                icon={<Clapperboard size={19} />}
              >
                <div className="studio-production-strip">
                  <div>
                    <Clock3 size={17} />
                    <span>Planned publish date</span>
                  </div>
                  <input
                    aria-label="Planned publish date"
                    type="date"
                    value={data.publishDate}
                    onChange={(e) => change("publishDate", e.target.value)}
                  />
                </div>
                <Field
                  label="Production notes"
                  hint="Voiceover status, edit decisions, sound direction, asset credits and outstanding fixes"
                >
                  <textarea
                    className="tall"
                    value={data.productionNotes}
                    onChange={(e) => change("productionNotes", e.target.value)}
                    placeholder="VOICEOVER · ...\nEDIT · ...\nSOUND · ...\nRIGHTS & CREDITS · ..."
                  />
                </Field>
                <Checklist
                  items={stageChecks["production"]!}
                  checks={data.checks}
                  toggle={toggleCheck}
                />
                <StageFooter />
              </StagePage>
            )}
            {stage === "publish" && (
              <StagePage
                eyebrow="PACKAGE & RELEASE"
                title="Make the finished film ready."
                description="Complete the release details and final checks, then capture what actually went live."
                icon={<Megaphone size={19} />}
              >
                <div className="studio-grid two">
                  <Field
                    label="Video description"
                    hint="Summarize the promise, add useful context and list research sources"
                  >
                    <textarea
                      value={data.description}
                      onChange={(e) => change("description", e.target.value)}
                      placeholder="Description, chapters, source notes and disclosures"
                    />
                  </Field>
                  <Field
                    label="Search phrases & tags"
                    hint="Relevant language viewers may use; avoid unrelated tags"
                  >
                    <textarea
                      value={data.tags}
                      onChange={(e) => change("tags", e.target.value)}
                      placeholder="Separate phrases with commas"
                    />
                  </Field>
                  <Field label="Published video URL" hint="Add the link after the upload is live">
                    <input
                      value={data.videoUrl}
                      onChange={(e) => change("videoUrl", e.target.value)}
                      placeholder="https://youtube.com/watch?v=…"
                    />
                  </Field>
                </div>
                <div className="studio-release-title">
                  <span>Selected title</span>
                  <strong>{data.workingTitle || "Add a working title in Ideas & packaging"}</strong>
                  <button type="button" onClick={() => setStage("ideas")}>
                    Edit title <ArrowRight size={14} />
                  </button>
                </div>
                <Checklist
                  items={stageChecks["publish"]!}
                  checks={data.checks}
                  toggle={toggleCheck}
                />
                <StageFooter />
              </StagePage>
            )}
            {stage === "analytics" && (
              <StagePage
                eyebrow="MEASURE → LEARN → IMPROVE"
                title="Let each upload teach you."
                description="Record results after publishing and use the pattern to improve the next topic, package and opening."
                icon={<Activity size={19} />}
              >
                <div className="studio-metric-grid">
                  <Metric label="Views" value={data.views} onChange={(v) => change("views", v)} />
                  <Metric
                    label="Subscribers gained"
                    value={data.subscribers}
                    onChange={(v) => change("subscribers", v)}
                  />
                  <Metric
                    label="Watch hours"
                    value={data.watchHours}
                    onChange={(v) => change("watchHours", v)}
                  />
                  <Metric
                    label="Impressions CTR %"
                    value={data.ctr}
                    onChange={(v) => change("ctr", v)}
                  />
                  <Metric
                    label="Average view duration"
                    value={data.avgViewDuration}
                    onChange={(v) => change("avgViewDuration", v)}
                  />
                  <Metric
                    label="YouTube revenue ($)"
                    value={data.revenue}
                    onChange={(v) => change("revenue", v)}
                  />
                </div>
                <div className="studio-revenue-callout">
                  <div>
                    <span>Recorded RPM</span>
                    <strong>{rpm > 0 ? `$${rpm.toFixed(2)}` : "—"}</strong>
                    <small>Revenue per 1,000 views from your entry</small>
                  </div>
                  <div className="revenue-divider" />
                  <div>
                    <span>Views at this RPM for $10K</span>
                    <strong>
                      {monthlyViewsAtGoal > 0
                        ? monthlyViewsAtGoal.toLocaleString()
                        : "Add views and revenue"}
                    </strong>
                    <small>Illustrative arithmetic, not an earnings forecast</small>
                  </div>
                  <div className="revenue-note">
                    <TrendingUp size={17} />
                    <p>
                      Use your own channel data. RPM varies with audience, topic, format and season.
                    </p>
                  </div>
                </div>
                <div className="studio-grid two">
                  <Field
                    label="What worked?"
                    hint="Topic demand, title/thumbnail fit, hook, retention and audience response"
                  >
                    <textarea
                      value={data.whatWorked}
                      onChange={(e) => change("whatWorked", e.target.value)}
                      placeholder="Record observations from YouTube Analytics"
                    />
                  </Field>
                  <Field
                    label="What will change next time?"
                    hint="Choose one or two specific experiments"
                  >
                    <textarea
                      value={data.nextExperiment}
                      onChange={(e) => change("nextExperiment", e.target.value)}
                      placeholder="Turn the observation into the next test"
                    />
                  </Field>
                </div>
                <StageFooter />
              </StagePage>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Overview({
  data,
  completion,
  setStage,
  change,
}: {
  data: StudioData;
  completion: number;
  setStage: (s: StageId) => void;
  change: (key: keyof StudioData, value: string) => void;
}) {
  const next = stages.slice(1, -1).find((s) => stageChecks[s.id]?.some((c) => !data.checks[c.id]));
  const steps = ["Research", "Package", "Script", "Flow scenes", "Production", "Publish", "Learn"];
  return (
    <>
      <div className="studio-welcome">
        <div>
          <div className="studio-eyebrow">
            <span className="eyebrow-line" /> YOUR PRODUCTION DESK
          </div>
          <h1>
            Make something
            <br />
            <em>worth watching.</em>
          </h1>
          <p>
            One workspace for the full documentary pipeline, from the first audience question to the
            next upload’s lessons.
          </p>
        </div>
        <div className="studio-welcome-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-core">
            <Play size={27} fill="currentColor" />
          </div>
          <span className="art-star star-a">✳</span>
          <span className="art-star star-b">✦</span>
          <span className="art-label">IDEA → FILM</span>
        </div>
      </div>
      <div className="studio-page-heading">
        <div>
          <div className="studio-section-kicker">
            ACTIVE FILM <span>·</span> {data.id === "pilot-01" ? "PILOT" : "EPISODE"}
          </div>
          <input
            className="studio-project-input"
            aria-label="Video project name"
            value={data.project}
            onChange={(e) => change("project", e.target.value)}
          />
          <div className="studio-project-meta">
            <input
              aria-label="Niche or subject area"
              value={data.niche}
              onChange={(e) => change("niche", e.target.value)}
            />{" "}
            <span>·</span>{" "}
            {data.publishDate
              ? `Target ${new Date(`${data.publishDate}T00:00:00`).toLocaleDateString()}`
              : "No publish date set"}
          </div>
        </div>
        <button
          className="studio-primary-button"
          type="button"
          onClick={() => setStage(next?.id || "research")}
        >
          <Play size={15} fill="currentColor" /> Continue workflow
        </button>
      </div>
      <div className="studio-grid summary-grid">
        <SummaryCard
          label="Production progress"
          value={`${completion}%`}
          helper={`${Object.values(data.checks).filter(Boolean).length} quality checks complete`}
          icon={<Gauge size={17} />}
          progress={completion}
        />
        <SummaryCard
          label="Current stage"
          value={next?.label || "Ready to publish"}
          helper="Pick up where you left off"
          icon={<Compass size={17} />}
        />
        <SummaryCard
          label="Working title"
          value={data.workingTitle || "Not set yet"}
          helper="Promise is editable in packaging"
          icon={<Image size={17} />}
        />
        <SummaryCard
          label="Revenue target"
          value="$10,000 / mo"
          helper="12-month ambition · no guarantee"
          icon={<Target size={17} />}
        />
      </div>
      <div className="studio-section-title">
        <div>
          <span>THE PRODUCTION LINE</span>
          <h3>From question to next episode</h3>
        </div>
        <button className="studio-text-link" type="button" onClick={() => setStage("research")}>
          Open workflow <ArrowRight size={14} />
        </button>
      </div>
      <div className="studio-pipeline">
        {steps.map((step, i) => {
          const target: StageId[] = [
            "research",
            "ideas",
            "story",
            "flow",
            "production",
            "publish",
            "analytics",
          ];
          const currentStage = target[i]!;
          const checks = stageChecks[currentStage] || [];
          const complete = checks.length > 0 && checks.every((c) => data.checks[c.id]);
          return (
            <button
              className={`pipeline-step ${complete ? "complete" : ""}`}
              key={step}
              onClick={() => setStage(currentStage)}
              type="button"
            >
              <span className="pipeline-number">
                {complete ? <Check size={13} /> : `0${i + 1}`}
              </span>
              <span className="pipeline-name">{step}</span>
              {i < steps.length - 1 && <ChevronRight size={14} className="pipeline-arrow" />}
            </button>
          );
        })}
      </div>
      <div className="studio-grid two overview-lower">
        <div className="studio-card">
          <div className="studio-card-head">
            <div className="card-icon warm">
              <ClipboardCheck size={16} />
            </div>
            <div>
              <span>UP NEXT</span>
              <h3>{next ? next.label : "Your checklist is clear"}</h3>
            </div>
          </div>
          <p>{next ? next.summary : "Keep capturing results and improve the next release."}</p>
          <button
            className="studio-inline-link"
            onClick={() => setStage(next?.id || "analytics")}
            type="button"
          >
            {next ? "Continue this stage" : "Review analytics"}
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="studio-card learning-card">
          <div className="studio-card-head">
            <div className="card-icon cool">
              <BookOpen size={16} />
            </div>
            <div>
              <span>CREATOR DEVELOPMENT</span>
              <h3>Learn the craft as you build</h3>
            </div>
          </div>
          <p>
            The learning path lives alongside production: practice research, story, packaging,
            Google Flow and analytics on real episodes.
          </p>
          <button className="studio-inline-link" onClick={() => setStage("research")} type="button">
            Open research lesson <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

function StagePage({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="studio-stage-page">
      <div className="studio-stage-heading">
        <div className="stage-icon">{icon}</div>
        <div>
          <div className="studio-eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint: string; children?: ReactNode }) {
  return (
    <label className="studio-field">
      <span className="field-label">{label}</span>
      <span className="field-hint">{hint}</span>
      {children}
    </label>
  );
}
function Checklist({
  items,
  checks,
  toggle,
}: {
  items: { id: string; label: string }[];
  checks: Record<string, boolean>;
  toggle: (id: string) => void;
}) {
  return (
    <div className="studio-checklist">
      <div className="checklist-heading">
        <div>
          <span>QUALITY GATE</span>
          <h3>Ready to move forward?</h3>
        </div>
        <span className="checklist-count">
          {items.filter((i) => checks[i.id]).length}/{items.length} complete
        </span>
      </div>
      <div className="checklist-items">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`checklist-item ${checks[item.id] ? "checked" : ""}`}
            onClick={() => toggle(item.id)}
          >
            {checks[item.id] ? <CheckCircle2 size={17} /> : <Circle size={17} />}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function StageFooter({ onTools, toolsLabel }: { onTools?: () => void; toolsLabel?: string }) {
  return (
    <div className="studio-stage-footer">
      <span>
        <Save size={14} /> Changes save in this browser
      </span>
      {onTools && (
        <button className="studio-text-link" type="button" onClick={onTools}>
          {toolsLabel}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
function SummaryCard({
  label,
  value,
  helper,
  icon,
  progress,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  progress?: number;
}) {
  return (
    <div className="studio-summary-card">
      <div className="summary-card-top">
        <span>{label}</span>
        <span className="summary-icon">{icon}</span>
      </div>
      <strong className={value.length > 19 ? "compact" : ""}>{value}</strong>
      {progress !== undefined && (
        <div className="summary-progress">
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
      <small>{helper}</small>
    </div>
  );
}
function Metric({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="studio-metric">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
      />
    </label>
  );
}
