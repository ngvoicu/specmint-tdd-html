# Spec Mint TDD HTML

[![Version](https://img.shields.io/badge/version-3.0.0-7c5cff)](https://github.com/ngvoicu/specmint-tdd-html)

**Plan mode, but actually good — with strict test-driven development.**

Spec Mint TDD HTML enforces strict TDD in AI coding workflows. Every task starts with a failing test, no production code ships without red tests, and all tests are isolated. Specs have feature phases with alternating TEST-IMPL task pairs (true red-green-refactor per pair), a Testing Architecture section, and a TDD Log audit trail proving discipline was followed.

Works with Claude Code, Codex, Cursor, Windsurf, Cline, Gemini CLI, and any AI coding tool that can read files — installed as a universal skill.

**[→ See a rendered SPEC.html](https://specmint.io/#gallery)** on specmint.io — Rate Limit Middleware exemplar with paired TEST-IMPL task cards, RGR swimlane TDD Log, and the full Testing Architecture section.

## The Problem

Every AI coding tool has some version of "plan mode" — think before you code. But these plans are ephemeral and they don't enforce testing discipline. There's no way to:

- **Resume** a plan you were halfway through implementing
- **Switch** between multiple plans when juggling features
- **Track** which tasks are done and which are next
- **Persist** the research and decisions that informed the plan
- **Enforce TDD** — write tests first, then implement, then refactor
- **Prove discipline** — audit trail of red-green-refactor cycles

Spec Mint TDD HTML fixes all of this.

## How It Works

### The Forge Workflow

Say "forge a spec for adding user authentication with OAuth" and Spec Mint TDD HTML takes over:

**1. Deep Research** — Exhaustive codebase scan (reads 10-20+ actual files, not just file names), web search for best practices, Context7 library docs, library comparisons, cross-skill research (frontend-design, datasmith-pg, etc.), **test infrastructure analysis** (existing frameworks, runners, mocking patterns, testcontainers, coverage tools). Everything saved to `.specs/<id>/research-01.md`.

**2. Interview** — Presents findings, states assumptions, asks targeted questions informed by the research. Not generic questions — specific ones like "I see you're using Express middleware pattern X in `src/middleware/`. Should the auth middleware follow the same pattern?" Plus **testing-specific questions**: framework preferences, isolation strategies, coverage targets, testcontainers usage. Saves answers to `interview-01.md`.

**3. Deeper Research** — Investigates the specific directions from the interview. Checks feasibility, finds edge cases, validates testing approach.

**4. More Interviews** — As many rounds as needed until every task in the spec can be described concretely. No ambiguous "figure out X" tasks.

**5. Write Spec** — Synthesizes all research and interviews into a comprehensive `SPEC.html` with Mermaid architecture diagrams, **Testing Architecture** (framework, isolation strategy, coverage targets, test commands, anti-patterns), library comparison tables, **feature phases with paired TEST-IMPL tasks** (true red-green-refactor), `[TEST-XX-NN]` / `[IMPL-XX-NN]` codes, optional wireframe/hi-fi UI mockups, an empty **TDD Log** rendered as RGR swimlanes, a decision log, and a deviations table. Runs a coherence review — including verifying every IMPL task immediately follows its TEST task — and the post-edit validator before presenting.

**6. Implement** — Works through the spec task by task during implementation, enforcing strict red-green-refactor: write test, run it (must fail), write minimum code, run test (must pass), refactor, run test (must still pass). Every transition is logged in the TDD Log.

### Specs Are Files

Specs live in `.specs/` at your project root. Each spec is a single `SPEC.html` file — rich rendering (Mermaid diagrams, syntax-highlighted code diffs, TEST-IMPL pair cards, RGR swimlane TDD log, derived progress + Current TDD phase scorecard) backed by a strict template that AI tools can edit surgically. The `registry.md` index and the research/interview notes stay as markdown.

```
.specs/
├── assets/
│   ├── spec-styles.css             # Shared design system (written once)
│   └── spec-runtime.js             # Progress deriver + Mermaid/Prism init + RGR phase derivation
├── registry.md                     # Denormalized index — markdown table
└── user-auth-system/
    ├── SPEC.html                   # The spec (rich HTML; Testing Architecture + TDD Log)
    ├── research-01.md              # Initial codebase + web + test infra research
    ├── interview-01.md             # First interview round (incl. testing decisions)
    ├── research-02.md              # Follow-up research
    └── interview-02.md             # Second interview round
```

**The `<script id="spec-meta">` JSON inside `SPEC.html` is authoritative for identity. `data-status` attributes on tasks/phases/AC items carry lifecycle state. `data-tdd-phase` on IMPL tasks carries RGR state. Progress strings, RGR cycle counts, and the "Current TDD phase" badge are derived at render time — never stored.** `.specs/registry.md` is a denormalized index for quick lookups across specs.

### A SPEC.html Looks Like This (Sketch)

The screenshot above is a real `SPEC.html` rendered in a browser. The structure at a glance:

- **Header card**: title, status pill, priority chip, created/updated dates, tags, scorecard (Tasks / RGR Cycles / Acceptance / Current TDD phase)
- **Overview** + **Acceptance Criteria** with custom-styled checkboxes
- **Architecture**: one or more `<pre class="mermaid">` blocks rendered as diagrams (flowcharts, sequence, state, ER)
- **Testing Architecture**: framework & tools, isolation strategy, coverage targets, test commands, anti-patterns
- **Library Choices**: clean table with versions, alternatives, rationale
- **Phases & Tasks**: each phase a collapsible `<details>` with status border; tasks alternate TEST (red left border) / IMPL (green left border) as paired `task-pair` cards with `→ satisfies [TEST-XX-NN]` cross-refs
- **Code Previews**: `<figure class="code-diff">` blocks with red/green syntax-highlighted diffs (PrismJS `diff-highlight`)
- **Decision Log**: styled table
- **TDD Log**: one `<article class="tdd-cycle">` per completed cycle, 3 lanes (RED / GREEN / REFACTOR) with monospace test output
- **Deviations**: styled table

The skill ships a canonical empty template at `references/html-template.html`, edit recipes for every common operation (including `data-tdd-phase` swaps and appending TDD Log entries) at `references/edit-recipes.md`, plus mockup pattern libraries (`wireframe-library.md` + `mockup-library.md`).

### The TDD Structure

Spec Mint TDD HTML enforces test-first discipline at every level of the spec:

| Aspect | How Spec Mint TDD HTML handles it |
|--------|------------------------------|
| Phase structure | **Feature phases** with interleaved TEST-IMPL task pairs |
| Task ordering | **TEST-IMPL alternating**: red-green-red-green per pair |
| Task codes | `[TEST-AUTH-01]` and `[IMPL-AUTH-02]` |
| Task linking | IMPL tasks have `-> satisfies [TEST-XX-NN]` |
| Implementation | **Write test (RED), run, implement (GREEN), refactor** |
| Test execution | **Mandatory at every RED-GREEN-REFACTOR transition** |
| Testing Architecture | **Full Testing Architecture**: framework, isolation, coverage, commands, anti-patterns |
| Audit trail | **TDD Log** with red/green/refactor output per cycle |
| Resume context | File paths, next step, **last cycle, TDD phase** |
| Research | Codebase + web + **test infrastructure analysis** |
| Interviews | Feature questions + **testing preferences** |
| Blocking rule | **Per-task**: no IMPL until its TEST is done and failing |
| Test claims | **Must run actual tests** — no "tests would pass" |

## Installation

Spec Mint TDD HTML installs as a **universal skill** — one command, and it works in Claude Code, Codex, Cursor, Windsurf, Cline, Gemini CLI, and any AI coding tool that reads files.

```bash
# Install globally (recommended)
npx skills add ngvoicu/specmint-tdd-html -g

# Or target a specific tool with -a
npx skills add ngvoicu/specmint-tdd-html -g -a claude-code
npx skills add ngvoicu/specmint-tdd-html -g -a codex
npx skills add ngvoicu/specmint-tdd-html -g -a cursor
npx skills add ngvoicu/specmint-tdd-html -g -a windsurf
npx skills add ngvoicu/specmint-tdd-html -g -a cline
npx skills add ngvoicu/specmint-tdd-html -g -a gemini
```

Once installed, the skill auto-triggers on natural language — "forge a spec for X", "what was I working on?", "implement the spec". No slash commands and no marketplace: the skill bundles the full spec workflow, the deep-research subagent brief (`references/researcher.md`), and the spec format reference.

> **Windsurf**: replace the symlink at `.windsurf/skills/specmint-tdd-html/SKILL.md` with a real file copy — Cascade doesn't follow symlinks.

## Usage

Talk to your AI tool in plain language — the skill recognizes the spec lifecycle and runs the right workflow:

| Goal | Say something like |
|------|--------------------|
| Start a new spec | "forge a spec for user authentication" |
| Implement it (red-green-refactor) | "implement the spec" · "implement phase 2" · "red green refactor" · "run the tests" |
| Resume where you left off | "what was I working on?" · "resume" |
| Pause and save context | "pause the spec" |
| Switch active spec | "switch to the api-refactor spec" |
| List all specs | "list my specs" |
| Show progress | "spec status" |
| Generate API docs | "generate openapi" |

Every action reads and writes plain files under `.specs/` — research notes, interviews, `SPEC.html`, and a `registry.md` index. Any tool that can read files shares the same `.specs/` directory, so you can forge in one tool and implement in another.

## The TDD Cycle

This is the core of Spec Mint TDD HTML. Each TEST-IMPL task pair is one red-green-refactor cycle:

```
[TEST-AUTH-01] Write test for JWT verify
  → Write test file
  → RUN tests → FAIL (RED) ✓
  → Log red output

[IMPL-AUTH-02] Implement JWT verify -> satisfies [TEST-AUTH-01]
  → Write MINIMUM code to pass
  → RUN tests → PASS (GREEN) ✓
  → Log green output
  → REFACTOR: clean up
  → RUN tests → STILL PASS ✓
  → Log refactor changes

[TEST-AUTH-03] Write test for token refresh    ← next cycle starts
  → ...
```

Then the next pair, and the next, and the next. True red-green-red-green.

### Rules

- **Per-task blocking.** Each IMPL task cannot start until its TEST task is done and tests are confirmed failing.
- **3 runs per cycle.** Tests MUST be run via Bash at every RED, GREEN, and REFACTOR transition. Claims like "tests would pass" are never acceptable.
- **Tests are sacred.** Tests define expected behavior. During GREEN, if tests fail, fix the production code — never modify test assertions to match what the code returns. The only reason to touch a test is an actual bug (wrong import, syntax error). If a test expectation seems wrong, STOP and ask the user.
- **Self-check before every task.** Am I about to write code without a failing test? Am I about to skip running tests? Am I about to modify a test to make it pass? If yes, stop and correct.

## The Forge Workflow (Detailed)

### Phase 1: Deep Research

Not a quick scan. The researcher reads 10-20+ files, following dependency chains, checking tests, examining config. Uses every available resource: web searches for best practices, Context7 for library docs, library comparisons, cross-skill research (frontend-design, datasmith-pg, etc.).

**Test infrastructure analysis** is a dedicated research track. The researcher examines:
- Existing test frameworks, runners, and configuration
- Mocking patterns and libraries in use
- Testcontainers setup (if any)
- Coverage tooling and thresholds
- Test directory structure and naming conventions
- CI/CD test pipeline configuration

Output saved to `.specs/<id>/research-01.md`. Covers:
- Project architecture and directory structure
- Every file touching the area of change
- Tech stack versions (from lock files, not guesses)
- How similar features are currently implemented
- Library comparisons (2-3+ candidates per choice point)
- **Test infrastructure and patterns**
- Risk assessment
- UI/UX research and design references (if applicable)

### Phase 2-4: Interviews

Targeted questions based on what research found. Not generic "what do you want?" — specific questions like:

- "I see rate limiting middleware at `src/middleware/rateLimit.ts`. Should auth endpoints use the same limiter or a stricter one?"
- "The User model uses Prisma. Should OAuth tokens go in the same schema or a separate `AuthToken` model?"

Plus **testing-specific questions**:
- "The project uses pytest with testcontainers — should we follow that pattern or is there a reason to change?"
- "Mock the payment gateway at the HTTP boundary, or use a testcontainer with a sandbox endpoint?"
- "Any minimum coverage requirement for this feature?"

Multiple rounds (typically 2-5) until every task can be described concretely. Each round saved to `interview-01.md`, `interview-02.md`, etc.

### Phase 5: Write Spec

Synthesizes everything into a comprehensive `SPEC.html`:
- Mermaid architecture diagrams (flowchart, sequenceDiagram, erDiagram, etc.)
- **Testing Architecture** — framework & tools table, isolation strategy per layer, coverage targets, test commands, anti-patterns to avoid
- Library comparison table with alternatives and rationale
- **Feature phases with paired TEST-IMPL tasks** in `<li class="task-pair">` wrappers: write test, implement, write test, implement — true red-green-refactor
- Tasks with `[TEST-PREFIX-NN]` and `[IMPL-PREFIX-NN]` codes, IMPL tasks include `→ satisfies [TEST-XX-NN]` references
- Optional UI mockups (wireframe or hi-fi, per the chosen `mockup-fidelity`)
- Optional code-diff previews (PrismJS syntax-highlighted)
- **TDD Log** (empty at forge time; filled during implementation as RGR cycles close)
- Decision log, deviations table

**Coherence review (mandatory before presenting):**
1. Entire spec tells a coherent story
2. Phases are in logical dependency order
3. Every task is concrete and actionable (file paths, function names)
4. Architecture diagram matches task descriptions
5. Testing Architecture covers all feature tasks
6. Library choices are consistent throughout
7. Overview accurately summarizes what phases deliver
8. No gaps — everything implementation needs is covered by a task
9. **Tasks alternate TEST-IMPL within each phase** (true red-green-refactor)
10. **Every `[IMPL-XX-NN]` task references at least one `[TEST-XX-NN]` task**
11. **Every `[TEST-XX-NN]` task is referenced by at least one `[IMPL-XX-NN]`**

### Phase 6: Implement

Works through the spec task by task during implementation, enforcing strict TDD:
- **TEST tasks**: write tests, run them via Bash, confirm they FAIL, stash red output
- **IMPL tasks**: set `data-tdd-phase="green"`, write minimum code, run tests, confirm they PASS, refactor under `data-tdd-phase="refactor"`, run tests again
- Swaps `data-status="pending"` → `data-status="completed"` on each task as it finishes
- When a cycle closes, appends an `<article class="tdd-cycle">` to the TDD Log with Red / Green / Refactor lanes filled in
- Runs the validate recipe after every edit
- Updates phase `data-status` + pill class when a phase completes; promotes the next phase
- Updates the registry's progress count and `updated` date
- Logs decisions to the Decision Log; logs spec drift to Deviations

## Supported Languages

Works with any tech stack. Built-in testing knowledge in [`references/testing-knowledge.md`](references/testing-knowledge.md) covering:

| Language | Test Frameworks | Mocking | Testcontainers | Backend E2E | Browser E2E |
|----------|----------------|---------|----------------|------------|------------|
| TypeScript/JS | Vitest, Jest, Mocha | MSW, vi.mock, Sinon | testcontainers | Supertest | Playwright, Cypress |
| Python | pytest, unittest | pytest-mock, responses, respx | testcontainers | httpx TestClient | Playwright |
| Java | JUnit 5, TestNG | Mockito, WireMock | testcontainers | MockMvc, RestAssured | Playwright, Selenium |
| Kotlin | JUnit 5, Kotest | MockK, WireMock | testcontainers | MockMvc, WebTestClient | Playwright |
| Go | testing (stdlib) | testify/mock, gomock | testcontainers-go | net/http/httptest | Rod, chromedp |
| Rust | cargo test | mockall, wiremock | testcontainers | actix_web::test | — |
| C# | xUnit, NUnit, MSTest | Moq, WireMock.Net | Testcontainers | WebApplicationFactory | Playwright |

Also covers: coverage tools (v8, JaCoCo, coverage.py, cargo-tarpaulin, coverlet), mutation testing (Stryker, Pitest, mutmut, cargo-mutants), property-based testing (fast-check, Hypothesis, jqwik, proptest), isolation patterns, and common anti-patterns (in-memory DB substitutes, mocking internals, calling external services in tests).

## Plan Mode

Spec Mint TDD HTML **replaces** Claude Code's built-in plan mode. The forge workflow IS your planning phase — deep research, interviews, spec writing with Testing Architecture and alternating TEST-IMPL task pairs. You don't need plan mode at all.

If you happen to be in plan mode when you start a forge, Spec Mint TDD HTML asks you to exit plan mode first (Shift+Tab), then start the forge workflow again.

## Project Structure

```
specmint-tdd-html/
├── SKILL.md                        # Universal skill (works with all tools)
├── skills/
│   └── specmint-tdd-html/
│       └── SKILL.md                # → ../../SKILL.md (symlink for skills-CLI discovery)
├── references/
│   ├── researcher.md               # Deep-research subagent brief (test infra analysis)
│   ├── spec-format.md              # SPEC.html format reference (TDD-aware)
│   ├── html-template.html          # Canonical empty SPEC.html template
│   ├── edit-recipes.md             # Before/after snippets for every surgical edit (incl. data-tdd-phase, TDD Log append)
│   ├── validate.md                 # Post-edit validation recipe (Python one-liner)
│   ├── wireframe-library.md        # Wireframe mockup patterns (.wf-*)
│   ├── mockup-library.md           # Hi-fi mockup patterns (.ui-*)
│   ├── testing-knowledge.md        # Language-agnostic testing reference (6+ languages)
│   └── command-contracts.md        # Behavioral contracts (20 TDD-specific)
├── assets/
│   ├── spec-styles.css             # Shared design system — copied to .specs/assets/ on every forge
│   └── spec-runtime.js             # Progress deriver + Mermaid/Prism init + RGR-phase derivation + diagram modal + validator
├── README.md
└── LICENSE
```

## Spec Format

Full specification in [`references/spec-format.md`](references/spec-format.md). Surgical edit recipes in [`references/edit-recipes.md`](references/edit-recipes.md). Post-edit validator in [`references/validate.md`](references/validate.md). Behavioral guardrails in [`references/command-contracts.md`](references/command-contracts.md).

### Metadata (single-line JSON in `<script id="spec-meta">`)

| Field | Required | Description |
|-------|:---:|-------------|
| `id` | Yes | URL-safe slug (e.g., `user-auth-system`) |
| `title` | Yes | Human-readable name |
| `status` | Yes | `active`, `paused`, `completed`, `archived` |
| `created` | Yes | ISO date (YYYY-MM-DD) |
| `updated` | Yes | ISO date of last modification |
| `priority` | No | `high`, `medium`, `low` (default: medium) |
| `tags` | No | JSON array |
| `mockup-fidelity` | No | `wireframe`, `hi-fi`, `none` |

Canonical key order: `id`, `title`, `status`, `created`, `updated`, `priority`, `tags`, `mockup-fidelity` (logical, not alphabetical).

### Conventions

- **Phase status** (`data-status` on `<details class="phase">`): `pending`, `in-progress`, `completed`, `blocked`
- **Task status** (`data-status` on `<li class="task">`): same values
- **TDD RGR state** (`data-tdd-phase` on `<li class="task task--impl">`): `red`, `green`, `refactor`
- **Task codes**: `[TEST-PREFIX-NN]` / `[IMPL-PREFIX-NN]` — auto-incrementing across all phases starting at 01
- **Satisfies references**: `<li class="task task--impl">...→ satisfies <code>[TEST-XX-NN]</code></li>` — links IMPL to the test it makes pass
- **TEST-IMPL pairs**: wrapped in `<li class="task-pair">`. Each pair is one red-green-refactor cycle.
- **Region sentinels**: `<!-- region:NAME -->` / `<!-- endregion:NAME -->` around every top-level section — used as anchors for surgical edits
- **No current marker**: the first task with `data-status="pending"` in the active phase is implicitly current
- **Uncertainty**: `<span class="ac-flag">Needs clarification</span>` inline in an acceptance criterion
- **Architecture Diagrams**: Mermaid (`flowchart`, `sequenceDiagram`, `erDiagram`, `stateDiagram-v2`, `timeline`, etc.) inside `<pre class="mermaid">` blocks
- **Testing Architecture**: 5 sub-tables — Test Framework & Tools, Isolation Strategy, Coverage Targets, Test Commands, Anti-Patterns
- **Code Previews**: `<figure class="code-diff">` with PrismJS `diff-highlight` for syntax-highlighted red/green diffs
- **UI Mockups**: `mockup--wireframe` (grayscale `.wf-*` primitives) or `mockup--hifi` (real-looking `.ui-*` components) — both bespoke, zero CDN, constrained palette to prevent bikeshedding
- **TDD Log**: `<article class="tdd-cycle">` per RGR cycle, rendered as a 3-lane swimlane (RED / GREEN / REFACTOR) with monospace test output inside each lane
- **Decision Log**: Table with date, decision, rationale
- **Deviations**: Table tracking where implementation diverged from spec
- **Progress strings**: Never authored. `spec-runtime.js` derives them — including "Current TDD phase" — from `data-status` / `data-tdd-phase` counts at page load.

## Why Not Just Use Plan Mode?

Plan mode is a good idea with a bad implementation. It restricts Claude to read-only tools and asks for a plan. That's it. No persistence, no research depth, no interviews, no progress tracking, and certainly no TDD enforcement.

Spec Mint TDD HTML's forge workflow does what plan mode should do:

- **Research depth**: Reads 10-20+ files, searches the web, pulls library docs, analyzes test infrastructure. Not a quick scan.
- **Interviews**: Asks you targeted questions based on what it found — including testing preferences, isolation strategies, and coverage targets. Multiple rounds until there's no ambiguity.
- **True TDD**: Every spec has alternating TEST-IMPL task pairs. Write one test (RED), make it pass (GREEN), refactor, next test. Not batched.
- **Red-green-refactor enforcement**: The implement command runs tests at every transition. No "tests would pass" hand-waving.
- **Audit trail**: The TDD Log proves discipline was followed — red output, green output, refactor changes for every task.
- **Persistence**: Everything is saved to files. Research notes, interviews, the spec itself, the TDD Log. Nothing lives only in context.
- **Resumability**: Close the terminal, come back next week. The spec remembers exactly where you were — including which TDD phase you're in, which tests are failing, and what the last test run looked like.
- **Multi-spec**: Juggle multiple features. Switch between them with one command.

## Pair with Kluris

Spec Mint TDD HTML reads your codebase and enforces red-green-refactor. [Kluris](https://kluris.io) gives your agents the *other* half — the tribal knowledge that never made it into comments: architecture decisions, test isolation conventions, flaky-test history, the "why" behind every weird choice.

Pair them and the forge workflow's Phase 1b (research) stops guessing. It consults the brain first — so the test strategy lands aligned with how your team already does things.

**Inside your AI coding agent:**

```text
> forge add OAuth sign-in with GitHub
```

Phase 1a reads the code and test infrastructure. Phase 1b queries the brain:

```text
> /kluris-<brain> what do we know about auth testing and integration test isolation?
```

Phase 2 interviews you with that context in hand. The spec lands with TEST-IMPL pairs grounded in both the code *and* the testing patterns your team already agreed to — no re-litigating isolation strategies mid-implementation.

**Why it works:**

- **Grounded research** — Phase 1b pulls from a curated brain instead of just the web.
- **Testing patterns** — isolation strategies, fixture conventions, and flaky-test history surface automatically.
- **Institutional memory** — new hires (and agents) inherit context instantly.
- **Spec reuse** — past specs, TDD Logs, and decisions surface during research.

**Install Kluris:**

```bash
pipx install kluris
kluris wake-up
```

Full setup at [kluris.io](https://kluris.io).

## License

MIT
