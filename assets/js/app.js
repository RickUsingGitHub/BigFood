/* Big Food on Trial — page controller. */
(function () {
  const F = window.FOOD, C = window.Charts;
  const { FOODS, TACTICS, EVENTS, OUTCOMES, GRID, GRID_SRC, SCORE } = F;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const link = (src, cls) => { const a = h('a', cls, src[0]); a.href = src[1]; a.target = '_blank'; a.rel = 'noopener'; return a; };

  const foodById = Object.fromEntries(FOODS.map(f => [f.id, f]));
  const tacticById = Object.fromEntries(TACTICS.map(t => [t.id, t]));
  const GROUPS = { science: 'Bending the science', spin: 'Spin', power: 'Power and lobbying', money: 'Plain cheating' };
  const GROUP_COLOR = { science: 'var(--c1)', spin: 'var(--c2)', power: 'var(--c7)', money: 'var(--c8)' };
  const VERDICT = { cut: 'Cut right down', limit: 'Limit it', fine: 'Fine for most', good: 'Probably good', depends: 'It depends' };
  const CERT = { strong: ['●●●', 'strong'], moderate: ['●●○', 'moderate'], weak: ['●○○', 'weak'] };
  const STATUS = { fined: 'Penalty or conviction', settled: 'Settled', verdict: 'Jury verdict (appeals possible)', ruled: 'Ruled misleading or improper',
    exposed: 'Exposed', retracted: 'Misconduct found', policy: 'Lobbying or policy fight', open: 'Case ongoing',
    funded: 'Industry-funded (disclosed)', unsupported: 'Health claims not supported' };
  const GRID_FOOD = { procmeat: 'meat', redmeat: 'meat' };
  const eventsFor = (pred) => EVENTS.filter(pred).sort((a, b) => a.year - b.year);
  const paid = (e) => (e.status === 'fined' || e.status === 'settled') && e.usd ? e.usd : 0;

  // ---------- theme + nav + reveal ----------
  function initChrome() {
    const btn = $('#themeBtn'), root = document.documentElement;
    const isDark = () => root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const setIcon = () => {
      btn.innerHTML = isDark()
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
      btn.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
    };
    setIcon();
    btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('bf-theme', next); } catch (e) {}
      setIcon();
    });
    const menu = $('#menuBtn'), nav = $('#nav');
    menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
    $$('#nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
    if ('IntersectionObserver' in window) {
      const links = Object.fromEntries($$('#nav a').map(a => [a.getAttribute('href').slice(1), a]));
      const obs = new IntersectionObserver((es) => es.forEach(e => {
        if (e.isIntersecting && links[e.target.id]) {
          Object.values(links).forEach(l => l.removeAttribute('aria-current'));
          links[e.target.id].setAttribute('aria-current', 'true');
        }
      }), { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(links).forEach(id => { const s = document.getElementById(id); if (s) obs.observe(s); });
    }
  }
  const revealAll = () => $$('.reveal').forEach(n => C.observe(n));

  // ---------- hero ----------
  function hero() {
    const box = $('#heroTiles');
    const paidTotal = EVENTS.reduce((a, e) => a + paid(e), 0);
    const verdicts = EVENTS.filter(e => e.status === 'verdict').reduce((a, e) => a + (e.usd || 0), 0);
    [
      ['Cases on file', String(EVENTS.length), 'fines, lawsuits, buried studies, front groups and lobbying wins'],
      ['Fines and settlements', 'US' + C.fmtUsd(paidTotal), `plus US${C.fmtUsd(verdicts)} in jury verdicts that can still be appealed`],
      ['Foods and drinks checked', String(FOODS.length), 'from sugar to seed oils'],
      ['Tactics in the playbook', String(TACTICS.length), 'many borrowed from Big Tobacco']
    ].forEach(([label, value, sub]) => {
      const t = h('div', 'tile');
      t.append(h('div', 'label', label), h('div', 'value', value), h('div', 'sub', sub));
      box.appendChild(t);
    });
  }

  // ---------- pills ----------
  function vpill(v) { const s = h('span', 'vpill ' + v); s.appendChild(h('i')); s.appendChild(document.createTextNode(VERDICT[v])); return s; }
  function cert(c) { const s = h('span', 'cert', 'Evidence: '); s.appendChild(h('b', null, CERT[c][0])); s.appendChild(document.createTextNode(' ' + CERT[c][1])); return s; }

  // ---------- hype gap ----------
  let hypeSort = 'gap';
  function hype() {
    const box = $('#hypeChart');
    C.legend($('#hypeLegend'), [{ color: 'var(--axis-ink)', label: 'What we were told' }, { color: 'var(--ink)', label: 'What the evidence says (coloured by verdict)' }], 'dot');
    const draw = (W) => {
      box.replaceChildren();
      const rows = FOODS.slice().sort((a, b) => hypeSort === 'gap'
        ? Math.abs(b.told.pos - b.now.pos) - Math.abs(a.told.pos - a.now.pos) || a.now.pos - b.now.pos
        : a.now.pos - b.now.pos);
      const narrow = W < 560, labelW = narrow ? 124 : 190, right = 18, top = 30, rowH = narrow ? 30 : 32;
      const H = top + rows.length * rowH + 8;
      const x = (v) => labelW + ((v + 2) / 4) * (W - labelW - right);
      const svg = C.el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': 'What we were told versus what the evidence says, for each food' });
      [[-2, narrow ? 'Harmful' : 'Clearly harmful'], [0, 'Neutral'], [2, narrow ? 'Good' : 'Good for you']].forEach(([v, t]) => {
        C.el('line', { x1: x(v), x2: x(v), y1: top - 6, y2: H - 4, class: v === 0 ? 'base-line' : 'grid-line' }, svg);
        C.el('text', { x: x(v), y: 14, 'text-anchor': v === -2 ? 'start' : v === 2 ? 'end' : 'middle', class: 'axis-text', text: t }, svg);
      });
      [-1, 1].forEach(v => C.el('line', { x1: x(v), x2: x(v), y1: top - 6, y2: H - 4, class: 'grid-line' }, svg));
      rows.forEach((f, i) => {
        const y = top + i * rowH + rowH / 2;
        const g = C.el('g', { class: 'hype-row', tabindex: '0', role: 'button', 'aria-label': `${f.name}: told "${f.told.text}"; evidence: ${f.now.text} Open the file.` }, svg);
        C.el('rect', { x: 0, y: y - rowH / 2, width: W, height: rowH, rx: 6, class: 'row-bg', style: 'fill:transparent' }, g);
        C.el('text', { x: labelW - 12, y: y + 4, 'text-anchor': 'end', class: 'label-text', text: narrow && f.short ? f.short : f.name }, g);
        const col = `var(--v-${f.verdict})`;
        const worse = f.now.pos < f.told.pos;
        C.el('line', { x1: x(f.told.pos), x2: x(f.now.pos), y1: y, y2: y, style: `stroke:${worse ? 'var(--critical)' : 'var(--good)'};stroke-width:3;stroke-opacity:.55` }, g);
        C.el('circle', { cx: x(f.told.pos), cy: y, r: 6.5, style: 'fill:var(--surface);stroke:var(--axis-ink);stroke-width:2' }, g);
        const dot = C.el('circle', { cx: x(f.now.pos), cy: y, r: 7.5, style: `fill:${col};stroke:var(--surface);stroke-width:2` }, g);
        const tip = () => ({ title: f.name, rows: [{ color: 'var(--axis-ink)', label: `Told: ${f.told.text} (${f.told.who})` }, { color: col, label: `Evidence: ${f.now.text}` }], note: 'Click to open the full file' });
        g.addEventListener('pointerenter', (e) => { box.classList.add('hovering'); dot.classList.add('hot'); C.Tip.show(e, tip()); });
        g.addEventListener('pointermove', (e) => C.Tip.move(e));
        g.addEventListener('pointerleave', () => { box.classList.remove('hovering'); dot.classList.remove('hot'); C.Tip.hide(); });
        g.addEventListener('click', () => { C.Tip.hide(); openFood(f.id); });
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFood(f.id); } });
      });
      box.appendChild(svg);
    };
    let lastW = 0;
    C.responsive(box, (W) => { lastW = W; draw(W); });
    $$('[data-hsort]').forEach(b => b.addEventListener('click', () => {
      hypeSort = b.dataset.hsort;
      $$('[data-hsort]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      draw(lastW || box.clientWidth);
    }));
  }

  // ---------- food cards ----------
  function foods() {
    const chips = $('#foodFilters');
    [['all', 'All ' + FOODS.length]].concat(Object.entries(VERDICT)).forEach(([k, lab], i) => {
      const b = h('button', 'chip', lab); b.dataset.v = k; b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => {
        $$('button', chips).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        $$('.food').forEach(c => { c.hidden = k !== 'all' && c.dataset.v !== k; });
      });
      chips.appendChild(b);
    });
    const box = $('#foods');
    FOODS.forEach(f => {
      const n = eventsFor(e => e.foods.includes(f.id)).length;
      const b = h('button', 'tactic food reveal'); b.dataset.v = f.verdict; b.id = 'card-' + f.id;
      const top = h('div', 'f-top'); top.append(vpill(f.verdict), cert(f.certainty));
      b.append(top, h('div', 't-title', f.name), h('div', 'f-sub', f.sub), h('div', 't-hook', f.one));
      const st = h('div', 't-stat');
      if (n) { st.appendChild(h('strong', null, String(n))); st.appendChild(document.createTextNode(n === 1 ? ' case on file' : ' cases on file')); }
      else st.textContent = 'No scandals on file';
      b.appendChild(st);
      b.addEventListener('click', () => openFood(f.id));
      box.appendChild(b);
    });
  }

  // ---------- case element ----------
  function caseEl(e) {
    const d = h('div', 'case');
    d.append(h('div', 'yr', String(e.year)), h('div', 'ttl', e.title), h('div', 'amt', e.usd ? 'US' + C.fmtUsd(e.usd) : ''));
    d.appendChild(h('div', 'body', e.text));
    const tags = h('div', 'tags');
    const st = h('span', 'tag' + (e.status === 'fined' ? ' crim' : e.status === 'verdict' || e.status === 'open' ? ' warn' : ''), STATUS[e.status]);
    const ta = h('span', 'tag'); const dot = h('i'); dot.style.background = GROUP_COLOR[tacticById[e.tactic].group]; ta.append(dot, document.createTextNode(tacticById[e.tactic].name));
    tags.append(st, ta, h('span', 'tag', e.where), h('span', 'tag', e.who));
    d.appendChild(tags);
    const s = h('div', 'src-links'); e.src.forEach(x => s.appendChild(link(x))); d.appendChild(s);
    return d;
  }

  // ---------- sheet ----------
  const sheet = () => $('#sheet');
  function openSheet(build, hash) {
    const body = $('#sheetBody'); body.replaceChildren(); build(body);
    const d = sheet();
    if (!d.open) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
    $('.sheet-inner', d).scrollTop = 0;
    if (hash) history.replaceState(null, '', '#' + hash);
  }
  function openFood(id) {
    const f = foodById[id]; if (!f) return;
    openSheet((b) => {
      const top = h('div', 'f-top'); top.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap';
      top.append(vpill(f.verdict), cert(f.certainty));
      b.append(top, h('h3', null, f.name)); b.lastChild.id = 'sheetTitle';
      b.appendChild(h('p', 'muted', f.sub));
      b.appendChild(h('p', 'pull', f.one));
      const tn = h('div', 'told-now');
      const t1 = h('div'); t1.append(h('div', 'lbl', 'What we were told'), h('div', 'txt', f.told.text), h('div', 'who', f.told.who));
      const t2 = h('div', 'now'); t2.append(h('div', 'lbl', 'What the evidence says now'), h('div', 'txt', f.now.text));
      tn.append(t1, t2); b.appendChild(tn);
      b.appendChild(h('h4', null, 'The science'));
      const ul = h('ul', 'sci');
      f.science.forEach(([text, ...srcs]) => {
        const li = h('li', null, text + ' ');
        const s = h('span', 's'); srcs.forEach((x, i) => { if (i) s.appendChild(document.createTextNode(' · ')); s.appendChild(link(x)); });
        li.appendChild(s); ul.appendChild(li);
      });
      b.appendChild(ul);
      const evs = eventsFor(e => e.foods.includes(f.id));
      b.appendChild(h('h4', null, evs.length ? `The dodgy history (${evs.length})` : 'The dodgy history'));
      if (evs.length) { const l = h('div', 'case-list'); evs.forEach(e => l.appendChild(caseEl(e))); b.appendChild(l); }
      else b.appendChild(h('p', 'muted', 'Nothing major on file. Coffee research is part-funded by the coffee industry (through the Institute for Scientific Information on Coffee), so check who paid, but no scandals.'));
      b.appendChild(h('h4', null, 'In Australia'));
      b.appendChild(h('p', 'oz-note', f.oz));
      b.appendChild(h('h4', null, 'What to actually do'));
      b.appendChild(h('div', 'fix', f.tip));
    }, 'food-' + id);
  }
  function openTactic(id) {
    const t = tacticById[id]; if (!t) return;
    openSheet((b) => {
      b.appendChild(h('span', 'kicker', GROUPS[t.group]));
      b.appendChild(h('h3', null, t.name)); b.lastChild.id = 'sheetTitle';
      b.appendChild(h('p', 'pull', t.hook));
      b.appendChild(h('p', null, t.desc));
      const evs = eventsFor(e => e.tactic === id);
      b.appendChild(h('h4', null, `The cases (${evs.length})`));
      const l = h('div', 'case-list'); evs.forEach(e => l.appendChild(caseEl(e))); b.appendChild(l);
      b.appendChild(h('h4', null, 'Has it been fixed?'));
      b.appendChild(h('div', 'fix', t.fix));
    }, 'tactic-' + id);
  }
  function initSheet() {
    const d = sheet();
    $('#sheetClose').addEventListener('click', () => d.close());
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    d.addEventListener('close', () => { if (/^#(food|tactic)-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); });
  }
  function onHash() {
    const m = location.hash.match(/^#(food|tactic)-([\w-]+)$/);
    if (m) (m[1] === 'food' ? openFood : openTactic)(m[2]);
  }

  // ---------- evidence grid ----------
  const VAL = { '-2': ['v-2', '−−', 'Clearly harmful'], '-1': ['v-1', '−', 'Probably harmful'], '0': ['v0', '0', 'No clear link'],
    '1': ['v1', '+', 'Probably protective'], '2': ['v2', '++', 'Clearly protective'], 'u': ['vu', '?', 'Unclear or disputed'] };
  function grid() {
    const leg = $('#evLegend');
    ['-2', '-1', '0', '1', '2', 'u'].forEach(k => {
      const s = h('span'); const c = h('span', 'cell ' + VAL[k][0], VAL[k][1]); c.setAttribute('aria-hidden', 'true');
      s.append(c, document.createTextNode(VAL[k][2])); leg.appendChild(s);
    });
    const t = $('#evGrid');
    const thead = h('thead'), tr = h('tr');
    tr.appendChild(h('th', null, ''));
    OUTCOMES.forEach(o => { const th = h('th', null, o.name); th.scope = 'col'; tr.appendChild(th); });
    thead.appendChild(tr); t.appendChild(thead);
    const tb = h('tbody');
    GRID.forEach(r => {
      const row = h('tr');
      const th = h('th', 'row' + (r.bench ? ' bench' : ''), r.name + (r.bench ? ' (benchmark)' : '')); th.scope = 'row'; row.appendChild(th);
      OUTCOMES.forEach(o => {
        const td = h('td'); const [v, note] = r.cells[o.id] || [null];
        if (v === null || v === undefined) { const c = h('span', 'cell vn', '·'); c.setAttribute('aria-label', 'Not relevant'); td.appendChild(c); }
        else {
          const k = String(v), c = h('button', 'cell ' + VAL[k][0], VAL[k][1]);
          c.setAttribute('aria-label', `${r.name}, ${o.name}: ${VAL[k][2]}. ${note || ''}`);
          c.setAttribute('aria-pressed', 'false');
          c.addEventListener('click', () => {
            $$('.cell[aria-pressed="true"]', t).forEach(x => x.setAttribute('aria-pressed', 'false'));
            c.setAttribute('aria-pressed', 'true');
            const n = $('#evNote'); n.replaceChildren();
            n.appendChild(h('div', 'kicker', `${r.name} → ${o.name}`));
            n.appendChild(h('div', 'big-num', VAL[k][2])).style.fontSize = '1.3rem';
            n.appendChild(h('p', null, note || ''));
            const fid = GRID_FOOD[r.id] || (foodById[r.id] ? r.id : null);
            if (fid) { const b = h('button', 'btn', `Open the ${foodById[fid].name.toLowerCase()} file`); b.addEventListener('click', () => openFood(fid)); n.appendChild(b); }
          });
          td.appendChild(c);
        }
        row.appendChild(td);
      });
      tb.appendChild(row);
    });
    t.appendChild(tb);
    const s = $('#evSources'); s.appendChild(document.createTextNode('Main sources: '));
    GRID_SRC.forEach((x, i) => { if (i) s.appendChild(document.createTextNode(' · ')); s.appendChild(link(x)); });
  }

  // ---------- playbook ----------
  function tactics() {
    const box = $('#tactics');
    TACTICS.forEach((t, i) => {
      const n = EVENTS.filter(e => e.tactic === t.id).length;
      const b = h('button', 'tactic reveal'); b.dataset.group = t.group;
      b.append(h('span', 't-num', String(i + 1).padStart(2, '0')), h('div', 't-group', GROUPS[t.group]), h('div', 't-title', t.name), h('div', 't-hook', t.hook));
      const st = h('div', 't-stat'); st.appendChild(h('strong', null, String(n))); st.appendChild(document.createTextNode(n === 1 ? ' case' : ' cases'));
      b.appendChild(st);
      b.addEventListener('click', () => openTactic(t.id));
      box.appendChild(b);
    });
    $$('#tacticFilters .chip').forEach(c => c.addEventListener('click', () => {
      $$('#tacticFilters .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c)));
      $$('#tactics .tactic').forEach(t => { t.hidden = c.dataset.group !== 'all' && t.dataset.group !== c.dataset.group; });
    }));
  }

  // ---------- timeline ----------
  function timeline() {
    const box = $('#timeline');
    C.legend($('#tlLegend'), Object.keys(GROUPS).map(g => ({ color: GROUP_COLOR[g], label: GROUPS[g] })));
    C.responsive(box, (W) => {
      box.replaceChildren();
      const y0 = 1965, y1 = 2027, left = 14, right = 14;
      const counts = {}; EVENTS.forEach(e => { counts[e.year] = (counts[e.year] || 0) + 1; });
      const maxStack = Math.max(...Object.values(counts));
      const r = W < 520 ? 4.5 : 6, step = r * 2 + 2, axisY = 14 + maxStack * step, H = axisY + 26;
      const x = (yr) => left + ((yr - y0) / (y1 - y0)) * (W - left - right);
      const svg = C.el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': 'Timeline of cases by year' });
      C.el('line', { x1: left, x2: W - right, y1: axisY, y2: axisY, class: 'base-line' }, svg);
      for (let yr = 1970; yr <= 2020; yr += 10) {
        C.el('line', { x1: x(yr), x2: x(yr), y1: axisY, y2: axisY + 4, class: 'base-line' }, svg);
        C.el('text', { x: x(yr), y: axisY + 18, 'text-anchor': 'middle', class: 'axis-text', text: yr }, svg);
      }
      const stack = {};
      EVENTS.slice().sort((a, b) => a.year - b.year).forEach(e => {
        const i = stack[e.year] = (stack[e.year] || 0) + 1;
        const col = GROUP_COLOR[tacticById[e.tactic].group];
        const c = C.el('circle', { cx: x(e.year), cy: axisY - r - 2 - (i - 1) * step, r, style: `fill:${col};stroke:var(--surface);stroke-width:1.5` }, svg);
        C.bindTip(c, box, () => ({ value: e.usd ? 'US' + C.fmtUsd(e.usd) : STATUS[e.status], title: `${e.year} · ${e.title}`, rows: [{ color: col, label: tacticById[e.tactic].name }], note: 'Click to find it in the table' }));
        c.addEventListener('click', () => showCase(e.id));
      });
      box.appendChild(svg);
    });
  }

  // ---------- explorer ----------
  let sortKey = 'year', sortDir = -1;
  function explorer() {
    const opt = (sel, items) => items.forEach(([v, t]) => { const o = h('option', null, t); o.value = v; sel.appendChild(o); });
    opt($('#fFood'), [['', 'All foods']].concat(FOODS.map(f => [f.id, f.name])));
    opt($('#fTactic'), [['', 'All tactics']].concat(TACTICS.map(t => [t.id, t.name])));
    const wheres = Array.from(new Set(EVENTS.map(e => e.where))).sort();
    opt($('#fWhere'), [['', 'Everywhere']].concat(wheres.map(w => [w, w])));
    ['#fFood', '#fTactic', '#fWhere'].forEach(s => $(s).addEventListener('change', renderTable));
    $('#fText').addEventListener('input', renderTable);
    $$('#explorer th button').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.sort; sortDir = sortKey === k ? -sortDir : -1; sortKey = k; renderTable();
    }));
    renderTable();
  }
  function renderTable() {
    const food = $('#fFood').value, tac = $('#fTactic').value, wh = $('#fWhere').value, q = $('#fText').value.trim().toLowerCase();
    const rows = EVENTS.filter(e => (!food || e.foods.includes(food)) && (!tac || e.tactic === tac) && (!wh || e.where === wh) &&
      (!q || [e.title, e.text, e.who, e.where, String(e.year), e.foods.map(f => foodById[f].name).join(' ')].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => sortDir * (((a[sortKey] || 0) - (b[sortKey] || 0)) || (a.year - b.year)));
    const tb = $('#explorer tbody'); tb.replaceChildren();
    rows.forEach(e => {
      const tr = h('tr'); tr.id = 'case-' + e.id;
      const what = h('td', 'c-what'); what.append(h('div', 't', e.title), h('div', 'd', e.text));
      const src = h('td', 'c-src'); e.src.forEach((s, i) => { if (i) src.appendChild(h('br')); src.appendChild(link(s)); });
      tr.append(h('td', null, String(e.year)), h('td', null, e.who), what, h('td', 'c-cat', tacticById[e.tactic].name), h('td', 'c-kind', STATUS[e.status]),
        h('td', 'num', e.usd ? C.fmtUsd(e.usd) : '–'), src);
      tb.appendChild(tr);
    });
    $('#fCount').textContent = `${rows.length} of ${EVENTS.length} cases`;
  }
  function showCase(id) {
    ['#fFood', '#fTactic', '#fWhere', '#fText'].forEach(s => { $(s).value = ''; });
    renderTable();
    const tr = document.getElementById('case-' + id); if (!tr) return;
    const wrap = $('.explorer-wrap');
    wrap.scrollIntoView({ behavior: C.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    wrap.scrollTop = tr.offsetTop - 40;
    tr.style.background = 'var(--accent-wash)';
    setTimeout(() => { tr.style.background = ''; }, 2400);
  }

  // ---------- scorecard ----------
  const ICON = {
    better: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13l4-4 4 4"/></svg>',
    worse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 11l4 4 4-4"/></svg>',
    same: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>',
    mixed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M7.5 13c1.5-2.5 3-2.5 4.5 0s3 2.5 4.5 0"/></svg>'
  };
  const SLABEL = { better: 'Better', worse: 'Worse', same: 'No change', mixed: 'Mixed' };
  function scorecard() {
    const box = $('#scorecard');
    SCORE.forEach(s => {
      const r = h('div', 'score-row reveal');
      const st = h('span', 'status ' + s.status); st.innerHTML = ICON[s.status]; st.appendChild(document.createTextNode(SLABEL[s.status]));
      r.append(h('div', 'what', s.what), st, h('div', 'why', s.why));
      box.appendChild(r);
    });
  }

  // ---------- sources ----------
  function sources() {
    const seen = new Map();
    const add = (s) => { if (s && s[1] && !seen.has(s[1])) seen.set(s[1], s[0]); };
    FOODS.forEach(f => f.science.forEach(([, ...srcs]) => srcs.forEach(add)));
    EVENTS.forEach(e => e.src.forEach(add));
    F.FUNDING.forEach(f => add(f.src)); F.QUIZ.forEach(q => add(q.src)); GRID_SRC.forEach(add);
    const list = $('#sourceList');
    Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1])).forEach(([url, label]) => {
      const li = h('li'); li.appendChild(link([label, url])); list.appendChild(li);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initChrome(); hero(); hype(); foods(); initSheet(); grid(); tactics(); timeline(); explorer(); scorecard(); sources();
    if (window.Tools) window.Tools.init();
    revealAll();
    onHash(); window.addEventListener('hashchange', onHash);
  });
})();
