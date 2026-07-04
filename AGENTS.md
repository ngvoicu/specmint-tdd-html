# Repository Guidelines

Codex-style guidelines for agents working on Spec Mint TDD HTML. The skill's full project context is in `CLAUDE.md`; this file is the contributor / agent-style guide.

For architectural context across the Mint family (core vs TDD, distribution, evals), read and write to the **ngvoicu-sme** brain through kluris — `/kluris-ngvoicu-sme` (Claude Code skill: search, learn, remember, create) or `kluris search "<query>" --brain ngvoicu-sme` (CLI). Never edit brain files by hand.

## Project Structure & Module Organization

- `SKILL.md`: the universal skill — the single self-contained entrypoint defining the full forge/implement/resume/pause/switch/list/status/openapi workflow.
- `references/`:
  - `researcher.md` — deep-research subagent brief (codebase + test infrastructure analysis), spawned via the Task tool during forge as described in `SKILL.md`.
  - `spec-format.md` — canonical `SPEC.html` format reference (TDD-aware: Testing Architecture, `data-tdd-phase`, TDD Log swimlane).
  - `html-template.html` — empty canonical template AI seeds from.
  - `edit-recipes.md` — before/after snippets for every surgical edit, including TDD-specific recipes (`data-tdd-phase` swaps, append TDD Log entry, add TEST-IMPL pair).
  - `validate.md` — post-edit validation recipe (Python one-liner).
  - `wireframe-library.md` / `mockup-library.md` — UI mockup pattern catalogs.
  - `testing-knowledge.md` — language-agnostic testing reference (frameworks, mocking, testcontainers, isolation, coverage, mutation testing across 6+ languages).
  - `command-contracts.md` — behavioral contracts including 20 TDD-specific contracts.
- `assets/`:
  - `spec-styles.css` — shared design system (copied into `.specs/assets/` on every forge in any consuming project).
  - `spec-runtime.js` — progress deriver + Mermaid/Prism init + SVG annotation arrows + RGR-phase derivation + diagram fullscreen modal + full-spec validator.

  The reference render of a generated `SPEC.html` lives at <https://specmint.io/#gallery> (instead of an embedded screenshot in this repo).
- `SKILL.md`: universal, cross-tool skill instructions (Codex, Cursor, Windsurf, Cline, Gemini CLI).
- `evals/evals.json`: 6 real eval scenarios with 33 verifiable expectations (tracked). Run via `/skill-creator improve` (Anthropic's official skill-creator plugin) in a fresh Claude Code session. Run outputs land in a gitignored `specmint-tdd-html-workspace/` sibling directory.
- `.specs/`: local dogfooding output for specs (gitignored).

## Build, Test, and Development Commands

- `rg --files`: fast inventory of repository files before editing.
- `sed -n '1,160p' SKILL.md`: inspect workflow content in the terminal.
- `python3 -m http.server 8000` (run inside a consumer project's `.specs/<id>/`): serve a real generated `SPEC.html` at <http://localhost:8000/SPEC.html> to eyeball visual changes — especially the TDD swimlane log and TEST-IMPL pair cards. The reference render lives at <https://specmint.io/#gallery>.
- `python3 -c "import re,json,sys; p=sys.argv[1]; h=open(p).read(); m=re.search(r'<script[^>]*id=\"spec-meta\"[^>]*>(.+?)</script>',h,re.S); json.loads(m.group(1)); o=re.findall(r'<!--\\s*region:([\\w-]+)\\s*-->',h); c=re.findall(r'<!--\\s*endregion:([\\w-]+)\\s*-->',h); assert sorted(o)==sorted(c); print('OK')" path/to/SPEC.html`: validate a generated SPEC.html (full recipe in `references/validate.md`).
- `npx skills add ngvoicu/specmint-tdd-html -g -a codex`: smoke-test universal-skill installation flow.
- `git log --oneline -n 10`: review recent commit style before committing.

This repository has no compile/build pipeline; Markdown, JSON, HTML, CSS, and JS are consumed directly by host tools or the browser.

## Coding Style & Naming Conventions

- Skill source (SKILL.md, references, README.md): ASCII Markdown with concise, imperative instructions.
- Use lowercase, hyphenated filenames for reference docs (for example `references/spec-format.md`).
- Keep workflow docs procedural (numbered steps, explicit file paths, deterministic behavior).
- Spec naming:
  - Spec IDs are lowercase-hyphenated (`user-auth-system`, `rate-limit-middleware`).
  - Task codes are `[TEST-PREFIX-NN]` and `[IMPL-PREFIX-NN]` with continuous numbering across all phases.
  - Phase status uses `data-status="pending" | "in-progress" | "completed" | "blocked"`.
  - IMPL tasks reference test tasks via `→ satisfies <code>[TEST-XX-NN]</code>`.
- SPEC.html metadata uses **canonical JSON key order**: `id`, `title`, `status`, `created`, `updated`, `priority`, `tags`, `mockup-fidelity` (logical, not alphabetical).
- Phases group by **feature**, never by test-vs-impl. No `(TEST)` or `(IMPL)` suffixes on phase names. Tasks alternate TEST-IMPL within each phase.
- One attribute per line on state-bearing elements when the line would be long; one element per line for list rows.

## TDD-Specific Conventions

- Every spec must have a Testing Architecture section (framework, isolation strategy, coverage targets, test commands, anti-patterns).
- Tasks alternate TEST-IMPL within each feature phase. Each pair is one red-green-refactor cycle.
- The implement command enforces red-green-refactor: write test → run via Bash (fail) → implement → run (pass) → refactor → run (still pass).
- Tests MUST be executed via the actual test runner at every transition — three Bash runs minimum per cycle. No assumed results.
- TDD Log tracks Red (failure output), Green (pass output), Refactor (changes) per cycle as `<article class="tdd-cycle">` entries appended to `region:tdd-log`.
- TDD phase (RED / GREEN / REFACTOR) is carried as `data-tdd-phase` on the in-progress IMPL task; the rendered scorecard derives "Current TDD phase" from it.
- Tests Are Sacred: during GREEN, fix the production code, never modify test assertions to match what the code returns.
- Blocking Rule: each IMPL task cannot start until its TEST task is completed and tests are confirmed failing.

## Testing Guidelines

- No automated test suite currently exists in this repository.
- Perform manual validation for each change:
  - Run the validate recipe on a generated `.specs/<id>/SPEC.html` after any format change.
  - Confirm referenced paths/files exist.
  - Install the skill into a disposable consumer project after any visual change (e.g. `npx skills add ./. -g -a claude-code`, or copy `SKILL.md` into its skills dir) and open the generated `SPEC.html` in a browser — pay special attention to the TDD swimlane and TEST-IMPL pair card rendering.
  - Smoke-test the install/use flow in a disposable project by exercising the natural-language triggers (forge / resume / implement) with a real test runner available so the implement RGR gates can fire.
- If you change spec-format rules, update `SKILL.md`, `references/spec-format.md`, and `references/edit-recipes.md` in the same PR.
- `evals/evals.json`: 6 real eval scenarios with 33 verifiable expectations (tracked). Run via `/skill-creator improve` in a fresh Claude Code session; run outputs land in `specmint-tdd-html-workspace/` (gitignored).

## Commit & Pull Request Guidelines

- Prefer descriptive, scoped commit messages (for example `feat: add data-tdd-phase derivation to spec-runtime.js`).
- PRs should include purpose, affected files, behavior changes (before/after HTML or test output snippets when relevant), and linked issue/context when available.
- Don't span sub-repos in a single commit — keep changes scoped to this skill.
