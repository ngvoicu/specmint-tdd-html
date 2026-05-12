# CLAUDE.md — Spec Mint TDD HTML

Guidance for Claude Code (and other AI coding agents) when working on this plugin's source.

## Project Overview

Spec Mint TDD HTML is a Claude Code plugin (no build step, no dependencies) that enforces strict test-driven development in AI coding workflows. Every task starts with a failing test; production code exists only to make tests pass; refactoring happens under green. Specs render as professional HTML documents:

- **Mermaid diagrams** — flowchart, sequenceDiagram, erDiagram, stateDiagram-v2, etc.
- **Testing Architecture section** — framework & tools, isolation strategy, coverage targets, test commands, anti-patterns
- **Paired TEST-IMPL task cards** — red left border on TEST tasks, green on IMPL, with "→ satisfies" cross-references
- **RGR swimlane TDD Log** — one `<article class="tdd-cycle">` per cycle, 3 lanes (RED / GREEN / REFACTOR) with monospace test output
- **Derived "Current TDD phase" scorecard** — `spec-runtime.js` derives RED / GREEN / REFACTOR from `data-tdd-phase` on the in-progress IMPL task, or from the type of the next pending task
- **Syntax-highlighted code diffs**, **wireframe / hi-fi UI mockups** (bespoke `.wf-*` / `.ui-*` libraries, zero CDN, constrained palette)

Plugin source is markdown + JSON. Only the user-facing spec output (`SPEC.html`) is HTML.

Also ships as a universal skill (`SKILL.md`) for Codex, Cursor, Windsurf, Cline, and Gemini CLI via `npx skills add ngvoicu/specmint-tdd-html -a <tool>`.

## Knowledge base

Architectural context across the Mint family (core vs TDD, core-vs-tdd-html differences, distribution, evals) lives in the **ngvoicu-sme** brain. Read and write through kluris — never edit brain files by hand:

- `/kluris-ngvoicu-sme` — Claude Code skill (search, learn, remember, create)
- `kluris search "<query>" --brain ngvoicu-sme` — direct CLI search

Topics relevant to this repo: specmint-tdd-html overview, TDD invariants, distribution, evals.

## Architecture

The plugin has two conceptual layers:

**Plugin layer** (this repo) — `commands/*.md` (one file per slash command), `agents/researcher.md` (Opus-model deep research subagent including test infrastructure analysis), `.claude-plugin/` and `.cursor-plugin/` (metadata), `references/*` (format reference + edit recipes + validator + testing-knowledge + mockup libraries), `assets/*` (shared `spec-styles.css` + `spec-runtime.js` copied into consuming projects, plus the README `preview.png`).

**Data layer** (consuming project) — `.specs/` directory created in the consuming project root (not here). Layout:

```
.specs/
├── assets/
│   ├── spec-styles.css    # Shared design system — copied once from plugin's assets/
│   └── spec-runtime.js    # Progress deriver + Mermaid/Prism init + SVG annotation arrows
│                          # + RGR-phase derivation (TDD-specific)
├── registry.md            # Markdown table — denormalized index across specs
└── <spec-id>/
    ├── SPEC.html          # The spec (rich HTML; Testing Architecture + TDD Log swimlane)
    ├── research-*.md      # Research notes (markdown)
    └── interview-*.md     # Interview notes (markdown)
```

**Source of truth split inside `SPEC.html`** (avoid duplicating state):
- `<script type="application/json" id="spec-meta">` in `<head>` — identity only (`id`, `title`, `status`, `created`, `updated`, `priority`, `tags`, `mockup-fidelity`). Single-line JSON, canonical key order.
- `data-status` attributes on tasks / phases / AC items — lifecycle state.
- `data-tdd-phase` on `<li class="task task--impl">` — RGR state (`red` | `green` | `refactor`).
- Progress strings, RGR cycle counts, "Current TDD phase" — **never stored**; derived by `spec-runtime.js` at page load.

## What Makes TDD Different from Core

- Tasks alternate TEST-IMPL within each feature phase. Each pair = one red-green-refactor cycle.
- Task codes: `[TEST-PREFIX-NN]` and `[IMPL-PREFIX-NN]` with continuous numbering across phases.
- Each IMPL task has `→ satisfies [TEST-XX-NN]` linking back to its test task.
- The implement command enforces red-green-refactor: tests MUST be run via Bash at every transition — no "tests would pass" claims.
- Specs include a Testing Architecture section (framework, isolation strategy, coverage targets, test commands, anti-patterns).
- TDD Log audit trail tracks Red (failure output), Green (pass output), Refactor (changes) per cycle — rendered as a swimlane.
- `data-tdd-phase` on the current IMPL task carries RGR state across sessions; the rendered scorecard derives "Current TDD phase" from it.
- `references/testing-knowledge.md` — language-agnostic testing reference (frameworks, mocking, testcontainers, isolation, coverage, mutation testing across 6+ languages).

