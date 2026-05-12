---
description: Switch to a different spec — pause current, activate and resume target
disable-model-invocation: true
---

# Switch Spec

Switch to a different spec. The argument should be a spec ID.

Target: $ARGUMENTS

1. Validate the target first:
   - If no argument, show available specs and ask for target ID
   - If `.specs/<target-id>/SPEC.html` does not exist, report and stop
2. If target is already active, report "already active" and stop.
3. **Pause current spec** (if any) — run full pause workflow (finalize state
   at a clean RGR boundary, append any pending TDD Log entries, set status
   to paused, run validate)
4. **Load target spec** — read `.specs/<target-id>/SPEC.html`
5. **Activate it** — set its status to `active` in both `<script id="spec-meta">`
   JSON and `.specs/registry.md`
6. **Resume it** — run the full resume workflow (parse `data-status`,
   identify current phase and first pending task, derive TDD phase,
   present summary)
7. **Update registry** — ensure both specs' statuses are current in
   `.specs/registry.md`

This should feel like one seamless operation.
