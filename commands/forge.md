---
description: Research deeply, interview the user, then forge a structured TDD-first spec with alternating TEST-IMPL task pairs per feature phase. This is a persistent planning workflow.
disable-model-invocation: true
---

# Forge a Spec (TDD)

You are about to run the Spec Mint TDD HTML forge workflow. This bypasses plan mode
with something far more thorough: deep research -> interview -> more research
-> more interview -> write spec -> review.

The forge workflow never produces application code. Its only outputs are
`.specs/` files: research notes, interview notes, and the SPEC.html.

Every spec produced by this workflow uses test-driven development: tasks
alternate TEST-IMPL within each feature phase (true red-green-refactor).

The user's request: $ARGUMENTS

## Preflight: Resolve Spec Identity

Before starting research, resolve spec identity:

1. Generate a spec ID from the user's request (lowercase, hyphenated)
2. Collision-check read-only:
   - Check `.specs/<spec-id>/SPEC.html`
   - Check whether `<spec-id>` exists in `.specs/registry.md`
3. If the ID already exists, stop and ask the user to choose one:
   - **Resume** existing spec
   - **Rename** new spec (suggest `<spec-id>-v2`)
   - **Archive** old spec then recreate
4. Use this resolved `<spec-id>` in all later phases.

## Plan Mode Check

Before starting, check if you're in plan mode (read-only).

- If in plan mode:
  - Do not run `/specmint-tdd-html:forge` in plan mode
  - Ask the user to exit plan mode (Shift+Tab), then rerun `/specmint-tdd-html:forge`
  - Stop here until plan mode is exited
- If NOT in plan mode:
  - Create/initialize `.specs/<spec-id>/` before the first write
  - Persist artifacts as each phase completes

## Setup (before research)

Before starting research, ensure the directory structure exists:

1. Reuse the already-resolved `<spec-id>` from Preflight.
2. Create the spec directory and the shared assets directory:
   ```
   mkdir -p .specs/<spec-id> .specs/assets
   ```
3. **Refresh the shared assets.** Copy `spec-styles.css` and
   `spec-runtime.js` from the plugin's bundled `assets/` directory into
   `.specs/assets/`, **overwriting any existing files**. The runtime is
   plugin-managed and never hand-edited; overwriting on every forge
   ensures existing projects pick up rendering fixes (Mermaid
   initialization, click-to-fullscreen diagram modal, code highlighting,
   RGR-phase derivation). For Claude Code plugins the source path is
   typically `~/.claude/plugins/specmint-tdd-html/assets/`. These files
   are shared by every spec in the project.
4. If `.specs/registry.md` doesn't exist, initialize it with the header row.

If directory creation fails because the environment is still read-only, ask
the user to exit plan mode (Shift+Tab) and rerun `/specmint-tdd-html:forge`.

## Phase 1: Deep Research

This is the most important phase. Be exhaustive. You are gathering every
piece of context needed to write a spec that won't need revision mid-build.

### 1a. Codebase Research

Scan the project thoroughly. Don't just grep for keywords — understand the
architecture:

- **Project structure**: Map the directory tree, identify patterns (monorepo?
  modules? packages?)
- **Tech stack**: Read package.json/Cargo.toml/go.mod/requirements.txt etc.
  Understand what's already in use
- **Related code**: Find every file, function, component, route, model, and
  test that touches the area the user wants to change
- **Patterns**: How does the existing code handle similar things? If adding
  auth, how is the existing middleware structured? If adding a feature, what
  patterns do similar features follow?
- **Tests**: What testing frameworks are used? What's the test coverage like
  in the relevant area?
- **Test infrastructure**: Analyze the full test setup — frameworks (Jest,
  Vitest, pytest, Go testing, JUnit), Docker and testcontainers usage,
  coverage tools (Istanbul, c8, coverage.py, go cover), test runners and
  configuration, CI test pipeline, fixture and factory patterns, mocking
  libraries (msw, nock, unittest.mock, gomock), snapshot testing, test
  database setup and teardown
- **Config**: Environment variables, build config, CI/CD pipelines that
  might be affected
- **Dependencies**: What libraries are relevant? Are there version
  constraints?

Use Glob, Grep, and Read aggressively. Read actual file contents, not just
file names. Open 10-20 files if needed.