## File Relationships (must stay in sync)

| Source of truth | Must match |
|----------------|------------|
| `references/spec-format.md` | Spec format rules in `SKILL.md` |
| `references/testing-knowledge.md` | Testing guidance in `SKILL.md` and `agents/researcher.md` |
| `assets/spec-styles.css` + `assets/spec-runtime.js` | `references/html-template.html` and `references/edit-recipes.md` |
| `commands/*.md` | Behavioral contracts in `references/command-contracts.md` |

`skills/specmint-tdd-html/SKILL.md` is a symlink to `../../SKILL.md` — never replace it with a real file.

## Key Conventions

- `CLAUDE.md`, `AGENTS.md`, `.specs/`, and `specmint-tdd-html-workspace/` are intentionally untracked in this repo (see `.gitignore`).
- `AGENTS.md` provides Codex-style contributor guidelines; `CLAUDE.md` (this file) provides Claude-Code-flavored project context. They share content; format differs.
- `SKILL.md` must work for all AI tools — the Claude Code Plugin section at the top is tool-specific and kept to ~20 lines.
- Phases group by feature (no `(TEST)` or `(IMPL)` suffixes) — tasks alternate TEST-IMPL within each phase.
- Spec format details are in `references/spec-format.md` — single source of truth.
- Workflow details (forge phases, implement RGR lifecycle, pause/resume) are in the respective `commands/*.md` files.
- Pause/resume checkpoints at task / RGR-cycle boundaries only — there is no Resume Context section. Documented in SKILL.md.

## Working on This Codebase

### Behavioral changes
- Edit `commands/*.md` to change slash command behavior. The TDD-specific invariants (Blocking Rule, Tests Are Sacred, Test Execution Rule, Violation Examples) live in `SKILL.md` and `commands/implement.md` — keep them in sync.
- Edit `references/command-contracts.md` when you change command contracts; this is the review checklist (includes 20 TDD-specific contracts).
- Edit `references/testing-knowledge.md` to update testing framework / tooling guidance.

### Format changes
- Edit `assets/spec-styles.css` / `assets/spec-runtime.js` to change rendered visual / runtime behavior for every generated `SPEC.html`. To eyeball changes, dogfood the plugin in a disposable consumer project — `claude plugin add /path/to/specmint-tdd-html`, run `/forge`, then open the generated `.specs/<id>/SPEC.html`. The README screenshot at `assets/preview.png` is the reference render.
- After any spec-format change, run the validate recipe on a generated `SPEC.html` (see `references/validate.md`).

### Plumbing
- Validate `.claude-plugin/*.json` and `.cursor-plugin/*.json` stay valid JSON after edits.
- Smoke-test changes: `claude plugin add /path/to/specmint-tdd-html` in a disposable project, then run `/forge`, `/resume`, `/implement` (with a real test runner available so `Bash` test execution gates can fire).
- Windsurf users must replace the symlink at `.windsurf/skills/specmint-tdd-html/SKILL.md` with a real file copy (Cascade doesn't follow symlinks).

## Eval Infrastructure

Eval workspace at `specmint-tdd-html-workspace/` (gitignored). Currently contains a **placeholder scaffold** — `specmint-tdd-html-workspace/evals/evals.json` lists 8 evals (forge-tdd-html, red-green-refactor, blocking-rule, tests-are-sacred, tdd-log, resume-tdd, asset-init, interleaved-tasks) with TODO assertion bodies. The structure is in place; the assertion implementations are a follow-up.

## Distribution

- **Claude Code plugin**: `claude plugin add ngvoicu/specmint-tdd-html` (full feature set — all slash commands, researcher agent with test-infrastructure analysis, auto-triggers, RGR enforcement).
- **Universal skill**: `npx skills add ngvoicu/specmint-tdd-html -a <codex|cursor|windsurf|cline|gemini>` (SKILL.md installs; no slash commands or researcher agent, but TDD workflow rules carry over).
- **GitHub**: <https://github.com/ngvoicu/specmint-tdd-html>
