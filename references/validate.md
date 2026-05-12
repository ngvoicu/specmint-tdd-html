# Validate Recipe

After every surgical edit to a `SPEC.html`, run this validator. It is **required** by SKILL.md's Update Transaction — never declare a task complete without running it.

## The recipe

```bash
python3 -c "
import re, sys, json
p = sys.argv[1]
h = open(p).read()
m = re.search(r'<script[^>]*id=\"spec-meta\"[^>]*>(.+?)</script>', h, re.S)
assert m, 'spec-meta script missing'
json.loads(m.group(1))
opens = re.findall(r'<!--\s*region:(\w+)\s*-->', h)
closes = re.findall(r'<!--\s*endregion:(\w+)\s*-->', h)
assert sorted(opens) == sorted(closes), f'sentinel mismatch: opens={opens} closes={closes}'
print('OK')
" .specs/<spec-id>/SPEC.html
```

Substitute `<spec-id>` for the active spec slug. Exits non-zero on failure.

## What it checks

1. **`<script id="spec-meta">` exists** and contains valid JSON.
2. **Every `<!-- region:NAME -->` has a matching `<!-- endregion:NAME -->`.** No orphaned sentinels in either direction.

## What it does NOT check (deliberately)

- Visual rendering — open the file in a browser if you need that
- Diagram syntax (Mermaid validates at render time)
- Code syntax in code-diff blocks
- Task code uniqueness (rare enough that we don't pay the AST cost on every edit)
- Reference integrity (e.g., does a `data-progress-target` map to a valid key)

These can be added as a "deep-validate" recipe later if drift becomes a problem.

## On failure

- **`spec-meta script missing`** — Someone deleted the `<script id="spec-meta">` block or changed its `id`. Restore it.
- **`json.JSONDecodeError`** — The JSON inside `<script id="spec-meta">` is malformed. Re-read the file, identify the broken character (usually a missing quote or trailing comma), fix.
- **`sentinel mismatch`** — A `<!-- region:X -->` or `<!-- endregion:X -->` was deleted, duplicated, or had its name changed. The error prints both lists; diff them to find the culprit.

## Dev-mode equivalent

`spec-runtime.js` includes a `validate()` function that runs the same checks when `localStorage.specmintDebug === "1"` is set in the browser. Console warnings appear if anything is wrong. Useful during interactive iteration; not a substitute for the CLI check during automated edits.
