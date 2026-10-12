<img width="1457" height="805" alt="截屏2026-10-12 05 35 43" src="https://github.com/user-attachments/assets/f99d29f1-2c11-4dee-8877-cde02e5d8fdd" /># Reasoning Coach

Reasoning Coach is an AI-supported, adaptive learning-to-decision scaffold for higher-education design engineering. It helps students turn project material, external learning resources, and AI-generated outputs into project-specific decisions that can be checked through practical evidence.

The central design position is simple: **the learner answers first, AI adds one focused note only when it can improve the next action, and the learner keeps the final decision.**
1
## Why this project exists

Generative AI can make explanations and possible solutions available very early in a project. That speed is useful, but it can compress the learner's own comparison, judgement, testing, and revision. Reasoning Coach keeps AI support attached to the active project while preserving the student's cognitive responsibility.

The research question behind the prototype is:

> How can an AI-supported learning scaffold help design engineering students make project-specific, reasoned decisions during independent learning?

## Design requirements

The prototype is based on seven requirements derived from a questionnaire and follow-up interviews:

1. Ground support in the active project.
2. Preserve learner ownership.
3. Create a clear learning pathway.
4. Help at the point of need.
5. Keep interaction lightweight.
6. Preserve reasoning and evidence.
7. Make skill development visible.

## How it works

| Stage | System behaviour | Learner responsibility |
| --- | --- | --- |
| Project entry | Uses project material, the current goal, the learning need, and the learner profile to generate editable milestones. | Define the project context and choose a feasible starting point. |
| Reasoning chain | Presents short, project-specific judgement prompts and optional analysis tools. | Make a choice and give a short project-linked reason. |
| Coach note | Adds at most one bounded note about a missing assumption, constraint, evidence need, trade-off, consequence, or safety risk. | Decide whether the note changes the next move. |
| Doing and Check | Connects an action to required evidence, checking criteria, and a visible result. | Build, test, measure, upload evidence, and revise when needed. |
| Record and Knowledge Map | Preserves the decision, rationale, evidence, next action, and developing skills. | Review, edit, and continue the project. |

The interaction follows a recurring rhythm:

`live uncertainty -> relevant condition -> smallest observable check -> learner-owned action -> evidence and review`
<img width="1262" height="651" alt="截屏2026-10-12 05 38 59" src="https://github.com/user-attachments/assets/5469aecc-138b-4c54-987c-d46ad5c885dd" />


## AI guidance rules

- Generate Thinking prompts only for a consequential choice, condition, evidence judgement, diagnosis, risk, or trade-off.
- Use Doing steps for building, configuring, testing, measuring, and integrating.
- Ground every prompt in the student's actual project, material, tool, or constraint.
- Teach only the minimum concept needed for the next project action.
- Adapt depth to the learner profile without exposing or stereotyping a learner level.
- Keep Coach Notes optional, concise, and non-conversational.
- Never choose, approve, or reject the student's final project action.
- Preserve provenance: distinguish learner decisions from AI suggestions.

The implementation supports radar, two-axis, and morphological analysis only when they resolve a real project uncertainty. Full planning and coaching rules are documented in [Research and Design Notes](docs/research-and-design.md) and implemented in [`src/server.js`](src/server.js).

## Formative evaluation

The design was developed through an explanatory sequential mixed-methods process:

- 65 valid questionnaire responses identified broad learning patterns and barriers.
- 7 semi-structured interviews explained project fit, AI use, learner control, and evidence practices.
- 5 design engineering students completed moderated prototype sessions using a shared task and their own projects.
- All 5 participants completed the main path from project context to task record.
- All 5 final decision records received higher specificity scores than their initial records.

The five retrospective coding dimensions were project goal, next action, constraints, evidence/test, and trade-off. The current evidence supports the workflow and the inspectability of reasoning records; it does not establish long-term learning gains, transfer across projects, superiority over general AI chat, or broad AI checking accuracy.

## Run the source

Requirements: Node.js 18 or later and a DeepSeek API key.

```bash
export DEEPSEEK_API_KEY="your-key"
node src/server.js
```

Then open [http://localhost:4888](http://localhost:4888).

Optional visual checks use an OpenAI-compatible vision endpoint:

```bash
export VISION_API_KEY="your-key"
export VISION_MODEL="gpt-4.1-mini"
```

## macOS build

The packaged macOS 4 build is available from the repository's **Releases** page. It requires macOS 12 or later.

## Repository structure

```text
src/                         Browser interface and local Node.js service
src/documents/               Example project context material
docs/research-and-design.md  Research basis, prompt rules, and evaluation rubric
```

## Research scope

This repository contains a functional research prototype. The reported evaluation was formative, based on short moderated sessions with a small convenience sample. Post-evaluation design changes require further participant testing.

