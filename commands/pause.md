---
description: Pause the active spec — finalize state at the current task/cycle boundary
disable-model-invocation: true
---

# Pause Spec (TDD)

Follow the "Pausing" workflow from the specmint-tdd-html skill (SKILL.md).

1. Read `.specs/registry.md` to find the spec with `active` status
2. If no active spec exists, report that there is nothing to pause and stop
3. Load the SPEC.html
4. **Pause at a clean RGR boundary.** HTML specs do not carry mid-task or
   mid-cycle scratchpad state. If mid-cycle (TEST written, GREEN not yet
   passing), either finish the cycle or split the IMPL task into subtasks
   first. The natural pause point is between completed TEST-IMPL pairs.
5. Make sure every completed task has `data-status="completed"` and every
   `data-tdd-phase` on a completed IMPL task reflects the last phase reached.
6. **Append any pending `<article class="tdd-cycle">` entries** to
   `region:tdd-log` for cycles closed during this session. Fill in Red /
   Green / Refactor lanes with actual test runner output and refactoring
   notes — not summaries. The TDD Log is the durable record.
7. Add session decisions to the Decision Log.
8. Change spec status to `paused`:
   - In `<script id="spec-meta">` JSON: `"status":"paused"`
   - Visible header pill: `pill--in-progress`/`Active` → `pill--pending`/`Paused`
9. Update the `"updated"` date (JSON + visible dl)
10. Mirror status + date in `.specs/registry.md`
11. Run the validate recipe (`references/validate.md`)
12. Confirm to the user that progress was saved, with a TDD state summary
    (current TDD phase per the first pending task; failing tests list if any
    task is in-progress)

**The TDD Log is the durable record** of what happened during this session.
Fill it in completely as cycles close — not retroactively.
