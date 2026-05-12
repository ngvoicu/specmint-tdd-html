---
description: Implement the active spec using strict TDD — red-green-refactor for every task
disable-model-invocation: true
---

# Implement Spec (TDD)

Implement tasks from the active spec using strict test-driven development.
See also the specmint-tdd-html skill (SKILL.md) for global invariants and
`references/spec-format.md` for the SPEC.html format reference. Surgical
edit operations are in `references/edit-recipes.md` (including TDD-specific
recipes for `data-tdd-phase` swaps and appending TDD Log entries).

User's request: $ARGUMENTS

## Scope Detection

Parse the user's request to determine what to implement:

- **No argument / "the spec" / "implement"** — Start from the first task
  with `data-status="pending"` in the in-progress phase and work forward
- **"phase N" / "phase <name>"** — Implement all pending tasks in that
  specific phase only
- **"all phases" / "everything"** — Implement all remaining pending tasks
  across all phases, in order
- **"task CODE-NN"** — Implement just that specific task

## Implementation Workflow

1. Read `.specs/registry.md` to find the spec with `active` status
2. If none is active, show the user their specs so they can choose one
3. Load `.specs/<id>/SPEC.html`
4. Parse all phases and tasks via `data-status` — identify which tasks are
   in scope
5. Determine task type from task code prefix or class (`task--test` /
   `task--impl`)
6. Present a brief plan: "I'll implement N tasks across M phases. Starting
   with [TASK-CODE] — <task description>. TDD cycle: RED."
7. **TUI Progress**: Create a TaskCreate entry for each in-scope task so
   they appear as live checkboxes in the Claude Code TUI:
   - subject: `[TASK-CODE] <task description>`
   - activeForm: `RED: [TEST-XX-NN]` or `GREEN: [IMPL-XX-NN]`
   The `data-status` attributes in `SPEC.html` remain the source of truth.

Tasks alternate TEST-IMPL within each phase, paired in
`<li class="task-pair">` wrappers. Task codes use `<TYPE>-<PREFIX>-<NN>`
(continuous numbering across all phases).

For each TEST-IMPL pair in scope, in order:

### RED — TEST Task

1. Set the task's TUI entry to `in_progress` via TaskUpdate
2. Read the task specification: file path, test descriptions, isolation strategy
3. Write the test file at the specified path
4. Write test code with the assertions described in the spec:
   - Set up test fixtures, mocks, or containers as specified
   - Write each test case described in the task
   - Import the production module/function (which does not exist yet or is empty)
   - Assert expected behavior
5. **GATE: RUN the tests** via Bash (e.g., `npx vitest run <file>`,
   `pytest <file>`, `go test ./...`). Do not proceed without running them.
6. **GATE: Confirm tests FAIL.** If tests fail — good, this is RED.
7. If tests PASS unexpectedly: **STOP.** Do not proceed. Report the anomaly
   to the user. Possible causes:
   - The feature already exists (check the codebase)
   - The test doesn't actually test what it claims (assertions are wrong)
   - Imports resolve to existing code that satisfies the test
   - The test file has a syntax/import error that makes the runner skip it
   Wait for the user to decide how to proceed.
8. Stash the failing test output (command + summary + key failure messages)
   for the TDD Log entry that closes this cycle.
9. Mark the TEST task completed: swap `data-status="pending"` →
   `data-status="completed"` on the `<li class="task task--test">`. See
   `references/edit-recipes.md` for the exact swap.
10. Run the validate recipe (`references/validate.md`).
11. Set the task's TUI entry to `completed` via TaskUpdate.

### GREEN — IMPL Task

1. Set the task's TUI entry to `in_progress` via TaskUpdate.
2. Update the IMPL task: set `data-status="in-progress"` and add
   `data-tdd-phase="green"`.
3. Read which TEST task this satisfies (from `→ satisfies [TEST-XX-NN]`).
4. **Read the test file.** Understand exactly what the tests expect — return
   values, status codes, error messages, data shapes. The tests are the spec.
5. Write the **MINIMUM** production code to make the referenced tests pass:
   - Do not add features beyond what the tests require
   - Do not add error handling the tests don't check for
   - Do not optimize prematurely
   - Write the simplest thing that could possibly work
6. **GATE: RUN the tests** via Bash. Do not proceed without running them.
7. **GATE: Confirm tests PASS.**
8. If tests still fail:
   - Read the failure output carefully
   - **Fix the production code, NOT the tests.** Tests define expected
     behavior. If a test expects X and your code does Y, your code is wrong.
   - Run again. Repeat until all referenced tests are green.
   - The only reason to touch a test is if it has an actual bug (wrong
     import, syntax error, broken setup). If you believe the test
     expectation itself is wrong, STOP and ask the user before changing it.
