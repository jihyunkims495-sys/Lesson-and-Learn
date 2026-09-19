/* Shared entrance motion for the existing prototype. Values remain presentation-only. */
(function () {
  'use strict';

  const DURATION = 1150;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const METRICS = [
    '.brief-impact b', '.brief-impact > span:not(.mono-label)',
    '.kpi strong', '.kpi .delta', '.decision-card strong',
    '.season-score > strong', '.season-score > .delta', '.season-score > small',
    '.season-score .fact b', '.observed-total b', '.item-row b', '.item-row .delta', '.risk-value',
    '.scenario .hero-num', '.scenario li b', '.matrix-table tbody td:not(:first-child)',
    '.report-summary > strong', '.report-summary > .delta', '.accuracy-ring b',
    '.history-row b:last-child', '.reason b', '.confidence strong',
    '.wb-metric > strong', '.lab-metric > strong',
    '.lab-scenario-select > strong', '.lab-scenario > dl dd', '.lab-scenario-metric > b'
  ].join(',');
  let observer = null;
  let frame = 0;
  let sequence = 0;
  let reducedMotion = false;
  const tasks = new Map();

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    frame = 0;
    let running = false;
    tasks.forEach(task => {
      if (task.started === null || task.finished) return;
      if (!task.element.isConnected) { finish(task); return; }
      const progress = Math.min(1, (now - task.started) / DURATION);
      task.draw(ease(progress));
      if (progress >= 1) finish(task);
      else running = true;
    });
    if (running) frame = requestAnimationFrame(tick);
  }

  function finish(task) {
    if (task.finished) return;
    task.draw(1);
    if (task.cleanup) task.cleanup();
    task.finished = true;
    task.element.dataset.motion = 'complete';
  }

  function begin(task) {
    if (task.started !== null || task.finished) return;
    if (reducedMotion) { finish(task); return; }
    task.started = performance.now();
    task.element.dataset.motion = 'running';
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function add(element, draw, kind, cleanup) {
    const task = { element, draw, cleanup, started: null, finished: false };
    tasks.set(element, task);
    element.dataset.motionKind = kind;
    element.dataset.motion = 'pending';
    if (reducedMotion) finish(task);
    else {
      draw(0);
      if (observer) observer.observe(element);
      else begin(task);
    }
  }

  function numberParts(text) {
    const expression = /[+\-−]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g;
    const parts = [];
    let cursor = 0;
    let match;
    while ((match = expression.exec(text))) {
      parts.push(text.slice(cursor, match.index));
      const original = match[0];
      const sign = /^[+\-−]/.test(original) ? original[0] : '';
      const digits = sign ? original.slice(1) : original;
      const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
      parts.push({ original, sign, decimals, grouped: digits.includes(','), value: Number(digits.replace(/,/g, '')) });
      cursor = match.index + original.length;
    }
    if (!parts.length) return null;
    parts.push(text.slice(cursor));
    return parts;
  }

  function format(part, progress, from = 0) {
    if (progress === 1) return part.original;
    const value = (from + (part.value - from) * progress).toFixed(part.decimals);
    const segments = value.split('.');
    if (part.grouped) segments[0] = segments[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return part.sign + segments.join('.');
  }

  function metricKey(element, index) {
    if (element.dataset.wbMetric) return 'wb:' + element.dataset.wbMetric;
    const scenario = element.closest('[data-lab-scenario]');
    if (scenario) {
      const row = element.closest('.lab-scenario-metric');
      const label = row ? row.querySelector(':scope > span')?.textContent : element.tagName === 'DD' ? element.previousElementSibling?.textContent : 'quantity';
      return 'scenario:' + scenario.dataset.labScenario + ':' + label;
    }
    const container = element.closest('.lab-metric');
    if (container) return 'lab:' + container.querySelector(':scope > span')?.textContent;
    return 'metric:' + index;
  }

  function metricEntries(root) {
    return [...root.querySelectorAll(METRICS)].filter(element => {
      // Labels such as arrival dates and SKU codes must never count from zero.
      const value = element.textContent.trim();
      return !/^\d{4}-\d{2}-\d{2}$/.test(value) && !element.closest('.wb-table, .lab-table');
    }).map((element, index) => ({element, key: metricKey(element, index)}));
  }

  function capture(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return {};
    return Object.fromEntries(metricEntries(root).map(({element,key}) => [key, element.textContent]));
  }

  function metric(element, key, previous) {
    // Walk text nodes instead of replacing innerHTML: nested accent spans remain intact.
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      const parts = numberParts(node.nodeValue);
      if (parts) nodes.push({ node, original: node.nodeValue, parts });
    }
    if (!nodes.length) return;
    const finalLabel = element.textContent;
    const before = previous?.[key];
    const oldParts = typeof before === 'string' ? numberParts(before)?.filter(part => typeof part !== 'string') : null;
    const newParts = numberParts(finalLabel)?.filter(part => typeof part !== 'string') || [];
    // If a short currency changes units (won -> eok), restart at zero rather than interpolate unlike units.
    const template = value => value.replace(/[+\-−]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g, '#');
    const compatible = oldParts && oldParts.length === newParts.length && template(before) === template(finalLabel);
    let partIndex = 0;
    nodes.forEach(item => item.parts.forEach(part => {
      if (typeof part !== 'string') {
        const oldPart = compatible ? oldParts[partIndex] : null;
        part.from = oldPart && oldPart.sign === part.sign ? oldPart.value : 0;
        partIndex++;
      }
    }));
    element.dataset.motionKey = key;
    element.dataset.motionValue = finalLabel;
    // A fixed accessible label prevents every animation frame being read in the page's live region.
    // role=img permits an accessible name on otherwise unnameable generic metric containers.
    if (!element.hasAttribute('role') && !['TD', 'TH'].includes(element.tagName)) element.setAttribute('role', 'img');
    element.setAttribute('aria-label', finalLabel.trim());
    element.setAttribute('aria-live', 'off');
    element.style.fontVariantNumeric = 'tabular-nums';
    if (before === finalLabel) {
      element.dataset.motionKind = 'count';
      element.dataset.motion = 'complete';
      return;
    }
    add(element, progress => {
      nodes.forEach(item => {
        item.node.nodeValue = progress === 1 ? item.original : item.parts.map(part => typeof part === 'string' ? part : format(part, progress, part.from)).join('');
      });
    }, 'count');
  }

  function chart(svg, shapes, bars) {
    if (!shapes.length && !bars.length) return;
    const bounds = svg.viewBox.baseVal;
    let clip = null;
    let clipRect = null;
    let definitions = null;
    const previousClips = [];
    const columns = bars.map(bar => ({
      bar, y: Number(bar.getAttribute('y')), height: Number(bar.getAttribute('height')),
      originalY: bar.getAttribute('y'), originalHeight: bar.getAttribute('height')
    }));
    if (shapes.length && !reducedMotion) {
      definitions = document.createElementNS(SVG_NS, 'defs');
      definitions.dataset.motionGenerated = 'true';
      clip = document.createElementNS(SVG_NS, 'clipPath');
      clip.id = 'ordo-motion-clip-' + (++sequence);
      clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
      clipRect = document.createElementNS(SVG_NS, 'rect');
      clipRect.setAttribute('x', String(bounds.x - 10));
      clipRect.setAttribute('y', String(bounds.y - 10));
      clipRect.setAttribute('height', String(bounds.height + 20));
      clip.appendChild(clipRect);
      definitions.appendChild(clip);
      svg.appendChild(definitions);
      shapes.forEach(shape => {
        previousClips.push({ shape, value: shape.getAttribute('clip-path') });
        shape.setAttribute('clip-path', 'url(#' + clip.id + ')');
      });
    }
    add(svg, progress => {
      if (clipRect) clipRect.setAttribute('width', String((bounds.width + 20) * progress));
      columns.forEach(column => {
        if (progress === 1) {
          column.bar.setAttribute('y', column.originalY);
          column.bar.setAttribute('height', column.originalHeight);
        } else {
          const height = column.height * progress;
          column.bar.setAttribute('y', String(column.y + column.height - height));
          column.bar.setAttribute('height', String(height));
        }
      });
    }, 'chart', () => {
      previousClips.forEach(({ shape, value }) => {
        if (value === null) shape.removeAttribute('clip-path');
        else shape.setAttribute('clip-path', value);
      });
      if (definitions) definitions.remove();
    });
  }

  function progressBar(element) {
    const originalTransform = element.style.transform;
    const originalOrigin = element.style.transformOrigin;
    element.style.transformOrigin = 'left center';
    add(element, progress => {
      element.style.transform = 'scaleX(' + progress + ')' + (originalTransform ? ' ' + originalTransform : '');
    }, 'progress', () => {
      element.style.transform = originalTransform;
      element.style.transformOrigin = originalOrigin;
    });
  }

  function ring(element) {
    const label = element.querySelector('b');
    const target = label ? Number.parseFloat(label.textContent) : NaN;
    if (!Number.isFinite(target)) return;
    const originalBackground = element.style.backgroundImage;
    const color = getComputedStyle(element).getPropertyValue('--orange').trim() || '#ff5a1f';
    add(element, progress => {
      const end = Math.max(0, Math.min(100, target * progress));
      element.style.backgroundImage = 'conic-gradient(' + color + ' 0% ' + end + '%, rgba(17,18,20,.12) ' + end + '% 100%)';
    }, 'ring', () => { element.style.backgroundImage = originalBackground; });
  }

  function stop() {
    if (observer) observer.disconnect();
    observer = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    tasks.forEach(finish);
    tasks.clear();
  }

  function start(root, options = {}) {
    stop();
    if (!root || typeof root.querySelectorAll !== 'function') return;
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const task = tasks.get(entry.target);
          if (task) begin(task);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
    }
    if (options.charts !== false) {
      // Interactive OrdoCharts owns its own reveals; do not clip its hit targets or cursor.
      root.querySelectorAll('.trajectory svg').forEach(svg => chart(svg, [...svg.querySelectorAll(':scope > path, :scope > circle')], []));
      root.querySelectorAll('.item-row svg').forEach(svg => chart(svg, [...svg.querySelectorAll('polyline')], []));
      root.querySelectorAll('.report-chart svg').forEach(svg => chart(svg, [...svg.querySelectorAll(':scope > path')], [...svg.querySelectorAll(':scope > rect')]));
      root.querySelectorAll('.wb-weekly-sales svg').forEach(svg => chart(svg, [...svg.querySelectorAll(':scope > polyline')], []));
      root.querySelectorAll('.progress > i, .assort-bars .bar > i').forEach(progressBar);
      root.querySelectorAll('.accuracy-ring').forEach(ring);
    }
    metricEntries(root).forEach(({element,key}) => metric(element,key,options.previous));
  }

  window.OrdoMotion = { start, stop, capture };
})();
