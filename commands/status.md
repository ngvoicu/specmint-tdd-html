---
description: Show detailed progress of the active spec with TDD indicators
disable-model-invocation: true
---

# Spec Status (TDD)

Show detailed progress of the active spec with TDD state.

1. If `.specs/registry.md` does not exist, report "No specs yet" and suggest
   running `/specmint-tdd-html:forge`.
2. Read `.specs/registry.md` and find the spec with `active` status.
3. If no active spec exists:
   - If specs exist, list them and ask which one to activate.
   - If no specs exist, suggest running `/specmint-tdd-html:forge`.
4. Load `.specs/<id>/SPEC.html` for the active spec and parse all phases
   and tasks via `data-status` attributes.
5. Count aggregate metrics:
   - Total tasks completed vs total tasks
   - RGR cycles complete (count of `<li class="task task--impl">` with
     `data-status="completed"`) vs total
   - Acceptance criteria met vs total
6. Derive current TDD phase from the first pending task or the in-progress
   task's `data-tdd-phase` attribute.
7. Read the most recent `<article class="tdd-cycle">` in `region:tdd-log`
   for last-cycle context.
8. Show a detailed breakdown:

```
User Auth System [active, high priority, TDD]
Created: 2026-02-10 | Updated: 2026-02-11
Progress: 6/10 tasks (60%) | RGR cycles: 3/5

Phase 1: Auth Foundation [completed]
  + [TEST-AUTH-01] Write JWT verify tests
  + [IMPL-AUTH-02] Implement verifyToken (REFACTOR)
  + [TEST-AUTH-03] Write token refresh tests
  + [IMPL-AUTH-04] Implement refreshToken (GREEN)

Phase 2: OAuth Integration [in-progress]
  + [TEST-AUTH-05] Write Google OAuth tests
  + [IMPL-AUTH-06] Implement Google OAuth (GREEN)
  -> [TEST-AUTH-07] Write GitHub OAuth tests
  o  [IMPL-AUTH-08] Implement GitHub OAuth
  o  [TEST-AUTH-09] Write token exchange tests
  o  [IMPL-AUTH-10] Implement token exchange

Current: [TEST-AUTH-07] Write GitHub OAuth tests
TDD Phase: RED (about to write failing test)
Last cycle: [IMPL-AUTH-06] GREEN — 8/8 pass
```

Icons: `+` done, `->` current pending, `o` pending. Trailing `(RED|GREEN|REFACTOR)` on IMPL tasks comes from `data-tdd-phase`.

9. If there are research notes (research-*.md, interview-*.md) in
   `.specs/<id>/`, mention them with file count.
