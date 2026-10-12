# Research and Design Notes

This document summarises the research rationale, prompt architecture, feedback dimensions, scoring rubric, and reasoning rules used by Reasoning Coach. It is derived from the viva presentation and checked against the Version 4 implementation.

## Research aim

Reasoning Coach was designed to help design engineering students translate external learning resources and AI-generated outputs into reasoned project decisions. Its contribution is an interaction model that places focused AI support around consequential project decisions while keeping direction, action, and revision with the learner.

The project addresses three recurring problems:

- weak connection between AI guidance and practical project work;
- interaction burden from long question sequences and open-text responses;
- limited learner ownership when the system frames the next move too early.

## Evidence-to-design chain

| Evidence | Design implication |
| --- | --- |
| Learning was usually triggered by an immediate project need. | Start from the active task rather than a generic curriculum sequence. |
| Resources had to be adapted to project goals and conditions. | Ask about relevance, constraints, and project fit before use. |
| AI was useful for explanation and technical problem solving. | Keep help contextual, optional, and bounded. |
| Learners wanted important choices to remain their own. | Separate AI suggestions from learner judgement and final action. |
| Tests, technical information, and feedback helped assess a direction. | Connect each consequential decision to a practical Check and preserve its outcome. |
| Records and skill views supported continuation and review. | Save decisions, evidence, next actions, and skill links in a stable Knowledge Map. |

## Core prompt architecture

The implementation uses two main prompt roles.

### 1. Planning agent

The planning agent turns project context into a compact learning-to-action pathway. Its core instruction is:

> Generate a personalised learning-to-decision scaffold from the student's actual input. Help the student learn enough to reason and decide; do not provide the final technical solution.

Inputs include project material, goal, task name, learning content, learner profile, self-rated skills, prior reasoning records, Thinking detail, and Exploration level.

Its operational rules are:

- create 3-5 editable milestones according to project complexity;
- include at least one practical Doing milestone with 3-5 observable checklist items;
- use Thinking only for a real judgement with an immediate project consequence;
- ground questions in real project objects, behaviours, interfaces, constraints, tests, or failure modes;
- mix micro-learning, teach-back, exploration, practical testing, evidence checking, and decision support;
- keep visible questions under 12 words and avoid repetitive reflection prompts;
- adapt support to relevant skills rather than treating confidence in one domain as confidence in all domains;
- use analysis tools only when they remove a real uncertainty;
- end with evidence capture, integration, review, or a Knowledge Map update.

### 2. Coach agent

The Coach responds after the learner saves a reasoning node. Its core instruction is:

> First decide whether a note would change the learner's next project action. If not, return no note. If it would, identify one missing assumption, constraint, evidence need, trade-off, consequence, or safety risk.

The response contract is intentionally narrow:

| Field | Rule |
| --- | --- |
| `note_needed` | False when the learner's choice and reason are already sufficient or low-stakes. |
| `coach_note_type` | Exactly one of `verify`, `risk`, or `consequence`. |
| `coach_note` | One statement, maximum 26 words; no praise, tutorial, restatement, or question. |
| `next_check` | One executable, observable action, maximum 16 words; include the object and expected signal when possible. |
| `options` | Always empty for a reasoning-step comment; the note must not create a new choice. |
| final decision | Always remains with the learner. |

On-demand coaching is different: it is triggered explicitly by the learner, uses the supplied screenshot, code, error, physical symptom, and checklist status, and stays focused on the immediate issue.

## Reasoning guidance model

Each Thinking milestone deepens one live judgement in this order when relevant:

1. **Meaning** - what the concept, method, or option enables in the current task.
2. **Condition** - the relevant requirement, assumption, limitation, dependency, or trade-off.
3. **Grounded move** - the smallest evidence check, comparison, or next action that follows.

Across milestones, the system uses this judgement-action rhythm:

1. Locate a live design or technical uncertainty.
2. Surface the condition, dependency, constraint, or trade-off.
3. Identify the smallest observable check or evidence source.
4. Let the learner commit to a bounded next action.
5. Return to Doing, evidence capture, integration, or review.

## Feedback dimensions

Coach feedback is organised around six practical dimensions:

| Dimension | Feedback focus |
| --- | --- |
| Project relevance | Is the reasoning tied to the actual goal, object, user condition, or current task? |
| Assumptions | What must be true for the selected route to work? |
| Constraints and dependencies | Which material, time, safety, interface, skill, or system condition shapes the choice? |
| Evidence and criteria | What observable result, threshold, source, or test would support the decision? |
| Trade-offs and consequences | What is gained, lost, or made more difficult by the selected route? |
| Next action | What is the smallest executable move that can advance or challenge the judgement? |

These dimensions guide feedback; they are not used to let the AI grade or approve the learner's final design choice.

## Decision-evidence rubric

The formative evaluation used a 1-5 specificity rating across five retrospective coding dimensions. The presentation reports the dimensions and final-record means; it does not define verbal anchors for every scale point.

| Coding dimension | What is inspected | Final-record mean | Interpretation reported in the study |
| --- | --- | ---: | --- |
| Project goal | A clear link between the decision and the project purpose or active task. | 3.4 | Strongest project link. |
| Next action | A concrete, project-linked action that follows from the judgement. | 3.2 | More specific. |
| Constraints | Relevant requirements, limitations, or dependencies that condition the decision. | 2.4 | Still partial. |
| Evidence / test | A test, result, criterion, or relevant source that can support or challenge the decision. | 2.2 | Criteria need strengthening. |
| Trade-off | An explicit account of competing benefits, costs, risks, or priorities. | 2.2 | Rarely stated. |

All five participants' final records had higher total specificity scores than their initial records. The strongest gains were in project connection and next action. The main design implication was to prompt more explicitly for evidence criteria and trade-offs so that records remain reviewable.

## Adaptive controls

Three controls change the amount and type of support without changing learner ownership:

- **Thinking detail (0-100):** from the core judgement, condition, and next check to deeper dependencies, integration effects, and failure conditions.
- **Exploration (0-100):** from the immediate task to relevant alternatives, risks, trade-offs, and overlooked project links.
- **Knowledge depth:** foundation support foregrounds just-enough principles and safety checks; applied support connects concepts to project conditions; advanced support foregrounds system dependencies and validation strategy.

Doing milestones remain practical at every setting.

## Formative evaluation and claim boundary

The research process combined 65 valid questionnaire responses, 7 semi-structured interviews, iterative prototyping, and moderated testing with 5 design engineering students. Participants completed a shared robot-car/code task and a task from their own project.

The evidence supports these claims:

- participants understood and completed the main workflow;
- project decisions became more inspectable within the session;
- bounded AI notes could widen consideration or suggest a practical check while preserving learner control;
- records became more specific about project connection, evidence, and next action.

The current study does not establish long-term learning gains, transfer across projects, independent use over a full project cycle, superiority over ordinary AI chat, or broad technical checking accuracy. Later prototype revisions also require further participant testing.