**Always spawn the `specmint-tdd-html:researcher` agent** (Task tool) to run an
exhaustive parallel research pass. The researcher reads 15-30 files, runs
3+ web searches, compares library candidates, and assesses risks. Save
structured findings to `.specs/<id>/research-01.md`. Don't skip this —
thorough research is the foundation of a spec that won't need revision
mid-build.

### 1b. Context7 & Cross-Skill Research (in parallel with researcher)

While the researcher agent runs, do these yourself — they use MCP tools
that the researcher agent doesn't have access to:

- **Context7**: If available (resolve-library-id / query-docs tools), pull
  up-to-date documentation for 2-5 key libraries involved. Check API changes,
  deprecated features, and recommended patterns for the specific versions.
  Also pull docs for testing libraries relevant to the project (Vitest, Jest,
  pytest, testcontainers, Playwright, Testing Library, etc.) to ensure test
  code follows current best practices.
- **Cross-skill loading**: Load other available skills when relevant:
  - **frontend-design**: For UI-heavy features — creative, professional design
  - **datasmith-pg**: For database work — schema design, migrations, indexing
  - **webapp-testing**: Always load for TDD specs — Playwright patterns,
    testing strategy, test architecture guidance
  - **vercel-react-best-practices**: For Next.js/React optimization
  - Any other relevant skill that's available

### 1c. UI Research (if applicable)

If the project has a UI and the changes affect it:

- Take screenshots of current state if browser tools are available
- Map the component hierarchy
- Understand the routing and state management
- Research modern UI patterns for the specific use case
- Look at design references for creative, professional approaches
- Note accessibility requirements (WCAG compliance)

### 1d. Merge & Save Research

When the researcher agent completes, read its output. Merge your Context7
and cross-skill findings into the research notes. Write the combined
findings to:
```
.specs/<spec-id>/research-01.md
```

Structure it clearly:

```markdown
# Research Notes — <Title>
## Date: <today>

## Project Architecture
<what you found about the structure>

## Relevant Code
<key files, functions, patterns found>

## Tech Stack & Dependencies
<what's in use, versions>

## Test Infrastructure
<testing frameworks, test runners, configuration files, coverage tools,
Docker/testcontainers setup, mocking libraries, fixture patterns,
CI test pipeline, existing test conventions and naming patterns,
test database setup/teardown approach>

## Library Comparison
<comparison tables for any libraries evaluated, with recommended picks>

## External Research
<web findings, library docs, best practices, Context7 findings>

## UI Research (if applicable)
<screenshots, component map, design references, accessibility notes>

## Risk Assessment
<what could go wrong, security considerations, performance implications>

## Open Questions
<things you couldn't determine from research alone>
```

## Phase 2: Interview Round 1

Now present your findings and ask targeted questions. The goal is NOT to ask
generic questions — your research should inform very specific questions.

**Structure the interview like this:**

1. **Summarize what you found** (2-3 paragraphs, not a wall of text)
2. **State your assumptions** — "Based on the codebase, I'm assuming we'll
   use X pattern because that's what similar features use. Correct?"
3. **Ask specific questions** that your research couldn't answer:
   - Architecture decisions: "Should this be a new module or extend the
     existing one in src/features/?"
   - Scope boundaries: "Should this handle X edge case or is that a
     separate spec?"
   - Technical choices: "I see you're using Library A for similar things.
     Should we stick with that or is there a reason to try Library B?"
   - User-facing behavior: "What should happen when X fails?"
   - Acceptance criteria: "What does 'done' look like? Any specific
     conditions that must be true when this is complete?"
   - **Mockup fidelity (only if UI work is in scope)**: "Mockups in this
     spec should render as `wireframe` (clean grayscale boxes, structural,
     no design commitment), `hi-fi` (real-looking polished components), or
     `none` (prose + diagrams are enough)?" Record the answer for the
     `mockup-fidelity` field in spec-meta JSON.
4. **Ask testing-specific questions** (2-3 probes):
   - "I found <framework> for testing. Do you want to stick with it or
     switch to something else? Any preferences for test runner config?"
   - "For services that depend on <database/service>, should we use
     testcontainers with real containers or mocks? Which services need
     real containers vs lightweight mocks?"
   - "What's your mocking approach preference — mock only at external
     boundaries, or also mock internal modules? Any opinions on
     msw/nock/similar for HTTP mocking?"
   - "Do you have a coverage target in mind (e.g., 80% line coverage)?
     Any interest in mutation testing (Stryker/mutmut) for critical paths?"
