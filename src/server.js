const http = require("http");
const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");

// Keep the English desktop build independent from the Chinese build when both are open.
const PORT = process.env.PORT || 4888;
let API_KEY = process.env.DEEPSEEK_API_KEY || "";
const API_HOST = "api.deepseek.com";
const API_PATH = "/chat/completions";
const API_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
// DeepSeek's chat endpoint is text-only. Visual checks use an optional OpenAI-compatible vision endpoint.
let VISION_API_KEY = process.env.VISION_API_KEY || process.env.OPENAI_API_KEY || "";
const VISION_API_HOST = process.env.VISION_API_HOST || "api.openai.com";
const VISION_API_PATH = process.env.VISION_API_PATH || "/v1/chat/completions";
const VISION_MODEL = process.env.VISION_MODEL || "gpt-4.1-mini";

const PUBLIC_DIR = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store, max-age=0",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath === "/" ? "index.html" : safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }
    send(res, 200, data, MIME[path.extname(filePath)] || "application/octet-stream");
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 8_000_000) {
        req.destroy();
        reject(new Error("Request too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function readZipEntry(buffer, wantedName) {
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 66000); i -= 1) {
    if (buffer.readUInt32LE(i) === eocdSignature) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Invalid DOCX zip structure");
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = centralOffset;
  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid central directory");
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    if (fileName === wantedName) {
      if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error("Invalid local file header");
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.slice(dataStart, dataStart + compressedSize);
      if (method === 0) return compressed;
      if (method === 8) return zlib.inflateRawSync(compressed);
      throw new Error(`Unsupported DOCX compression method ${method}`);
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`Missing ${wantedName}`);
}

function extractDocxText(buffer) {
  const xml = readZipEntry(buffer, "word/document.xml").toString("utf8");
  const paragraphs = xml
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
    .filter(Boolean);
  return paragraphs.join("\n\n");
}

async function handleExtractFile(req, res) {
  try {
    const body = JSON.parse(await readBody(req));
    const name = String(body.name || "uploaded file");
    const extension = name.split(".").pop().toLowerCase();
    const data = Buffer.from(String(body.dataBase64 || ""), "base64");
    let text = "";
    if (extension === "docx") {
      text = extractDocxText(data);
    } else {
      text = data.toString("utf8");
    }
    send(res, 200, JSON.stringify({
      name,
      text: text.slice(0, 12000),
      truncated: text.length > 12000,
    }));
  } catch (error) {
    send(res, 200, JSON.stringify({
      name: "uploaded file",
      text: "",
      error: error.message,
    }));
  }
}

function isTransientNetworkError(error) {
  return /enotfound|eai_again|econnreset|econnrefused|etimedout|socket hang up|fetch failed|network/i.test(String(error?.message || ""));
}

function callDeepSeekAttempt(messages, optionsOverride = {}) {
  if (!API_KEY) {
    return Promise.reject(new Error("Missing DEEPSEEK_API_KEY"));
  }
  const temperature = typeof optionsOverride.temperature === "number"
    ? Math.min(0.9, Math.max(0.1, optionsOverride.temperature))
    : 0.42;
  const payload = JSON.stringify({
    model: API_MODEL,
    temperature,
    max_tokens: optionsOverride.max_tokens || 520,
    messages,
  });

  const options = {
    hostname: API_HOST,
    path: API_PATH,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`API ${response.statusCode}: ${data}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices?.[0]?.message?.content || "");
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
    request.setTimeout(65000, () => request.destroy(new Error("DeepSeek request timeout")));
    request.write(payload);
    request.end();
  });
}

async function callDeepSeek(messages, optionsOverride = {}) {
  try {
    return await callDeepSeekAttempt(messages, optionsOverride);
  } catch (error) {
    if (!isTransientNetworkError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 700));
    return callDeepSeekAttempt(messages, optionsOverride);
  }
}

function callVision(messages, optionsOverride = {}) {
  if (!VISION_API_KEY) return Promise.reject(new Error("Missing VISION_API_KEY"));
  const payload = JSON.stringify({
    model: VISION_MODEL,
    temperature: typeof optionsOverride.temperature === "number" ? optionsOverride.temperature : 0.12,
    max_tokens: optionsOverride.max_tokens || 360,
    messages,
  });
  const options = {
    hostname: VISION_API_HOST,
    path: VISION_API_PATH,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      Authorization: `Bearer ${VISION_API_KEY}`,
    },
  };
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Vision API ${response.statusCode}: ${data}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices?.[0]?.message?.content || "");
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

function parseJsonObject(content = "") {
  const raw = String(content).trim();
  const fenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const firstBrace = fenced.indexOf("{");
  const lastBrace = fenced.lastIndexOf("}");
  const cleaned = firstBrace >= 0 && lastBrace > firstBrace ? fenced.slice(firstBrace, lastBrace + 1) : fenced;
  return JSON.parse(cleaned);
}

function normaliseVisualCheck(data = {}) {
  const status = ["pass", "needs_attention", "unclear"].includes(data.status) ? data.status : "unclear";
  return {
    status,
    observation: String(data.observation || "The photo does not show enough detail to verify this item.").slice(0, 360),
    issue: String(data.issue || "").slice(0, 300),
    suggested_action: String(data.suggested_action || "Compare the visible labels with the checklist before continuing.").slice(0, 240),
    project_implication: String(data.project_implication || "Relate this check to the current milestone before adding more components.").slice(0, 260),
    project_next_step: String(data.project_next_step || "Run one small test and record the result.").slice(0, 180),
    ask_coach: status !== "pass" || Boolean(data.ask_coach),
  };
}

async function handleVisualCheck(req, res) {
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
    if (!body.image_data_url) throw new Error("No image was supplied for this check.");
    if (!VISION_API_KEY) {
      send(res, 200, JSON.stringify({
        status: "unclear",
        observation: "A vision model has not been configured, so this photo cannot be verified automatically.",
        issue: "No vision analysis is available for this local prototype.",
        suggested_action: "Open Ask Coach and describe the exact connection or symptom you want to check.",
        ask_coach: true,
        unavailable: true,
      }));
      return;
    }
    const system = `You are a visual verification assistant inside a Design Engineering learning scaffold. Always write in English.

You are reviewing ONE photo against ONE student checklist item. Your purpose is to verify whether the image supports that exact real-world check, then explain what the result means for the current project milestone.
Only describe evidence that is clearly visible. Never guess unreadable pin labels, unseen wiring paths, voltage ratings or electrical safety.
A photo can only receive "pass" when the stated checklist item is visibly supported by the photo. Use "needs_attention" for a visible mismatch, missing required part, unsafe wiring risk, or wrong interface. Use "unclear" when labels, pins, wires, code text, or physical outcomes cannot be verified from the image.
If the project context suggests specific components, compare the image against those components and interfaces. For example, an obstacle car should verify Arduino, motor driver, motors, ultrasonic sensor, power and common ground when those are relevant to the checklist item.

Return JSON only:
{
  "status":"pass | needs_attention | unclear",
  "observation":"what is visibly shown, maximum 45 words",
  "issue":"one visible mismatch or blank string",
  "suggested_action":"one concrete next action, maximum 22 words",
  "project_implication":"why this result matters to the current milestone, maximum 30 words",
  "project_next_step":"one useful project-specific addition, test or decision to make next, maximum 18 words",
  "ask_coach":true
}`;
    const userText = `PROJECT GOAL: ${String(body.project_goal || "not provided").slice(0, 1800)}
TASK: ${String(body.task_name || "not provided").slice(0, 500)}
MILESTONE: ${String(body.milestone_title || "not provided").slice(0, 500)}
CHECKLIST ITEM: ${String(body.check_text || "not provided").slice(0, 700)}
WHAT THIS CHECK MEANS: ${String(body.check_hint || "not provided").slice(0, 700)}
PROJECT MATERIAL: ${String(body.project_material || "not provided").slice(0, 2500)}
LEARNER PROFILE: ${String(body.learner_profile || "not provided").slice(0, 1600)}`;
    const content = await callVision([
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: body.image_data_url, detail: "low" } },
        ],
      },
    ], { temperature: 0.1, max_tokens: 300 });
    send(res, 200, JSON.stringify(normaliseVisualCheck(parseJsonObject(content))));
  } catch (error) {
    send(res, 200, JSON.stringify({
      status: "unclear",
      observation: "The photo could not be verified automatically.",
      issue: "The visual check did not return a reliable result.",
      suggested_action: "Open Ask Coach with the photo and describe the connection or symptom you need to inspect.",
      ask_coach: true,
      error: error.message,
    }));
  }
}

function normaliseCodeCheck(data = {}, source = "selected code") {
  const status = ["pass", "needs_attention", "unclear"].includes(data.status) ? data.status : "unclear";
  return {
    status,
    source,
    summary: String(data.summary || "The code could not be checked reliably.").slice(0, 280),
    findings: Array.isArray(data.findings) ? data.findings.map((item) => String(item).slice(0, 180)).filter(Boolean).slice(0, 3) : [],
    next_action: String(data.next_action || "Compare the sketch with the board, pin labels and Serial Monitor output.").slice(0, 180),
    project_implication: String(data.project_implication || "Use the result to decide whether this milestone is ready for a small physical test.").slice(0, 260),
    project_next_step: String(data.project_next_step || "Run one controlled test and record the observed result.").slice(0, 180),
  };
}

async function inspectCode(body = {}, source = "selected code") {
  const code = String(body.code || body.code_snippet || "").trim().slice(0, 10000);
  if (!code) return normaliseCodeCheck({
    status: "unclear",
    summary: "No readable code or error text was available to check.",
    findings: [],
    next_action: "Copy the selected Arduino code, then run the check again.",
  }, source);

  const system = `You are a precise Arduino and design-engineering code checker. Always write in English.

Check only the code or compiler/error text supplied. Use the project context to judge whether the code supports the current milestone. Do not claim that a sketch has been compiled, uploaded or tested. Do not invent pin labels, libraries, components or line numbers. A pass means no obvious issue is visible in the supplied excerpt, not that the whole project is correct.

Whether the result is pass, needs_attention or unclear, add one concise project implication and one practical next step. The next step may recommend a small test, a missing safeguard, a needed measurement, or an appropriate next integration. Do not recommend unrelated features.

Return JSON only:
{
  "status":"pass | needs_attention | unclear",
  "summary":"maximum 42 words",
  "findings":["0-3 concrete findings, each maximum 20 words"],
  "next_action":"one executable correction or verification action, maximum 24 words",
  "project_implication":"what this means for the current project milestone, maximum 30 words",
  "project_next_step":"one project-specific next test or addition, maximum 18 words"
}`;
  const user = `PROJECT GOAL: ${String(body.project_goal || "not provided").slice(0, 1600)}
LEARNING CONTENT: ${String(body.learning_content || "not provided").slice(0, 1000)}
MILESTONE: ${String(body.milestone_title || "not provided").slice(0, 500)}
LEARNER PROFILE: ${String(body.learner_profile || "not provided").slice(0, 1600)}
SOURCE: ${source}
CODE OR ERROR TEXT:
${code}`;
  try {
    const content = await callDeepSeek([
      { role: "system", content: system },
      { role: "user", content: user },
    ], { temperature: 0.1, max_tokens: 420 });
    return normaliseCodeCheck(parseJsonObject(content), source);
  } catch (error) {
    return normaliseCodeCheck({
      status: "unclear",
      summary: "The code checker is unavailable right now.",
      findings: [],
      next_action: "Use Arduino IDE Verify, then copy the exact error and try again.",
    }, source);
  }
}

function ocrScreenshot(dataUrl = "") {
  const match = String(dataUrl).match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (!match) return "";
  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const imagePath = path.join(os.tmpdir(), `reasoning-coach-ocr-${Date.now()}.${extension}`);
  try {
    fs.writeFileSync(imagePath, Buffer.from(match[2], "base64"));
    return execFileSync("/opt/homebrew/bin/tesseract", [imagePath, "stdout", "--psm", "6"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 15000,
      maxBuffer: 1024 * 1024,
    }).trim().slice(0, 10000);
  } catch {
    return "";
  } finally {
    try { fs.unlinkSync(imagePath); } catch {}
  }
}

async function handleCodeCheck(req, res) {
  try {
    const body = JSON.parse(await readBody(req));
    send(res, 200, JSON.stringify(await inspectCode(body, "selected code")));
  } catch (error) {
    send(res, 200, JSON.stringify(normaliseCodeCheck({
      status: "unclear",
      summary: "The selected code could not be read.",
      findings: [],
      next_action: "Copy the code again and retry.",
    })));
  }
}

async function handleScreenshotCheck(req, res) {
  try {
    const body = JSON.parse(await readBody(req));
    const text = ocrScreenshot(body.image_data_url || "");
    if (!text) {
      send(res, 200, JSON.stringify(normaliseCodeCheck({
        status: "unclear",
        summary: "No readable code or error text was found in this screenshot.",
        findings: [],
        next_action: "Capture the Arduino editor or error panel more closely, or ask Coach with the image attached.",
      }, "screenshot")));
      return;
    }
    const result = await inspectCode({ ...body, code: text }, "screenshot OCR");
    result.ocr_text = text.slice(0, 1200);
    send(res, 200, JSON.stringify(result));
  } catch (error) {
    send(res, 200, JSON.stringify(normaliseCodeCheck({
      status: "unclear",
      summary: "The screenshot could not be read.",
      findings: [],
      next_action: "Capture a smaller, sharper area of the editor or error message.",
    }, "screenshot")));
  }
}

async function handleCoach(req, res) {
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
    const system = `You are the Design Engineering Reasoning Coach inside an AI-supported learning scaffold.

Always write in English. Your task is to respond to the student's actual project reasoning, never to a generic Arduino or design-engineering scenario.

You receive a structured CURRENT_REASONING_CONTEXT. Treat its current_node, student_selection, student_reason, selected_tool_result, prior_reasoning, project_goal, learning_content and project_material as the ground truth. Refer to at least one concrete detail from that context in the coach comment. If no concrete detail is available, say exactly what is missing rather than inventing a project detail.

You also receive AI_SUPPORT_BOUNDARIES. Respect every boundary with enabled:false:
- If “Guide learning” is disabled, do not add unsolicited explanations, tutorials or learning routes. For explicit Ask Coach requests, answer only the concrete diagnostic.
- If “Ask reasoning” is disabled, return empty coach_note, next_check and options for reasoning_step_completed.
- If “Prompt checks” or “Prompt evidence” is disabled, do not add a next_check, missing-evidence request or optional test suggestion, except for an immediate safety warning.
- “Student decides” is always on: never choose, approve or reject the student’s final project action.

For a reasoning-step comment:
- Respond only after the student has saved a reasoning node.
- Your output is an optional margin note, not a message that expects a reply.
- First decide whether a note would change the learner's next project action. Set note_needed to false when the saved choice and reason are already sufficient, low-stakes, or do not reveal a concrete project-specific gap. In that case return empty coach_note and next_check.
- When note_needed is true, produce one closed checkpoint only. Identify one specific missing relationship between the student's choice/reason and the project: an assumption, constraint, evidence need, trade-off, or safety risk.
- Never restate the student's choice or reason. Never turn the reason into a new question.
- Set coach_note to a maximum of 26 words. It must be a concise statement, not a question, explanation, tutorial, or praise.
- Set coach_note_type to exactly one of "verify", "risk", or "consequence".
- Set next_check to one executable and observable action, phrased with a verb, maximum 16 words. Include the object of the check and, when possible, the expected signal. It is not a question and does not require a reply.
- Set options to [] always for a reasoning-step comment. A Coach note must never create another choice or a new reasoning node.
- Never output a question field or invite another answer, conversation, or follow-up.
- Do not make the final design decision for the student.

For an ask_coach_on_demand request:
- Only respond because the student explicitly requested help.
- Read conversation_history before replying. Treat the newest user message as a follow-up when earlier messages exist, preserve the current task context, and do not repeat advice already given unless the new evidence changes it.
- Base the diagnostic on the supplied image/screenshot, code, error, physical symptom and checklist status, in that priority order.
- If there is no concrete artifact or symptom, request the single most useful artifact. Do not guess a wiring or code fault.
- Keep the response under 150 words and solve only the immediate issue.
- Return the diagnostic in the \"coach\" field. Leave \"coach_note\" and \"next_check\" empty for this request type.
- First read support_context. It may be \"modelling software\", \"hardware or electronics\", \"mechanical structure\", \"code or software\", or \"project making\".
- For modelling software, use the named software, command, geometry and screenshot when supplied. Give 2-4 small operations in the order the learner can perform them. Do not invent a command name when the software is unknown.
- For hardware or electronics, use only the supplied component labels, visible pins, power information, checklist and image. Do not guess unclear pins, voltages or wiring. Ask for a clearer photo or the module label when verification is needed.
- For mechanical structure, focus on the current load path, degrees of freedom, interference, tolerance, material, fastener or test observation that is actually in the context.
- For code or software, focus on the supplied code, error message, input/output or reproduction step.
- Use guided_actions for 0-4 compact, practical actions. Each item needs a short location (a UI area, component or physical point) and one direct action. Leave it empty when no concrete action can be suggested safely.
- Only add video_resource when help_type is \"learn\" or a visual demonstration is clearly more useful than text. It must be a YouTube search query, never an unverified direct video link. Use actual known terms from the project, for example \"Rhino 8 extrude curve tutorial\" or \"HC-SR04 Arduino distance test\". Do not use a video instead of an essential safety, pin-label or measurement check.

For a reasoning_step_completed request:
- Return the note only in \"coach_note\" and the action only in \"next_check\".
- Leave \"coach\" empty. Never include a question field.

Never give a long tutorial, generic encouragement, unrelated theory, or a final decision. Never say “This is a good question.”

Return JSON only in this exact shape:
{
  "label":"short label for the current judgement",
  "stage":"current stage title",
  "note_needed":true,
  "coach_note_type":"verify | risk | consequence",
  "coach_note":"short, context-specific Coach sticky note in English",
  "next_check":"one short context-specific next check, phrased as a statement",
  "options":[],
  "rationale_hint":"I chose this because...",
  "missing_evidence":["only include relevant items"],
  "possible_paths":["only include relevant paths"],
  "record_update":"one short factual record of the student's own reasoning",
  "coach":"only populate this for ask_coach_on_demand diagnostic replies",
  "guided_actions":[{"location":"short UI area, component or physical point","action":"one short practical action"}],
  "video_resource":{"title":"short visual reference title","youtube_query":"specific YouTube search query","reason":"one short reason"}
}`;

    const user = `CURRENT_REASONING_CONTEXT:
${JSON.stringify(body.reasoningContext || {}, null, 2)}

PROJECT_STATE:
${JSON.stringify(body.state || {}, null, 2)}

AI_SUPPORT_BOUNDARIES:
${JSON.stringify(body.reasoningContext?.support_boundaries || body.state?.activeAllow || [], null, 2)}

CURRENT_STAGE: ${body.stage || body.step || "unknown"}
REQUEST_TYPE: ${body.userAction || "reasoning_step_completed"}
STUDENT_MESSAGE: ${body.message || ""}

Generate a context-specific response using the CURRENT_REASONING_CONTEXT. For reasoning_step_completed, return either no note or one action-changing Coach note. Do not output generic options, generic sensor suggestions, or a new question.`;

    const content = await callDeepSeek([
      { role: "system", content: system },
      { role: "user", content: user },
    ], { temperature: 0.35, max_tokens: 560 });

    let parsed = parseCoachPayload(content) || {
      note_needed: false,
      coach_note_type: "",
      coach_note: "",
      next_check: "",
      options: [],
      rationale_hint: "",
    };
    const boundaries = body.reasoningContext?.support_boundaries || body.state?.activeAllow || [];
    const boundaryEnabled = (pattern) => {
      const boundary = boundaries.find((item) => pattern.test(`${item?.label || ""} ${item?.detail || ""}`));
      return !boundary || boundary.enabled !== false;
    };
    if (body.userAction === "reasoning_step_completed") {
      parsed = normaliseReasoningStickyNote(parsed);
    }
    if (body.userAction === "reasoning_step_completed" && !boundaryEnabled(/ask.*reason|reasoning/i)) {
      parsed.coach_note = "";
      parsed.next_check = "";
      parsed.options = [];
    }
    if (!boundaryEnabled(/prompt.*(check|evidence)|evidence|check/i)) {
      parsed.note_needed = false;
      parsed.coach_note = "";
      parsed.coach_note_type = "";
      parsed.next_check = "";
      parsed.missing_evidence = [];
    }
    if (body.userAction === "ask_coach_on_demand") {
      parsed = normaliseOnDemandCoachResponse(parsed);
    }
    send(res, 200, JSON.stringify(parsed));
  } catch (error) {
    send(res, 200, JSON.stringify(fallbackCoach(body, error)));
  }
}

function parseCoachPayload(content) {
  const raw = String(content || "").trim();
  if (!raw) return null;
  const candidates = [
    raw,
    raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
  ];
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch { /* Try to recover a single object from surrounding prose or a fence. */ }
    const start = candidate.indexOf("{");
    if (start < 0) continue;
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = start; index < candidate.length; index += 1) {
      const char = candidate[index];
      if (quoted) {
        if (!escaped && char === "\\") escaped = true;
        else if (!escaped && char === '"') quoted = false;
        else escaped = false;
        continue;
      }
      if (char === '"') quoted = true;
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, index + 1));
        } catch { break; }
      }
    }
  }
  return null;
}

function normaliseReasoningStickyNote(data = {}) {
  const compact = (value, max) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  const questionLike = (value) => /[?？]|\b(what|which|why|how|could you|would you|do you|have you)\b/i.test(value);
  const note = compact(data.coach_note, 220);
  const nextCheck = compact(data.next_check, 140);
  const explicitNoNote = data.note_needed === false || String(data.note_needed).toLowerCase() === "false";
  const inferredNote = note && nextCheck && data.note_needed === undefined;
  const noteNeeded = data.note_needed === true || String(data.note_needed).toLowerCase() === "true" || inferredNote;
  const type = ["verify", "risk", "consequence"].includes(String(data.coach_note_type || "").toLowerCase())
    ? String(data.coach_note_type).toLowerCase()
    : "verify";

  if (explicitNoNote || !noteNeeded || !note || !nextCheck || questionLike(note) || questionLike(nextCheck)) {
    return {
      ...data,
      note_needed: false,
      coach_note_type: "",
      coach_note: "",
      next_check: "",
      options: [],
    };
  }

  return {
    ...data,
    note_needed: true,
    coach_note_type: type,
    coach_note: note.replace(/[?？]/g, "").trim(),
    next_check: nextCheck.replace(/[?？]/g, "").trim(),
    options: [],
  };
}

function normaliseOnDemandCoachResponse(data = {}) {
  const guidedActions = Array.isArray(data.guided_actions)
    ? data.guided_actions.slice(0, 4).map((item) => ({
      location: String(item?.location || "").trim().slice(0, 80),
      action: String(item?.action || item || "").trim().slice(0, 180),
    })).filter((item) => item.action)
    : [];
  const resource = data.video_resource && typeof data.video_resource === "object" ? data.video_resource : null;
  const query = String(resource?.youtube_query || "").trim().slice(0, 180);
  return {
    ...data,
    coach: String(data.coach || "I need a clearer symptom, screenshot, code snippet or photo to diagnose this.").trim().slice(0, 900),
    coach_note: "",
    next_check: "",
    guided_actions: guidedActions,
    video_resource: query ? {
      title: String(resource.title || "Visual reference").trim().slice(0, 90),
      youtube_query: query,
      reason: String(resource.reason || "Use this visual reference alongside your own project.").trim().slice(0, 150),
    } : null,
  };
}

function buildLearnerAdaptation(profile = {}, supplied = {}) {
  const rawSkills = Array.isArray(supplied.self_rated_skills)
    ? supplied.self_rated_skills
    : Object.entries(profile.skills || {}).map(([name, confidence]) => ({ name, confidence }));
  const skills = rawSkills
    .map((skill) => ({
      name: String(skill?.name || "").trim(),
      confidence: Math.max(0, Math.min(100, Number(skill?.confidence) || 0)),
    }))
    .filter((skill) => skill.name)
    .sort((a, b) => b.confidence - a.confidence);
  const statedAverage = Number(supplied.average_skill_confidence);
  const average = Number.isFinite(statedAverage)
    ? Math.round(statedAverage)
    : (skills.length ? Math.round(skills.reduce((sum, skill) => sum + skill.confidence, 0) / skills.length) : 45);
  const year = String(supplied.year_of_study || profile.year || "").trim();
  const early = /year 1|year 2|foundation|first|second/i.test(year) || average < 38;
  const advanced = /year 4|fourth|postgraduate|master/i.test(year) || average >= 72;
  const mode = early ? "foundation" : advanced ? "advanced" : "applied";
  const focus = Array.isArray(supplied.learning_focus) ? supplied.learning_focus : (profile.focus || []);

  return {
    discipline: String(supplied.discipline || profile.discipline || "Design engineering"),
    year_of_study: year || "not provided",
    learning_focus: focus.filter(Boolean),
    self_rated_skills: skills,
    average_skill_confidence: average,
    inferred_support_mode: mode,
    visible_adaptation: mode === "foundation"
      ? "Introduce only the necessary underlying principle, make prerequisite and safety checks concrete, and keep the first practical proof small."
      : mode === "advanced"
        ? "Do not spend nodes on introductory definitions. Prioritise system dependencies, alternative routes, trade-offs, failure conditions and validation strategy."
        : "Relate concepts to project use, surface one relevant condition or constraint, then make evidence and next action concrete.",
  };
}

async function handlePlan(req, res) {
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
    const system = `You are the planning agent inside an AI-supported adaptive learning scaffold coach for higher education design engineering students.

Your job is to generate a personalised learning-to-decision scaffold from the student's actual input.
Use ALL available context: uploaded project material text, project goal, task name, learning content, learning content type, uploaded file names, LEARNER_ADAPTATION, and previous reasoning records if present.
Treat each request as a fresh generation for the given fingerprint. Do not reuse any previous plan, stage names or reasoning questions unless they are directly required by the new user input.

Important:
- Do not generate a generic course outline.
- Do not generate a fixed template such as "Understand, Connect, Reason, Decide".
- Do not provide a final technical solution.
- The plan should help the student learn enough to reason and decide, not simply complete a task.
- The coach always works as a scaffold. The learner is always a higher-education Design Engineering student. LEARNER_ADAPTATION is mandatory input, not background decoration: use it to shape milestone order, the amount and depth of Thinking, vocabulary, micro-lessons, checklist detail, candidate options, evidence thresholds and the risks worth surfacing.
- Read the task against the learner profile before generating. Identify which self-rated skills are relevant to the task. A high CAD confidence must not be treated as high Arduino confidence; an unrelated strength must not remove necessary project support.
- For foundation learners, explain only the needed basic principle, make prerequisite relationships and safety boundaries visible, and begin with smaller observable checks. For applied learners, connect concepts to the current project, its constraints and evidence needs. For advanced learners, do not waste nodes on introductory definitions; foreground system dependencies, alternative routes, trade-offs, integration effects, overlooked constraints and validation strategy.
- Adapt implicitly. Do not expose labels such as "Year 1 learner" or "advanced learner" in visible milestone wording unless the student asks for them.
- If learner information is missing, use a balanced applied scaffold and avoid assuming either novice or expert knowledge.
- Each learning step should be a scaffolded step that helps the student understand why the knowledge matters, what needs checking, and what decision it may support.
- Each reasoning chain should include micro-learning moments. The student should learn what the knowledge/tool step means before being asked to reason about project fit.
- Avoid a rigid chain where every step asks the same kind of reasoning question. Mix micro-explanation, teach-back, exploration, small test, evidence check and decision support.
- Treat the scaffold as a project-progress learning coach. The questions should help the student move from a vague project goal to a clearer project action, not just answer isolated learning questions.
- Create Thinking nodes only when a learner needs to make a real judgement: a concrete technical/design choice, a condition or constraint, an evidence threshold, a diagnosis, or a trade-off. A Thinking node must have an immediate consequence for the next build, test, model, prototype, or project decision.
- Do not create generic reflective nodes to fill a sequence. Never use titles or questions such as "Goal framing", "Project move", "Learning outcome", "Learning object", "Project link", "Success signal", "Step purpose", or "What do you want to...".
- Name a real project object in every Thinking node: component, behaviour, interface, material, user condition, parameter, failure mode, physical test, model feature, or route. For example, ask about a distance threshold, motor power condition, chassis constraint, sensor placement, model proportion, user interaction, or manufacturing limit.
- Use labels that name that object or judgement directly. Avoid abstract labels such as "Outcome", "Success", "First move", "Uncertain part", "Project relevance", or "Next action". Prefer labels such as "Distance threshold", "Motor power", "Signal path", "Chassis clearance", "Wall thickness", or "Turn priority".
- Each compact judgement loop should move from a live uncertainty, to the condition that matters, to the smallest meaningful check or bounded next move. It should never ask the student to justify that learning is useful in the abstract.
- Questions should be written as short, specific prompts. They must not ask for a statement of learning outcome, a project link, or a generic success signal.
- Every question must be contextual. It should refer to the actual project, material, tool, method, AI output or constraint whenever possible.
- A high Thinking-detail setting is never permission to pad the chain. Do not create meta nodes such as "Is the scope clear?", "What should you do next?", "Are you ready to commit?", or "What is the priority?" unless the question names a concrete project object and a real decision criterion.
- Every plan step, start option and reasoning question should reuse concrete words from the student's goal, uploaded material or learning content whenever possible.
- The generated Learning Plan should change when project material, goal, learning content or learning type changes.
- When STUDENT-EDITED MILESTONES are supplied, treat their sequence, titles and details as student-authored plan decisions. Preserve them as the visible steps. Regenerate the stage prompts, reasoning chains, Doing checklists, suggested start and Coach support around those edited milestones. Do not silently replace the student's milestone wording with a generic template.
- If the input mentions a specific tool, process or domain such as Arduino, sensor, CAD, Rhino, coding, material, user research or prototype, include that specificity in the generated plan and reasoning chain.
- For Arduino or hands-on hardware projects, the plan should scaffold the whole learn-build-complete cycle:
  decompose the user's goal, identify required knowledge nodes, explain part roles and signal flow, suggest resource entry points, guide hands-on setup, guide code/tool logic, run small tests, debug, complete the build, summarise learning, and update the knowledge map.
- Generate milestones, not a long task list.
- Beginner projects must have at most 3 milestones. Harder projects must have at most 5 milestones.
- Each milestone can contain hidden knowledge points and checkpoints, but the visible plan should stay calm and compact.
- The first milestone must always be a Thinking entry of type "goal", "guide" or "decision". It must never be "build_checklist". For a Simple plan, include one Thinking entry before Doing. For Medium, Complex and Enterprise plans, include one or two Thinking entries before the first Doing milestone.
- Arrange every plan as calm learning-to-action loops, not as a batch of questions followed by a batch of tasks. Each loop has this internal logic: project move -> just-enough learning -> make -> evidence -> conditional decision. Visible milestones should express the important parts of that loop.
- Use this milestone rhythm unless the project context gives a stronger reason to adapt it:
  Simple (3): goal/guide -> build_checklist -> decision or knowledge update.
  Medium (4): goal -> guide -> build_checklist -> validate or decision.
  Complex (5): goal -> guide -> build_checklist -> validate -> decision or knowledge update.
- A "guide" milestone teaches only the knowledge needed for the next physical action. A "validate" milestone interprets an observed result, photo, measurement, code output or source. A "decision" milestone appears only when evidence creates a real choice about what to do next.
- For any build_checklist milestone, the expected physical output or evidence signal must be named in its detail or checklist. Do not ask the learner to fill open text during Doing.
- Every plan must include at least one build_checklist milestone. This is a Doing milestone: it must contain 3-5 observable checklist actions and never an open reasoning question.
- Use Thinking only for a genuine choice, risk, evidence judgement or debugging decision. Use Doing for building, trying, configuring, testing, measuring or integrating.
- Use this corrected scaffold path for hands-on Arduino learning:
  1. Need analysis: what the student wants to make and why.
  2. System breakdown: what subsystems are needed.
  3. Knowledge mapping: what each subsystem requires the student to learn.
  4. Minimum viable version: make the smallest meaningful part work first.
  5. Step-by-step integration: add sensor, control, power or output gradually.
  6. Debugging and iteration: use failures to locate the next learning gap.
  7. Learning summary and Knowledge Map update.
- Adapt scaffold strength by difficulty:
  Beginner Arduino, such as LED blink, button LED or breathing LED: 3 milestones, full circuit/code explanation, frequent checkpoints.
  Intermediate Arduino, such as ultrasonic obstacle avoidance car: 4 milestones, subsystem diagrams, pseudocode and debugging checklist.
  System integration Arduino, such as Bluetooth + line tracking + obstacle avoidance car: 5 milestones, system diagram, interface descriptions and review prompts.
  Advanced Arduino/robotics, such as vision-based autonomous navigation: 5 milestones, goals, criteria and open research/review prompts rather than full solutions.
- Each plan step should include a learning object, a hands-on or reasoning action, and an expected output/evidence signal.
- Include at least one step that explicitly supports adding learned concepts, operations, tests or gaps into the Knowledge Map.
- Include resource or learning entry points where useful, such as tutorial, datasheet, official documentation, example sketch, reference case, AI explanation or tutor feedback.
- Avoid generic labels such as "Understand", "Connect", "Reason" or "Decide" unless paired with project-specific content.
- If the context is weak, make the first step a clarification step, but still tailor it to the student's words.
- Questions and options must help the student build reasoning: project relevance, assumptions, constraints, evidence, trade-offs, and next action.
- Each reasoning-chain item must include "selection_mode": "single" or "multiple". Use "multiple" only where options can genuinely coexist, such as capabilities, functions, requirements, subsystems, evidence items or checks. For example, "What should your six-foot robot do?" can be multiple because it may navigate, carry and detect obstacles. Use "single" for mutually exclusive routes, priorities, trade-offs and decisions.
- Include a design-analysis tool only when it materially helps the student's current project decision. Supported tool values are "radar", "two-axis" and "morphology". Leave tool empty when a tool would be decorative.
- Use morphology only when the project has at least two genuine functional dimensions or subsystem choices that can be combined. Do not use it for a single linear operation, a simple checklist, a debugging symptom, or a choice that needs only one comparison.
- For morphology, first name the independent project functions or dimensions, then list concrete means for each. The rows must describe functions or dimensions from this project, not generic labels. Include a short screening criterion for the final combination and any known incompatibility worth checking.
- Put the tool into the "tool" field and provide a project-specific "tool_config". Do not ask the student to choose the tool as a normal answer option.
- Use the design analysis tools as part of the reasoning process:
  morphology = compare real subsystem or method combinations that the student must choose between;
  radar = rate real project-fit criteria for one specific proposed route;
  two-axis = compare two to four actual next actions, methods or components from this project.
- Never use generic labels such as "wiring", "power", "code", "fit", "risk", "photo" or "small test" as tool content unless the project context makes them specific.
- Use at most two analysis tools across a Simple or Medium plan, and at most three across a Complex plan. A tool must remove a real uncertainty, not make the interface look analytical.
- Follow both requested SCAFFOLD_SETTINGS exactly. They control the visible Thinking support inside each milestone; they do not change student ownership or turn the plan into a long course.
  - Thinking detail is a continuous 0-100 value. Use the supplied Thinking-node target as the intended number of distinct reasoning items in each Thinking milestone. Lower values retain only the core judgement, condition and next check. Higher values add deeper project principles, dependencies, integration effects and failure conditions. Do not pad with duplicates.
  - Exploration is a continuous 0-100 value. Lower values stay with the immediate task. Middle values add relevant constraints and evidence needs. Higher values add only useful alternatives, trade-offs, risks and overlooked links across the project. Never add unrelated brainstorming.
  - Knowledge depth is inferred from the learner profile. Early-stage or low-confidence learners need clearer basic principles, concrete checks and safety boundaries. Advanced learners can be challenged with system dependencies, alternative routes and unanticipated constraints. Use the student's year and self-reported skills as a guide, never as a reason to remove ownership.
  - Doing milestones remain practical across all settings: checklists, references and evidence. Do not turn Doing into more questions.
- At every density, keep milestones compact, questions under 12 words and checklist items practical. Do not add filler explanation or duplicate questions.
- Keep text short enough for a compact desktop coach window.
- Keep each question under 12 words.
- Never paste the full project context into a question.
- Turn long context into a short object name, such as "this sensor test", "the motor driver", "your model", or "the prototype".
- Decide the milestone count from the project context:
  Simple: 3 milestones.
  Medium: 4 milestones.
  Complex or Enterprise: 5 milestones.
- Set "complexity" and "max_steps" in the JSON. max_steps must be 3, 4 or 5.
- Return these exact four Coach support boundaries. They are operational controls for later coaching, not decorative tags:
  {"label":"Learning guidance","detail":"Guide learning with concise hints."},
  {"label":"Decision prompts","detail":"Ask reasoning only at decision points."},
  {"label":"Checks & evidence","detail":"Prompt checks or evidence before use."},
  {"label":"Student decides","detail":"AI cannot choose the final action."}.

Return JSON only:
{
  "source":"ai",
  "complexity":"Simple / Medium / Complex / Enterprise",
  "max_steps":number,
  "context_summary":"maximum 18 words summarising the student's project context",
  "steps":[{
    "type":"goal / guide / build_checklist / validate / decision / knowledge",
    "title":"1-3 words milestone name",
    "detail":"maximum 14 words: physical goal, construct or acceptance check",
    "checklist":[
      {
        "id":1,
        "text":"concrete check item for this build/practice milestone",
        "hint":"short practical hint",
        "required_photo":false,
        "photo_prompt":"optional short photo instruction"
      }
    ]
  }],
  "start_from":"maximum 16 words explaining the suggested first step",
  "start_options":[{"label":"1-4 words","reason":"maximum 12 words, explain why this entry point fits"}],
  "allow":[{"label":"1-3 words","detail":"maximum 8 words"}],
  "stage_prompts":{
    "goal":"one short project-specific prompt for Goal stage",
    "need":"one short project-specific prompt for Detect Need stage",
    "guide":"one short project-specific prompt for Guide stage",
    "reasoning":"one short project-specific prompt for Reasoning Build stage",
    "practice":"one short project-specific prompt for Practice stage",
    "validate":"one short project-specific prompt for Validate stage",
    "decision":"one short project-specific prompt for Decision stage"
  },
  "reasoning_chains":{
    "goal":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "need":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "guide":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "resource":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "reasoning":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "practice":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "debug":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "validate":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "complete":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "knowledge":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}],
    "decision":[{"key":"short-key","title":"1-3 words","micro_lesson":"maximum 22 words teaching the current idea","question":"project-specific question","hint":"one short hint","selection_mode":"single or multiple","options":["2-4 short options"],"tool":"optional empty string or radar/two-axis/morphology"}]
  }
}

Return learning milestones according to the complexity rule above. Do not generate long step lists.
For a chain item with a non-empty tool, also return "tool_config" using only the matching shape:
- radar: {"purpose":"short current judgement","criteria":["2-4 project-specific criteria"]}
- two-axis: {"purpose":"short current comparison","axes":{"horizontal":"actual effort/cost axis","vertical":"actual value/fit axis"},"candidates":[{"label":"real project path","quadrant":"high value / low effort"}]}
- morphology: {"purpose":"short current combination decision","rows":[{"label":"real independent project function or dimension","options":["2-3 project-specific means"]}],"screening_criteria":["2-4 project-specific criteria"],"incompatibilities":["optional known conflict to examine"]}
For a chain item without a tool, return "tool_config": null.
Before returning JSON, verify that at least one step has type "build_checklist". If not, convert the most appropriate hands-on milestone into build_checklist and add its checklist.
For build/practice milestones, set "type" to "build_checklist" and include 3-5 concrete checklist items.
Checklist items must be concrete doing checks, not reflective questions.
Use required_photo:true only for checks where photo evidence is useful, such as wiring, physical assembly, material setup, model screenshot, or error screenshot.
Do not put open text questions inside build_checklist steps.
Return reasoning_chains only for Thinking milestone types: goal, guide, validate, decision and knowledge. Do not return chains for build_checklist milestones: those are Doing milestones and use their checklist instead.
Follow SCAFFOLD_SETTINGS exactly when deciding Thinking content. Thinking detail determines the supplied target count. Knowledge depth determines whether to foreground principles, project application, or system dependencies. Exploration determines whether to keep only the immediate task, include constraints and evidence, or add project-relevant alternatives and risks. Never add a node that merely repeats a previous node in different words.
Each Thinking milestone must form one compact judgement loop, not disconnected questions. Use the selected count to deepen the same judgement, rather than adding unrelated prompts. A decision milestone should normally include paths, trade-off, evidence or assumption, then a student-owned next move.
For every Thinking milestone, build depth in this order whenever it fits the project:
1. Learning/project meaning: what this concept, method or option enables in this specific task.
2. Project condition: the relevant requirement, assumption, limitation or trade-off.
3. Grounded move: the smallest evidence check, comparison, or next action that follows.
Do not make all three items simple selections. At least one item must invite a short student reason, uncertainty or project-specific note. Keep this optional-looking and compact, never a long reflection task.
Across the plan, use a judgement-action rhythm rather than a fixed question sequence:
1. Locate a live design or technical uncertainty.
2. Surface the relevant condition, dependency, constraint or trade-off.
3. Identify the smallest observable check, comparison or evidence source.
4. Let the student commit to a bounded next action.
5. Return to Doing, evidence capture, integration or knowledge-map update.
Only include the parts that genuinely fit this milestone. The scaffold should become deeper by examining the same live judgement, not by adding labels or reflective filler.
Use a radar tool block only when the student is judging one project route against several concrete criteria.
Use a two-axis or morphology tool block only when comparing actual paths, components or combinations mentioned or implied by the student's project.
Each stage should contain different questions that match that stage, not repeated generic questions.
Every stage prompt, question and option must be adapted to the student's project goal, uploaded material and learning content.
The generated questions should help the student learn by doing. Do not turn every milestone into a questionnaire. Most milestones are Doing milestones with checklists and artifact evidence; only project framing, a live uncertainty, a risk, an evidence interpretation or a real decision should become Thinking prompts.
The AI must scaffold the student's reasoning, not choose the final answer.
Keep everything short enough for a small desktop coach window.`;

    const state = body.state || {};
    const learningTypeList = Array.isArray(state.learningType) ? state.learningType.filter(Boolean) : [state.learningType].filter(Boolean);
    const learningTypes = learningTypeList.join(", ") || "not specified";
    const fileNames = Array.isArray(state.uploadedFileNames) ? state.uploadedFileNames : state.uploadedFileName ? [state.uploadedFileName] : [];
    const learnerAdaptation = buildLearnerAdaptation(state.learnerProfile || {}, state.learnerAdaptation || state.scaffoldSettings?.learnerAdaptation || {});
    const detailValue = Math.max(0, Math.min(100, Number(state.thinkingDetail ?? state.scaffoldSettings?.thinkingDetail ?? state.informationDensity ?? 50)));
    const complexity = inferServerPlanComplexity(`${state.projectMaterial || ""} ${state.projectGoal || ""} ${state.learningContent || ""}`, learningTypeList);
    const detailMaximum = complexity.label === "Simple" ? 7 : complexity.label === "Medium" ? 10 : 14;
    const detailDefault = Math.round(2 + detailValue / 100 * (detailMaximum - 2));
    const thinkingNodeTarget = Math.max(2, Math.min(detailMaximum, Number(state.thinkingNodeTarget ?? state.scaffoldSettings?.thinkingNodeTarget ?? detailDefault)));
    const explorationValue = Math.max(0, Math.min(100, Number(state.explorationLevel ?? state.scaffoldSettings?.explorationLevel ?? 50)));
    const knowledgeDepth = ["foundation", "applied", "system"].includes(state.knowledgeDepth)
      ? state.knowledgeDepth
      : learnerAdaptation.inferred_support_mode === "foundation" ? "foundation"
        : learnerAdaptation.inferred_support_mode === "advanced" ? "system" : "applied";
    const explorationScope = explorationValue < 34 ? "focused" : explorationValue > 66 ? "expanded" : "balanced";
    const user = `Student input for personalised generation:
Generation fingerprint: ${state.generationFingerprint || "not provided"}
SCAFFOLD_SETTINGS:
- Thinking detail: ${detailValue}/100; target ${thinkingNodeTarget} distinct reasoning items per Thinking milestone
- Knowledge depth: ${knowledgeDepth}
- Exploration: ${explorationValue}/100 (${explorationScope})
Project/task name: ${state.selectedTaskName || "not specified"}
Project goal: ${state.projectGoal || "not specified"}
Learning content or AI output: ${state.learningContent || "not specified"}
Learning content type: ${learningTypes}
LEARNER_ADAPTATION (must affect every milestone and Thinking/Doing node):
${JSON.stringify(learnerAdaptation, null, 2)}
Uploaded file names: ${JSON.stringify(fileNames)}
Uploaded/project material text:
${String(state.projectMaterial || "not provided").slice(0, 12000)}

Existing reasoning records:
${JSON.stringify(state.records || {}, null, 2)}

STUDENT-EDITED MILESTONES (empty means generate a new plan):
${JSON.stringify(state.editedMilestones || [], null, 2)}

Generate the Learning Plan, Suggested First Step and Allow boundaries for the next screen.
Make the plan clearly connected to the student's specific project goal, uploaded material and learning content.
Treat the suggested first step as an entry point inside the learning plan, not as a separate plan.
Avoid generic steps such as "learn basics", "understand concept", "do research" or "make decision" unless the wording names exactly what the student is learning and why it matters to their project.
Keep each item very short and concrete. UI space is limited.`;

    const temperature = Number(body.state?.generationTemperature ?? 0.42);
    let content = await callDeepSeek([
      { role: "system", content: system },
      { role: "user", content: user },
    ], { temperature, max_tokens: 4200 });

    let parsed = parseJsonObject(content);
    if (!hasDecisionQualityReasoning(parsed)) {
      content = await callDeepSeek([
        { role: "system", content: system },
        { role: "user", content: `${user}\n\nREPAIR: Your previous reasoning chain contained generic learning-reflection prompts. Regenerate the full JSON. Every Thinking node must be a short, project-specific decision, condition, evidence, diagnosis, or trade-off. Do not use generic titles or generic 'what do you want to...' questions.` },
      ], { temperature, max_tokens: 4200 });
      parsed = parseJsonObject(content);
    }
    parsed = stripGenericReasoningItems(parsed);
    if (!Array.isArray(parsed.steps) || !parsed.start_from || !Array.isArray(parsed.allow)) {
      throw new Error("Invalid plan JSON");
    }
    parsed.source = parsed.source || "ai";
    send(res, 200, JSON.stringify(parsed));
  } catch (error) {
    send(res, 200, JSON.stringify(fallbackPlan(body, error)));
  }
}

function hasDecisionQualityReasoning(plan) {
  const forbidden = /\b(goal framing|learning outcome|project link|success signal|project move|learning object|learning focus|step purpose|project trigger|learning boundary|micro learn|use claim|project outcome|success evidence|decision target|specific need|project relevance|learning claim|reasoned action|success sign|first move|uncertain part|step role|result signal|scope check|next step|next action|commit)\b|what do you want to|after this step,? what do you want|why does this matter to your own project|what would show that this learning|what must .+ enable next|which part feels least certain|which example helps most now|what behaviour is now reliable|which concepts are now confirmed|what first if|what should you do next|is the mission scope clear|are you ready to commit/i;
  const chains = plan?.reasoning_chains && typeof plan.reasoning_chains === "object"
    ? Object.values(plan.reasoning_chains).flat().filter(Boolean)
    : [];
  if (!chains.length) return true;
  return chains.every((item) => {
    const text = `${item?.title || ""} ${item?.question || ""}`.trim();
    return text.length > 8 && !forbidden.test(text);
  });
}

function stripGenericReasoningItems(plan) {
  if (!plan || !plan.reasoning_chains || typeof plan.reasoning_chains !== "object") return plan;
  const forbidden = /\b(goal framing|learning outcome|project link|success signal|project move|learning object|learning focus|step purpose|project trigger|learning boundary|micro learn|use claim|project outcome|success evidence|decision target|specific need|project relevance|learning claim|reasoned action|success sign|first move|uncertain part|step role|result signal|scope check|next step|next action|commit)\b|what do you want to|after this step,? what do you want|why does this matter to your own project|what would show that this learning|what must .+ enable next|which part feels least certain|which example helps most now|what behaviour is now reliable|which concepts are now confirmed|what first if|what should you do next|is the mission scope clear|are you ready to commit/i;
  return {
    ...plan,
    reasoning_chains: Object.fromEntries(Object.entries(plan.reasoning_chains).map(([key, items]) => [
      key,
      Array.isArray(items)
        ? items.filter((item) => !forbidden.test(`${item?.title || ""} ${item?.question || ""}`))
        : items,
    ])),
  };
}

function fallbackPlan(body, error) {
  const learningTypes = Array.isArray(body.state?.learningType) ? body.state.learningType : [body.state?.learningType].filter(Boolean);
  const context = `${body.state?.projectMaterial || ""} ${body.state?.projectGoal || ""} ${body.state?.learningContent || ""}`.toLowerCase();
  const complexity = inferServerPlanComplexity(context, learningTypes);
  const project = inferServerProjectLabel(body.state || {});
  const learning = inferServerLearningLabel(body.state || {});
  const isToolStep = learningTypes.includes("Tool step") || context.includes("tool") || context.includes("step");
  const isAiOutput = learningTypes.includes("AI output") || context.includes("ai output") || context.includes("ai-generated") || context.includes("ai generated");
  const isHardware = /arduino|sensor|hardware|wiring|circuit|component|board|motor|led|breadboard/.test(context);
  const isSoftware = /software|code|coding|model|cad|rhino|grasshopper|python|javascript|arduino ide/.test(context);
  const isEvidenceHeavy = isHardware || context.includes("evidence") || context.includes("test") || context.includes("validate");
  const arduinoProfile = detectServerArduinoScaffoldProfile(context);
  const steps = [];
  if (arduinoProfile) {
    steps.push(...buildServerArduinoScaffoldSteps(arduinoProfile, project));
  } else {
    steps.push(
      {
        title: "Need analysis",
        detail: `Clarify what ${project} needs to achieve.`,
      },
      {
        title: "System breakdown",
        detail: `Split ${project} into smaller working parts.`,
      },
      {
        title: "Knowledge map",
        detail: isHardware ? "List parts, circuit, code and test gaps." : `List what ${learning} requires you to learn.`,
      },
      {
        title: isAiOutput ? "Output meaning" : isHardware ? "Part roles" : isSoftware ? "Tool logic" : "Learning object",
        detail: isAiOutput ? `Learn what the output claims for ${project}.` : isHardware ? "Learn what each part does before building." : isSoftware ? `Learn how ${learning} changes the workflow.` : `Clarify what ${learning} helps you do.`,
      },
    );
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
      detail: isHardware ? "Try one build action and explain its role." : `Map ${learning} to the project workflow.`,
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
      detail: `Compare ways ${learning} could be used.`,
    });
  }
  if (isEvidenceHeavy || isAiOutput) {
    steps.push({
      title: isHardware ? "Small test" : "Evidence check",
      detail: isHardware ? "Run a minimal test before committing." : "Use a source, example or small test.",
    });
  }
  if (complexity.target >= 10) {
    steps.push(
      {
        title: "Debug route",
        detail: "Use errors to locate the next learning gap.",
      },
      {
        title: "Integration",
        detail: `Check how ${learning} links to other project parts.`,
      },
    );
  }
  steps.push(
    {
      title: isHardware ? "Complete build" : "Adapt learning",
      detail: isHardware ? `Connect learned parts into ${project}.` : `Decide what must change for ${project}.`,
    },
    {
      title: "Learning summary",
      detail: "Save learned concepts, tests and gaps to the knowledge map.",
    },
    {
      title: "Next project move",
      detail: `Choose what to do next for ${project}.`,
    },
  );
  const stepLimit = arduinoProfile ? arduinoProfile.complexity.target : complexity.max;
  const boundedSteps = steps.slice(0, stepLimit);

  return {
    source: "fallback",
    failure_type: classifyPlanFailure(error),
    complexity: complexity.label,
    max_steps: stepLimit,
    scaffold_level: arduinoProfile?.support || "",
    difficulty: arduinoProfile?.difficulty || "",
    steps: boundedSteps,
    start_from: isAiOutput
      ? `Start by judging whether the AI output fits ${project}.`
      : isHardware
        ? `Start by checking what ${learning} enables in the hardware setup.`
        : isSoftware
          ? `Start by mapping ${learning} to the software workflow.`
          : `Start by clarifying how ${learning} supports ${project}.`,
    start_options: [
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
    ],
    allow: [
      {
        label: isToolStep ? "Guide tool step" : "Guide learning",
        detail: arduinoProfile?.support || (isToolStep ? `AI may break down ${learning}.` : "AI may structure learning steps."),
      },
      {
        label: "Ask reasoning",
        detail: `AI may ask fit questions for ${project}.`,
      },
      {
        label: isEvidenceHeavy ? "Prompt evidence" : "Prompt checks",
        detail: isEvidenceHeavy ? "AI asks for proof before use." : "AI suggests low-risk checks.",
      },
      {
        label: "Student decides",
        detail: "AI must not make the final project decision.",
      },
    ],
    stage_prompts: buildFallbackStagePrompts(body),
    reasoning_chains: buildFallbackReasoningChains(body),
    debug: error?.message,
  };
}

function classifyPlanFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("missing deepseek_api_key") || message.includes("missing api key")) return "missing_api_key";
  if (/api 401|api 403|unauthori[sz]ed|invalid.*key|incorrect.*key/.test(message)) return "invalid_api_key";
  if (/enotfound|eai_again|econnrefused|etimedout|timeout|network|socket hang up|fetch failed/.test(message)) return "network";
  return "generation_error";
}

function inferServerPlanComplexity(contextText, learningTypes = []) {
  const text = String(contextText || "").toLowerCase();
  const typeText = learningTypes.join(" ").toLowerCase();
  const combined = `${text} ${typeText}`;
  const arduinoProfile = detectServerArduinoScaffoldProfile(combined);
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

function detectServerArduinoScaffoldProfile(text) {
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

function buildServerArduinoScaffoldSteps(profile, project) {
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
    { title: "Need analysis", detail: `Clarify what ${project} should do.` },
    { title: "Minimal system", detail: "Make the smallest useful subsystem work." },
    { title: "Integrate parts", detail: "Add input, control, output or power gradually." },
    { title: "Debug + map", detail: "Use failures to update knowledge gaps." },
  ];
}

function inferServerProjectLabel(state) {
  const text = `${state.projectMaterial || ""} ${state.projectGoal || ""} ${state.learningContent || ""}`.toLowerCase();
  if ((text.includes("arduino") && /car|小车/.test(text)) || /obstacle|avoid|ultrasonic|避障|超声波/.test(text)) return "the Arduino car prototype";
  if (text.includes("led") || text.includes("呼吸灯") || text.includes("按钮")) return "the LED Arduino prototype";
  if (text.includes("arduino") || text.includes("sensor") || text.includes("hardware")) return "the hardware prototype";
  if (text.includes("reasoning coach") || text.includes("learning scaffold")) return "the reasoning coach prototype";
  if (text.includes("cad") || text.includes("rhino") || text.includes("model")) return "the modelling project";
  if (text.includes("user") || text.includes("ux")) return "the user-facing design";
  return state.projectGoal ? String(state.projectGoal).slice(0, 34) : "the project";
}

function inferServerLearningLabel(state) {
  const text = `${state.projectMaterial || ""} ${state.projectGoal || ""} ${state.learningContent || ""}`.toLowerCase();
  if (text.includes("arduino ide")) return "Arduino IDE";
  if (text.includes("arduino")) return "Arduino";
  if (text.includes("sensor")) return "sensor setup";
  if (text.includes("reasoning")) return "reasoning scaffold";
  if (text.includes("ai output") || text.includes("ai-generated") || text.includes("ai generated")) return "AI output";
  if (text.includes("cad") || text.includes("rhino")) return "modelling workflow";
  return state.learningContent ? String(state.learningContent).slice(0, 32) : "this learning content";
}

function buildFallbackStagePrompts(body) {
  const goal = body.state?.projectGoal || "the project";
  const learning = body.state?.learningContent || "the current learning content";
  return {
    goal: `Clarify the project move that ${learning} should support in ${goal}.`,
    need: `Narrow the exact learning object needed for the next project action.`,
    guide: `Break the learning object into parts the student can understand and try.`,
    reasoning: `Connect the learning to project use, fit, assumptions and evidence.`,
    practice: `Turn the learning into a small project-centred test or action.`,
    validate: `Decide what evidence is needed before relying on this learning.`,
    decision: `Compare next actions and help the student explain their own choice.`,
  };
}

function buildFallbackReasoningChains(body) {
  const goal = body.state?.projectGoal || "the project";
  const learning = body.state?.learningContent || "the learning content";
  const context = `${goal} ${learning} ${body.state?.projectMaterial || ""}`.toLowerCase();
  const hardware = /arduino|sensor|hardware|wiring|circuit|component|board|led|motor/.test(context);
  const evidence = hardware
    ? ["Small wiring test", "Datasheet", "Similar build", "Tutor check"]
    : ["Small test", "Official source", "Similar case", "Feedback"];
  const constraints = hardware
    ? ["Time", "Components", "Power/safety", "Skill"]
    : ["Time", "Resource", "Risk", "Skill"];

  return {
    goal: [
      q("outcome", "Outcome", `What should this learning help ${goal} prove or create?`, "Name one observable project outcome.", ["Prototype", "Decision", "Evidence", "User value"]),
      q("success", "Success", "What would show that the learning was useful?", "Choose the evidence you could show.", evidence),
      q("decision", "Decision focus", "Which decision will this learning support?", "Make the decision target explicit.", ["Apply", "Test first", "Change approach", "Seek evidence"]),
    ],
    need: [
      q("need", "Specific need", `Which part of "${learning}" is needed for the project?`, "Separate useful content from background.", ["Concept", "Method", "Tool step", "Evidence"]),
      q("trigger", "Trigger", "What project task made this learning necessary now?", "Connect the need to a live project moment.", ["Build", "Model", "Debug", "Justify"]),
      q("boundary", "Boundary", "How much do you need to learn before acting?", "Keep the learning scope focused.", ["Basic idea", "Enough to test", "Enough to compare", "Need advice"]),
    ],
    guide: [
      q("role", "Step role", "What does the current learning step enable?", "Explain the purpose before following it.", ["Set up", "Connect", "Read output", "Make choice"]),
      q("observe", "Observe", "What should you observe while trying it?", "Define a signal before acting.", ["Output", "Error", "Mismatch", "Response"]),
      q("unclear", "Unclear part", "What could be misunderstood if you move too fast?", "Mark the part needing explanation.", ["Cause", "Parameter", "Connection", "Use case"]),
    ],
    reasoning: [
      q("claim", "Learning claim", `What does this resource or AI output suggest you can do with ${learning}?`, "Turn the content into a claim you can judge.", ["Explains", "Enables", "Recommends", "Warns"]),
      q("relevance", "Relevance", `Why does that matter to ${goal}?`, "Connect the claim to the project task.", ["Goal", "Prototype", "User need", "Decision"]),
      q("fit", "Fit", "How much adaptation is needed before use?", "Judge project fit before action.", ["Use directly", "Adapt slightly", "Test first", "Not suitable"]),
      q("assumption", "Assumption", "What must be true for this to work?", "Identify hidden assumptions.", constraints),
      q("evidence", "Evidence", "What evidence is missing before relying on it?", "Choose what makes the decision credible.", evidence),
      q("action", "Next action", "What next action follows from this reasoning?", "Student chooses based on evidence and trade-offs.", ["Apply", "Test first", "Seek evidence", "Adjust direction"]),
    ],
    practice: [
      q("small", "Small action", "What is the smallest safe action to try?", "Convert reasoning into low-risk practice.", hardware ? ["Wire one part", "Run simple test", "Check value", "Ask advice"] : ["Mini test", "Try workflow", "Check output", "Ask advice"]),
      q("signal", "Result signal", "What result means it is worth continuing?", "Define the signal before trying.", ["Works reliably", "Partly works", "Fails clearly", "Needs change"]),
      q("risk", "Risk", "What risk should be controlled before scaling?", "Keep practice connected to constraints.", constraints),
    ],
    validate: [
      q("source", "Evidence source", "Which evidence source is strongest for this decision?", "Match evidence to the project claim.", evidence),
      q("condition", "Pass condition", "What condition must be met before use?", "Set a threshold before committing.", ["Reliable", "Safe", "Feasible", "Relevant"]),
      q("revise", "Revise trigger", "What result would make you revise direction?", "Make revision criteria explicit.", ["Weak fit", "Too risky", "Too costly", "Poor result"]),
    ],
    decision: [
      q("paths", "Two paths", "What are two realistic next paths?", "Compare before choosing.", ["Apply vs test", "Test vs evidence", "Adapt vs reject", "Ask vs proceed"]),
      q("tradeoff", "Trade-off", "What trade-off matters most?", "Balance value, evidence, constraints and learning cost.", ["Speed", "Reliability", "Risk", "Learning value"]),
      q("choice", "Student choice", "What do you choose next, and why?", "The final decision remains with the student.", ["Apply", "Test first", "Seek evidence", "Adjust direction"]),
    ],
  };
}

function q(key, title, question, hint, options) {
  return { key, title, question, hint, options };
}

function fallbackWiringReference(body = {}) {
  const context = `${body.project_goal || ""} ${body.learning_content || ""} ${body.project_material || ""} ${body.milestone_title || ""} ${body.milestone_detail || ""} ${JSON.stringify(body.wiring_context || {})}`.toLowerCase();
  const warning = "Reference only: verify your board pin labels, module voltage and datasheet before powering the circuit.";
  if (/(obstacle|avoid|wall|distance|ultrasonic|hc-sr04|hc sr04|l298n|two.?wheel|car)/.test(context) && /(motor|wheel|l298n|driver)/.test(context) && /(sensor|ultrasonic|hc-sr04|distance)/.test(context)) {
    return {
      title: "Obstacle-avoidance car wiring reference",
      purpose: "Check the full sensor-to-driver loop: distance input, motor outputs and shared power return.",
      warning: "Use an external motor battery for the L298N motor supply. Do not run DC motors from the Arduino 5V pin; join Arduino GND and driver GND before testing.",
      components: [
        { id: "uno", label: "Arduino Uno", role: "controller", type: "board", quantity: 1 },
        { id: "ultrasonic", label: "HC-SR04 ultrasonic sensor", role: "distance input", type: "sensor", quantity: 1 },
        { id: "driver", label: "L298N motor driver", role: "two-wheel drive output", type: "driver", quantity: 1 },
        { id: "motors", label: "DC gear motors", role: "left and right wheels", type: "motor", quantity: 2 },
        { id: "battery", label: "Motor battery pack", role: "driver motor supply", type: "power", quantity: 1 },
        { id: "leads", label: "Jumper leads", role: "signal and power links", type: "jumper", quantity: 1 },
      ],
      interfaces: [
        { label: "Distance sensing", detail: "Arduino powers HC-SR04 and reads ECHO after triggering TRIG. The sketch pins must match the actual TRIG and ECHO wires.", checks: ["VCC to 5V, GND to GND", "TRIG and ECHO match code"] },
        { label: "Motor driver control", detail: "Arduino sends direction signals to L298N IN1-IN4 and speed signals to ENA/ENB if PWM speed control is used.", checks: ["Left and right motor channels are not swapped", "ENA/ENB are enabled or connected to PWM pins"] },
        { label: "Motor power path", detail: "The battery pack powers L298N motor supply. Arduino GND, L298N GND and battery negative must share common ground.", checks: ["External battery is connected to driver motor input", "Common ground exists before signal testing"] },
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
  if (/six.?leg|hexapod|6.?leg/.test(context)) {
    const hasBluetooth = /bluetooth|hc-05|hc05|wireless/.test(context);
    return {
      title: "Six-leg robot control and power architecture",
      purpose: "Map the 18-servo control bus, shared power return and optional Bluetooth link before wiring one leg at a time.",
      warning: "Do not power 18 servos from the Arduino 5V pin. Use a suitably rated external servo supply, common the grounds, and verify every servo channel before full-power testing.",
      components: [
        { id: "uno", label: "Arduino Uno", role: "main controller", type: "board", quantity: 1 },
        { id: "pwm-a", label: "PCA9685 PWM expander A", role: "servo channels 1-16", type: "driver", quantity: 1 },
        { id: "pwm-b", label: "PCA9685 PWM expander B", role: "servo channels 17-18", type: "driver", quantity: 1 },
        { id: "servos", label: "Servo actuators", role: "six legs × three joints", type: "servo", quantity: 18 },
        { id: "servo-supply", label: "5-6V high-current servo supply", role: "servo power rail", type: "power", quantity: 1 },
        ...(hasBluetooth ? [{ id: "bluetooth", label: "Bluetooth module", role: "wireless command link", type: "module", quantity: 1 }, { id: "level-shifter", label: "3.3V RX level shifter", role: "protect Bluetooth RX", type: "passive", quantity: 1 }] : []),
        { id: "leads", label: "Servo and jumper leads", role: "signal and power connections", type: "jumper", quantity: 1 },
      ],
      interfaces: [
        { label: "I2C control bus", detail: "Uno A4/SDA and A5/SCL connect in parallel to both PCA9685 boards; both boards share logic GND.", checks: ["Both PCA9685 boards have different I2C addresses", "Logic VCC is separate from servo V+ rail"] },
        { label: "Servo signal allocation", detail: "PCA9685 A channels 0-15 serve 16 joints; PCA9685 B channels 0-1 serve joints 17-18. Label every leg/joint before plugging a servo.", checks: ["One channel maps to one labelled joint", "Test a single leg with the body raised"] },
        { label: "Servo power rail", detail: "External 5-6V supply feeds V+ on both PCA9685 boards and all 18 servos. Its GND must join Uno GND.", checks: ["Supply current rating covers servo stall load", "No servo power is drawn from Uno 5V"] },
        ...(hasBluetooth ? [{ label: "Bluetooth serial link", detail: "HC-05 TXD goes to Uno D2 (software RX). Uno D3 (software TX) reaches HC-05 RXD through a 3.3V level shifter or divider.", checks: ["Bluetooth RX is not driven directly at 5V", "Serial pins match the sketch"] }] : []),
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
  if (/servo|leg/.test(context)) {
    return {
      title: "Arduino Uno + micro servo test",
      purpose: "Test one servo before repeating the same connection pattern for more legs.", warning,
      components: [
        { id: "uno", label: "Arduino Uno", role: "controller", type: "board", quantity: 1 },
        { id: "servo", label: "Micro servo", role: "actuator", type: "servo", quantity: 1 },
        { id: "supply", label: "5V servo supply", role: "power", type: "power", quantity: 1 },
        { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 3 },
      ],
      connections: [
        { from_component: "uno", from_pin: "D9", to_component: "servo", to_pin: "PWM", type: "signal" },
        { from_component: "supply", from_pin: "+5V", to_component: "servo", to_pin: "V+", type: "power" },
        { from_component: "supply", from_pin: "GND", to_component: "servo", to_pin: "GND", type: "ground" },
        { from_component: "uno", from_pin: "GND", to_component: "supply", to_pin: "GND", type: "ground" },
      ],
    };
  }
  if (/motor|wheel|drive|l298n|tb6612/.test(context)) {
    return {
      title: "Arduino motor-driver check",
      purpose: "Check the control path and common ground before a first motor test.", warning,
      components: [{ id: "arduino", label: "Arduino Uno", role: "control", type: "board", quantity: 1 }, { id: "driver", label: "L298N driver", role: "drive", type: "driver", quantity: 1 }, { id: "motor", label: "DC motor", role: "output", type: "motor", quantity: 1 }, { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 5 }],
      connections: [
        { from_component: "arduino", from_pin: "D5", to_component: "driver", to_pin: "IN1", type: "signal" },
        { from_component: "arduino", from_pin: "D6", to_component: "driver", to_pin: "IN2", type: "signal" },
        { from_component: "driver", from_pin: "OUT1 / OUT2", to_component: "motor", to_pin: "motor leads", type: "output" },
        { from_component: "arduino", from_pin: "GND", to_component: "driver", to_pin: "GND", type: "ground" },
      ],
    };
  }
  if (/pir/.test(context)) {
    return {
      title: "PIR sensor check",
      purpose: "Check sensor power and one output signal before testing motion.", warning,
      components: [{ id: "arduino", label: "Arduino Uno", role: "control", type: "board", quantity: 1 }, { id: "pir", label: "PIR sensor", role: "input", type: "sensor", quantity: 1 }, { id: "output", label: "LED / buzzer", role: "output", type: "output", quantity: 1 }, { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 3 }],
      connections: [
        { from_component: "arduino", from_pin: "5V", to_component: "pir", to_pin: "VCC", type: "power" },
        { from_component: "arduino", from_pin: "GND", to_component: "pir", to_pin: "GND", type: "ground" },
        { from_component: "pir", from_pin: "OUT", to_component: "arduino", to_pin: "D2", type: "signal" },
      ],
    };
  }
  if (/sensor|ultrasonic|hc-sr04|distance/.test(context)) {
    return {
      title: "Distance sensor check",
      purpose: "Check power, ground and the two signal lines before observing distance values.", warning,
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
    title: "Arduino output check",
    purpose: "Use one small circuit to check the path from board output to physical response.", warning,
    components: [{ id: "arduino", label: "Arduino Uno", role: "control", type: "board", quantity: 1 }, { id: "resistor", label: "220 Ω resistor", role: "limit current", type: "resistor", quantity: 1 }, { id: "led", label: "LED", role: "output", type: "led", quantity: 1 }, { id: "leads", label: "Jumper leads", role: "connections", type: "jumper", quantity: 3 }],
    connections: [
      { from_component: "arduino", from_pin: "D9", to_component: "resistor", to_pin: "input", type: "signal" },
      { from_component: "resistor", from_pin: "output", to_component: "led", to_pin: "anode", type: "signal" },
      { from_component: "led", from_pin: "cathode", to_component: "arduino", to_pin: "GND", type: "ground" },
    ],
  };
}

function wiringContextText(body = {}) {
  return `${body.project_goal || ""} ${body.learning_content || ""} ${body.project_material || ""} ${body.milestone_title || ""} ${body.milestone_detail || ""} ${JSON.stringify(body.wiring_context || {})}`.toLowerCase();
}

function isObstacleCarContext(context) {
  return /(obstacle|avoid|wall|distance|ultrasonic|hc-sr04|hc sr04|l298n|two.?wheel|car)/.test(context)
    && /(motor|wheel|l298n|driver)/.test(context)
    && /(sensor|ultrasonic|hc-sr04|distance)/.test(context);
}

function isSixLegRobotContext(context) {
  return /six.?leg|hexapod|6.?leg/.test(context);
}

function hasComponentLike(components, pattern) {
  return components.some((component) => pattern.test(`${component.id} ${component.label} ${component.role} ${component.type}`.toLowerCase()));
}

function normaliseWiringReference(data, body) {
  const components = Array.isArray(data?.components) ? data.components.slice(0, 12).map((item, index) => ({
    id: String(item?.id || `part-${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, ""),
    label: String(item?.label || item?.name || `Part ${index + 1}`).slice(0, 40),
    role: String(item?.role || "module").slice(0, 28),
    type: String(item?.type || "component").slice(0, 24),
    quantity: Math.max(1, Math.min(24, Number(item?.quantity) || 1)),
  })) : [];
  const ids = new Set(components.map((component) => component.id));
  const connections = Array.isArray(data?.connections) ? data.connections.slice(0, 28)
    .filter((item) => ids.has(String(item?.from_component || "")) && ids.has(String(item?.to_component || "")))
    .map((item) => ({
      from_component: String(item.from_component), from_pin: String(item.from_pin || "").slice(0, 28),
      to_component: String(item.to_component), to_pin: String(item.to_pin || "").slice(0, 28),
      type: ["power", "ground", "signal", "output"].includes(String(item.type).toLowerCase()) ? String(item.type).toLowerCase() : "signal",
    })) : [];
  if (components.length < 2 || !connections.length) return fallbackWiringReference(body);
  const context = wiringContextText(body);
  if (isObstacleCarContext(context)) {
    const hasFullCarLoop = hasComponentLike(components, /hc-?sr04|ultrasonic|distance/)
      && hasComponentLike(components, /l298n|motor driver|driver/)
      && hasComponentLike(components, /dc gear|dc motor|motor/)
      && hasComponentLike(components, /battery|supply|power/)
      && connections.some((connection) => /ground/.test(connection.type));
    if (!hasFullCarLoop) return fallbackWiringReference(body);
  }
  if (isSixLegRobotContext(context)) {
    const hasFullServoArchitecture = hasComponentLike(components, /pca9685|pwm expander/)
      && hasComponentLike(components, /servo/)
      && hasComponentLike(components, /supply|battery|power/)
      && connections.some((connection) => /sda|scl|i2c/i.test(`${connection.from_pin} ${connection.to_pin}`));
    if (!hasFullServoArchitecture) return fallbackWiringReference(body);
  }
  return {
    title: String(data?.title || body.milestone_title || "Reference wiring").slice(0, 70),
    purpose: String(data?.purpose || "Check one connection at a time before building.").slice(0, 160),
    warning: String(data?.warning || "Confirm labels and voltage requirements against the datasheet for your own modules.").slice(0, 180),
    interfaces: Array.isArray(data?.interfaces) ? data.interfaces.slice(0, 5).map((item) => ({
      label: String(item?.label || "Interface check").slice(0, 48),
      detail: String(item?.detail || "").slice(0, 260),
      checks: Array.isArray(item?.checks) ? item.checks.slice(0, 3).map((check) => String(check).slice(0, 120)) : [],
    })) : [],
    components, connections,
  };
}

