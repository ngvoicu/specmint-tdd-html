# Validate Recipe

After every surgical edit to a `SPEC.html`, run the lightweight CLI recipe below. It is **required** by SKILL.md's Update Transaction — never declare a task complete without running it.

For deeper "is the whole spec actually healthy" checks (Mermaid render, task code uniqueness, IMPL-→-TEST linking, missing recommended regions, RGR cycle drift) use the browser validator described at the bottom of this file.

## 1. CLI recipe (textual, runs on every edit)

```bash
python3 -c "
import re, sys, json
p = sys.argv[1]
h = open(p).read()
m = re.search(r'<script[^>]*id=\"spec-meta\"[^>]*>(.+?)</script>', h, re.S)
assert m, 'spec-meta script missing'
json.loads(m.group(1))
opens = re.findall(r'<!--\s*region:([\w-]+)\s*-->', h)
closes = re.findall(r'<!--\s*endregion:([\w-]+)\s*-->', h)
assert sorted(opens) == sorted(closes), f'sentinel mismatch: opens={opens} closes={closes}'
print('OK')
" .specs/<spec-id>/SPEC.html
```

Substitute `<spec-id>` for the active spec slug. Exits non-zero on failure.

### What the CLI recipe checks

1. **`<script id="spec-meta">` exists** and contains valid JSON.
2. **Every `<!-- region:NAME -->` has a matching `<!-- endregion:NAME -->`** (including `region:testing` and `region:tdd-log`). No orphaned sentinels in either direction.

### What it does NOT check (use the browser validator for these)

- Mermaid diagram parse / render success
- Task code uniqueness (TEST/IMPL pairs)
- IMPL tasks have a `→ satisfies [TEST-XX-NN]` reference
- HTML-entity contamination inside `<pre class="mermaid">`
- Missing recommended regions (`testing`, `tdd-log`, …)
- Visual rendering / layout

### CLI failure modes

- **`spec-meta script missing`** — Someone deleted the `<script id="spec-meta">` block or changed its `id`. Restore it.
- **`json.JSONDecodeError`** — The JSON inside `<script id="spec-meta">` is malformed. Re-read the file, identify the broken character (usually a missing quote or trailing comma), fix.
- **`sentinel mismatch`** — A `<!-- region:X -->` or `<!-- endregion:X -->` was deleted, duplicated, or had its name changed. The error prints both lists; diff them to find the culprit.

## 2. Browser validator (full check, runs in the rendered page)

`assets/spec-runtime.js` exposes a runtime validator that runs in the browser and reports issues to the console.

### How to invoke

1. Open the rendered `SPEC.html` in a browser (or via `python3 -m http.server` inside `.specs/<spec-id>/`).
2. Open DevTools → Console.
3. Run: `await specmintValidate()`

It returns an array of `{ area, level, msg }` issues. Empty array = clean.

The validator also runs automatically after page load. If everything is fine, it stays silent. If there are issues, you'll see a collapsed `[specmint] validate — N error(s), M warning(s)` group in the console. Set `localStorage.specmintDebug = "1"` to force a one-line summary even when the spec is clean.

### What the browser validator checks

| Area | Check | Level |
|------|-------|-------|
| `meta` | `<script id="spec-meta">` exists in `<head>` | error |
| `meta` | spec-meta JSON parses | error |
| `meta` | Required fields `id`, `title`, `status`, `created`, `updated` present | error |
| `regions` | Every opener has a matching closer | error |
| `regions` | Recommended regions present (`meta`, `header`, `overview`, `acceptance`, `architecture`, `testing`, `libraries`, `phases`, `tdd-log`, `decisions`) | warn |
| `tasks` | `data-task` codes are unique across the spec | error |
| `tdd` | Every `.task--impl` has a `satisfies [TEST-XX-NN]` reference | warn |
| `mermaid` | Each `<pre class="mermaid">` rendered successfully (no `figure.diagram--error`) | error |
| `mermaid` | Each `<pre class="mermaid">` source parses via `mermaid.parse()` | error |
| `mermaid` | No HTML entities (`&gt;`, `&amp;`, etc.) inside Mermaid source | warn |

### Inspecting a failed diagram

When a diagram fails to render:
- Its `<figure class="diagram">` gets the `diagram--error` class (red dashed border, "⚠ render failed" label prefix).
- The original Mermaid source is preserved on the `<pre>` as `data-mermaid-source`.
- To read it: `document.querySelector('figure.diagram--error pre.mermaid').dataset.mermaidSource`

Fix the source in the SPEC.html, save, reload the page, re-run `specmintValidate()`.