9. Stash the passing output for the TDD Log entry.

### REFACTOR — Still on IMPL Task

1. Update `data-tdd-phase="refactor"` on the IMPL task.
2. Review the implementation for code quality:
   - Remove duplication
   - Improve naming
   - Extract helpers if warranted
   - Simplify complex logic
   - Ensure code follows existing codebase patterns
3. **GATE: RUN tests again** after refactoring. Do not proceed without running.
4. **GATE: Confirm tests STILL PASS.**
5. If refactoring broke tests: undo the refactoring change, try a different
   approach, run tests again. Do not modify tests to accommodate refactoring.
6. Mark the IMPL task `data-status="completed"`. Leave
   `data-tdd-phase="refactor"` as the historical marker of the last phase.
7. **Append an `<article class="tdd-cycle">` to `region:tdd-log`** with the
   stashed Red output, the stashed Green output, and the Refactor notes
   (or "None — implementation is already minimal."). See
   `references/edit-recipes.md` for the exact HTML.
8. Run the validate recipe.
9. Update progress and `updated` date in `.specs/registry.md`.
10. Set the task's TUI entry to `completed` via TaskUpdate.

**Then move to the next TEST-IMPL pair and repeat the cycle.**

### Self-Check (run this before every task)

Before starting any task, verify:
- Am I about to write production code? → Is there a failing test for it?
- Am I about to skip running tests? → Run them. Always. Via Bash.
- Am I about to modify a test to make it pass? → Stop. Fix the code instead.
- Did I append a TDD Log entry for the last completed cycle? → Do it now.
- Did I swap `data-status` on the completed task and run the validator? → Do it now.

If any check fails, correct it before proceeding.

### Tests Are Sacred

Tests define expected behavior. They are the specification in code form.

- **Never modify a test assertion to match what your code returns.** Make
  your code return what the test expects.
- If a test expects status 422 and your code returns 400, change your code
  to return 422. Do not change the test to expect 400.
- The only time you touch a test is for actual bugs: wrong import, syntax
  error, broken fixture setup — not because the assertion "doesn't match."
- If you genuinely believe a test expectation is wrong (contradicts
  requirements, impossible to implement), **STOP and ask the user.** Do not
  silently change test expectations.

### Blocking Rule

Each IMPL task cannot start until its TEST task is completed and tests are
confirmed failing. This is per-task, not per-phase. If you find yourself
about to write a function body before its test exists, STOP and write the
test first.

If the user asks to skip ahead to an IMPL task whose TEST task is not done,
explain the constraint and offer to write the test first.

### Test Execution Rule

Run the actual test command via Bash at every RED, GREEN, and REFACTOR
transition. That is **3 runs minimum per TEST-IMPL cycle.** Never say "tests
would pass" or "this should work." Execute the tests and report the actual
output. If the test runner is not available, report the blocker immediately.

Run the specific test file(s) for the current task, not the entire suite
(unless the user requests it or the task requires it).

### Phase Transition

Phases group by feature, not by test vs implementation. Each phase contains
interleaved TEST-IMPL pairs. When all tasks in a phase are complete, swap
the phase's `data-status="in-progress"` → `data-status="completed"` (and
update the pill class), then promote the next phase's `data-status` from
`pending` to `in-progress`.

### Update Progress (sacred — never skip)

Progress tracking is the most important bookkeeping in specmint-tdd-html.
If you skip this, resume breaks, the registry lies, and the spec becomes
useless. After completing each task, immediately:

1. Swap `data-status` on the completed task in `SPEC.html`.
2. Update `data-tdd-phase` if transitioning RGR state on an IMPL task.
3. If all tasks in the current phase are now completed, transition the
   phase pill + `data-status` and promote the next phase.
4. Review Acceptance Criteria — update `data-status="completed"` on any
   that are now satisfied.
5. Append a TDD Log entry when an IMPL task completes (one entry per cycle).
6. Update the `"updated"` field in the `<script id="spec-meta">` JSON and
   the visible "Updated" `<dd>`.
7. **Run the validate recipe** (`references/validate.md`). If it fails,
   fix the broken JSON or sentinel pair before moving on.
8. Update progress and `updated` date in `.specs/registry.md` (count
   `data-status="completed"` task elements for the X/Y).
9. **Verify**: Re-read both `SPEC.html` and `registry.md` to confirm edits
   landed. If registry progress doesn't match the completed-task count,
   fix it before moving on.

If you realize you forgot to update after a previous task, stop and fix
it now before continuing with the next task.

## Phase Review (after completing a phase)

When all tasks in a phase are completed, review before moving to the next:

1. Dispatch the `superpowers:code-reviewer` agent (if available) with:
   - The phase requirements from the SPEC.html
   - The list of files created/modified during this phase
   - The acceptance criteria relevant to this phase
   - The TDD Log entries for this phase
2. If no reviewer agent is available, do an inline review:
   - Re-read the phase's tasks and acceptance criteria
   - Verify each task's implementation matches what was specified
   - Check for missing edge cases, incomplete implementations, or spec drift
   - Verify the TDD Log has entries for every TEST-IMPL pair in the phase
3. If the review finds issues, fix them before marking the phase complete
4. Log any review findings in the Decision Log

## Handle Issues

- If a task is more complex than expected, split it into subtasks and update
  the SPEC.html before continuing
- If implementation diverges from the spec (better approach found, errors in
  spec, etc.), log it in the **Deviations** section
- Log any new technical decisions in the **Decision Log**
- If blocked on a task:
  - Set the task's `data-status="blocked"`
  - Add a Decision Log entry noting the blocker
  - Set the phase `data-status="blocked"` only when the whole phase is blocked
  - Move to the next unblocked task if possible
- If a test is flaky (passes sometimes, fails sometimes): flag it immediately,
  investigate the cause, fix the non-determinism before proceeding

## Parallel Task Execution (optional)

When multiple TEST-IMPL pairs within a phase are independent (no shared
files, no sequential dependencies), you may dispatch them in parallel
using the Agent tool:

1. Identify which TEST-IMPL pairs have no file-level or logical
   dependencies on each other
2. Dispatch an Agent for each independent pair with:
   - The full TEST and IMPL task specifications from the SPEC.html
   - The research notes, library choices, and Testing Architecture
   - Clear instructions to follow the RED-GREEN-REFACTOR cycle
   - Instructions to return TDD Log entries for the pair
3. After all agents complete, integrate results
4. Run the full test suite to verify no conflicts between parallel work
5. Update all `data-status` attributes, TDD Log entries, registry, and TUI
   entries in a single batch; run validate once

Default to sequential execution. Only parallelize when pairs are clearly
independent. When in doubt, execute sequentially — TDD's sequential
discipline is more important than speed.

## Verification Gate (mandatory before claiming completion)

Before reporting any phase or spec as complete, provide evidence:

1. Run the project's test suite (or the relevant subset) via Bash
2. Show the actual command and output in your response
3. If tests fail, fix the issues before claiming completion
4. Never use language like "should pass", "probably works", or "seems correct"

This reinforces the Test Execution Rule: evidence first, then assertions.
The TDD log already captures per-task evidence; this gate ensures phase
and spec completion also have fresh verification. No exceptions.

## Completion

When all in-scope tasks are done:

- **All tasks in the spec complete:**
  - **Run the full test suite** and show the output (verification gate)
  - Verify all Acceptance Criteria have `data-status="completed"`. If any
    remain pending, report which ones and ask the user before marking the
    spec complete.
  - Set every phase `data-status="completed"` (with matching pill update)
  - Set spec status to `completed` in `<script id="spec-meta">` JSON and registry
  - Update the `updated` date
  - Run the validate recipe
  - Present a summary: tasks completed, files created/modified, test
    output, coverage if available
  - Suggest next spec to activate if any are paused
- **Only a phase completed (not all tasks):**
  - **Run tests** for the phase's scope and show the output (verification gate)
  - Report phase completion and remaining work
  - Set the next phase to `data-status="in-progress"` if applicable
  - State whether the next pending task is TEST or IMPL

## Pause Limitation

HTML specs checkpoint state at task / RGR-cycle boundaries. If you must
pause mid-cycle, finish or split the IMPL task first. There is no Resume
Context section to carry mid-cycle scratchpad state. The TDD Log is the
durable record — fill in each cycle's entry completely as it closes, not
retroactively.

## Quality Standards

During implementation:
- Write clean, simple, maintainable code — no over-engineering
- Follow existing codebase patterns and conventions
- Use the libraries specified in the spec's Library Choices section
- Handle edge cases identified in the spec
- Validate at system boundaries, trust internal code

TDD-specific quality:
- Every test must be isolated — no shared mutable state between tests
- No external network calls in unit tests — mock at boundaries
- Use testcontainers for real databases/services when specified (not
  in-memory substitutes unless the spec explicitly calls for them)
- Mock only at boundaries (external APIs, third-party services) — do not
  mock internal modules or functions
- Tests must be deterministic — no time-dependent, order-dependent, or
  race-condition-prone patterns
- Test names must describe the behavior, not the implementation:
  "returns 401 when token is expired" not "test verifyToken method"
- Each test should have a single reason to fail