async function handleWiringReference(req, res) {
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
    const system = `You create a compact wiring-reference specification for a Design Engineering student who is building a real hardware prototype.

Always write in English. Use only components, goals and details named or strongly implied by the supplied project context. This is a reference to support checking, never a final build instruction. Do not invent a board, module model, voltage or pin mapping unless it is present in the input. If exact pins are unknown, use descriptive labels such as "chosen digital pin" and say what the student must verify.

You must use the supplied full learning plan, current step index, checklist status and saved reasoning. The wiring reference should match the current Doing milestone, but it must still preserve the wider project architecture when the milestone depends on other subsystems. For example, an obstacle-avoidance car motor-test reference should include Arduino Uno, HC-SR04, L298N, two DC motors, battery pack and common ground if those are in the project context, because the motor loop and distance threshold will later connect.

Return JSON only in exactly this structure:
{
  "title":"short project-specific reference title",
  "purpose":"one sentence explaining the exact milestone check this supports",
  "warning":"one concise safety or verification boundary",
  "components":[{"id":"short-id","label":"component name","role":"short role","type":"board|sensor|servo|motor|led|resistor|actuator|driver|power|passive|jumper|module","quantity":1}],
  "interfaces":[{"label":"named subsystem interface","detail":"specific signal, power or communication relationship","checks":["check one","check two"]}],
  "connections":[{"from_component":"component id","from_pin":"pin or terminal","to_component":"component id","to_pin":"pin or terminal","type":"power|ground|signal|output"}]
}

Rules:
- First infer the scale and subsystem architecture of the whole project, then draw the relevant milestone interface. Include the specific controller, expanders/drivers, power system, communication modules, sensors and repeated actuators implied by the context. Use 3-12 components and 3-28 connections. Use the most specific component type possible: for example PCA9685 PWM expander instead of generic driver.
- Use the previous plan steps and saved reasoning to decide which components are genuinely needed now. Do not simplify a real multi-component build into a single generic servo, motor or sensor if the user's project needs driver boards, power modules, sensors or communication modules.
- For Arduino obstacle-avoidance car context, include at minimum: Arduino board, ultrasonic sensor if named, motor driver if named, two DC motors if a two-wheel car is implied, battery/motor supply, common ground, and the control pins/interfaces that must match the code.
- Use a specific board or module label only when it appears in the context. When Arduino Uno appears, retain its real label and show actual pin names such as D9, 5V and GND only when the supplied context supports them.
- For repeated elements, state the real project quantity and use grouped pin ranges in connections, for example "PCA9685 A CH0-CH15 → servos 1-16". Do not reduce a six-leg robot to one servo when the milestone depends on its eventual architecture.
- When a design requires more channels or current than an Arduino Uno can safely supply, include the required PWM expansion or external power subsystem and say why in an interface check. Never show a many-servo load connected to the Uno 5V pin.
- Group the reference into 2-5 named interfaces (control bus, actuator channels, power, communications, sensing) so a student can check the system one subsystem at a time.
- The component ids used by each connection must exactly match ids in components.
- Make the connections specific to this project's current milestone and supplied checklist.
- Never claim a circuit is safe or complete.
- When context mentions a user-uploaded image or an uncertain physical build, recommend comparison with the actual module labels rather than guessing.`;
    const user = `PROJECT GOAL: ${body.project_goal || "not provided"}
LEARNING CONTENT: ${body.learning_content || "not provided"}
TASK: ${body.task_name || "not provided"}
MILESTONE: ${body.milestone_title || "not provided"}
MILESTONE DETAIL: ${body.milestone_detail || "not provided"}
CHECKLIST: ${JSON.stringify(body.checklist || [])}
WIRING CONTEXT FROM APP:
${JSON.stringify(body.wiring_context || {}, null, 2).slice(0, 9000)}
PROJECT MATERIAL: ${String(body.project_material || "not provided").slice(0, 9000)}
LEARNER PROFILE: ${String(body.learner_profile || "not provided").slice(0, 1600)}`;
    const content = await callDeepSeek([{ role: "system", content: system }, { role: "user", content: user }], { temperature: 0.18, max_tokens: 820 });
    send(res, 200, JSON.stringify(normaliseWiringReference(parseJsonObject(content), body)));
  } catch (error) {
    send(res, 200, JSON.stringify(fallbackWiringReference(body)));
  }
}