5. **Propose a rough approach** and ask for reactions — don't wait for the
   user to design everything

Keep it to 5-8 questions max per round (including testing questions). More
than that overwhelms.

**STOP after asking your questions and wait for the user to answer.** Do not
answer your own questions, guess answers, or proceed to deeper research or
spec writing until the user responds. The interview is a real conversation —
the user's answers determine what gets built.

**Save the interview:**
```
.specs/<spec-id>/interview-01.md
```

```markdown
# Interview Round 1 — <Title>
## Date: <today>

## Questions Asked
1. <question>
   **Answer**: <user's response>

2. <question>
   **Answer**: <user's response>

## Key Decisions
- <decision made during this interview>

## New Research Needed
- <things to look into based on answers>
```

## Phase 3: Deeper Research (informed by interview)

Based on the user's answers, do another round of research:

- Explore the specific code paths they mentioned
- Look up the libraries or patterns they chose
- Check feasibility of the approach discussed
- Find potential issues with the chosen direction
- Research the testing approach they prefer (testcontainers setup, mock
  library docs, coverage tool configuration)

Save to:
```
.specs/<spec-id>/research-02.md
```

## Phase 4: Interview Round 2+

Present your deeper findings. Ask about:

- Trade-offs you discovered
- Edge cases that emerged from the deeper research
- Implementation sequence — "I'd suggest building X first because Y depends
  on it. Does that sequence make sense?"
- Scope refinement — "This feels like it could be split into two specs.
  Want to keep it together or separate?"
- Task pairing — "Here's how I'd pair TEST-IMPL tasks within each
  feature phase — each pair is one red-green-refactor cycle..."

Save each round to `interview-02.md`, `interview-03.md`, etc.

**Repeat phases 3-4 as many times as needed.** The loop ends when:

- You have enough clarity to write a spec with no ambiguous tasks
- The user says they're satisfied with the direction
- Every task in the spec can be described concretely (not "figure out X")
- The TEST-IMPL task pairing is clear for every feature

It's fine if this takes 2 rounds or 5 rounds. Don't rush it.

## Phase 5: Write the Spec

Now synthesize everything — all research notes, all interview answers, all
decisions — into a `SPEC.html`.

**Start from the canonical template** at `references/html-template.html` —
copy it to `.specs/<spec-id>/SPEC.html` and fill in every placeholder. Use
`references/edit-recipes.md` for the exact HTML structure of each element
(TEST-IMPL pair, TDD log entry, diagram, code-diff, mockup). Reference
`references/testing-knowledge.md` for testing framework decisions.

The spec must include:

1. **`<script id="spec-meta">` JSON metadata**: single-line JSON in canonical
   key order (`id`, `title`, `status`, `created`, `updated`, `priority`,
   `tags`, `mockup-fidelity`). Use the `mockup-fidelity` answer from the
   interview.
2. **Spec header card** with TDD chip (`<span class="pill pill--info pill--no-dot">TDD</span>`),
   status pill, priority chip, dates, tags, and a four-cell scorecard
   (Tasks / RGR cycles / Acceptance / Current TDD phase).
3. **Overview**: 2-4 sentences capturing the goal and scope. Mention that
   this spec follows TDD methodology.
4. **Acceptance Criteria**: `<li class="ac-item" data-status="pending">`
   testable conditions. Specific and verifiable. Include one criterion of
   the form "Every behavior above has a corresponding red-green-refactor
   cycle recorded in the TDD Log." Use
   `<span class="ac-flag">Needs clarification</span>` for unresolved questions.
5. **Architecture Diagram(s)**: Mermaid diagrams (`<pre class="mermaid">`).
   Every non-trivial spec should have at least one. Pick the right type:
   `flowchart` for system flow, `sequenceDiagram` for request lifecycles,
   `erDiagram` for data models, `stateDiagram-v2` for state machines.
   Mermaid is the only recommended path — no ASCII required.
