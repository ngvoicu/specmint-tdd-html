---
description: Resume the active spec — read progress, identify current TDD phase, pick up at the next task boundary
disable-model-invocation: true
---

# Resume Spec (TDD)

Follow the "Resuming" workflow from the specmint-tdd-html skill (SKILL.md).
See also `references/spec-format.md` for the SPEC.html format reference.

1. Read `.specs/registry.md` to find the spec with `active` status
2. If none is active, show the user their specs so they can choose one
3. Load `.specs/<id>/SPEC.html`
4. Parse progress — count `<li class="task">` elements grouped by
   `data-status` per phase
5. Find the current phase (first `<details class="phase">` with
   `data-status="in-progress"`) and the current task (first
   `<li class="task" data-status="pending">` in that phase)
6. Derive TDD phase:
   - If a task has `data-status="in-progress"` with `data-tdd-phase`, use
     that value as the current phase
   - Otherwise: current task is `task--test` → RED (about to write failing
     test); current task is `task--impl` → GREEN (test exists, about to
     make it pass)
7. Read the most recent `<article class="tdd-cycle">` in `region:tdd-log`
   for last-cycle context (Red output, Green output, Refactor notes)
8. Check if there are research notes (research-*.md, interview-*.md) in
   `.specs/<id>/` for additional context
9. Present a compact summary:

```
Resuming: <Title> (<id>)
Progress: <done>/<total> tasks
RGR cycles: <done>/<total>
Phase: <phase name>
Current: [<TEST|IMPL>-<PREFIX>-<NN>] <task text>
TDD Phase: RED | GREEN | REFACTOR
Last cycle: [<TASK-CODE>] <state> — <test result>
```

10. Begin working on the current task using the TDD workflow:
    - If current task is a TEST task: write failing tests (RED). Run them
      via Bash. Confirm fail. Mark TEST `data-status="completed"`.
    - If current task is an IMPL task: read the preceding TEST file,
      write minimum production code, run tests, iterate until GREEN, then
      refactor and confirm tests still pass.

If there are no specs at all, suggest running `/specmint-tdd-html:forge` to
create one. There is no separate Resume Context section in HTML specs —
the first pending task is implicitly current; the last TDD Log entry carries
the most recent context.