function fallbackCoach(body, error) {
  const stage = body.stage || body.step || "Reasoning Build";
  const stageKey = String(stage).toLowerCase();
  const projectGoal = body.state?.projectGoal || "the project goal";
  const learningContent = body.state?.learningContent || "the current learning content";
  const context = body.reasoningContext || {};
  if (body.userAction === "ask_coach_on_demand") {
    const support = String(context.support_context || "project making").toLowerCase();
    const isLearnRequest = context.help_type === "learn";
    const target = context.target_check?.text || stage;
    const description = String(context.user_description || "").toLowerCase();
    let coach = "Please add a clear photo, screenshot, code snippet or specific symptom so I can diagnose this accurately.";
    let guidedActions = [];
    let videoResource = null;
    if (support.includes("modelling")) {
      coach = `For ${target}, first isolate the exact geometry or command that is failing. A screenshot with the selected object and visible command history will let me give a reliable next operation.`;
      guidedActions = [
        { location: "Model view", action: "Select only the geometry involved in this operation." },
        { location: "Command history", action: "Capture the last command, settings and any warning." },
      ];
      if (isLearnRequest) videoResource = { title: "Model operation reference", youtube_query: `${learningContent} modelling software tutorial`, reason: "Use a short visual demonstration, then repeat the operation on your own model." };
    } else if (support.includes("hardware") || support.includes("electronics")) {
      coach = `For ${target}, verify the module labels and power path before changing the circuit. A sharp top-down photo showing the board labels and wire ends will let me check the connection against your actual build.`;
      guidedActions = [
        { location: "Component labels", action: "Read each pin label directly from the physical module." },
        { location: "Power path", action: "Trace power and ground from the source to the current component." },
      ];
      if (isLearnRequest) videoResource = { title: "Hardware setup reference", youtube_query: `${learningContent} Arduino wiring tutorial`, reason: "Use this only to orient yourself, then verify every pin against your own module labels." };
    } else if (support.includes("mechanical")) {
      coach = `For ${target}, identify where the structure moves, carries load or collides before changing the design. A photo or sketch with the joint and load direction marked will make the next check specific.`;
      guidedActions = [
        { location: "Moving joint", action: "Mark the intended direction and range of movement." },
        { location: "Contact points", action: "Check for interference at both ends of the motion." },
      ];
      if (isLearnRequest) videoResource = { title: "Mechanism reference", youtube_query: `${learningContent} mechanical mechanism design tutorial`, reason: "Use a visual example to compare motion and clearance with your own mechanism." };
    } else if (support.includes("code")) {
      coach = `For ${target}, share the smallest code section and the exact error or unexpected output. I can then focus on the line or behaviour that blocks this milestone.`;
      guidedActions = [
        { location: "Error output", action: "Copy the complete error message or observed output." },
        { location: "Smallest example", action: "Paste only the function or block related to this behaviour." },
      ];
      if (isLearnRequest) videoResource = { title: "Code operation reference", youtube_query: `${learningContent} programming tutorial`, reason: "Use the visual walkthrough to understand the operation before applying it to this task." };
    }
    if (description && description !== "no description provided") {
      coach = `${coach} Your note was: ${String(context.user_description).slice(0, 180)}`;
    }
    return normaliseOnDemandCoachResponse({
      label: "Coach support",
      stage,
      coach,
      guided_actions: guidedActions,
      video_resource: videoResource,
      record_update: `Student requested support for ${target}.`,
      debug: error?.message,
    });
  }
  if (body.userAction === "reasoning_step_completed") {
    const node = context.current_node?.title || "the current reasoning node";
    return {
      label: `${node} note`,
      stage,
      note_needed: false,
      coach_note_type: "",
      coach_note: "",
      next_check: "",
      options: [],
      rationale_hint: "",
      missing_evidence: [],
      possible_paths: [],
      record_update: `Student saved a judgement for ${node}.`,
      coach: "",
      debug: error?.message,
    };
  }
  if (stage === "Decision") {
    return {
      label: "Decision boundary",
      stage,
      coach: "Before deciding, compare at least two possible paths. I can help structure the comparison, but the final project decision should remain yours.",
      question: `Which path better fits ${projectGoal}: testing ${learningContent} first, or seeking more evidence before using it?`,
      options: ["Test first", "Seek more evidence", "Adjust the direction"],
      rationale_hint: "My decision is... because the project goal, evidence and trade-offs suggest...",
      missing_evidence: ["small test result", "source or example", "constraint check"],
      possible_paths: ["test first", "seek evidence", "adjust direction"],
      record_update: "AI suggested possible paths; student still needs to confirm, revise or reject the judgment.",
      debug: error?.message,
    };
  }
  return {
    label: `${stage} judgment`,
    stage,
    coach: "This step has made one small judgment visible. Keep it tied to your project goal, evidence and constraints before moving on.",
    question: `What would make this ${learningContent} step clearer for ${projectGoal}?`,
    options: ["It supports the project goal", "It partly fits but needs adaptation", "I need more evidence"],
    rationale_hint: "This matters to my project because...",
    missing_evidence: stageKey.includes("validate") ? ["small test or credible source"] : [],
    possible_paths: [],
    record_update: "Student should explain how the learning content connects to project context before moving forward.",
    debug: error?.message,
  };
}

