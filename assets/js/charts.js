/* Minimal SVG chart kit: element helper, tooltips, reveal-on-view, responsive redraw. No dependencies. */
window.Charts = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      if (k === 'style') n.setAttribute('style', attrs[k]);
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }

  function trimNum(s) { return s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
  function fmtUsd(m) {
    if (m == null) return '–';
    if (m === 0) return '$0';
    if (Math.abs(m) >= 1000) {
      const b = m / 1000;
      return '$' + trimNum(b >= 100 ? b.toFixed(0) : b >= 10 ? b.toFixed(1) : b.toFixed(2)) + 'bn';
    }
    if (m >= 100) return '$' + Math.round(m) + 'm';
    return '$' + trimNum(m.toFixed(2)) + 'm';
  }

  // Rounded data-end, square at the baseline (r capped by size).
  function hBarPath(x, y, w, h, r) {
    if (w <= 0) return '';
    r = Math.min(r, w, h / 2);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  }

  function niceMax(v, ticks) {
    if (v <= 0) return 1;
    const raw = v / ticks;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const steps = [1, 2, 2.5, 5, 10];
    const step = steps.find(s => s * mag >= raw) * mag;
    return { max: step * ticks, step };
  }

  // ---------- tooltip ----------
  const Tip = (function () {
    let node;
    function ensure() { node = node || document.getElementById('tooltip'); return node; }
    function show(evt, spec) {
      const t = ensure(); if (!t) return;
      t.replaceChildren();
      if (spec.value) { const v = document.createElement('div'); v.className = 'tt-value'; v.textContent = spec.value; t.appendChild(v); }
      if (spec.title) { const h = document.createElement('div'); h.className = 'tt-title'; h.textContent = spec.title; t.appendChild(h); }
      (spec.rows || []).forEach(r => {
        const row = document.createElement('div'); row.className = 'tt-row';
        if (r.color) { const k = document.createElement('span'); k.className = 'tt-key'; k.style.background = r.color; row.appendChild(k); }
        const s = document.createElement('span'); s.textContent = r.label; row.appendChild(s);
        t.appendChild(row);
      });
      if (spec.note) { const n = document.createElement('div'); n.className = 'tt-note'; n.textContent = spec.note; t.appendChild(n); }
      t.classList.add('show');
      move(evt);
    }
    function move(evt) {
      const t = ensure(); if (!t) return;
      let x, y;
      if (evt && evt.clientX != null && !(evt.type === 'focus' || evt.type === 'focusin')) { x = evt.clientX; y = evt.clientY; }
      else if (evt && evt.target && evt.target.getBoundingClientRect) { const b = evt.target.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top; }
      else return;
      const w = t.offsetWidth, h = t.offsetHeight, pad = 12;
      let left = x + 14, top = y - h - 12;
      if (left + w > window.innerWidth - pad) left = x - w - 14;
      if (left < pad) left = pad;
      if (top < pad) top = y + 18;
      t.style.left = left + 'px'; t.style.top = top + 'px';
    }
    function hide() { const t = ensure(); if (t) t.classList.remove('show'); }
    return { show, move, hide };
  })();

  // Attach hover + keyboard focus behaviour to a mark.
  function bindTip(mark, container, specFn) {
    mark.classList.add('mark');
    mark.setAttribute('tabindex', '0');
    const on = (e) => { container.classList.add('hovering'); mark.classList.add('hot'); Tip.show(e, specFn()); };
    const off = () => { container.classList.remove('hovering'); mark.classList.remove('hot'); Tip.hide(); };
    mark.addEventListener('pointerenter', on);
    mark.addEventListener('pointermove', (e) => Tip.move(e));
    mark.addEventListener('pointerleave', off);
    mark.addEventListener('focus', on);
    mark.addEventListener('blur', off);
  }

  // Reveal-on-view: adds .in-view once the element scrolls into view.
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.15 }) : null;
  function observe(node) {
    if (!io || reduceMotion) { node.classList.add('in-view'); return; }
    io.observe(node);
  }

  // Re-render a chart whenever its container width changes.
  function responsive(container, render) {
    let lastW = 0, raf;
    const run = () => {
      const w = Math.round(container.clientWidth);
      if (w && w !== lastW) { lastW = w; render(w); }
    };
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); }).observe(container);
    } else {
      window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); });
    }
    run();
  }

  function legend(node, items, shape) {
    node.replaceChildren();
    items.forEach(it => {
      const s = document.createElement('span');
      const i = document.createElement('i');
      i.style.background = it.color;
      if (shape === 'dot') i.className = 'ring';
      s.appendChild(i);
      s.appendChild(document.createTextNode(it.label));
      node.appendChild(s);
    });
  }

  function catColor(i) { return `var(--c${i + 1})`; }

  return { el, fmtUsd, Tip, bindTip, observe, responsive, legend, catColor, hBarPath, niceMax, reduceMotion };
})();
