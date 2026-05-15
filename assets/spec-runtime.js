/*
 * spec-runtime.js — single shared runtime for every SPEC.html in this project.
 * TDD variant: adds RGR cycle counting and "Current TDD phase" derivation.
 *
 * Lives at .specs/assets/spec-runtime.js. Each SPEC.html loads it via:
 *   <script src="../assets/spec-runtime.js" defer></script>
 *
 * Functions (called from init() in this order):
 *   deriveProgress()        — Walks [data-task] and [data-phase], counts
 *                             completed vs total, writes derived strings into
 *                             every [data-progress-target] element. Re-runs
 *                             on any data-status mutation.
 *                             TDD additions:
 *                             - Counts .task--impl elements as RGR cycles
 *                               (writes tdd-cycles-done / tdd-cycles-total).
 *                             - Derives "Current TDD phase" (writes tdd-phase):
 *                                 in-progress IMPL task → its data-tdd-phase
 *                                 else first pending TEST task → "RED"
 *                                 else first pending IMPL task → "GREEN"
 *                                 else → "—"
 *   mountMermaid()          — Loads Mermaid v11 ESM from jsDelivr only when
 *                             at least one <pre class="mermaid"> exists.
 *   mountPrism()            — Loads PrismJS core + autoloader + diff-highlight
 *                             only when a <pre class="language-*"> exists.
 *   mountAnnotationArrows() — For each .wf-annotation[data-points-to], draws
 *                             an SVG line from the annotation to the referenced
 *                             element. Redraws on resize (debounced 100ms).
 *   mountCopyButtons()      — Click handler for [data-copy-section] buttons
 *                             that copies the section's text to the clipboard.
 *   mountTocActiveSection() — Highlights the current section in a left-rail
 *                             [data-toc] using IntersectionObserver.
 *   validate()              — Dev-mode only (localStorage.specmintDebug = "1").
 *                             Confirms #spec-meta JSON parses and every
 *                             <!-- region:X --> has a matching endregion.
 *
 * Source of truth split:
 *   - <script id="spec-meta"> JSON — slow-moving identity (id, title, dates)
 *   - data-status / data-current / data-tdd-phase — lifecycle state
 *   - All progress strings — DERIVED, never authored
 *
 * One data-status swap is the only edit needed to update every progress display.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // deriveProgress
  // ---------------------------------------------------------------------------

  function deriveProgress() {
    const tasks = document.querySelectorAll('[data-task][data-status]');
    const phases = document.querySelectorAll('[data-phase][data-status]');
    const ac = document.querySelectorAll('[data-ac][data-status]');
    const implTasks = document.querySelectorAll('.task--impl[data-task]');

    const counts = {
      spec: { done: 0, total: 0 },
      phases: { done: 0, total: phases.length },
      ac: { done: 0, total: ac.length },
      blockers: 0,
      perPhase: {},
      tddCycles: { done: 0, total: implTasks.length },
    };

    tasks.forEach((el) => {
      counts.spec.total++;
      const status = el.getAttribute('data-status');
      if (status === 'completed') counts.spec.done++;
      if (status === 'blocked') counts.blockers++;
      const phase = el.closest('[data-phase]');
      if (phase) {
        const id = phase.getAttribute('data-phase');
        counts.perPhase[id] ||= { done: 0, total: 0 };
        counts.perPhase[id].total++;
        if (status === 'completed') counts.perPhase[id].done++;
      }
    });

    implTasks.forEach((el) => {
      if (el.getAttribute('data-status') === 'completed') counts.tddCycles.done++;
    });

    phases.forEach((el) => {
      if (el.getAttribute('data-status') === 'completed') counts.phases.done++;
    });

    ac.forEach((el) => {
      if (el.getAttribute('data-status') === 'completed') counts.ac.done++;
    });

    // Derive current TDD phase. If any task is in-progress with data-tdd-phase,
    // use that. Else look at the first pending task:
    //   .task--test → RED (about to write failing test)
    //   .task--impl → GREEN (test exists, about to make it pass)
    let tddPhase = '—';
    const inProgress = document.querySelector('[data-task][data-status="in-progress"][data-tdd-phase]');
    if (inProgress) {
      tddPhase = inProgress.getAttribute('data-tdd-phase').toUpperCase();
    } else {
      const firstPending = Array.from(tasks).find((t) => t.getAttribute('data-status') === 'pending');
      if (firstPending) {
        if (firstPending.classList.contains('task--test')) tddPhase = 'RED';
        else if (firstPending.classList.contains('task--impl')) tddPhase = 'GREEN';
      }
    }

    const pct = (d, t) => (t === 0 ? 0 : Math.round((d / t) * 100));

    const values = {
      'spec-done': counts.spec.done,
      'spec-tasks-total': counts.spec.total,
      'spec-total': `${counts.spec.done}/${counts.spec.total}`,
      'spec-pct': `${pct(counts.spec.done, counts.spec.total)}%`,
      'phases-done': counts.phases.done,
      'phases-total': counts.phases.total,
      'ac-done': counts.ac.done,
      'ac-total': counts.ac.total,
      'ac-pct': `${pct(counts.ac.done, counts.ac.total)}%`,
      blockers: counts.blockers,
      'tdd-cycles-done': counts.tddCycles.done,
      'tdd-cycles-total': counts.tddCycles.total,
      'tdd-phase': tddPhase,
    };

    Object.entries(counts.perPhase).forEach(([id, { done, total }]) => {
      values[`phase-${id}-done`] = done;
      values[`phase-${id}-total`] = `${done}/${total}`;
      values[`phase-${id}-pct`] = `${pct(done, total)}%`;
    });

    document.querySelectorAll('[data-progress-target]').forEach((el) => {
      const key = el.getAttribute('data-progress-target');
      if (key in values) el.textContent = String(values[key]);
    });

    document.querySelectorAll('[data-progress-bar]').forEach((bar) => {
      const key = bar.getAttribute('data-progress-bar');
      const m = key.match(/^(spec|ac|phase-(.+))$/);
      if (!m) return;
      let done, total;
      if (m[1] === 'spec') { done = counts.spec.done; total = counts.spec.total; }
      else if (m[1] === 'ac') { done = counts.ac.done; total = counts.ac.total; }
      else { ({ done = 0, total = 0 } = counts.perPhase[m[2]] || {}); }
      bar.style.setProperty('--progress', total === 0 ? '0%' : `${(done / total) * 100}%`);
    });

    // Auto-inject a progress bar into each .scorecard__cell based on the
    // data-progress-target it contains. No SKILL.md change required.
    const cellRules = [
      { needles: ['spec-done', 'spec-tasks-total', 'spec-total'], done: counts.spec.done, total: counts.spec.total },
      { needles: ['phases-done', 'phases-total'],                  done: counts.phases.done, total: counts.phases.total },
      { needles: ['ac-done', 'ac-total'],                          done: counts.ac.done, total: counts.ac.total },
      { needles: ['tdd-cycles-done', 'tdd-cycles-total'],          done: counts.tddCycles.done, total: counts.tddCycles.total },
    ];
    document.querySelectorAll('.scorecard__cell').forEach((cell) => {
      const keys = Array.from(cell.querySelectorAll('[data-progress-target]'))
        .map((el) => el.getAttribute('data-progress-target'));
      // TDD phase cell — colour the value, attach a full-width bar.
      if (keys.includes('tdd-phase')) {
        let bar = cell.querySelector(':scope > .scorecard__bar');
        if (!bar) {
          bar = document.createElement('div');
          bar.className = 'scorecard__bar';
          cell.appendChild(bar);
        }
        bar.style.setProperty('--progress', '100%');
        const phaseLc = (tddPhase || '').toLowerCase();
        if (['red', 'green', 'refactor'].includes(phaseLc)) {
          cell.setAttribute('data-tdd-phase-value', phaseLc);
        } else {
          cell.removeAttribute('data-tdd-phase-value');
        }
        return;
      }
      const rule = cellRules.find((r) => r.needles.some((n) => keys.includes(n)));
      if (!rule) return;
      let bar = cell.querySelector(':scope > .scorecard__bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'scorecard__bar';
        cell.appendChild(bar);
      }
      const pctNum = rule.total === 0 ? 0 : (rule.done / rule.total) * 100;
      bar.style.setProperty('--progress', `${pctNum}%`);
      if (rule.total === 0) cell.setAttribute('data-progress', 'empty');
      else if (rule.done >= rule.total) cell.setAttribute('data-progress', 'complete');
      else cell.setAttribute('data-progress', 'partial');
    });

    // Per-phase header progress strip.
    document.querySelectorAll('.phase[data-phase]').forEach((phase) => {
      const id = phase.getAttribute('data-phase');
      const { done = 0, total = 0 } = counts.perPhase[id] || {};
      phase.style.setProperty('--progress', total === 0 ? '0%' : `${(done / total) * 100}%`);
    });
  }

  // ---------------------------------------------------------------------------
  // mountMermaid
  // ---------------------------------------------------------------------------

  async function mountMermaid() {
    const nodes = document.querySelectorAll('pre.mermaid');
    if (!nodes.length) return;

    // Stash original Mermaid source on each node BEFORE render — Mermaid v11
    // replaces the pre's content with the rendered SVG, so the source is
    // otherwise lost (and the validator can't re-parse it later).
    nodes.forEach((n) => {
      if (!n.hasAttribute('data-mermaid-source')) {
        n.setAttribute('data-mermaid-source', n.textContent || '');
      }
    });

    let mermaid;
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
      mod.default.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        themeVariables: {
          background: '#FFFFFF',
          primaryColor: '#FFFFFF',
          primaryBorderColor: '#D0D7DE',
          primaryTextColor: '#1F2328',
          secondaryColor: '#F6F8FA',
          tertiaryColor: '#DDE7FF',
          lineColor: '#656D76',
          textColor: '#1F2328',
          actorBkg: '#F6F8FA',
          actorBorder: '#AFB8C1',
          actorTextColor: '#1F2328',
          actorLineColor: '#D0D7DE',
          signalColor: '#0535C1',
          signalTextColor: '#1F2328',
          labelBoxBkgColor: '#DDE7FF',
          labelBoxBorderColor: '#0535C1',
          labelTextColor: '#0535C1',
          loopTextColor: '#656D76',
          noteBkgColor: '#FFF8C5',
          noteBorderColor: '#9A6700',
          noteTextColor: '#1F2328',
          activationBkgColor: '#DDE7FF',
          activationBorderColor: '#0535C1',
          attributeBackgroundColorOdd: '#FFFFFF',
          attributeBackgroundColorEven: '#F6F8FA',
          mainBkg: '#FFFFFF',
          nodeBorder: '#AFB8C1',
          nodeTextColor: '#1F2328',
          clusterBkg: '#F6F8FA',
          clusterBorder: '#D0D7DE',
          edgeLabelBackground: '#FFFFFF',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
          fontSize: '13px',
        },
      });
      mermaid = mod.default;
      window.__specmintMermaid = mermaid;
    } catch (e) {
      console.warn('[specmint] Mermaid library failed to load — diagram source remains readable as text.', e);
      return;
    }

    // Render each diagram in its own try/catch so one bad block doesn't
    // abort the rest (or skip mountDiagramModal). Mermaid's run() mutates
    // nodes in place and replaces content with the SVG (or an error svg).
    for (const node of nodes) {
      try {
        await mermaid.run({ nodes: [node] });
      } catch (e) {
        const fig = node.closest('figure.diagram');
        const label = fig && fig.querySelector('.diagram__label');
        const tag = label ? `"${label.textContent.trim()}"` : '(unlabeled)';
        console.warn(`[specmint] Mermaid parse error in diagram ${tag} — source preserved on data-mermaid-source. Page continues.`, e);
        if (fig) fig.classList.add('diagram--error');
      }
    }

    mountDiagramModal();
  }

  // ---------------------------------------------------------------------------
  // mountDiagramModal — click a figure.diagram to open it in a fullscreen
  // dialog with wheel-zoom + click-drag pan. Called from mountMermaid after
  // SVGs exist; if there are no diagrams it is a no-op.
  // ---------------------------------------------------------------------------

  function mountDiagramModal() {
    const diagrams = document.querySelectorAll('figure.diagram');
    if (!diagrams.length) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'diagram-modal';
    dialog.innerHTML =
      '<button type="button" class="diagram-modal__close" aria-label="Close (Esc)">×</button>' +
      '<div class="diagram-modal__hint">Wheel = zoom · Drag = pan · Double-click = reset · Esc = close</div>' +
      '<div class="diagram-modal__viewport"><div class="diagram-modal__pan"></div></div>';
    document.body.appendChild(dialog);

    const viewport = dialog.querySelector('.diagram-modal__viewport');
    const pan = dialog.querySelector('.diagram-modal__pan');
    const closeBtn = dialog.querySelector('.diagram-modal__close');

    let scale = 1, tx = 0, ty = 0;
    let dragging = false, startX = 0, startY = 0, startTx = 0, startTy = 0;

    function applyTransform() {
      pan.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }
    function fit() { scale = 1; tx = 0; ty = 0; applyTransform(); }

    diagrams.forEach((fig) => {
      fig.addEventListener('click', () => {
        const svg = fig.querySelector('svg');
        if (!svg) return;
        const clone = svg.cloneNode(true);
        clone.removeAttribute('width');
        clone.removeAttribute('height');
        clone.removeAttribute('style');
        clone.style.width = '100%';
        clone.style.height = '100%';
        pan.replaceChildren(clone);
        fit();
        dialog.showModal();
      });
    });

    closeBtn.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => pan.replaceChildren());

    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = Math.pow(1.15, -Math.sign(e.deltaY));
      const newScale = Math.max(0.2, Math.min(10, scale * factor));
      tx = px - (px - tx) * (newScale / scale);
      ty = py - (py - ty) * (newScale / scale);
      scale = newScale;
      applyTransform();
    }, { passive: false });

    viewport.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      startTx = tx; startTy = ty;
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      tx = startTx + (e.clientX - startX);
      ty = startTy + (e.clientY - startY);
      applyTransform();
    });
    viewport.addEventListener('pointerup', (e) => {
      dragging = false;
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    });
    viewport.addEventListener('dblclick', fit);
  }

  // ---------------------------------------------------------------------------
  // mountPrism
  // ---------------------------------------------------------------------------

  function mountPrism() {
    // Normalize every <pre> inside a figure.code-diff so PrismJS will pick it
    // up even if the AI forgot one of the required hooks:
    //   1. <pre> must carry `language-diff-LANG` AND `diff-highlight`
    //   2. Content must be wrapped in <code> (PrismJS does not highlight
    //      bare <pre> children)
    document.querySelectorAll('figure.code-diff').forEach((fig) => {
      const lang = (fig.getAttribute('data-language') || 'plaintext')
        .toLowerCase().replace(/[^a-z0-9+-]/g, '');
      if (lang && lang !== 'plaintext') {
        const meta = fig.querySelector('.code-diff__meta') || fig.querySelector('figcaption');
        if (meta && !meta.querySelector(':scope > .code-diff__lang')) {
          const chip = document.createElement('span');
          chip.className = 'code-diff__lang';
          chip.textContent = lang;
          meta.prepend(chip);
        }
      }
      fig.querySelectorAll('pre').forEach((pre) => {
        if (!Array.from(pre.classList).some((c) => /^language-diff(-|$)/.test(c))) {
          Array.from(pre.classList).filter((c) => c.startsWith('language-')).forEach((c) => pre.classList.remove(c));
          pre.classList.add(`language-diff-${lang}`);
        }
        if (!pre.classList.contains('diff-highlight')) pre.classList.add('diff-highlight');
        if (!pre.querySelector(':scope > code')) {
          const code = document.createElement('code');
          code.className = pre.className;
          while (pre.firstChild) code.appendChild(pre.firstChild);
          pre.appendChild(code);
        }
      });
    });

    if (!document.querySelector('pre[class*="language-"]')) return;

    const cssHrefs = [
      'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.min.css',
      'https://cdn.jsdelivr.net/npm/prismjs@1/plugins/diff-highlight/prism-diff-highlight.min.css',
    ];
    cssHrefs.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });

    const jsSrcs = [
      'https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-core.min.js',
      'https://cdn.jsdelivr.net/npm/prismjs@1/plugins/autoloader/prism-autoloader.min.js',
      'https://cdn.jsdelivr.net/npm/prismjs@1/plugins/diff-highlight/prism-diff-highlight.min.js',
    ];
    const loadNext = (i) => {
      if (i >= jsSrcs.length) {
        if (window.Prism && window.Prism.highlightAll) window.Prism.highlightAll();
        return;
      }
      const s = document.createElement('script');
      s.src = jsSrcs[i];
      s.onload = () => loadNext(i + 1);
      s.onerror = () => console.warn('[specmint] PrismJS failed to load — code blocks render as plain text.');
      document.head.appendChild(s);
    };
    loadNext(0);
  }

  // ---------------------------------------------------------------------------
  // mountAnnotationArrows
  // ---------------------------------------------------------------------------

  function mountAnnotationArrows() {
    const frames = document.querySelectorAll('.wf-frame');
    if (frames.length === 0) return;

    const draw = () => {
      frames.forEach((frame) => {
        let svg = frame.querySelector('svg.wf-arrow-overlay');
        if (!svg) {
          svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.classList.add('wf-arrow-overlay');
          svg.setAttribute('aria-hidden', 'true');
          frame.appendChild(svg);
        }
        const frameRect = frame.getBoundingClientRect();
        svg.setAttribute('viewBox', `0 0 ${frameRect.width} ${frameRect.height}`);
        svg.setAttribute('width', frameRect.width);
        svg.setAttribute('height', frameRect.height);
        svg.innerHTML = '';

        frame.querySelectorAll('.wf-annotation[data-points-to]').forEach((note) => {
          const targetId = note.getAttribute('data-points-to');
          const target = frame.querySelector(`#${CSS.escape(targetId)}`);
          if (!target) return;
          const noteRect = note.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const x1 = noteRect.left + noteRect.width / 2 - frameRect.left;
          const y1 = noteRect.top + noteRect.height / 2 - frameRect.top;
          const x2 = targetRect.left + targetRect.width / 2 - frameRect.left;
          const y2 = targetRect.top + targetRect.height / 2 - frameRect.top;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const dx = (x2 - x1) * 0.3;
          line.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
          line.setAttribute('class', 'wf-arrow-path');
          svg.appendChild(line);
        });
      });
    };

    draw();
    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(draw, 100);
    });
  }

  // ---------------------------------------------------------------------------
  // mountCopyButtons
  // ---------------------------------------------------------------------------

  function mountCopyButtons() {
    document.querySelectorAll('[data-copy-section]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetSel = btn.getAttribute('data-copy-section');
        const target = document.querySelector(targetSel);
        if (!target) return;
        try {
          await navigator.clipboard.writeText(target.innerText.trim());
          const original = btn.textContent;
          btn.textContent = 'Copied';
          setTimeout(() => { btn.textContent = original; }, 1200);
        } catch (e) {
          console.warn('[specmint] Copy failed:', e);
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // mountTocActiveSection
  // ---------------------------------------------------------------------------

  function mountTocActiveSection() {
    const toc = document.querySelector('[data-toc]');
    if (!toc) return;
    const sections = document.querySelectorAll('section[id], article[id]');
    if (sections.length === 0) return;
    const links = new Map();
    toc.querySelectorAll('a[href^="#"]').forEach((a) => links.set(a.getAttribute('href').slice(1), a));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = links.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach((s) => observer.observe(s));
  }

  // ---------------------------------------------------------------------------
  // validate — full spec validator. Returns an array of {area, level, msg}.
  //   - Auto-runs after init; logs only when issues exist.
  //   - Manual invocation: call window.specmintValidate() — always logs.
  //   - Verbose dev mode: localStorage.specmintDebug = "1" forces a summary
  //     even when the spec is clean.
  //   - TDD additions: requires "testing" and "tdd-log" regions, checks that
  //     every IMPL task has a "satisfies [TEST-XX-NN]" reference.
  // ---------------------------------------------------------------------------

  async function validate({ alwaysLog = false } = {}) {
    const issues = [];
    const debug = (typeof localStorage !== 'undefined' && localStorage.getItem('specmintDebug') === '1');

    // 1. JSON metadata
    const meta = document.getElementById('spec-meta');
    if (!meta) {
      issues.push({ area: 'meta', level: 'error', msg: '#spec-meta script missing from <head>' });
    } else {
      try {
        const obj = JSON.parse(meta.textContent);
        ['id', 'title', 'status', 'created', 'updated'].forEach((k) => {
          if (!(k in obj)) issues.push({ area: 'meta', level: 'error', msg: `Required field "${k}" missing from spec-meta JSON` });
        });
      } catch (e) {
        issues.push({ area: 'meta', level: 'error', msg: `spec-meta JSON parse error: ${e.message}` });
      }
    }

    // 2. Region / endregion pairing
    const htmlText = document.documentElement.outerHTML;
    const opens = (htmlText.match(/<!--\s*region:([\w-]+)\s*-->/g) || []).map((s) => s.match(/region:([\w-]+)/)[1]);
    const closes = (htmlText.match(/<!--\s*endregion:([\w-]+)\s*-->/g) || []).map((s) => s.match(/endregion:([\w-]+)/)[1]);
    const oSorted = [...opens].sort().join('|');
    const cSorted = [...closes].sort().join('|');
    if (oSorted !== cSorted) {
      const onlyOpens = opens.filter((n) => !closes.includes(n));
      const onlyCloses = closes.filter((n) => !opens.includes(n));
      issues.push({
        area: 'regions',
        level: 'error',
        msg: `region/endregion mismatch — unclosed: [${onlyOpens.join(', ') || 'none'}] orphan close: [${onlyCloses.join(', ') || 'none'}]`,
      });
    }

    // 3. Task code uniqueness
    const taskCodes = Array.from(document.querySelectorAll('[data-task]')).map((el) => el.getAttribute('data-task'));
    const counts = Object.create(null);
    taskCodes.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    const dupCodes = Object.keys(counts).filter((c) => counts[c] > 1);
    if (dupCodes.length) {
      issues.push({ area: 'tasks', level: 'error', msg: `Duplicate task code(s): ${dupCodes.join(', ')}` });
    }

    // 4. Required regions present (warn only — some are optional)
    //    TDD specs additionally require "testing" and "tdd-log".
    const required = ['meta', 'header', 'overview', 'acceptance', 'architecture', 'testing', 'libraries', 'phases', 'tdd-log', 'decisions'];
    required.forEach((name) => {
      if (!opens.includes(name)) issues.push({ area: 'regions', level: 'warn', msg: `Recommended region "${name}" not found` });
    });

    // 5. TDD-specific: every IMPL task should reference a TEST task
    const implTasks = Array.from(document.querySelectorAll('.task--impl'));
    implTasks.forEach((el) => {
      const code = el.getAttribute('data-task') || '(unknown)';
      const text = el.textContent || '';
      if (!/\bsatisfies\s*\[?\s*TEST-/i.test(text) && !/→\s*\[?TEST-/.test(text)) {
        issues.push({ area: 'tdd', level: 'warn', msg: `IMPL task [${code}] has no "satisfies [TEST-XX-NN]" reference` });
      }
    });

    // 6. Mermaid block render status (rendered nodes are marked diagram--error
    //    by mountMermaid; if Mermaid is loaded we can also re-parse sources).
    const mermaidNodes = Array.from(document.querySelectorAll('pre.mermaid'));
    const errFigs = Array.from(document.querySelectorAll('figure.diagram--error'));
    errFigs.forEach((fig) => {
      const label = fig.querySelector('.diagram__label');
      const tag = label ? `"${label.textContent.trim()}"` : '(unlabeled)';
      issues.push({ area: 'mermaid', level: 'error', msg: `Render failed for diagram ${tag} — inspect data-mermaid-source on its <pre class="mermaid">` });
    });
    if (window.__specmintMermaid && typeof window.__specmintMermaid.parse === 'function') {
      for (const node of mermaidNodes) {
        const fig = node.closest('figure.diagram');
        if (fig && fig.classList.contains('diagram--error')) continue;
        const src = node.getAttribute('data-mermaid-source') || node.textContent || '';
        try {
          await window.__specmintMermaid.parse(src);
        } catch (e) {
          const label = fig && fig.querySelector('.diagram__label');
          const tag = label ? `"${label.textContent.trim()}"` : '(unlabeled)';
          issues.push({ area: 'mermaid', level: 'error', msg: `Parse error in diagram ${tag}: ${(e && e.message ? e.message.split('\n')[0] : String(e))}` });
        }
      }
    }

    // 7. HTML-entity contamination inside Mermaid source (common AI authoring bug)
    mermaidNodes.forEach((node) => {
      const src = node.getAttribute('data-mermaid-source') || '';
      const hit = src.match(/&(amp|lt|gt|quot|#\d+);/);
      if (hit) {
        const fig = node.closest('figure.diagram');
        const label = fig && fig.querySelector('.diagram__label');
        const tag = label ? `"${label.textContent.trim()}"` : '(unlabeled)';
        issues.push({ area: 'mermaid', level: 'warn', msg: `Diagram ${tag} contains HTML entity "${hit[0]}" — Mermaid parses pre-content as plain text; use raw "<", ">", "&" characters` });
      }
    });

    // 8. ASCII art inside mockup figures (common AI authoring bug — mockups
    //    MUST compose from .wf-* / .ui-* primitives, never <pre> with boxes)
    document.querySelectorAll('figure.mockup').forEach((fig) => {
      const pres = fig.querySelectorAll('pre');
      pres.forEach((pre) => {
        const text = pre.textContent || '';
        const pipes = (text.match(/\|/g) || []).length;
        const dashRuns = (text.match(/-{4,}/g) || []).length;
        const corners = (text.match(/\+[-+]{2,}\+/g) || []).length;
        if ((pipes >= 6 && dashRuns >= 2) || corners >= 2) {
          const cap = fig.querySelector('figcaption');
          const tag = cap ? `"${cap.textContent.trim().slice(0, 60)}"` : '(uncaptioned)';
          issues.push({ area: 'mockup', level: 'warn', msg: `ASCII art detected inside mockup ${tag} — compose from .wf-* / .ui-* components instead (see references/wireframe-library.md or mockup-library.md)` });
        }
      });
    });

    // 9. Unescaped HTML special chars inside <pre><code> code blocks.
    //    <pre><code> is NOT a raw-text element in HTML5; unescaped "<", ">",
    //    "&" in the source are parsed as markup. Common AI authoring bug:
    //    pasting Java/TS generics (List<Object>), JSX (<Foo />), shell
    //    redirects (>>) or "&&" operators creates bogus child elements that
    //    silently swallow downstream <figure> / <section> content (often
    //    surfaces upstream as a region/endregion mismatch in check 2). Fix
    //    by replacing "<" with "&lt;", ">" with "&gt;", "&" with "&amp;" in
    //    the code body. See edit-recipes.md "CRITICAL: escape HTML inside
    //    <pre><code>".
    document.querySelectorAll('pre > code').forEach((code) => {
      const bogus = new Set();
      // PrismJS wraps tokens in <span class="token …">. Anything else inside
      // <pre><code> almost certainly came from unescaped angle brackets.
      code.querySelectorAll('*').forEach((el) => {
        if (el.tagName !== 'SPAN') bogus.add(el.tagName.toLowerCase());
      });
      if (bogus.size) {
        const fig = code.closest('figure');
        const cap = fig && fig.querySelector('figcaption');
        const tag = cap ? `"${cap.textContent.trim().slice(0, 80)}"` : '(uncaptioned)';
        issues.push({
          area: 'code',
          level: 'error',
          msg: `Unescaped angle bracket(s) inside <pre><code> in ${tag} — parser created bogus element(s) [${[...bogus].join(', ')}]. Replace "<" / ">" / "&" with "&lt;" / "&gt;" / "&amp;" in the code body.`,
        });
      }
    });

    // Reporting
    const errors = issues.filter((i) => i.level === 'error').length;
    const warnings = issues.filter((i) => i.level === 'warn').length;
    if (issues.length === 0) {
      if (alwaysLog || debug) console.info(`[specmint] validate OK — ${mermaidNodes.length} diagram(s), ${taskCodes.length} task(s), ${implTasks.length} IMPL task(s)`);
    } else {
      const label = `[specmint] validate — ${errors} error(s), ${warnings} warning(s)`;
      console.groupCollapsed(label);
      issues.forEach((i) => (i.level === 'error' ? console.warn : console.info)(`[${i.area}] ${i.msg}`));
      console.groupEnd();
    }
    return issues;
  }

  // Expose for manual invocation in the page console.
  window.specmintValidate = () => validate({ alwaysLog: true });

  // ---------------------------------------------------------------------------
  // init
  // ---------------------------------------------------------------------------

  async function init() {
    deriveProgress();
    mountPrism();
    mountAnnotationArrows();
    mountCopyButtons();
    mountTocActiveSection();

    // mountMermaid is awaited so validate() sees the final diagram--error
    // state for failed blocks.
    await mountMermaid();
    await validate();

    const observer = new MutationObserver(deriveProgress);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-status'],
      subtree: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