function normaliseTaskRecordGuidance(data = {}, body = {}) {
  const actionKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const actionSimilarity = (left, right) => {
    const a = new Set(actionKey(left).split(" ").filter((word) => word.length > 2));
    const b = new Set(actionKey(right).split(" ").filter((word) => word.length > 2));
    if (!a.size || !b.size) return 0;
    const intersection = [...a].filter((word) => b.has(word)).length;
    return intersection / Math.max(a.size, b.size);
  };
  let actions = Array.isArray(data.actions) ? data.actions.slice(0, 3).map((item) => ({
    type: String(item?.type || "Next").slice(0, 18),
    title: String(item?.title || "Run one focused check").slice(0, 88),
    reason: String(item?.reason || "Use the saved task evidence to make the next action observable.").slice(0, 220),
  })).filter((item) => item.title) : [];
  const unfinished = Array.isArray(body.student_work)
    ? body.student_work.find((entry) => entry?.status !== "Completed")
    : null;
  const selectedNextAction = String(body.selected_next_action || "").trim();
  if (selectedNextAction) {
    const existing = actions.find((item) => actionSimilarity(item.title, selectedNextAction) >= 0.78);
    actions = [
      {
        type: existing?.type || "Continue",
        title: selectedNextAction.slice(0, 88),
        reason: existing?.reason || "This is the continuation selected by the student from the generated options.",
      },
      ...actions.filter((item) => item !== existing && actionSimilarity(item.title, selectedNextAction) < 0.78),
    ].slice(0, 3);
  }
  return {
    conclusion: String(data.conclusion || body.student_decision?.choice || "The task record captures the student's current project outcome and chosen continuation.").slice(0, 320),
    summary: String(data.summary || `Continue from ${unfinished?.title || "the last saved milestone"} using the recorded evidence.`).slice(0, 280),
    actions: actions.length ? actions : [{
      type: "Continue",
      title: `Complete one observable check in ${unfinished?.title || "the current milestone"}`,
      reason: "Keep the next session small enough to verify with a visible result, screenshot or measurement.",
    }],
    evidence_to_capture: String(data.evidence_to_capture || "Save one photo, screenshot or measurement from the next test.").slice(0, 180),
    decision_to_revisit: String(data.decision_to_revisit || "Revisit the current route only when new evidence contradicts the saved rationale.").slice(0, 180),
  };
}