6. **Testing Architecture**: Five sub-tables — Test Framework & Tools,
   Isolation Strategy, Coverage Targets, Test Commands, plus an
   Anti-Patterns list.
7. **Library Choices**: `<table class="table">` comparing evaluated
   libraries with rationale.
8. **Phases**: Major milestones grouped by feature area. Each phase is a
   `<details class="phase" open data-status="...">` containing interleaved
   TEST-IMPL task pairs wrapped in `<li class="task-pair">`. **No separate
   TEST and IMPL phases.** No `(TEST)` or `(IMPL)` suffixes on phase names.

   **WRONG — separate TEST and IMPL phases (most common forge violation):**
   - "Phase 1: Tests for Auth (TEST)" with only TEST tasks
   - "Phase 2: Implement Auth (IMPL)" with only IMPL tasks

   **RIGHT — feature-named phases with interleaved TEST-IMPL pairs:**
   - "Phase 1: Auth Foundation" containing `[TEST-AUTH-01]`, `[IMPL-AUTH-02]`,
     `[TEST-AUTH-03]`, `[IMPL-AUTH-04]` alternating

   Use the RIGHT pattern. Always.
9. **Tasks**: Two types alternating within each phase, wrapped together in
   a `<li class="task-pair">`:

   **TEST tasks** — `<li class="task task--test" data-task="TEST-XX-NN" data-status="pending">`:
   - File path where the test will be written
   - Test descriptions (what each test asserts)
   - Isolation strategy (containers, mocks, in-memory)
   - Optional `<span class="task__rgr task__rgr--red">RED</span>` badge

   **IMPL tasks** — `<li class="task task--impl" data-task="IMPL-XX-NN" data-status="pending">`:
   - What production code to write, where (file path, function/class names)
   - `→ satisfies <code>[TEST-XX-NN]</code>` reference

   Numbering is continuous across all phases (TEST-AUTH-01, IMPL-AUTH-02,
   TEST-AUTH-03, IMPL-AUTH-04...). See `references/edit-recipes.md` for the
   exact HTML structure.

10. **Code Previews**: `<figure class="code-diff">` blocks with PrismJS
    `language-diff-LANG diff-highlight`. **Expected on every feature
    spec** (only skip for pure research / docs specs). Include **one
    canonical figure per category** — not every instance:
    - The signature/contract of each new public interface, exported
      function, class, or API endpoint
    - The shape of each new data model, schema, or migration
    - Non-trivial business logic where the body itself matters
    - The "before → after" of each refactor or significant signature
      change that captures a design decision
    - One canonical test per new test pattern (the shape, not every
      test body — full bodies live in TEST tasks during /implement)

    Skip boilerplate, repeated identical patterns (show one, note the
    rest follow), codegen output / formatted JSON / build artifacts,
    and the full test bodies that will be written during RED phases.

    Sizing: small spec (1-2 phases) → 2-4 previews; medium (3-5
    phases) → 4-8; large (6+ phases across API + DB + UI) → 8-15.
    TDD specs run slightly leaner than core because the TEST-IMPL
    task list and Testing Architecture section carry some of the
    weight. A spec that produces many changes but ships only 1-2
    previews has missed the point — surface the most important deltas.

    Unified diff by default; `data-view="split"` for changes >30 lines,
    multi-hunk, or where the before/after comparison itself is the point.
11. **UI Mockups**: One or more `<figure class="mockup">` blocks per the
    chosen `mockup-fidelity`. Omit the entire section if fidelity is `none`.

    **MUST compose from the `.wf-*` (wireframe) or `.ui-*` (hi-fi)
    component classes in `assets/spec-styles.css`.** Read
    `references/wireframe-library.md` or `references/mockup-library.md`
    before authoring — both contain canonical patterns (App shell, Form,
    Table page, Modal, Card grid, Dashboard, Empty state, etc.).

    **Never use ASCII art inside `<figure class="mockup">`** — no boxes
    drawn with `+`, `|`, `-`; no pipe-delimited tables; no monospace
    pseudo-diagrams. For grids use `.wf-table` (`style="--cols: N;"`)
    or hi-fi `.ui-table` patterns. For cards use `.wf-card`. Compose
    new structure from primitives if needed — do not fall back to ASCII.
