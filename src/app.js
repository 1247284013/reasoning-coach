const defaultStages = [
  {
    key: "goal",
    title: "Goal",
    prompt: "Clarify what the student is trying to make, learn, or decide.",
    focus: "step-1",
  },
  {
    key: "need",
    title: "Detect Need",
    prompt: "Identify the learning or verification need triggered by the project.",
    focus: "step-1",
  },
  {
    key: "guide",
    title: "Guide",
    prompt: "Guide the student through the next small learning step.",
    focus: "step-2",
  },
  {
    key: "reasoning",
    title: "Reasoning Build",
    prompt: "Help the student connect content, project fit, assumptions and constraints.",
    focus: "step-2",
  },
  {
    key: "practice",
    title: "Practice",
    prompt: "Turn reasoning into a small project-centred action or test.",
    focus: "step-3",
  },
  {
    key: "validate",
    title: "Validate",
    prompt: "Identify evidence, feedback or checks needed before using the content.",
    focus: "step-3",
  },
  {
    key: "decision",
    title: "Decision",
    prompt: "Compare possible paths and support the student to make their own decision.",
    focus: "step-3",
  },
];

let stages = defaultStages.map((stage) => ({ ...stage, role: stage.key }));

// The packaged desktop runtime uses 4888. Keep direct file previews on the same
// local API so Generate Plan behaves exactly like the Electron window.
const API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:4888" : "";

let stageReasoningChains = {
  goal: [
    {
      key: "intention",
      title: "Project intention",
      question: "What project outcome are you trying to move towards?",
      hint: "Describe the project purpose in one concrete sentence.",
      options: ["Prototype", "User experience", "Technical proof", "Design direction"],
    },
    {
      key: "success",
      title: "Success signal",
      question: "What would show that this learning was useful?",
      hint: "Name what you expect to see, make, test, or decide.",
      options: ["Working test", "Clearer concept", "Design choice", "Evidence"],
    },
    {
      key: "decision",
      title: "Decision focus",
      question: "What decision might this learning support?",
      hint: "Identify the project decision that is currently unclear.",
      options: ["Use method", "Choose tool", "Change plan", "Test first"],
    },
  ],
  need: [
    {
      key: "gap",
      title: "Knowledge gap",
      question: "What do you currently not understand well enough?",
      hint: "Separate what you know from what you still need to learn.",
      options: ["Concept", "Method", "Tool step", "Technical detail"],
    },
    {
      key: "trigger",
      title: "Project trigger",
      question: "What project task made this learning necessary?",
      hint: "Connect the learning need to a real project moment.",
      options: ["Build", "Model", "Debug", "Evaluate"],
    },
    {
      key: "boundary",
      title: "Learning boundary",
      question: "How much do you need to learn before acting?",
      hint: "Avoid learning everything when a focused test is enough.",
      options: ["Basic idea", "Enough to test", "Enough to build", "Need expert help"],
    },
  ],
  guide: [
    {
      key: "step-purpose",
      title: "Step purpose",
      question: "What is this step helping you understand?",
      hint: "Explain the role of the current step before following it.",
      options: ["Setup", "Connection", "Logic", "Output"],
    },
    {
      key: "observe",
      title: "What to observe",
      question: "What do you want to look for while trying this step?",
      hint: "Define what evidence or behaviour you want to notice.",
      options: ["Error", "Response", "Value", "Mismatch"],
    },
    {
      key: "uncertainty",
      title: "Uncertainty",
      question: "What is still unclear before you move on?",
      hint: "Mark the part that may need checking or adaptation.",
      options: ["Why it works", "How to test", "Whether it fits", "Risk"],
    },
  ],
  reasoning: [
    {
      key: "learning-focus",
      title: "Learning focus",
      question: "What are you trying to understand or learn right now?",
      hint: "Name the specific concept, method, tool step, or AI output you are working with.",
      options: ["Concept", "Method", "Tool step", "AI output"],
    },
    {
      key: "project-link",
      title: "Project link",
      question: "Why does this matter to your own project?",
      hint: "Connect the learning content to your project goal or current task.",
      options: ["Goal", "Prototype", "User need", "Technical task"],
    },
    {
      key: "fit-check",
      title: "Fit radar",
      question: "Use the fit radar to judge where this feels strong or weak for your project.",
      hint: "Look across project fit, feasibility, evidence and risk before moving into action.",
      options: ["Strong fit", "Mixed fit", "Weak evidence", "High risk"],
    },
    {
      key: "assumption-check",
      title: "Assumptions",
      question: "What must be true for this to work?",
      hint: "Identify assumptions about materials, skill, time, users, tools, or technical behaviour.",
      options: ["Time", "Material", "Skill", "Safety"],
    },
    {
      key: "evidence-check",
      title: "Evidence check",
      question: "Use the evidence check to decide what you want to verify before using it.",
      hint: "Choose what would make this decision safer or more credible.",
      options: ["Small test", "Official source", "Similar case", "Feedback"],
    },
    {
      key: "next-action",
      title: "Next action",
      question: "What do you want your next project action to be?",
      hint: "Choose whether you want to apply it, test first, seek more evidence, or adjust direction.",
      options: ["Apply", "Test first", "Seek evidence", "Adjust direction"],
    },
  ],
  practice: [
    {
      key: "small-test",
      title: "Small test",
      question: "What is the smallest action you can try first?",
      hint: "Choose a low-risk action before committing to the whole solution.",
      options: ["Mini prototype", "Code test", "Material test", "Sketch test"],
    },
    {
      key: "test-signal",
      title: "Test signal",
      question: "What result would tell you the test worked?",
      hint: "Define the output, behaviour, or feedback you need.",
      options: ["Works", "Partly works", "Fails clearly", "Needs change"],
    },
    {
      key: "practice-risk",
      title: "Risk",
      question: "What could go wrong during this practice step?",
      hint: "Identify the risk before scaling the action.",
      options: ["Time", "Safety", "Complexity", "Accuracy"],
    },
  ],
  validate: [
    {
      key: "evidence-source",
      title: "Evidence source",
      question: "Where should evidence come from?",
      hint: "Choose a source that can support the project decision.",
      options: ["Test result", "Official source", "Tutor feedback", "User feedback"],
    },
    {
      key: "pass-condition",
      title: "Pass condition",
      question: "What condition must be met before using this in the project?",
      hint: "Set a practical threshold before moving forward.",
      options: ["Reliable", "Safe", "Feasible", "Clear value"],
    },
    {
      key: "revision-need",
      title: "Revision need",
      question: "What would make you revise the direction?",
      hint: "Identify the evidence that would change your decision.",
      options: ["Poor result", "Too costly", "Too hard", "Weak relevance"],
    },
  ],
  decision: [
    {
      key: "options",
      title: "2x2 comparison",
      question: "What are at least two possible next paths?",
      hint: "Use a two-axis comparison before choosing one path.",
      options: ["Apply", "Test first", "Seek evidence", "Adjust direction"],
    },
    {
      key: "tradeoff",
      title: "Trade-off",
      question: "What trade-off matters most in this decision?",
      hint: "Balance project value with constraints and risk.",
      options: ["Speed", "Quality", "Risk", "Learning value"],
    },
    {
      key: "student-choice",
      title: "Student choice",
      question: "What next action do you choose, and why?",
      hint: "Make the final decision yourself and explain the reasoning.",
      options: ["Apply", "Test first", "Seek evidence", "Adjust direction"],
    },
  ],
};

const state = {
  projectMaterial: "",
  projectGoal: "",
  learningContent: "",
  learningType: [],
  onboardingComplete: false,
  onboardingVersion: 0,
  productTourComplete: false,
  productTourStep: 0,
  desktopToolsExplained: false,
  learnerProfile: {
    discipline: "Design engineering",
    year: "",
    focus: [],
    skills: {},
  },
  uploadedFileName: "",
  setupPurpose: "task",
  selectedTaskName: "",
  generationTemperature: 0.42,
  informationDensity: 50,
  explorationLevel: 50,
  knowledgeDepth: "applied",
  explorationScope: "balanced",
  scaffoldPreset: "standard",
  scaffoldSettingsTouched: { density: false, exploration: false },
  view: "home",
  homeTab: "new",
  currentStage: "goal",
  chainIndexes: {},
  openChainKeys: {},
  selectedStartPoint: "",
  activeAllow: [],
  activePlanSource: "",
  activeContextSummary: "",
  currentPlan: null,
  planEditorOpen: false,
  planEditorDraft: null,
  planEditorHistory: [],
  planEditorPendingSnapshot: null,
  returnToFlowAfterPlanEdit: false,
  agentStatus: {
    checked: false,
    online: false,
    hasApiKey: false,
    model: "",
    error: "",
  },
  userActions: [],
  records: {},
  chainRecords: {},
  coachTurns: {},
  coachDraftChoice: "",
  showCoachNotes: true,
  lastAi: null,
  stagePrompts: {},
  stageLabels: {},
  completedStages: {},
  taskRecordGuidance: null,
  nextMoveGuidance: null,
  recordRefineChat: [],
  recordRefineDraft: null,
  decisionCheck: null,
  knowledgeMap: {
    project: "",
    nodes: [],
    edges: [],
    selectedNodeId: "",
    filter: "all",
    profileSyncPaused: false,
  },
};

// Rendering starts before the utility section at the end of this file runs.
// Keep the tooltip lookup available to any early call to shorten().
const shortenedTextLookup = new Map();

// A small, curated library keeps external support tied to the learner's actual
// project step. It deliberately favours official documentation and practical
// learning environments over a long, generic list of search results.
const designEngineeringLibrary = [
  {
    id: "arduino-docs",
    title: "Arduino Documentation",
    source: "Arduino",
    type: "Official documentation",
    url: "https://docs.arduino.cc/",
    tags: ["arduino", "electronics", "hardware", "code", "pins", "board"],
    purpose: "Check board, pin, library and sketch details.",
  },
  {
    id: "wokwi",
    title: "Wokwi Arduino Simulator",
    source: "Wokwi",
    type: "Interactive simulator",
    url: "https://wokwi.com/projects/new/arduino-uno",
    tags: ["arduino", "electronics", "hardware", "wiring", "simulation", "code"],
    purpose: "Test a circuit and sketch before changing the physical build.",
  },
  {
    id: "sparkfun",
    title: "SparkFun Learn",
    source: "SparkFun",
    type: "Component guide",
    url: "https://learn.sparkfun.com/",
    tags: ["electronics", "hardware", "sensor", "motor", "power", "wiring"],
    purpose: "Use component-specific guides to check wiring, power and measurements.",
  },
  {
    id: "adafruit",
    title: "Adafruit Learning System",
    source: "Adafruit",
    type: "Build guide",
    url: "https://learn.adafruit.com/",
    tags: ["electronics", "hardware", "sensor", "motor", "debug", "wiring"],
    purpose: "Compare a focused build guide with the evidence from your own setup.",
  },
  {
    id: "fusion",
    title: "Autodesk Fusion Learning",
    source: "Autodesk",
    type: "Official tutorial",
    url: "https://help.autodesk.com/view/fusion360/ENU/courses/",
    tags: ["cad", "fusion", "model", "assembly", "manufacture", "mechanical"],
    purpose: "Learn a focused modelling, assembly or fabrication operation.",
  },
  {
    id: "rhino",
    title: "Rhino Learn",
    source: "McNeel",
    type: "Official tutorial",
    url: "https://www.rhino3d.com/learn/",
    tags: ["cad", "rhino", "model", "surface", "render"],
    purpose: "Find a specific Rhino operation without leaving the project context behind.",
  },
  {
    id: "mit-design-manufacturing",
    title: "MIT OpenCourseWare: Engineering",
    source: "MIT OpenCourseWare",
    type: "Concept reference",
    url: "https://ocw.mit.edu/search/?d=Engineering",
    tags: ["mechanical", "manufacture", "materials", "mechanism", "design", "feasibility"],
    purpose: "Ground a design or manufacturing decision in engineering principles.",
  },
  {
    id: "ideo-methods",
    title: "IDEO Design Kit Methods",
    source: "IDEO",
    type: "Design method",
    url: "https://www.designkit.org/methods",
    tags: ["design", "interaction", "user", "research", "concept", "evaluation"],
    purpose: "Choose a lightweight method for framing, testing or evaluating a design decision.",
  },
  {
    id: "nngroup",
    title: "NN/g Articles",
    source: "Nielsen Norman Group",
    type: "Research reference",
    url: "https://www.nngroup.com/articles/",
    tags: ["interaction", "user", "research", "evaluation", "usability"],
    purpose: "Turn a user-facing assumption into a practical evaluation question.",
  },
];

function getTaskLibraryResources(stage, check = {}) {
  const context = [
    state.projectGoal,
    state.learningContent,
    state.projectMaterial,
    state.selectedTaskName,
    getStageDisplayTitle(stage),
    stage.planStep?.detail,
    check.text,
    check.hint,
  ].filter(Boolean).join(" ").toLowerCase();
  const scored = designEngineeringLibrary.map((resource) => {
    const score = resource.tags.reduce((total, tag) => total + (context.includes(tag) ? 1 : 0), 0);
    return { resource, score };
  }).filter((item) => item.score > 0);
  const fallback = designEngineeringLibrary.filter((resource) => ["ideo-methods", "mit-design-manufacturing"].includes(resource.id));
  return [...scored.sort((a, b) => b.score - a.score).map((item) => item.resource), ...fallback]
    .filter((resource, index, items) => items.findIndex((item) => item.id === resource.id) === index)
    .slice(0, 3);
}

function renderTaskLibraryResources(stage, check) {
  const resources = getTaskLibraryResources(stage, check);
  if (!resources.length) return "";
  return `
    <section class="task-library" aria-label="Relevant learning resources">
      <div class="task-library-head"><span aria-hidden="true">↗</span><strong>Relevant resources</strong></div>
      <div class="task-library-list">
        ${resources.map((resource) => `
          <a class="task-library-link" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer" data-library-resource="${escapeHtml(resource.id)}" data-library-check="${escapeHtml(check.id || "")}">
            <span><b>${escapeHtml(resource.title)}</b><small>${escapeHtml(resource.source)} · ${escapeHtml(resource.type)}</small></span>
            <em title="${escapeHtml(resource.purpose)}">Open ↗</em>
          </a>
        `).join("")}
      </div>
    </section>`;
}

function recordLibraryResourceUse(resourceId, stage, checkId = "") {
  const resource = designEngineeringLibrary.find((item) => item.id === resourceId);
  if (!resource) return;
  const record = state.records[stage.key] ||= {};
  record.resources ||= [];
  if (!record.resources.some((item) => item.id === resource.id)) {
    record.resources.push({ id: resource.id, title: resource.title, source: resource.source, usedAt: new Date().toISOString(), checkId });
  }
  state.userActions.push({
    stage: getStageDisplayTitle(stage),
    option: "Learning resource",
    reply: `Opened ${resource.source}: ${resource.title}`,
    type: "resource",
    time: new Date().toISOString(),
  });
  updateKnowledgeFromStage(stage, "learning", `Opened ${resource.source}: ${resource.title}`);
  persistTaskProgress();
  scheduleWorkspaceSave();
}

// Keep the empty-state coach free from the old generic reflection template too.
stageReasoningChains = Object.fromEntries(stages.map((stage) => [stage.key, buildDecisionFocusedReasoningChain(stage)]));

const scaffoldSettingMeta = {
  density: {
    light: { value: 20, label: "Light", summary: "2–3 Thinking nodes" },
    standard: { value: 50, label: "Standard", summary: "6–7 Thinking nodes" },
    detailed: { value: 84, label: "Detailed", summary: "8–14 Thinking nodes" },
  },
  depth: {
    foundation: { label: "Foundation" },
    applied: { label: "Applied" },
    system: { label: "System" },
  },
  scope: {
    focused: { label: "Focused" },
    balanced: { label: "Balanced" },
    expanded: { label: "Expanded" },
  },
};

const scaffoldPresetMeta = {
  light: {
    density: "light",
    depth: "foundation",
    scope: "focused",
  },
  standard: {
    density: "standard",
    depth: "applied",
    scope: "balanced",
  },
  detailed: {
    density: "detailed",
    depth: "system",
    scope: "expanded",
  },
};

const demoDefineContext = {
  projectMaterial: `Project context:
This project is an AI-supported adaptive learning scaffold for higher education design engineering students. It is explored as a lightweight desktop learning companion coach that appears beside students' independent learning environment outside formal teaching.

Target scenario:
Design engineering students often use online tutorials, software documentation, AI-generated explanations and AI outputs when working on project-based learning tasks. The key challenge is not access to information, but how students judge whether external resources or AI outputs fit their own project goal, constraints, evidence needs and trade-offs.

Core gap:
Students need support to translate external learning resources and AI-generated outputs into project-specific, reasoned design decisions. The scaffold should guide students to build their own reasoning process before deciding the next project action.

Prototype focus:
The current prototype focuses on the reasoning-build interaction. It should help students identify what they are learning, why it matters to their project, what assumptions or constraints need checking, what evidence is missing, and what next action they should choose themselves.`,
  projectGoal: "Design and test a lightweight desktop reasoning coach that helps design engineering students build project-based reasoning before making design decisions.",
  learningContent: "I want to learn how to structure the reasoning-build interaction so students can connect learning content or AI output with project goals, constraints, evidence and trade-offs.",
  learningType: "Tool step",
};

const tourExampleContext = {
  projectName: "Tutorial: obstacle-avoiding robot car",
  taskName: "Test obstacle detection and stopping",
  materialName: "Obstacle-avoiding car brief",
  projectMaterial: `Tutorial example: Arduino obstacle-avoiding robot car.

Build a small robot car that detects an obstacle with an HC-SR04 ultrasonic sensor and stops before contact. Arduino Uno reads the distance signal, an L298N driver controls two DC motors, and the motor battery shares ground with the Arduino.

The first proof is simple: distance values change as an object moves closer, and the motors stop when the object is within 20 cm. Check the sensor pins, motor-control pins, common ground and stopping threshold before adding a turning behaviour.`,
  projectGoal: "Make an Arduino robot car detect an obstacle and stop reliably before contact.",
  learningContent: "I want to learn how ultrasonic distance sensing, motor control and a distance threshold work together in an obstacle-avoidance behaviour.",
  learningTypes: ["Concept", "Tool step", "Technical detail"],
};

for (const stage of stages) {
  state.records[stage.key] = {
    label: "",
    selected: "",
    note: "",
    missingEvidence: [],
    possiblePaths: [],
  };
  state.chainIndexes[stage.key] = 0;
  state.openChainKeys[stage.key] = "";
  state.chainRecords[stage.key] = {};
  state.coachTurns[stage.key] = 0;
  for (const item of stageReasoningChains[stage.key]) {
    state.chainRecords[stage.key][item.key] = {
      selected: "",
      note: "",
      tool: "",
      coachNote: "",
      coachNoteType: "",
      nextCheck: "",
      nextCheckPinned: false,
      coachOptions: [],
      coachFeedback: "",
      coachNoteOpen: true,
      coachPath: "",
      coachNoteLoading: false,
      saved: false,
      draftDirty: false,
      saveHint: false,
    };
  }
}

let currentStageIndex = 0;
let planGenerationToken = 0;

const setupPanel = document.getElementById("setupPanel");
const homePanel = document.getElementById("homePanel");
const planPanel = document.getElementById("planPanel");
const generatingPanel = document.getElementById("generatingPanel");
const headerMark = document.getElementById("headerMark");
const headerTitle = document.getElementById("headerTitle");
const headerSubtitle = document.getElementById("headerSubtitle");
const pathPanel = document.getElementById("pathPanel");
const stepPanel = document.getElementById("stepPanel");
const interactionArea = document.getElementById("interactionArea");
const stageController = document.getElementById("stageController");
const pathNodes = document.getElementById("pathNodes");
const pathEditButton = document.getElementById("pathEditButton");
const stepCount = document.getElementById("stepCount");
const stepLabel = document.getElementById("stepLabel");
const stepTitle = document.getElementById("stepTitle");
const stepPrompt = document.getElementById("stepPrompt");
const nextButton = document.getElementById("nextButton");
const generateButton = document.getElementById("generateButton");
const newProjectButton = document.getElementById("newProjectButton");
const startButton = document.getElementById("startButton");
const regeneratePlanButton = document.getElementById("regeneratePlanButton");
const changeStartButton = document.getElementById("changeStartButton");
const backToHomeButton = document.getElementById("backToHomeButton");
const confirmPlanButton = document.getElementById("confirmPlanButton");
const backToSetupButton = document.getElementById("backToSetupButton");
const supportLensButton = document.getElementById("supportLensButton");
const supportLensModal = document.getElementById("supportLensModal");
const closeSupportLens = document.getElementById("closeSupportLens");
const supportLensContext = document.getElementById("supportLensContext");
const supportLensFlow = document.getElementById("supportLensFlow");
const settingsButton = document.getElementById("settingsButton");
const modeToggle = document.getElementById("modeToggle");
const coachButton = document.getElementById("coachButton");
const coachInput = document.getElementById("coachInput");
const coachResponse = document.getElementById("coachResponse");
const coachText = document.getElementById("coachText");
const coachQuestion = document.getElementById("coachQuestion");
const coachOptions = document.getElementById("coachOptions");
const coachTurns = document.getElementById("coachTurns");
const coachReplyInput = document.getElementById("coachReplyInput");
const coachReplyButton = document.getElementById("coachReplyButton");
const coachDismissButton = document.getElementById("coachDismissButton");
const askRow = coachInput.closest(".ask-row");
const rationaleText = document.getElementById("rationaleText");
const coachFooter = document.getElementById("coachFooter");
const quickTagButtons = Array.from(document.querySelectorAll("[data-learning-type]"));
const emptyStartGuide = document.getElementById("emptyStartGuide");
const emptyCreateProjectButton = document.getElementById("emptyCreateProjectButton");
const emptyDemoButton = document.getElementById("emptyDemoButton");
const homeProductPreview = document.getElementById("homeProductPreview");
const learningHistory = document.getElementById("learningHistory");
const knowledgeMapFilter = document.getElementById("knowledgeMapFilter");
const knowledgeMapFilterToggle = document.getElementById("knowledgeMapFilterToggle");
const knowledgeMapFilterLabel = document.getElementById("knowledgeMapFilterLabel");
const knowledgeMapFilterOptions = document.getElementById("knowledgeMapFilterOptions");
const knowledgeMapFilterButtons = Array.from(document.querySelectorAll("[data-map-filter]"));
const knowledgeMapSummary = document.getElementById("knowledgeMapSummary");
const knowledgeMapCanvas = document.getElementById("knowledgeMapCanvas");
const knowledgeNodeDetail = document.getElementById("knowledgeNodeDetail");
const openKnowledgeMap = document.getElementById("openKnowledgeMap");
const knowledgeMapModal = document.getElementById("knowledgeMapModal");
const closeKnowledgeMap = document.getElementById("closeKnowledgeMap");
const expandedMapFilterButtons = Array.from(document.querySelectorAll("[data-expanded-map-filter]"));
const knowledgeMapExpandedSummary = document.getElementById("knowledgeMapExpandedSummary");
const knowledgeMapExpandedCanvas = document.getElementById("knowledgeMapExpandedCanvas");
const knowledgeMapExpandedDetail = document.getElementById("knowledgeMapExpandedDetail");
const showWeakNodes = document.getElementById("showWeakNodes");
const showEvidenceBank = document.getElementById("showEvidenceBank");
const mapReviewList = document.getElementById("mapReviewList");
const previewCaptionTitle = document.getElementById("previewCaptionTitle");
const previewCaptionMeta = document.getElementById("previewCaptionMeta");
const introSlideButtons = Array.from(document.querySelectorAll("[data-intro-slide]")).filter((node) => node.tagName === "BUTTON");
const generationStatus = document.getElementById("generationStatus");
const generationFailure = document.getElementById("generationFailure");
const generationFailureTitle = document.getElementById("generationFailureTitle");
const generationFailureText = document.getElementById("generationFailureText");
const generationFailureSettings = document.getElementById("generationFailureSettings");
const generationFailureRetry = document.getElementById("generationFailureRetry");
const generationFailureUseBasic = document.getElementById("generationFailureUseBasic");
const projectFileInput = document.getElementById("projectFile");
const projectGoalInput = document.getElementById("projectGoal");
const learningContentInput = document.getElementById("learningContent");
const setupMaterialList = document.getElementById("setupMaterialList");
const planSteps = document.getElementById("planSteps");
const planDetail = document.getElementById("planDetail");
const planEditButton = document.getElementById("planEditButton");
const allowBox = document.getElementById("allowBox");
const startFromText = document.getElementById("startFromText");
const startOptions = document.getElementById("startOptions");
const generationTemperatureInput = document.getElementById("generationTemperature");
const explorationTemperatureInput = document.getElementById("explorationTemperature");
const planTuningLabel = document.getElementById("planTuningLabel");
const resultPanel = document.getElementById("resultPanel");
const resultChoiceGrid = document.getElementById("resultChoiceGrid");
const resultDecisionCheck = document.getElementById("resultDecisionCheck");
const resultNextMoveGuidance = document.getElementById("resultNextMoveGuidance");
const resultNextLabel = document.getElementById("resultNextLabel");
const resultNextSummary = document.getElementById("resultNextSummary");
const resultNextOptions = document.getElementById("resultNextOptions");
const resultNextBoundaries = document.getElementById("resultNextBoundaries");
const resultNextEvidence = document.getElementById("resultNextEvidence");
const resultNextRevisit = document.getElementById("resultNextRevisit");
const resultRationale = document.getElementById("resultRationale");
const resultEvidenceList = document.getElementById("resultEvidenceList");
const resultOutcomeTitle = document.getElementById("resultOutcomeTitle");
const resultOutcomeSummary = document.getElementById("resultOutcomeSummary");
const resultOutcomeLabel = document.getElementById("resultOutcomeLabel");
const resultBackButton = document.getElementById("resultBackButton");
const resultEditLogic = document.getElementById("resultEditLogic");
const resultSaveButton = document.getElementById("resultSaveButton");
const resultPreviewButton = document.getElementById("resultPreviewButton");
const resultExportButton = document.getElementById("resultExportButton");
const resultGuidanceButton = document.getElementById("resultGuidanceButton");
const resultPreviewWrap = document.getElementById("resultPreviewWrap");
const resultTaskPreview = document.getElementById("resultTaskPreview");
const resultPreviewClose = document.getElementById("resultPreviewClose");
const resultAiEditButton = document.getElementById("resultAiEditButton");
const resultAiEditor = document.getElementById("resultAiEditor");
const resultAiMessages = document.getElementById("resultAiMessages");
const resultAiInput = document.getElementById("resultAiInput");
const resultAiSend = document.getElementById("resultAiSend");
const resultAiApply = document.getElementById("resultAiApply");
const resultSaveStatus = document.getElementById("resultSaveStatus");
const mainEntryButtons = Array.from(document.querySelectorAll("[data-main-entry]"));
const homeTabSections = Array.from(document.querySelectorAll("[data-home-tab]"));
const onboardingOverlay = document.getElementById("onboardingOverlay");
const onboardingIntro = document.getElementById("onboardingIntro");
const learnerSetup = document.getElementById("learnerSetup");
const onboardingStartSetup = document.getElementById("onboardingStartSetup");
const onboardingSkipSetup = document.getElementById("onboardingSkipSetup");
const onboardingContinue = document.getElementById("onboardingContinue");
const productTour = document.getElementById("productTour");
const tourCount = document.getElementById("tourCount");
const tourCopy = document.getElementById("tourCopy");
const tourSpotlight = document.getElementById("tourSpotlight");
const tourSecondarySpotlights = document.getElementById("tourSecondarySpotlights");
const tourDots = document.getElementById("tourDots");
const tourSkip = document.getElementById("tourSkip");
const tourBack = document.getElementById("tourBack");
const tourNext = document.getElementById("tourNext");
const quickSkillInputs = Array.from(document.querySelectorAll("#onboardingOverlay .quick-skill-row input"));
const profileYearButtons = Array.from(document.querySelectorAll("[data-profile-year]"));
const profileFocusButtons = Array.from(document.querySelectorAll("[data-profile-focus]"));
const profileIdentity = document.getElementById("profileIdentity");
const profileTags = document.getElementById("profileTags");
const profileStats = document.getElementById("profileStats");
const profileRadar = document.getElementById("profileRadar");
const profileCapabilitySignal = document.getElementById("profileCapabilitySignal");
const profileSkillList = document.getElementById("profileSkillList");
const editProfileButton = document.getElementById("editProfileButton");
const profileEditPanel = document.getElementById("profileEditPanel");
const profileYearSelect = document.getElementById("profileYearSelect");
const profileFocusPicker = document.getElementById("profileFocusPicker");
const saveProfileButton = document.getElementById("saveProfileButton");
const addProfileSkillButton = document.getElementById("addProfileSkillButton");
const profileSkillForm = document.getElementById("profileSkillForm");
const profileSkillName = document.getElementById("profileSkillName");
const profileSkillLevel = document.getElementById("profileSkillLevel");
const saveProfileSkillButton = document.getElementById("saveProfileSkillButton");
const mainNavToggle = document.getElementById("mainNavToggle");
const mainEntryNav = document.querySelector(".main-entry-nav");
const projectShelf = document.getElementById("projectShelf");
const projectDetail = document.getElementById("projectDetail");
const uploadedFiles = document.getElementById("uploadedFiles");
const addMaterialButton = document.getElementById("addMaterialButton");
const createTaskButton = document.getElementById("createTaskButton");
const taskProjectName = document.getElementById("taskProjectName");
const projectGoalField = projectGoalInput.closest(".setup-field");
const learningContentField = learningContentInput.closest(".setup-field");
const learningTypeLabel = document.querySelector(".tag-label");
const quickTagsContainer = document.querySelector(".quick-tags");
const generationTuning = document.querySelector(".generation-tuning");
const materialLabel = setupPanel.querySelector(".upload-heading strong");
const introSlideOrder = ["upload", "plan", "chain", "result"];
let introSlideTimer = null;
const WORKSPACE_STORAGE_KEY = "reasoning-coach-workspace-v1";
const ONBOARDING_VERSION = 2;
let workspaceSaveTimer = null;
let workspaceResetInProgress = false;

function datasetSnapshot(element) {
  return Object.fromEntries(Object.entries(element?.dataset || {}));
}

function compactStateForStorage() {
  return JSON.parse(JSON.stringify(state, (_key, value) => {
    if (typeof value === "string" && value.startsWith("data:image/") && value.length > 700000) return "";
    return value;
  }));
}

function captureWorkspace() {
  const projects = Array.from(projectShelf.querySelectorAll(".project-file:not(.create-project-file)")).map((project) => {
    const taskList = document.getElementById(project.dataset.taskListId);
    return {
      data: datasetSnapshot(project),
      tasks: Array.from(taskList?.querySelectorAll(".task-row") || []).map((task) => ({
        data: datasetSnapshot(task),
        status: task.querySelector("small")?.textContent || "Set up task",
      })),
    };
  });
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    state: compactStateForStorage(),
    activeProject: getActiveProjectFile()?.dataset.projectName || "",
    activeTask: getActiveTaskRow()?.dataset.taskName || "",
    projects,
  };
}

function saveWorkspaceNow() {
  if (workspaceResetInProgress) return;
  if (state.productTourComplete === false && productTour && !productTour.hidden) return;
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(captureWorkspace()));
  } catch (error) {
    console.warn("Could not save local workspace.", error);
  }
}

function scheduleWorkspaceSave() {
  window.clearTimeout(workspaceSaveTimer);
  workspaceSaveTimer = window.setTimeout(saveWorkspaceNow, 450);
}

function restoredTaskRow(taskData) {
  const task = document.createElement("div");
  task.className = "task-row";
  task.setAttribute("role", "button");
  task.setAttribute("tabindex", "0");
  Object.assign(task.dataset, taskData.data || {});
  const name = task.dataset.taskName || "New learning task";
  task.setAttribute("aria-label", name);
  task.innerHTML = `
    <svg class="task-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h9l3 3v13H6z" /><path d="M14 4v4h4" /><path d="M9 12h6" /><path d="M9 16h4" /></svg>
    <span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(taskData.status || "Set up task")}</small></span>
    <button class="task-edit" type="button" aria-label="Edit task name" title="Edit task name"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.2 2.2 0 0 0-3.1-3.1L5 16.8 4 20Z" /><path d="M14 7l3 3" /></svg><em>Rename task</em></button>
    <em class="task-status" aria-hidden="true">›</em>`;
  return task;
}

function restoreWorkspace() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(WORKSPACE_STORAGE_KEY) || "null"); } catch { return; }
  if (!saved || saved.version !== 1 || !saved.state) return;
  const restoredState = saved.state;
  Array.from(projectShelf.querySelectorAll(".project-file:not(.create-project-file)")).forEach((project) => project.remove());
  Array.from(projectDetail.querySelectorAll(".task-list")).forEach((list) => list.remove());
  (saved.projects || []).forEach((projectData, index) => {
    const project = document.createElement("div");
    project.className = "project-file";
    project.setAttribute("role", "button");
    project.setAttribute("tabindex", "0");
    Object.assign(project.dataset, projectData.data || {});
    if (!project.dataset.taskListId) project.dataset.taskListId = `restored-task-list-${index}`;
    const name = project.dataset.projectName || `Untitled project ${index + 1}`;
    project.dataset.projectName = name;
    project.setAttribute("aria-label", name);
    project.innerHTML = `<i></i><span><strong>${escapeHtml(name)}</strong><small>0 tasks</small></span><button class="project-edit" type="button" aria-label="Edit project name" title="Edit project name"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.2 2.2 0 0 0-3.1-3.1L5 16.8 4 20Z" /><path d="M14 7l3 3" /></svg><em>Rename project</em></button>`;
    projectShelf.appendChild(project);
    const taskList = document.createElement("div");
    taskList.className = "task-list";
    taskList.id = project.dataset.taskListId;
    taskList.hidden = true;
    (projectData.tasks || []).forEach((taskData) => taskList.appendChild(restoredTaskRow(taskData)));
    projectDetail.appendChild(taskList);
    updateProjectTaskCount(project);
    ensureTaskEmptyState(project);
  });
  const project = Array.from(projectShelf.querySelectorAll(".project-file")).find((item) => item.dataset.projectName === saved.activeProject) || projectShelf.querySelector(".project-file");
  if (project) {
    selectProjectFile(project);
    const task = Array.from(projectDetail.querySelectorAll(".task-row")).find((item) => item.dataset.taskName === saved.activeTask) || projectDetail.querySelector(".task-row");
    if (task) {
      selectTaskRow(task);
      state.projectGoal = task.dataset.projectGoal || "";
      state.learningContent = task.dataset.learningContent || "";
      try { state.learningType = JSON.parse(task.dataset.learningType || "[]"); } catch { state.learningType = []; }
      projectGoalInput.value = state.projectGoal;
      learningContentInput.value = state.learningContent;
      quickTagButtons.forEach((button) => button.classList.toggle("selected", state.learningType.includes(button.dataset.learningType)));
      try {
        const plan = JSON.parse(task.dataset.generatedPlan || "null");
        if (plan?.steps?.length) renderGeneratedPlan(plan);
      } catch { /* The task remains usable even if an older saved plan is malformed. */ }
    }
  }
  Object.assign(state, restoredState, { agentStatus: { checked: false, online: false, hasApiKey: false, model: "", error: "" } });
  if (!Number.isFinite(Number(restoredState.explorationLevel))) {
    state.explorationLevel = explorationValueFromScope(restoredState.explorationScope);
  }
  if (!restoredState.scaffoldPreset) state.scaffoldPreset = densityKeyFromValue(state.informationDensity);
  if (state.onboardingVersion !== ONBOARDING_VERSION) {
    state.onboardingComplete = false;
    state.productTourComplete = false;
    state.productTourStep = 0;
  }
  state.view = "home";
  // Restore the learner's work, but always reopen at the project entry point.
  // Landing directly on a previous Knowledge Map makes the application look
  // unfinished and disconnects the starting screen from its primary action.
  state.homeTab = "new";
  if (state.onboardingComplete) {
    document.body.classList.remove("onboarding-active");
    onboardingOverlay.classList.add("hidden");
  }
  updateEmptyStartGuide();
}

document.body.classList.add("compact-mode", "bookmarks-expanded", "onboarding-active");
mainNavToggle.setAttribute("aria-label", "Home, hide entries");
mainNavToggle.setAttribute("title", "Home / hide");

const viewFlow = [
  {
    key: "home",
    label: "Home",
    mark: "Reasoning Coach",
    title: "Start learning",
    subtitle: "Choose how you want to begin.",
  },
  {
    key: "setup",
    label: "Project Context",
    mark: "New Project",
    title: "Define context",
    subtitle: "Give the coach enough project information before guidance starts.",
  },
  {
    key: "generating",
    label: "Generating",
    mark: "AI Planning",
    title: "Generating plan",
    subtitle: "The coach is adapting the scaffold to your project.",
  },
  {
    key: "plan",
    label: "Learning Plan",
    mark: "Generated Plan",
    title: "Review learning plan",
    subtitle: "Confirm the learning-to-decision path and suggested first step.",
  },
  {
    key: "flow",
    label: "Coach",
    mark: "Reasoning Coach",
    title: "Build your logic",
    subtitle: "Use reasoning chains to move from learning content to project decisions.",
  },
  {
    key: "result",
    label: "Decision Record",
    mark: "Student-owned result",
    title: "Decision record",
    subtitle: "Confirm, revise and save the next project action in your own words.",
  },
];

newProjectButton.addEventListener("click", () => createProjectFile());
emptyCreateProjectButton.addEventListener("click", () => createProjectFile());
if (emptyDemoButton) emptyDemoButton.addEventListener("click", () => createDemoProject());
introSlideButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setIntroSlide(button.dataset.introSlide);
    startIntroSlideAutoplay();
  });
});
addMaterialButton.addEventListener("click", () => {
  if (!getActiveProjectFile()) createProjectFile();
  openProjectMaterialPicker();
});

projectShelf.addEventListener("click", (event) => {
  if (event.target.closest("input")) return;
  const editButton = event.target.closest(".project-edit");
  if (editButton) {
    event.stopPropagation();
    const projectFile = editButton.closest(".project-file");
    if (projectFile) startProjectRename(projectFile);
    return;
  }
  const projectFile = event.target.closest(".project-file");
  if (!projectFile || projectFile.classList.contains("create-project-file")) return;
  if (projectFile.classList.contains("active")) {
    collapseProjectFile(projectFile);
  } else {
    selectProjectFile(projectFile);
  }
});

projectShelf.addEventListener("keydown", (event) => {
  const projectFile = event.target.closest(".project-file");
  if (!projectFile || projectFile.classList.contains("create-project-file")) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (projectFile.classList.contains("active")) collapseProjectFile(projectFile);
    else selectProjectFile(projectFile);
  }
});

projectDetail.addEventListener("click", (event) => {
  event.stopPropagation();
  if (event.target.closest("input")) return;
  if (event.target.closest("[data-create-task]")) {
    createTaskForActiveProject();
    return;
  }
  const editButton = event.target.closest(".task-edit");
  if (editButton) {
    event.stopPropagation();
    const taskRow = editButton.closest(".task-row");
    if (taskRow) startTaskRename(taskRow);
    return;
  }
  const taskRow = event.target.closest(".task-row");
  if (taskRow) {
    beginTaskContext(taskRow);
  }
});

createTaskButton.addEventListener("click", createTaskForActiveProject);

function createTaskForActiveProject(options = {}) {
  const activeProject = getActiveProjectFile();
  if (!activeProject) {
    createProjectFile();
    return null;
  }
  const taskName = String(options.taskName || nextTaskName(activeProject)).trim() || nextTaskName(activeProject);
  const taskRow = document.createElement("div");
  taskRow.className = "task-row";
  taskRow.setAttribute("role", "button");
  taskRow.setAttribute("tabindex", "0");
  taskRow.setAttribute("aria-label", taskName);
  taskRow.dataset.taskName = taskName;
  taskRow.dataset.projectGoal = String(options.projectGoal || "");
  taskRow.dataset.learningContent = String(options.learningContent || "");
  taskRow.dataset.learningType = JSON.stringify(Array.isArray(options.learningType) ? options.learningType : []);
  taskRow.dataset.generatedFingerprint = "";
  taskRow.dataset.generatedPlan = "";
  taskRow.dataset.taskProgress = "";
  taskRow.innerHTML = `
    <svg class="task-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6z" />
      <path d="M14 4v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
    <span><strong>${escapeHtml(taskName)}</strong><small>Set up task</small></span>
    <button class="task-edit" type="button" aria-label="Edit task name" title="Edit task name">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4l10.5-10.5a2.2 2.2 0 0 0-3.1-3.1L5 16.8 4 20Z" />
        <path d="M14 7l3 3" />
      </svg>
      <em>Rename task</em>
    </button>
    <em class="task-status" aria-hidden="true">›</em>
  `;
  const taskList = document.getElementById(activeProject.dataset.taskListId);
  taskList.querySelector(".empty-task-action")?.remove();
  taskList.appendChild(taskRow);
  updateProjectTaskCount(activeProject);
  selectTaskRow(taskRow);
  state.selectedTaskName = taskName;
  if (options.projectGoal || options.learningContent || options.learningType) {
    state.projectGoal = taskRow.dataset.projectGoal;
    state.learningContent = taskRow.dataset.learningContent;
    try { state.learningType = JSON.parse(taskRow.dataset.learningType || "[]"); } catch { state.learningType = []; }
    projectGoalInput.value = state.projectGoal;
    learningContentInput.value = state.learningContent;
    quickTagButtons.forEach((item) => item.classList.toggle("selected", state.learningType.includes(item.dataset.learningType)));
  } else {
    clearSetupInputsForNewTask();
  }
  resetGeneratedPlanState();
  if (!options.skipRename) window.setTimeout(() => startTaskRename(taskRow), 80);
  scheduleWorkspaceSave();
  return taskRow;
}

projectDetail.addEventListener("keydown", (event) => {
  event.stopPropagation();
  const taskRow = event.target.closest(".task-row");
  if (!taskRow || event.target.closest(".task-edit") || event.target.closest("input")) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    beginTaskContext(taskRow);
  }
});

mainEntryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!state.onboardingComplete) return;
    const entry = button.dataset.mainEntry;
    if (entry === "new") {
      state.homeTab = "new";
      setView("home");
      return;
    }
    state.homeTab = entry;
    setView("home");
  });
});

let homeTourClickCount = 0;
let homeTourClickTimer = null;

function restartProductTourFromHome() {
  state.productTourComplete = false;
  state.productTourStep = 0;
  resetAfterProductTour();
  openProductTour();
}

function resetTestParticipantFromHome() {
  // The facilitator reset clears only this participant's browser workspace.
  // The API key remains in the native desktop settings store for the next test.
  workspaceResetInProgress = true;
  window.clearTimeout(workspaceSaveTimer);
  localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  window.location.reload();
}

mainNavToggle.addEventListener("click", () => {
  if (!state.onboardingComplete) return;
  homeTourClickCount += 1;
  window.clearTimeout(homeTourClickTimer);
  if (homeTourClickCount >= 4) {
    homeTourClickCount = 0;
    resetTestParticipantFromHome();
    return;
  }
  homeTourClickTimer = window.setTimeout(() => {
    if (homeTourClickCount === 3) restartProductTourFromHome();
    homeTourClickCount = 0;
  }, 1500);
  document.body.classList.toggle("bookmarks-expanded");
  const expanded = document.body.classList.contains("bookmarks-expanded");
  mainNavToggle.setAttribute("aria-label", expanded ? "Home, hide entries" : "Home, show entries");
  mainNavToggle.setAttribute("title", expanded ? "Home / hide" : "Home / show");
});

startButton.addEventListener("click", async () => {
  if (state.setupPurpose === "material") {
    saveMaterialAndReturn();
    return;
  }
  saveCurrentTaskContext();
  loadActiveProjectMaterialIntoState();
  state.projectGoal = projectGoalInput.value.trim() || state.projectGoal || "A design engineering project that needs independent learning support.";
  state.learningContent = learningContentInput.value.trim() || state.learningContent || "External learning content or AI-generated output.";
  state.learningType = selectedLearningTypes();
  syncGenerationSetting();
  setView("generating");
  await generateAndRenderPlan();
});

regeneratePlanButton.addEventListener("click", generateAndRenderPlan);
planEditButton?.addEventListener("click", () => openPlanEditor());
pathEditButton?.addEventListener("click", () => openPlanEditorFromFlow());
generationFailureSettings?.addEventListener("click", () => window.coachDesktop?.openSettings?.());
generationFailureRetry?.addEventListener("click", () => generateAndRenderPlan());
generationFailureUseBasic?.addEventListener("click", () => acceptBasicPlan());
generationTemperatureInput.addEventListener("input", () => setThinkingDetail(generationTemperatureInput.value));
explorationTemperatureInput?.addEventListener("input", () => setExplorationLevel(explorationTemperatureInput.value));
changeStartButton.addEventListener("click", () => {
  const expanded = startOptions.hidden;
  startOptions.hidden = !expanded;
  changeStartButton.textContent = expanded ? "Hide" : "Change";
});

function densityKeyFromValue(value = state.informationDensity) {
  const numeric = Number(value || 50);
  if (numeric < 34) return "light";
  if (numeric > 66) return "detailed";
  return "standard";
}

function explorationScopeFromValue(value = state.explorationLevel) {
  const numeric = Math.max(0, Math.min(100, Number(value ?? 50)));
  if (numeric < 34) return "focused";
  if (numeric > 66) return "expanded";
  return "balanced";
}

function explorationValueFromScope(scope = "balanced") {
  if (scope === "focused") return 20;
  if (scope === "expanded") return 80;
  return 50;
}

function thinkingNodeBaseCount(value = state.informationDensity, complexity = null) {
  const numeric = Math.max(0, Math.min(100, Number(value ?? 50)));
  const resolvedComplexity = complexity || inferPlanComplexity(
    `${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`,
    selectedLearningTypes(),
  );
  const maximum = resolvedComplexity.label === "Simple" ? 7
    : resolvedComplexity.label === "Medium" ? 10
      : 14;
  return Math.max(2, Math.min(maximum, Math.round(2 + numeric / 100 * (maximum - 2))));
}

function explorationLabelFromValue(value = state.explorationLevel) {
  const numeric = Math.max(0, Math.min(100, Number(value ?? 50)));
  if (numeric < 20) return "Focused";
  if (numeric < 40) return "Selective";
  if (numeric < 60) return "Balanced";
  if (numeric < 80) return "Broad";
  return "Expanded";
}

function automaticKnowledgeDepth() {
  const year = String(state.learnerProfile?.year || "").toLowerCase();
  const averageSkill = averageProfileSkill();
  if (/year 1|year 2|foundation|first|second/.test(year) || averageSkill < 38) return "foundation";
  if (/postgraduate|master|year 4|fourth/.test(year) || averageSkill >= 72) return "system";
  return "applied";
}

function averageProfileSkill() {
  const values = Object.values(state.learnerProfile?.skills || {}).map(Number).filter(Number.isFinite);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 45;
}

function learnerProfileGenerationBrief() {
  const profile = state.learnerProfile || {};
  const year = String(profile.year || "").trim();
  const averageSkill = Math.round(averageProfileSkill());
  const earlyStage = /year 1|year 2|foundation|first|second/i.test(year) || averageSkill < 38;
  const advancedStage = /year 4|fourth|postgraduate|master/i.test(year) || averageSkill >= 72;
  const supportMode = earlyStage ? "foundation" : advancedStage ? "advanced" : "applied";
  const skills = Object.entries(profile.skills || {})
    .map(([name, value]) => ({ name, confidence: Math.max(0, Math.min(100, Number(value) || 0)) }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    discipline: profile.discipline || "Design engineering",
    year_of_study: year || "not provided",
    learning_focus: Array.isArray(profile.focus) ? profile.focus.filter(Boolean) : [],
    self_rated_skills: skills,
    average_skill_confidence: averageSkill,
    inferred_support_mode: supportMode,
    adaptation_rule: supportMode === "foundation"
      ? "Explain necessary principles in plain language, use smaller safe checks, and make prerequisite dependencies visible."
      : supportMode === "advanced"
        ? "Assume baseline fluency where the profile supports it; foreground system dependencies, trade-offs, overlooked constraints and validation strategy."
        : "Connect concepts to project use, make constraints and evidence explicit, and leave room for student-led alternatives.",
  };
}

function getRecommendedScaffoldSettings() {
  const complexity = inferPlanComplexity(
    `${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`,
    selectedLearningTypes(),
  ).label;
  const year = String(state.learnerProfile?.year || "").toLowerCase();
  const averageSkill = averageProfileSkill();
  const earlyStudy = /year 1|year 2|foundation|first|second/.test(year) || averageSkill < 38;
  const advancedStudy = /postgraduate|master|year 4|fourth/.test(year) || averageSkill >= 72;
  const complex = complexity === "Complex" || complexity === "Enterprise";
  const simple = complexity === "Simple";
  const preset = earlyStudy && simple ? "light" : advancedStudy && complex ? "detailed" : "standard";
  return {
    preset,
    ...scaffoldPresetMeta[preset],
    complexity,
    profileLabel: earlyStudy ? "early-stage learner" : advancedStudy ? "advanced learner" : "current profile",
  };
}

function applyRecommendedScaffoldSettings() {
  const recommendation = getRecommendedScaffoldSettings();
  state.scaffoldSettingsTouched ||= { density: false, exploration: false };
  const alreadyChosen = state.scaffoldSettingsTouched.density || state.scaffoldSettingsTouched.exploration;
  if (!alreadyChosen) applyScaffoldPreset(recommendation.preset, false);
  return recommendation;
}

function applyScaffoldPreset(preset, save = true) {
  const config = scaffoldPresetMeta[preset];
  if (!config) return;
  state.scaffoldPreset = preset;
  state.informationDensity = scaffoldSettingMeta.density[config.density].value;
  state.explorationLevel = explorationValueFromScope(config.scope);
  state.knowledgeDepth = automaticKnowledgeDepth();
  state.explorationScope = explorationScopeFromValue();
  syncGenerationSetting();
  if (save) scheduleWorkspaceSave();
}

function setThinkingDetail(value) {
  const raw = Math.max(0, Math.min(100, Number(value)));
  state.informationDensity = raw;
  state.scaffoldPreset = densityKeyFromValue(raw);
  state.scaffoldSettingsTouched = { ...(state.scaffoldSettingsTouched || {}), density: true };
  syncGenerationSetting();
  scheduleWorkspaceSave();
}

function setExplorationLevel(value) {
  state.explorationLevel = Math.max(0, Math.min(100, Number(value)));
  state.explorationScope = explorationScopeFromValue();
  state.scaffoldSettingsTouched = { ...(state.scaffoldSettingsTouched || {}), exploration: true };
  syncGenerationSetting();
  scheduleWorkspaceSave();
}

function scaffoldSettingsSnapshot() {
  const detail = Math.max(0, Math.min(100, Number(state.informationDensity ?? 50)));
  const exploration = Math.max(0, Math.min(100, Number(state.explorationLevel ?? 50)));
  const density = densityKeyFromValue(detail);
  const scope = explorationScopeFromValue(exploration);
  const knowledgeDepth = automaticKnowledgeDepth();
  const complexity = inferPlanComplexity(
    `${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`,
    selectedLearningTypes(),
  );
  const baseNodes = thinkingNodeBaseCount(detail, complexity);
  return {
    preset: density,
    informationDensity: detail,
    thinkingDetail: detail,
    thinkingNodeTarget: baseNodes,
    knowledgeDepth,
    explorationLevel: exploration,
    explorationScope: scope,
    learnerAdaptation: learnerProfileGenerationBrief(),
    label: `Adaptive detail · ${explorationLabelFromValue(exploration)} exploration`,
  };
}

function syncGenerationSetting() {
  const raw = Math.max(0, Math.min(100, Number(state.informationDensity ?? generationTemperatureInput.value ?? 50)));
  state.informationDensity = raw;
  state.explorationLevel = Math.max(0, Math.min(100, Number(state.explorationLevel ?? 50)));
  state.knowledgeDepth = automaticKnowledgeDepth();
  state.explorationScope = explorationScopeFromValue();
  state.scaffoldPreset = densityKeyFromValue(raw);
  state.generationTemperature = 0.24 + raw / 100 * 0.30;
  if (generationTemperatureInput) generationTemperatureInput.value = String(state.informationDensity);
  if (explorationTemperatureInput) explorationTemperatureInput.value = String(state.explorationLevel);
  updatePlanStatusLabel();
}

function agentStatusText() {
  if (!state.agentStatus.checked) return "checking agent";
  if (!state.agentStatus.online) return "agent offline";
  if (!state.agentStatus.hasApiKey) return "missing API key";
  return `agent ready · ${state.agentStatus.model || "model"}`;
}

function updatePlanStatusLabel(sourceText = "") {
  if (!planTuningLabel) return;
  const settings = scaffoldSettingsSnapshot();
  planTuningLabel.textContent = `${settings.label} · ${sourceText || agentStatusText()}`;
}

async function checkAgentStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.agentStatus = {
      checked: true,
      online: true,
      hasApiKey: Boolean(data.hasApiKey),
      model: data.model || "",
      error: "",
    };
  } catch (error) {
    state.agentStatus = {
      checked: true,
      online: false,
      hasApiKey: false,
      model: "",
      error: error.message || "Server unavailable",
    };
  }
  updatePlanStatusLabel();
}

async function handleDesktopSettingsSaved() {
  await delay(260);
  await checkAgentStatus();
  const failureType = String(state.pendingFallbackPlan?.failure_type || "");
  const canRetryGeneration = ["missing_api_key", "invalid_api_key"].includes(failureType);
  if (canRetryGeneration) {
    if (generationStatus) generationStatus.textContent = "Coach key saved. Regenerating your plan...";
    await generateAndRenderPlan();
    return;
  }
  render();
}

function beginMaterialUpload() {
  if (!getActiveProjectFile()) createProjectFile();
  openProjectMaterialPicker();
}

function beginTaskContext(taskRow) {
  selectTaskRow(taskRow);
  state.setupPurpose = "task";
  state.selectedTaskName = taskRow.dataset.taskName || taskRow.querySelector("strong")?.textContent || "";
  loadActiveProjectMaterialIntoState();
  const hasSavedPlan = loadTaskContext(taskRow);
  if (!hasSavedPlan) {
    setView("setup");
    return;
  }

  const progress = restoreTaskProgress(taskRow);
  const allStagesCompleted = stages.length > 0 && stages.every((stage) => state.completedStages[stage.key]);
  if (allStagesCompleted || progress?.finished) {
    setView("result");
    return;
  }
  const hasLearningProgress = Boolean(progress?.hasProgress);
  if (hasLearningProgress) {
    setView("flow");
    render();
    return;
  }
  setView("plan");
}

function saveMaterialAndReturn() {
  persistProjectMaterial();
  state.homeTab = "new";
  setView("home");
}

function updateSetupMode() {
  const materialMode = state.setupPurpose === "material";
  if (materialLabel) materialLabel.textContent = "Project materials";
  projectGoalField.hidden = materialMode;
  learningContentField.hidden = materialMode;
  learningTypeLabel.hidden = materialMode;
  quickTagsContainer.hidden = materialMode;
  generationTuning.hidden = materialMode;
  startButton.textContent = materialMode ? "Save material" : "Generate plan";
  if (!materialMode) {
    loadActiveProjectMaterialIntoState();
    applyRecommendedScaffoldSettings();
    syncGenerationSetting();
  }
  renderUploadedFilesForProject();
}

function getActiveTaskRow() {
  return projectDetail.querySelector(".task-row.active");
}

function cloneTaskState(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function persistTaskProgress(taskRow = getActiveTaskRow(), options = {}) {
  if (!taskRow || !state.currentPlan?.steps?.length) return;
  const hasReasoning = Object.values(state.chainRecords || {}).some((items) => Object.values(items || {}).some((record) => record?.saved));
  const hasCompletedStage = Object.keys(state.completedStages || {}).length > 0;
  const progress = {
    version: 1,
    currentStageIndex,
    currentStageKey: currentStage()?.key || "",
    selectedStartPoint: state.selectedStartPoint || "",
    completedStages: cloneTaskState(state.completedStages, {}),
    records: cloneTaskState(state.records, {}),
    chainRecords: cloneTaskState(state.chainRecords, {}),
    userActions: cloneTaskState(state.userActions, []),
    activeAllow: cloneTaskState(state.activeAllow, []),
    knowledgeMap: cloneTaskState(state.knowledgeMap, null),
    taskRecordGuidance: cloneTaskState(state.taskRecordGuidance, null),
    nextMoveGuidance: cloneTaskState(state.nextMoveGuidance, null),
    decisionCheck: cloneTaskState(state.decisionCheck, null),
    finished: Boolean(options.finished),
    hasProgress: hasReasoning || hasCompletedStage || currentStageIndex > 0,
    updatedAt: new Date().toISOString(),
  };
  taskRow.dataset.taskProgress = JSON.stringify(progress);
}

function restoreTaskProgress(taskRow) {
  let progress = null;
  try {
    progress = JSON.parse(taskRow?.dataset.taskProgress || "null");
  } catch {
    taskRow.dataset.taskProgress = "";
  }
  if (!progress || typeof progress !== "object") return null;

  state.selectedStartPoint = String(progress.selectedStartPoint || state.selectedStartPoint || "");
  state.completedStages = progress.completedStages && typeof progress.completedStages === "object" ? progress.completedStages : {};
  state.userActions = Array.isArray(progress.userActions) ? progress.userActions : [];
  state.activeAllow = Array.isArray(progress.activeAllow) && progress.activeAllow.length ? progress.activeAllow : state.activeAllow;
  state.taskRecordGuidance = progress.taskRecordGuidance || null;
  state.nextMoveGuidance = progress.nextMoveGuidance || null;
  state.recordRefineChat = [];
  state.recordRefineDraft = null;
  state.decisionCheck = progress.decisionCheck || null;

  for (const stage of stages) {
    if (progress.records?.[stage.key]) {
      state.records[stage.key] = { ...state.records[stage.key], ...progress.records[stage.key] };
    }
    if (progress.chainRecords?.[stage.key]) {
      state.chainRecords[stage.key] = Object.fromEntries(Object.entries(progress.chainRecords[stage.key]).map(([key, record]) => [key, {
        ...record,
        coachNoteLoading: false,
        saveHint: false,
      }]));
    }
  }
  if (progress.knowledgeMap?.nodes?.length) state.knowledgeMap = progress.knowledgeMap;
  const savedIndex = Number(progress.currentStageIndex);
  currentStageIndex = Number.isFinite(savedIndex) ? Math.max(0, Math.min(stages.length - 1, savedIndex)) : 0;
  state.currentStage = stages[currentStageIndex]?.key || stages[0]?.key || "goal";
  return progress;
}

function persistProjectMaterial() {
  const activeProject = getActiveProjectFile();
  if (!activeProject) return;
  activeProject.dataset.projectMaterial = state.projectMaterial || "";
  activeProject.dataset.uploadedFileName = state.uploadedFileName || "";
}

function loadActiveProjectMaterialIntoState(projectFile = getActiveProjectFile()) {
  const activeProject = projectFile;
  if (!activeProject) return;
  state.projectMaterial = activeProject.dataset.projectMaterial || "";
  state.uploadedFileName = activeProject.dataset.uploadedFileName || "";
}

function saveCurrentTaskContext() {
  const taskRow = getActiveTaskRow();
  if (!taskRow) return;
  const previousFingerprint = taskRow.dataset.generatedFingerprint || "";
  state.projectGoal = projectGoalInput.value.trim();
  state.learningContent = learningContentInput.value.trim();
  state.learningType = selectedLearningTypes();
  taskRow.dataset.projectGoal = state.projectGoal;
  taskRow.dataset.learningContent = state.learningContent;
  taskRow.dataset.learningType = JSON.stringify(state.learningType);
  const nextFingerprint = currentGenerationFingerprint();
  if (previousFingerprint && previousFingerprint !== nextFingerprint) {
    taskRow.dataset.generatedPlan = "";
    taskRow.dataset.generatedFingerprint = "";
    taskRow.dataset.taskProgress = "";
    resetGeneratedPlanState();
    return;
  }
  if (!taskRow.dataset.generatedPlan) taskRow.dataset.generatedFingerprint = "";
}

function prepareFreshPlanGeneration() {
  loadActiveProjectMaterialIntoState();
  state.projectGoal = projectGoalInput.value.trim() || "A design engineering project that needs independent learning support.";
  state.learningContent = learningContentInput.value.trim() || "External learning content or AI-generated output.";
  state.learningType = selectedLearningTypes();
  applyRecommendedScaffoldSettings();
  syncGenerationSetting();
  const activeTask = getActiveTaskRow();
  if (activeTask) {
    activeTask.dataset.projectGoal = state.projectGoal;
    activeTask.dataset.learningContent = state.learningContent;
    activeTask.dataset.learningType = JSON.stringify(state.learningType);
    activeTask.dataset.generatedPlan = "";
    activeTask.dataset.generatedFingerprint = "";
    activeTask.dataset.taskProgress = "";
  }
  resetGeneratedPlanState();
}

function loadTaskContext(taskRow) {
  state.projectGoal = taskRow.dataset.projectGoal || "";
  state.learningContent = taskRow.dataset.learningContent || "";
  try {
    state.learningType = JSON.parse(taskRow.dataset.learningType || "[]");
  } catch {
    state.learningType = [];
  }
  projectGoalInput.value = state.projectGoal;
  learningContentInput.value = state.learningContent;
  quickTagButtons.forEach((item) => item.classList.toggle("selected", state.learningType.includes(item.dataset.learningType)));
  resetGeneratedPlanState();
  return loadSavedPlanForTask(taskRow);
}

function clearSetupInputsForNewTask() {
  state.projectGoal = "";
  state.learningContent = "";
  state.learningType = [];
  projectGoalInput.value = "";
  learningContentInput.value = "";
  quickTagButtons.forEach((item) => item.classList.remove("selected"));
}

function resetGeneratedPlanState() {
  state.activePlanSource = "";
  state.activeContextSummary = "";
  state.currentPlan = null;
  state.planEditorOpen = false;
  state.planEditorDraft = null;
  state.planEditorHistory = [];
  state.planEditorPendingSnapshot = null;
  document.body.classList.remove("plan-editor-active");
  state.selectedStartPoint = "";
  state.stagePrompts = {};
  state.stageLabels = {};
  stages = defaultStages.map((stage) => ({ ...stage, role: stage.key }));
  stageReasoningChains = buildContextualReasoningChains();
  resetReasoningProgress();
  resetPlanPreview();
}

function resetPlanPreview() {
  if (planSteps) planSteps.innerHTML = "";
  if (planEditButton) planEditButton.disabled = true;
  if (planDetail) {
    planDetail.innerHTML = `
      <span>Plan</span>
      <strong>No generated plan yet</strong>
      <p>Define this task context, then generate a task-specific learning plan.</p>
    `;
  }
  if (startOptions) {
    startOptions.innerHTML = "";
    startOptions.hidden = true;
  }
  if (startFromText) {
    startFromText.title = "";
    startFromText.innerHTML = `<span aria-hidden="true"></span>Generate a plan first`;
  }
  if (allowBox) {
    allowBox.innerHTML = `
      <div class="allow-empty">Coach support will appear with your plan.</div>
    `;
  }
  if (generationStatus) generationStatus.textContent = "";
}

function currentGenerationFingerprint() {
  const scaffoldSettings = scaffoldSettingsSnapshot();
  return JSON.stringify({
    planLogicVersion: "adaptive-scaffold-v4",
    project: getActiveProjectFile()?.dataset.projectName || "",
    material: state.projectMaterial || "",
    goal: projectGoalInput.value.trim() || state.projectGoal || "",
    learning: learningContentInput.value.trim() || state.learningContent || "",
    types: selectedLearningTypes(),
    learnerProfile: learnerProfileGenerationBrief(),
    scaffoldSettings,
  });
}

function currentUploadedFileNames() {
  return currentMaterialNames(getActiveProjectFile());
}

async function generateAndRenderPlan() {
  const token = ++planGenerationToken;
  clearPlanGenerationFailure();
  if (state.view !== "generating") setView("generating");
  prepareFreshPlanGeneration();
  syncGenerationSetting();
  startOptions.hidden = true;
  changeStartButton.textContent = "Change";
  startButton.disabled = true;
  regeneratePlanButton.disabled = true;
  const stopPlanLoading = renderPlanLoading();
  const [plan] = await Promise.all([generateProjectPlan(), delay(900)]);
  stopPlanLoading();
  if (token !== planGenerationToken) return;
  if (plan.source !== "ai") {
    showPlanGenerationFailure(plan);
    startButton.disabled = false;
    regeneratePlanButton.disabled = false;
    return;
  }
  acceptGeneratedPlan(plan);
}

function acceptGeneratedPlan(plan) {
  renderGeneratedPlan(plan);
  const activeTask = getActiveTaskRow();
  if (activeTask) {
    activeTask.dataset.generatedFingerprint = currentGenerationFingerprint();
    updateTaskStatus(activeTask, "Plan ready");
  }
  setView("plan");
  startButton.disabled = false;
  regeneratePlanButton.disabled = false;
}

function acceptBasicPlan() {
  const plan = state.pendingFallbackPlan;
  if (!plan) return;
  clearPlanGenerationFailure();
  state.pendingFallbackPlan = null;
  acceptGeneratedPlan(plan);
}

function clearPlanGenerationFailure() {
  state.pendingFallbackPlan = null;
  if (!generationFailure) return;
  generationFailure.hidden = true;
  generatingPanel.classList.remove("generation-failed");
}

function showPlanGenerationFailure(plan) {
  state.pendingFallbackPlan = plan;
  const failureType = String(plan.failure_type || "generation_error");
  const details = {
    missing_api_key: {
      title: "Add a Coach API key",
      text: "A personalised plan needs a Coach API key. Add one in Coach settings, then try again.",
      settings: true,
    },
    invalid_api_key: {
      title: "Check the Coach API key",
      text: "The saved key was not accepted. Update it in Coach settings, then try again.",
      settings: true,
    },
    network: {
      title: "The Coach could not be reached",
      text: "Check your internet connection, then try generating the plan again.",
      settings: false,
    },
    generation_error: {
      title: "Plan generation could not finish",
      text: "The Coach returned an unexpected response. Try again, or continue with a basic plan.",
      settings: false,
    },
  };
  const detail = details[failureType] || details.generation_error;
  if (generationFailureTitle) generationFailureTitle.textContent = detail.title;
  if (generationFailureText) generationFailureText.textContent = detail.text;
  if (generationFailureSettings) generationFailureSettings.hidden = !detail.settings || !window.coachDesktop?.openSettings;
  if (generationFailure) generationFailure.hidden = false;
  generatingPanel.classList.add("generation-failed");
  if (generationStatus) generationStatus.textContent = "Your project context is still here. Choose how to continue.";
}

function applyDemoDefineContextIfEmpty() {
  if (!state.projectMaterial) {
    state.projectMaterial = demoDefineContext.projectMaterial;
  }
  if (!projectGoalInput.value.trim()) {
    projectGoalInput.value = demoDefineContext.projectGoal;
  }
  if (!learningContentInput.value.trim()) {
    learningContentInput.value = demoDefineContext.learningContent;
  }
  if (!selectedLearningTypes().length) {
    state.learningType = [demoDefineContext.learningType];
    quickTagButtons.forEach((item) => item.classList.toggle("selected", state.learningType.includes(item.dataset.learningType)));
  }
  if (!currentMaterialNames().length) {
    addMaterialNameToActiveProject("Demo context");
  }
}

function renderPlanLoading() {
  const loadingFrames = [
    {
      steps: ["Reading project context", "Detecting learning type", "Preparing reasoning route"],
      status: "Reading project context and uploaded material...",
      start: "Scanning your uploaded material and goal...",
      allow: ["Preparing AI support boundaries", "Keeping final decision with student"],
      starts: ["Learning focus", "Reasoning gap", "Decision point"],
    },
    {
      steps: ["Project goal found", "Learning need identified", "Start point candidate ready"],
      status: "Finding what should be learned or verified first...",
      start: "Checking which part should come first...",
      allow: ["AI can ask reasoning questions", "AI can highlight missing evidence"],
      starts: ["Understand", "Connect", "Reason"],
    },
    {
      steps: ["Reasoning route drafted", "Start point selected", "Boundary rules prepared"],
      status: "Turning your input into a learning-to-decision scaffold...",
      start: "Linking learning content to project decision...",
      allow: ["AI can compare possible paths", "Student confirms, revises or rejects"],
      starts: ["Start from project fit", "Start from evidence", "Start from constraints"],
    },
  ];
  let frameIndex = 0;

  const renderFrame = () => {
    const frame = loadingFrames[frameIndex % loadingFrames.length];
    if (generationStatus) generationStatus.textContent = frame.status;
    planSteps.innerHTML = frame.steps.map((step, index) => `
      <div class="plan-loading-row"><span>${index + 1}</span><i></i><em>${escapeHtml(step)}...</em></div>
    `).join("");
    startOptions.innerHTML = frame.starts.map((item, index) => `
      <button class="${index === 0 ? "selected" : ""}" type="button"><i></i><span>${escapeHtml(item)}</span></button>
    `).join("");
    startFromText.title = frame.start;
    startFromText.innerHTML = `<span class="inline-loading"></span>Preparing suggested first step`;
    allowBox.innerHTML = frame.allow.map((item) => `
      <div class="allow-loading" title="${escapeHtml(item)}"><i></i>${escapeHtml(shorten(item, 24))}</div>
    `).join("");
    frameIndex += 1;
  };

  renderFrame();
  const timer = window.setInterval(renderFrame, 700);
  return () => window.clearInterval(timer);
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function selectedLearningTypes() {
  return Array.isArray(state.learningType) ? state.learningType.filter(Boolean) : [state.learningType].filter(Boolean);
}

function inferPlanComplexity(contextText, learningTypes = []) {
  const text = String(contextText || "").toLowerCase();
  const typeText = learningTypes.join(" ").toLowerCase();
  const combined = `${text} ${typeText}`;
  const arduinoProfile = detectArduinoScaffoldProfile(combined);
  if (arduinoProfile) return arduinoProfile.complexity;
  const hardwareHits = [
    "arduino", "sensor", "hardware", "wiring", "circuit", "component", "board",
    "motor", "led", "breadboard", "小车", "传感器", "硬件", "接线", "电路", "电机",
  ].filter((word) => combined.includes(word)).length;
  const enterpriseHits = [
    "enterprise", "large platform", "microservice", "multi-team", "compliance", "ci/cd",
    "observability", "multi端", "大型平台", "多团队", "安全合规",
  ].filter((word) => combined.includes(word)).length;
  const complexHits = [
    "complete system", "full system", "ai", "payment", "real-time", "realtime", "deployment",
    "deploy", "testing", "multiple roles", "database", "backend", "authentication", "权限",
    "完整系统", "多个用户角色", "实时", "部署", "测试",
  ].filter((word) => combined.includes(word)).length;
  const mediumHits = [
    "api", "database", "data flow", "state management", "permission", "multi-page",
    "multiple modules", "dashboard", "workflow", "多页面", "多模块", "数据流", "状态管理",
  ].filter((word) => combined.includes(word)).length;

  if (enterpriseHits >= 1) return { label: "Enterprise", min: 4, max: 5, target: 5 };
  if (complexHits >= 2) return { label: "Complex", min: 4, max: 5, target: 5 };
  if (hardwareHits >= 1) return { label: "Medium", min: 3, max: 4, target: 4 };
  if (mediumHits >= 1 || complexHits === 1) return { label: "Medium", min: 3, max: 4, target: 4 };
  return { label: "Simple", min: 3, max: 3, target: 3 };
}

function detectArduinoScaffoldProfile(text) {
  const lower = String(text || "").toLowerCase();
  const isArduino = /arduino|ide|sensor|hardware|wiring|circuit|component|board|motor|led|breadboard|小车|传感器|硬件|接线|电路|电机/.test(lower);
  if (!isArduino) return null;
  if (/vision|camera|openmv|esp32-cam|raspberry|image|navigation|tracking|视觉|摄像头|图像|自主导航|竞赛/.test(lower)) {
    return {
      level: "advanced",
      difficulty: "★★★★★",
      support: "open review prompts",
      complexity: { label: "Complex", min: 4, max: 5, target: 5 },
    };
  }
  if (/bluetooth|hc-05|hc-06|line|tracking|pid|uart|interrupt|timer|multi|mode|循迹|蓝牙|三合一|多模式|状态机|中断|定时器/.test(lower)) {
    return {
      level: "system integration",
      difficulty: "★★★★☆",
      support: "system frames and review prompts",
      complexity: { label: "Complex", min: 4, max: 5, target: 5 },
    };
  }
  if (/car|obstacle|avoid|ultrasonic|hc-sr04|l298n|tb6612|wheel|避障|超声波|小车|差速|h桥|驱动/.test(lower)) {
    return {
      level: "intermediate",
      difficulty: "★★★☆☆",
      support: "subsystem diagrams and debugging checklists",
      complexity: { label: "Medium", min: 3, max: 4, target: 4 },
    };
  }
  if (/led|button|blink|breathing|pwm|按钮|呼吸灯|点亮|灯/.test(lower)) {
    return {
      level: "beginner",
      difficulty: "★☆☆☆☆",
      support: "complete examples and checkpoints",
      complexity: { label: "Simple", min: 3, max: 3, target: 3 },
    };
  }
  return {
    level: "hands-on hardware",
    difficulty: "★★☆☆☆",
    support: "step guidance and small tests",
    complexity: { label: "Medium", min: 3, max: 4, target: 4 },
  };
}

async function generateProjectPlan(options = {}) {
  try {
    await checkAgentStatus();
    const planState = {
      ...state,
      uploadedFileNames: currentUploadedFileNames(),
      generationFingerprint: currentGenerationFingerprint(),
      editedMilestones: Array.isArray(options.editedMilestones) ? options.editedMilestones : [],
      learnerAdaptation: learnerProfileGenerationBrief(),
      scaffoldSettings: scaffoldSettingsSnapshot(),
    };
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 70000);
    const response = await fetch(`${API_BASE}/api/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: planState, temperature: state.generationTemperature }),
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const plan = await response.json();
    if (!Array.isArray(plan.steps) || !plan.start_from || !Array.isArray(plan.allow)) {
      throw new Error("Invalid plan shape");
    }
    plan.source = plan.source || "ai";
    if (plan.source === "ai" && isGenericPlan(plan)) {
      throw new Error("Generic plan shape");
    }
    return plan;
  } catch (error) {
    const fallback = buildLocalProjectPlan();
    if (Array.isArray(options.editedMilestones) && options.editedMilestones.length) {
      fallback.steps = options.editedMilestones;
      fallback.max_steps = options.editedMilestones.length;
    }
    fallback.source = "fallback";
    fallback.failure_type = classifyPlanGenerationFailure(error);
    fallback.context_summary = `Local fallback used: ${error.message || "AI plan generation unavailable"}`;
    fallback.agent_error = error.message || "";
    return fallback;
  }
}

function classifyPlanGenerationFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("missing deepseek_api_key") || message.includes("missing api key")) return "missing_api_key";
  if (/api 401|api 403|unauthori[sz]ed|invalid.*key|incorrect.*key/.test(message)) return "invalid_api_key";
  if (/enotfound|eai_again|econnrefused|etimedout|timeout|network|socket hang up|fetch failed|failed to fetch/.test(message)) return "network";
  return "generation_error";
}

function buildLocalProjectPlan() {
  const learningTypes = selectedLearningTypes();
  const contextText = `${state.projectMaterial} ${state.projectGoal} ${state.learningContent}`;
  const content = contextText.toLowerCase();
  const complexity = inferPlanComplexity(contextText, learningTypes);
  const projectLabel = inferProjectLabel(contextText);
  const learningLabel = inferLearningLabel(contextText);
  const isToolStep = learningTypes.includes("Tool step") || content.includes("tool") || content.includes("step") || content.includes("prototype");
  const isAiOutput = learningTypes.includes("AI output") || content.includes("ai output") || content.includes("ai-generated") || content.includes("ai generated");
  const isHardware = /arduino|sensor|hardware|wiring|circuit|component|board|motor|led|breadboard/.test(content);
  const isSoftware = /software|code|coding|model|cad|rhino|grasshopper|python|javascript|arduino ide/.test(content);
  const isEvidenceHeavy = content.includes("evidence") || content.includes("test") || content.includes("validate") || isHardware;

  const steps = [];
  const arduinoProfile = detectArduinoScaffoldProfile(contextText);
  if (arduinoProfile) {
    steps.push(...buildArduinoScaffoldSteps(arduinoProfile, projectLabel));
  } else {
    steps.push({
      title: "Need analysis",
      detail: `Clarify what ${projectLabel} needs to achieve.`,
    });
    steps.push({
      title: "System breakdown",
      detail: `Split ${projectLabel} into smaller working parts.`,
    });
    steps.push({
      title: "Knowledge map",
      detail: isHardware ? "List parts, circuit, code and test gaps." : `List what ${learningLabel} needs you to learn.`,
    });
    steps.push({
      title: isAiOutput ? "Output meaning" : isHardware ? "Part roles" : isSoftware ? "Tool logic" : "Learning object",
      detail: isAiOutput ? `Learn what the output actually claims for ${projectLabel}.` : isHardware ? `Learn what each part does before building.` : isSoftware ? `Learn how ${learningLabel} changes the workflow.` : `Clarify what ${learningLabel} helps you do.`,
    });
  }
  if (complexity.target >= 6) {
    steps.push({
      title: "Learning entry",
      detail: isHardware ? "Choose tutorial, datasheet or example sketch." : "Choose the best resource entry point.",
    });
  }
  if (isHardware || isSoftware || isToolStep) {
    steps.push({
      title: isHardware ? "Build step" : "Project use",
      detail: isHardware ? "Try one build action and explain its role." : `Map ${learningLabel} to the project workflow.`,
    });
  }
  if (isHardware || isSoftware) {
    steps.push({
      title: isHardware ? "Code logic" : "Tool practice",
      detail: isHardware ? "Understand the minimum code before copying it." : "Practise the smallest usable workflow.",
    });
  }
  if (complexity.target >= 8) {
    steps.push({
      title: "Explore options",
      detail: `Compare ways ${learningLabel} could be used.`,
    });
  }
  if (isEvidenceHeavy || isAiOutput) {
    steps.push({
      title: isHardware ? "Small test" : "Evidence check",
      detail: isHardware ? "Run a minimal test and observe response." : "Use a source, example or small test.",
    });
  }
  if (complexity.target >= 10) {
    steps.push({
      title: "Debug route",
      detail: "Use errors to locate the next learning gap.",
    });
    steps.push({
      title: "Integration",
      detail: `Connect this learning with other project parts.`,
    });
  }
  steps.push({
    title: isHardware ? "Complete build" : "Adapt learning",
    detail: isHardware ? `Connect learned parts into ${projectLabel}.` : `Decide what must change for ${projectLabel}.`,
  });
  steps.push({
    title: "Learning summary",
    detail: "Save learned concepts, tests and gaps to the knowledge map.",
  });
  steps.push({
    title: "Next project move",
    detail: `Choose what to improve, test or learn next.`,
  });
  const stepLimit = arduinoProfile ? arduinoProfile.complexity.target : complexity.max;
  const boundedSteps = steps.slice(0, stepLimit);

  const startFrom = isAiOutput
    ? `Start by judging whether the AI output fits ${projectLabel}.`
    : isHardware
      ? `Start by checking what ${learningLabel} enables in the hardware setup.`
      : isSoftware
        ? `Start by mapping ${learningLabel} to the software workflow.`
        : `Start by clarifying how ${learningLabel} supports ${projectLabel}.`;

  const start_options = [
    {
      label: isAiOutput ? "Judge AI output" : isHardware ? "Check setup" : isSoftware ? "Map workflow" : "Clarify focus",
      reason: isAiOutput ? "AI output needs project-fit checking." : isHardware ? "Hardware steps need safe verification." : isSoftware ? "Tool flow must match the project." : "Learning need is still broad.",
    },
    {
      label: "Build reasoning",
      reason: "Use this if the content needs judgment.",
    },
    {
      label: isEvidenceHeavy ? "Plan evidence" : "Small test",
      reason: isEvidenceHeavy ? "Decision needs proof before use." : "A small check reduces risk.",
    },
  ];

  const allow = [
    {
      label: isToolStep ? "Guide tool step" : "Guide learning",
      detail: arduinoProfile?.support || (isToolStep ? `AI may break down ${learningLabel}.` : "AI may structure learning steps."),
    },
    {
      label: "Ask reasoning",
      detail: `AI may ask fit questions for ${projectLabel}.`,
    },
    {
      label: isEvidenceHeavy ? "Prompt evidence" : "Prompt checks",
      detail: isEvidenceHeavy ? "AI asks for proof before use." : "AI suggests low-risk checks.",
    },
    {
      label: "Student decides",
      detail: "AI cannot choose the final action.",
    },
  ];

  return {
    source: "local fallback",
    context_summary: arduinoProfile
      ? `${arduinoProfile.level} Arduino scaffold for ${projectLabel}.`
      : `${complexity.label} scaffold for ${projectLabel}.`,
    complexity: complexity.label,
    max_steps: stepLimit,
    scaffold_level: arduinoProfile?.support || "",
    difficulty: arduinoProfile?.difficulty || "",
    steps: boundedSteps,
    start_from: startFrom,
    start_options,
    allow,
    stage_prompts: buildContextualStagePrompts(),
    reasoning_chains: buildContextualReasoningChains(boundedSteps),
  };
}

function buildArduinoScaffoldSteps(profile, projectLabel) {
  if (profile.level === "beginner") {
    return [
      { type: "goal", title: "Define first proof", detail: "Decide what the first LED behaviour should demonstrate." },
      { type: "build_checklist", title: "Make it blink", detail: "Build the smallest LED output and confirm wiring." },
      { type: "decision", title: "Choose variation", detail: "Use the observed LED response to choose the next test." },
    ];
  }
  if (profile.level === "intermediate") {
    return [
      { type: "goal", title: "Define movement", detail: "Clarify what the first movement test needs to prove." },
      { type: "guide", title: "Map first loop", detail: "Link motor, power, sensor and control roles before wiring." },
      { type: "build_checklist", title: "Build first loop", detail: "Make one motor and sensor test produce an observable response." },
      { type: "decision", title: "Choose integration", detail: "Use the first test to choose the next subsystem to add." },
    ];
  }
  if (profile.level === "system integration") {
    return [
      { type: "goal", title: "Set system proof", detail: "Define the first behaviour that proves the robot architecture works." },
      { type: "guide", title: "Map interfaces", detail: "Map inputs, modes, outputs and priority before integration." },
      { type: "build_checklist", title: "Build one mode", detail: "Run one mode with an observable input and motor response." },
      { type: "validate", title: "Check behaviour", detail: "Compare response, delay and power stability against the intended behaviour." },
      { type: "decision", title: "Choose integration", detail: "Decide which mode or interface should be integrated next." },
    ];
  }
  if (profile.level === "advanced") {
    return [
      { type: "goal", title: "Set proof", detail: "Define the first measurable proof for vision-guided movement." },
      { type: "guide", title: "Map control", detail: "Separate vision, communication and motor-control roles." },
      { type: "build_checklist", title: "Vision proof", detail: "Validate one visual signal before robot integration." },
      { type: "validate", title: "Check latency", detail: "Measure whether the signal is timely enough for control." },
      { type: "decision", title: "Choose next path", detail: "Use the evidence to choose integration or further testing." },
    ];
  }
  return [
    { title: "Need analysis", detail: `Clarify what ${projectLabel} should do.` },
    { title: "Minimal system", detail: "Make the smallest useful subsystem work." },
    { title: "Integrate parts", detail: "Add input, control, output or power gradually." },
    { title: "Debug + map", detail: "Use failures to update knowledge gaps." },
  ];
}

function renderGeneratedPlan(plan) {
  state.planEditorOpen = false;
  state.planEditorDraft = null;
  state.planEditorHistory = [];
  state.planEditorPendingSnapshot = null;
  document.body.classList.remove("plan-editor-active");
  plan.scaffold_settings = plan.scaffold_settings || scaffoldSettingsSnapshot();
  const contextText = `${state.projectMaterial} ${state.projectGoal} ${state.learningContent}`;
  const complexity = inferPlanComplexity(contextText, selectedLearningTypes());
  const maxSteps = Math.min(5, Number.isFinite(plan.max_steps) ? plan.max_steps : complexity.max);
  const normalisedSteps = preparePlanSteps(plan.steps, maxSteps);
  plan.steps = normalisedSteps;
  state.currentPlan = plan;
  if (planEditButton) planEditButton.disabled = false;
  state.activePlanSource = plan.source || "ai";
  state.activeContextSummary = plan.context_summary || "";
  updatePlanStatusLabel(state.activePlanSource === "ai"
    ? `AI plan · ${shorten(plan.context_summary || state.agentStatus.model || "generated", 42)}`
    : `fallback · ${shorten(plan.agent_error || plan.debug || plan.context_summary || "agent unavailable", 42)}`);
  buildStagesFromPlanSteps(normalisedSteps);
  resetReasoningProgress();
  applyGeneratedStagePrompts(plan.stage_prompts || {}, normalisedSteps);
  applyGeneratedReasoningChains(plan.reasoning_chains || {}, plan.source || "");
  createKnowledgeMapFromPlan(normalisedSteps);
  planSteps.innerHTML = normalisedSteps.map((step, index) => `
    <button class="plan-step-card ${index === 0 ? "selected" : ""}" type="button" data-plan-step="${index}" title="${escapeHtml(step.detail || step.title || "")}">
      <span>${index + 1}</span>
    </button>
  `).join("");
  renderPlanDetail(normalisedSteps[0], 0);
  planSteps.querySelectorAll(".plan-step-card").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.planStep || 0);
      planSteps.querySelectorAll(".plan-step-card").forEach((item) => item.classList.toggle("selected", item === button));
      renderPlanDetail(normalisedSteps[index], index);
    });
  });
  const options = Array.isArray(plan.start_options) && plan.start_options.length ? plan.start_options : [
    { label: "Start here", reason: plan.start_from },
    { label: "Check fit", reason: "Use this if the learning content may need adaptation." },
    { label: "Test first", reason: "Use this if evidence is missing." },
  ];
  startOptions.innerHTML = options.slice(0, 3).map((option, index) => `
    <button class="${index === 0 ? "selected" : ""}" type="button" data-start-option="${escapeHtml(option.label || option)}" title="${escapeHtml(option.reason || plan.start_from || "")}">
      <i>${index + 1}</i>
      <span>${escapeHtml(option.label || option)}</span>
      ${index === 0 ? "<b>AI pick</b>" : ""}
      <small title="${escapeHtml(option.reason || "")}">${escapeHtml(option.reason || "")}</small>
    </button>
  `).join("");
  startOptions.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      startOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button));
      state.selectedStartPoint = button.dataset.startOption;
      const reason = button.getAttribute("title") || plan.start_from || "";
      startFromText.title = reason;
      startFromText.innerHTML = `<span aria-hidden="true"></span><span class="start-summary-copy">${escapeHtml(reason || state.selectedStartPoint || "Start here")}</span>`;
    });
  });
  state.selectedStartPoint = options[0]?.label || options[0] || "";
  startFromText.title = plan.start_from;
  startFromText.innerHTML = `<span aria-hidden="true"></span><span class="start-summary-copy">${escapeHtml(options[0]?.reason || plan.start_from || "Recommended start")}</span>`;
  if (state.activePlanSource && state.activePlanSource !== "ai") {
    startFromText.title = `${state.activePlanSource}: ${state.activeContextSummary || startFromText.title}`;
  }
  // Keep this control stable across projects. These are real behavioural
  // boundaries passed to the Coach, not AI-generated decorative labels.
  const savedSupport = new Map((Array.isArray(plan.allow) ? plan.allow : [])
    .map(normaliseAllowBoundary)
    .map((item) => [item.label, item.enabled !== false]));
  const previousSupport = savedSupport.size
    ? savedSupport
    : new Map((state.activeAllow || []).map((item) => [item.label, item.enabled !== false]));
  state.activeAllow = buildDefaultCoachSupportBoundaries().map((item) => ({
    ...item,
    enabled: item.required ? true : (previousSupport.get(item.label) ?? item.enabled),
  }));
  plan.allow = state.activeAllow;
  allowBox.innerHTML = state.activeAllow.map((allowItem, index) => {
    return `
      <button class="allow-item ${allowItem.enabled ? "selected" : ""} ${allowItem.required ? "required" : ""}" type="button" data-allow-index="${index}" aria-pressed="${allowItem.enabled ? "true" : "false"}" ${allowItem.required ? "disabled" : ""} title="${escapeHtml(allowItem.required ? "This boundary is always on: the student keeps the final decision." : (allowItem.detail || allowItem.label || ""))}">
        <i></i>
        <span>${escapeHtml(allowItem.label || "Boundary")}</span>
        <small title="${escapeHtml(allowItem.detail || "")}">${escapeHtml(allowItem.detail || "")}</small>
      </button>
    `;
  }).join("");
  allowBox.querySelectorAll(".allow-item").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.allowIndex);
      const boundary = state.activeAllow[index];
      if (!boundary || boundary.required) return;
      boundary.enabled = !boundary.enabled;
      button.classList.toggle("selected", boundary.enabled);
      button.setAttribute("aria-pressed", boundary.enabled ? "true" : "false");
      plan.allow = state.activeAllow;
      saveGeneratedPlanToActiveTask({ ...plan, steps: normalisedSteps });
    });
  });
  saveGeneratedPlanToActiveTask({ ...plan, steps: normalisedSteps });
}

function planEditorTypeLabel(step = {}) {
  return {
    goal: "Direction",
    guide: "Explore",
    build_checklist: "Build",
    build: "Build",
    practice: "Build",
    validate: "Check",
    decision: "Decision",
  }[String(step.type || "").toLowerCase()] || "Milestone";
}

function clonePlanEditorDraft(draft = []) {
  return draft.map((step) => ({ ...step }));
}

function pushPlanEditorHistory(snapshot = state.planEditorDraft) {
  if (!Array.isArray(snapshot)) return;
  const copy = clonePlanEditorDraft(snapshot);
  const history = Array.isArray(state.planEditorHistory) ? state.planEditorHistory : [];
  const last = history[history.length - 1];
  if (!last || JSON.stringify(last) !== JSON.stringify(copy)) history.push(copy);
  state.planEditorHistory = history.slice(-24);
}

function openPlanEditor({ focusIndex = null, focusField = "title" } = {}) {
  const plan = state.currentPlan;
  if (!plan?.steps?.length || !planDetail) return;
  if (!state.planEditorOpen || !Array.isArray(state.planEditorDraft)) {
    state.planEditorDraft = plan.steps.map((step) => ({ ...step }));
    state.planEditorHistory = [];
    state.planEditorPendingSnapshot = null;
  }
  const draft = state.planEditorDraft;
  state.planEditorOpen = true;
  document.body.classList.add("plan-editor-active");
  planEditButton?.classList.add("selected");
  const rows = draft.map((step, index) => `
    <section class="plan-editor-card" data-plan-editor-row="${index}">
      <div class="plan-editor-card-head">
        <div class="plan-editor-card-label">
          <i>${index + 1}</i>
          <span>${escapeHtml(planEditorTypeLabel(step))}</span>
        </div>
        <div class="plan-editor-card-tools" aria-label="Milestone ${index + 1} controls">
          <button class="plan-editor-move" type="button" data-plan-editor-move="-1" data-plan-editor-index="${index}" aria-label="Move milestone ${index + 1} earlier" title="Move earlier" ${index === 0 ? "disabled" : ""}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5"/></svg>
          </button>
          <button class="plan-editor-move" type="button" data-plan-editor-move="1" data-plan-editor-index="${index}" aria-label="Move milestone ${index + 1} later" title="Move later" ${index === draft.length - 1 ? "disabled" : ""}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
          </button>
          <button class="plan-editor-remove" type="button" data-plan-editor-remove="${index}" aria-label="Remove milestone ${index + 1}" title="Remove milestone" ${draft.length <= 2 ? "disabled" : ""}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14"/><path d="M9 7V4h6v3"/><path d="m8 10 .5 9h7l.5-9"/></svg>
          </button>
        </div>
      </div>
      <input class="plan-editor-title" type="text" data-plan-editor-title="${index}" value="${escapeHtml(step.title || "")}" aria-label="Milestone ${index + 1} title" placeholder="Milestone title" maxlength="52" />
      <textarea class="plan-editor-detail-field" data-plan-editor-detail="${index}" aria-label="Milestone ${index + 1} outcome" placeholder="What should be achieved or proved here?" maxlength="200">${escapeHtml(step.detail || "")}</textarea>
    </section>
  `).join("");
  planDetail.classList.add("plan-editor");
  planDetail.innerHTML = `
    <div class="plan-editor-header">
      <strong>Edit milestones</strong>
      <div class="plan-editor-header-actions">
        <button class="plan-editor-undo" type="button" aria-label="Undo last milestone edit" title="Undo last edit" ${state.planEditorHistory.length ? "" : "disabled"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/></svg>
          <span>Undo</span>
        </button>
        <span class="plan-editor-count">${draft.length} / 5</span>
      </div>
    </div>
    <div class="plan-editor-list">${rows}</div>
    <button class="plan-editor-add" type="button" ${draft.length >= 5 ? "disabled" : ""} title="${draft.length >= 5 ? "This plan already has five milestones" : "Add another milestone"}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      <span>${draft.length >= 5 ? "Five milestone limit" : "Add milestone"}</span>
    </button>
    <div class="plan-editor-actions">
      <button class="secondary" type="button" data-plan-editor-cancel>Cancel</button>
      <button class="primary" type="button" data-plan-editor-save title="Regenerate Thinking and Doing from the edited milestones">Update plan</button>
    </div>
  `;
  planDetail.querySelector(".plan-editor-undo")?.addEventListener("click", () => {
    updatePlanEditorDraft();
    const previous = state.planEditorHistory.pop();
    if (!previous) return;
    state.planEditorDraft = clonePlanEditorDraft(previous);
    state.planEditorPendingSnapshot = null;
    openPlanEditor();
  });
  planDetail.querySelector(".plan-editor-add")?.addEventListener("click", () => {
    if (state.planEditorDraft.length >= 5) return;
    updatePlanEditorDraft();
    pushPlanEditorHistory();
    state.planEditorPendingSnapshot = null;
    const decisionIndex = state.planEditorDraft.findIndex((step) => String(step.type || "").toLowerCase() === "decision");
    const insertIndex = decisionIndex >= 0 ? decisionIndex : state.planEditorDraft.length;
    state.planEditorDraft.splice(insertIndex, 0, { type: "guide", title: "New milestone", detail: "" });
    openPlanEditor({ focusIndex: insertIndex });
  });
  planDetail.querySelectorAll("[data-plan-editor-move]").forEach((button) => {
    button.addEventListener("click", () => {
      updatePlanEditorDraft();
      const from = Number(button.dataset.planEditorIndex);
      const to = from + Number(button.dataset.planEditorMove);
      if (to < 0 || to >= state.planEditorDraft.length) return;
      pushPlanEditorHistory();
      state.planEditorPendingSnapshot = null;
      const [moved] = state.planEditorDraft.splice(from, 1);
      state.planEditorDraft.splice(to, 0, moved);
      openPlanEditor({ focusIndex: to });
    });
  });
  planDetail.querySelectorAll("[data-plan-editor-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.planEditorDraft.length <= 2) return;
      updatePlanEditorDraft();
      pushPlanEditorHistory();
      state.planEditorPendingSnapshot = null;
      const removeIndex = Number(button.dataset.planEditorRemove);
      state.planEditorDraft.splice(removeIndex, 1);
      openPlanEditor({ focusIndex: Math.min(removeIndex, state.planEditorDraft.length - 1) });
    });
  });
  planDetail.querySelector("[data-plan-editor-cancel]")?.addEventListener("click", () => {
    const returnToFlow = state.returnToFlowAfterPlanEdit;
    state.returnToFlowAfterPlanEdit = false;
    state.planEditorOpen = false;
    state.planEditorDraft = null;
    state.planEditorHistory = [];
    state.planEditorPendingSnapshot = null;
    document.body.classList.remove("plan-editor-active");
    planEditButton?.classList.remove("selected");
    const selectedIndex = Number(planSteps.querySelector(".plan-step-card.selected")?.dataset.planStep || 0);
    renderPlanDetail(plan.steps[selectedIndex] || plan.steps[0], selectedIndex);
    if (returnToFlow) {
      setView("flow");
      render();
      return;
    }
  });
  planDetail.querySelector("[data-plan-editor-save]")?.addEventListener("click", () => {
    const editedSteps = updatePlanEditorDraft();
    const invalidIndex = editedSteps.findIndex((step) => !String(step.title || "").trim());
    if (invalidIndex >= 0) {
      const row = planDetail.querySelector(`[data-plan-editor-row="${invalidIndex}"]`);
      const input = row?.querySelector(`[data-plan-editor-title="${invalidIndex}"]`);
      row?.classList.add("invalid");
      input?.setAttribute("aria-invalid", "true");
      input?.focus();
      return;
    }
    state.planEditorDraft = null;
    state.planEditorHistory = [];
    state.planEditorPendingSnapshot = null;
    regenerateEditedPlan(editedSteps);
  });
  planDetail.querySelectorAll(".plan-editor-title, .plan-editor-detail-field").forEach((field) => {
    field.addEventListener("focus", () => {
      updatePlanEditorDraft();
      state.planEditorPendingSnapshot = clonePlanEditorDraft(state.planEditorDraft);
    });
    field.addEventListener("input", () => {
      if (state.planEditorPendingSnapshot) {
        pushPlanEditorHistory(state.planEditorPendingSnapshot);
        state.planEditorPendingSnapshot = null;
        const undoButton = planDetail.querySelector(".plan-editor-undo");
        if (undoButton) undoButton.disabled = false;
      }
    });
    field.addEventListener("blur", () => {
      updatePlanEditorDraft();
      state.planEditorPendingSnapshot = null;
    });
  });
  planDetail.querySelectorAll(".plan-editor-title").forEach((input) => {
    input.addEventListener("input", () => {
      input.closest(".plan-editor-card")?.classList.remove("invalid");
      input.removeAttribute("aria-invalid");
    });
  });
  planDetail.querySelectorAll(".plan-editor-detail-field").forEach((textarea) => {
    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(48, textarea.scrollHeight)}px`;
    };
    textarea.addEventListener("input", resize);
    resize();
  });
  if (Number.isInteger(focusIndex)) {
    window.requestAnimationFrame(() => {
      const control = planDetail.querySelector(`[data-plan-editor-${focusField}="${focusIndex}"]`)
        || planDetail.querySelector(`[data-plan-editor-title="${focusIndex}"]`);
      control?.focus();
      if (focusField === "title") control?.select?.();
      control?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }
}

function openPlanEditorFromFlow() {
  if (!state.currentPlan?.steps?.length) return;
  state.returnToFlowAfterPlanEdit = true;
  setView("plan");
  openPlanEditor();
}

function updatePlanEditorDraft() {
  const draft = Array.isArray(state.planEditorDraft)
    ? state.planEditorDraft
    : (state.currentPlan?.steps || []);
  state.planEditorDraft = draft.map((step, index) => ({
    ...step,
    title: planDetail.querySelector(`[data-plan-editor-title="${index}"]`)?.value.trim() ?? step.title ?? "",
    detail: planDetail.querySelector(`[data-plan-editor-detail="${index}"]`)?.value.trim() ?? step.detail ?? "",
  }));
  return state.planEditorDraft;
}

async function regenerateEditedPlan(editedSteps) {
  const token = ++planGenerationToken;
  const activeTask = getActiveTaskRow();
  const returnToFlow = state.returnToFlowAfterPlanEdit;
  state.returnToFlowAfterPlanEdit = false;
  state.planEditorOpen = false;
  state.planEditorHistory = [];
  state.planEditorPendingSnapshot = null;
  document.body.classList.remove("plan-editor-active");
  planEditButton?.classList.remove("selected");
  clearPlanGenerationFailure();
  setView("generating");
  startOptions.hidden = true;
  changeStartButton.textContent = "Change";
  regeneratePlanButton.disabled = true;
  const stopPlanLoading = renderPlanLoading();
  const [generated] = await Promise.all([generateProjectPlan({ editedMilestones: editedSteps }), delay(900)]);
  stopPlanLoading();
  if (token !== planGenerationToken) return;
  regeneratePlanButton.disabled = false;
  if (generated.source !== "ai") {
    showPlanGenerationFailure(generated);
    return;
  }
  const generatedSteps = Array.isArray(generated.steps) ? generated.steps : [];
  generated.steps = editedSteps.map((step, index) => ({
    ...(generatedSteps[index] || {}),
    title: step.title,
    detail: step.detail,
    checklist: generatedSteps[index]?.checklist || step.checklist || [],
  }));
  generated.max_steps = generated.steps.length;
  generated.edited_by_student = true;
  if (activeTask) {
    activeTask.dataset.generatedPlan = "";
    activeTask.dataset.generatedFingerprint = "";
    activeTask.dataset.taskProgress = "";
  }
  acceptGeneratedPlan(generated);
  if (returnToFlow) {
    currentStageIndex = 0;
    updateTaskStatus(getActiveTaskRow(), "Reasoning");
    setView("flow");
    render();
  }
}

function buildStagesFromPlanSteps(planSteps) {
  const sourceSteps = Array.isArray(planSteps) && planSteps.length
    ? planSteps
    : [{ title: "Reasoning", detail: "Build one project-specific reasoning step." }];
  const safeSteps = preparePlanSteps(sourceSteps, Math.min(5, sourceSteps.length));
  stages = safeSteps.map((step, index) => {
    const role = inferStageRoleFromPlanStep(step, index, safeSteps.length);
    const title = shorten(step.title || `Step ${index + 1}`, 22);
    return {
      key: `plan-step-${index + 1}`,
      role,
      title,
      prompt: step.detail || `Use this step to reason about ${title}.`,
      focus: `plan-step-${index + 1}`,
      planStep: step,
    };
  });
  state.stageLabels = {};
  stages.forEach((stage) => {
    state.stageLabels[stage.key] = stage.title;
  });
  ensureStageState();
}

function preparePlanSteps(rawSteps, maxSteps) {
  const context = `${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`.toLowerCase();
  const steps = rawSteps.slice(0, maxSteps).map((step, index) => {
    const safeStep = typeof step === "string" ? { title: step, detail: "" } : { ...step };
    safeStep.type = String(safeStep.type || "").toLowerCase();
    return safeStep;
  });

  // A scaffold begins with one student judgement, then moves into hands-on checks.
  // This also protects the experience when an agent returns a build-only plan.
  if (steps.length && ["build_checklist", "build", "practice"].includes(steps[0].type)) {
    const hardware = /arduino|sensor|motor|servo|circuit|wiring|hardware|robot|电机|传感器|接线|硬件/.test(context);
    steps.unshift({
      type: "goal",
      title: hardware ? "Define first proof" : "Clarify project move",
      detail: hardware
        ? "Decide what the first small build must prove."
        : "Define what this learning should change in the project.",
    });
    if (steps.length > maxSteps) steps.pop();
  }

  const hasBuildMilestone = steps.some((step) => ["build_checklist", "build", "practice"].includes(step.type));
  if (!hasBuildMilestone && steps.length) {
    const buildPattern = /build|wire|prototype|test|try|implement|run|motor|sensor|code|model|make|drive|sensing|integration|搭建|接线|测试|原型|电机|传感器|代码|实现/;
    const candidateIndex = Math.max(0, steps.findIndex((step) => buildPattern.test(`${step.title || ""} ${step.detail || ""}`.toLowerCase())));
    const index = candidateIndex === 0 && steps.length > 1 ? Math.min(1, steps.length - 1) : candidateIndex;
    steps[index] = {
      ...steps[index],
      type: "build_checklist",
      checklist: Array.isArray(steps[index].checklist) && steps[index].checklist.length
        ? steps[index].checklist
        : buildPlanChecklistDraft(steps[index], context),
    };
  }

  return steps.map((step) => {
    if (["build_checklist", "build", "practice"].includes(step.type)) {
      const checklist = Array.isArray(step.checklist) && step.checklist.length
        ? step.checklist
        : buildPlanChecklistDraft(step, context);
      return { ...step, type: "build_checklist", checklist };
    }
    return step;
  });
}

function buildPlanChecklistDraft(step, context) {
  const text = `${step.title || ""} ${step.detail || ""} ${context}`.toLowerCase();
  if (/six|hexapod|leg|servo|pca9685|六足|腿|舵机/.test(text)) {
    return [
      checklistItem(1, "PCA9685 power and I2C lines are connected", "Confirm VCC, GND, SDA and SCL before plugging in servos.", true, "Upload a clear photo of Arduino to PCA9685 wiring."),
      checklistItem(2, "External servo power shares ground with Arduino", "Servo power should not rely on the Arduino 5V pin.", true, "Upload the power and ground connection if unsure."),
      checklistItem(3, "One leg's three servos are connected to known channels", "Record which channel controls hip, knee and ankle.", false),
      checklistItem(4, "A small sweep test moves one joint safely", "Use a small angle range before testing the whole leg.", false),
    ];
  }
  if (/obstacle|avoid|ultrasonic|hc-sr04|distance|car|小车|避障|超声波/.test(text)) {
    return [
      checklistItem(1, "HC-SR04 VCC, GND, Trig and Echo are mapped to the code", "The sensor must produce distance data before motor behaviour is trusted.", true, "Upload a clear photo showing HC-SR04 pins and Arduino pins."),
      checklistItem(2, "L298N input pins match the motor-control sketch", "Check ENA/ENB and IN pins against the code before upload.", true, "Upload the driver and Arduino control wiring."),
      checklistItem(3, "Battery, L298N and Arduino share common ground", "Missing common ground often makes motors or readings behave randomly.", true, "Upload the power and ground wiring."),
      checklistItem(4, "Obstacle distance changes the motor response", "Move an object closer and confirm the car stops or turns.", false),
    ];
  }
  if (/motor|wheel|drive|l298n|tb6612|电机|轮|驱动/.test(text)) {
    return [
      checklistItem(1, "Driver and motor connections are checked", "Confirm the motor outputs and shared ground.", false),
      checklistItem(2, "Power is connected safely", "Check motor power before uploading code.", false),
      checklistItem(3, "One motor response is observed", "Run the smallest forward or reverse test.", true, "Upload one clear photo of the wiring."),
    ];
  }
  if (/sensor|ultrasonic|pir|distance|motion|传感器|超声波|距离|运动/.test(text)) {
    return [
      checklistItem(1, "Sensor power and signal pins are checked", "Match the pin labels to the sketch.", true, "Upload a clear photo of the sensor wiring."),
      checklistItem(2, "A reading appears in the monitor", "Use a simple output before adding behaviour.", false),
      checklistItem(3, "The reading changes in a small test", "Change distance or motion and observe the value.", false),
    ];
  }
  if (/code|ide|sketch|compile|upload|software|tool|代码|软件/.test(text)) {
    return [
      checklistItem(1, "The smallest working action is prepared", "Keep the first attempt limited to one behaviour.", false),
      checklistItem(2, "The action runs without a blocking error", "Save the exact error if it fails.", false),
      checklistItem(3, "The result is observed or captured", "Use a screenshot, output value or short note as evidence.", false),
    ];
  }
  return [
    checklistItem(1, "A small version of this milestone is attempted", "Keep the first attempt deliberately small.", false),
    checklistItem(2, "The result is observed", "Notice what worked, failed or changed.", false),
    checklistItem(3, "One piece of evidence is saved", "Save a photo, screenshot, value or short note.", false),
  ];
}

function inferStageRoleFromPlanStep(step, index, total) {
  const type = String(step.type || "").toLowerCase();
  if (type === "build_checklist" || type === "build" || type === "practice") return "practice";
  if (type === "decision") return "decision";
  if (type === "validate" || type === "evidence") return "validate";
  if (type === "knowledge") return "knowledge";
  if (type === "guide") return "guide";
  if (type === "goal") return "goal";
  const text = `${step.title || ""} ${step.detail || ""}`.toLowerCase();
  if (index === 0 || /need analysis|requirement|project goal|需求分析|我要做什么/.test(text)) return "goal";
  if (/debug|error|troubleshoot|排错|调试/.test(text)) return "debug";
  if (/knowledge map|learning summary|summary|review|gap|map update|save learning|design record|查漏|复习|知识图谱|总结/.test(text)) return "knowledge";
  if (/resource|entry|tutorial|datasheet|example|source|入口|资料|教程|文档/.test(text)) return "resource";
  if (/complete|integration|finish|connect learned|完成|整合|集成/.test(text)) return "complete";
  if (/decision|choose|select|commit|next action|rationale|decide|取舍|决策/.test(text)) return "decision";
  if (/evidence|validate|proof|test result|check result|source|datasheet|feedback|verify|验证|证据/.test(text)) return "validate";
  if (/practice|prototype|try|build|wire|run|model|implement|mvp|small test|motor|drive|sensing|sensor reading|bluetooth|tracking|obstacle|mode switch|pc test|closed loop|field test|搭建|测试|原型|电机|传感器|循迹|蓝牙/.test(text)) return "practice";
  if (/fit|assumption|constraint|risk|trade|compare|option|adapt|可行|限制|风险|比较/.test(text)) return "reasoning";
  if (/system breakdown|part role|signal flow|architecture|subsystem|系统拆解|子系统|信号流/.test(text)) return "guide";
  if (/need|gap|scope|focus|learn|skill|knowledge|学习|知识/.test(text)) return "need";
  if (index === total - 1) return "decision";
  return index <= 1 ? "guide" : "reasoning";
}

function ensureStageState() {
  for (const stage of stages) {
    if (!state.records[stage.key]) {
      state.records[stage.key] = {
        label: "",
        selected: "",
        note: "",
        missingEvidence: [],
        possiblePaths: [],
      };
    }
    if (!state.chainIndexes[stage.key]) state.chainIndexes[stage.key] = 0;
    if (!state.openChainKeys[stage.key]) state.openChainKeys[stage.key] = "";
    if (!state.chainRecords[stage.key]) state.chainRecords[stage.key] = {};
    if (!state.coachTurns[stage.key]) state.coachTurns[stage.key] = 0;
  }
}

function buildGeneratedStageLabels(planSteps) {
  const cleanSteps = planSteps
    .map((step) => shorten(step.title || step.detail || "", 22))
    .filter(Boolean);
  const getStep = (index, fallback) => cleanSteps[index] || fallback;
  return {
    goal: getStep(0, "Goal"),
    need: getStep(1, "Need"),
    guide: getStep(2, "Guide"),
    reasoning: cleanSteps.length > 3 ? getStep(3, "Reason") : "Reason",
    practice: cleanSteps.length > 4 ? getStep(4, "Practice") : "Try",
    validate: cleanSteps.length > 5 ? getStep(5, "Validate") : "Evidence",
    decision: "Decide",
  };
}

function q(key, title, question, hint, options, tool = "", microLesson = "", toolConfig = null) {
  return {
    key,
    title,
    question,
    hint,
    options,
    tool,
    toolConfig,
    microLesson: microLesson || inferMicroLesson(title, question, tool),
  };
}

function selectedValues(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function selectedText(value) {
  return selectedValues(value).join(", ");
}

function hasSelectedValue(value) {
  return selectedValues(value).length > 0;
}

function inferSelectionMode(item = {}) {
  const configured = String(item.selectionMode || item.selection_mode || "").toLowerCase();
  const text = `${item.question || ""} ${item.title || ""}`.toLowerCase();
  const exclusive = /\b(choose one|choose between|best|most important|main|priority|trade-?off|route|direction)\b/.test(text);
  const additive = /\bwhat should .*\b(do|include|support|enable|achieve)\b|\bwhich (features|functions|requirements|subsystems|parts|behaviou?rs|capabilities|evidence|checks)\b/.test(text);
  if (exclusive) return "single";
  if (configured === "multiple" || configured === "multi") return "multiple";
  if (configured === "single") return "single";
  return additive && !exclusive ? "multiple" : "single";
}

function inferMicroLesson(title, question, tool = "") {
  if (tool === "morphology") return "Compare only combinations that could materially change this project's direction.";
  if (tool === "radar") return "Rate the route against the criteria that matter in this project.";
  if (tool === "evidence") return "Use evidence that can change the next action, not evidence collected for its own sake.";
  if (tool === "two-axis") return "Compare realistic routes before committing time or components.";
  return "";
}

function resolveMicroLesson(item = {}, stage, tool = "") {
  const authored = String(item.microLesson || item.micro_lesson || "").trim();
  const generic = /first make the knowledge|connect the knowledge|use this step to learn|keeps learning from becoming|your decision should come from|learn more effectively|general information|project action/i;
  const projectTokens = `${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`
    .toLowerCase()
    .match(/[a-z][a-z0-9-]{3,}/g) || [];
  const authoredLower = authored.toLowerCase();
  const contextual = projectTokens.some((token) => authoredLower.includes(token));
  if (authored && contextual && !generic.test(authored)) return shorten(authored, 150);
  const toolLesson = inferMicroLesson(item.title || "", item.question || "", tool);
  if (toolLesson) return toolLesson;
  const { hardware, vehicle } = reasoningContext(stage);
  if (state.knowledgeDepth === "foundation" && hardware && vehicle && stage.role === "guide") {
    return "Motor noise can affect a sensor reading; isolate one signal before adding speed or turning.";
  }
  return "";
}

function saveGeneratedPlanToActiveTask(plan) {
  const activeTask = getActiveTaskRow();
  if (!activeTask) return;
  activeTask.dataset.generatedPlan = JSON.stringify(plan);
  activeTask.dataset.generatedFingerprint = currentGenerationFingerprint();
}

function normaliseAllowBoundary(item) {
  const boundary = typeof item === "string" ? { label: item, detail: "" } : { ...(item || {}) };
  const label = String(boundary.label || "Boundary").trim();
  const required = /(student|learner).*(decid|judg|ownership)|keep.*(decision|ownership)|final.*(decision|judg|action)/i.test(`${label} ${boundary.detail || ""}`);
  return {
    ...boundary,
    label,
    detail: String(boundary.detail || "").trim(),
    required,
    enabled: required ? true : boundary.enabled !== false,
  };
}

function buildDefaultCoachSupportBoundaries() {
  return [
    {
      label: "Learning guidance",
      detail: "Guide learning with concise hints.",
      enabled: true,
    },
    {
      label: "Decision prompts",
      detail: "Ask reasoning only at decision points.",
      enabled: true,
    },
    {
      label: "Checks & evidence",
      detail: "Prompt checks or evidence before use.",
      enabled: true,
    },
    {
      label: "Student decides",
      detail: "AI cannot choose the final action.",
      required: true,
      enabled: true,
    },
  ];
}

function getActiveAllowBoundaries() {
  return (state.activeAllow || []).map((item) => ({
    label: item.label,
    detail: item.detail,
    enabled: item.enabled !== false,
    required: Boolean(item.required),
  }));
}

function allowBoundaryEnabled(keyword) {
  const boundaries = getActiveAllowBoundaries();
  const match = boundaries.find((item) => keyword.test(`${item.label} ${item.detail}`));
  return !match || match.enabled !== false;
}

function loadSavedPlanForTask(taskRow) {
  if (!taskRow?.dataset.generatedPlan) return false;
  try {
    const plan = JSON.parse(taskRow.dataset.generatedPlan);
    if (!Array.isArray(plan.steps) || !plan.steps.length) return false;
    renderGeneratedPlan(plan);
    return true;
  } catch {
    taskRow.dataset.generatedPlan = "";
    taskRow.dataset.taskProgress = "";
    return false;
  }
}

function applyGeneratedStagePrompts(generatedPrompts, planSteps = []) {
  const fallbackPrompts = buildContextualStagePrompts();
  state.stagePrompts = {};
  for (const [index, stage] of stages.entries()) {
    const rolePrompt = generatedPrompts?.[stage.role] || fallbackPrompts[stage.role];
    const step = planSteps[index] || stage.planStep || {};
    const prompt = generatedPrompts?.[stage.key] || rolePrompt || step.detail || stage.prompt;
    state.stagePrompts[stage.key] = String(prompt || "").trim();
  }
}

function buildContextualStagePrompts() {
  const goal = shorten(state.projectGoal || "this project", 64);
  const content = shorten(state.learningContent || "this learning content", 64);
  return {
    goal: `Clarify what "${goal}" needs to achieve before using ${content}.`,
    need: `Identify the exact learning or verification need raised by ${content}.`,
    guide: `Break the current learning content into one small project-centred step.`,
    reasoning: `Connect ${content} to project fit, assumptions, evidence and next action.`,
    practice: `Turn the reasoning into a low-risk test or small project action.`,
    validate: `Identify what evidence would make the next action credible.`,
    decision: `Compare possible paths, then let the student choose the next action.`,
  };
}

function inferProjectLabel(text) {
  const lower = text.toLowerCase();
  if ((lower.includes("arduino") && /car|小车/.test(lower)) || /obstacle|avoid|ultrasonic|避障|超声波/.test(lower)) return "the Arduino car prototype";
  if (lower.includes("led") || lower.includes("呼吸灯") || lower.includes("按钮")) return "the LED Arduino prototype";
  if (lower.includes("arduino") || lower.includes("sensor") || lower.includes("hardware")) return "the hardware prototype";
  if (lower.includes("reasoning coach") || lower.includes("learning scaffold")) return "the reasoning coach prototype";
  if (lower.includes("cad") || lower.includes("rhino") || lower.includes("model")) return "the modelling project";
  if (lower.includes("user") || lower.includes("ux")) return "the user-facing design";
  const fromGoal = state.projectGoal?.trim();
  return fromGoal ? shorten(fromGoal, 34) : "the project";
}

function inferLearningLabel(text) {
  const lower = text.toLowerCase();
  if (lower.includes("arduino ide")) return "Arduino IDE";
  if (lower.includes("arduino")) return "Arduino";
  if (lower.includes("sensor")) return "sensor setup";
  if (lower.includes("reasoning")) return "reasoning scaffold";
  if (lower.includes("ai output") || lower.includes("ai-generated") || lower.includes("ai generated")) return "AI output";
  if (lower.includes("cad") || lower.includes("rhino")) return "modelling workflow";
  const fromLearning = state.learningContent?.trim();
  return fromLearning ? shorten(fromLearning, 32) : "this learning content";
}

function isGenericPlan(plan) {
  const genericTitles = new Set(["understand", "connect", "reason", "decide", "focus", "identify", "fit", "evidence"]);
  const titles = (plan.steps || []).map((step) => String(step.title || step).trim().toLowerCase());
  const genericCount = titles.filter((title) => genericTitles.has(title)).length;
  const combined = [
    ...titles,
    plan.start_from || "",
    ...(plan.allow || []).map((item) => typeof item === "string" ? item : `${item.label || ""} ${item.detail || ""}`),
  ].join(" ").toLowerCase();
  const context = `${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`.toLowerCase();
  const projectKeywords = ["arduino", "sensor", "hardware", "reasoning", "scaffold", "cad", "rhino", "model", "user"].filter((word) => context.includes(word));
  const keywordHits = projectKeywords.filter((word) => combined.includes(word)).length;
  return genericCount >= Math.min(3, titles.length) && keywordHits === 0;
}

function buildContextualReasoningChains(planStepsForContext = []) {
  const contextualStages = stages.map((stage, index) => ({
    ...stage,
    planStep: planStepsForContext[index] || stage.planStep,
  }));
  return Object.fromEntries(contextualStages.map((stage) => [stage.key, buildDecisionFocusedReasoningChain(stage)]));
  const goal = shorten(state.projectGoal || "this project", 64);
  const content = shorten(state.learningContent || "this learning content", 64);
  const material = state.projectMaterial || "";
  const lowerContext = `${goal} ${content} ${material}`.toLowerCase();
  const isHardware = /arduino|sensor|hardware|wiring|circuit|component|board|motor|led/.test(lowerContext);
  const isSoftware = /software|code|coding|model|cad|rhino|grasshopper|python|javascript/.test(lowerContext);
  const evidenceOptions = isHardware
    ? ["Small wiring test", "Official datasheet", "Similar build", "Tutor check"]
    : isSoftware
      ? ["Small code/model test", "Documentation", "Similar workflow", "Peer feedback"]
      : ["Small test", "Official source", "Similar case", "Feedback"];
  const constraintOptions = isHardware
    ? ["Time", "Component access", "Power/safety", "Skill level"]
    : isSoftware
      ? ["Time", "Tool access", "Complexity", "Skill level"]
      : ["Time", "Resource", "Risk", "Skill level"];
  const planTitles = planStepsForContext.map((step) => step.title).filter(Boolean).slice(0, 3);
  const firstPlanStep = planTitles[0] || "first learning step";

  return {
    goal: [
    {
      key: "project-outcome",
      title: "Project outcome",
        question: `What do you want ${goal} to be able to do or prove?`,
        hint: "Turn the broad goal into one observable project outcome.",
        options: ["Working prototype", "Clear design choice", "Proof of feasibility", "User value"],
      },
      {
        key: "success-evidence",
        title: "Success evidence",
        question: "What evidence would show that this learning helped the project?",
        hint: "Think about what you would show, test, measure or explain.",
        options: evidenceOptions,
      },
      {
        key: "decision-target",
        title: "Decision target",
        question: "Which project decision will this learning support?",
        hint: "Name the decision before learning too much.",
        options: ["Apply method", "Test first", "Change approach", "Seek evidence"],
      },
    ],
    need: [
      {
        key: "specific-need",
        title: "Specific need",
        question: `Which part of "${content}" do you need for ${goal}?`,
        hint: "Separate the useful part from background information.",
        options: ["Concept", "Method", "Tool operation", "Evidence"],
      },
      {
        key: "project-trigger",
        title: "Project trigger",
        question: "What project task made this learning necessary now?",
        hint: "Connect the need to a live project moment.",
        options: ["Build", "Model", "Debug", "Justify"],
      },
      {
        key: "learning-boundary",
        title: "Learning boundary",
        question: "What is enough to learn before taking a small action?",
        hint: "Avoid expanding the learning task beyond what the project currently needs.",
        options: ["Basic idea", "Enough to test", "Enough to compare", "Need advice"],
      },
    ],
    guide: [
      {
        key: "step-map",
        title: isHardware ? "Setup matrix" : "Step matrix",
        question: `Use the matrix to break "${firstPlanStep}" into the parts you want to understand.`,
        hint: "Map the learning step before following it.",
        options: isHardware ? ["Part", "Connection", "Code", "Output"] : ["Input", "Method", "Tool", "Output"],
      },
    {
      key: "observe-signal",
      title: "Observation",
        question: "What do you want to observe while trying this step?",
        hint: "Name the signal you want to use to judge whether the step is working.",
        options: ["Output changes", "Error appears", "Behaviour matches", "Mismatch"],
      },
      {
        key: "learning-risk",
        title: "Unclear part",
        question: "What could you misunderstand if you follow this too quickly?",
        hint: "Identify the part that needs explanation before action.",
        options: ["Cause", "Parameter", "Connection", "Use case"],
      },
    ],
    reasoning: [
      {
        key: "learning-claim",
        title: "Learning claim",
        question: `What does this resource or AI output suggest you can do for ${goal}?`,
        hint: "Restate the suggestion as a claim you can judge.",
        options: ["It explains", "It enables", "It recommends", "It warns"],
      },
      {
        key: "project-relevance",
        title: "Project relevance",
        question: "Why is this claim relevant to your current project task?",
        hint: "Connect it to the goal, prototype, user need or design decision.",
        options: ["Goal", "Prototype", "User need", "Decision"],
      },
      {
        key: "fit-level",
        title: "Fit radar",
        question: "Use the fit radar to judge where this idea feels strong or weak for your project.",
        hint: "Look across project fit, feasibility, evidence and risk before moving into action.",
        options: ["Strong fit", "Mixed fit", "Weak evidence", "High risk"],
      },
      {
        key: "assumption",
        title: "Assumption",
        question: "What must be true for this to work in your project?",
        hint: "Look for hidden assumptions about context, resources, skill or technical behaviour.",
        options: constraintOptions,
      },
      {
        key: "missing-evidence",
        title: "Evidence check",
        question: "Use the evidence check to decide what you want to verify before relying on it.",
        hint: "Choose what would make the next action more credible.",
        options: evidenceOptions,
      },
      {
        key: "reasoned-action",
        title: "Reasoned action",
        question: "What next action do you want to take from this reasoning?",
        hint: "Choose the next step yourself, based on relevance, evidence and constraints.",
        options: ["Apply", "Test first", "Seek evidence", "Adjust direction"],
      },
    ],
    practice: [
      {
        key: "minimum-action",
        title: "Minimum action",
        question: "What is the smallest safe action you can try?",
        hint: "Convert reasoning into a low-risk project-centred test.",
        options: isHardware ? ["Wire one part", "Run simple test", "Check value", "Ask advice"] : ["Mini test", "Try workflow", "Check output", "Ask advice"],
      },
      {
        key: "practice-signal",
        title: "Result signal",
        question: "What result would tell you this action is worth continuing?",
        hint: "Define the evidence before doing the action.",
        options: ["Works reliably", "Partly works", "Fails clearly", "Needs change"],
      },
      {
        key: "practice-risk",
        title: "Practice risk",
        question: "What risk should be controlled before scaling this action?",
        hint: "Keep practice connected to real project constraints.",
        options: constraintOptions,
      },
    ],
    validate: [
      {
        key: "evidence-source",
        title: "Evidence source",
        question: "Which evidence source is strongest for this project decision?",
        hint: "Choose evidence that fits the type of project claim you are making.",
        options: evidenceOptions,
      },
      {
        key: "pass-condition",
        title: "Pass condition",
        question: "What condition must be met before using this in the project?",
        hint: "Set a clear threshold before committing.",
        options: ["Reliable enough", "Safe enough", "Feasible enough", "Relevant enough"],
      },
      {
        key: "revision-trigger",
        title: "Revision trigger",
        question: "What result would make you revise the direction?",
        hint: "Make it clear when the evidence should change your mind.",
        options: ["Weak fit", "Too risky", "Too costly", "Poor result"],
      },
    ],
    decision: [
      {
        key: "two-paths",
        title: "2x2 comparison",
        question: "What are two realistic next paths you could choose?",
        hint: "Use the 2x2 comparison before deciding; do not treat the first AI suggestion as final.",
        options: ["Apply vs test", "Test vs evidence", "Adapt vs reject", "Ask vs proceed"],
      },
      {
        key: "tradeoff",
        title: "Trade-off",
        question: "What trade-off matters most for this decision?",
        hint: "Balance project value, evidence, constraints and learning cost.",
        options: ["Speed", "Reliability", "Risk", "Learning value"],
      },
      {
        key: "student-choice",
        title: "Student choice",
        question: "What do you choose as the next action, and why?",
        hint: "The final decision should be yours, with a clear reason.",
        options: ["Apply", "Test first", "Seek evidence", "Adjust direction"],
      },
    ],
  };
}

function getReasoningDensityProfile() {
  const value = Math.max(0, Math.min(100, Number(state.informationDensity ?? 42)));
  const complexity = inferPlanComplexity(
    `${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`,
    selectedLearningTypes(),
  );
  const target = thinkingNodeBaseCount(value, complexity);
  return {
    key: value < 34 ? "less" : value > 66 ? "more" : "balanced",
    label: `${target} nodes`,
    range: `${target}${target < 11 ? `-${target + 1}` : "+"}`,
    target,
  };
}

function targetReasoningItemCount(stage, profile) {
  const complexity = inferPlanComplexity(
    `${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`,
    selectedLearningTypes(),
  );
  const detail = Math.max(0, Math.min(100, Number(state.informationDensity ?? 50)));
  const decisionHeavy = ["reasoning", "validate", "decision", "debug"].includes(stage.role);
  const complexProject = complexity.label === "Complex" || complexity.label === "Enterprise";
  const decisionAddition = decisionHeavy && detail >= 38 ? 1 : 0;
  const maximum = complexProject ? 14 : complexity.label === "Medium" ? 10 : 7;
  const baseTarget = thinkingNodeBaseCount(detail, complexity);
  return Math.max(2, Math.min(maximum, baseTarget + decisionAddition));
}

function isGenericReasoningItem(item = {}) {
  const text = `${item.title || ""} ${item.question || ""}`.toLowerCase();
  return /\b(goal framing|learning outcome|project link|success signal|project move|learning object|learning focus|step purpose|project trigger|learning boundary|micro learn|use claim|project outcome|success evidence|decision target|specific need|project relevance|learning claim|reasoned action|success sign|first move|uncertain part|step role|result signal|scope check|next step|next action|commit)\b|what do you want to|after this step,? what do you want|why does this matter to your own project|what would show that this learning|what must .+ enable next|which part feels least certain|which example helps most now|what behaviour is now reliable|which concepts are now confirmed|what first if|what should you do next|is the mission scope clear|are you ready to commit/.test(text);
}

function reasoningContext(stage) {
  const step = stage.planStep || {};
  const title = shorten(step.title || stage.title || "this step", 34);
  const source = `${state.projectGoal} ${state.learningContent} ${state.projectMaterial} ${title}`.toLowerCase();
  const hardware = /arduino|sensor|ultrasonic|infrared|motor|driver|l298|wiring|circuit|breadboard|servo|robot|bluetooth/.test(source);
  const vehicle = /car|vehicle|robot|tracked|obstacle|motor|wheel|servo/.test(source);
  const model = /cad|rhino|fusion|model|render|cmf|form|manufactur|prototype/.test(source);
  return { title, source, hardware, vehicle, model, role: stage.role || "reasoning" };
}

function buildDecisionFocusedReasoningChain(stage) {
  const { title, hardware, vehicle, model, role } = reasoningContext(stage);
  const make = (suffix, label, question, hint, options, tool = "", toolConfig = null) =>
    q(`${stage.key}-${suffix}`, label, question, hint, options, tool, "", toolConfig);

  if (hardware && vehicle) {
    const firstProof = make(
      "first-proof", "First proof",
      "Which behaviour should the first vehicle test prove?",
      "Keep the first test small enough to isolate one cause.",
      ["Drive straight", "Read distance", "Stop safely", "Turn away"],
    );
    const condition = make(
      "critical-condition", "Critical condition",
      "Which condition could invalidate this first test?",
      "Choose the condition most likely to distort the result.",
      ["Power drop", "Loose ground", "Sensor noise", "Speed too high"],
    );
    const evidence = make(
      "evidence-threshold", "Evidence threshold",
      "Which observation would prove the behaviour is stable?",
      "Choose a result you could repeat before integrating more parts.",
      ["Repeatable reading", "Clean stop", "Consistent turn", "No controller reset"],
    );
    const sensor = make(
      "signal-path", "Signal path",
      "Which connection could distort the sensor reading?",
      "Check one interface before changing the decision logic.",
      ["Sensor power", "Common ground", "Signal pin", "Motor noise"],
    );
    const threshold = make(
      "threshold", "Threshold",
      "Which distance threshold suits the first test speed?",
      "A slower first test needs a simple, observable threshold.",
      ["10 cm", "20 cm", "30 cm", "Measure first"],
    );
    const integration = make(
      "integration", "Next integration",
      "Which subsystem should follow the sensor test?",
      "Add one dependent subsystem only after the reading is trustworthy.",
      ["Motor response", "Turning logic", "Power check", "Bluetooth control"],
    );
    const route = make(
      "control-priority", "Control priority",
      "When an obstacle appears, which command takes priority?",
      "Make the interaction rule explicit before combining modes.",
      ["Avoidance overrides", "Manual overrides", "Mode-dependent", "Test both"],
    );
    if (role === "goal" || role === "guide") return [firstProof, condition, evidence, sensor, threshold, integration];
    if (role === "validate" || role === "debug") return [sensor, condition, evidence, threshold, integration];
    if (role === "decision") return [route, threshold, evidence, integration];
    return [firstProof, condition, evidence, integration];
  }

  if (model) {
    const focalFeature = make("focal-feature", "Focal feature", `Which feature must ${title} make clear first?`, "Choose the feature that carries the intended form or use.", ["Proportion", "Interaction", "Structure", "Material cue"]);
    const constraint = make("constraint", "Constraint", "Which manufacturing or use constraint could reshape it?", "Choose the constraint that could force a visible design change.", ["Wall thickness", "Assembly", "Ergonomics", "Finish"]);
    const evidence = make("evidence", "Evidence", "Which view or test would challenge this choice?", "Use an observable check before polishing the proposal.", ["User view", "Section view", "Prototype test", "Material sample"]);
    const tradeoff = make("tradeoff", "Trade-off", "Which trade-off is most important here?", "Make one tension explicit before committing the model.", ["Novelty / clarity", "Form / manufacture", "Detail / time", "Weight / strength"]);
    return role === "decision" ? [tradeoff, evidence, focalFeature] : [focalFeature, constraint, evidence, tradeoff];
  }

  const object = make("live-object", "Live question", `Which condition could change ${title}?`, "Choose the condition that would alter the next project move.", ["User need", "Time limit", "Available material", "Technical risk"]);
  const constraint = make("constraint", "Constraint", "Which constraint should be tested before proceeding?", "Pick one constraint that could reverse the current route.", ["Feasibility", "Safety", "Cost", "Skill"]);
  const evidence = make("evidence", "Evidence", "What evidence would justify the next move?", "Choose evidence that can change what you do next.", ["Small test", "Reference case", "Prototype check", "Expert feedback"]);
  const alternative = make("alternative", "Alternative", "Which alternative is worth comparing now?", "Compare only a route that could realistically replace this one.", ["Simpler route", "Different method", "Existing approach", "Delay decision"]);
  return role === "decision" ? [alternative, constraint, evidence] : [object, constraint, evidence, alternative];
}

function buildDecisionFocusedDensityExtensions(stage) {
  const { hardware, vehicle, model } = reasoningContext(stage);
  const make = (suffix, label, question, hint, options) => q(`${stage.key}-${suffix}`, label, question, hint, options);
  const depth = state.knowledgeDepth || "applied";
  const scope = state.explorationScope || "balanced";
  const base = hardware && vehicle
    ? [
      make("power-dependency", "Power dependency", "What must remain stable when the motors start?", "Check this before treating a sensor fault as a code fault.", ["Voltage", "Common ground", "Sensor reading", "Controller reset"]),
      make("failure-trigger", "Revision trigger", "Which result would make you change this route?", "Define the signal that should stop further integration.", ["False trigger", "Unstable value", "Power reset", "No response"]),
    ]
    : model
      ? [
        make("use-test", "Use test", "Which use scenario could expose a weak assumption?", "Test the scenario that challenges the form most directly.", ["Reach", "Grip", "Assembly", "Maintenance"]),
        make("revision-trigger", "Revision trigger", "What result would require a design revision?", "Use one visible trigger to avoid polishing a weak direction.", ["Poor fit", "Hard to make", "Weak feedback", "Unsafe use"]),
      ]
      : [
        make("dependency", "Dependency", "What must be true before this route is viable?", "Name the dependency that could block the next move.", ["Resource available", "Test possible", "Skill ready", "Evidence sufficient"]),
        make("revision-trigger", "Revision trigger", "What result would require a change of route?", "Set a visible reason to revisit the choice.", ["Weak outcome", "New constraint", "Failed test", "Better alternative"]),
      ];
  const expanded = hardware && vehicle
    ? [make("alternative-route", "Alternative route", "Would a slower test reduce risk first?", "Compare a safer path only if it changes the decision.", ["Slow first", "Current speed", "Larger threshold", "Measure first"])]
    : [make("alternative-route", "Alternative route", "Which second route deserves a brief comparison?", "Compare one feasible alternative, not a broad list.", ["Simpler", "More robust", "Lower cost", "More evidence"])];
  if (scope === "focused") return depth === "foundation" ? base.slice(0, 1) : [];
  return scope === "expanded" ? [...base, ...expanded] : base.slice(0, depth === "system" ? 2 : 1);
}

function buildDensityExtensions(stage) {
  return buildDecisionFocusedDensityExtensions(stage);
  const step = stage.planStep || {};
  const title = step.title || stage.title || "this step";
  const projectGoal = shorten(state.projectGoal || "your project", 46);
  const context = `${state.projectGoal} ${state.learningContent} ${state.projectMaterial} ${title}`.toLowerCase();
  const hardware = /arduino|sensor|hardware|wiring|circuit|component|board|led|motor|breadboard/.test(context);
  const evidenceOptions = hardware
    ? ["Small wiring test", "Datasheet", "Similar build", "Tutor check"]
    : ["Small test", "Official source", "Similar case", "Feedback"];
  const depth = state.knowledgeDepth || "applied";
  const scope = state.explorationScope || "balanced";
  const foundation = [
    q(`${stage.key}-principle`, "Core principle", `What principle makes "${title}" work?`, "Name the simplest rule you need before acting.", hardware ? ["Signal", "Power", "Control", "Feedback"] : ["Input", "Process", "Output", "Feedback"]),
    q(`${stage.key}-part-role`, "Part role", "Which part has the key role?", "Identify the one component, tool or operation to understand first.", hardware ? ["Sensor", "Controller", "Driver", "Output"] : ["Material", "Tool", "Method", "Reference"]),
  ];
  const applied = [
    q(`${stage.key}-project-link`, "Project link", `What must "${title}" enable next?`, "Connect this learning directly to a project move.", ["One behaviour", "One test", "One comparison", "One build"]),
    q(`${stage.key}-constraint`, "Constraint", "Which limit could change this route?", "Use a real constraint from the current project.", ["Time", "Cost", "Skill", "Safety"]),
    q(`${stage.key}-evidence`, "Evidence move", "What small check reduces uncertainty?", "Choose one check you can run before adding complexity.", evidenceOptions),
    q(`${stage.key}-measure`, "Success signal", "What result counts as useful?", "Set one observable signal before you test.", ["Accurate response", "Stable output", "Clear comparison", "User reaction"]),
  ];
  const system = [
    q(`${stage.key}-system-link`, "System link", `Which subsystem must connect with "${title}"?`, "Locate the dependency this work creates.", ["Input", "Process", "Output", "Control"]),
    q(`${stage.key}-dependency`, "Dependency", "What must work first?", "Name the prerequisite that could block this step.", hardware ? ["Power", "Wiring", "Code", "Component"] : ["Material", "Tool", "Method", "Reference"]),
    q(`${stage.key}-failure-signal`, "Failure signal", "What result would trigger revision?", "Define a visible sign that this route is not working.", ["Does not respond", "Unstable result", "Too slow", "Unsafe result"]),
    q(`${stage.key}-integration`, "Integration", `How will this affect ${projectGoal}?`, "Connect the outcome to the next project decision.", ["Enables next build", "Changes component choice", "Needs another test", "Narrows options"]),
  ];
  const focused = [
    q(`${stage.key}-scope`, "Smallest version", "What is the smallest useful version?", "Keep the next action small enough to learn from.", ["One component", "One behaviour", "One scenario", "One comparison"]),
  ];
  const balanced = [
    q(`${stage.key}-trade-off`, "Trade-off", "What are you willing to trade?", "Make one deliberate trade-off instead of assuming every criterion improves.", ["Speed for reliability", "Cost for quality", "Simplicity for control", "Time for learning"]),
  ];
  const expanded = [
    q(`${stage.key}-alternative`, "Alternative route", "What is the closest alternative?", "Compare one realistic route, not many unrelated options.", ["Different component", "Different method", "Simpler version", "Existing approach"]),
    q(`${stage.key}-knowledge-record`, "Learning record", "What should you retain here?", "Save one reusable principle or limitation.", ["Connection rule", "Test result", "Design rationale", "Known limitation"]),
  ];
  const next = q(`${stage.key}-next-action`, "Next action", "What will you do next?", "Choose one action that keeps the project moving.", ["Build", "Test", "Compare", "Revise"]);
  const depthItems = depth === "foundation" ? [...foundation, ...applied] : depth === "system" ? [...applied, ...system] : applied;
  const scopeItems = scope === "focused" ? focused : scope === "expanded" ? [...balanced, ...expanded] : balanced;
  return [...depthItems, ...scopeItems, next];
}

function mergeReasoningItems(incoming, fallback, stage, targetCount) {
  const merged = [];
  const seen = new Set();
  const add = (item) => {
    if (!item || isGenericReasoningItem(item)) return;
    const signature = `${String(item?.title || "").toLowerCase()}|${String(item?.question || "").toLowerCase()}`;
    if (seen.has(signature) || merged.length >= targetCount) return;
    seen.add(signature);
    merged.push(item);
  };

  incoming.forEach(add);
  fallback.forEach(add);
  buildDensityExtensions(stage).forEach(add);
  return merged;
}

function applyGeneratedReasoningChains(generatedChains, source = "") {
  const nextChains = {};
  const density = getReasoningDensityProfile();
  for (const stage of stages) {
    const incomingByKey = Array.isArray(generatedChains?.[stage.key]) ? generatedChains[stage.key] : [];
    const incomingByRole = Array.isArray(generatedChains?.[stage.role]) ? generatedChains[stage.role] : [];
    const incoming = source === "fallback" ? [] : (incomingByKey.length ? incomingByKey : incomingByRole);
    const fallback = buildPlanStepReasoningChain(stage);
    const targetCount = targetReasoningItemCount(stage, density);
    const resolvedItems = mergeReasoningItems(incoming, fallback, stage, targetCount);
    nextChains[stage.key] = resolvedItems.map((item, index) => {
      const tool = normaliseAnalysisToolKey(item.tool);
      return {
      key: item.key || `${stage.key}-${index + 1}`,
      title: item.title || `Question ${index + 1}`,
      question: item.question || "What judgement do you need to make here?",
      hint: item.hint || "Keep the answer short and project-specific.",
      options: Array.isArray(item.options) && item.options.length ? item.options.slice(0, 4) : ["Apply", "Test first", "Seek evidence", "Adjust direction"],
      selectionMode: inferSelectionMode(item),
      tool,
      toolConfig: normaliseToolConfig(tool, item.tool_config || item.toolConfig, item),
      microLesson: resolveMicroLesson(item, stage, tool),
    };
    });
  }
  pruneAnalysisTools(nextChains);
  stageReasoningChains = nextChains;
  resetChainRecordsForCurrentChains();
}

function pruneAnalysisTools(chains) {
  const limit = stages.length <= 4 ? 2 : 3;
  const priority = { decision: 100, validate: 90, guide: 80, goal: 70, knowledge: 55, reasoning: 50 };
  const candidates = [];
  for (const stage of stages) {
    for (const item of chains[stage.key] || []) {
      if (!item.tool) continue;
      candidates.push({ stage, item, score: priority[stage.role] || 40 });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const keptPurposes = new Set();
  let kept = 0;
  for (const candidate of candidates) {
    const purpose = String(candidate.item.toolConfig?.purpose || candidate.item.question || "").toLowerCase();
    const duplicate = keptPurposes.has(`${candidate.item.tool}:${purpose}`);
    if (kept < limit && !duplicate) {
      kept += 1;
      keptPurposes.add(`${candidate.item.tool}:${purpose}`);
      continue;
    }
    candidate.item.tool = "";
    candidate.item.toolConfig = null;
  }
}

function normaliseAnalysisToolKey(value) {
  const tool = String(value || "").trim().toLowerCase();
  return ["radar", "two-axis", "morphology"].includes(tool) ? tool : "";
}

function normaliseToolConfig(toolKey, rawConfig, item = {}) {
  if (!toolKey) return null;
  const raw = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
  const textList = (values, fallback = []) => (Array.isArray(values) ? values : fallback)
    .map((value) => typeof value === "string" ? value : value?.label || value?.text || "")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 4);
  const optionFallback = textList(item.options, ["Option A", "Option B"]);
  const purpose = String(raw.purpose || raw.prompt || item.question || "Support this project judgement.").trim();

  if (toolKey === "radar") {
    return {
      purpose,
      criteria: textList(raw.criteria, optionFallback.length ? optionFallback : ["Project fit", "Feasibility", "Evidence", "Risk"]),
    };
  }
  if (toolKey === "two-axis") {
    const quadrantPositions = [
      { x: 27, y: 27 }, { x: 73, y: 27 }, { x: 27, y: 73 }, { x: 73, y: 73 },
    ];
    const positionFromQuadrant = (quadrant, index) => {
      const value = String(quadrant || "").toLowerCase();
      const left = /low (effort|time|cost|resource)|easy|simple/.test(value);
      const top = /high (value|quality|precision|fit|benefit)|strong/.test(value);
      const base = { x: left ? 27 : 73, y: top ? 27 : 73 };
      const duplicateCount = index % 3;
      return {
        x: Number.isFinite(Number(quadrant?.x)) ? Number(quadrant.x) : base.x + duplicateCount * 6,
        y: Number.isFinite(Number(quadrant?.y)) ? Number(quadrant.y) : base.y + duplicateCount * 5,
      };
    };
    const candidates = (Array.isArray(raw.candidates) ? raw.candidates : optionFallback).map((candidate, index) => {
      const fallbackQuadrant = ["high value / low effort", "high value / high effort", "low value / low effort", "low value / high effort"][index % 4];
      if (typeof candidate === "string") {
        const position = quadrantPositions[index % quadrantPositions.length];
        return { label: candidate, quadrant: fallbackQuadrant, x: position.x, y: position.y };
      }
      const result = {
        label: String(candidate?.label || candidate?.name || `Path ${index + 1}`).trim(),
        quadrant: String(candidate?.quadrant || candidate?.placement || fallbackQuadrant).trim(),
      };
      const position = positionFromQuadrant({ ...candidate, ...result }, index);
      return { ...result, x: Math.max(10, Math.min(90, position.x)), y: Math.max(12, Math.min(88, position.y)) };
    }).slice(0, 4);
    return {
      purpose,
      axes: {
        horizontal: String(raw.axes?.horizontal || raw.x_axis || "effort").trim(),
        vertical: String(raw.axes?.vertical || raw.y_axis || "project value").trim(),
      },
      candidates,
    };
  }
  if (toolKey === "morphology") {
    const rows = (Array.isArray(raw.rows) ? raw.rows : []).map((row, index) => ({
      id: String(row?.id || `part-${index + 1}`),
      label: String(row?.label || row?.dimension || `Part ${index + 1}`).trim(),
      options: textList(row?.options, []),
    })).filter((row) => row.options.length);
    return {
      purpose,
      rows: rows.length ? rows.slice(0, 3) : [{ id: "focus", label: String(raw.dimension || "Focus"), options: optionFallback }],
      screeningCriteria: textList(raw.screening_criteria || raw.screeningCriteria, ["Project goal", "Feasibility", "Evidence"]),
      incompatibilities: textList(raw.incompatibilities || raw.conflicts, []),
    };
  }
  return { purpose };
}

function buildPlanStepReasoningChain(stage) {
  return buildDecisionFocusedReasoningChain(stage);
  const step = stage.planStep || {};
  const title = step.title || stage.title || "this step";
  const detail = step.detail || stage.prompt || "";
  const role = stage.role || "reasoning";
  const context = `${state.projectGoal} ${state.learningContent} ${state.projectMaterial} ${title} ${detail}`.toLowerCase();
  const projectGoal = shorten(state.projectGoal || "your project", 46);
  const learningTarget = shorten(state.learningContent || title, 42);
  const hardware = /arduino|sensor|hardware|wiring|circuit|component|board|led|motor|breadboard/.test(context);
  const evidenceOptions = hardware
    ? ["Small wiring test", "Datasheet", "Similar build", "Tutor check"]
    : ["Small test", "Official source", "Similar case", "Feedback"];
  const constraintOptions = hardware
    ? ["Time", "Components", "Power/safety", "Skill"]
    : ["Time", "Resource", "Risk", "Skill"];
  const projectParts = hardware
    ? ["Component role", "Wiring logic", "Code behaviour", "Physical output"]
    : ["Goal", "User value", "Workflow", "Prototype"];
  const actionOptions = ["Continue learning", "Try a small test", "Seek evidence", "Adjust direction"];
  const objectOptions = hardware ? ["Component", "Connection", "Code logic", "Output"] : ["Concept", "Method", "Tool step", "Example"];

  if (role === "goal") {
    return [
      q(`${stage.key}-project-move`, "Project move", `What do you want "${title}" to move forward in ${projectGoal}?`, "Name the project action this step should support.", ["Clarify goal", "Build part", "Compare option", "Prepare test"]),
      q(`${stage.key}-learning-outcome`, "Learning outcome", `After this step, what do you want to understand or be able to do?`, "Frame learning as a capability, not a topic.", ["Explain it", "Operate it", "Adapt it", "Test it"]),
      q(`${stage.key}-success-signal`, "Success signal", "What small output would show this step has worked?", "Choose something visible, testable or explainable.", evidenceOptions),
    ];
  }

  if (role === "knowledge") {
    return [
      q(`${stage.key}-nodes`, "Knowledge nodes", `What new knowledge from "${title}" should enter your map?`, "Capture concepts you can reuse later.", hardware ? ["Part role", "Signal flow", "Code logic", "Test result"] : ["Concept", "Method", "Tool step", "Evidence"]),
      q(`${stage.key}-weak-node`, "Weak node", "Which knowledge node is still unclear or fragile?", "A knowledge map is useful when it shows gaps, not only achievements.", hardware ? ["Wiring", "Power", "Code", "Debugging"] : ["Concept", "Method", "Tool", "Project fit"]),
      q(`${stage.key}-review`, "Review route", "How do you want to review or fill this gap later?", "Turn the gap into a future learning entry.", ["Revisit source", "Do another test", "Ask feedback", "Save example"]),
    ];
  }

  if (role === "resource") {
    return [
      q(`${stage.key}-resource-type`, "Resource type", `What learning entry would help you understand "${learningTarget}"?`, "Choose the resource that matches what you need to learn now.", hardware ? ["Tutorial", "Datasheet", "Example sketch", "AI explanation"] : ["Tutorial", "Case study", "Documentation", "AI explanation"]),
      q(`${stage.key}-resource-purpose`, "Resource purpose", "What do you want this resource to explain or demonstrate?", "Make the resource search purposeful.", hardware ? ["Part role", "Wiring logic", "Code behaviour", "Test method"] : ["Concept", "Workflow", "Criteria", "Example"]),
      q(`${stage.key}-trust-signal`, "Trust signal", "What would make this resource reliable enough to use?", "Judge the source before applying it.", evidenceOptions),
    ];
  }

  if (role === "debug") {
    return [
      q(`${stage.key}-symptom`, "Symptom", "What exactly is not working or still uncertain?", "Name the observable issue before changing anything.", hardware ? ["No response", "Wrong value", "Compile error", "Unstable output"] : ["Wrong output", "Confusing step", "Tool error", "Weak fit"]),
      q(`${stage.key}-possible-cause`, "Possible cause", "Which cause do you want to check first?", "Debugging is learning when it tests one cause at a time.", hardware ? ["Wiring", "Power", "Code", "Component"] : ["Input", "Setting", "Method", "Assumption"]),
      q(`${stage.key}-debug-test`, "Debug test", "What small check can separate this cause from other causes?", "Use a small test to learn where the issue sits.", evidenceOptions),
    ];
  }

  if (role === "complete") {
    return [
      q(`${stage.key}-combine`, "Combine parts", `Which learned parts now need to work together in ${projectGoal}?`, "Completion means connecting learned pieces, not only finishing one step.", hardware ? ["Part + wiring", "Wiring + code", "Code + output", "User effect"] : ["Method + output", "Tool + workflow", "Evidence + claim", "User + value"]),
      q(`${stage.key}-completion-test`, "Completion test", "What test shows the project is complete enough for this stage?", "Define enough before overbuilding.", hardware ? ["Moves/responds", "Reads signal", "Stable loop", "Safe setup"] : ["Works once", "Fits goal", "Evidence clear", "User value visible"]),
      q(`${stage.key}-save-learning`, "Save learning", "What should be saved to your knowledge map from this completed step?", "Keep reusable learning visible for future projects.", ["Concept", "Operation", "Evidence", "Mistake/gap"]),
    ];
  }

  if (role === "need" || role === "guide") {
    return [
      q(`${stage.key}-knowledge-object`, "Learning object", `Which part of "${learningTarget}" do you want to understand for this project?`, "Pick the specific object of learning.", hardware ? ["Component", "Connection", "Code logic", "Output"] : ["Concept", "Method", "Tool step", "Example"]),
      q(`${stage.key}-project-use`, "Project use", `Where will this learning be used in ${projectGoal}?`, "Connect the learning object to a project location or action.", projectParts),
      q(`${stage.key}-breakdown`, "Breakdown", `Break "${title}" into useful parts before following it.`, "Use the matrix to turn a vague learning task into parts.", hardware ? ["Part", "Input", "Process", "Output"] : ["Input", "Method", "Criteria", "Output"]),
      q(`${stage.key}-unclear`, "Blocker", "What is the one unclear point that could stop you moving on?", "Identify the blockage that learning needs to remove.", ["Why it works", "How to do it", "Whether it fits", "What to check"]),
    ];
  }

  if (role === "practice") {
    return [
      q(`${stage.key}-small-test`, "Small test", `What do you want to try first for "${title}"?`, "Do the smallest action that teaches you something useful.", hardware ? ["Wire one part", "Run simple code", "Read one value", "Observe response"] : ["Mini prototype", "Try workflow", "Check output", "Ask feedback"]),
      q(`${stage.key}-test-setup`, "Test setup", "What must be prepared before this small test is meaningful?", "Make the test condition clear.", constraintOptions),
      q(`${stage.key}-result-signal`, "Result signal", "What result would tell you this learning is usable?", "Define a signal before acting.", ["Works reliably", "Partly works", "Fails clearly", "Needs change"]),
      q(`${stage.key}-learning-adjust`, "Adjust learning", "If the test is weak, what do you want to learn next?", "Link failure back to the next learning need.", actionOptions),
    ];
  }

  if (role === "validate") {
    return [
      q(`${stage.key}-claim`, "Project claim", `What project claim do you want "${title}" to support?`, "State what this learning must prove for your project.", ["Feasible", "Relevant", "Safe", "Useful"]),
      q(`${stage.key}-evidence`, "Evidence tool", "What evidence do you need before using this in the project?", "Choose the proof that would make the decision credible.", evidenceOptions),
      q(`${stage.key}-standard`, "Pass standard", "What would be good enough for this stage of the project?", "Set a realistic threshold for a student project.", ["Works once", "Works repeatedly", "Tutor accepts", "User value clear"]),
      q(`${stage.key}-revise`, "Revise if", "What evidence would make you revise the learning route?", "Make it clear when evidence should change the plan.", ["Weak fit", "Too risky", "Too costly", "Poor result"]),
    ];
  }

  if (role === "decision") {
    return [
      q(`${stage.key}-options`, "Next options", "What are two realistic next project actions from here?", "Compare before choosing.", ["Use it now", "Test first", "Learn more", "Change route"]),
      q(`${stage.key}-tradeoff`, "Trade-off", "What trade-off are you willing to accept for the next action?", "Balance project value, learning cost and risk.", ["Fast but uncertain", "Slow but stronger", "Simple but limited", "Hard but valuable"]),
      q(`${stage.key}-assumption`, "Assumption", "What assumption makes your preferred option reasonable?", "Identify what must be true for your choice.", constraintOptions),
      q(`${stage.key}-evidence`, "Decision proof", "What evidence supports this choice enough for now?", "Keep the decision evidence-informed.", evidenceOptions),
      q(`${stage.key}-choice`, "Your decision", "What next action do you choose, and how will you explain it?", "The final decision is your own reasoning output.", ["Apply", "Test first", "Seek evidence", "Adjust direction"]),
    ];
  }

  return [
    q(`${stage.key}-micro-learn`, "Micro learn", `What do you want to understand about "${title}" in simple project terms?`, "First understand the knowledge itself before judging it.", objectOptions),
    q(`${stage.key}-claim`, "Use claim", `What does "${title}" help you understand, do, or compare?`, "Turn the learning step into a usable project claim.", ["Understand", "Operate", "Compare", "Adapt"]),
    q(`${stage.key}-project-link`, "Project link", `Which part of ${projectGoal} will this change or support?`, "Tie the learning to a project action.", projectParts),
    q(`${stage.key}-fit`, "Project fit", "How well does this fit your goal, constraints, evidence and risk?", "Judge project fit before moving into action.", ["Strong fit", "Needs adaptation", "Weak evidence", "High risk"]),
    q(`${stage.key}-evidence`, "Evidence need", "What would you need to check before relying on this?", "Choose what makes the next action credible.", evidenceOptions),
    q(`${stage.key}-action`, "Next action", "What do you want to do next based on this reasoning?", "Move from learning to a project action.", actionOptions),
  ];
}

function ensureAnalysisToolBlocks(chains) {
  // Tool blocks are authored by the planning agent only when the project needs them.
  // Never inject an analysis tool into an otherwise linear learning chain.
  return chains;
}

function resetChainRecordsForCurrentChains() {
  for (const stage of stages) {
    state.chainRecords[stage.key] = {};
    for (const item of stageReasoningChains[stage.key]) {
      state.chainRecords[stage.key][item.key] = {
        selected: "",
        note: "",
        tool: "",
        toolSelections: {},
        toolScreening: "",
        coachNote: "",
        coachNoteType: "",
        nextCheck: "",
        nextCheckPinned: false,
        coachOptions: [],
        coachFeedback: "",
        coachNoteOpen: true,
        coachPath: "",
        coachNoteLoading: false,
        saved: false,
        draftDirty: false,
        saveHint: false,
      };
    }
    state.openChainKeys[stage.key] = "";
    state.chainIndexes[stage.key] = 0;
    state.records[stage.key].note = "";
    state.records[stage.key].selected = "";
  }
}

function resetReasoningProgress() {
  currentStageIndex = 0;
  state.currentStage = stages[0].key;
  state.selectedStartPoint = "";
  state.userActions = [];
  state.lastAi = null;
  state.coachDraftChoice = "";
  state.completedStages = {};
  state.taskRecordGuidance = null;
  state.nextMoveGuidance = null;
  state.recordRefineChat = [];
  state.recordRefineDraft = null;
  state.decisionCheck = null;
  state.chainRecords = {};
  for (const stage of stages) {
    state.records[stage.key] = {
      label: "",
      selected: "",
      note: "",
      missingEvidence: [],
      possiblePaths: [],
    };
    state.chainIndexes[stage.key] = 0;
    state.openChainKeys[stage.key] = "";
    state.coachTurns[stage.key] = 0;
  }
  if (coachResponse) coachResponse.hidden = true;
  if (coachText) coachText.textContent = "";
  if (coachQuestion) coachQuestion.textContent = "";
  if (coachOptions) coachOptions.innerHTML = "";
  if (coachTurns) coachTurns.innerHTML = "";
  if (coachReplyInput) coachReplyInput.value = "";
  if (rationaleText) rationaleText.value = "";
}

function renderPlanDetail(step, index) {
  if (!step) return;
  planDetail.classList.remove("plan-editor");
  const title = step.title || `Milestone ${index + 1}`;
  const detail = step.detail || "The coach will use this step to connect learning content with project reasoning.";
  planDetail.innerHTML = `
    <span>Milestone ${index + 1}</span>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(detail)}</p>
  `;
}

projectFileInput.addEventListener("change", async () => {
  const file = projectFileInput.files && projectFileInput.files[0];
  if (!file) return;
  await handleProjectFile(file);
});

function openProjectMaterialPicker() {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = projectFileInput.accept;
  picker.addEventListener("change", async () => {
    const file = picker.files && picker.files[0];
    if (!file) return;
    await handleProjectFile(file);
  }, { once: true });
  picker.click();
}

async function handleProjectFile(file) {
  state.uploadedFileName = file.name;

  const extension = file.name.split(".").pop().toLowerCase();
  const parseableExtensions = new Set(["txt", "md", "csv", "json", "ino", "js", "py", "html", "css", "cpp", "c", "h", "log", "docx"]);

  try {
    let rawText = "";
    if (extension === "docx") {
      rawText = await extractUploadedFileText(file);
    } else if (parseableExtensions.has(extension) || file.type.startsWith("text/")) {
      rawText = await file.text();
    }
    if (!rawText.trim()) {
      const prefix = `[Uploaded file: ${file.name}]\n`;
      rawText = `${prefix}File uploaded. Text extraction was unavailable for this file type.`;
    }
    const maxChars = 12000;
    const extractedText = rawText.length > maxChars ? `${rawText.slice(0, maxChars)}\n\n[File text truncated for prototype context.]` : rawText;
    const prefix = `[Uploaded file: ${file.name}]\n`;
    loadActiveProjectMaterialIntoState();
    const existing = state.projectMaterial.trim();
    state.projectMaterial = existing ? `${existing}\n\n${prefix}${extractedText}` : `${prefix}${extractedText}`;
    addMaterialNameToActiveProject(file.name);
    persistProjectMaterial();
  } catch (error) {
    console.warn(`Could not read ${file.name}.`, error);
  } finally {
    projectFileInput.value = "";
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractUploadedFileText(file) {
  if (file.name.split(".").pop().toLowerCase() === "docx") {
    try {
      return await extractDocxTextInBrowser(file);
    } catch (error) {
      console.warn("Browser DOCX extraction failed, trying local server.", error);
    }
  }
  const dataBase64 = await fileToBase64(file);
  const response = await fetch(`${API_BASE}/api/extract-file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, dataBase64 }),
  });
  if (!response.ok) throw new Error(`File extraction failed: HTTP ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result.text || "";
}

async function extractDocxTextInBrowser(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const documentXmlBytes = await readZipEntryBrowser(bytes, "word/document.xml");
  const xml = new TextDecoder("utf-8").decode(documentXmlBytes);
  return xml
    .replace(/<\/w:p>/g, "</w:p>\n")
    .split("\n")
    .map((paragraphXml) => {
      const runs = [];
      const regex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
      let match;
      while ((match = regex.exec(paragraphXml))) {
        runs.push(decodeXmlEntities(match[1]));
      }
      return runs.join("");
    })
    .map((text) => text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function readUInt16LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32LE(bytes, offset) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

async function readZipEntryBrowser(bytes, wantedName) {
  let eocdOffset = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 66000); index -= 1) {
    if (readUInt32LE(bytes, index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid DOCX zip structure");
  const entryCount = readUInt16LE(bytes, eocdOffset + 10);
  let offset = readUInt32LE(bytes, eocdOffset + 16);
  const decoder = new TextDecoder("utf-8");
  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32LE(bytes, offset) !== 0x02014b50) throw new Error("Invalid central directory");
    const method = readUInt16LE(bytes, offset + 10);
    const compressedSize = readUInt32LE(bytes, offset + 20);
    const fileNameLength = readUInt16LE(bytes, offset + 28);
    const extraLength = readUInt16LE(bytes, offset + 30);
    const commentLength = readUInt16LE(bytes, offset + 32);
    const localHeaderOffset = readUInt32LE(bytes, offset + 42);
    const fileName = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));
    if (fileName === wantedName) {
      if (readUInt32LE(bytes, localHeaderOffset) !== 0x04034b50) throw new Error("Invalid local file header");
      const localNameLength = readUInt16LE(bytes, localHeaderOffset + 26);
      const localExtraLength = readUInt16LE(bytes, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      if (method === 0) return compressed;
      if (method === 8) return inflateRawBrowser(compressed);
      throw new Error(`Unsupported DOCX compression method ${method}`);
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`Missing ${wantedName}`);
}

async function inflateRawBrowser(compressed) {
  if (!("DecompressionStream" in window)) throw new Error("Browser does not support decompression");
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function decodeXmlEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

quickTagButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.learningType;
    const selectedTypes = new Set(Array.isArray(state.learningType) ? state.learningType : [state.learningType].filter(Boolean));
    if (selectedTypes.has(value)) {
      selectedTypes.delete(value);
    } else {
      selectedTypes.add(value);
    }
    state.learningType = Array.from(selectedTypes);
    quickTagButtons.forEach((item) => item.classList.toggle("selected", state.learningType.includes(item.dataset.learningType)));
  });
});

profileYearButtons.forEach((button) => {
  button.addEventListener("click", () => {
    profileYearButtons.forEach((item) => item.classList.toggle("selected", item === button));
  });
});

profileFocusButtons.forEach((button) => {
  button.addEventListener("click", () => button.classList.toggle("selected"));
});

quickSkillInputs.forEach((input) => {
  const updateSkillLabel = () => {
    const value = Number(input.value || 0);
    const label = input.closest(".quick-skill-row")?.querySelector("em");
    if (!label) return;
    label.textContent = value < 34 ? "Starting" : value < 70 ? "Developing" : "Confident";
    input.style.setProperty("--skill-progress", `${value}%`);
    input.setAttribute("aria-valuetext", `${label.textContent}, ${value}%`);
  };
  input.addEventListener("input", updateSkillLabel);
  updateSkillLabel();
});

if (onboardingContinue) {
  onboardingContinue.addEventListener("click", () => {
    captureLearnerProfile();
    completeOnboarding();
  });
}

onboardingStartSetup?.addEventListener("click", () => {
  onboardingIntro.hidden = true;
  learnerSetup.hidden = false;
});

onboardingSkipSetup?.addEventListener("click", () => {
  completeOnboarding();
});

function completeOnboarding() {
  state.onboardingComplete = true;
  state.onboardingVersion = ONBOARDING_VERSION;
  document.body.classList.remove("onboarding-active");
  onboardingOverlay?.classList.add("hidden");
  updateLearnerProfileView();
  renderMainEntryNav();
  window.setTimeout(() => openProductTour(), 260);
}

const productTourSlides = [
  {
    key: "project",
    title: "Start with a project",
    text: "Create one project folder. Materials and learning tasks can be added later, when they are useful.",
    target: () => emptyCreateProjectButton?.offsetParent ? emptyCreateProjectButton : newProjectButton,
    actionLabel: "New project",
  },
  {
    key: "settings",
    title: "Add your Coach key",
    text: "Click the key icon and paste your own API key in Coach settings. It stays on this device and lets the coach personalise plans and feedback.",
    target: () => settingsButton?.offsetParent ? settingsButton : null,
    actionLabel: "Coach settings",
  },
  {
    key: "context",
    title: "Give the task a real context",
    text: "These three inputs work together: add a brief or reference, state what the robot must achieve, then name the knowledge or operation you need next. This keeps the plan specific to your project.",
    targets: () => [
      setupPanel.querySelector(".material-panel"),
      projectGoalInput.closest(".setup-field"),
      learningContentInput.closest(".setup-field"),
    ].filter(Boolean),
    actionLabel: "Materials, goal and learning focus",
  },
  {
    key: "plan",
    title: "Review the learning plan",
    text: "The context becomes a small set of milestones: read distance, test stopping, then choose the next behaviour.",
    target: () => planPanel.querySelector(".plan-block"),
    actionLabel: "Milestone plan",
  },
  {
    key: "thinking",
    title: "Choose and save one judgement",
    text: "Open the highlighted card, choose a stopping rule that fits the car, add a short reason only if needed, then click Save. The Coach note is optional; it is not another question to answer.",
    target: () => interactionArea.querySelector(".reasoning-input-panel.inline") || interactionArea.querySelector(".chain-card.active") || interactionArea,
    actionLabel: "Choose, then Save",
  },
  {
    key: "doing",
    title: "Mark what you completed",
    text: "Open a Doing node and tick each task after you perform it. A tick records your progress; it does not claim that the result has been verified.",
    target: () => interactionArea.querySelector(".doing-group-checks") || interactionArea.querySelector(".doing-node-panel") || interactionArea.querySelector(".doing-chain-card.active") || interactionArea,
    actionLabel: "Done first · verification follows",
  },
  {
    key: "check",
    title: "Check the result or ask for help",
    text: "Use Check to submit a photo, copied code or screen capture. A passed check becomes Verified. Open Task Coach when you need a reference, an explanation or a follow-up conversation about this task.",
    targets: () => [
      interactionArea.querySelector(".check-evidence-menu"),
      interactionArea.querySelector(".doing-group-assistant"),
    ].filter(Boolean),
    actionLabel: "Check result · Task Coach",
  },
  {
    key: "result",
    title: "Keep your decision record",
    text: "The final record brings together what you built, the evidence you used and the decision you made in your own words.",
    target: () => resultPanel.querySelector(".result-intro") || resultPanel,
    actionLabel: "Task learning record",
  },
  {
    key: "history",
    title: "Keep what you learned",
    text: "Completed checks, evidence and decisions update the learning record and grow the Knowledge Map for later review.",
    target: () => document.querySelector(".knowledge-map-card .map-canvas") || document.querySelector(".knowledge-map-card"),
    actionLabel: "Knowledge Map and learning records",
  },
  {
    key: "profile",
    title: "See your capability pattern",
    text: "Your profile keeps a simple view of strengths across hardware, coding, CAD, research and prototyping. It develops as you save work and update skills.",
    target: () => profileRadar,
    actionLabel: "Capability radar",
  },
];

function ensureTourContext() {
  let project = Array.from(projectShelf.querySelectorAll(".project-file")).find((item) => item.dataset.tourExample === "true");
  if (!project) {
    createProjectFile(tourExampleContext.projectName, { skipRename: true });
    project = getActiveProjectFile();
    if (project) project.dataset.tourExample = "true";
  }
  if (!project) return;
  selectProjectFile(project);
  const taskList = document.getElementById(project.dataset.taskListId);
  let task = taskList?.querySelector(".task-row.active") || taskList?.querySelector(".task-row");
  if (!task) {
    task = createTourTask(project);
  }
  if (!task) return;
  task.dataset.taskName = tourExampleContext.taskName;
  task.querySelector("strong").textContent = tourExampleContext.taskName;
  task.setAttribute("aria-label", tourExampleContext.taskName);
  state.projectMaterial = tourExampleContext.projectMaterial;
  state.uploadedFileName = "";
  persistProjectMaterial();
  project.dataset.materialNames = "[]";
  addMaterialNameToActiveProject(tourExampleContext.materialName);
  beginTaskContext(task);
  applyTourContextValues(task);
  return task;
}

function applyTourContextValues(task) {
  if (!task) return;
  // The normal project-selection flow clears the setup fields. Reapply the
  // tutorial context after every tutorial navigation so the highlighted fields
  // always show an actual example rather than empty placeholders.
  state.projectGoal = tourExampleContext.projectGoal;
  state.learningContent = tourExampleContext.learningContent;
  state.learningType = [...tourExampleContext.learningTypes];
  task.dataset.projectGoal = state.projectGoal;
  task.dataset.learningContent = state.learningContent;
  task.dataset.learningType = JSON.stringify(state.learningType);
  const writeTourInput = (input, value) => {
    // A textarea's live value and its DOM default can be reset by a task/view
    // transition independently. Keep both in sync for the real-interface tour.
    input.value = value;
    input.defaultValue = value;
    input.textContent = value;
    input.setAttribute("data-tour-example", value);
  };
  const writeTourInputs = () => {
    writeTourInput(projectGoalInput, state.projectGoal);
    writeTourInput(learningContentInput, state.learningContent);
  };
  writeTourInputs();
  quickTagButtons.forEach((item) => item.classList.toggle("selected", state.learningType.includes(item.dataset.learningType)));
  // Project selection and view rendering can run immediately after the tour
  // moves on. Write the example again once those operations have settled.
  [0, 80, 220, 520].forEach((delay) => window.setTimeout(writeTourInputs, delay));
}

function createTourTask(project) {
  const taskList = document.getElementById(project.dataset.taskListId);
  if (!taskList) return null;
  const task = document.createElement("div");
  task.className = "task-row";
  task.setAttribute("role", "button");
  task.setAttribute("tabindex", "0");
  task.dataset.taskName = tourExampleContext.taskName;
  task.dataset.projectGoal = "";
  task.dataset.learningContent = "";
  task.dataset.learningType = "[]";
  task.dataset.generatedFingerprint = "";
  task.dataset.generatedPlan = "";
  task.dataset.taskProgress = "";
  task.innerHTML = `
    <svg class="task-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h9l3 3v13H6z" /><path d="M14 4v4h4" /><path d="M9 12h6" /><path d="M9 16h4" /></svg>
    <span><strong>${escapeHtml(tourExampleContext.taskName)}</strong><small>Set up task</small></span>
    <button class="task-edit" type="button" aria-label="Edit task name" title="Edit task name"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.2 2.2 0 0 0-3.1-3.1L5 16.8 4 20Z" /><path d="M14 7l3 3" /></svg><em>Rename task</em></button>
    <em class="task-status" aria-hidden="true">›</em>`;
  taskList.appendChild(task);
  updateProjectTaskCount(project);
  selectTaskRow(task);
  return task;
}

function buildTourPlan() {
  return {
    source: "tutorial",
    tutorial_version: "obstacle-car-v1",
    context_summary: "Arduino obstacle-avoiding robot car tutorial",
    max_steps: 5,
    steps: [
      { type: "goal", title: "Define the stop test", detail: "Choose a distance threshold and an observable pass condition." },
      { type: "guide", title: "Map sensing to motion", detail: "Connect the distance reading to the motor stop command." },
      { type: "build_checklist", title: "Test obstacle response", detail: "Wire the sensor and driver, then run one controlled stopping test.", checklist: [
        { id: "tour-sensor", text: "HC-SR04 pins match the Arduino code", hint: "Check VCC, GND, Trig and Echo before powering the car.", required_photo: true, photo_prompt: "Upload a clear photo showing the sensor and Arduino connections." },
        { id: "tour-driver", text: "L298N control pins match the motor code", hint: "Check ENA, ENB and the IN pins against the sketch." },
        { id: "tour-ground", text: "Arduino, motor driver and battery share ground", hint: "A missing common ground can make both sensing and motor control unstable.", required_photo: true, photo_prompt: "Upload the power and common-ground connections if unsure." },
        { id: "tour-stop", text: "The car stops when an obstacle is within 20 cm", hint: "Move an object toward the sensor and observe both distance and motor response." },
      ] },
      { type: "validate", title: "Check stopping reliability", detail: "Repeat the approach test and confirm that the car stops consistently." },
      { type: "decision", title: "Choose the next behaviour", detail: "Use the test evidence to choose threshold tuning, turning or sensor filtering." },
    ],
    start_from: "Start by proving that one distance threshold stops the car reliably.",
    start_options: [
      { label: "Read distance", reason: "Confirm the sensor produces changing values before controlling motors." },
      { label: "Check motor control", reason: "Confirm the driver can stop both motors safely." },
      { label: "Run the stop test", reason: "Approach slowly and verify the 20 cm threshold." },
    ],
    allow: [
      { label: "Guide build checks", detail: "Break the obstacle response into safe, testable actions." },
      { label: "Check evidence", detail: "Use photos, code or test observations when you request help." },
      { label: "Support decisions", detail: "Compare realistic next actions without choosing for you." },
      { label: "Student decides", detail: "The final integration decision remains yours." },
    ],
    stage_prompts: buildContextualStagePrompts(),
    reasoning_chains: buildContextualReasoningChains(),
  };
}

function ensureTourPlan() {
  ensureTourContext();
  const tutorialPlan = buildTourPlan();
  if (state.activePlanSource !== "tutorial" || state.activeContextSummary !== tutorialPlan.context_summary) {
    renderGeneratedPlan(tutorialPlan);
  }
}

async function enterProductTourStep(index) {
  const safeIndex = Math.max(0, Math.min(index, productTourSlides.length - 1));
  const next = productTourSlides[safeIndex];
  state.productTourStep = safeIndex;

  if (next.key === "project") {
    state.homeTab = "new";
    setView("home");
  } else if (next.key === "settings") {
    state.homeTab = "new";
    setView("home");
  } else if (next.key === "context") {
    const tutorialTask = ensureTourContext();
    setView("setup");
    applyTourContextValues(tutorialTask);
    // A second pass happens after the view's project-selection render has
    // settled; otherwise a stale task selection can blank the tutorial inputs.
    window.requestAnimationFrame(() => applyTourContextValues(tutorialTask));
  } else if (next.key === "plan") {
    ensureTourPlan();
    setView("plan");
  } else if (next.key === "thinking") {
    ensureTourPlan();
    setView("flow");
    currentStageIndex = 0;
    const firstThinkingItem = stageReasoningChains[stages[0]?.key || ""]?.[0];
    if (firstThinkingItem) state.openChainKeys[stages[0].key] = firstThinkingItem.key;
    render();
  } else if (next.key === "doing") {
    ensureTourPlan();
    currentStageIndex = Math.max(0, stages.findIndex((stage) => isDoingStage(stage)));
    const tourDoingStage = stages[currentStageIndex];
    if (tourDoingStage) {
      const tourDoingRecord = state.records[tourDoingStage.key] ||= {};
      const tourDoingGroups = buildDoingTaskGroups(tourDoingStage, getMilestoneChecklist(tourDoingStage));
      tourDoingRecord.openDoingGroup = tourDoingGroups[0]?.key || "";
    }
    setView("flow");
    render();
  } else if (next.key === "check") {
    ensureTourPlan();
    currentStageIndex = Math.max(0, stages.findIndex((stage) => isDoingStage(stage)));
    const tourCheckStage = stages[currentStageIndex];
    if (tourCheckStage) {
      const tourCheckRecord = state.records[tourCheckStage.key] ||= {};
      const tourCheckGroups = buildDoingTaskGroups(tourCheckStage, getMilestoneChecklist(tourCheckStage));
      tourCheckRecord.openDoingGroup = tourCheckGroups[0]?.key || "";
    }
    setView("flow");
    render();
  } else if (next.key === "result") {
    ensureTourPlan();
    setView("result");
    renderDecisionRecord();
  } else if (next.key === "history") {
    state.homeTab = "history";
    setView("home");
    renderKnowledgeMap();
  } else if (next.key === "profile") {
    state.homeTab = "info";
    setView("home");
    updateLearnerProfileView();
  }

  renderProductTour();
}

function renderProductTour() {
  if (!productTour || !tourCopy || !tourDots) return;
  const index = Math.max(0, Math.min(state.productTourStep, productTourSlides.length - 1));
  const slide = productTourSlides[index];
  tourCount.textContent = `${index + 1} / ${productTourSlides.length}`;
  tourCopy.innerHTML = `<h2>${slide.title}</h2><p>${slide.text}</p><strong class="tour-action-label">${slide.actionLabel}</strong>`;
  tourDots.innerHTML = productTourSlides.map((_, dotIndex) => `<i class="${dotIndex === index ? "active" : ""}"></i>`).join("");
  tourBack.hidden = index === 0;
  tourNext.textContent = index === productTourSlides.length - 1 ? "Finish tour" : "Next";
  window.requestAnimationFrame(() => window.requestAnimationFrame(positionProductTourSpotlight));
}

function positionProductTourSpotlight() {
  if (!productTour || productTour.hidden || !tourSpotlight) return;
  const slide = productTourSlides[state.productTourStep];
  const targets = (slide?.targets?.() || [slide?.target?.()]).filter((target) => target && target.isConnected && target.offsetParent !== null);
  if (!targets.length) {
    tourSpotlight.hidden = true;
    if (tourSecondarySpotlights) tourSecondarySpotlights.innerHTML = "";
    return;
  }
  targets[0].scrollIntoView({ block: targets.length > 1 ? "start" : "center", inline: "nearest", behavior: "auto" });
  const host = productTour.getBoundingClientRect();
  const rects = targets.map((target) => target.getBoundingClientRect());
  const pad = 8;
  const cardNeedsTopPosition = Math.max(...rects.map((rect) => rect.bottom)) > host.bottom - 210;
  productTour.classList.toggle("tour-card-top", cardNeedsTopPosition);
  tourSpotlight.hidden = false;
  const positionSpotlight = (spotlight, rect) => {
    spotlight.style.left = `${Math.max(4, rect.left - host.left - pad)}px`;
    spotlight.style.top = `${Math.max(4, rect.top - host.top - pad)}px`;
    spotlight.style.width = `${rect.width + pad * 2}px`;
    spotlight.style.height = `${rect.height + pad * 2}px`;
  };
  positionSpotlight(tourSpotlight, rects[0]);
  if (tourSecondarySpotlights) {
    tourSecondarySpotlights.innerHTML = "";
    rects.slice(1).forEach((rect) => {
      const spotlight = document.createElement("i");
      spotlight.className = "tour-spotlight secondary";
      positionSpotlight(spotlight, rect);
      tourSecondarySpotlights.appendChild(spotlight);
    });
  }
}

function openProductTour() {
  if (!productTour || state.productTourComplete) return;
  productTour.hidden = false;
  enterProductTourStep(0);
}

function closeProductTour() {
  state.productTourComplete = true;
  if (productTour) productTour.hidden = true;
  resetAfterProductTour();
}

function resetAfterProductTour() {
  // Tutorial work must never become a student's real project history. Reset
  // every project/task and all generated learning state, while preserving the
  // learner profile collected before the tutorial.
  Array.from(projectShelf.querySelectorAll(".project-file:not(.create-project-file)")).forEach((project) => project.remove());
  Array.from(projectDetail.querySelectorAll(".task-list")).forEach((taskList) => taskList.remove());
  if (!projectShelf.contains(projectDetail)) projectShelf.insertAdjacentElement("afterend", projectDetail);
  projectDetail.hidden = true;
  taskProjectName.textContent = "No project";
  state.projectMaterial = "";
  state.uploadedFileName = "";
  state.selectedTaskName = "";
  clearSetupInputsForNewTask();
  resetGeneratedPlanState();
  state.knowledgeMap = {
    project: "",
    nodes: [],
    edges: [],
    selectedNodeId: "",
    filter: "all",
    profileSyncPaused: true,
  };
  state.homeTab = "new";
  updateEmptyStartGuide();
  setView("home");
  renderKnowledgeMap();
  saveWorkspaceNow();
}

tourSkip?.addEventListener("click", closeProductTour);
tourBack?.addEventListener("click", () => {
  enterProductTourStep(state.productTourStep - 1);
});
tourNext?.addEventListener("click", async () => {
  if (state.productTourStep >= productTourSlides.length - 1) {
    closeProductTour();
    return;
  }
  tourNext.disabled = true;
  const originalLabel = tourNext.textContent;
  tourNext.textContent = "Preparing...";
  try {
    await enterProductTourStep(state.productTourStep + 1);
  } finally {
    tourNext.disabled = false;
    if (!productTour?.hidden) tourNext.textContent = state.productTourStep >= productTourSlides.length - 1 ? "Finish tour" : originalLabel;
  }
});
window.addEventListener("resize", positionProductTourSpotlight);

function captureLearnerProfile() {
  const year = profileYearButtons.find((button) => button.classList.contains("selected"))?.dataset.profileYear || "";
  const focus = profileFocusButtons.filter((button) => button.classList.contains("selected")).map((button) => button.dataset.profileFocus).filter(Boolean);
  const skills = {};
  quickSkillInputs.forEach((input) => {
    const name = input.dataset.profileSkill;
    if (name) skills[name] = Number(input.value || 0);
  });
  state.learnerProfile = { discipline: "Design engineering", year, focus, skills };
  applyRecommendedScaffoldSettings();
  syncGenerationSetting();
  updateLearnerProfileView();
}

function updateLearnerProfileView() {
  const profile = state.learnerProfile || {};
  if (profileIdentity) profileIdentity.textContent = profile.year ? `${profile.discipline || "Design engineering"} · ${profile.year}` : (profile.discipline || "Design engineering");
  if (profileTags) {
    const tags = [
      ...(profile.focus || []).slice(0, 2).map((item) => `Focus: ${item}`),
    ];
    profileTags.innerHTML = tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  }
  const skills = Object.entries(profile.skills || {});
  const confidenceLabel = (value) => Number(value) < 30 ? "Starter" : Number(value) < 55 ? "Beginner" : Number(value) < 78 ? "Intermediate" : "Confident";
  if (profileStats) {
    const activeTopics = (state.knowledgeMap.nodes || []).filter((node) => node.status === "learning" || node.status === "struggling").length;
    profileStats.innerHTML = `<span><b>${profile.year || "—"}</b><small>study level</small></span><span><b>${skills.length}</b><small>skills tracked</small></span><span><b>${activeTopics}</b><small>active topics</small></span>`;
  }
  renderProfileRadar(profile, skills);
  if (profileSkillList) {
    profileSkillList.innerHTML = skills.length ? skills.map(([name, value]) => `<div class="skill-item"><label for="profile-skill-${escapeHtml(name)}">${escapeHtml(name)}</label><input id="profile-skill-${escapeHtml(name)}" data-profile-skill-input="${escapeHtml(name)}" type="range" min="0" max="100" value="${Number(value)}" aria-label="${escapeHtml(name)} skill level" /><em>${confidenceLabel(value)}</em></div>`).join("") : `<div class="profile-empty-skill">Add the tools and methods you are learning.</div>`;
    profileSkillList.querySelectorAll("[data-profile-skill-input]").forEach((input) => input.addEventListener("input", () => {
      const skill = input.dataset.profileSkillInput;
      const value = Number(input.value || 0);
      state.learnerProfile.skills[skill] = value;
      const label = input.closest(".skill-item")?.querySelector("em");
      if (label) label.textContent = confidenceLabel(value);
      syncProfileKnowledgeNodes();
      renderKnowledgeMap();
    }));
  }
  if (profileYearSelect) profileYearSelect.value = profile.year || "";
  if (profileFocusPicker) profileFocusPicker.querySelectorAll("[data-profile-focus-choice]").forEach((button) => button.classList.toggle("selected", (profile.focus || []).includes(button.dataset.profileFocusChoice)));
}

function renderProfileRadar(profile, skillEntries) {
  if (!profileRadar) return;
  const dimensions = [
    { key: "Hardware", match: /arduino|hardware|electronics?|circuit|sensor|motor|servo|wiring|power|microcontroller/i },
    { key: "Coding", match: /coding|code|program|software|javascript|python|c\+\+|algorithm/i },
    { key: "CAD", match: /cad|rhino|fusion|solidworks|model|render/i },
    { key: "Research", match: /research|user|evidence|analysis|testing|interview/i },
    { key: "Prototyping", match: /prototype|build|fabricat|maker|manufactur|iterate/i },
  ];
  const focus = new Set((profile.focus || []).map((item) => String(item).toLowerCase()));
  const scores = dimensions.map((dimension) => {
    const matches = skillEntries.filter(([name]) => dimension.match.test(name));
    const baseline = focus.has(dimension.key.toLowerCase()) ? 42 : 24;
    const score = matches.length ? matches.reduce((total, [, value]) => total + Number(value || 0), 0) / matches.length : baseline;
    return { ...dimension, score: Math.max(12, Math.min(96, Math.round(score))) };
  });
  const strongest = scores.slice().sort((first, second) => second.score - first.score)[0];
  if (profileCapabilitySignal) profileCapabilitySignal.textContent = strongest ? `Strongest · ${strongest.key}` : "";

  const centre = { x: 140, y: 110 };
  const radius = 70;
  const labelRadius = 96;
  const pointsAt = (value) => scores.map((_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / scores.length;
    const currentRadius = radius * value;
    return `${(centre.x + Math.cos(angle) * currentRadius).toFixed(1)},${(centre.y + Math.sin(angle) * currentRadius).toFixed(1)}`;
  }).join(" ");
  const dataPoints = scores.map((item, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / scores.length;
    const currentRadius = radius * (item.score / 100);
    return { x: centre.x + Math.cos(angle) * currentRadius, y: centre.y + Math.sin(angle) * currentRadius };
  });
  const labels = scores.map((item, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / scores.length;
    const x = centre.x + Math.cos(angle) * labelRadius;
    const y = centre.y + Math.sin(angle) * labelRadius + 3;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${escapeHtml(item.key)}</text>`;
  }).join("");
  profileRadar.innerHTML = `<svg viewBox="0 0 280 220" role="img" aria-label="Capability overview: ${scores.map((item) => `${item.key} ${item.score}%`).join(", ")}">
    <g class="radar-grid"><polygon points="${pointsAt(1)}"/><polygon points="${pointsAt(.66)}"/><polygon points="${pointsAt(.33)}"/>${scores.map((_, index) => { const angle = -Math.PI / 2 + (Math.PI * 2 * index) / scores.length; return `<line x1="${centre.x}" y1="${centre.y}" x2="${(centre.x + Math.cos(angle) * radius).toFixed(1)}" y2="${(centre.y + Math.sin(angle) * radius).toFixed(1)}"/>`; }).join("")}</g>
    <polygon class="radar-shape" points="${dataPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")}"/>
    ${dataPoints.map((point) => `<circle class="radar-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.2"/>`).join("")}
    <g class="radar-labels">${labels}</g>
  </svg>`;
}

editProfileButton?.addEventListener("click", () => {
  profileEditPanel.hidden = !profileEditPanel.hidden;
  updateLearnerProfileView();
});

profileFocusPicker?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile-focus-choice]");
  if (!button) return;
  button.classList.toggle("selected");
});

saveProfileButton?.addEventListener("click", () => {
  const focus = Array.from(profileFocusPicker.querySelectorAll(".selected")).map((button) => button.dataset.profileFocusChoice);
  state.learnerProfile.year = profileYearSelect.value;
  state.learnerProfile.focus = focus;
  profileEditPanel.hidden = true;
  syncProfileKnowledgeNodes();
  updateLearnerProfileView();
  renderKnowledgeMap();
});

addProfileSkillButton?.addEventListener("click", () => {
  profileSkillForm.hidden = !profileSkillForm.hidden;
  if (!profileSkillForm.hidden) profileSkillName.focus();
});

saveProfileSkillButton?.addEventListener("click", () => {
  const name = profileSkillName.value.trim();
  if (!name) return;
  state.learnerProfile.skills[name] = Number(profileSkillLevel.value || 35);
  profileSkillName.value = "";
  profileSkillForm.hidden = true;
  syncProfileKnowledgeNodes();
  updateLearnerProfileView();
  renderKnowledgeMap();
});

backToHomeButton.addEventListener("click", () => {
  setView("home");
});

backToSetupButton.addEventListener("click", () => {
  setView("setup");
});

confirmPlanButton.addEventListener("click", () => {
  setView("flow");
  currentStageIndex = 0;
  updateTaskStatus(getActiveTaskRow(), "Reasoning");
  render();
  coachResponse.hidden = true;
});

supportLensButton.addEventListener("click", () => openSupportLens());
if (settingsButton) {
  settingsButton.hidden = !window.coachDesktop?.openSettings;
  settingsButton.addEventListener("click", () => window.coachDesktop?.openSettings());
}
window.coachDesktop?.onSettingsSaved?.(() => {
  handleDesktopSettingsSaved();
});
closeSupportLens.addEventListener("click", () => {
  supportLensModal.hidden = true;
});
supportLensModal.addEventListener("click", (event) => {
  if (event.target === supportLensModal) supportLensModal.hidden = true;
});
modeToggle.addEventListener("click", () => {
  document.body.classList.toggle("compact-mode");
  updateModeToggleIcon();
  if (window.coachDesktop?.setWindowMode) {
    window.coachDesktop.setWindowMode(document.body.classList.contains("compact-mode") ? "compact" : "expanded");
  }
});
generateButton.addEventListener("click", () => {
  const stage = currentStage();
  if (isDoingStage(stage)) {
    askCoach(
      "The student explicitly requested support during this Doing milestone.",
      "ask_coach_on_demand",
      buildCurrentReasoningContext({
        request_note: "Ask for one concrete artifact, symptom or observation if there is not enough evidence for a targeted response.",
      }),
    );
  }
});

nextButton.addEventListener("click", () => {
  advanceCurrentStage();
});

resultBackButton.addEventListener("click", () => openDecisionLogic());
resultEditLogic.addEventListener("click", () => openDecisionLogic());
resultSaveButton.addEventListener("click", () => {
  if (resultSaveButton.dataset.resultAction === "create-next-task") {
    createNextTaskFromRecord();
    return;
  }
  saveDecisionRecord();
});
resultPreviewButton.addEventListener("click", () => toggleTaskRecordPreview());
resultExportButton.addEventListener("click", () => exportTaskRecord());
resultPreviewClose.addEventListener("click", () => closeTaskRecordPreview());
resultPreviewWrap.addEventListener("click", (event) => {
  if (event.target === resultPreviewWrap) closeTaskRecordPreview();
});
resultAiEditButton.addEventListener("click", () => toggleRecordAiEditor());
resultAiSend.addEventListener("click", () => sendRecordRefineRequest());
resultAiApply.addEventListener("click", () => applyRecordRefineDraft());
resultAiInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") sendRecordRefineRequest();
});
resultGuidanceButton.addEventListener("click", () => generateTaskRecordGuidance());
resultNextOptions.addEventListener("click", (event) => {
  const option = event.target.closest("[data-next-session-option]");
  if (!option) return;
  const action = state.taskRecordGuidance?.actions?.[Number(option.dataset.nextSessionOption)];
  const decisionStage = getDecisionStage();
  if (!action || !decisionStage) return;
  const record = state.records[decisionStage.key] || (state.records[decisionStage.key] = {});
      record.nextAction = action.title;
      resultRationale.value = action.title;
      resultSaveButton.disabled = false;
      resultSaveButton.textContent = "Save & generate";
  resultSaveStatus.textContent = "";
  renderNextSessionGuidance();
});
resultChoiceGrid.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-result-choice]");
  if (!choice) return;
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  const selectedChoice = choice.dataset.resultChoice;
  state.records[decisionStage.key].selected = selectedChoice;
  resultSaveStatus.textContent = "";
  state.nextMoveGuidance = { choice: selectedChoice, loading: true };
  renderDecisionRecord();
  generateNextMoveGuidance(selectedChoice);
});
resultDecisionCheck.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-decision-check]");
  if (!choice || !state.decisionCheck || state.decisionCheck.loading) return;
  const category = choice.dataset.decisionCheck;
  state.decisionCheck.selections = {
    ...(state.decisionCheck.selections || {}),
    [category]: choice.dataset.decisionCheckValue,
  };
  renderDecisionRecord();
});
resultRationale.addEventListener("input", () => {
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  state.records[decisionStage.key].nextAction = resultRationale.value;
  updateRecordCoachRefineState();
  resultSaveStatus.textContent = "";
});

coachButton.addEventListener("click", () => askCoach(coachInput.value.trim() || "Help me continue the reasoning."));
coachInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") askCoach(coachInput.value.trim() || "Help me continue the reasoning.");
});
coachReplyButton.addEventListener("click", submitCoachReply);
coachReplyInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitCoachReply();
});
coachDismissButton.addEventListener("click", () => {
  coachResponse.hidden = true;
  state.coachDraftChoice = "";
});

function openSupportLens() {
  const stage = currentStage();
  const stageTitle = getStageDisplayTitle(stage);
  const goal = shorten(state.projectGoal || "your current project", 92);
  const learning = shorten(state.learningContent || "the learning content", 74);
  const isDoing = isDoingStage(stage);
  const activeKey = state.openChainKeys?.[stage.key];
  const activeItem = (stageReasoningChains[stage.key] || []).find((item) => item.key === activeKey);
  const toolSupport = activeItem?.tool
    ? `${getToolLabel(activeItem.tool)} for ${shorten(activeItem.toolConfig?.purpose || activeItem.question, 58)}`
    : isDoing ? "Checklist, artifact and optional help" : `One focused judgement about ${learning}`;
  const stagePurpose = isDoing
    ? "This is a doing milestone: you build, observe and save a small piece of evidence. The coach stays quiet unless you ask for help."
    : "This is a thinking milestone: you make one project judgement visible before you move into action.";
  const nodes = [
    { icon: "▣", title: "Project", text: goal },
    { icon: "◌", title: stageTitle, text: toolSupport },
    { icon: "✓", title: "Student record", text: isDoing ? "Evidence from your build" : "Your choice and reason" },
  ];
  supportLensContext.innerHTML = `
    <span class="support-lens-kicker">Current support</span>
    <strong>${escapeHtml(stageTitle)}</strong>
    <p>${escapeHtml(stagePurpose)}</p>
  `;
  supportLensFlow.innerHTML = nodes.map((node, index) => `
    <div class="support-lens-node">
      <span>${node.icon}</span>
      <div><strong>${escapeHtml(node.title)}</strong><p>${escapeHtml(node.text)}</p></div>
      ${index < nodes.length - 1 ? `<i aria-hidden="true">→</i>` : ""}
    </div>
  `).join("");
  supportLensModal.hidden = false;
}

function currentStage() {
  return stages[currentStageIndex];
}

function stageHasRole(stage, role) {
  return (stage?.role || stage?.key) === role;
}

function findLastStageByRole(role) {
  return [...stages].reverse().find((stage) => stageHasRole(stage, role));
}

function knowledgeStatusLabel(status) {
  return {
    not_started: "Not started",
    learning: "Learning",
    verified: "Verified",
    struggling: "Needs review",
    mastered: "Mastered",
  }[status] || "Not started";
}

function knowledgeNodeBadge(node) {
  const status = node?.status || "not_started";
  if (status === "verified" || status === "mastered") return { symbol: "✓", label: "Verified" };
  if (status === "learning") return { symbol: "↻", label: "Review in progress" };
  if (status === "struggling") return { symbol: "!", label: "Needs review" };
  return null;
}

function inferKnowledgeCategory(text = "") {
  const value = String(text).toLowerCase();
  if (/test|evidence|verify|photo|data|feedback|proof/.test(value)) return "evidence";
  if (/ide|arduino|rhino|tool|l298n|sensor|module|software/.test(value)) return "tool";
  if (/build|wire|model|code|debug|practice|assemble/.test(value)) return "skill";
  if (/system|plan|compare|method|decision|analysis|map/.test(value)) return "method";
  return "concept";
}

function knowledgeCategoryLabel(category = "concept") {
  return {
    focus: "Learning focus",
    tool: "Tools & components",
    skill: "Practical skills",
    method: "Methods & decisions",
    evidence: "Evidence & testing",
    concept: "Core concepts",
  }[category] || "Project knowledge";
}

function profileKnowledgeStatus(confidence) {
  if (confidence >= 75) return "mastered";
  if (confidence >= 55) return "verified";
  return "learning";
}

function inferKnowledgeParentAndRelation(node, nodes) {
  const lowerName = String(node.name || "").toLowerCase();
  const focusNode = nodes.find((item) => item.origin === "profile" && item.category === "focus");
  const hardwareFocus = nodes.find((item) => item.origin === "profile" && item.category === "focus" && /hardware|physical|prototype|electronic/.test(String(item.name || "").toLowerCase()));
  const arduinoNode = nodes.find((item) => item.origin === "profile" && /arduino/.test(String(item.name || "").toLowerCase()));

  if (node.category === "focus") {
    return { parentId: "project", relation: "focuses on" };
  }
  if (/arduino|microcontroller|sensor|motor|circuit/.test(lowerName)) {
    return { parentId: hardwareFocus?.id || focusNode?.id || "project", relation: "uses" };
  }
  if (/coding|programming|logic|code|sketch/.test(lowerName)) {
    return { parentId: arduinoNode?.id || hardwareFocus?.id || focusNode?.id || "project", relation: "controls with" };
  }
  if (/cad|rhino|model|3d/.test(lowerName)) {
    return { parentId: focusNode?.id || "project", relation: "shapes" };
  }
  return { parentId: focusNode?.id || "project", relation: "supports" };
}

function deriveKnowledgeEdges(nodes = []) {
  const primary = nodes
    .filter((node) => node?.id)
    .map((node) => ({
      from: node.parentId || "project",
      to: node.id,
      relation: node.relation || "supports",
      kind: "primary",
    }));
  const ids = new Set(nodes.map((node) => node.id));
  const cross = [];
  const seen = new Set(primary.map((edge) => `${edge.from}:${edge.to}`));
  const planNodes = nodes.filter((node) => node.origin === "plan");
  planNodes.forEach((node, index) => {
    const previous = planNodes[index - 1];
    if (!previous || previous.id === node.parentId || seen.has(`${previous.id}:${node.id}`)) return;
    seen.add(`${previous.id}:${node.id}`);
    cross.push({
      from: previous.id,
      to: node.id,
      relation: inferKnowledgeEdgeLabel(node, previous),
      kind: "cross",
    });
  });
  nodes.forEach((node) => (node.related || []).forEach((relatedId) => {
    if (!ids.has(relatedId) || seen.has(`${relatedId}:${node.id}`)) return;
    seen.add(`${relatedId}:${node.id}`);
    cross.push({ from: relatedId, to: node.id, relation: "connects", kind: "cross" });
  }));
  return [...primary, ...cross];
}

function inferKnowledgeEdgeLabel(node, previousNode, isFirstPlanNode = false) {
  const text = `${node?.name || ""} ${node?.category || ""}`.toLowerCase();
  if (isFirstPlanNode) return "starts with";
  if (/test|validate|evidence|debug|check/.test(text)) return "tests";
  if (/decide|decision|choose|result/.test(text)) return "decides";
  if (/motor|sensor|wire|component|prototype|build|circuit/.test(text)) return "builds";
  if (/code|logic|control|behaviour/.test(text)) return "controls";
  if (/summary|knowledge|map|review/.test(text)) return "reflects";
  if (previousNode?.category && node?.category && previousNode.category !== node.category) return "connects";
  return "enables";
}

function syncProfileKnowledgeNodes() {
  const map = state.knowledgeMap;
  if (!map) return;
  const hasProjectLearning = (map.nodes || []).some((node) => node.origin === "plan" || (node.evidence || []).some((item) => ["verified", "mastered", "upload", "struggling", "review started"].includes(item.type)));
  if (map.profileSyncPaused && !hasProjectLearning) return;
  const profile = state.learnerProfile || {};
  const profileNodes = [
    ...(profile.focus || []).map((focus) => ({
      profileKey: `focus-${focus}`,
      name: focus,
      category: "focus",
      status: "learning",
      confidence: .3,
      detail: "Added from your learning focus.",
    })),
    ...Object.entries(profile.skills || {}).map(([name, value]) => ({
      profileKey: `skill-${name}`,
      name,
      category: inferKnowledgeCategory(name),
      status: profileKnowledgeStatus(Number(value)),
      confidence: Number(value) / 100,
      detail: `Self-reported confidence: ${Number(value)}%.`,
    })),
  ];
  const activeProfileKeys = new Set(profileNodes.map((node) => node.profileKey));
  map.nodes = map.nodes.filter((node) => node.origin !== "profile" || activeProfileKeys.has(node.profileKey));
  profileNodes.forEach((profileNode) => {
    const existing = map.nodes.find((node) => node.profileKey === profileNode.profileKey);
    if (existing) {
      existing.name = profileNode.name;
      existing.category = profileNode.category;
      existing.status = profileNode.status;
      existing.confidence = profileNode.confidence;
      existing.detail = profileNode.detail;
      return;
    }
    map.nodes.push({
      id: `km-profile-${profileNode.profileKey}`,
      ...profileNode,
      origin: "profile",
      evidence: [{ type: "profile", detail: profileNode.detail, timestamp: new Date().toISOString() }],
      related: [],
      note: "",
    });
  });
  map.nodes
    .filter((node) => node.origin === "profile")
    .forEach((node) => {
      const categoryBranch = map.nodes.find((candidate) => candidate.origin === "branch" && candidate.category === node.category);
      if (categoryBranch) {
        node.parentId = categoryBranch.id;
        node.relation = "prior knowledge";
        return;
      }
      const { parentId, relation } = inferKnowledgeParentAndRelation(node, map.nodes);
      node.parentId = parentId;
      node.relation = relation;
    });
  map.edges = deriveKnowledgeEdges(map.nodes);
  if (!map.project) map.project = "Your learning map";
}

function syncKnowledgeBranchStatus() {
  const map = state.knowledgeMap;
  if (!map?.nodes?.length) return;
  map.nodes.filter((node) => node.origin === "branch").forEach((branch) => {
    const children = map.nodes.filter((node) => node.parentId === branch.id && node.origin !== "branch");
    if (!children.length) return;
    branch.confidence = children.reduce((total, node) => total + Number(node.confidence || 0), 0) / children.length;
    branch.status = children.some((node) => node.status === "struggling") ? "struggling"
      : children.every((node) => ["verified", "mastered"].includes(node.status)) ? "verified"
        : children.some((node) => node.status === "learning") ? "learning" : "not_started";
  });
  map.edges = deriveKnowledgeEdges(map.nodes);
}

function ensureKnowledgeBranches() {
  const map = state.knowledgeMap;
  const planNodes = (map?.nodes || []).filter((node) => node.origin === "plan");
  if (!planNodes.length) return;
  [...new Set(planNodes.map((node) => node.category || "concept"))].forEach((category) => {
    let branch = map.nodes.find((node) => node.origin === "branch" && node.category === category);
    if (!branch) {
      branch = {
        id: `km-branch-${category}`,
        name: knowledgeCategoryLabel(category),
        category,
        status: "not_started",
        confidence: 0,
        evidence: [],
        related: [],
        note: "",
        origin: "branch",
        parentId: "project",
        relation: "contains",
      };
      map.nodes.push(branch);
    }
    planNodes.filter((node) => node.category === category).forEach((node) => {
      node.parentId = branch.id;
      node.relation ||= "contains";
    });
  });
}

function createKnowledgeMapFromPlan(planSteps = []) {
  state.knowledgeMap.profileSyncPaused = false;
  syncProfileKnowledgeNodes();
  const previous = state.knowledgeMap.nodes || [];
  const profileNodes = previous.filter((node) => node.origin === "profile");
  const project = state.selectedTaskName || state.projectGoal || "Current project";
  const nodes = planSteps.map((step, index) => {
    const source = `${step.title || ""} ${step.detail || ""}`;
    const existing = previous.find((node) => node.stageKey === stages[index]?.key && node.name === (step.title || `Learning node ${index + 1}`));
    const node = existing || {
      id: `km-${Date.now()}-${index}`,
      stageKey: stages[index]?.key || "",
      name: shorten(step.title || `Learning node ${index + 1}`, 28),
      category: inferKnowledgeCategory(source),
      status: "not_started",
      confidence: 0,
      evidence: [],
      related: [],
      note: "",
    };
    node.origin = "plan";
    node.category = inferKnowledgeCategory(source);
    return node;
  });
  const learningName = shorten(state.learningContent || "Learning focus", 28);
  if (learningName && !nodes.some((node) => node.name.toLowerCase() === learningName.toLowerCase())) {
    nodes.unshift({
      id: `km-${Date.now()}-focus`,
      stageKey: stages[0]?.key || "",
      name: learningName,
      category: inferKnowledgeCategory(state.learningContent),
      status: "not_started",
      confidence: 0,
      evidence: [],
      related: [],
      note: "",
      origin: "plan",
    });
  }
  const categories = [...new Set(nodes.map((node) => node.category))];
  const branchNodes = categories.map((category) => {
    const children = nodes.filter((node) => node.category === category);
    const prior = previous.find((node) => node.origin === "branch" && node.category === category);
    const confidence = children.length ? children.reduce((sum, node) => sum + Number(node.confidence || 0), 0) / children.length : 0;
    const status = children.some((node) => node.status === "struggling") ? "struggling"
      : children.every((node) => ["verified", "mastered"].includes(node.status)) ? "verified"
        : children.some((node) => node.status === "learning") ? "learning" : "not_started";
    return {
      ...(prior || {}),
      id: prior?.id || `km-branch-${category}`,
      name: knowledgeCategoryLabel(category),
      category,
      status,
      confidence,
      evidence: prior?.evidence || [],
      related: [],
      note: "",
      origin: "branch",
      parentId: "project",
      relation: "contains",
    };
  });
  nodes.forEach((node, index) => {
    node.parentId = branchNodes.find((branch) => branch.category === node.category)?.id || "project";
    node.relation = inferKnowledgeEdgeLabel(node, nodes[index - 1], index === 0);
    node.related = index ? [nodes[index - 1].id] : [];
  });
  profileNodes.forEach((node) => {
    const categoryBranch = branchNodes.find((branch) => branch.category === node.category);
    if (!categoryBranch) return;
    node.parentId = categoryBranch.id;
    node.relation = "prior knowledge";
  });
  const mapNodes = [...profileNodes, ...branchNodes, ...nodes];
  state.knowledgeMap = {
    project,
    nodes: mapNodes,
    edges: deriveKnowledgeEdges(mapNodes),
    selectedNodeId: "",
    filter: "all",
  };
  renderKnowledgeMap();
}

function updateKnowledgeFromStage(stage, event, detail = "") {
  const map = state.knowledgeMap;
  const node = map.nodes.find((item) => item.stageKey === stage.key) || map.nodes[0];
  if (!node) return;
  const stamp = new Date().toISOString();
  if (event === "learning" && node.status === "not_started") node.status = "learning";
  if (event === "struggling") node.status = "struggling";
  if (event === "verified") node.status = "verified";
  if (event === "mastered") node.status = "mastered";
  node.evidence.push({ type: event, detail: detail || stage.title, timestamp: stamp });
  const completed = node.evidence.filter((item) => item.type === "verified").length;
  const support = node.evidence.filter((item) => item.type === "struggling").length;
  const uploads = node.evidence.filter((item) => item.type === "upload").length;
  node.confidence = Math.max(0, Math.min(1, .35 + completed * .2 + uploads * .15 - support * .12));
  if (node.status === "verified" && completed > 1 && support === 0) node.status = "mastered";
  renderKnowledgeMap();
}

function tutorialKnowledgeMapPreviewIsActive() {
  return Boolean(productTour && !productTour.hidden && !state.productTourComplete
    && productTourSlides[state.productTourStep]?.key === "history");
}

function buildTutorialKnowledgeMapPreview() {
  const nodes = [
    { id: "tour-map-hardware", name: "Hardware", category: "component", status: "learning", confidence: .35, evidence: [], related: [], origin: "branch", parentId: "project" },
    { id: "tour-map-motor", name: "Motor control", category: "component", status: "verified", confidence: .72, evidence: [], related: [], origin: "plan", parentId: "tour-map-hardware" },
    { id: "tour-map-sensor", name: "Sensor logic", category: "knowledge", status: "learning", confidence: .42, evidence: [], related: [], origin: "plan", parentId: "tour-map-hardware" },
    { id: "tour-map-evidence", name: "Evidence", category: "knowledge", status: "learning", confidence: .32, evidence: [], related: [], origin: "branch", parentId: "project" },
    { id: "tour-map-test", name: "Test record", category: "knowledge", status: "not_started", confidence: .08, evidence: [], related: [], origin: "plan", parentId: "tour-map-evidence" },
  ];
  return {
    project: "Robot build",
    nodes,
    edges: [
      { from: "project", to: "tour-map-hardware", kind: "primary", relation: "contains" },
      { from: "tour-map-hardware", to: "tour-map-motor", kind: "primary", relation: "supports" },
      { from: "tour-map-hardware", to: "tour-map-sensor", kind: "primary", relation: "supports" },
      { from: "project", to: "tour-map-evidence", kind: "primary", relation: "contains" },
      { from: "tour-map-evidence", to: "tour-map-test", kind: "primary", relation: "records" },
    ],
    selectedNodeId: "",
    filter: "all",
  };
}

function renderKnowledgeMapSurface({ canvas, summary, detail }) {
  if (!canvas || !summary || !detail) return;
  const tourMapPreview = tutorialKnowledgeMapPreviewIsActive();
  const map = tourMapPreview ? buildTutorialKnowledgeMapPreview() : state.knowledgeMap;
  const nodes = map.nodes || [];
  const topicNodes = nodes.filter((node) => node.origin !== "branch");
  const filtered = map.filter === "all" ? nodes : nodes.filter((node) => node.status === map.filter);
  const ancestorIds = new Set(filtered.map((node) => node.parentId).filter((id) => id && id !== "project"));
  const visible = map.filter === "all" ? nodes : nodes.filter((node) => node.status === map.filter || ancestorIds.has(node.id));
  const counts = (status) => topicNodes.filter((node) => node.status === status).length;
  const summaryItems = [];
  if (topicNodes.length) summaryItems.push(`${topicNodes.length} topics`);
  if (counts("learning")) summaryItems.push(`${counts("learning")} in progress`);
  if (counts("struggling")) summaryItems.push(`${counts("struggling")} to revisit`);
  summary.innerHTML = summaryItems.map((item) => `<span>${item}</span>`).join("");
  if (visible.length) {
    const isExpanded = canvas.classList.contains("map-canvas-expanded");
    const { root, positions } = knowledgeMapPositions(visible, map.edges || [], canvas);
    const visibleIds = new Set(visible.map((node) => node.id));
    const selectedId = map.selectedNodeId;
    const selectedNeighbourIds = new Set([selectedId]);
    if (selectedId) (map.edges || []).forEach((edge) => {
      if (edge.from === selectedId) selectedNeighbourIds.add(edge.to);
      if (edge.to === selectedId) selectedNeighbourIds.add(edge.from);
    });
    const links = (map.edges || [])
      .filter((edge) => visibleIds.has(edge.to) && (edge.from === "project" || visibleIds.has(edge.from)))
      .map((edge) => {
        const target = positions.get(edge.to);
        const source = edge.from === "project" || !visibleIds.has(edge.from) ? root : positions.get(edge.from);
        if (!source || !target) return "";
        const c1x = source.x + (target.x - source.x) * .36;
        const c2x = source.x + (target.x - source.x) * .72;
        const labelX = source.x + (target.x - source.x) * .52;
        const labelY = source.y + (target.y - source.y) * .5 - 3.2;
        const selectedEdge = selectedId && (edge.from === selectedId || edge.to === selectedId);
        const dimmed = selectedId && !selectedEdge;
        return `
          <path class="${edge.kind === "cross" ? "cross-link" : "primary-link"}${selectedEdge ? " selected-link" : ""}${dimmed ? " dimmed-link" : ""}" d="M${source.x} ${source.y} C${c1x.toFixed(1)} ${source.y.toFixed(1)} ${c2x.toFixed(1)} ${target.y.toFixed(1)} ${target.x} ${target.y}" />
          ${isExpanded && selectedEdge ? `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}">${escapeHtml(shorten(edge.relation || "supports", 14))}</text>` : ""}
        `;
      })
      .join("");
    canvas.innerHTML = `
      <svg class="knowledge-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${links}</svg>
      <button class="map-root" type="button" data-km-root title="Current learning map" style="--root-x:${root.x}%;--root-y:${root.y}%;">
        <span>Learning</span><b>${escapeHtml(shorten(map.project || "Your learning map", 22))}</b>
      </button>
      ${visible.map((node) => {
        const position = positions.get(node.id);
        if (!position) return "";
        const badge = knowledgeNodeBadge(node);
        const muted = selectedId && !selectedNeighbourIds.has(node.id);
        const labelLimit = node.origin === "branch" ? 18 : 16;
        const label = shorten(node.name, labelLimit);
        const labelClass = label.length > 13 ? "label-long" : "";
        return `<button class="map-node ${node.origin === "branch" ? "branch-node" : "topic-node"} ${labelClass} status-${escapeHtml(node.status)} ${map.selectedNodeId === node.id ? "selected" : ""} ${muted ? "muted" : ""}" type="button" data-km-node="${escapeHtml(node.id)}" title="${escapeHtml(`${node.name} · ${knowledgeStatusLabel(node.status)} · Drag to rearrange`)}" style="--map-x:${position.x}%;--map-y:${position.y}%;--map-size:${position.size}px;"><i aria-hidden="true"></i><b>${escapeHtml(label)}</b>${badge ? `<em class="map-node-badge badge-${escapeHtml(node.status)}" title="${escapeHtml(badge.label)}">${badge.symbol}</em>` : ""}</button>`;
      }).join("")}
    `;
  } else {
    canvas.innerHTML = "";
  }
  canvas.classList.toggle("has-selection", Boolean(map.selectedNodeId));
  canvas.classList.toggle("tour-map-preview", tourMapPreview);
  if (tourMapPreview) {
    detail.hidden = true;
    return;
  }
  canvas.querySelectorAll("[data-km-node]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.dragged === "true") {
        delete button.dataset.dragged;
        return;
      }
      map.selectedNodeId = button.dataset.kmNode;
      renderKnowledgeMap();
    });
  });
  enableKnowledgeMapDrag(canvas, map);
  canvas.querySelector("[data-km-root]")?.addEventListener("click", () => {
    map.selectedNodeId = "";
    renderKnowledgeMap();
  });
  const selected = nodes.find((node) => node.id === map.selectedNodeId);
  detail.hidden = !selected;
  if (!selected) return;
  const parentEdge = (map.edges || []).find((edge) => edge.to === selected.id);
  const parent = parentEdge ? nodes.find((node) => node.id === parentEdge.from) : null;
  const children = (map.edges || []).filter((edge) => edge.from === selected.id && edge.kind !== "cross").map((edge) => nodes.find((node) => node.id === edge.to)).filter(Boolean);
  const isBranch = selected.origin === "branch";
  const reviewCue = selected.status === "struggling"
    ? `Revisit one concrete example of ${selected.name}.`
    : selected.status === "not_started"
      ? `Try one small project check using ${selected.name}.`
      : `Use ${selected.name} once in your next project task.`;
  detail.innerHTML = `
    <div class="node-review-header">
      <div><span>${escapeHtml(knowledgeStatusLabel(selected.status))}</span><strong>${escapeHtml(selected.name)}</strong></div>
      <button type="button" data-close-km aria-label="Close">×</button>
    </div>
    ${isBranch ? `
      <div class="km-branch-topics">
        ${children.length ? children.map((child) => `<button type="button" data-km-open-child="${escapeHtml(child.id)}"><i class="status-${escapeHtml(child.status)}"></i><b>${escapeHtml(child.name)}</b><small>${escapeHtml(knowledgeStatusLabel(child.status))}</small><em>→</em></button>`).join("") : `<p>No knowledge saved here yet.</p>`}
      </div>
    ` : `
      <div class="node-review-next">
        <span>Next check</span>
        <strong>${escapeHtml(reviewCue)}</strong>
        ${parent ? `<small>Linked to ${escapeHtml(parent.name)}</small>` : ""}
      </div>
      <div class="node-review-actions">
        <button type="button" data-km-action="review">Start review</button>
        <button type="button" data-km-action="confident">Mark confident</button>
        <button type="button" data-km-action="later">Review later</button>
      </div>
    `}`;
  detail.querySelector("[data-close-km]").addEventListener("click", () => {
    map.selectedNodeId = "";
    renderKnowledgeMap();
  });
  detail.querySelectorAll("[data-km-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.kmAction;
      const timestamp = new Date().toISOString();
      if (action === "review") {
        selected.status = "learning";
        selected.evidence.push({ type: "review started", detail: `Student started a focused review of ${selected.name}.`, timestamp });
        selected.confidence = Math.max(.25, selected.confidence || 0);
      } else if (action === "confident") {
        selected.status = "verified";
        selected.evidence.push({ type: "verified", detail: `Student marked ${selected.name} as confident after review.`, timestamp });
        selected.confidence = Math.max(.75, selected.confidence || 0);
      } else {
        selected.status = "struggling";
        selected.evidence.push({ type: "review later", detail: `Student deferred ${selected.name} for a later review.`, timestamp });
        selected.confidence = Math.min(selected.confidence || .35, .35);
      }
      renderKnowledgeMap();
    });
  });
  detail.querySelectorAll("[data-km-open-child]").forEach((button) => {
    button.addEventListener("click", () => {
      map.selectedNodeId = button.dataset.kmOpenChild;
      renderKnowledgeMap();
    });
  });
}

function renderMapReview() {
  if (!mapReviewList) return;
  const reviewPanel = mapReviewList.closest(".map-review-panel");
  const nodes = (state.knowledgeMap.nodes || []).filter((node) => node.origin !== "branch" && (node.origin !== "profile" || node.status === "struggling"));
  const urgency = { struggling: 0, not_started: 1, learning: 2, verified: 3, mastered: 4 };
  const targets = nodes.sort((first, second) => (urgency[first.status] ?? 9) - (urgency[second.status] ?? 9) || first.confidence - second.confidence).slice(0, 3);
  if (reviewPanel) reviewPanel.hidden = !targets.length;
  if (!targets.length) {
    mapReviewList.innerHTML = "";
    return;
  }
  mapReviewList.innerHTML = targets.map((node) => `<button class="review-node status-${escapeHtml(node.status)}" type="button" data-review-node="${escapeHtml(node.id)}"><i></i><span><b>${escapeHtml(shorten(node.name, 25))}</b><small>${escapeHtml(node.status === "struggling" ? "Needs a focused check" : node.status === "not_started" ? "Try one small first step" : "Strengthen with one more use")}</small></span><em>→</em></button>`).join("");
  mapReviewList.querySelectorAll("[data-review-node]").forEach((button) => button.addEventListener("click", () => {
    state.knowledgeMap.selectedNodeId = button.dataset.reviewNode;
    state.knowledgeMap.filter = "all";
    setKnowledgeMapFilter("all", false);
    renderKnowledgeMap();
  }));
}

function renderLearningHistory() {
  if (!learningHistory) return;
  const map = state.knowledgeMap;
  const records = (map.nodes || []).filter((node) => (node.evidence || []).some((item) => ["verified", "mastered", "upload"].includes(item.type))).slice(-3).reverse();
  learningHistory.innerHTML = records.length
    ? records.map((node) => `<button class="history-card" type="button" data-history-node="${escapeHtml(node.id)}">${historyIconMarkup(node)}<strong>${escapeHtml(node.name)}</strong><small>${escapeHtml(knowledgeStatusLabel(node.status))}</small></button>`).join("")
    : `<div class="history-empty"><strong>No saved learning yet</strong><div class="history-empty-ghosts" aria-hidden="true"><i></i><i></i><i></i></div></div>`;
  learningHistory.querySelectorAll("[data-history-node]").forEach((button) => button.addEventListener("click", () => {
    map.selectedNodeId = button.dataset.historyNode;
    renderKnowledgeMap();
  }));
}

function historyIconMarkup(node) {
  const status = escapeHtml(node.status || "learning");
  return `<span class="history-icon status-${status}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5.5 4.5A2.5 2.5 0 0 1 8 2h10v17H8a2.5 2.5 0 0 0-2.5 2.5z"/><path d="M5.5 4.5v17"/><path d="M8.5 6h6M8.5 10h6M8.5 14h4"/></svg></span>`;
}

function renderKnowledgeMap() {
  ensureKnowledgeBranches();
  syncProfileKnowledgeNodes();
  syncKnowledgeBranchStatus();
  updateLearnerProfileView();
  renderKnowledgeMapSurface({ canvas: knowledgeMapCanvas, summary: knowledgeMapSummary, detail: knowledgeNodeDetail });
  if (knowledgeMapModal && !knowledgeMapModal.hidden) {
    expandedMapFilterButtons.forEach((button) => button.classList.toggle("selected", button.dataset.expandedMapFilter === state.knowledgeMap.filter));
    renderKnowledgeMapSurface({ canvas: knowledgeMapExpandedCanvas, summary: knowledgeMapExpandedSummary, detail: knowledgeMapExpandedDetail });
  }
  renderMapReview();
  renderLearningHistory();
}

function knowledgeMapPositions(nodes, edges = [], canvas = null) {
  const visibleIds = new Set(nodes.map((node) => node.id));
  const parentById = new Map();
  const childrenByParent = new Map([["project", []]]);
  const byId = new Map(nodes.map((node) => [node.id, node]));

  edges.filter((edge) => edge.kind !== "cross").forEach((edge) => {
    if (!visibleIds.has(edge.to)) return;
    const parentId = visibleIds.has(edge.from) ? edge.from : "project";
    parentById.set(edge.to, parentId);
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(edge.to);
  });

  nodes.forEach((node) => {
    if (!parentById.has(node.id)) {
      parentById.set(node.id, "project");
      childrenByParent.get("project").push(node.id);
    }
    if (!childrenByParent.has(node.id)) childrenByParent.set(node.id, []);
  });

  const sortChildren = (ids = []) => ids.sort((a, b) => {
    const first = byId.get(a);
    const second = byId.get(b);
    const categoryOrder = ["focus", "tool", "skill", "component", "knowledge", "decision"];
    const firstRank = categoryOrder.indexOf(first?.category);
    const secondRank = categoryOrder.indexOf(second?.category);
    if (firstRank !== secondRank) return (firstRank === -1 ? 99 : firstRank) - (secondRank === -1 ? 99 : secondRank);
    return String(first?.name || "").localeCompare(String(second?.name || ""));
  });

  childrenByParent.forEach((ids, key) => {
    childrenByParent.set(key, sortChildren(ids));
  });

  const visibleCount = nodes.length;
  const canvasWidth = Math.max(canvas?.clientWidth || 0, 440);
  const canvasHeight = Math.max(canvas?.clientHeight || 0, 300);
  const rootPx = { x: canvasWidth / 2, y: canvasHeight / 2, size: 76 };
  const positionsPx = new Map();
  const rootChildren = childrenByParent.get("project") || [];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const pointAt = (angle, radiusX, radiusY) => {
    const radians = angle * Math.PI / 180;
    return {
      x: rootPx.x + Math.cos(radians) * radiusX,
      y: rootPx.y + Math.sin(radians) * radiusY,
    };
  };
  const sizeFor = (node, depth) => {
    if (node?.origin === "branch") return visibleCount > 8 ? 50 : 56;
    if (depth === 1) return visibleCount > 8 ? 42 : 47;
    return visibleCount > 8 ? 36 : 42;
  };

  // The radii are derived from the visible canvas, so a narrow desktop window
  // keeps readable circles while a larger window gains breathing room.
  const innerRadiusX = Math.max(92, Math.min(canvasWidth * .30, canvasHeight * .52));
  const innerRadiusY = Math.max(82, Math.min(canvasHeight * .29, canvasWidth * .23));
  const outerRadiusX = Math.max(innerRadiusX + 66, Math.min(canvasWidth * .44, canvasWidth / 2 - 32));
  const outerRadiusY = Math.max(innerRadiusY + 56, Math.min(canvasHeight * .43, canvasHeight / 2 - 30));

  // Each top-level branch receives its own angular sector. This keeps a category and
  // its topics together while making collisions between unrelated branches unlikely.
  const branchGroups = rootChildren.map((id) => ({ id, children: childrenByParent.get(id) || [] }));
  const totalWeight = branchGroups.reduce((sum, group) => sum + Math.max(1, group.children.length) + 1, 0) || 1;
  let cursor = -90;
  branchGroups.forEach((group) => {
    const weight = Math.max(1, group.children.length) + 1;
    const sector = (360 * weight) / totalWeight;
    const branchAngle = cursor + sector / 2;
    const branchNode = byId.get(group.id);
    positionsPx.set(group.id, { ...pointAt(branchAngle, innerRadiusX, innerRadiusY), size: sizeFor(branchNode, 1) });

    const leafIds = group.children.length ? group.children : [];
    leafIds.forEach((childId, index) => {
      const ratio = (index + 1) / (leafIds.length + 1);
      const leafAngle = cursor + sector * ratio;
      const childNode = byId.get(childId);
      positionsPx.set(childId, { ...pointAt(leafAngle, outerRadiusX, outerRadiusY), size: sizeFor(childNode, 2) });
      const grandchildren = childrenByParent.get(childId) || [];
      grandchildren.forEach((grandchildId, grandchildIndex) => {
        const direction = grandchildIndex % 2 ? 1 : -1;
        const grandchildAngle = leafAngle + direction * (12 + grandchildIndex * 7);
        positionsPx.set(grandchildId, { ...pointAt(grandchildAngle, outerRadiusX + 10, outerRadiusY + 10), size: sizeFor(byId.get(grandchildId), 3) });
      });
    });
    cursor += sector;
  });

  // Manual positions are intentionally relative, so they remain usable in both map sizes.
  nodes.forEach((node) => {
    const manual = node.mapPosition;
    const computed = positionsPx.get(node.id);
    if (!manual || !computed || !Number.isFinite(Number(manual.x)) || !Number.isFinite(Number(manual.y))) return;
    positionsPx.set(node.id, {
      ...computed,
      x: (Number(manual.x) / 100) * canvasWidth,
      y: (Number(manual.y) / 100) * canvasHeight,
    });
  });

  // A radial tree can still collide when a branch has several leaves or an
  // existing map has been manually rearranged. Resolve collisions in pixels
  // so the same safety gap works at every window size.
  const positioned = Array.from(positionsPx.entries()).map(([id, position]) => ({ id, ...position }));
  const contain = (position) => {
    const radius = position.size / 2 + 8;
    position.x = clamp(position.x, radius, canvasWidth - radius);
    position.y = clamp(position.y, radius, canvasHeight - radius);
  };
  positioned.forEach(contain);
  for (let iteration = 0; iteration < 80; iteration += 1) {
    let adjusted = false;
    positioned.forEach((position) => {
      const dx = position.x - rootPx.x;
      const dy = position.y - rootPx.y;
      const distance = Math.hypot(dx, dy) || 0.01;
      const required = position.size / 2 + rootPx.size / 2 + 11;
      if (distance < required) {
        const push = (required - distance) * .56;
        position.x += (dx / distance) * push;
        position.y += (dy / distance) * push;
        contain(position);
        adjusted = true;
      }
    });
    for (let firstIndex = 0; firstIndex < positioned.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < positioned.length; secondIndex += 1) {
        const first = positioned[firstIndex];
        const second = positioned[secondIndex];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy) || 0.01;
        const required = first.size / 2 + second.size / 2 + 10;
        if (distance >= required) continue;
        const push = (required - distance) * .52;
        first.x -= (dx / distance) * push;
        first.y -= (dy / distance) * push;
        second.x += (dx / distance) * push;
        second.y += (dy / distance) * push;
        contain(first);
        contain(second);
        adjusted = true;
      }
    }
    if (!adjusted) break;
  }

  const positions = new Map(positioned.map((position) => [position.id, {
    ...position,
    x: Number(((position.x / canvasWidth) * 100).toFixed(1)),
    y: Number(((position.y / canvasHeight) * 100).toFixed(1)),
  }]));

  return {
    root: {
      x: Number(((rootPx.x / canvasWidth) * 100).toFixed(1)),
      y: Number(((rootPx.y / canvasHeight) * 100).toFixed(1)),
    },
    positions,
  };
}

function enableKnowledgeMapDrag(canvas, map) {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  canvas.querySelectorAll("[data-km-node]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const node = map.nodes.find((item) => item.id === button.dataset.kmNode);
      if (!node) return;
      const bounds = canvas.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      let moved = false;
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("dragging");

      const move = (moveEvent) => {
        const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
        if (distance > 5) moved = true;
        if (!moved) return;
        const x = clamp(((moveEvent.clientX - bounds.left) / bounds.width) * 100, 8, 92);
        const y = clamp(((moveEvent.clientY - bounds.top) / bounds.height) * 100, 10, 90);
        button.style.setProperty("--map-x", `${x}%`);
        button.style.setProperty("--map-y", `${y}%`);
      };

      const end = (endEvent) => {
        button.removeEventListener("pointermove", move);
        button.removeEventListener("pointerup", end);
        button.removeEventListener("pointercancel", end);
        button.classList.remove("dragging");
        button.releasePointerCapture?.(endEvent.pointerId);
        if (!moved) return;
        const x = clamp(((endEvent.clientX - bounds.left) / bounds.width) * 100, 8, 92);
        const y = clamp(((endEvent.clientY - bounds.top) / bounds.height) * 100, 10, 90);
        node.mapPosition = { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
        button.dataset.dragged = "true";
        window.setTimeout(() => renderKnowledgeMap(), 0);
      };

      button.addEventListener("pointermove", move);
      button.addEventListener("pointerup", end);
      button.addEventListener("pointercancel", end);
    });
  });
}

function setKnowledgeMapFilter(filter, shouldRender = true) {
  const labels = { all: "All", learning: "Learning", verified: "Verified", struggling: "Needs review" };
  state.knowledgeMap.filter = filter;
  if (knowledgeMapFilterLabel) knowledgeMapFilterLabel.textContent = labels[filter] || labels.all;
  knowledgeMapFilterButtons.forEach((button) => button.classList.toggle("selected", button.dataset.mapFilter === filter));
  expandedMapFilterButtons.forEach((button) => button.classList.toggle("selected", button.dataset.expandedMapFilter === filter));
  if (shouldRender) renderKnowledgeMap();
}

function closeKnowledgeMapFilter() {
  if (!knowledgeMapFilter || !knowledgeMapFilterOptions || !knowledgeMapFilterToggle) return;
  knowledgeMapFilter.classList.remove("open");
  knowledgeMapFilterOptions.hidden = true;
  knowledgeMapFilterToggle.setAttribute("aria-expanded", "false");
}

knowledgeMapFilterToggle?.addEventListener("click", () => {
  const isOpen = knowledgeMapFilter.classList.toggle("open");
  knowledgeMapFilterOptions.hidden = !isOpen;
  knowledgeMapFilterToggle.setAttribute("aria-expanded", String(isOpen));
});
knowledgeMapFilterButtons.forEach((button) => button.addEventListener("click", () => {
  setKnowledgeMapFilter(button.dataset.mapFilter);
  closeKnowledgeMapFilter();
}));
document.addEventListener("click", (event) => {
  if (knowledgeMapFilter && !knowledgeMapFilter.contains(event.target)) closeKnowledgeMapFilter();
});
expandedMapFilterButtons.forEach((button) => button.addEventListener("click", () => {
  setKnowledgeMapFilter(button.dataset.expandedMapFilter);
}));
openKnowledgeMap?.addEventListener("click", () => {
  knowledgeMapModal.hidden = false;
  document.body.classList.add("knowledge-map-open");
  renderKnowledgeMap();
});
closeKnowledgeMap?.addEventListener("click", () => {
  knowledgeMapModal.hidden = true;
  document.body.classList.remove("knowledge-map-open");
});
knowledgeMapModal?.addEventListener("click", (event) => {
  if (event.target !== knowledgeMapModal) return;
  knowledgeMapModal.hidden = true;
  document.body.classList.remove("knowledge-map-open");
});
showWeakNodes?.addEventListener("click", () => {
  setKnowledgeMapFilter("struggling");
});
showEvidenceBank?.addEventListener("click", () => {
  const firstEvidence = state.knowledgeMap.nodes.find((node) => node.evidence.length);
  if (firstEvidence) state.knowledgeMap.selectedNodeId = firstEvidence.id;
  renderKnowledgeMap();
});

function setView(view) {
  state.view = view;
  document.body.dataset.view = view;
  document.body.classList.toggle("plan-editor-active", view === "plan" && state.planEditorOpen);
  homePanel.hidden = view !== "home";
  setupPanel.hidden = view !== "setup";
  generatingPanel.hidden = view !== "generating";
  planPanel.hidden = view !== "plan";
  resultPanel.hidden = view !== "result";
  pathPanel.hidden = view !== "flow";
  stepPanel.hidden = view !== "flow";
  coachFooter.hidden = view !== "flow";
  nextButton.hidden = view !== "flow";
  coachResponse.hidden = true;
  if (view === "setup") updateSetupMode();
  updateHeader();
  updateSupportLensAvailability();
  renderMainEntryNav();
  if (view === "result") renderDecisionRecord();
  if (view === "home" && state.homeTab === "history") renderKnowledgeMap();
  resetViewScroll(view);
}

// Each primary view owns its own scroll position. Reset only when navigating
// between views so a new page always opens at its heading without disrupting
// in-page work such as expanding a checklist or a Knowledge Map node.
function resetViewScroll(view) {
  const panelsByView = {
    home: [homePanel],
    setup: [setupPanel],
    generating: [generatingPanel],
    plan: [planPanel],
    flow: [pathPanel, stepPanel],
    result: [resultPanel],
  };
  const targets = panelsByView[view] || [];
  const reset = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    targets.forEach((target) => {
      if (!target) return;
      target.scrollTop = 0;
      target.scrollLeft = 0;
    });
  };
  reset();
  window.requestAnimationFrame(reset);
}

function updateSupportLensAvailability() {
  const shouldShowSupportLens = state.view === "flow" && Boolean(currentStage());
  supportLensButton.hidden = !shouldShowSupportLens;
  if (!shouldShowSupportLens) supportLensModal.hidden = true;
}

function updateHeader() {
  const view = viewFlow.find((item) => item.key === state.view) || viewFlow[0];
  if (state.view === "home" && state.homeTab === "history") {
    headerMark.textContent = "Learning Records";
    headerTitle.textContent = "My learning history";
    headerSubtitle.textContent = "Review previous reasoning and learning records.";
    return;
  }
  if (state.view === "home" && state.homeTab === "info") {
    headerMark.textContent = "Learner Profile";
    headerTitle.textContent = "My Information";
    headerSubtitle.textContent = "Information used to adapt coaching support.";
    return;
  }
  if (state.view === "setup" && state.setupPurpose === "material") {
    headerMark.textContent = "Project Files";
    headerTitle.textContent = "Add material";
    headerSubtitle.textContent = "Upload or paste project material, then return to the project.";
    return;
  }
  headerMark.textContent = view.mark;
  headerTitle.textContent = view.title;
  headerSubtitle.textContent = view.subtitle;
}

function renderMainEntryNav() {
  const activeEntry = state.view === "home" ? state.homeTab : "new";
  mainEntryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mainEntry === activeEntry);
  });
  homeTabSections.forEach((section) => {
    section.hidden = state.homeTab !== section.dataset.homeTab;
  });
  updateEmptyStartGuide();
}

function updateEmptyStartGuide() {
  if (!emptyStartGuide) return;
  const hasProjects = Boolean(projectShelf.querySelector(".project-file:not(.create-project-file)"));
  emptyStartGuide.hidden = hasProjects;
  projectShelf.hidden = !hasProjects;
}

function setIntroSlide(slide) {
  if (!homeProductPreview) return;
  const captions = {
    upload: {
      title: "Add project material so the coach can work from your real context.",
    },
    plan: {
      title: "The coach turns your goal and material into a focused learning plan.",
    },
    chain: {
      title: "Add your reasoning first, then use the coach note only when it helps.",
    },
    result: {
      title: "Save a student-owned record of your decision, rationale and evidence.",
    },
  };
  const selected = captions[slide] ? slide : "upload";
  homeProductPreview.dataset.introSlide = selected;
  introSlideButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.introSlide === selected);
  });
  if (previewCaptionTitle) previewCaptionTitle.textContent = captions[selected].title;
}

function startIntroSlideAutoplay() {
  if (introSlideTimer) window.clearInterval(introSlideTimer);
  introSlideTimer = window.setInterval(() => {
    if (state.view !== "home" || state.homeTab !== "new" || emptyStartGuide.hidden) return;
    const current = homeProductPreview?.dataset.introSlide || "upload";
    const currentIndex = introSlideOrder.indexOf(current);
    const nextSlide = introSlideOrder[(currentIndex + 1) % introSlideOrder.length] || "upload";
    setIntroSlide(nextSlide);
  }, 4200);
}

function inferStartPoint() {
  const content = state.learningContent.toLowerCase();
  if (content.includes("error") || content.includes("debug")) return "Start from identifying what needs to be checked before debugging.";
  if (content.includes("ai") || content.includes("answer") || content.includes("output")) return "Start from judging whether the AI output fits your project context.";
  if (content.includes("software") || content.includes("tool") || content.includes("step")) return "Start from understanding the tool step and why it matters to your project.";
  if (content.includes("sensor") || content.includes("arduino") || content.includes("hardware")) return "Start from identifying the technical concept and the smallest safe test.";
  return "Start from clarifying the first learning or verification need.";
}

restoreWorkspace();
updateLearnerProfileView();
renderKnowledgeMap();
setView("home");
setIntroSlide("upload");
startIntroSlideAutoplay();
updateModeToggleIcon();
checkAgentStatus();

// Projects, learning records, the capability profile and Knowledge Map are kept
// locally for the current device. Event delegation also catches newly created tasks.
document.addEventListener("click", () => window.setTimeout(scheduleWorkspaceSave, 0));
document.addEventListener("input", scheduleWorkspaceSave);
new MutationObserver(scheduleWorkspaceSave).observe(projectShelf, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-project-name", "data-task-name", "data-generated-plan", "data-project-material"] });
new MutationObserver(scheduleWorkspaceSave).observe(projectDetail, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-project-goal", "data-learning-content", "data-generated-plan", "data-task-progress"] });
window.addEventListener("beforeunload", saveWorkspaceNow);

function updateModeToggleIcon() {
  const isCompact = document.body.classList.contains("compact-mode");
  modeToggle.setAttribute("aria-label", isCompact ? "Expand window" : "Shrink window");
  modeToggle.setAttribute("title", isCompact ? "Expand window" : "Shrink window");
  modeToggle.innerHTML = isCompact ? `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8V3h5" />
      <path d="M21 16v5h-5" />
      <path d="M8 3L3 8" />
      <path d="M16 21l5-5" />
    </svg>
  ` : `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 3v5H3" />
      <path d="M16 21v-5h5" />
      <path d="M3 8l5-5" />
      <path d="M21 16l-5 5" />
    </svg>
  `;
}

function render() {
  const stage = currentStage();
  const displayTitle = getStageDisplayTitle(stage);
  const doingStage = isDoingStage(stage);
  state.currentStage = stage.key;
  stepLabel.textContent = doingStage ? "Doing" : displayTitle;
  stepTitle.textContent = displayTitle;
  stepPrompt.textContent = getStableStagePrompt(stage);
  stepCount.textContent = `${currentStageIndex + 1} / ${stages.length}`;
  renderController();
  renderPath();
  renderStageOverview();
  updateRationale();
  updateNextButton();
  const hasStageReasoning = Boolean(buildStageReasoningSummary(stage.key));
  coachFooter.hidden = doingStage;
  askRow.hidden = true;
  nextButton.hidden = doingStage;
  generateButton.hidden = true;
  generateButton.disabled = false;
  coachResponse.hidden = true;
  generateButton.setAttribute("aria-label", doingStage ? "Ask coach if stuck" : hasStageReasoning ? "Get coach comment" : "Ask coach");
  generateButton.setAttribute("title", doingStage ? "Ask only when you need support" : hasStageReasoning ? "Get coach comment" : "Ask coach");
  generateButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h14v10H8l-3 3V5Z" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
    </svg>
  `;
  persistTaskProgress();
}

function updateNextButton() {
  const stage = currentStage();
  const isFinal = currentStageIndex === stages.length - 1;
  const progress = getReasoningStageProgress(stage);
  const ready = isDoingStage(stage) || progress.complete;
  const label = ready
    ? (isFinal ? "Review task record" : "Next milestone")
    : "Save all items to continue";
  nextButton.disabled = !ready;
  const actionLabel = ready
    ? (isFinal ? "Review task record" : "Continue to next milestone")
    : "Save all reasoning items to continue";
  nextButton.setAttribute("aria-label", actionLabel);
  nextButton.setAttribute("title", actionLabel);
  nextButton.innerHTML = isFinal ? `
    <span>${label}</span>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
      <path d="M14 3v4h4" />
    </svg>
  ` : `
    <span>${label}</span>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  `;
}

function getReasoningStageProgress(stage) {
  if (isDoingStage(stage)) return { saved: 1, total: 1, complete: true };
  const chain = stageReasoningChains[stage.key] || [];
  const saved = chain.filter((item) => state.chainRecords[stage.key]?.[item.key]?.saved).length;
  return {
    saved,
    total: chain.length,
    complete: chain.length > 0 && saved === chain.length
  };
}

function isReasoningStageComplete(stage) {
  return getReasoningStageProgress(stage).complete;
}

function advanceCurrentStage() {
  const stage = currentStage();
  const progress = getReasoningStageProgress(stage);
  if (!isDoingStage(stage) && !progress.complete) {
    state.stageAdvanceHint = "Save all reasoning items before continuing.";
    render();
    return;
  }
  state.stageAdvanceHint = "";
  state.completedStages[stage.key] = true;
  if (isDoingStage(stage) && !state.records[stage.key].selected) {
    state.records[stage.key].selected = "Done";
    state.records[stage.key].note = `Completed ${getStageDisplayTitle(stage)}.`;
    updateKnowledgeMapFromStage(stage);
  }
  if (currentStageIndex < stages.length - 1) {
    currentStageIndex += 1;
    state.coachDraftChoice = "";
    render();
    coachResponse.hidden = true;
    resetViewScroll("flow");
    return;
  }
  persistTaskProgress(getActiveTaskRow(), { finished: true });
  showFinalDecisionResult();
}

function renderController() {
  stageController.innerHTML = "";
  stages.forEach((stage, index) => {
    const displayTitle = getStageDisplayTitle(stage);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stage-tab";
    if (index === currentStageIndex) button.classList.add("active");
    button.textContent = displayTitle;
    button.title = `${stage.title}: ${displayTitle}`;
    button.addEventListener("click", () => {
      currentStageIndex = index;
      state.coachDraftChoice = "";
      render();
      coachResponse.hidden = true;
      resetViewScroll("flow");
    });
    stageController.appendChild(button);
  });
}

function renderPath() {
  pathNodes.innerHTML = "";
  stages.forEach((stage, index) => {
    const displayTitle = getStageDisplayTitle(stage);
    const node = document.createElement("button");
    node.type = "button";
    node.className = "path-node";
    if (index === currentStageIndex) node.classList.add("active");
    if (state.completedStages[stage.key]) node.classList.add("done");
    node.innerHTML = `
      <span class="path-index">${index + 1}</span>
      <span class="path-label">${escapeHtml(displayTitle)}</span>
    `;
    node.title = `${stage.title}: ${displayTitle}`;
    node.setAttribute("aria-label", `${stage.title}: ${displayTitle}`);
    node.addEventListener("click", () => {
      currentStageIndex = index;
      state.coachDraftChoice = "";
      render();
      coachResponse.hidden = true;
      resetViewScroll("flow");
    });
    pathNodes.appendChild(node);
  });
}

function getStageDisplayTitle(stage) {
  return state.stageLabels?.[stage.key] || stage.title;
}

function renderStageOverview() {
  const stage = currentStage();
  interactionArea.innerHTML = "";
  if (isDoingStage(stage)) {
    coachResponse.hidden = true;
    renderDoingMilestone(stage);
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "stage-overview";

  const chain = stageReasoningChains[stage.key];
  const openKey = state.openChainKeys[stage.key];
  const activeIndex = Math.max(0, chain.findIndex((item) => item.key === openKey));
  const activeQuestion = chain[activeIndex] && chain[activeIndex].key === openKey ? chain[activeIndex] : null;
  const completedCount = chain.filter((item) => {
    const record = state.chainRecords[stage.key][item.key];
    return record.saved;
  }).length;
  stepPrompt.textContent = getStableStagePrompt(stage);

  wrap.innerHTML = `
    <div class="chain-head">
      <div>
        <div class="chain-title">
          <span>Thinking</span>
          <button class="info-dot" type="button" aria-label="${escapeHtml(stage.title)}: build one small judgement at a time" title="${escapeHtml(stage.title)}: build one small judgement at a time">!</button>
        </div>
      </div>
      <div class="chain-head-actions">
        <button class="coach-notes-toggle ${state.showCoachNotes ? "on" : ""}" type="button" data-toggle-coach-notes aria-pressed="${state.showCoachNotes}" title="Show or hide all Coach notes">
          <span>Coach notes</span><i></i>
        </button>
        <div class="reasoning-progress">${completedCount} / ${chain.length}</div>
      </div>
    </div>
    <div class="scaffold-checks" aria-label="Reasoning scaffold completion">
      ${chain.map((item, index) => {
        const record = state.chainRecords[stage.key][item.key];
        const isDone = Boolean(record.saved);
        const isActive = activeQuestion?.key === item.key;
        return `
          <button class="${isDone ? "done" : ""} ${isActive ? "active" : ""}" type="button" data-check-index="${index}" title="${escapeHtml(item.title)}">
            <span>${isDone ? "✓" : index + 1}</span>
          </button>
        `;
      }).join("")}
    </div>
    <div class="scaffold-map">
      ${chain.map((item, index) => {
        const itemRecord = state.chainRecords[stage.key][item.key];
        const isActive = activeQuestion?.key === item.key;
        const text = itemRecord.note || selectedText(itemRecord.selected) || "Tap to reason";
        const toolLabel = item.tool ? getToolLabel(item.tool) : "";
        return `
          <div class="scaffold-unit">
            <button class="chain-card ${item.tool ? "tool-block" : ""} ${isActive ? "active" : ""} ${itemRecord.saved ? "complete" : ""}" type="button" data-reasoning-index="${index}" data-reasoning-key="${escapeHtml(item.key)}" title="${itemRecord.saved ? "Edit saved judgement" : "Open judgement"}" aria-label="${itemRecord.saved ? "Edit saved judgement" : "Open judgement"}: ${escapeHtml(item.title)}">
              <span class="chain-number">${index + 1}</span>
              <span class="chain-main">
                <strong>${escapeHtml(item.title)}</strong>
                ${toolLabel ? `<em>${escapeHtml(toolLabel)}</em>` : ""}
                <span>${escapeHtml(shorten(text, 44))}</span>
              </span>
              <span class="chain-edit" aria-hidden="true">✎</span>
            </button>
            ${state.showCoachNotes ? renderCoachNote(itemRecord, item) : ""}
            ${state.showCoachNotes && itemRecord.coachNote && !itemRecord.coachNoteOpen ? `<button class="coach-note-peek" type="button" data-coach-note-toggle="${escapeHtml(item.key)}" title="Show Coach note" aria-label="Show Coach note">💬</button>` : ""}
            ${isActive ? renderInlineReasoningCard(activeQuestion, itemRecord, stage.key) : ""}
            ${index < chain.length - 1 ? renderLogicConnector(stage, index) : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;
  interactionArea.appendChild(wrap);
  wrap.querySelectorAll(".chain-card").forEach((card) => {
    card.addEventListener("click", () => {
      const item = chain[Number(card.dataset.reasoningIndex)];
      const activeRecord = activeQuestion ? state.chainRecords[stage.key][activeQuestion.key] : null;
      const isMovingAway = activeQuestion && activeQuestion.key !== item.key;
      if (isMovingAway && activeRecord && (!activeRecord.saved || activeRecord.draftDirty) && (hasSelectedValue(activeRecord.selected) || activeRecord.tool || activeRecord.draftDirty)) {
        const currentInput = wrap.querySelector("#reasoningNote");
        if (currentInput) activeRecord.note = currentInput.value.trim();
        activeRecord.saveHint = true;
        render();
        return;
      }
      state.chainIndexes[stage.key] = Number(card.dataset.reasoningIndex);
      state.openChainKeys[stage.key] = state.openChainKeys[stage.key] === item.key ? "" : item.key;
      updateKnowledgeFromStage(stage, "learning", `Opened reasoning: ${item.title}`);
      render();
      coachResponse.hidden = true;
    });
  });
  wrap.querySelectorAll("[data-check-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = chain[Number(button.dataset.checkIndex)];
      const activeRecord = activeQuestion ? state.chainRecords[stage.key][activeQuestion.key] : null;
      const isMovingAway = activeQuestion && activeQuestion.key !== item.key;
      if (isMovingAway && activeRecord && (!activeRecord.saved || activeRecord.draftDirty) && (hasSelectedValue(activeRecord.selected) || activeRecord.tool || activeRecord.draftDirty)) {
        const currentInput = wrap.querySelector("#reasoningNote");
        if (currentInput) activeRecord.note = currentInput.value.trim();
        activeRecord.saveHint = true;
        render();
        return;
      }
      state.chainIndexes[stage.key] = Number(button.dataset.checkIndex);
      state.openChainKeys[stage.key] = item.key;
      updateKnowledgeFromStage(stage, "learning", `Opened reasoning: ${item.title}`);
      render();
      coachResponse.hidden = true;
    });
  });
  wrap.querySelector("[data-toggle-coach-notes]")?.addEventListener("click", () => {
    state.showCoachNotes = !state.showCoachNotes;
    render();
  });
  wrap.querySelectorAll("[data-coach-note-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = chain.find((entry) => entry.key === button.dataset.coachNoteToggle);
      if (!item) return;
      const record = state.chainRecords[stage.key][item.key];
      record.coachNoteOpen = !record.coachNoteOpen;
      render();
    });
  });
  wrap.querySelectorAll("[data-coach-next-check]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = chain.find((entry) => entry.key === button.dataset.coachNextCheck);
      if (!item) return;
      const record = state.chainRecords[stage.key][item.key];
      record.nextCheckPinned = true;
      state.records[stage.key].carriedNextCheck = {
        text: record.nextCheck,
        source: item.title,
        type: record.coachNoteType || "verify",
      };
      render();
    });
  });
  wrap.querySelectorAll("[data-coach-path]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = chain.find((entry) => entry.key === button.dataset.coachPath);
      if (!item) return;
      const record = state.chainRecords[stage.key][item.key];
      record.coachPath = button.dataset.pathValue;
      state.userActions.push({
        stage: stage.title,
        option: record.coachPath,
        reply: "Selected from a Coach note shortcut.",
        time: new Date().toISOString(),
      });
      updateRationale();
      render();
    });
  });
  if (!activeQuestion) return;
  const activeRecord = state.chainRecords[stage.key][activeQuestion.key];
  wrap.querySelector("[data-node-coach-hint]")?.addEventListener("click", () => {
    activeRecord.nodeHintOpen = !activeRecord.nodeHintOpen;
    render();
  });
  wrap.querySelector("[data-morph-screen]")?.addEventListener("click", () => {
    const config = activeQuestion.toolConfig || {};
    const rows = Array.isArray(config.rows) ? config.rows : [];
    const selections = activeRecord.toolSelections || {};
    const complete = rows.length > 0 && rows.every((row) => selections[row.label]);
    if (!complete) {
      activeRecord.toolScreening = "Choose one implementation for each function first.";
    } else if (Array.isArray(config.incompatibilities) && config.incompatibilities.length) {
      activeRecord.toolScreening = `Potential conflict to examine: ${config.incompatibilities[0]}`;
    } else {
      const criteria = Array.isArray(config.screeningCriteria) ? config.screeningCriteria : [];
      activeRecord.toolScreening = criteria.length
        ? `Screened against: ${criteria.join(", ")}. Run one small test before committing.`
        : "Combination assembled. Run one small test before committing.";
    }
    activeRecord.draftDirty = true;
    activeRecord.saved = false;
    render();
  });
  wrap.querySelectorAll("[data-reasoning-option]").forEach((button) => {
    button.addEventListener("click", () => {
      activeRecord.note = wrap.querySelector("#reasoningNote").value.trim();
      const option = button.dataset.reasoningOption;
      if (activeQuestion.selectionMode === "multiple") {
        const current = selectedValues(activeRecord.selected);
        activeRecord.selected = current.includes(option)
          ? current.filter((value) => value !== option)
          : [...current, option];
      } else {
        activeRecord.selected = option;
      }
      activeRecord.saved = false;
      activeRecord.draftDirty = true;
      activeRecord.saveHint = false;
      render();
    });
  });
  wrap.querySelectorAll("[data-tool-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const slot = button.dataset.toolSlot || "";
      if (slot) {
        activeRecord.toolSelections = activeRecord.toolSelections || {};
        activeRecord.toolSelections[slot] = button.dataset.toolChoice;
        activeRecord.tool = Object.entries(activeRecord.toolSelections)
          .map(([label, value]) => `${label}: ${value}`)
          .join(" | ");
      } else {
        activeRecord.tool = button.dataset.toolChoice;
      }
      activeRecord.note = wrap.querySelector("#reasoningNote").value.trim();
      activeRecord.saved = false;
      activeRecord.draftDirty = true;
      activeRecord.saveHint = false;
      render();
    });
  });
  wrap.querySelectorAll("[data-axis-candidate]").forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      const board = button.closest("[data-axis-board]");
      if (!board) return;
      const label = button.dataset.axisCandidate || "";
      let moved = false;
      const updatePosition = (pointerEvent) => {
        const rect = board.getBoundingClientRect();
        const x = Math.max(10, Math.min(90, ((pointerEvent.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(12, Math.min(88, ((pointerEvent.clientY - rect.top) / rect.height) * 100));
        button.style.setProperty("--axis-x", `${x}%`);
        button.style.setProperty("--axis-y", `${y}%`);
        activeRecord.toolPositions = activeRecord.toolPositions || {};
        activeRecord.toolPositions[label] = { x: Math.round(x), y: Math.round(y) };
        moved = true;
      };
      const finish = () => {
        window.removeEventListener("pointermove", updatePosition);
        window.removeEventListener("pointerup", finish);
        if (!moved) return;
        activeRecord.tool = label;
        activeRecord.saved = false;
        activeRecord.draftDirty = true;
        activeRecord.saveHint = false;
        render();
      };
      window.addEventListener("pointermove", updatePosition);
      window.addEventListener("pointerup", finish, { once: true });
    });
  });
  wrap.querySelector("#reasoningNote")?.addEventListener("input", () => {
    activeRecord.draftDirty = true;
    activeRecord.saveHint = false;
  });
  wrap.querySelector("#saveReasoningStep")?.addEventListener("click", () => {
    const note = wrap.querySelector("#reasoningNote").value.trim();
    activeRecord.note = note;
    activeRecord.saved = true;
    activeRecord.draftDirty = false;
    activeRecord.saveHint = false;
    state.stageAdvanceHint = "";
    state.records[stage.key].note = buildStageReasoningSummary(stage.key);
    activeRecord.coachNoteLoading = allowBoundaryEnabled(/ask.*reason|reasoning/i);
    updateKnowledgeFromStage(stage, "verified", `Saved reasoning: ${activeQuestion.title}`);
    const nextItem = chain[activeIndex + 1];
    if (nextItem) {
      state.chainIndexes[stage.key] = activeIndex + 1;
      state.openChainKeys[stage.key] = nextItem.key;
    } else {
      state.openChainKeys[stage.key] = "";
    }
    render();
    if (nextItem) focusReasoningNode(nextItem.key);
    requestCoachNote({
      current_node: {
        key: activeQuestion.key,
        title: activeQuestion.title,
        question: activeQuestion.question,
        prompt_hint: activeQuestion.hint || "",
      },
      student_selection: selectedText(activeRecord.selected) || "No option selected",
      student_reason: activeRecord.note || "No reason added",
      selected_tool: activeQuestion.tool || activeRecord.tool || "None",
      selected_tool_result: activeRecord.tool || "No tool choice recorded",
      prior_reasoning: chain
        .slice(0, activeIndex)
        .map((item) => {
          const itemRecord = state.chainRecords[stage.key][item.key];
          return {
            node: item.title,
            selection: selectedText(itemRecord.selected),
            reason: itemRecord.note || "",
            tool_result: itemRecord.tool || "",
          };
        })
        .filter((item) => item.selection || item.reason || item.tool_result),
      project_goal: state.projectGoal,
      learning_content: state.learningContent,
      project_material: state.projectMaterial,
      task_name: state.selectedTaskName,
      stage_goal: stage.planStep?.detail || getStableStagePrompt(stage),
    }, stage.key, activeQuestion.key);
  });
}

function renderCoachNote(record, item) {
  if ((!record.coachNote && !record.coachNoteLoading) || !record.coachNoteOpen) return "";
  if (record.coachNoteLoading) {
    return `
      <aside class="coach-note coach-note-loading" aria-label="Coach note loading">
        <span class="coach-note-label">Coach note</span>
        <span>Checking whether a next step would help...</span>
      </aside>
    `;
  }
  const type = ["verify", "risk", "consequence"].includes(record.coachNoteType) ? record.coachNoteType : "verify";
  const typeLabel = { verify: "Verify", risk: "Watch", consequence: "Connection" }[type];
  const typeIcon = { verify: "✓", risk: "!", consequence: "↗" }[type];
  return `
    <aside class="coach-note coach-note-${escapeHtml(type)}" aria-label="Coach note for ${escapeHtml(item.title)}">
      <div class="coach-note-head">
        <span><i aria-hidden="true">${typeIcon}</i>Coach note · ${typeLabel}</span>
        <button type="button" data-coach-note-toggle="${escapeHtml(item.key)}" aria-label="Collapse Coach note" title="Collapse Coach note">⌃</button>
      </div>
      <p>${escapeHtml(record.coachNote)}</p>
      ${record.nextCheck ? `<button type="button" class="coach-next-check ${record.nextCheckPinned ? "pinned" : ""}" data-coach-next-check="${escapeHtml(item.key)}" title="Carry this check into the next build step"><strong>Next check</strong><span>${escapeHtml(record.nextCheck)}</span><i aria-hidden="true">${record.nextCheckPinned ? "✓" : "→"}</i></button>` : ""}
    </aside>
  `;
}

function focusReasoningNode(key) {
  window.requestAnimationFrame(() => {
    const nextNode = Array.from(document.querySelectorAll("[data-reasoning-key]")).find((node) => node.dataset.reasoningKey === key);
    nextNode?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function isDoingStage(stage) {
  return ["practice", "resource", "complete"].includes(stage.role);
}

function isHardwareWiringStage(stage) {
  const context = [
    stage?.title,
    stage?.prompt,
    stage?.planStep?.detail,
    state.projectGoal,
    state.learningContent,
    state.projectMaterial,
  ].filter(Boolean).join(" ").toLowerCase();
  return /arduino|sensor|ultrasonic|hc-sr04|pir|motor|l298n|tb6612|led|wiring|circuit|breadboard|hardware/.test(context);
}

function renderWiringReference(record, stage) {
  const reference = record.wiringReference;
  if (!reference && !record.wiringReferenceLoading) {
    return `
      <button class="wiring-reference-trigger" type="button" data-wiring-reference>
        <span class="wiring-reference-icon" aria-hidden="true">⌘</span>
        <span><strong>Reference wiring</strong><small>Generate a project-specific wiring check</small></span>
        <i aria-hidden="true">→</i>
      </button>
    `;
  }
  if (record.wiringReferenceLoading) {
    return `<div class="wiring-reference-panel loading" aria-live="polite"><span class="wiring-reference-spinner"></span> Building a reference from this milestone...</div>`;
  }
  return `
    <section class="wiring-reference-panel" aria-label="Reference wiring">
      <div class="wiring-reference-head">
        <div><span>Reference wiring</span><strong>${escapeHtml(reference.title || getStageDisplayTitle(stage))}</strong></div>
        <div class="wiring-reference-head-actions">
          <button class="wiring-reference-refresh" type="button" data-wiring-reference title="Regenerate reference" aria-label="Regenerate reference">↻</button>
          <button class="wiring-reference-close" type="button" data-close-wiring-reference title="Close reference" aria-label="Close reference">×</button>
        </div>
      </div>
      ${renderWiringPartsList(reference, record.wiringFocus || "")}
      ${renderWiringDiagram(reference, record.wiringFocus || "")}
      <details class="wiring-reference-more">
        <summary>Connection details</summary>
        ${renderWiringInterfaces(reference)}
        ${renderWiringPinMap(reference)}
        <div class="wiring-reference-warning"><span aria-hidden="true">!</span>${escapeHtml(reference.warning || "Confirm labels and voltage requirements against the datasheet for your own modules.")}</div>
      </details>
      <div class="wiring-reference-actions">
        <button type="button" class="secondary" data-compare-reference>Compare my build</button>
      </div>
    </section>
  `;
}

function renderWiringDiagram(reference, focusedPartId = "") {
  const allParts = Array.isArray(reference.components) ? reference.components.slice(0, 12) : [];
  const connections = Array.isArray(reference.connections) ? reference.connections.slice(0, 28) : [];
  const usedIds = new Set(connections.flatMap((connection) => [connection.from_component, connection.to_component]));
  const parts = allParts.filter((part) => usedIds.has(part.id));
  const board = parts.find((part) => /arduino|uno|microcontroller|board/i.test(`${part.label} ${part.type} ${part.role}`)) || parts[0];
  const devices = parts.filter((part) => part.id !== board?.id);
  const boardPins = [];
  const pinsFor = (partId) => connections.reduce((pins, connection) => {
    if (connection.from_component === partId && connection.from_pin && !pins.includes(connection.from_pin)) pins.push(connection.from_pin);
    if (connection.to_component === partId && connection.to_pin && !pins.includes(connection.to_pin)) pins.push(connection.to_pin);
    return pins;
  }, []);
  if (board) boardPins.push(...pinsFor(board.id));
  const width = 520;
  let deviceCursor = 20;
  const deviceBoxes = devices.map((part) => {
    const pins = pinsFor(part.id);
    const height = Math.max(74, 49 + pins.length * 18);
    const box = { id: part.id, x: 338, y: deviceCursor, width: 162, height, pins };
    deviceCursor += height + 14;
    return box;
  });
  const height = Math.max(246, deviceCursor + 6);
  const boardBox = { x: 22, y: 20, width: 184, height: height - 40 };
  const boardEndpoint = (pin) => {
    const index = Math.max(0, boardPins.indexOf(pin));
    return { x: boardBox.x + boardBox.width, y: boardBox.y + 80 + index * 23, labelX: boardBox.x + boardBox.width - 8, anchor: "end" };
  };
  const deviceEndpoint = (partId, pin) => {
    const box = deviceBoxes.find((entry) => entry.id === partId) || deviceBoxes[0];
    if (!box) return { x: 338, y: 110, labelX: 346, anchor: "start" };
    const index = Math.max(0, box.pins.indexOf(pin));
    return { x: box.x, y: box.y + 51 + index * 18, labelX: box.x + 9, anchor: "start" };
  };
  const endpointFor = (partId, pin) => partId === board?.id ? boardEndpoint(pin) : deviceEndpoint(partId, pin);
  const colourFor = (type) => ({ power: "#ec6274", ground: "#5e687a", signal: "#6558f5", output: "#d8953c" }[String(type || "signal").toLowerCase()] || "#6558f5");
  const partFocusClass = (part) => focusedPartId === part.id ? " focused" : "";
  return `
    <div class="wiring-reference-diagram wiring-schematic">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Project-specific wiring reference with named pins">
        ${connections.map((connection, index) => {
          const from = endpointFor(connection.from_component, connection.from_pin);
          const to = endpointFor(connection.to_component, connection.to_pin);
          const midX = Math.min(width - 28, Math.max(boardBox.x + boardBox.width + 26, 255 + index % 3 * 24));
          return `<path class="wiring-wire ${String(connection.type || "signal").toLowerCase()}" d="M${from.x} ${from.y} H${midX} V${to.y} H${to.x}" stroke="${colourFor(connection.type)}"></path>`;
        }).join("")}
        ${board ? `<g class="wiring-board${partFocusClass(board)}">
          <rect x="${boardBox.x}" y="${boardBox.y}" width="${boardBox.width}" height="${boardBox.height}" rx="14"></rect>
          <rect class="wiring-usb" x="${boardBox.x + 14}" y="${boardBox.y + 20}" width="27" height="34" rx="5"></rect>
          <rect class="wiring-chip" x="${boardBox.x + 58}" y="${boardBox.y + 116}" width="50" height="60" rx="6"></rect>
          <text class="wiring-board-name" x="${boardBox.x + 54}" y="${boardBox.y + 32}">ARDUINO</text>
          <text class="wiring-board-model" x="${boardBox.x + 54}" y="${boardBox.y + 47}">${escapeHtml(shorten(board.label || "UNO", 17))}</text>
          ${boardPins.map((pin) => { const point = boardEndpoint(pin); return `<circle class="wiring-pin-dot" cx="${point.x}" cy="${point.y}" r="3"></circle><text class="wiring-pin-label" x="${point.labelX}" y="${point.y + 3}" text-anchor="${point.anchor}">${escapeHtml(pin)}</text>`; }).join("")}
        </g>` : ""}
        ${devices.map((part) => {
          const box = deviceBoxes.find((entry) => entry.id === part.id);
          return `<g class="wiring-device${partFocusClass(part)}">
            <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="12"></rect>
            <text class="wiring-device-name" x="${box.x + 14}" y="${box.y + 21}">${escapeHtml(shorten(part.label || part.id, 22))}</text>
            <text class="wiring-device-role" x="${box.x + 14}" y="${box.y + 36}">${escapeHtml(shorten(part.role || part.type || "component", 22))}</text>
            ${box.pins.map((pin) => { const point = deviceEndpoint(part.id, pin); return `<circle class="wiring-pin-dot" cx="${point.x}" cy="${point.y}" r="3"></circle><text class="wiring-pin-label device" x="${point.labelX}" y="${point.y + 3}">${escapeHtml(pin)}</text>`; }).join("")}
          </g>`;
        }).join("")}
      </svg>
      <div class="wiring-legend"><span class="power">5V / power</span><span class="ground">Common ground</span><span class="signal">Control signal</span></div>
    </div>
  `;
}

function renderWiringInterfaces(reference) {
  const interfaces = Array.isArray(reference.interfaces) ? reference.interfaces : [];
  if (!interfaces.length) return "";
  return `<section class="wiring-interfaces" aria-label="System interface checks"><div class="wiring-interfaces-head"><span>System interfaces</span><small>Check one subsystem at a time</small></div><div class="wiring-interface-grid">${interfaces.map((item, index) => `<article><b>${index + 1}</b><div><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.detail)}</p>${item.checks?.length ? `<ul>${item.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("")}</ul>` : ""}</div></article>`).join("")}</div></section>`;
}

function renderWiringPartsList(reference, focusedPartId = "") {
  const parts = Array.isArray(reference.components) ? reference.components : [];
  if (!parts.length) return "";
  return `
    <section class="wiring-parts" aria-label="Parts list">
      <div class="wiring-parts-head"><span>Parts</span><small>Tap to focus</small></div>
      <div class="wiring-parts-grid">
        ${parts.map((part) => `<button class="wiring-part-item ${focusedPartId === part.id ? "selected" : ""}" type="button" data-wire-part="${escapeHtml(part.id)}" aria-pressed="${focusedPartId === part.id}" title="Focus ${escapeHtml(part.label)} in the wiring reference"><i class="part-kind ${escapeHtml(String(part.type || "component").toLowerCase())}" aria-hidden="true"></i><span>${escapeHtml(part.label)}</span><b>×${Math.max(1, Number(part.quantity) || 1)}</b></button>`).join("")}
      </div>
    </section>
  `;
}

function renderWiringPinMap(reference) {
  const connections = Array.isArray(reference.connections) ? reference.connections : [];
  if (!connections.length) return "";
  const labels = new Map((reference.components || []).map((part) => [part.id, part.label || part.id]));
  return `<details class="wiring-pin-map"><summary>Pin map</summary><div>${connections.map((connection) => `<span class="${escapeHtml(String(connection.type || "signal").toLowerCase())}">${escapeHtml(`${labels.get(connection.from_component) || connection.from_component} · ${connection.from_pin} → ${labels.get(connection.to_component) || connection.to_component} · ${connection.to_pin}`)}</span>`).join("")}</div></details>`;
}

function buildWiringReferenceContext(stage, record) {
  const stageIndex = stages.findIndex((item) => item.key === stage.key);
  const planSteps = stages.map((item, index) => ({
    index: index + 1,
    key: item.key,
    role: item.role,
    title: getStageDisplayTitle(item),
    detail: item.planStep?.detail || getStableStagePrompt(item),
    type: item.planStep?.type || item.role,
    checklist: getMilestoneChecklist(item).map((check) => ({
      id: check.id,
      text: check.text,
      required_photo: Boolean(check.required_photo),
    })),
  }));
  const reasoningSummaries = stages.map((item, index) => ({
    index: index + 1,
    title: getStageDisplayTitle(item),
    summary: buildStageReasoningSummary(item.key),
    completed: Boolean(state.completedStages[item.key]),
  })).filter((item) => item.summary || item.completed);
  const checklistStatus = getMilestoneChecklist(stage).map((check) => ({
    id: check.id,
    text: check.text,
    checked: Boolean(record?.checklistStatus?.[check.id]),
    has_photo: Boolean(record?.checklistUploads?.[check.id]),
    visual_status: record?.checklistVisualChecks?.[check.id]?.status || "",
  }));
  return {
    current_step_index: stageIndex + 1,
    total_steps: stages.length,
    learning_plan: planSteps,
    saved_reasoning: reasoningSummaries,
    current_checklist_status: checklistStatus,
    selected_start_point: state.selectedStartPoint || "",
    active_context_summary: state.activeContextSummary || "",
  };
}

async function requestWiringReference(stage, record) {
  record.wiringReferenceLoading = true;
  render();
  try {
    const response = await fetch(`${API_BASE}/api/wiring-reference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_goal: state.projectGoal,
        learning_content: state.learningContent,
        project_material: state.projectMaterial,
        task_name: state.selectedTaskName,
        milestone_title: getStageDisplayTitle(stage),
        milestone_detail: stage.planStep?.detail || getStableStagePrompt(stage),
        checklist: getMilestoneChecklist(stage),
        wiring_context: buildWiringReferenceContext(stage, record),
        learner_profile: learnerProfileGenerationBrief(),
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    record.wiringReference = normaliseWiringReference(await response.json(), stage);
  } catch {
    record.wiringReference = fallbackWiringReference(stage);
  } finally {
    record.wiringReferenceLoading = false;
    render();
  }
}

function normaliseWiringReference(data, stage) {
  const components = Array.isArray(data?.components) ? data.components.slice(0, 12).map((part, index) => ({
    id: String(part?.id || `part-${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, ""),
    label: String(part?.label || part?.name || `Part ${index + 1}`),
    role: String(part?.role || "module"),
    type: String(part?.type || "component"),
    quantity: Math.max(1, Math.min(24, Number(part?.quantity) || 1)),
  })) : [];
  const ids = new Set(components.map((part) => part.id));
  const connections = Array.isArray(data?.connections) ? data.connections.slice(0, 28)
    .filter((connection) => ids.has(String(connection?.from_component || "")) && ids.has(String(connection?.to_component || "")))
    .map((connection) => ({
      from_component: String(connection.from_component), from_pin: String(connection.from_pin || ""),
      to_component: String(connection.to_component), to_pin: String(connection.to_pin || ""), type: String(connection.type || "signal"),
    })) : [];
  if (components.length < 2 || !connections.length) return fallbackWiringReference(stage);
  return {
    title: String(data?.title || getStageDisplayTitle(stage)),
    purpose: String(data?.purpose || "Check each connection against this milestone."),
    warning: String(data?.warning || "Confirm labels and voltage requirements against the datasheet for your own modules."),
    interfaces: Array.isArray(data?.interfaces) ? data.interfaces.slice(0, 5).map((item) => ({
      label: String(item?.label || "Interface check"),
      detail: String(item?.detail || ""),
      checks: Array.isArray(item?.checks) ? item.checks.slice(0, 3).map((check) => String(check)) : [],
    })) : [],
    components,
    connections,
  };
}

function fallbackWiringReference(stage) {
  const text = `${stage.title} ${stage.prompt} ${stage.planStep?.detail || ""} ${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`.toLowerCase();
  const standardWarning = "Reference only: confirm your module labels, voltage and board pin choices before powering it.";
  if (/(obstacle|avoid|wall|distance|ultrasonic|hc-sr04|hc sr04|l298n|two.?wheel|car)/.test(text) && /(motor|wheel|l298n|driver)/.test(text) && /(sensor|ultrasonic|hc-sr04|distance)/.test(text)) {
    return {
      title: "Obstacle-avoidance car wiring reference",
      purpose: "Check the full sensor-to-driver loop: distance input, motor outputs and shared power return.",
      warning: "Use an external motor battery for the L298N motor supply. Do not run DC motors from Arduino 5V; join Arduino GND and driver GND before testing.",
      interfaces: [
        { label: "Distance sensing", detail: "Arduino powers HC-SR04 and reads ECHO after triggering TRIG. Sketch pins must match the actual wires.", checks: ["VCC to 5V, GND to GND", "TRIG and ECHO match code"] },
        { label: "Motor driver control", detail: "Arduino sends direction signals to L298N IN1-IN4 and speed signals to ENA/ENB if PWM is used.", checks: ["Left and right channels are not swapped", "ENA/ENB are enabled or on PWM pins"] },
        { label: "Motor power path", detail: "Battery powers the L298N motor input. Arduino GND, L298N GND and battery negative share common ground.", checks: ["External motor supply connected", "Common ground before signal testing"] },
      ],
      components: [
        { id: "uno", label: "Arduino Uno", role: "controller", type: "board", quantity: 1 },
        { id: "ultrasonic", label: "HC-SR04 ultrasonic sensor", role: "distance input", type: "sensor", quantity: 1 },
        { id: "driver", label: "L298N motor driver", role: "two-wheel drive output", type: "driver", quantity: 1 },
        { id: "motors", label: "DC gear motors", role: "left and right wheels", type: "motor", quantity: 2 },
        { id: "battery", label: "Motor battery pack", role: "driver motor supply", type: "power", quantity: 1 },
        { id: "leads", label: "Jumper leads", role: "signal and power links", type: "jumper", quantity: 1 },
      ],
      connections: [
        { from_component: "uno", from_pin: "5V", to_component: "ultrasonic", to_pin: "VCC", type: "power" },
        { from_component: "uno", from_pin: "GND", to_component: "ultrasonic", to_pin: "GND", type: "ground" },
        { from_component: "uno", from_pin: "chosen TRIG pin", to_component: "ultrasonic", to_pin: "TRIG", type: "signal" },
        { from_component: "ultrasonic", from_pin: "ECHO", to_component: "uno", to_pin: "chosen ECHO pin", type: "signal" },
        { from_component: "uno", from_pin: "chosen IN1-IN4 pins", to_component: "driver", to_pin: "IN1-IN4", type: "signal" },
        { from_component: "uno", from_pin: "chosen PWM pins", to_component: "driver", to_pin: "ENA / ENB", type: "signal" },
        { from_component: "driver", from_pin: "OUT1 / OUT2", to_component: "motors", to_pin: "left motor leads", type: "output" },
        { from_component: "driver", from_pin: "OUT3 / OUT4", to_component: "motors", to_pin: "right motor leads", type: "output" },
        { from_component: "battery", from_pin: "+ motor voltage", to_component: "driver", to_pin: "motor supply +", type: "power" },
        { from_component: "battery", from_pin: "negative", to_component: "driver", to_pin: "GND", type: "ground" },
        { from_component: "uno", from_pin: "GND", to_component: "driver", to_pin: "GND", type: "ground" },
      ],
    };
  }
  if (/six.?leg|hexapod|6.?leg/.test(text)) {
    const hasBluetooth = /bluetooth|hc-05|hc05|wireless/.test(text);
    return {
      title: "Six-leg robot control and power architecture",
      purpose: "Check the 18-servo control channels, external power rail and communication link before building one leg at a time.",
      warning: "Never power 18 servos from the Arduino 5V pin. Use an external 5-6V high-current rail and join its ground to Arduino ground before testing.",
      interfaces: [
        { label: "I2C control bus", detail: "Uno A4/SDA and A5/SCL connect in parallel to both PCA9685 boards. Give the boards different I2C addresses.", checks: ["SDA and SCL are not swapped", "Both boards share logic GND"] },
        { label: "Servo channel allocation", detail: "PCA9685 A CH0-CH15 controls joints 1-16; PCA9685 B CH0-CH1 controls joints 17-18.", checks: ["Label each leg and joint", "Test a single raised leg first"] },
        { label: "External power rail", detail: "A 5-6V high-current supply feeds V+ on both PCA9685 boards and the servo bank; its GND joins Uno GND.", checks: ["Supply is rated for servo stall current", "Uno 5V is not used for servos"] },
        ...(hasBluetooth ? [{ label: "Bluetooth serial link", detail: "HC-05 TXD reaches Uno D2. Uno D3 reaches HC-05 RXD through a 3.3V level shifter or divider.", checks: ["Bluetooth RX is protected from 5V", "Pins match the sketch"] }] : []),
      ],
      components: [
        { id: "uno", label: "Arduino Uno", role: "main controller", type: "board", quantity: 1 },
        { id: "pwm-a", label: "PCA9685 PWM expander A", role: "servo channels 1-16", type: "driver", quantity: 1 },
        { id: "pwm-b", label: "PCA9685 PWM expander B", role: "servo channels 17-18", type: "driver", quantity: 1 },
        { id: "servos", label: "Servo actuators", role: "six legs × three joints", type: "servo", quantity: 18 },
        { id: "servo-supply", label: "5-6V high-current servo supply", role: "servo power rail", type: "power", quantity: 1 },
        ...(hasBluetooth ? [{ id: "bluetooth", label: "Bluetooth module", role: "wireless command link", type: "module", quantity: 1 }, { id: "level-shifter", label: "3.3V RX level shifter", role: "protect Bluetooth RX", type: "passive", quantity: 1 }] : []),
        { id: "leads", label: "Servo and jumper leads", role: "signal and power connections", type: "jumper", quantity: 1 },
      ],
      connections: [
        { from_component: "uno", from_pin: "A4 / SDA", to_component: "pwm-a", to_pin: "SDA", type: "signal" },
        { from_component: "uno", from_pin: "A4 / SDA", to_component: "pwm-b", to_pin: "SDA", type: "signal" },
        { from_component: "uno", from_pin: "A5 / SCL", to_component: "pwm-a", to_pin: "SCL", type: "signal" },
        { from_component: "uno", from_pin: "A5 / SCL", to_component: "pwm-b", to_pin: "SCL", type: "signal" },
        { from_component: "servo-supply", from_pin: "+5-6V", to_component: "pwm-a", to_pin: "V+", type: "power" },
        { from_component: "servo-supply", from_pin: "+5-6V", to_component: "pwm-b", to_pin: "V+", type: "power" },
        { from_component: "servo-supply", from_pin: "GND", to_component: "uno", to_pin: "GND", type: "ground" },
        { from_component: "pwm-a", from_pin: "CH0-CH15", to_component: "servos", to_pin: "joints 1-16 signal", type: "signal" },
        { from_component: "pwm-b", from_pin: "CH0-CH1", to_component: "servos", to_pin: "joints 17-18 signal", type: "signal" },
        ...(hasBluetooth ? [
          { from_component: "bluetooth", from_pin: "TXD", to_component: "uno", to_pin: "D2 / software RX", type: "signal" },
          { from_component: "uno", from_pin: "D3 / software TX", to_component: "level-shifter", to_pin: "5V in", type: "signal" },
          { from_component: "level-shifter", from_pin: "3.3V out", to_component: "bluetooth", to_pin: "RXD", type: "signal" },
        ] : []),
      ],
    };
  }
  if (/servo|leg/.test(text)) {
    return {
      title: "Arduino Uno + micro servo test", purpose: "Test one servo before repeating the connection pattern for more legs.", warning: standardWarning,
      components: [{ id: "uno", label: "Arduino Uno", role: "controller", type: "board", quantity: 1 }, { id: "servo", label: "Micro servo", role: "actuator", type: "servo", quantity: 1 }, { id: "supply", label: "5V servo supply", role: "power", type: "power", quantity: 1 }, { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 3 }],
      connections: [
        { from_component: "uno", from_pin: "D9", to_component: "servo", to_pin: "PWM", type: "signal" },
        { from_component: "supply", from_pin: "+5V", to_component: "servo", to_pin: "V+", type: "power" },
        { from_component: "supply", from_pin: "GND", to_component: "servo", to_pin: "GND", type: "ground" },
        { from_component: "uno", from_pin: "GND", to_component: "supply", to_pin: "GND", type: "ground" },
      ],
    };
  }
  if (/motor|wheel|drive|l298n|tb6612/.test(text)) {
    return {
      title: "Arduino motor-driver check", purpose: "Check the control path and common ground before the first motor test.", warning: standardWarning,
    components: [{ id: "arduino", label: "Arduino Uno", role: "control", type: "board", quantity: 1 }, { id: "driver", label: "L298N driver", role: "drive", type: "driver", quantity: 1 }, { id: "motor", label: "DC motor", role: "output", type: "motor", quantity: 1 }, { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 5 }],
      connections: [
        { from_component: "arduino", from_pin: "D5", to_component: "driver", to_pin: "IN1", type: "signal" },
        { from_component: "arduino", from_pin: "D6", to_component: "driver", to_pin: "IN2", type: "signal" },
        { from_component: "driver", from_pin: "OUT1 / OUT2", to_component: "motor", to_pin: "motor leads", type: "output" },
        { from_component: "arduino", from_pin: "GND", to_component: "driver", to_pin: "GND", type: "ground" },
      ],
    };
  }
  if (/pir/.test(text)) {
    return {
      title: "PIR sensor check", purpose: "Check sensor power and one output signal before testing motion.", warning: standardWarning,
    components: [{ id: "arduino", label: "Arduino Uno", role: "control", type: "board", quantity: 1 }, { id: "pir", label: "PIR sensor", role: "input", type: "sensor", quantity: 1 }, { id: "output", label: "LED / buzzer", role: "output", type: "output", quantity: 1 }, { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 3 }],
      connections: [
        { from_component: "arduino", from_pin: "5V", to_component: "pir", to_pin: "VCC", type: "power" },
        { from_component: "arduino", from_pin: "GND", to_component: "pir", to_pin: "GND", type: "ground" },
        { from_component: "pir", from_pin: "OUT", to_component: "arduino", to_pin: "D2", type: "signal" },
      ],
    };
  }
  if (/sensor|ultrasonic|hc-sr04|distance/.test(text)) {
    return {
      title: "Distance sensor check", purpose: "Check power, ground and the two signal lines before observing distance values.", warning: standardWarning,
    components: [{ id: "arduino", label: "Arduino Uno", role: "control", type: "board", quantity: 1 }, { id: "sensor", label: "HC-SR04", role: "input", type: "sensor", quantity: 1 }, { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 4 }],
      connections: [
        { from_component: "arduino", from_pin: "5V", to_component: "sensor", to_pin: "VCC", type: "power" },
        { from_component: "arduino", from_pin: "GND", to_component: "sensor", to_pin: "GND", type: "ground" },
        { from_component: "arduino", from_pin: "D9", to_component: "sensor", to_pin: "TRIG", type: "signal" },
        { from_component: "sensor", from_pin: "ECHO", to_component: "arduino", to_pin: "D10", type: "signal" },
      ],
    };
  }
  return {
    title: "Arduino output check", purpose: "Use one small circuit to verify the path from board output to physical response.", warning: standardWarning,
    components: [{ id: "arduino", label: "Arduino Uno", role: "control", type: "board", quantity: 1 }, { id: "resistor", label: "220 ohm resistor", role: "limit current", type: "resistor", quantity: 1 }, { id: "led", label: "LED", role: "output", type: "led", quantity: 1 }, { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 3 }],
    connections: [
      { from_component: "arduino", from_pin: "D9", to_component: "resistor", to_pin: "input", type: "signal" },
      { from_component: "resistor", from_pin: "output", to_component: "led", to_pin: "anode", type: "signal" },
      { from_component: "led", from_pin: "cathode", to_component: "arduino", to_pin: "GND", type: "ground" },
    ],
  };
}

function getCarryForwardCheck(stage) {
  const stageIndex = stages.findIndex((item) => item.key === stage.key);
  for (let index = stageIndex - 1; index >= 0; index -= 1) {
    const carried = state.records[stages[index].key]?.carriedNextCheck;
    if (carried?.text) return carried;
  }
  return null;
}

function buildDoingTaskGroups(stage, checks) {
  const text = `${stage.title || ""} ${stage.planStep?.detail || ""} ${checks.map((check) => `${check.text} ${check.hint || ""}`).join(" ")}`.toLowerCase();
  const codeTask = /code|sketch|verify|compile|upload|serial|ide|script|program/.test(text);
  const hardwareTask = isHardwareWiringStage(stage) || /wire|connect|pin|sensor|motor|power|driver|circuit/.test(text);
  const labels = codeTask
    ? [
      { title: "Prepare the sketch", detail: "Set the board, port and sketch up before running it." },
      { title: "Run and verify", detail: "Check the upload and the behaviour it should produce." },
      { title: "Record the result", detail: "Keep the smallest useful proof before continuing." },
    ]
    : hardwareTask
      ? [
        { title: "Set up the connections", detail: "Complete the physical setup before applying power." },
        { title: "Run a small test", detail: "Test one clear response before integrating more parts." },
        { title: "Confirm the result", detail: "Capture the evidence that lets you continue safely." },
      ]
      : [
        { title: "Make the first version", detail: "Complete the smallest practical version of this step." },
        { title: "Check the result", detail: "Use one visible result to decide whether to continue." },
        { title: "Record the evidence", detail: "Keep the minimum evidence needed for the next step." },
      ];
  const groupCount = checks.length <= 2 ? 1 : checks.length <= 4 ? 2 : 3;
  const chunkSize = Math.ceil(checks.length / groupCount);
  return Array.from({ length: groupCount }, (_item, index) => ({
    key: `doing-group-${index + 1}`,
    ...labels[index],
    checks: checks.slice(index * chunkSize, (index + 1) * chunkSize),
  })).filter((group) => group.checks.length);
}

function renderDoingCoachConversation(messages = []) {
  const items = Array.isArray(messages) ? messages.slice(-8) : [];
  if (!items.length) return "";
  return `<div class="doing-coach-thread" aria-label="Coach conversation">${items.map((item) => `
    <div class="doing-coach-message ${item.role === "coach" ? "coach" : "student"}">
      <span>${item.role === "coach" ? "Coach" : "You"}</span>
      <p>${item.role === "coach" ? formatCoachReply(item.text || "") : escapeHtml(item.text || "").replace(/\n/g, "<br>")}</p>
    </div>`).join("")}</div>`;
}

function renderDoingMilestone(stage) {
  const record = state.records[stage.key] ||= {};
  if (!record.checklistStatus) record.checklistStatus = {};
  if (!record.checklistUploads) record.checklistUploads = {};
  if (!record.checklistVisualChecks) record.checklistVisualChecks = {};
  const checks = getMilestoneChecklist(stage);
  const completed = Boolean(state.completedStages[stage.key]);
  const checkedCount = checks.filter((check) => record.checklistStatus?.[check.id]).length;
  const canShowWiringReference = isHardwareWiringStage(stage);
  const carriedCheck = getCarryForwardCheck(stage);
  const isCodeTask = (check) => /code|sketch|verify|compile|upload|serial|ide|script|program/i.test(`${check.text || ""} ${check.hint || ""}`);
  const shouldOfferPhotoCheck = (check) => Boolean(check.required_photo || canShowWiringReference || /photo|wiring|connect|pin|sensor|motor|model|render/i.test(`${check.text || ""} ${check.hint || ""}`));
  const taskGroups = buildDoingTaskGroups(stage, checks);
  const openGroupKey = record.openDoingGroup || "";
  const wrap = document.createElement("div");
  wrap.className = "doing-milestone";
  let askTargetCheckId = "";
  let evidenceTargetCheckId = "";
  wrap.innerHTML = `
    <div class="doing-head">
      <div class="doing-head-copy">
        <span>${completed ? "Completed" : "Doing · " + checkedCount + "/" + checks.length + " checks"}</span>
        <strong title="${escapeHtml(getStageDisplayTitle(stage))}">${escapeHtml(getStageDisplayTitle(stage))}</strong>
      </div>
    </div>
    ${carriedCheck ? `<section class="doing-carry-forward" aria-label="Next check carried from your reasoning"><span>From your reasoning</span><strong>${escapeHtml(carriedCheck.text)}</strong></section>` : ""}
    <section class="doing-execution-chain" aria-label="Build and check path">
      <div class="scaffold-map doing-scaffold-map">
      ${taskGroups.map((group, groupIndex) => {
        const groupChecks = group.checks;
        const contextCheck = groupChecks.find((check) => !record.checklistStatus[check.id]) || groupChecks[0];
        const groupComplete = groupChecks.every((check) => record.checklistStatus[check.id]);
        const groupVerified = groupChecks.some((check) => record.checklistVisualChecks[check.id]?.status === "pass");
        const groupNeedsAttention = groupChecks.some((check) => record.checklistVisualChecks[check.id]?.status === "needs_attention");
        const groupActive = openGroupKey === group.key;
        const groupCode = groupChecks.some((check) => isCodeTask(check));
        const wiringBelongsHere = Boolean(record.wiringTargetCheckId && groupChecks.some((check) => check.id === record.wiringTargetCheckId));
        const status = groupNeedsAttention
          ? "Needs correction"
          : groupComplete && groupVerified
            ? "Verified"
            : groupComplete
              ? "Done · check result"
              : `${groupChecks.filter((check) => record.checklistStatus[check.id]).length}/${groupChecks.length} done`;
        return `
          <div class="scaffold-unit doing-scaffold-unit">
            <button class="chain-card doing-chain-card ${groupActive ? "active" : ""} ${groupComplete ? "complete" : ""} ${groupNeedsAttention ? "attention" : ""}" type="button" data-doing-group="${escapeHtml(group.key)}" title="${groupComplete ? "Review completed task" : "Open task"}">
              <span class="chain-number">${groupComplete ? "✓" : groupIndex + 1}</span>
              <span class="chain-main"><strong>${escapeHtml(group.title)}</strong><span>${escapeHtml(status)}</span></span>
              <span class="chain-edit" aria-hidden="true">${groupActive ? "⌃" : "✎"}</span>
            </button>
            ${groupActive ? `
              <div class="reasoning-input-panel inline doing-node-panel">
                <div class="doing-group-checks">
                ${groupChecks.map((check) => {
                  const checked = Boolean(record.checklistStatus[check.id]);
                  const uploadName = record.checklistUploads[check.id]?.name || "";
                  const visualCheck = record.checklistVisualChecks[check.id] || {};
                  const hasUpload = Boolean(uploadName);
                  const visualLabel = { ready: "Evidence ready", pass: "Verified", needs_attention: "Needs correction", unclear: "Could not confirm", checking: "Checking..." }[visualCheck.status]
                    || (checked ? "Done · check recommended" : "");
                  const needsInlineReview = ["needs_attention", "unclear"].includes(visualCheck.status);
                  const uploadHint = hasUpload ? `Ready: ${uploadName}` : (check.photo_prompt || "Add a photo for this check.");
                  return `
                    <div class="doing-check-row ${checked ? "checked" : ""} ${visualCheck.status ? `visual-${escapeHtml(visualCheck.status)}` : ""}" data-check-item="${escapeHtml(check.id)}">
                      <label title="${escapeHtml(check.text)}"><input type="checkbox" data-doing-check="${escapeHtml(check.id)}" ${checked ? "checked" : ""} /><span>${escapeHtml(shorten(check.text, 82))}</span></label>
                      <details class="check-evidence-menu ${hasUpload ? "has-evidence" : ""}">
                        <summary aria-label="Check this result" title="Check with a photo, copied code or screen capture"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 12.5 14 7a3 3 0 0 1 4.2 4.2l-7 7a5 5 0 0 1-7.1-7.1l7.4-7.4" /></svg><span>Check</span></summary>
                        <div class="check-evidence-popover">
                          <button type="button" data-visual-check="${escapeHtml(check.id)}" ${visualCheck.status === "checking" ? "disabled" : ""}><span aria-hidden="true">▧</span>Photo</button>
                          ${window.coachDesktop ? `<button type="button" data-check-copied-code="${escapeHtml(check.id)}"><span aria-hidden="true">‹/›</span>Code</button><button type="button" data-check-screen="${escapeHtml(check.id)}"><span aria-hidden="true">⌗</span>Screen</button>` : ""}
                        </div>
                      </details>
                      ${visualLabel ? `<small class="check-visual-status" title="${escapeHtml(visualCheck.observation || visualCheck.suggested_action || visualLabel)}">${escapeHtml(visualLabel)}</small>` : ""}
                      ${needsInlineReview ? `<div class="check-visual-feedback"><strong>${escapeHtml(visualCheck.unavailable ? "Photo check needs a vision key" : visualCheck.status === "needs_attention" ? "Check found an issue" : "Image needs a closer check")}</strong><p>${escapeHtml(visualCheck.observation || visualCheck.issue || "The photo does not clearly prove this item yet.")}</p>${visualCheck.suggested_action ? `<small><b>Try:</b> ${escapeHtml(visualCheck.suggested_action)}</small>` : ""}${visualCheck.project_implication ? `<small><b>For this project:</b> ${escapeHtml(visualCheck.project_implication)}</small>` : ""}<div class="check-visual-actions"><button type="button" data-photo-upload="${escapeHtml(check.id)}">Upload again</button><button type="button" data-ask-check="${escapeHtml(check.id)}">Ask Coach</button></div></div>` : ""}
                    </div>`;
                }).join("")}
                </div>
                <div class="doing-task-support">
                  <span>${groupVerified ? "A result has been checked" : "Need help or a second check?"}</span>
                  <button class="task-assistant-button doing-group-assistant" type="button" data-task-assistant="${escapeHtml(contextCheck.id)}" aria-label="Open Task Coach" title="Help with this task" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="6" width="14" height="12" rx="4"></rect><path d="M12 3v3M9 11h.01M15 11h.01M9 14h6M3 11v2M21 11v2"></path></svg><span>Task Coach</span></button>
                </div>
                <div class="task-assistant-panel" data-task-assistant-panel="${escapeHtml(contextCheck.id)}" hidden>
                  <div class="task-assistant-panel-head"><strong>Task help</strong><button type="button" data-close-task-assistant="${escapeHtml(contextCheck.id)}" aria-label="Close task help" title="Close">×</button></div>
                  <div class="task-assistant-actions task-assistant-compact">
                    <details class="task-assistant-menu">
                      <summary><span aria-hidden="true">▶</span>Guide</summary>
                      <div class="task-assistant-submenu">
                        ${canShowWiringReference && groupIndex === 0 ? `<button type="button" data-task-help-wiring="${escapeHtml(contextCheck.id)}"><span aria-hidden="true">⌘</span>Wiring</button>` : ""}
                        <button type="button" data-task-help-learn="${escapeHtml(contextCheck.id)}"><span aria-hidden="true">?</span>Explain</button>
                      </div>
                    </details>
                    <details class="task-assistant-menu">
                      <summary><span aria-hidden="true">⌁</span>Check</summary>
                      <div class="task-assistant-submenu">
                        ${groupChecks.some((check) => shouldOfferPhotoCheck(check)) ? `<button type="button" data-task-help-photo="${escapeHtml(contextCheck.id)}"><span aria-hidden="true">▧</span>Photo</button>` : ""}
                        ${window.coachDesktop && groupCode ? `<button type="button" data-task-help-code="${escapeHtml(contextCheck.id)}"><span aria-hidden="true">‹/›</span>Code</button><button type="button" data-task-help-screen="${escapeHtml(contextCheck.id)}"><span aria-hidden="true">⌗</span>Screen</button>` : ""}
                      </div>
                    </details>
                    <button class="task-assistant-direct" type="button" data-task-help-ask="${escapeHtml(contextCheck.id)}"><span aria-hidden="true">◌</span>Ask Coach</button>
                  </div>
                </div>
                ${canShowWiringReference && wiringBelongsHere ? renderWiringReference(record, stage) : ""}
              </div>` : ""}
          </div>
          ${groupIndex < taskGroups.length - 1 ? `<div class="logic-connector doing-logic-connector" aria-hidden="true"><span class="logic-line"></span><span class="logic-arrow">↓</span></div>` : ""}`;
      }).join("")}
      </div>
    </section>
    <section class="doing-inspector" id="doingInspector" hidden aria-live="polite"></section>
    <div class="ask-coach-panel" id="askCoachPanel" hidden>
      <div class="ask-coach-head">
        <div>
          <strong>Ask Coach</strong>
          <p class="ask-coach-target" id="askCoachTarget">Current milestone</p>
        </div>
        <button class="ask-coach-close" id="cancelAskCoach" type="button" aria-label="Close Ask Coach" title="Close">×</button>
      </div>
      <div class="coach-modal-result" id="coachModalResult" ${record.coachConversation?.length ? "" : "hidden"}>${renderDoingCoachConversation(record.coachConversation)}</div>
      <textarea id="coachHelpText" rows="3" placeholder="Describe the exact symptom, error, or item you need help with."></textarea>
      <div class="ask-coach-actions">
        <details class="coach-evidence-menu">
          <summary id="coachEvidenceSummary">+ Add evidence</summary>
          <div>
            <button type="button" id="coachImageButton"><span aria-hidden="true">▧</span>Photo</button>
            ${window.coachDesktop ? `<button type="button" id="coachUseCopiedText"><span aria-hidden="true">‹/›</span>Copied text</button><button type="button" id="coachCaptureScreen"><span aria-hidden="true">⌗</span>Screen</button>` : ""}
          </div>
        </details>
        <button class="primary" id="sendAskCoach" type="button">Send</button>
      </div>
    </div>
    <div class="doing-actions">
      <button class="primary" id="markDoneButton" type="button">${completed ? "Done" : record.selfCheckAcknowledged ? "Continue self-checked" : "Finish, next"}</button>
      <button class="secondary" id="stuckButton" type="button">Ask Coach</button>
      ${record.finishHint ? `<span class="doing-finish-hint">${escapeHtml(record.finishHint)}</span>` : ""}
    </div>
  `;
  interactionArea.appendChild(wrap);
  let coachHelpImage = null;
  let coachHelpType = "check item";
  function setInspector(content, mode = "") {
    const panel = wrap.querySelector("#doingInspector");
    panel.hidden = false;
    panel.className = `doing-inspector ${mode}`.trim();
    panel.innerHTML = content;
    requestAnimationFrame(() => panel.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }
  function inspectionPayload(code = "") {
    return {
      project_goal: state.projectGoal,
      learning_content: state.learningContent,
      project_material: state.projectMaterial,
      task_name: state.selectedTaskName,
      milestone_title: getStageDisplayTitle(stage),
      learner_profile: learnerProfileGenerationBrief(),
      code,
    };
  }
  function renderInspectionResult(result = {}) {
    const status = ["pass", "needs_attention", "unclear"].includes(result.status) ? result.status : "unclear";
    const title = {
      pass: "No obvious issue found",
      needs_attention: "Needs attention",
      unclear: "Could not confirm",
    }[status];
    const loopText = {
      pass: "If this matches what you see in Arduino IDE, save it as fixed and continue.",
      needs_attention: "Make the suggested change in your file, then run the check again.",
      unclear: "Add a clearer code selection, compiler error, or screenshot before deciding.",
    }[status];
    const findings = Array.isArray(result.findings) ? result.findings.filter(Boolean).slice(0, 3) : [];
    return `
      <div class="doing-inspector-head">
        <span class="inspection-status ${status}">${escapeHtml(title)}</span>
        <button type="button" data-close-inspector aria-label="Close check result" title="Close">×</button>
      </div>
      <p>${escapeHtml(result.summary || "No check result was returned.")}</p>
      ${findings.length ? `<ul>${findings.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      <small><b>Next:</b> ${escapeHtml(result.next_action || "Verify the result in Arduino IDE before continuing.")}</small>
      ${result.project_implication ? `<div class="inspection-project-note"><b>For this project</b><span>${escapeHtml(result.project_implication)}</span>${result.project_next_step ? `<em>Then: ${escapeHtml(result.project_next_step)}</em>` : ""}</div>` : ""}
      <div class="inspection-loop">
        <span>${escapeHtml(loopText)}</span>
        <div class="inspection-loop-actions">
          <button type="button" data-inspection-recheck>${status === "pass" ? "Check again" : "I changed it, check again"}</button>
          ${status === "pass" ? `<button type="button" class="primary" data-inspection-fixed>Mark as fixed</button>` : ""}
          <button type="button" data-inspection-ask>Ask Coach</button>
        </div>
      </div>
    `;
  }
  function findCodeChecklistItem() {
    return checks.find((check) => check.id === evidenceTargetCheckId)
      || checks.find((check) => /code|sketch|upload|verify|compile|serial|ide|代码|上传|编译/.test(`${check.text} ${check.hint || ""}`.toLowerCase()))
      || checks.find((check) => !record.checklistStatus[check.id]);
  }
  function bindInspectionActions(result = {}, checkedCode = "", sourceLabel = "selected code") {
    wrap.querySelector("[data-close-inspector]")?.addEventListener("click", () => {
      wrap.querySelector("#doingInspector").hidden = true;
    });
    wrap.querySelector("[data-inspection-recheck]")?.addEventListener("click", () => {
      if (sourceLabel === "screen capture" || sourceLabel === "screenshot OCR") {
        inspectCapturedArea();
      } else {
        inspectCopiedCode();
      }
    });
    wrap.querySelector("[data-inspection-fixed]")?.addEventListener("click", () => {
      const targetCheck = findCodeChecklistItem();
      if (targetCheck) {
        record.checklistStatus[targetCheck.id] = true;
        record.checklistVisualChecks[targetCheck.id] = {
          status: "pass",
          observation: result.summary || `Checked against ${sourceLabel}.`,
          suggested_action: result.next_action || "Continue with the next task.",
        };
        record.note = `Code check saved: ${result.summary || "No obvious issue found."}`;
        updateKnowledgeFromStage(stage, "verified", `Code check passed: ${targetCheck.text}`);
      } else {
        record.note = `Code check saved: ${result.summary || "No obvious issue found."}`;
        updateKnowledgeFromStage(stage, "verified", `Code check passed: ${getStageDisplayTitle(stage)}`);
      }
      record.desktopArtifacts = [...(record.desktopArtifacts || []).slice(-3), {
        type: sourceLabel,
        status: "pass",
        summary: result.summary || "Marked as fixed after code check.",
        createdAt: new Date().toISOString(),
      }];
      updateRationale();
      render();
    });
    wrap.querySelector("[data-inspection-ask]")?.addEventListener("click", () => {
      const issueText = [
        result.summary,
        ...(Array.isArray(result.findings) ? result.findings : []),
        result.next_action ? `Next suggested check: ${result.next_action}` : "",
      ].filter(Boolean).join("\n");
      openAskCoachPanel("", {
        helpType: "confirm",
        description: `I checked ${sourceLabel}. Please help me decide what to do next.\n${issueText}${checkedCode ? `\n\nCode excerpt:\n${checkedCode.slice(0, 1600)}` : ""}`,
      });
    });
  }
  async function requestCodeCheck(code, sourceLabel) {
    setInspector(`<span class="inspection-loading"></span> Checking ${escapeHtml(sourceLabel)}...`, "loading");
    try {
      const response = await fetch(`${API_BASE}/api/code-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inspectionPayload(code)),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setInspector(renderInspectionResult(result), result.status || "unclear");
      bindInspectionActions(result, code, sourceLabel);
      record.desktopArtifacts = [...(record.desktopArtifacts || []).slice(-3), {
        type: sourceLabel,
        status: result.status || "unclear",
        summary: [result.summary, result.project_implication, result.project_next_step].filter(Boolean).join(" · "),
        createdAt: new Date().toISOString(),
      }];
      updateRationale();
    } catch (error) {
      setInspector(renderInspectionResult({
        status: "unclear",
        summary: "The code check could not be completed.",
        next_action: "Use Arduino IDE Verify, then copy the exact error and retry.",
      }), "unclear");
      bindInspectionActions({ status: "unclear", summary: "The code check could not be completed.", next_action: "Use Arduino IDE Verify, then copy the exact error and retry." }, code, sourceLabel);
    }
  }
  async function inspectCopiedCode() {
    const copied = await window.coachDesktop?.readClipboard();
    if (!copied?.trim()) {
      setInspector(`
        <div class="doing-inspector-head"><span class="inspection-status unclear">Copy code first</span><button type="button" data-close-inspector aria-label="Close" title="Close">×</button></div>
        <p>Select the relevant code or compiler error, press <b>Command-C</b>, then choose <b>Check copied code</b> again.</p>
      `, "unclear");
      wrap.querySelector("[data-close-inspector]")?.addEventListener("click", () => { wrap.querySelector("#doingInspector").hidden = true; });
      return;
    }
    await requestCodeCheck(copied.trim().slice(0, 10000), "copied code");
  }
  async function inspectCapturedArea() {
    setInspector(`<span class="inspection-loading"></span> Choose the editor or error area on screen...`, "loading");
    const captured = await window.coachDesktop?.captureArea();
    if (!captured) {
      wrap.querySelector("#doingInspector").hidden = true;
      return;
    }
    setInspector(`<span class="inspection-loading"></span> Reading the screenshot...`, "loading");
    try {
      const response = await fetch(`${API_BASE}/api/screenshot-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inspectionPayload(), image_data_url: captured.dataUrl }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setInspector(renderInspectionResult(result), result.status || "unclear");
      bindInspectionActions(result, result.ocr_text || "", "screen capture");
      record.desktopArtifacts = [...(record.desktopArtifacts || []).slice(-3), {
        type: "screen capture",
        name: captured.name,
        status: result.status || "unclear",
        summary: result.summary || "",
        createdAt: new Date().toISOString(),
      }];
      updateRationale();
    } catch (error) {
      setInspector(renderInspectionResult({
        status: "unclear",
        summary: "The screenshot could not be read.",
        next_action: "Capture a smaller, sharper part of the Arduino editor or error panel.",
      }), "unclear");
      bindInspectionActions({ status: "unclear", summary: "The screenshot could not be read.", next_action: "Capture a smaller, sharper part of the Arduino editor or error panel." }, "", "screen capture");
    }
  }
  wrap.querySelectorAll("[data-wiring-reference]").forEach((button) => {
    button.addEventListener("click", () => requestWiringReference(stage, record));
  });
  wrap.querySelectorAll("[data-close-wiring-reference]").forEach((button) => {
    button.addEventListener("click", () => {
      record.wiringTargetCheckId = "";
      render();
    });
  });
  wrap.querySelectorAll("[data-wire-part]").forEach((button) => {
    button.addEventListener("click", () => {
      const partId = button.dataset.wirePart || "";
      record.wiringFocus = record.wiringFocus === partId ? "" : partId;
      render();
    });
  });
  wrap.querySelectorAll("[data-doing-check]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = checkbox.dataset.doingCheck;
      record.checklistStatus[id] = checkbox.checked;
      record.selfCheckAcknowledged = false;
      if (checkbox.checked) {
        const upload = record.checklistUploads[id];
        if (upload) record.note = `Evidence added: ${upload.name}`;
        record.note ||= `Task marked done: ${checks.find((item) => item.id === id)?.text || id}`;
      } else if (record.checklistVisualChecks[id]?.status === "pass") {
        record.checklistVisualChecks[id] = record.checklistUploads[id]
          ? { status: "ready", observation: "Evidence is saved. Check it again when the task is complete." }
          : {};
      }
      record.missingEvidence = checks
        .filter((check) => record.checklistStatus[check.id])
        .map((check) => check.text);
      updateRationale();
      render();
    });
  });
  wrap.querySelectorAll("[data-photo-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.photoUpload;
      pickLocalImage().then((image) => {
        if (!image) return;
        record.checklistUploads[id] = image;
        record.checklistStatus[id] = false;
        record.selfCheckAcknowledged = false;
        record.checklistVisualChecks[id] = {
          status: "ready",
          observation: "Photo uploaded. Use Check to verify it against this exact item.",
          suggested_action: "Check the photo before marking this item complete.",
        };
        record.note = `Photo saved for checklist: ${image.name}`;
        updateKnowledgeFromStage(stage, "upload", `Photo evidence: ${image.name}`);
        updateRationale();
        render();
      });
    });
  });
  function openAskCoachPanel(checkId = "", options = {}) {
    askTargetCheckId = checkId;
    const check = checks.find((item) => item.id === checkId);
    const coachPanel = wrap.querySelector("#askCoachPanel");
    const checkRow = checkId ? wrap.querySelector(`[data-check-item="${CSS.escape(checkId)}"]`) : null;
    const nodePanel = checkRow?.closest(".doing-node-panel") || wrap.querySelector(".doing-node-panel");
    coachHelpImage = options.image || null;
    coachHelpType = options.helpType || (check ? "check item" : "stuck");
    wrap.querySelector("#askCoachTarget").textContent = check ? `Checklist item: ${check.text}` : `Milestone: ${getStageDisplayTitle(stage)}`;
    wrap.querySelector("#coachHelpText").value = options.description || "";
    updateCoachHelpChoices();
    updateCoachImageState();
    const resultBox = wrap.querySelector("#coachModalResult");
    const savedConversation = renderDoingCoachConversation(record.coachConversation);
    resultBox.hidden = !options.notice && !savedConversation;
    resultBox.innerHTML = options.notice
      ? `${savedConversation}<div class="doing-coach-notice">${escapeHtml(options.notice)}</div>`
      : savedConversation;
    wrap.querySelectorAll("[data-task-assistant-panel]").forEach((panel) => { panel.hidden = true; });
    wrap.querySelectorAll("[data-task-assistant]").forEach((button) => {
      button.classList.remove("active");
      button.setAttribute("aria-expanded", "false");
    });
    if (nodePanel && coachPanel.parentElement !== nodePanel) nodePanel.appendChild(coachPanel);
    coachPanel.hidden = false;
    coachPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  async function runVisualCheck(checkId) {
    const check = checks.find((item) => item.id === checkId);
    if (!check) return;
    let image = record.checklistUploads[checkId];
    if (!image) {
      image = await pickLocalImage();
      if (!image) return;
      record.checklistUploads[checkId] = image;
      record.note = `Photo saved for checklist: ${image.name}`;
      updateKnowledgeFromStage(stage, "upload", `Photo evidence: ${image.name}`);
    }
    record.checklistVisualChecks[checkId] = { status: "checking" };
    record.selfCheckAcknowledged = false;
    const item = wrap.querySelector(`[data-check-item="${CSS.escape(checkId)}"]`);
    const button = wrap.querySelector(`[data-visual-check="${CSS.escape(checkId)}"]`);
    item?.classList.add("visual-checking");
    button && (button.disabled = true);
    try {
      const response = await fetch(`${API_BASE}/api/visual-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_goal: state.projectGoal,
          learning_content: state.learningContent,
          project_material: state.projectMaterial,
          task_name: state.selectedTaskName,
          milestone_title: getStageDisplayTitle(stage),
          check_text: check.text,
          check_hint: check.hint || "",
          learner_profile: learnerProfileGenerationBrief(),
          image_data_url: image.dataUrl,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      record.checklistVisualChecks[checkId] = result;
      if (result.status === "pass") {
        record.checklistStatus[checkId] = true;
        record.note = `Photo check passed: ${check.text}`;
        updateKnowledgeFromStage(stage, "verified", `Photo check passed: ${check.text}`);
      } else {
        record.checklistStatus[checkId] = false;
        updateKnowledgeFromStage(stage, "struggling", `Photo check needs review: ${check.text}`);
      }
      updateRationale();
      render();
    } catch (error) {
      record.checklistStatus[checkId] = false;
      record.checklistVisualChecks[checkId] = {
        status: "unclear",
        observation: "The photo-check model could not be reached.",
        issue: error.message || "",
        suggested_action: "Check the Photo check API key in Coach settings, then try again.",
        unavailable: true,
      };
      updateRationale();
      render();
    } finally {
      item?.classList.remove("visual-checking");
      if (button) button.disabled = false;
    }
  }
  function toggleTaskAssistant(checkId) {
    const panel = wrap.querySelector(`[data-task-assistant-panel="${CSS.escape(checkId)}"]`);
    const button = wrap.querySelector(`[data-task-assistant="${CSS.escape(checkId)}"]`);
    if (!panel || !button) return;
    const shouldOpen = panel.hidden;
    wrap.querySelectorAll("[data-task-assistant-panel]").forEach((item) => {
      item.hidden = true;
      item.querySelectorAll("details[open]").forEach((menu) => menu.removeAttribute("open"));
    });
    wrap.querySelectorAll("[data-task-assistant]").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-expanded", "false");
    });
    panel.hidden = !shouldOpen;
    button.classList.toggle("active", shouldOpen);
    button.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeTaskAssistant() {
    wrap.querySelectorAll("[data-task-assistant-panel]").forEach((panel) => {
      panel.hidden = true;
      panel.querySelectorAll("details[open]").forEach((menu) => menu.removeAttribute("open"));
    });
    wrap.querySelectorAll("[data-task-assistant]").forEach((button) => {
      button.classList.remove("active");
      button.setAttribute("aria-expanded", "false");
    });
  }
  function focusDoingCheck(checkId, openAssistant = false) {
    if (!checkId) return;
    const group = taskGroups.find((item) => item.checks.some((check) => check.id === checkId));
    if (!group) return;
    if (record.openDoingGroup !== group.key) {
      record.openDoingGroup = group.key;
      render();
      window.requestAnimationFrame(() => {
        const activeItem = interactionArea.querySelector(`[data-check-item="${CSS.escape(checkId)}"]`);
        activeItem?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (openAssistant) interactionArea.querySelector(`[data-task-assistant="${CSS.escape(checkId)}"]`)?.click();
      });
      return;
    }
    const item = wrap.querySelector(`[data-check-item="${CSS.escape(checkId)}"]`);
    if (!item) return;
    item.scrollIntoView({ behavior: "smooth", block: "center" });
    item.classList.add("chain-focused");
    window.setTimeout(() => item.classList.remove("chain-focused"), 1050);
    if (openAssistant) {
      const panel = wrap.querySelector(`[data-task-assistant-panel="${CSS.escape(checkId)}"]`);
      if (panel?.hidden) toggleTaskAssistant(checkId);
    }
  }
  async function useTaskAssistant(checkId, action) {
    const check = checks.find((item) => item.id === checkId);
    if (!check) return;
    closeTaskAssistant();
    if (action === "wiring") {
      record.wiringTargetCheckId = checkId;
      await requestWiringReference(stage, record);
      requestAnimationFrame(() => interactionArea.querySelector(".wiring-reference-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
      return;
    }
    if (action === "photo") {
      await runVisualCheck(checkId);
      return;
    }
    if (action === "code") {
      state.desktopToolsExplained = true;
      await inspectCopiedCode();
      return;
    }
    if (action === "screen") {
      state.desktopToolsExplained = true;
      await inspectCapturedArea();
      return;
    }
    if (action === "learn") {
      openAskCoachPanel(checkId, {
        helpType: "learn",
        description: `Explain how to complete this task: ${check.text}`,
      });
      return;
    }
    openAskCoachPanel(checkId);
  }
  wrap.querySelector("[data-compare-reference]")?.addEventListener("click", () => {
    openAskCoachPanel(record.wiringTargetCheckId || "");
    coachHelpType = "confirm";
    updateCoachHelpChoices();
    wrap.querySelector("#coachHelpText").value = "I want to compare my wiring with the reference. The connection I am unsure about is: ";
  });
  function updateCoachHelpChoices() {
    const description = wrap.querySelector("#coachHelpText");
    if (description) {
      const learnMode = coachHelpType === "learn";
      description.placeholder = learnMode
        ? "Name the operation, tool, part or concept you want to learn."
        : "Describe the exact symptom, error, or item you need help with.";
    }
  }
  function updateCoachImageState() {
    const imageButton = wrap.querySelector("#coachImageButton");
    const evidenceMenu = wrap.querySelector(".coach-evidence-menu");
    const evidenceSummary = wrap.querySelector("#coachEvidenceSummary");
    imageButton?.classList.toggle("has-file", Boolean(coachHelpImage));
    evidenceMenu?.classList.toggle("has-evidence", Boolean(coachHelpImage));
    if (evidenceSummary) {
      evidenceSummary.textContent = coachHelpImage
        ? `Evidence · ${shorten(coachHelpImage.name || "Photo", 20)}`
        : "+ Add evidence";
    }
  }
  wrap.querySelector("#markDoneButton").addEventListener("click", () => {
    const remaining = checks.filter((check) => !record.checklistStatus[check.id]);
    if (remaining.length) {
      record.finishHint = `${remaining.length} build check${remaining.length === 1 ? "" : "s"} still open.`;
      render();
      return;
    }
    const verifiedChecks = checks.filter((check) => record.checklistVisualChecks?.[check.id]?.status === "pass");
    if (!verifiedChecks.length && !record.selfCheckAcknowledged) {
      record.finishHint = "Tasks are marked done. Check one result before continuing.";
      record.selfCheckAcknowledged = true;
      record.openDoingGroup = taskGroups[0]?.key || record.openDoingGroup;
      render();
      return;
    }
    record.finishHint = "";
    record.note = record.note || (verifiedChecks.length
      ? `Completed ${getStageDisplayTitle(stage)} with checked evidence.`
      : `Completed ${getStageDisplayTitle(stage)} with a self-checked result.`);
    updateRationale();
    advanceCurrentStage();
  });
  wrap.querySelector("#stuckButton").addEventListener("click", () => {
    openAskCoachPanel("");
  });
  wrap.querySelectorAll("[data-ask-check]").forEach((button) => {
    button.addEventListener("click", () => openAskCoachPanel(button.dataset.askCheck));
  });
  wrap.querySelectorAll("[data-task-assistant]").forEach((button) => {
    button.addEventListener("click", () => toggleTaskAssistant(button.dataset.taskAssistant));
  });
  wrap.querySelectorAll(".task-assistant-menu").forEach((menu) => {
    menu.addEventListener("toggle", () => {
      if (!menu.open) return;
      const panel = menu.closest("[data-task-assistant-panel]");
      panel?.querySelectorAll(".task-assistant-menu[open]").forEach((otherMenu) => {
        if (otherMenu !== menu) otherMenu.removeAttribute("open");
      });
    });
  });
  wrap.querySelectorAll("[data-doing-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupKey = button.dataset.doingGroup || "";
      record.openDoingGroup = record.openDoingGroup === groupKey ? "" : groupKey;
      render();
      if (record.openDoingGroup) {
        window.requestAnimationFrame(() => interactionArea.querySelector(`[data-doing-group="${CSS.escape(groupKey)}"]`)?.parentElement?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
      }
    });
  });
  wrap.querySelectorAll("[data-close-task-assistant]").forEach((button) => {
    button.addEventListener("click", () => toggleTaskAssistant(button.dataset.closeTaskAssistant));
  });
  wrap.querySelectorAll("[data-task-help-wiring]").forEach((button) => {
    button.addEventListener("click", () => useTaskAssistant(button.dataset.taskHelpWiring, "wiring"));
  });
  wrap.querySelectorAll("[data-task-help-photo]").forEach((button) => {
    button.addEventListener("click", () => useTaskAssistant(button.dataset.taskHelpPhoto, "photo"));
  });
  wrap.querySelectorAll("[data-task-help-code]").forEach((button) => {
    button.addEventListener("click", () => useTaskAssistant(button.dataset.taskHelpCode, "code"));
  });
  wrap.querySelectorAll("[data-task-help-screen]").forEach((button) => {
    button.addEventListener("click", () => useTaskAssistant(button.dataset.taskHelpScreen, "screen"));
  });
  wrap.querySelectorAll("[data-task-help-learn]").forEach((button) => {
    button.addEventListener("click", () => useTaskAssistant(button.dataset.taskHelpLearn, "learn"));
  });
  wrap.querySelectorAll("[data-task-help-ask]").forEach((button) => {
    button.addEventListener("click", () => useTaskAssistant(button.dataset.taskHelpAsk, "ask"));
  });
  wrap.querySelectorAll("[data-library-resource]").forEach((link) => {
    link.addEventListener("click", () => {
      recordLibraryResourceUse(link.dataset.libraryResource, stage, link.dataset.libraryCheck || "");
    });
  });
  wrap.querySelectorAll("[data-doing-chain-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.doingChainAction;
      const checkId = button.dataset.doingChainCheck || "";
      if (action === "assist") {
        focusDoingCheck(checkId, true);
        return;
      }
      if (action === "focus") {
        focusDoingCheck(checkId);
        return;
      }
      wrap.querySelector("#markDoneButton")?.click();
    });
  });
  wrap.querySelectorAll("[data-visual-check]").forEach((button) => {
    button.addEventListener("click", () => runVisualCheck(button.dataset.visualCheck));
  });
  wrap.querySelectorAll("[data-check-copied-code]").forEach((button) => {
    button.addEventListener("click", () => {
      evidenceTargetCheckId = button.dataset.checkCopiedCode || "";
      inspectCopiedCode();
    });
  });
  wrap.querySelectorAll("[data-check-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      evidenceTargetCheckId = button.dataset.checkScreen || "";
      inspectCapturedArea();
    });
  });
  wrap.querySelectorAll("[data-coach-help-type]").forEach((button) => {
    button.addEventListener("click", () => {
      coachHelpType = button.dataset.coachHelpType;
      updateCoachHelpChoices();
    });
  });
  wrap.querySelector("#cancelAskCoach").addEventListener("click", () => {
    wrap.querySelector("#askCoachPanel").hidden = true;
  });
  wrap.querySelector("#coachImageButton").addEventListener("click", async () => {
    coachHelpImage = await pickLocalImage();
    updateCoachImageState();
    wrap.querySelector(".coach-evidence-menu")?.removeAttribute("open");
  });
  wrap.querySelector("#coachUseCopiedText")?.addEventListener("click", async () => {
    const copied = await window.coachDesktop.readClipboard();
    if (!copied?.trim()) {
      wrap.querySelector("#coachHelpText").placeholder = "Copy selected text first, then use this button.";
      return;
    }
    const description = wrap.querySelector("#coachHelpText");
    description.value = `Selected reference:\n${copied.trim().slice(0, 2400)}\n\n${description.value}`.trim();
    coachHelpType = "confirm";
    updateCoachHelpChoices();
    wrap.querySelector(".coach-evidence-menu")?.removeAttribute("open");
  });
  wrap.querySelector("#coachCaptureScreen")?.addEventListener("click", async () => {
    const captured = await window.coachDesktop.captureArea();
    if (!captured) return;
    coachHelpImage = captured;
    coachHelpType = "confirm";
    updateCoachHelpChoices();
    updateCoachImageState();
    wrap.querySelector(".coach-evidence-menu")?.removeAttribute("open");
  });
  wrap.querySelector("#sendAskCoach").addEventListener("click", () => {
    const description = wrap.querySelector("#coachHelpText").value.trim();
    const targetCheck = checks.find((check) => check.id === askTargetCheckId);
    record.selected = "Asked Coach";
    updateKnowledgeFromStage(stage, "struggling", `Asked Coach: ${targetCheck?.text || getStageDisplayTitle(stage)}`);
    sendDoingCoachRequest(stage, checks, record, wrap, {
      request_type: "ask_coach_on_demand",
      milestone_title: getStageDisplayTitle(stage),
      current_stage: stage.role,
      help_type: coachHelpType,
      target_check: targetCheck ? {
        id: targetCheck.id,
        text: targetCheck.text,
        checked: Boolean(record.checklistStatus[targetCheck.id]),
        hint: targetCheck.hint || "",
      } : null,
      checklist_status: checks.map((check) => ({
        id: check.id,
        text: check.text,
        checked: Boolean(record.checklistStatus[check.id]),
        has_photo: Boolean(record.checklistUploads[check.id]),
        uploaded_file: record.checklistUploads[check.id]?.name || "",
      })),
      user_description: description || "No description provided",
      images: [
        ...Object.values(record.checklistUploads || {}).map((item) => ({ name: item.name, data_url: item.dataUrl?.slice(0, 2000) || "" })),
        coachHelpImage ? { name: coachHelpImage.name, data_url: coachHelpImage.dataUrl?.slice(0, 2000) || "" } : null,
      ].filter(Boolean),
      code_snippet: extractCodeSnippet(description),
      conversation_history: (record.coachConversation || []).slice(-6),
      support_context: inferDoingSupportContext(stage),
      note: "Only respond because the student clicked Ask Coach. Keep the reply short and diagnostic.",
    });
  });
  wrap.querySelector("#coachHelpText").addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      wrap.querySelector("#sendAskCoach").click();
    }
  });
}

function inferDoingSupportContext(stage) {
  const text = `${stage.title || ""} ${stage.prompt || ""} ${stage.planStep?.detail || ""} ${state.projectGoal || ""} ${state.learningContent || ""} ${state.projectMaterial || ""}`.toLowerCase();
  if (/rhino|fusion|solidworks|blender|cad|model|sketch|extrude|boolean|loft|render/.test(text)) return "modelling software";
  if (/arduino|sensor|circuit|wiring|breadboard|servo|motor|led|voltage|electronics?/.test(text)) return "hardware or electronics";
  if (/mechanism|mechanical|linkage|joint|gear|bearing|structure|assembly|tolerance|fabricat/.test(text)) return "mechanical structure";
  if (/code|coding|program|script|software|python|javascript|ide|compile|debug/.test(text)) return "code or software";
  return "project making";
}

async function sendDoingCoachRequest(stage, checks, record, wrap, payload) {
  const resultBox = wrap.querySelector("#coachModalResult");
  const sendButton = wrap.querySelector("#sendAskCoach");
  const userText = String(payload.user_description || "Help me with this task.").trim();
  record.coachConversation ||= [];
  record.coachConversation.push({ role: "student", text: userText, createdAt: new Date().toISOString() });
  record.coachConversation = record.coachConversation.slice(-8);
  resultBox.hidden = false;
  resultBox.innerHTML = `${renderDoingCoachConversation(record.coachConversation)}<div class="doing-coach-loading"><span class="coach-loading-dot"></span> Coach is checking...</div>`;
  sendButton.disabled = true;
  try {
    const response = await fetch(`${API_BASE}/api/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: getStageDisplayTitle(stage),
        state: {
          projectGoal: state.projectGoal,
          learningContent: state.learningContent,
          projectMaterial: state.projectMaterial,
          selectedTaskName: state.selectedTaskName,
        },
        message: "The student explicitly asked for help with this current milestone.",
        userAction: "ask_coach_on_demand",
        reasoningContext: payload,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const reply = data.coach || "I need a clearer symptom, photo, code snippet or error message to diagnose this.";
    record.note = data.record_update || record.note || "Asked Coach during this milestone.";
    record.coachConversation.push({ role: "coach", text: reply, createdAt: new Date().toISOString() });
    record.coachConversation = record.coachConversation.slice(-8);
    resultBox.innerHTML = `${renderDoingCoachConversation(record.coachConversation)}${renderCoachLearningSupport(data)}`;
    const input = wrap.querySelector("#coachHelpText");
    if (input) {
      input.value = "";
      input.placeholder = "Ask a follow-up about this task.";
    }
    updateRationale();
    requestAnimationFrame(() => resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  } catch (error) {
    resultBox.innerHTML = `${renderDoingCoachConversation(record.coachConversation)}<div class="doing-coach-error">Coach unavailable: ${escapeHtml(error.message || "unknown error")}</div>`;
  } finally {
    sendButton.disabled = false;
  }
}

function renderCoachLearningSupport(data = {}) {
  const actions = Array.isArray(data.guided_actions) ? data.guided_actions.slice(0, 4) : [];
  const actionMarkup = actions.length ? `
    <section class="coach-guided-actions" aria-label="Suggested actions">
      <strong>Try this</strong>
      <ol>${actions.map((item) => {
        const location = String(item?.location || "").trim();
        const action = String(item?.action || item || "").trim();
        if (!action) return "";
        return `<li>${location ? `<b>${escapeHtml(location)}</b>` : ""}<span>${escapeHtml(action)}</span></li>`;
      }).join("")}</ol>
    </section>` : "";
  const video = data.video_resource && typeof data.video_resource === "object" ? data.video_resource : null;
  const query = String(video?.youtube_query || "").trim().slice(0, 180);
  if (!query) return actionMarkup;
  const title = String(video?.title || "Short visual reference").trim().slice(0, 90);
  const reason = String(video?.reason || "Use this to orient yourself, then check it against your own project.").trim().slice(0, 150);
  const embedUrl = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&rel=0`;
  return `${actionMarkup}
    <section class="coach-video-resource" aria-label="Video learning resource">
      <div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(reason)}</small></div>
      <iframe title="${escapeHtml(title)}" src="${embedUrl}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
    </section>`;
}

function formatCoachReply(reply) {
  return escapeHtml(reply)
    .replace(/\[Problem\]/g, "<b>[Problem]</b>")
    .replace(/\[Action\]/g, "<b>[Action]</b>")
    .replace(/\[Verify\]/g, "<b>[Verify]</b>")
    .replace(/\n/g, "<br>");
}

function renderDoingVisual(stage, record = {}, checks = []) {
  const activeIndex = checks.findIndex((check) => !record.checklistStatus?.[check.id]);
  const activeCheck = activeIndex >= 0 ? checks[activeIndex] : null;
  const nextCheck = activeIndex >= 0 ? checks[activeIndex + 1] : null;
  const evidence = activeCheck ? record.checklistUploads?.[activeCheck.id] : null;
  const visual = activeCheck ? record.checklistVisualChecks?.[activeCheck.id] : null;
  const verificationCheck = checks.slice(Math.max(0, activeIndex)).find((check) => /test|run|observe|measure|verify|serial|upload|compile|behavio(u)?r|response|movement/i.test(`${check.text} ${check.hint || ""}`)) || activeCheck;
  const currentStageIndex = stages.findIndex((item) => item.key === stage.key);
  const nextStage = stages.slice(currentStageIndex + 1).find((item) => isDoingStage(item)) || stages[currentStageIndex + 1];
  const compact = (text, max = 46) => shorten(String(text || ""), max);
  const nodes = activeCheck ? [
    {
      kind: "Build",
      title: activeCheck.text,
      status: "Ready to do",
      state: "active",
      checkId: activeCheck.id,
      action: "focus",
    },
    {
      kind: "Evidence",
      title: evidence ? `Saved: ${evidence.name}` : `Capture proof for ${compact(activeCheck.text, 31)}`,
      status: evidence ? "Evidence added" : "Optional until needed",
      state: evidence ? "complete" : "pending",
      checkId: activeCheck.id,
      action: "assist",
    },
    {
      kind: "Check",
      title: verificationCheck?.text || activeCheck.text,
      status: visual?.status === "pass" ? "Verified" : visual?.status === "needs_attention" ? "Needs correction" : "Check when ready",
      state: visual?.status === "pass" ? "complete" : visual?.status === "needs_attention" ? "attention" : "pending",
      checkId: activeCheck.id,
      action: "assist",
    },
    {
      kind: "Next",
      title: nextCheck?.text || (nextStage ? `Continue: ${getStageDisplayTitle(nextStage)}` : "Complete this milestone"),
      status: nextCheck ? "Unlock after this check" : "Ready when all checks pass",
      state: "pending",
      checkId: nextCheck?.id || "",
      action: nextCheck ? "focus" : "finish",
    },
  ] : [{
    kind: "Result",
    title: "All build checks are complete",
    status: nextStage ? `Next: ${getStageDisplayTitle(nextStage)}` : "Milestone complete",
    state: "complete",
    checkId: "",
    action: "finish",
  }];
  return `
    <section class="doing-chain" aria-label="Current doing chain">
      <div class="doing-chain-head"><strong>Doing path</strong><span>${checks.filter((check) => record.checklistStatus?.[check.id]).length} / ${checks.length} complete</span></div>
      <div class="doing-chain-nodes">
        ${nodes.map((node, index) => `
          <button class="doing-chain-node ${node.state}" type="button" data-doing-chain-action="${node.action}" data-doing-chain-check="${escapeHtml(node.checkId || "")}" title="${escapeHtml(node.title)}">
            <span class="doing-chain-index">${index + 1}</span>
            <span class="doing-chain-copy"><small>${node.kind}</small><strong>${escapeHtml(compact(node.title))}</strong><em>${escapeHtml(node.status)}</em></span>
          </button>
          ${index < nodes.length - 1 ? `<i class="doing-chain-link ${node.state}" aria-hidden="true"></i>` : ""}
        `).join("")}
      </div>
    </section>
  `;
}

function pickLocalImage() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => resolve({ name: file.name, dataUrl: await compressImageForAgent(String(reader.result || "")) });
      reader.onerror = () => resolve({ name: file.name, dataUrl: "" });
      reader.readAsDataURL(file);
    }, { once: true });
    input.click();
  });
}

function compressImageForAgent(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image/")) {
      resolve(dataUrl);
      return;
    }
    const image = new Image();
    image.onload = () => {
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(image.width || 1, image.height || 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", .82));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function extractCodeSnippet(text) {
  const match = String(text || "").match(/```[\s\S]*?```|void\s+setup[\s\S]+|function\s+\w+[\s\S]+/i);
  return match ? match[0].replace(/^```[a-z]*|```$/gi, "").trim() : "";
}

function getMilestoneChecklist(stage) {
  if (Array.isArray(stage.planStep?.checklist) && stage.planStep.checklist.length) {
    return stage.planStep.checklist.slice(0, 6).map((item, index) => normaliseChecklistItem(item, index, stage));
  }
  const text = `${stage.title} ${stage.prompt} ${stage.planStep?.detail || ""} ${state.projectGoal} ${state.learningContent} ${state.projectMaterial}`.toLowerCase();
  if (/motor|wheel|drive|h-bridge|l298n|tb6612|电机|轮|驱动/.test(text)) {
    return [
      checklistItem(1, "Motor wires connect to driver output", "Check OUT1 and OUT2 on the motor driver.", false),
      checklistItem(2, "Motor power and GND are connected", "Separate motor power from logic power when needed.", false),
      checklistItem(3, "Arduino control pin connects to driver input", "Check the pin number matches the code.", true, "Upload a clear wiring photo."),
      checklistItem(4, "Motor turns after upload", "If it buzzes but does not turn, check current and common ground.", false),
    ];
  }
  if (/sensor|ultrasonic|hc-sr04|distance|传感器|超声波|距离/.test(text)) {
    return [
      checklistItem(1, "Sensor VCC and GND are connected", "Check the module voltage requirement.", false),
      checklistItem(2, "Signal pins match the code", "Trigger and Echo pins are easy to swap.", true, "Upload a wiring photo if unsure."),
      checklistItem(3, "Serial Monitor shows distance values", "Open Serial Monitor and check changing values.", false),
      checklistItem(4, "Values change when distance changes", "Move an object closer and farther away.", false),
    ];
  }
  if (/code|ide|sketch|compile|upload|代码/.test(text)) {
    return [
      checklistItem(1, "Board type is selected", "Check Tools > Board.", false),
      checklistItem(2, "Port is selected", "Check Tools > Port before uploading.", false),
      checklistItem(3, "Code verifies without errors", "Use Verify before Upload.", false),
      checklistItem(4, "Upload succeeds and output is observed", "If upload fails, copy the exact error.", false),
    ];
  }
  if (/integration|complete|closed loop|mode|整合|闭环|完成/.test(text)) {
    return [
      checklistItem(1, "Each subsystem works alone", "Test components separately before combining.", false),
      checklistItem(2, "Combined behaviour matches the goal", "Look for the expected physical response.", false),
      checklistItem(3, "Failure point is identified", "Mark whether the issue is power, wiring, code or logic.", false),
      checklistItem(4, "Evidence is saved for the record", "Save photo, screenshot, value, or short note.", true, "Upload evidence from the integrated test."),
    ];
  }
  return [
    checklistItem(1, "Small output is created", "Make the smallest visible result first.", false),
    checklistItem(2, "Observed result is saved", "Record what changed or failed.", false),
    checklistItem(3, "Main risk is checked", "Look at time, material, skill or safety.", false),
    checklistItem(4, "Next learning gap is clear", "Name what you need to learn next.", false),
  ];
}

function checklistItem(id, text, hint, requiredPhoto = false, photoPrompt = "") {
  return {
    id: String(id),
    text,
    hint,
    required_photo: requiredPhoto,
    photo_prompt: photoPrompt,
  };
}

function normaliseChecklistItem(item, index) {
  if (typeof item === "string") {
    return checklistItem(index + 1, item, "Check this before moving on.", false);
  }
  return {
    id: String(item.id || index + 1),
    text: item.text || item.title || `Checklist item ${index + 1}`,
    hint: item.hint || "Check this before moving on.",
    required_photo: Boolean(item.required_photo || item.requiredPhoto),
    photo_prompt: item.photo_prompt || item.photoPrompt || "Upload a photo for this check.",
  };
}

function updateKnowledgeMapFromStage(stage) {
  const record = state.records[stage.key];
  const checked = record.missingEvidence || [];
  updateKnowledgeFromStage(stage, "verified", `Completed milestone: ${getStageDisplayTitle(stage)}`);
  record.note = [
    record.note,
    checked.length ? `Knowledge map nodes: ${checked.join(", ")}` : "Knowledge map updated from this milestone.",
  ].filter(Boolean).join(" | ");
}

function getStableStagePrompt(stage) {
  return state.stagePrompts?.[stage.key] || stage.prompt;
}

function renderLogicConnector(stageOrKey, index) {
  const stageKey = typeof stageOrKey === "string" ? stageOrKey : stageOrKey.key;
  const stageRole = typeof stageOrKey === "string" ? stageOrKey : stageOrKey.role || stageOrKey.key;
  const labelsByStage = {
    goal: ["sets direction", "defines decision"],
    need: ["triggered by project", "sets boundary"],
    guide: ["shows what to watch", "reveals uncertainty"],
    reasoning: ["connects to project", "checks fit", "tests assumptions", "needs evidence", "informs action"],
    practice: ["sets signal", "checks risk"],
    validate: ["sets threshold", "may revise"],
    decision: ["compare before choosing", "student decides"],
  };
  const label = labelsByStage[stageRole]?.[index] || labelsByStage[stageKey]?.[index] || ["supports", "checks", "informs"][index % 3];
  const isBranch = stageRole === "reasoning" && index === 2;
  return `
    <div class="logic-connector ${isBranch ? "branch" : ""}" aria-hidden="true">
      <span class="logic-line"></span>
      <span class="logic-label">${escapeHtml(label)}</span>
      <span class="logic-arrow">↓</span>
      ${isBranch ? `
        <div class="logic-branch">
          <span>evidence</span>
          <span>constraint</span>
        </div>
      ` : ""}
    </div>
  `;
}

function renderInlineReasoningCard(item, record, stageKey) {
  const toolKey = item.tool || "";
  const displayQuestion = compactQuestion(item.question, item.title);
  return `
    <div class="reasoning-input-panel inline ${record.saved ? "editing-saved" : ""}">
      <div class="reasoning-input-title">
        <span title="${escapeHtml(item.question)}">${escapeHtml(displayQuestion)}</span>
        <button class="node-coach-hint" type="button" data-node-coach-hint aria-expanded="${Boolean(record.nodeHintOpen)}" aria-label="Show a Coach hint" title="Coach hint">🤖</button>
      </div>
      ${record.nodeHintOpen ? `
        <div class="node-hint" role="status">
          <strong>Coach hint</strong>
          <span>${escapeHtml(item.hint || "Identify the project condition, evidence, or constraint that would change this choice.")}</span>
        </div>
      ` : ""}
      ${item.microLesson ? `
        <div class="micro-lesson">
          <span>Learn</span>
          <p>${escapeHtml(item.microLesson)}</p>
        </div>
      ` : ""}
      ${toolKey ? renderAnalysisToolPreview(toolKey, item, record) : ""}
      ${toolKey ? "" : `<div class="reasoning-actions ${item.selectionMode === "multiple" ? "multiple" : ""}" role="group" aria-label="${item.selectionMode === "multiple" ? "Choose all that apply" : "Choose one option"}">
        ${item.options.map((option) => `
          <button type="button" class="${selectedValues(record.selected).includes(option) ? "selected" : ""}" aria-pressed="${selectedValues(record.selected).includes(option)}" data-reasoning-option="${escapeHtml(option)}" title="${item.selectionMode === "multiple" ? "Choose all that apply" : "Choose one"}">${escapeHtml(option)}</button>
        `).join("")}
      </div>`}
      ${record.saveHint ? `<div class="reasoning-save-hint" role="status">Save this step before continuing.</div>` : ""}
      <div class="quick-reason-row">
        <input id="reasoningNote" type="text" placeholder="Why this fits (optional)" value="${escapeHtml(record.note)}" />
        <button class="reasoning-save" type="button" id="saveReasoningStep">${record.saved ? "Update" : "Save"}</button>
      </div>
    </div>
  `;
}

function compactQuestion(question, title = "") {
  const text = String(question || "").trim().replace(/\s+/g, " ");
  if (!text) return title ? `What do you want to decide about ${title}?` : "What do you want to work out?";
  const noisy = text
    .replace(/I am working on .*?(?= The project| Build a| Possible options|$)/i, "this project")
    .replace(/The project is .*?(?= I am not| I need| Possible options| Build a|$)/i, "the project")
    .replace(/Possible options include .*?(?= Build a|$)/i, "")
    .replace(/Build a .*?(?=\\?|$)/i, "build this prototype")
    .trim();
  return noisy;
}

function renderToolIcon(key) {
  if (key === "two-axis") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V5" /><path d="M5 19h14" /><path d="M12 7v12" /><path d="M5 12h14" /><circle cx="15.5" cy="8.5" r="1.7" /><circle cx="9" cy="16" r="1.7" /></svg>`;
  }
  if (key === "morphology") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14" /><path d="M5 12h14" /><path d="M5 17h14" /><path d="M10 5v14" /><path d="M15 5v14" /></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l7 5-3 9H8L5 9z" /><path d="M12 4v14" /><path d="M5 9l11 9" /><path d="M19 9L8 18" /></svg>`;
}

function getToolLabel(key) {
  return {
    radar: "Radar analysis",
    "two-axis": "2x2 matrix",
    morphology: "Morphological matrix",
  }[key] || "Analysis tool";
}

function renderAnalysisToolPreview(toolKey, item, record = {}) {
  const title = {
    radar: "Multi-criteria fit",
    "two-axis": "Two-axis comparison",
    morphology: "Morphological options",
  }[toolKey] || "Analysis tool";
  const config = item.toolConfig || normaliseToolConfig(toolKey, null, item) || {};
  const selections = record.toolSelections || {};
  const selectedTool = record.tool || "";
  const selected = (value, slot = "") => (slot ? selections[slot] === value : selectedTool === value) ? "selected" : "";
  const choiceButton = (label, slot = "") => `data-tool-choice="${escapeHtml(label)}"${slot ? ` data-tool-slot="${escapeHtml(slot)}"` : ""}`;
  const body = {
    radar: `
      <div class="tool-radar-control project-radar">
        ${(config.criteria || []).map((criterion) => `
          <div class="tool-rating-row">
            <span>${escapeHtml(criterion)}</span>
            <div class="tool-levels" role="group" aria-label="Rate ${escapeHtml(criterion)}">
              ${["low", "mixed", "strong"].map((level) => `<button type="button" ${choiceButton(level, criterion)} class="${selected(level, criterion)}" title="${escapeHtml(criterion)}: ${level}">${level === "mixed" ? "~" : level === "strong" ? "+" : "-"}</button>`).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `,
    "two-axis": `
      <div class="tool-axis-guide">Drag a route to reflect your evidence, then select the one to test next.</div>
      <div class="tool-axis interactive" data-axis-board aria-label="${escapeHtml(title)}">
        <span class="tool-axis-y-high">High ${escapeHtml(config.axes?.vertical || "value")}</span>
        <span class="tool-axis-y-low">Low</span>
        <span class="tool-axis-x-low">Low ${escapeHtml(config.axes?.horizontal || "effort")}</span>
        <span class="tool-axis-x-high">High</span>
        ${(config.candidates || []).map((candidate) => {
          const savedPosition = record.toolPositions?.[candidate.label] || candidate;
          const x = Math.max(10, Math.min(90, Number(savedPosition.x) || 50));
          const y = Math.max(12, Math.min(88, Number(savedPosition.y) || 50));
          return `<button type="button" ${choiceButton(candidate.label)} data-axis-candidate="${escapeHtml(candidate.label)}" class="tool-axis-point ${selected(candidate.label)}" style="--axis-x:${x}%;--axis-y:${y}%;" title="Drag to position ${escapeHtml(candidate.label)}, then select it">${escapeHtml(shorten(candidate.label, 17))}</button>`;
        }).join("")}
      </div>
      <div class="tool-axis-summary">${selectedTool ? `Selected next route: <strong>${escapeHtml(selectedTool)}</strong>` : "Place and select the route you would test next."}</div>
    `,
    morphology: `
      <div class="tool-process-rail" aria-label="Morphology process"><span class="active">01 Functions</span><i>→</i><span>02 Means</span><i>→</i><span>03 Combine</span><i>→</i><span>04 Screen</span></div>
      <div class="tool-morphology project-morphology">
        ${(config.rows || []).map((row) => `
          <div class="tool-morphology-row">
            <strong>${escapeHtml(row.label)}</strong>
            <div>${row.options.map((option) => `<button type="button" ${choiceButton(option, row.label)} class="${selected(option, row.label)}">${escapeHtml(option)}</button>`).join("")}</div>
          </div>
        `).join("")}
      </div>
      <div class="tool-morphology-screen">
        <div class="tool-screen-copy"><strong>Screen this combination</strong><span>${(config.screeningCriteria || []).map((criterion) => `<em>${escapeHtml(criterion)}</em>`).join("")}</span></div>
        <button type="button" data-morph-screen="true" class="tool-screen-button">Check route</button>
        ${record.toolScreening ? `<p class="tool-screen-result">${escapeHtml(record.toolScreening)}</p>` : ""}
      </div>
    `,
  }[toolKey];
  return `
    <div class="analysis-tool-preview">
      <div class="analysis-tool-title">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(shorten(item.title, 24))}</span>
      </div>
      ${config.purpose ? `<p class="analysis-tool-purpose">${escapeHtml(compactQuestion(config.purpose))}</p>` : ""}
      ${body}
    </div>
  `;
}

function getAxisCandidateClass(quadrant = "") {
  const value = String(quadrant).toLowerCase();
  const left = /low (effort|time|cost|resource)|easy|simple/.test(value);
  const top = /high (value|quality|precision|fit|benefit)|strong/.test(value);
  return `axis-${top ? "top" : "bottom"}-${left ? "left" : "right"}`;
}

function buildStageReasoningSummary(stageKey) {
  if (!stageKey || !stageReasoningChains[stageKey] || !state.chainRecords[stageKey]) return "";
  return stageReasoningChains[stageKey]
    .map((item) => {
      const record = state.chainRecords[stageKey][item.key];
      const value = [selectedText(record.selected), record.tool ? `analysis: ${record.tool}` : "", record.toolScreening ? `screening: ${record.toolScreening}` : "", record.coachPath ? `next path: ${record.coachPath}` : "", record.note].filter(Boolean).join(": ");
      return value ? `${item.title} - ${value}` : "";
    })
    .filter(Boolean)
    .join(" | ");
}

async function requestCoachNote(reasoningContext, stageKey, itemKey) {
  if (!allowBoundaryEnabled(/ask.*reason|reasoning/i)) {
    const record = state.chainRecords[stageKey]?.[itemKey];
    if (record) {
      record.coachNote = "";
      record.coachNoteType = "";
      record.nextCheck = "";
      record.nextCheckPinned = false;
      record.coachNoteLoading = false;
    }
    render();
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: stages.find((stage) => stage.key === stageKey)?.title || "Reasoning scaffold",
        state,
        message: "The student saved this reasoning node. Return one quiet, optional Coach note.",
        userAction: "reasoning_step_completed",
        reasoningContext,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const record = state.chainRecords[stageKey]?.[itemKey];
    if (!record) return;
    record.coachNote = data.note_needed === false ? "" : (data.coach_note || "");
    record.coachNoteType = record.coachNote ? (data.coach_note_type || "verify") : "";
    record.nextCheck = record.coachNote ? (data.next_check || "") : "";
    record.nextCheckPinned = false;
    record.coachOptions = [];
    record.coachNoteOpen = true;
    record.coachNoteLoading = false;
    state.records[stageKey].note = buildStageReasoningSummary(stageKey);
    render();
  } catch (error) {
    const record = state.chainRecords[stageKey]?.[itemKey];
    if (record) record.coachNoteLoading = false;
    render();
  }
}

function buildCurrentReasoningContext(extra = {}) {
  const stage = currentStage();
  const chain = stageReasoningChains[stage.key] || [];
  const activeKey = state.openChainKeys[stage.key];
  const activeNode = chain.find((item) => item.key === activeKey) || chain[state.chainIndexes[stage.key] || 0] || null;
  const activeRecord = activeNode ? state.chainRecords[stage.key]?.[activeNode.key] || {} : {};
  const priorReasoning = chain
    .filter((item) => item.key !== activeNode?.key)
    .map((item) => {
      const record = state.chainRecords[stage.key]?.[item.key] || {};
      return {
        node: item.title,
        selection: selectedText(record.selected),
        reason: record.note || "",
        tool_result: record.tool || "",
      };
    })
    .filter((item) => item.selection || item.reason || item.tool_result);

  return {
    current_node: activeNode ? {
      key: activeNode.key,
      title: activeNode.title,
      question: activeNode.question,
      prompt_hint: activeNode.hint || "",
    } : null,
    student_selection: selectedText(activeRecord.selected) || "No option selected",
    student_reason: activeRecord.note || "No reason added",
    selected_tool: activeNode?.tool || activeRecord.tool || "None",
    selected_tool_result: [activeRecord.tool, activeRecord.toolScreening].filter(Boolean).join(" | ") || "No tool choice recorded",
    prior_reasoning: priorReasoning,
    stage_reasoning_summary: buildStageReasoningSummary(stage.key) || "No reasoning written yet.",
    project_goal: state.projectGoal,
    learning_content: state.learningContent,
    project_material: state.projectMaterial,
    task_name: state.selectedTaskName,
    stage_goal: stage.planStep?.detail || getStableStagePrompt(stage),
    support_boundaries: getActiveAllowBoundaries(),
    ...extra,
  };
}

function requestCoachComment(reasoningContext = {}) {
  // Reasoning nodes use requestCoachNote(), which attaches a quiet inline note.
  // This legacy entry intentionally does not open the global Coach conversation.
  void reasoningContext;
}

async function askCoach(message, userAction = "", reasoningContext = {}) {
  coachInput.value = "";
  state.coachDraftChoice = "";
  coachResponse.hidden = false;
  coachText.textContent = "Thinking...";
  coachQuestion.textContent = "";
  coachOptions.innerHTML = "";
  coachTurns.innerHTML = "";
  coachReplyInput.value = "";

  try {
    const response = await fetch(`${API_BASE}/api/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: currentStage().title,
        state,
        message,
        userAction,
        reasoningContext: Object.keys(reasoningContext).length ? reasoningContext : buildCurrentReasoningContext(),
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderCoach(data);
  } catch (error) {
    renderCoach({
      ...localCoachFallback(error),
      label: "Local fallback",
      coach: `Agent connection failed, so this is local fallback guidance. ${error.message || ""}`.trim(),
    });
  }
}

function renderCoach(data) {
  const stage = currentStage();
  state.lastAi = data;
  state.coachTurns[stage.key] = 1;
  const record = state.records[stage.key];
  record.label = data.label || stage.title;
  record.note = data.record_update || record.note || "";
  const showDecisionExtras = stageHasRole(stage, "validate") || stageHasRole(stage, "decision");
  record.missingEvidence = showDecisionExtras ? data.missing_evidence || [] : [];
  record.possiblePaths = stageHasRole(stage, "decision") ? data.possible_paths || [] : [];

  coachText.textContent = data.coach || "The agent did not return a coach comment for this reasoning step.";
  const nextCheck = data.next_check || data.question || "";
  coachQuestion.hidden = !nextCheck;
  coachQuestion.textContent = nextCheck ? `Next check: ${nextCheck}` : "";
  coachOptions.innerHTML = "";
  coachOptions.hidden = !(data.options?.length);
  renderCoachTurnProgress(stage.key);

  const options = data.options?.length ? data.options : [];
  options.slice(0, 4).forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.title = "Use this as your draft response";
    button.addEventListener("click", () => {
      state.coachDraftChoice = option;
      coachOptions.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button));
      coachReplyInput.value = data.rationale_hint || `I selected ${option} because `;
      coachReplyInput.focus();
    });
    coachOptions.appendChild(button);
  });

  if (showDecisionExtras && data.missing_evidence?.length) {
    const evidence = document.createElement("p");
    evidence.className = "coach-question";
    evidence.textContent = `Missing evidence: ${data.missing_evidence.join(", ")}`;
    coachOptions.before(evidence);
  }

  if (stageHasRole(stage, "decision") && data.possible_paths?.length) {
    const paths = document.createElement("p");
    paths.className = "coach-question";
    paths.textContent = `Possible paths: ${data.possible_paths.join(" / ")}`;
    coachOptions.before(paths);
  }

  renderStageOverview();
  renderPath();
  updateRationale();
}

function renderCoachTurnProgress(stageKey) {
  coachTurns.hidden = true;
  coachTurns.innerHTML = "";
}

function submitCoachReply() {
  const stage = currentStage();
  const record = state.records[stage.key];
  const reply = coachReplyInput.value.trim();
  const choice = state.coachDraftChoice || record.selected || "";
  if (reply || choice) {
    record.selected = choice || record.selected || "Student note";
    record.note = reply || record.note || choice;
    state.userActions.push({
      stage: stage.title,
      option: record.selected,
      reply: record.note,
      turn: 1,
      time: new Date().toISOString(),
    });
  }
  updateRationale();
  state.coachDraftChoice = "";
  coachResponse.hidden = true;
  render();
}

function updateRationale() {
  const lines = [];
  if (state.uploadedFileName) lines.push(`Uploaded file: ${state.uploadedFileName}`);
  if (state.projectMaterial) lines.push(`Project material / context: ${state.projectMaterial}`);
  lines.push(`Project goal: ${state.projectGoal || ""}`);
  lines.push(`Learning content / AI output: ${state.learningContent || ""}`);
  if (selectedLearningTypes().length) lines.push(`Learning content type: ${selectedLearningTypes().join(", ")}`);
  for (const stage of stages) {
    const record = state.records[stage.key];
    const chainSummary = buildStageReasoningSummary(stage.key);
    const selected = record.selected ? ` | Student action: ${record.selected}` : "";
    const note = chainSummary || record.note ? ` | Reasoning: ${chainSummary || record.note}` : "";
    if (selected || note) lines.push(`${stage.title}:${selected}${note}`);
  }
  const practiceStage = findLastStageByRole("practice");
  const validateStage = findLastStageByRole("validate");
  const reasoningStage = findLastStageByRole("reasoning");
  const decisionStage = findLastStageByRole("decision") || stages[stages.length - 1];
  const finalLearning = buildStageReasoningSummary(practiceStage?.key) || buildStageReasoningSummary(validateStage?.key) || buildStageReasoningSummary(reasoningStage?.key);
  const finalDecisionReasoning = buildStageReasoningSummary(decisionStage?.key);
  const knowledgeUpdate = buildKnowledgeMapUpdateSummary();
  if (finalLearning) lines.push(`What the student learned/completed: ${finalLearning}`);
  if (knowledgeUpdate) lines.push(`Knowledge map update: ${knowledgeUpdate}`);
  if (finalDecisionReasoning) lines.push(`Reasoned next action: ${finalDecisionReasoning}`);
  if (decisionStage && state.records[decisionStage.key]?.selected) {
    lines.push(`Student decision: ${state.records[decisionStage.key].selected}`);
  } else {
    lines.push("Student decision: pending confirmation, revision or rejection.");
  }
  lines.push("Boundary: This record distinguishes AI suggestions from the student's final decision.");
  rationaleText.value = lines.join("\n");
}

function buildKnowledgeMapUpdateSummary() {
  const summaries = stages
    .filter((stage) => ["knowledge", "resource", "debug", "complete", "practice"].includes(stage.role))
    .map((stage) => {
      const summary = buildStageReasoningSummary(stage.key);
      return summary ? `${stage.title}: ${summary}` : "";
    })
    .filter(Boolean);
  return summaries.slice(0, 4).join(" | ");
}

function getDecisionStage() {
  return findLastStageByRole("decision") || stages[stages.length - 1] || null;
}

function decisionChoicesForStage(stage) {
  const currentChain = stage ? stageReasoningChains[stage.key] || [] : [];
  const allChains = [...currentChain, ...stages.flatMap((candidateStage) => stageReasoningChains[candidateStage.key] || [])];
  const choiceNode = allChains.find((item) => /choice|decision|next action|commit|route/i.test(`${item.key} ${item.title}`));
  const choices = choiceNode?.options || ["Apply this route", "Test first", "Seek more evidence", "Adjust the route"];
  return [...new Set(choices)].slice(0, 4);
}

function getStudentReasoningEntries() {
  return stages.flatMap((stage) => {
    const chain = stageReasoningChains[stage.key] || [];
    const records = state.chainRecords[stage.key] || {};
    return chain.map((item) => {
      const record = records[item.key] || {};
      if (!record.saved || (!selectedText(record.selected) && !record.note && !record.tool)) return null;
      return {
        milestone: getStageDisplayTitle(stage),
        title: item.title,
        choice: selectedText(record.selected) || record.tool || "",
        note: record.note || "",
        evidence: record.toolScreening || "",
      };
    }).filter(Boolean);
  });
}

function getLatestStudentChoice() {
  const entries = getStudentReasoningEntries();
  return entries.slice().reverse().find((entry) => entry.choice) || null;
}

function buildDecisionEvidence() {
  return stages
    .map((stage) => {
      const summary = buildStageReasoningSummary(stage.key);
      if (!summary) return null;
      return { title: getStageDisplayTitle(stage), summary };
    })
    .filter(Boolean)
    .slice(-4);
}

function renderDecisionCheck() {
  const check = state.decisionCheck;
  if (!check || check.loading) {
    resultDecisionCheck.innerHTML = `<div class="decision-check-loading">Preparing the relevant evidence, constraint and risk checks...</div>`;
    return;
  }
  const labels = { evidence: "Evidence", constraint: "Constraint", risk: "Risk" };
  resultDecisionCheck.innerHTML = ["evidence", "constraint", "risk"].map((key) => {
    const item = check[key] || {};
    const selected = check.selections?.[key] || "";
    const options = Array.isArray(item.options) && item.options.length ? item.options.slice(0, 2) : ["Ready", "Needs attention"];
    const summary = item.summary || "No project-specific check is available yet.";
    return `<section class="decision-check-card ${item.status || ""}">
      <div><span>${labels[key]}</span><p title="${escapeHtml(summary)}">${escapeHtml(shorten(summary, 92))}</p></div>
      <div class="decision-check-options">${options.map((option) => `<button type="button" class="${selected === option ? "selected" : ""}" data-decision-check="${key}" data-decision-check-value="${escapeHtml(option)}" aria-pressed="${selected === option}">${escapeHtml(option)}</button>`).join("")}</div>
    </section>`;
  }).join("");
}

function decisionCheckPayload() {
  return {
    project_goal: state.projectGoal,
    learning_content: state.learningContent,
    task_name: state.selectedTaskName,
    decision_stage: getStageDisplayTitle(getDecisionStage()),
    thinking_records: getStudentReasoningEntries().slice(-8).map((entry) => ({
      milestone: entry.milestone,
      item: entry.title,
      choice: entry.choice,
      note: entry.note,
    })),
    doing_records: getTaskDoingEntries().map((entry) => ({
      milestone: entry.title,
      status: entry.status,
      completed_checks: entry.checks,
      total_checks: entry.totalChecks,
      evidence: entry.uploads,
    })),
  };
}

async function generateDecisionCheck() {
  try {
    const response = await fetch(`${API_BASE}/api/decision-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(decisionCheckPayload()),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.decisionCheck = { ...(await response.json()), loading: false, selections: {} };
  } catch {
    state.decisionCheck = {
      loading: false,
      selections: {},
      evidence: { status: "missing", summary: "Save one result from the current build before committing further.", options: ["Evidence saved", "Need evidence"] },
      constraint: { status: "attention", summary: "Check that the next move fits the materials, time and current build scope.", options: ["Manageable", "Needs adaptation"] },
      risk: { status: "attention", summary: "Keep the next test small enough to reverse or revise safely.", options: ["Low for this test", "Mitigate first"] },
    };
  }
  renderDecisionRecord();
}

function renderDecisionRecord() {
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  const record = state.records[decisionStage.key] || (state.records[decisionStage.key] = { selected: "", note: "" });
  const decisionSummary = buildStageReasoningSummary(decisionStage.key);
  const inferredChoice = getLatestStudentChoice();
  const selected = record.selected || inferredChoice?.choice || getStageDisplayTitle(decisionStage);
  record.selected ||= selected;
  record.note ||= decisionSummary;
  resultOutcomeTitle.textContent = state.selectedTaskName || getStageDisplayTitle(decisionStage);
  resultOutcomeLabel.textContent = record.generatedConclusion ? "Task conclusion" : "Task outcome";
  resultNextLabel.textContent = record.generatedConclusion ? "Next session" : "Choose next action";
  resultOutcomeSummary.textContent = record.outcomeSummary || selected;
  resultSaveButton.dataset.resultAction = record.generatedConclusion ? "create-next-task" : "save-task";
  resultSaveButton.textContent = record.generatedConclusion ? "Create next task" : "Save & generate";
  resultSaveButton.disabled = !record.generatedConclusion && !record.nextAction;

  renderNextSessionGuidance();
  if (!state.taskRecordGuidance) queueMicrotask(() => generateTaskRecordGuidance());
  renderRecordAiEditor();
}

function nextSessionActionIcon(type = "") {
  const normalized = String(type).toLowerCase();
  if (normalized.includes("test") || normalized.includes("check")) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 12 3 3 7-7"/><circle cx="12" cy="12" r="8"/></svg>`;
  }
  if (normalized.includes("review") || normalized.includes("decide")) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h12v14H6z"/><path d="M9 9h6M9 13h4"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18 16 7l2 2L7 20H5z"/><path d="m14 7 2-2 3 3-2 2"/></svg>`;
}

function renderNextSessionGuidance() {
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  const record = state.records[decisionStage.key] || (state.records[decisionStage.key] = {});
  const guidance = state.taskRecordGuidance;
  const loading = Boolean(guidance?.loading);
  resultGuidanceButton.disabled = loading;
  resultGuidanceButton.classList.toggle("loading", loading);
  resultGuidanceButton.setAttribute("aria-label", loading ? "Regenerating next-action options" : "Regenerate next-action options");
  resultGuidanceButton.title = loading ? "Regenerating next-action options" : "Regenerate next-action options";

  if (loading) {
    resultNextSummary.innerHTML = `<div class="result-next-progress loading"><i></i><div><strong></strong><span></span></div></div>`;
    resultNextSummary.title = "Building next-session suggestions from the saved outcome and project evidence.";
    resultNextOptions.innerHTML = Array.from({ length: 2 }, () => `
      <div class="result-next-option loading"><i></i><div><strong></strong><p></p></div></div>
    `).join("");
    resultNextBoundaries.hidden = true;
  } else if (guidance) {
    const recordData = taskRecordData();
    const completed = recordData.milestones.filter((item) => item.status === "Completed").length;
    const total = Math.max(1, recordData.milestones.length);
    const active = recordData.milestones.find((item) => item.status !== "Completed");
    const progress = Math.round((completed / total) * 100);
    resultNextSummary.title = guidance.summary || "";
    resultNextSummary.innerHTML = `
      <div class="result-next-progress" style="--next-progress:${progress * 3.6}deg">
        <i><span><b>${completed}</b><small> / ${total}</small></span></i>
        <div><strong>${completed === total ? "Milestones complete" : "Continue from saved work"}</strong><span>${escapeHtml(active?.title || "Choose the next useful move")}</span></div>
      </div>
    `;
    resultNextOptions.innerHTML = (guidance.actions || []).map((action, index) => {
      const selected = record.nextAction === action.title;
      const reason = action.reason || "";
      return `
        <button class="result-next-option${selected ? " selected" : ""}" type="button" data-next-session-option="${index}" aria-pressed="${selected}" aria-label="${escapeHtml(`${action.type || "Next"}: ${action.title}. ${reason}`)}">
          <span class="result-next-type">${nextSessionActionIcon(action.type)}<small>${escapeHtml(action.type || "Next")}</small></span>
          <div><strong>${escapeHtml(action.title)}</strong></div>
          <span class="result-next-choice" title="${escapeHtml(reason)}" aria-hidden="true">${selected ? "✓" : ""}</span>
        </button>
      `;
    }).join("");
    resultNextEvidence.textContent = shorten(guidance.evidence_to_capture || "", 72);
    resultNextEvidence.title = guidance.evidence_to_capture || "";
    resultNextRevisit.textContent = shorten(guidance.decision_to_revisit || "", 72);
    resultNextRevisit.title = guidance.decision_to_revisit || "";
    resultNextBoundaries.hidden = !(guidance.evidence_to_capture || guidance.decision_to_revisit);
  } else {
    resultNextSummary.innerHTML = "";
    resultNextSummary.title = "";
    resultNextOptions.innerHTML = "";
    resultNextBoundaries.hidden = true;
  }

  if (document.activeElement !== resultRationale) resultRationale.value = record.nextAction || "";
  updateRecordCoachRefineState();
}

function updateRecordCoachRefineState() {
  const hasAction = Boolean(resultRationale.value.trim());
  resultAiEditButton.disabled = !hasAction;
  resultAiEditButton.title = hasAction
    ? "Refine this next action with Coach"
    : "Choose a suggestion or write a next action first";
}

function toggleRecordAiEditor() {
  resultAiEditor.hidden = !resultAiEditor.hidden;
  resultAiEditButton.classList.toggle("active", !resultAiEditor.hidden);
  if (!resultAiEditor.hidden) {
    renderRecordAiEditor();
    setTimeout(() => resultAiInput.focus(), 80);
  }
}

function renderRecordAiEditor() {
  if (!resultAiMessages) return;
  const messages = Array.isArray(state.recordRefineChat) ? state.recordRefineChat : [];
  resultAiMessages.innerHTML = messages.map((entry) => `
    <div class="result-ai-message ${entry.role}">
      <span>${entry.role === "user" ? "You" : "Coach"}</span>
      <p>${escapeHtml(entry.text)}</p>
    </div>
  `).join("");
  resultAiMessages.hidden = !messages.length;
  resultAiApply.hidden = !state.recordRefineDraft;
  if (messages.length) resultAiMessages.scrollTop = resultAiMessages.scrollHeight;
}

async function sendRecordRefineRequest() {
  const request = resultAiInput.value.trim();
  if (!request || resultAiSend.disabled) return;
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  const record = state.records[decisionStage.key] || (state.records[decisionStage.key] = {});
  state.recordRefineChat = Array.isArray(state.recordRefineChat) ? state.recordRefineChat : [];
  state.recordRefineChat.push({ role: "user", text: request });
  resultAiInput.value = "";
  resultAiSend.disabled = true;
  resultAiSend.classList.add("loading");
  renderRecordAiEditor();
  try {
    const response = await fetch(`${API_BASE}/api/record-refine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...taskRecordAgentPayload(taskRecordData()),
        current_outcome: record.outcomeSummary || record.selected || getLatestStudentChoice()?.choice || "",
        current_next_action: record.nextAction || "",
        edit_request: request,
        conversation: state.recordRefineChat.slice(-6),
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const revision = await response.json();
    state.recordRefineDraft = revision;
    state.recordRefineChat.push({ role: "coach", text: revision.message || "I prepared a concise revision for you to review." });
  } catch {
    state.recordRefineDraft = null;
    state.recordRefineChat.push({ role: "coach", text: "I could not prepare the revision. Check the API connection and try again." });
  } finally {
    resultAiSend.disabled = false;
    resultAiSend.classList.remove("loading");
    renderRecordAiEditor();
  }
}

function applyRecordRefineDraft() {
  const draft = state.recordRefineDraft;
  const decisionStage = getDecisionStage();
  if (!draft || !decisionStage) return;
  const record = state.records[decisionStage.key] || (state.records[decisionStage.key] = {});
  if (draft.outcome) record.outcomeSummary = draft.outcome;
  if (draft.next_action) {
    record.nextAction = draft.next_action;
    if (state.taskRecordGuidance && !state.taskRecordGuidance.loading) {
      const currentActions = Array.isArray(state.taskRecordGuidance.actions) ? state.taskRecordGuidance.actions : [];
      state.taskRecordGuidance.actions = [
        { type: "Refined", title: draft.next_action, reason: "This action reflects the refinement you requested from Coach." },
        ...currentActions.filter((item) => item.title !== draft.next_action),
      ].slice(0, 3);
    }
  }
  state.recordRefineDraft = null;
  state.recordRefineChat.push({ role: "coach", text: "Revision applied to the task record." });
  resultSaveStatus.textContent = "Record revised. Save the task when it looks right.";
  renderDecisionRecord();
}

function refreshResultNextAction() {
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  const record = state.records[decisionStage.key] || (state.records[decisionStage.key] = {});
  const choice = record.selected || getLatestStudentChoice()?.choice || getStageDisplayTitle(decisionStage);
  record.nextAction = "";
  state.nextMoveGuidance = { choice, loading: true };
  resultGuidanceButton.disabled = true;
  resultGuidanceButton.textContent = "Working...";
  renderDecisionRecord();
  generateNextMoveGuidance(choice).finally(() => {
    resultGuidanceButton.disabled = false;
    resultGuidanceButton.textContent = "Refresh";
  });
}

function nextMovePayload(choice) {
  const decisionStage = getDecisionStage();
  return {
    project_goal: state.projectGoal,
    learning_content: state.learningContent,
    task_name: state.selectedTaskName,
    decision_stage: getStageDisplayTitle(decisionStage),
    selected_move: choice,
    decision_summary: buildStageReasoningSummary(decisionStage?.key),
    thinking_records: getStudentReasoningEntries().slice(-8).map((entry) => ({
      milestone: entry.milestone,
      item: entry.title,
      choice: entry.choice,
      note: entry.note,
    })),
    doing_records: getTaskDoingEntries().map((entry) => ({
      milestone: entry.title,
      status: entry.status,
      completed_checks: entry.checks,
      total_checks: entry.totalChecks,
      evidence: entry.uploads,
    })),
    decision_check: state.decisionCheck?.selections || {},
  };
}

async function generateNextMoveGuidance(choice) {
  try {
    const response = await fetch(`${API_BASE}/api/next-move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextMovePayload(choice)),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const guidance = await response.json();
    if (state.nextMoveGuidance?.choice !== choice) return;
    state.nextMoveGuidance = { choice, ...guidance, loading: false };
  } catch {
    if (state.nextMoveGuidance?.choice !== choice) return;
    state.nextMoveGuidance = {
      choice,
      loading: false,
      summary: `You selected “${choice}”. Use the reasoning and build checks you have already saved to make this route observable before adding more complexity.`,
      next_action: "Run one focused check and save what you observe.",
      missing_condition: "Confirm the current milestone has enough evidence to continue.",
    };
  }
  renderDecisionRecord();
}

function taskRecordData() {
  const decisionStage = getDecisionStage();
  const decisionRecord = decisionStage ? state.records[decisionStage.key] || {} : {};
  const materials = currentMaterialNames();
  const milestones = stages.map((stage) => {
    const summary = buildStageReasoningSummary(stage.key);
    const record = state.records[stage.key] || {};
    return {
      title: getStageDisplayTitle(stage),
      status: state.completedStages[stage.key] ? "Completed" : "In progress",
      output: record.note || summary || stage.goal || stage.purpose || "Milestone not yet recorded.",
    };
  });
  return {
    task: state.selectedTaskName || "Learning task",
    goal: state.projectGoal || "Project goal not yet recorded",
    learningFocus: state.learningContent || "Learning focus not yet recorded",
    scaffoldSettings: getSavedScaffoldSettings(),
    materials,
    milestones,
    doing: getTaskDoingEntries(),
    evidenceMedia: getTaskEvidenceMedia(),
    studentReasoning: getStudentReasoningEntries(),
    evidence: buildDecisionEvidence(),
    choice: decisionRecord.selected || getLatestStudentChoice()?.choice || "No final move recorded",
    outcome: decisionRecord.outcomeSummary || decisionRecord.selected || getLatestStudentChoice()?.choice || "No task outcome recorded",
    rationale: decisionRecord.note || "No additional final rationale recorded.",
    nextMoveSynthesis: state.nextMoveGuidance?.loading ? "" : state.nextMoveGuidance?.summary || "",
    nextMoveAction: decisionRecord.nextAction || (state.nextMoveGuidance?.loading ? "" : state.nextMoveGuidance?.next_action || ""),
    coachNotes: stages.flatMap((stage) => Object.values(state.chainRecords[stage.key] || {}))
      .filter((record) => record.coachNote?.coach_note)
      .map((record) => record.coachNote.coach_note)
      .slice(-4),
    knowledgeSummary: buildKnowledgeMapUpdateSummary(),
    nextSession: state.taskRecordGuidance,
  };
}

function getSavedScaffoldSettings() {
  const task = getActiveTaskRow();
  try {
    const saved = JSON.parse(task?.dataset.generatedPlan || "{}");
    return saved.scaffold_settings || scaffoldSettingsSnapshot();
  } catch {
    return scaffoldSettingsSnapshot();
  }
}

function getTaskDoingEntries() {
  return stages.map((stage) => {
    const record = state.records[stage.key] || {};
    const checks = stage.checklist || stage.planStep?.checklist || [];
    const checklistStatus = record.checklistStatus || {};
    const uploads = record.checklistUploads || {};
    const visualChecks = record.checklistVisualChecks || {};
    const completedChecks = checks.filter((check) => checklistStatus[check.id]);
    const uploadedNames = Object.values(uploads).map((item) => item?.name).filter(Boolean);
    if (!isDoingStage(stage) && !completedChecks.length && !uploadedNames.length) return null;
    return {
      title: getStageDisplayTitle(stage),
      status: state.completedStages[stage.key] ? "Completed" : "In progress",
      checks: completedChecks.map((check) => check.text),
      checkLog: checks.map((check) => ({
        text: check.text,
        purpose: check.hint || "Check whether this build step is physically ready to continue.",
        checked: Boolean(checklistStatus[check.id]),
        upload: uploads[check.id]?.name || "",
        visualStatus: visualChecks[check.id]?.status || "",
        observation: visualChecks[check.id]?.observation || "",
        issue: visualChecks[check.id]?.issue || "",
        suggestedAction: visualChecks[check.id]?.suggested_action || "",
      })).filter((item) => item.checked || item.upload || item.visualStatus),
      totalChecks: checks.length,
      uploads: uploadedNames,
      note: record.note || "",
    };
  }).filter(Boolean);
}

function getTaskEvidenceMedia() {
  return stages.flatMap((stage) => {
    const record = state.records[stage.key] || {};
    const checks = stage.checklist || stage.planStep?.checklist || [];
    return Object.entries(record.checklistUploads || {}).map(([checkId, upload]) => {
      if (!upload?.name) return null;
      const check = checks.find((item) => String(item.id) === String(checkId));
      const visual = record.checklistVisualChecks?.[checkId] || {};
      return {
        milestone: getStageDisplayTitle(stage),
        check: check?.text || "Build evidence",
        purpose: check?.hint || "Verify this build step before moving on.",
        name: upload.name,
        dataUrl: upload.dataUrl || "",
        status: visual.status || (record.checklistStatus?.[checkId] ? "checked" : "saved"),
        observation: visual.observation || "",
        issue: visual.issue || "",
        suggestedAction: visual.suggested_action || "",
      };
    }).filter(Boolean);
  }).slice(0, 8);
}

function taskRecordAgentPayload(data) {
  return {
    task: data.task,
    goal: data.goal,
    learning_focus: data.learningFocus,
    scaffold_settings: data.scaffoldSettings,
    milestones: data.milestones,
    student_work: data.doing,
    student_reasoning: data.studentReasoning,
    student_decision: { choice: data.choice, rationale: data.rationale },
    evidence: data.evidence,
    evidence_media: data.evidenceMedia.map((item) => ({
      milestone: item.milestone,
      check: item.check,
      filename: item.name,
      status: item.status,
      observation: item.observation,
      issue: item.issue,
      suggested_action: item.suggestedAction,
      check_purpose: item.purpose,
    })),
    coach_notes: data.coachNotes,
    selected_next_action: data.nextMoveAction,
  };
}

function renderTaskRecordPreview() {
  const data = taskRecordData();
  resultTaskPreview.innerHTML = buildTaskRecordMarkup(data);
}

function buildTaskRecordMarkup(data) {
  const materials = data.materials.length ? data.materials.map((material) => `<span>${escapeHtml(material)}</span>`).join("") : `<span>None recorded</span>`;
  const milestones = data.milestones.length ? data.milestones.map((milestone, index) => `
    <li>
      <i>${index + 1}</i>
      <div><strong>${escapeHtml(milestone.title)}</strong><small>${escapeHtml(milestone.status)}</small></div>
      <p>${escapeHtml(shorten(milestone.output, 120))}</p>
    </li>
  `).join("") : `<li class="record-empty">No milestones recorded.</li>`;
  const reasoning = data.studentReasoning.length
    ? `<ol class="record-entry-list">${data.studentReasoning.map((entry) => `
      <li>
        <span class="record-source student">Student reasoning</span>
        <strong>${escapeHtml(entry.milestone)} · ${escapeHtml(entry.title)}</strong>
        <p>${escapeHtml([entry.choice, entry.note].filter(Boolean).join(". ") || "Saved reasoning entry.")}</p>
      </li>
    `).join("")}</ol>`
    : `<p class="record-empty">No saved reasoning yet.</p>`;
  const evidence = data.evidence.length
    ? `<ul class="record-evidence-list">${data.evidence.map((entry) => `<li><span>Evidence</span><p><strong>${escapeHtml(entry.title)}</strong>${escapeHtml(entry.summary)}</p></li>`).join("")}</ul>`
    : `<p class="record-empty">No saved evidence yet.</p>`;
  const doing = data.doing.length
    ? `<ul class="record-doing-list">${data.doing.map((entry) => `
      <li>
        <div><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.status)}</small></div>
        <p>${entry.checks.length ? `${entry.checks.length}${entry.totalChecks ? ` / ${entry.totalChecks}` : ""} checks completed` : "Build record in progress"}${entry.uploads.length ? ` · ${entry.uploads.length} photo${entry.uploads.length === 1 ? "" : "s"} added` : ""}</p>
        ${entry.checks.length ? `<span>${escapeHtml(entry.checks.slice(0, 2).join(" · "))}</span>` : ""}
        ${entry.checkLog?.length ? `<div class="record-check-log">${entry.checkLog.slice(0, 4).map((item) => `
          <div>
            <strong>${escapeHtml(item.text)}</strong>
            <small>${escapeHtml(item.checked ? "Completed" : item.visualStatus || "Recorded")}${item.upload ? ` · ${escapeHtml(item.upload)}` : ""}</small>
            ${item.observation ? `<p>${escapeHtml(item.observation)}</p>` : ""}
            ${item.issue || item.suggestedAction ? `<em>${escapeHtml([item.issue, item.suggestedAction].filter(Boolean).join(" · "))}</em>` : ""}
          </div>
        `).join("")}</div>` : ""}
      </li>
    `).join("")}</ul>`
    : `<p class="record-empty">No build or test activity saved yet.</p>`;
  const evidenceMedia = data.evidenceMedia.length
    ? `<div class="record-evidence-media">${data.evidenceMedia.map((item) => `
      <figure>
        ${item.dataUrl ? `<img src="${escapeHtml(item.dataUrl)}" alt="${escapeHtml(item.name)}" />` : `<div class="record-evidence-file" aria-hidden="true">⌁</div>`}
        <figcaption>
          <strong>${escapeHtml(item.check)}</strong>
          <span>${escapeHtml(item.name)}</span>
          <small>${escapeHtml(item.status === "pass" ? "Photo check passed" : item.status === "needs_attention" ? "Needs review" : item.status === "unclear" ? "Could not confirm" : "Student evidence")}</small>
          ${item.observation ? `<p>${escapeHtml(item.observation)}</p>` : ""}
          ${item.suggestedAction ? `<em>Next check: ${escapeHtml(item.suggestedAction)}</em>` : ""}
        </figcaption>
      </figure>
    `).join("")}</div>`
    : `<p class="record-empty">No photos or screenshots were saved for this task.</p>`;
  const nextSession = data.nextSession?.loading
    ? `<section class="record-document-section record-next-session"><div class="record-section-heading"><span class="record-source coach">AI scaffold</span><strong>Next session</strong></div><p class="record-empty">Building a next-session plan from the saved task evidence...</p></section>`
    : data.nextSession
      ? `<section class="record-document-section record-next-session"><div class="record-section-heading"><span class="record-source coach">AI scaffold</span><strong>Next session</strong></div><p>${escapeHtml(data.nextSession.summary)}</p><ol class="record-next-actions">${(data.nextSession.actions || []).map((item) => `<li><span>${escapeHtml(item.type || "Next")}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.reason)}</p></li>`).join("")}</ol>${data.nextSession.evidence_to_capture ? `<div class="record-capture"><strong>Capture next</strong><span>${escapeHtml(data.nextSession.evidence_to_capture)}</span></div>` : ""}${data.nextSession.decision_to_revisit ? `<div class="record-revisit"><strong>Revisit only if</strong><span>${escapeHtml(data.nextSession.decision_to_revisit)}</span></div>` : ""}</section>`
      : "";
  const coachNotes = data.coachNotes.length
    ? `<section class="record-document-section ai-support"><div class="record-section-heading"><span class="record-source coach">AI scaffold</span><strong>Coach notes consulted</strong></div><ul class="record-coach-list">${data.coachNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul></section>`
    : "";

  return `
    <article class="record-document" aria-label="Task learning record preview">
      <header class="record-document-head">
        <div><span>Task learning record</span><h3>${escapeHtml(data.task)}</h3></div>
        <div class="record-source-key"><i class="student"></i> Student <i class="coach"></i> AI scaffold</div>
      </header>
      <section class="record-document-section record-project">
        <div class="record-section-heading"><span class="record-source project">Project content</span><strong>Project snapshot</strong></div>
        <dl class="record-project-grid"><div><dt>Goal</dt><dd>${escapeHtml(data.goal)}</dd></div><div><dt>Learning focus</dt><dd>${escapeHtml(data.learningFocus)}</dd></div></dl>
        <div class="record-materials"><span>Scaffold: ${escapeHtml(data.scaffoldSettings?.label || "Standard · Applied · Balanced")}</span></div>
        <div class="record-materials">${materials}</div>
      </section>
      <section class="record-document-section"><div class="record-section-heading"><span class="record-source project">Project path</span><strong>Milestone outcomes</strong></div><ol class="record-milestones">${milestones}</ol></section>
      <section class="record-document-section"><div class="record-section-heading"><span class="record-source student">Student work</span><strong>Build and test log</strong></div>${doing}</section>
      <section class="record-document-section"><div class="record-section-heading"><span class="record-source student">Student evidence</span><strong>Saved prototype evidence</strong></div>${evidenceMedia}</section>
      <section class="record-document-section"><div class="record-section-heading"><span class="record-source student">Student reasoning</span><strong>Reasoning trail</strong></div>${reasoning}</section>
      <section class="record-document-section decision"><div class="record-section-heading"><span class="record-source decision">Student-owned result</span><strong>Outcome and continuation</strong></div><p class="record-decision-choice">${escapeHtml(data.outcome)}</p>${data.nextMoveAction ? `<div class="record-next-move-synthesis"><span class="record-source coach">Next action</span><small>${escapeHtml(data.nextMoveAction)}</small></div>` : ""}</section>
      <section class="record-document-section"><div class="record-section-heading"><span class="record-source evidence">Project evidence</span><strong>Learning trail</strong></div>${evidence}</section>
      ${data.knowledgeSummary ? `<section class="record-document-section"><div class="record-section-heading"><span class="record-source project">Knowledge map</span><strong>Learning added</strong></div><p>${escapeHtml(data.knowledgeSummary)}</p></section>` : ""}
      ${nextSession}
      ${coachNotes}
    </article>
  `;
}

async function generateTaskRecordGuidance({ finalise = false } = {}) {
  if (state.taskRecordGuidance?.loading) return;
  const data = taskRecordData();
  state.taskRecordGuidance = { loading: true };
  renderNextSessionGuidance();
  try {
    const response = await fetch(`${API_BASE}/api/task-record-guidance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskRecordAgentPayload(data), finalise_record: finalise }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.taskRecordGuidance = await response.json();
    if (finalise) {
      const decisionStage = getDecisionStage();
      const record = decisionStage ? state.records[decisionStage.key] || (state.records[decisionStage.key] = {}) : null;
      if (record && state.taskRecordGuidance.conclusion) {
        record.outcomeSummary = state.taskRecordGuidance.conclusion;
        record.generatedConclusion = true;
      }
    }
    resultSaveStatus.textContent = finalise
      ? "Conclusion and next-session recommendations generated."
      : "Next-session suggestions updated from the saved task record.";
    return true;
  } catch (error) {
    state.taskRecordGuidance = {
      conclusion: data.outcome || "The saved record captures the current project outcome and the next action selected by the student.",
      summary: "Use the saved record to continue from the last verified milestone.",
      actions: [{ type: "Continue", title: "Run the next smallest test", reason: "Use the unfinished checklist and your saved evidence to choose one observable check." }],
      evidence_to_capture: "Save a photo, screenshot or measurement from the next test.",
      decision_to_revisit: "Revisit your route only when new test evidence conflicts with it.",
    };
    if (finalise) {
      const decisionStage = getDecisionStage();
      const record = decisionStage ? state.records[decisionStage.key] || (state.records[decisionStage.key] = {}) : null;
      if (record) {
        record.outcomeSummary = state.taskRecordGuidance.conclusion;
        record.generatedConclusion = true;
      }
    }
    resultSaveStatus.textContent = "The AI plan was unavailable, so a cautious next-session plan was created from your saved work.";
    return false;
  } finally {
    renderNextSessionGuidance();
    if (!resultPreviewWrap.hidden) renderTaskRecordPreview();
  }
}

function toggleTaskRecordPreview() {
  const showing = resultPreviewWrap.hidden;
  resultPreviewWrap.hidden = !showing;
  updateTaskRecordPreviewButton(showing);
  resultPreviewButton.classList.remove("attention");
  document.body.classList.toggle("record-preview-open", showing);
  if (showing) {
    renderTaskRecordPreview();
    resultPreviewClose.focus();
  }
}

function closeTaskRecordPreview() {
  resultPreviewWrap.hidden = true;
  document.body.classList.remove("record-preview-open");
  updateTaskRecordPreviewButton(false);
  resultPreviewButton.focus();
}

function updateTaskRecordPreviewButton(showing) {
  const action = showing ? "Close task record preview" : "Preview the complete task record";
  resultPreviewButton.setAttribute("aria-expanded", String(showing));
  resultPreviewButton.setAttribute("title", action);
  resultPreviewButton.setAttribute("aria-label", action);
}

function exportTaskRecord() {
  const data = taskRecordData();
  const projectMaterials = data.materials.length ? data.materials.map(escapeHtml).join(" · ") : "None recorded";
  const milestoneRows = data.milestones.map((milestone, index) => `<div class="entry"><span class="tag project">Milestone ${index + 1} · ${escapeHtml(milestone.status)}</span><strong>${escapeHtml(milestone.title)}</strong><p>${escapeHtml(milestone.output)}</p></div>`).join("");
  const doingRows = data.doing.length ? data.doing.map((entry) => `<div class="entry"><span class="tag">Student work · ${escapeHtml(entry.status)}</span><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.checks.length ? `${entry.checks.length}${entry.totalChecks ? ` / ${entry.totalChecks}` : ""} checks completed: ${entry.checks.join(" · ")}` : "Build record in progress.")}</p>${entry.uploads.length ? `<p class="muted">Photo evidence: ${escapeHtml(entry.uploads.join(" · "))}</p>` : ""}${entry.checkLog?.length ? entry.checkLog.map((item) => `<div class="subentry"><b>${escapeHtml(item.text)}</b><p><span class="muted">Check purpose:</span> ${escapeHtml(item.purpose)}</p><p><span class="muted">Status:</span> ${escapeHtml(item.checked ? "Completed" : item.visualStatus || "Recorded")}${item.upload ? ` · ${escapeHtml(item.upload)}` : ""}</p>${item.observation ? `<p><span class="muted">AI check:</span> ${escapeHtml(item.observation)}</p>` : ""}${item.issue || item.suggestedAction ? `<p><span class="muted">Next action:</span> ${escapeHtml([item.issue, item.suggestedAction].filter(Boolean).join(" · "))}</p>` : ""}</div>`).join("") : ""}</div>`).join("") : "<p class=\"muted\">No build or test activity saved yet.</p>";
  const evidenceMedia = data.evidenceMedia.length ? data.evidenceMedia.map((item) => `<div class="evidence-media">${item.dataUrl ? `<img src="${escapeHtml(item.dataUrl)}" alt="${escapeHtml(item.name)}">` : ""}<div><strong>${escapeHtml(item.check)}</strong><p>${escapeHtml(item.name)} · ${escapeHtml(item.status === "pass" ? "Photo check passed" : item.status === "needs_attention" ? "Needs review" : item.status === "unclear" ? "Could not confirm" : "Student evidence")}</p>${item.observation ? `<p>${escapeHtml(item.observation)}</p>` : ""}${item.suggestedAction ? `<p><b>Next check:</b> ${escapeHtml(item.suggestedAction)}</p>` : ""}</div></div>`).join("") : "<p class=\"muted\">No photos or screenshots were saved for this task.</p>";
  const nextSession = data.nextSession && !data.nextSession.loading ? `<h2>AI scaffold: next session</h2><div class="entry"><span class="tag ai">AI scaffold</span><strong>${escapeHtml(data.nextSession.summary || "Next-session plan")}</strong>${(data.nextSession.actions || []).map((item, index) => `<p><b>${index + 1}. ${escapeHtml(item.title)}</b> — ${escapeHtml(item.reason)}</p>`).join("")}${data.nextSession.evidence_to_capture ? `<p><b>Capture next:</b> ${escapeHtml(data.nextSession.evidence_to_capture)}</p>` : ""}${data.nextSession.decision_to_revisit ? `<p><b>Revisit only if:</b> ${escapeHtml(data.nextSession.decision_to_revisit)}</p>` : ""}</div>` : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.task)} - Task learning record</title><style>
    body{max-width:760px;margin:42px auto;color:#1d2330;font:15px/1.55 Arial,sans-serif}h1{margin:0 0 4px;font-size:28px}h2{margin:26px 0 8px;font-size:17px}.kicker{color:#5144cf;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.project{padding:16px;border-left:4px solid #6558f5;background:#f5f3ff}.project p{margin:5px 0}.entry{margin:10px 0;padding:12px 14px;border:1px solid #e1e5ee;border-radius:10px}.subentry{margin:8px 0 0;padding:9px 10px;border-radius:8px;background:#f7f8fb}.tag{display:inline-block;margin:0 0 6px;padding:3px 7px;border-radius:999px;background:#f1eeff;color:#4d42d1;font-size:10px;font-weight:700}.tag.ai{background:#eef0f5;color:#596579}.tag.decision{background:#eceaff;color:#4437c8}.tag.evidence{background:#f5f6f9;color:#586477}.tag.project{background:#f3f4f8;color:#586477}p{margin:5px 0}.muted{color:#6f7787;font-size:13px}.evidence-media{display:flex;gap:12px;align-items:center;margin:10px 0;padding:10px;border:1px solid #e1e5ee;border-radius:10px}.evidence-media img{width:120px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #e7e9f0}.evidence-media p{margin:3px 0;color:#6f7787}</style></head><body>
    <div class="kicker">Task learning record</div><h1>${escapeHtml(data.task)}</h1><p class="muted">Source labels distinguish student work from AI scaffold support.</p>
    <div class="project"><strong>Project content</strong><p><b>Goal:</b> ${escapeHtml(data.goal)}</p><p><b>Learning focus:</b> ${escapeHtml(data.learningFocus)}</p><p><b>Scaffold settings:</b> ${escapeHtml(data.scaffoldSettings?.label || "Standard · Applied · Balanced")}</p><p><b>Materials:</b> ${projectMaterials}</p></div>
    <h2>Project milestones</h2>${milestoneRows}
    <h2>Student build and test log</h2>${doingRows}
    <h2>Student prototype evidence</h2>${evidenceMedia}
    <h2>Student reasoning</h2>${data.studentReasoning.length ? data.studentReasoning.map((entry) => `<div class="entry"><span class="tag">Student reasoning</span><strong>${escapeHtml(entry.milestone)} · ${escapeHtml(entry.title)}</strong><p>${escapeHtml([entry.choice, entry.note].filter(Boolean).join(". ") || "Saved reasoning entry.")}</p></div>`).join("") : "<p class=\"muted\">No saved reasoning yet.</p>"}
    <h2>Student-owned result</h2><div class="entry"><span class="tag decision">Task outcome</span><strong>${escapeHtml(data.outcome)}</strong>${data.nextMoveAction ? `<div class="subentry"><span class="tag ai">Next action</span><p>${escapeHtml(data.nextMoveAction)}</p></div>` : ""}</div>
    <h2>Project evidence</h2>${data.evidence.length ? data.evidence.map((entry) => `<div class="entry"><span class="tag evidence">Project evidence</span><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.summary)}</p></div>`).join("") : "<p class=\"muted\">No saved evidence yet.</p>"}
    ${data.coachNotes.length ? `<h2>AI scaffold support</h2>${data.coachNotes.map((note) => `<div class="entry"><span class="tag ai">AI scaffold</span><p>${escapeHtml(note)}</p></div>`).join("")}` : ""}
    ${data.knowledgeSummary ? `<h2>Knowledge map update</h2><div class="entry"><span class="tag project">Learning added</span><p>${escapeHtml(data.knowledgeSummary)}</p></div>` : ""}
    ${nextSession}
    ${data.materials.length ? `<h2>Project materials</h2><p class="muted">${data.materials.map(escapeHtml).join(" · ")}</p>` : ""}
  </body></html>`;
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${String(data.task).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "task"}-learning-record.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  resultSaveStatus.textContent = "Document downloaded. Student reasoning, decisions and AI scaffold support are labelled separately.";
}

function openDecisionLogic() {
  const decisionStage = getDecisionStage();
  const index = decisionStage ? stages.findIndex((stage) => stage.key === decisionStage.key) : -1;
  currentStageIndex = index >= 0 ? index : Math.max(0, stages.length - 1);
  setView("flow");
  render();
}

async function saveDecisionRecord() {
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  const record = state.records[decisionStage.key] || (state.records[decisionStage.key] = {});
  record.selected ||= getLatestStudentChoice()?.choice || getStageDisplayTitle(decisionStage);
  record.note ||= buildStageReasoningSummary(decisionStage.key);
  record.nextAction = resultRationale.value.trim();
  if (!record.nextAction) {
    resultSaveStatus.textContent = "Choose one next action before saving.";
    return;
  }
  state.completedStages[decisionStage.key] = true;
  resultSaveButton.disabled = true;
  resultSaveButton.textContent = "Generating conclusion...";
  resultSaveStatus.textContent = "Creating the task conclusion and next-session recommendations...";
  await generateTaskRecordGuidance({ finalise: true });
  updateKnowledgeFromStage(decisionStage, "verified", `Decision saved: ${record.selected}`);
  updateRationale();
  updateTaskStatus(getActiveTaskRow(), "Completed");
  persistTaskProgress(getActiveTaskRow(), { finished: true });
  resultSaveButton.textContent = "Saved";
  resultSaveStatus.textContent = "Task saved. Conclusion, recommendations and Knowledge Map are updated.";
  renderDecisionRecord();
}

async function createNextTaskFromRecord() {
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  const record = state.records[decisionStage.key] || {};
  const guidance = state.taskRecordGuidance || {};
  const nextAction = String(record.nextAction || guidance.actions?.[0]?.title || "Continue the project").trim();
  if (!nextAction) {
    resultSaveStatus.textContent = "Choose a next action before creating the next task.";
    return;
  }

  const previousGoal = state.projectGoal;
  const previousTypes = Array.isArray(state.learningType) && state.learningType.length
    ? [...state.learningType]
    : ["Concept", "Method", "Tool step"];
  const contextParts = [
    `Previous task conclusion: ${record.outcomeSummary || record.selected || "The previous task was completed."}`,
    `Next task: ${nextAction}`,
    guidance.evidence_to_capture ? `Evidence to capture: ${guidance.evidence_to_capture}` : "",
    guidance.decision_to_revisit ? `Revisit this decision if: ${guidance.decision_to_revisit}` : "",
  ].filter(Boolean);
  const taskName = shorten(nextAction.replace(/[.!?]+$/g, ""), 48);

  resultSaveButton.disabled = true;
  resultSaveButton.textContent = "Creating task...";
  resultSaveStatus.textContent = "Creating the next task from the saved conclusion and selected action...";
  const taskRow = createTaskForActiveProject({
    taskName,
    projectGoal: previousGoal,
    learningContent: contextParts.join("\n"),
    learningType: previousTypes,
    skipRename: true,
  });
  if (!taskRow) {
    resultSaveButton.disabled = false;
    resultSaveButton.textContent = "Create next task";
    resultSaveStatus.textContent = "The next task could not be created.";
    return;
  }
  updateTaskStatus(taskRow, "Generating plan");
  await generateAndRenderPlan();
}

function showFinalDecisionResult() {
  const decisionStage = getDecisionStage();
  if (!decisionStage) return;
  const decisionSummary = buildStageReasoningSummary(decisionStage.key);
  state.records[decisionStage.key].note = decisionSummary || state.records[decisionStage.key].note;
  updateTaskStatus(getActiveTaskRow(), "Completed");
  persistTaskProgress(getActiveTaskRow(), { finished: true });
  setView("result");
  resultSaveStatus.textContent = "";
}

function localCoachFallback() {
  const stage = currentStage();
  const decisionStage = stageHasRole(stage, "decision");
  const validateStage = stageHasRole(stage, "validate");
  return {
    label: stage.title,
    stage: stage.title,
    coach: "This step has made one part of your reasoning visible. Keep the next move tied to your project goal, evidence and constraints.",
    question: decisionStage ? "Which path do you want to choose, revise or evidence before acting?" : "What would make this step clearer for your project?",
    options: ["Confirm current judgment", "Revise the assumption", "Seek more evidence"],
    rationale_hint: "My reasoning is...",
    missing_evidence: validateStage || decisionStage ? ["small test or external source"] : [],
    possible_paths: decisionStage ? ["test first", "revise direction"] : [],
    record_update: "Student needs to confirm, revise or reject the current AI-supported judgment.",
  };
}

function createProjectFile(projectNameOverride = "", options = {}) {
  const projectName = projectNameOverride || nextProjectName();
  state.projectMaterial = "";
  state.uploadedFileName = "";
  clearSetupInputsForNewTask();
  resetGeneratedPlanState();
  projectDetail.hidden = false;
  const safeName = escapeHtml(projectName);
  const taskListId = `taskList-${Date.now()}`;
  const projectFile = document.createElement("div");
  projectFile.className = "project-file just-created";
  projectFile.setAttribute("role", "button");
  projectFile.setAttribute("tabindex", "0");
  projectFile.setAttribute("aria-label", projectName);
  projectFile.dataset.projectName = projectName;
  projectFile.dataset.taskListId = taskListId;
  projectFile.dataset.projectMaterial = "";
  projectFile.dataset.uploadedFileName = "";
  projectFile.dataset.materialNames = "[]";
  projectFile.innerHTML = `
    <i></i>
    <span>
      <strong>${safeName}</strong>
      <small>0 tasks</small>
    </span>
    <button class="project-edit" type="button" aria-label="Edit project name" title="Edit project name">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4l10.5-10.5a2.2 2.2 0 0 0-3.1-3.1L5 16.8 4 20Z" />
        <path d="M14 7l3 3" />
      </svg>
      <em>Rename project</em>
    </button>
  `;
  projectShelf.appendChild(projectFile);
  const taskList = document.createElement("div");
  taskList.className = "task-list";
  taskList.id = taskListId;
  taskList.hidden = true;
  projectDetail.appendChild(taskList);
  selectProjectFile(projectFile);
  ensureTaskEmptyState(projectFile);
  updateEmptyStartGuide();
  window.setTimeout(() => projectFile.classList.remove("just-created"), 360);
  if (!options.skipRename) window.setTimeout(() => startProjectRename(projectFile), projectNameOverride ? 520 : 120);
}

function createDemoProject() {
  createProjectFile("Arduino sensor prototype");
  const activeProject = getActiveProjectFile();
  if (!activeProject) return;
  state.projectMaterial = demoDefineContext.projectMaterial;
  persistProjectMaterial();
  addMaterialNameToActiveProject("Demo project brief");
  const taskList = document.getElementById(activeProject.dataset.taskListId);
  if (!taskList || taskList.querySelector(".task-row")) return;
  const taskRow = document.createElement("div");
  taskRow.className = "task-row";
  taskRow.setAttribute("role", "button");
  taskRow.setAttribute("tabindex", "0");
  taskRow.setAttribute("aria-label", "Learn Arduino sensor setup");
  taskRow.dataset.taskName = "Learn Arduino sensor setup";
  taskRow.dataset.projectGoal = "";
  taskRow.dataset.learningContent = "";
  taskRow.dataset.learningType = "[]";
  taskRow.dataset.generatedFingerprint = "";
  taskRow.dataset.generatedPlan = "";
  taskRow.dataset.taskProgress = "";
  taskRow.innerHTML = `
    <svg class="task-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6z" />
      <path d="M14 4v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
    <span><strong>Learn Arduino sensor setup</strong><small>Set up task</small></span>
    <button class="task-edit" type="button" aria-label="Edit task name" title="Edit task name">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4l10.5-10.5a2.2 2.2 0 0 0-3.1-3.1L5 16.8 4 20Z" />
        <path d="M14 7l3 3" />
      </svg>
      <em>Rename task</em>
    </button>
    <em class="task-status" aria-hidden="true">›</em>
  `;
  taskList.appendChild(taskRow);
  updateProjectTaskCount(activeProject);
  selectTaskRow(taskRow);
}

function nextProjectName() {
  const count = projectShelf.querySelectorAll(".project-file:not(.create-project-file)").length + 1;
  return count === 1 ? "Untitled project" : `Untitled project ${count}`;
}

function selectProjectFile(selectedFile) {
  projectShelf.querySelectorAll(".project-file").forEach((file) => {
    const isSelected = file === selectedFile;
    file.classList.toggle("active", isSelected);
    file.classList.toggle("expanded", isSelected);
  });
  selectedFile.appendChild(projectDetail);
  projectDetail.hidden = false;
  const projectName = selectedFile.dataset.projectName || selectedFile.querySelector("strong")?.textContent || "Selected project";
  taskProjectName.textContent = projectName;
  loadActiveProjectMaterialIntoState(selectedFile);
  state.selectedTaskName = "";
  clearSetupInputsForNewTask();
  resetGeneratedPlanState();
  projectDetail.querySelectorAll(".task-list").forEach((list) => {
    list.hidden = list.id !== selectedFile.dataset.taskListId;
  });
  projectDetail.querySelectorAll(".task-row").forEach((row) => row.classList.remove("active"));
  renderUploadedFilesForProject(selectedFile);
  ensureTaskEmptyState(selectedFile);
}

function collapseProjectFile(projectFile) {
  if (!projectFile) return;
  projectFile.classList.remove("active", "expanded");
  projectDetail.hidden = true;
  state.selectedTaskName = "";
}

function startProjectRename(projectFile) {
  if (!projectFile || projectFile.classList.contains("renaming")) return;
  selectProjectFile(projectFile);
  projectFile.classList.add("renaming");
  const labelWrap = projectFile.querySelector("span");
  const currentName = projectFile.dataset.projectName || "Untitled project";
  labelWrap.innerHTML = `
    <input class="project-name-input" type="text" value="${escapeHtml(currentName)}" aria-label="Project name" />
    <small>${escapeHtml(projectFile.querySelector("small")?.textContent || "0 tasks")}</small>
  `;
  const input = labelWrap.querySelector("input");
  input.focus();
  input.select();

  const finish = () => finishProjectRename(projectFile, input.value);
  input.addEventListener("blur", finish, { once: true });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
    if (event.key === "Escape") {
      input.value = currentName;
      input.blur();
    }
  });
}

function finishProjectRename(projectFile, nextName) {
  const cleanName = nextName.trim() || "Untitled project";
  const taskCount = projectFile.querySelector("small")?.textContent || "0 tasks";
  projectFile.dataset.projectName = cleanName;
  projectFile.setAttribute("aria-label", cleanName);
  projectFile.classList.remove("renaming");
  const labelWrap = projectFile.querySelector("span");
  labelWrap.innerHTML = `
    <strong>${escapeHtml(cleanName)}</strong>
    <small>${escapeHtml(taskCount)}</small>
  `;
  if (projectFile.classList.contains("active")) {
    taskProjectName.textContent = cleanName;
  }
}

function selectTaskRow(selectedRow) {
  projectDetail.querySelectorAll(".task-row").forEach((row) => {
    row.classList.toggle("active", row === selectedRow);
  });
}

function startTaskRename(taskRow) {
  if (!taskRow || taskRow.classList.contains("renaming")) return;
  selectTaskRow(taskRow);
  taskRow.classList.add("renaming");
  const labelWrap = taskRow.querySelector("span");
  const currentName = taskRow.dataset.taskName || taskRow.querySelector("strong")?.textContent || "New learning task";
  const statusText = taskRow.querySelector(".task-status")?.textContent || "New";
  labelWrap.innerHTML = `
    <input class="task-name-input" type="text" value="${escapeHtml(currentName)}" aria-label="Task name" />
    <small>Set up task</small>
  `;
  const input = labelWrap.querySelector("input");
  input.focus();
  input.select();

  const finish = () => finishTaskRename(taskRow, input.value, statusText);
  input.addEventListener("blur", finish, { once: true });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
    if (event.key === "Escape") {
      input.value = currentName;
      input.blur();
    }
  });
}

function finishTaskRename(taskRow, nextName, statusText = "New") {
  const cleanName = nextName.trim() || "New learning task";
  taskRow.dataset.taskName = cleanName;
  taskRow.setAttribute("aria-label", cleanName);
  if (taskRow.classList.contains("active")) {
    state.selectedTaskName = cleanName;
  }
  taskRow.classList.remove("renaming");
  const labelWrap = taskRow.querySelector("span");
  labelWrap.innerHTML = `
    <strong>${escapeHtml(cleanName)}</strong>
    <small>Set up task</small>
  `;
  const status = taskRow.querySelector(".task-status");
  if (status) status.textContent = statusText;
}

function updateTaskStatus(taskRow, statusText) {
  if (!taskRow || !statusText) return;
  const subtitle = taskRow.querySelector("small");
  if (subtitle) subtitle.textContent = statusText;
  const status = taskRow.querySelector(".task-status");
  if (status) status.textContent = "›";
}

function updateProjectTaskCount(projectFile) {
  const taskList = document.getElementById(projectFile.dataset.taskListId);
  const count = taskList ? taskList.querySelectorAll(".task-row").length : 0;
  const label = projectFile.querySelector("small");
  if (label) label.textContent = `${count} ${count === 1 ? "task" : "tasks"}`;
}

function ensureTaskEmptyState(projectFile = getActiveProjectFile()) {
  if (!projectFile) return;
  const taskList = document.getElementById(projectFile.dataset.taskListId);
  if (!taskList) return;
  const hasTasks = Boolean(taskList.querySelector(".task-row"));
  const existingEmptyAction = taskList.querySelector(".empty-task-action");
  if (hasTasks) {
    existingEmptyAction?.remove();
    return;
  }
  if (existingEmptyAction) return;
  const action = document.createElement("button");
  action.className = "empty-task-action";
  action.type = "button";
  action.dataset.createTask = "true";
  action.innerHTML = `
    <span class="empty-task-action-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M6 4h9l3 3v13H6z"/><path d="M14 4v4h4"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>
    </span>
    <span><strong>Add first task</strong><small>Set up a learning goal inside this project</small></span>
  `;
  taskList.appendChild(action);
}

function getActiveProjectFile() {
  return projectShelf.querySelector(".project-file.active:not(.create-project-file)");
}

function nextTaskName(projectFile) {
  const taskList = document.getElementById(projectFile.dataset.taskListId);
  const count = taskList ? taskList.querySelectorAll(".task-row").length + 1 : 1;
  return count === 1 ? "New learning task" : `New learning task ${count}`;
}

function currentMaterialNames(projectFile = getActiveProjectFile()) {
  if (!projectFile) return [];
  try {
    return JSON.parse(projectFile.dataset.materialNames || "[]");
  } catch {
    return [];
  }
}

function renderMaterialList(target, materialNames) {
  if (!target) return;
  if (!materialNames.length) {
    target.innerHTML = `<span class="uploaded-empty">No material yet</span>`;
    return;
  }
  target.innerHTML = materialNames
    .map((name) => `<span class="file-chip file-chip-removable"><span>${escapeHtml(name)}</span><button type="button" class="file-chip-remove" data-remove-material="${escapeHtml(name)}" aria-label="Remove ${escapeHtml(name)}" title="Remove file"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button></span>`)
    .join("");
}

function renderUploadedFilesForProject(projectFile = getActiveProjectFile()) {
  const materialNames = currentMaterialNames(projectFile);
  renderMaterialList(uploadedFiles, materialNames);
  renderMaterialList(setupMaterialList, materialNames);
}

function addMaterialNameToActiveProject(name) {
  const activeProject = getActiveProjectFile();
  if (!activeProject || !name) return;
  const materialNames = currentMaterialNames(activeProject);
  if (!materialNames.includes(name)) materialNames.push(name);
  activeProject.dataset.materialNames = JSON.stringify(materialNames);
  renderUploadedFilesForProject(activeProject);
}

function removeMaterialFromActiveProject(name) {
  const activeProject = getActiveProjectFile();
  if (!activeProject || !name) return;
  const materialNames = currentMaterialNames(activeProject).filter((item) => item !== name);
  activeProject.dataset.materialNames = JSON.stringify(materialNames);
  loadActiveProjectMaterialIntoState(activeProject);
  const escapedName = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`(?:^|\\n\\n)\\[Uploaded file: ${escapedName}\\]\\n[\\s\\S]*?(?=\\n\\n\\[Uploaded file:|$)`, "g");
  state.projectMaterial = state.projectMaterial.replace(block, "").trim();
  if (state.uploadedFileName === name) state.uploadedFileName = materialNames.at(-1) || "";
  persistProjectMaterial();
  renderUploadedFilesForProject(activeProject);
  scheduleWorkspaceSave();
}

[uploadedFiles, setupMaterialList].forEach((list) => {
  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-material]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    removeMaterialFromActiveProject(button.dataset.removeMaterial || "");
  });
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let fullTextTooltipFrame = 0;

function shorten(value, max) {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  const abbreviated = `${text.slice(0, max - 3)}...`;
  shortenedTextLookup.set(abbreviated, text);
  return abbreviated;
}

function scheduleFullTextTooltips() {
  if (fullTextTooltipFrame) return;
  fullTextTooltipFrame = window.requestAnimationFrame(() => {
    fullTextTooltipFrame = 0;
    document.body.querySelectorAll("*").forEach((element) => {
      if (element.children.length || element.hasAttribute("title")) return;
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return;
      const visibleText = String(element.textContent || "").trim();
      if (!visibleText || visibleText.length < 4) return;
      const fullText = shortenedTextLookup.get(visibleText);
      const clippedByLayout = (element.scrollWidth > element.clientWidth + 1)
        || (element.scrollHeight > element.clientHeight + 1);
      if (!fullText && !clippedByLayout) return;
      element.title = fullText || visibleText;
      element.dataset.fullTextTooltip = "true";
    });
  });
}

const fullTextTooltipObserver = new MutationObserver(() => scheduleFullTextTooltips());
fullTextTooltipObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
window.addEventListener("load", scheduleFullTextTooltips, { once: true });
scheduleFullTextTooltips();