async function handleTaskRecordGuidance(req, res) {
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
    const system = `You are the end-of-task reflection agent in an AI-supported learning scaffold for Design Engineering students.

Always write in English. Turn the student's actual saved task record into a compact next-session plan. This is not a generic project summary and not a new tutorial.

Use only evidence in the supplied record: completed or unfinished milestones, checklist status, saved photos/screenshots, the student's own reasoning, chosen next move, and any recorded evidence. Do not claim that an image proves something unless its status says a photo check passed. Do not invent component details, test results, or student decisions.

Your role is to help the student resume practical project work. Preserve student ownership: describe recommendations as possible next actions, never as decisions already made by the student.

Return JSON only in exactly this shape:
{
  "conclusion":"a grounded 1-2 sentence synthesis of what the student established, built, tested or decided, maximum 45 words",
  "summary":"one grounded 1-2 sentence summary of where the work currently stands, maximum 55 words",
  "actions":[
    {"type":"Build|Test|Decide|Review","title":"one concrete action, maximum 12 words","reason":"why it is the next useful action based on the saved record, maximum 28 words"}
  ],
  "evidence_to_capture":"one concrete photo, screenshot, measurement or comparison to save next",
  "decision_to_revisit":"one specific condition that should trigger revisiting a decision"
}

Rules:
- Provide exactly 2 or 3 actions in a sensible order: normally one build/test action, then evidence, then a decision or review boundary when appropriate.
- When selected_next_action is supplied, preserve it as the first action and ground the conclusion and remaining recommendations around it.
- The conclusion must distinguish completed evidence from unfinished or unverified work.
- The first action must continue the most relevant incomplete milestone when one exists.
- If the student saved prototype photos or screenshots, explicitly use them as existing evidence; do not ask to recreate them.
- Keep each action immediately doable in one working session.
- Do not ask questions. Do not include encouragement or generic theory.`;
    const user = `TASK_RECORD:\n${JSON.stringify(body, null, 2)}`;
    const content = await callDeepSeek([{ role: "system", content: system }, { role: "user", content: user }], { temperature: 0.24, max_tokens: 560 });
    let parsed = {};
    try {
      parsed = parseJsonObject(content);
    } catch {
      parsed = { summary: content };
    }
    send(res, 200, JSON.stringify(normaliseTaskRecordGuidance(parsed, body)));
  } catch (error) {
    send(res, 200, JSON.stringify(normaliseTaskRecordGuidance({}, body)));
  }
}