12. **TDD Log**: Empty region — filled during implementation as cycles
    close. Each entry is a `<article class="tdd-cycle">` with three lanes
    (Red / Green / Refactor).
13. **Decision Log**: Initially populated with key decisions from the
    interviews, including TDD-specific choices (test framework selection,
    isolation strategy, coverage targets).
14. **Deviations**: Empty at forge time; filled during implementation.

**Coherence and logic review (mandatory before presenting):**

Before presenting the spec to the user, review it for coherence and logic:

1. Read through the entire spec as a whole — does it tell a coherent story?
2. Check that phases are in logical dependency order — no phase requires
   work from a later phase
3. **CRITICAL: Verify phases group by FEATURE, not by test-vs-impl.** A
   phase named "Tests for X" or "Implement X" or with a `(TEST)`/`(IMPL)`
   suffix is WRONG. Phases must be named by feature area (e.g., "Auth
   Foundation", "Heatmap Aggregation") with alternating TEST-IMPL tasks
   inside. If any phase contains only TEST tasks or only IMPL tasks,
   restructure it now before presenting.
4. **Verify every IMPL task immediately follows its TEST task** and
   references it via `-> satisfies [TEST-XX-NN]`
5. **Verify every TEST task has a following IMPL task** — no orphan tests
6. Verify every task is concrete and actionable (file paths, function names)
7. Confirm the architecture diagram matches the task descriptions
8. Check that the testing strategy covers all feature tasks
9. Verify library choices are consistent throughout (no conflicting picks)
10. Ensure the overview accurately summarizes what the phases will deliver
11. Look for gaps — is there anything the implementation would need that
    isn't covered by a task?
12. Verify acceptance criteria are specific, testable, and cover the key
    behaviors the user expects
13. **Placeholder check**: Search the spec for "TBD", "TODO", "placeholder",
    "TBC", "to be determined", "will be decided", "figure out" — replace
    every instance with a concrete decision or remove the section
14. **Internal consistency**: Verify task count in overview matches actual
    tasks, all task code references are valid, `-> satisfies` references
    point to existing TEST tasks, library versions don't conflict
15. **Scope check**: Compare the spec against the interview answers — does
    it deliver what was discussed? Nothing more, nothing less?
16. **Ambiguity check**: For each task, ask "could an implementer complete
    this without asking me a question?" If no, add detail until yes.

**Quality check before presenting:**

- Every task should be concrete ("Add verifyToken() to src/auth/tokens.ts"),
  not vague ("implement token verification")
- Phases should have clear boundaries and dependencies
- TEST tasks should be self-contained — all test files and assertions
  specified, no ambiguity about what "failing" means
- IMPL tasks should be minimal — just enough code to make tests pass
- The Decision Log should capture every non-obvious choice
- The Overview should be understandable without reading the interviews
- Architecture diagrams should be clear and accurate
- UI designs should be creative, sleek, and professional — not generic
- Library choices should be the best available, modern, well-maintained

Save to:
```
.specs/<spec-id>/SPEC.html
```

**Run the validate recipe** (`references/validate.md`) to confirm the file
parses cleanly (JSON + region pairing).

**Then run the browser validator — required gate, not optional.** Serve
`.specs/<id>/` (e.g., `python3 -m http.server` in that dir or open the
file in a browser), open DevTools console, run `await specmintValidate()`,
and **fix every `[mermaid]` error before presenting**. The validator
surfaces Mermaid parse failures (source preserved on `data-mermaid-source`
of the failing `<pre>` — read it, fix per the Mermaid rules in SKILL.md,
reload, re-validate), duplicate task codes, missing recommended regions
(including `testing` and `tdd-log`), IMPL tasks missing `satisfies`
references, and HTML-entity contamination. A spec with any
`figure.diagram--error` is not ready to present.

Then update `.specs/registry.md` (set status to `active`).

**Present the spec to the user and wait for approval.** Walk through the
phases (highlighting the TEST-IMPL task pairs and any UI mockups) and ask:
"Does this look right? Want to adjust anything before we start?" Open the
file in a browser if convenient — the rendered HTML is the deliverable.
Do not begin implementing until the user explicitly says to proceed.

After user approval, implementation is handled by `/specmint-tdd-html:implement`.
Do not implement application code inside `/specmint-tdd-html:forge`.
