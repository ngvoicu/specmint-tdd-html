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
  }

  // ---------------------------------------------------------------------------
  // mountMermaid
  // ---------------------------------------------------------------------------

  async function mountMermaid() {
    if (!document.querySelector('pre.mermaid')) return;
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
      mod.default.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });
    } catch (e) {
      console.warn('[specmint] Mermaid failed to load — diagram source remains readable as text.', e);
    }
  }

  // ---------------------------------------------------------------------------
  // mountPrism
  // ---------------------------------------------------------------------------

  function mountPrism() {
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
  // validate (dev-mode)
  // ---------------------------------------------------------------------------

  function validate() {
    if (typeof localStorage === 'undefined' || localStorage.getItem('specmintDebug') !== '1') return;
    const meta = document.getElementById('spec-meta');
    if (!meta) { console.warn('[specmint] #spec-meta missing'); return; }
    try { JSON.parse(meta.textContent); }
    catch (e) { console.warn('[specmint] #spec-meta is not valid JSON:', e); }

    const html = document.documentElement.outerHTML;
    const opens = (html.match(/<!--\s*region:(\w+)\s*-->/g) || []).map((s) => s.match(/region:(\w+)/)[1]);
    const closes = (html.match(/<!--\s*endregion:(\w+)\s*-->/g) || []).map((s) => s.match(/endregion:(\w+)/)[1]);
    const oSorted = [...opens].sort();
    const cSorted = [...closes].sort();
    if (oSorted.join('|') !== cSorted.join('|')) {
      console.warn('[specmint] Sentinel mismatch:', { opens: oSorted, closes: cSorted });
    }
  }

  // ---------------------------------------------------------------------------
  // init
  // ---------------------------------------------------------------------------

  function init() {
    deriveProgress();
    mountMermaid();
    mountPrism();
    mountAnnotationArrows();
    mountCopyButtons();
    mountTocActiveSection();
    validate();

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