function normaliseRecordRevision(data = {}, body = {}) {
  return {
    message: String(data.message || "I tightened the record while keeping the student's decision and evidence unchanged.").slice(0, 220),
    outcome: String(data.outcome || body.current_outcome || "").slice(0, 320),
    next_action: String(data.next_action || body.current_next_action || "").slice(0, 220),
  };
}

async function handleRecordRefine(req, res) {
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
    const system = `You edit a Design Engineering student's task learning record with them.

Always write in English. Treat the student's saved decisions, reasoning and evidence as authoritative. Never invent a completed test, result, component, constraint or decision. The student remains the author: propose a revision and wait for them to apply it.

Use the edit request and recent conversation to revise only two fields:
- outcome: a concise statement of what the student established, built, tested or decided; maximum 45 words.
- next_action: one concrete continuation grounded in unfinished work or saved evidence; maximum 24 words.

If the request conflicts with the saved record, preserve the evidence and briefly explain the boundary in message. Do not add theory, praise or follow-up questions.

Return JSON only:
{
  "message":"one short explanation of the proposed edit, maximum 28 words",
  "outcome":"revised task outcome",
  "next_action":"revised next action"
}`;
    const user = `TASK_RECORD_AND_EDIT_REQUEST:\n${JSON.stringify(body, null, 2)}`;
    const content = await callDeepSeek([{ role: "system", content: system }, { role: "user", content: user }], { temperature: 0.22, max_tokens: 420 });
    let parsed = {};
    try {
      parsed = parseJsonObject(content);
    } catch {
      parsed = { message: content };
    }
    send(res, 200, JSON.stringify(normaliseRecordRevision(parsed, body)));
  } catch (error) {
    send(res, 200, JSON.stringify(normaliseRecordRevision({ message: "The revision could not be generated. Check the API connection and try again." }, body)));
  }
}

function normaliseNextMoveGuidance(data = {}, body = {}) {
  const selected = String(body.selected_move || "the selected route");
  return {
    summary: String(data.summary || `You selected ${selected}. Use the reasoning and practical checks already saved to make that route observable before extending the build.`).slice(0, 420),
    next_action: String(data.next_action || "Run one focused check and save the observed result.").slice(0, 150),
    missing_condition: String(data.missing_condition || "Confirm the current milestone has enough evidence to continue.").slice(0, 150),
  };
}

async function handleNextMove(req, res) {
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
    const system = `You are the next-move synthesis agent in an AI-supported learning scaffold for Design Engineering students.

Always write in English. The student has already selected their own next move. Do not make a decision for them, ask a question, introduce a new option, or give generic praise. Use only the supplied project context, saved Thinking records, Doing checks and selected move.

Write one compact, project-specific explanation of why the selected move makes sense at this point, naming the most relevant saved reasoning or practical check when available. Then give one practical next action that the student can perform now. If an essential condition is still missing, state it briefly.

Return JSON only:
{
  "summary":"1-2 sentences, maximum 65 words",
  "next_action":"one executable action, maximum 18 words",
  "missing_condition":"one optional verification boundary, maximum 18 words"
}`;
    const user = `NEXT_MOVE_CONTEXT:\n${JSON.stringify(body, null, 2)}`;
    const content = await callDeepSeek([
      { role: "system", content: system },
      { role: "user", content: user },
    ], { temperature: 0.18, max_tokens: 300 });
    send(res, 200, JSON.stringify(normaliseNextMoveGuidance(parseJsonObject(content), body)));
  } catch (error) {
    send(res, 200, JSON.stringify(normaliseNextMoveGuidance({}, body)));
  }
}

function normaliseDecisionCheck(data = {}) {
  const fallback = {
    evidence: { status: "missing", summary: "Save one relevant test result before committing further.", options: ["Evidence saved", "Need evidence"] },
    constraint: { status: "attention", summary: "Check that the next move fits your available time, materials and build scope.", options: ["Manageable", "Needs adaptation"] },
    risk: { status: "attention", summary: "Keep the next test small enough to revise safely if it does not work.", options: ["Low for this test", "Mitigate first"] },
  };
  return ["evidence", "constraint", "risk"].reduce((result, key) => {
    const item = data[key] || {};
    result[key] = {
      status: ["ready", "missing", "attention"].includes(item.status) ? item.status : fallback[key].status,
      summary: String(item.summary || fallback[key].summary).slice(0, 190),
      options: Array.isArray(item.options) && item.options.length
        ? item.options.map((option) => String(option).slice(0, 42)).filter(Boolean).slice(0, 2)
        : fallback[key].options,
    };
    return result;
  }, {});
}

async function handleDecisionCheck(req, res) {
  let body = {};
  try {
    body = JSON.parse(await readBody(req));
    const system = `You are a decision-readiness agent in an AI-supported learning scaffold for Design Engineering students.

Always write in English. Inspect only the supplied project context, saved Thinking records and Doing checks. Generate one short, concrete pre-decision check for each category: evidence, constraint and risk. These are not questions and must not introduce general theory.

The evidence check should say what has or has not been demonstrated. The constraint check should name one relevant practical limit. The risk check should identify one risk that can be reduced by the next small action. Use compact language and avoid claiming tests passed unless the supplied records explicitly show that.

Return JSON only:
{
  "evidence":{"status":"ready|missing|attention","summary":"maximum 26 words","options":["two short confirmation labels"]},
  "constraint":{"status":"ready|missing|attention","summary":"maximum 26 words","options":["two short confirmation labels"]},
  "risk":{"status":"ready|missing|attention","summary":"maximum 26 words","options":["two short confirmation labels"]}
}`;
    const content = await callDeepSeek([
      { role: "system", content: system },
      { role: "user", content: `DECISION_CHECK_CONTEXT:\n${JSON.stringify(body, null, 2)}` },
    ], { temperature: 0.16, max_tokens: 360 });
    send(res, 200, JSON.stringify(normaliseDecisionCheck(parseJsonObject(content))));
  } catch (error) {
    send(res, 200, JSON.stringify(normaliseDecisionCheck()));
  }
}

async function handleRuntimeSettings(req, res) {
  try {
    const body = JSON.parse(await readBody(req));
    const nextKey = String(body.api_key || "").trim();
    if (!nextKey) {
      send(res, 400, JSON.stringify({ ok: false, message: "Missing API key" }));
      return;
    }
    API_KEY = nextKey;
    const visionKey = String(body.vision_api_key || "").trim();
    if (visionKey) VISION_API_KEY = visionKey;
    send(res, 200, JSON.stringify({ ok: true, hasApiKey: Boolean(API_KEY), hasVisionKey: Boolean(VISION_API_KEY), model: API_MODEL }));
  } catch (error) {
    send(res, 500, JSON.stringify({ ok: false, message: error.message || "Could not update settings" }));
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }
  if (req.method === "POST" && req.url === "/api/coach") {
    handleCoach(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/wiring-reference") {
    handleWiringReference(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/visual-check") {
    handleVisualCheck(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/code-check") {
    handleCodeCheck(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/screenshot-check") {
    handleScreenshotCheck(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/plan") {
    handlePlan(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/task-record-guidance") {
    handleTaskRecordGuidance(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/record-refine") {
    handleRecordRefine(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/next-move") {
    handleNextMove(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/decision-check") {
    handleDecisionCheck(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/extract-file") {
    handleExtractFile(req, res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/settings") {
    handleRuntimeSettings(req, res);
    return;
  }
  if (req.method === "GET" && req.url === "/api/status") {
    send(res, 200, JSON.stringify({
      ok: true,
      provider: "DeepSeek compatible",
      model: API_MODEL,
      hasApiKey: Boolean(API_KEY),
      planEndpoint: "/api/plan",
      taskRecordGuidanceEndpoint: "/api/task-record-guidance",
      recordRefineEndpoint: "/api/record-refine",
      nextMoveEndpoint: "/api/next-move",
      decisionCheckEndpoint: "/api/decision-check",
      coachEndpoint: "/api/coach",
      wiringReferenceEndpoint: "/api/wiring-reference",
      visualCheckEndpoint: "/api/visual-check",
      codeCheckEndpoint: "/api/code-check",
      screenshotCheckEndpoint: "/api/screenshot-check",
      visionAvailable: Boolean(VISION_API_KEY),
    }));
    return;
  }
  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }
  send(res, 405, "Method not allowed", "text/plain; charset=utf-8");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Reasoning Coach running at http://127.0.0.1:${PORT}`);
});
