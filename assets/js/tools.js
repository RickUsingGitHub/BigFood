/* Big Food on Trial — the lab and the counters. */
window.Tools = (function () {
  const F = window.FOOD, C = window.Charts;
  const $ = (s, r) => (r || document).querySelector(s);
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const link = (src, cls) => { const a = h('a', cls, src[0]); a.href = src[1]; a.target = '_blank'; a.rel = 'noopener'; return a; };
  const round1 = (v) => Math.round(v * 10) / 10;

  // ---------- follow the money ----------
  function funding() {
    const box = $('#fundChart'); if (!box) return;
    const cols = { ind: 'var(--c2)', other: 'var(--c1)' };
    C.legend($('#fundLegend'), [{ color: cols.ind, label: 'Industry-funded or industry-linked' }, { color: cols.other, label: 'No industry money' }]);
    C.responsive(box, (W) => {
      box.replaceChildren();
      const narrow = W < 560, labelH = narrow ? 38 : 22, barH = 18, gap = 6, block = labelH + 2 * barH + gap + 22;
      const H = F.FUNDING.length * block + 4, left = 0, right = 46;
      const x = (v) => left + (v / 100) * (W - left - right);
      const svg = C.el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': 'Industry v independent study conclusions' });
      F.FUNDING.forEach((f, i) => {
        const y0 = i * block;
        const t = C.el('text', { x: 0, y: y0 + 14, class: 'label-strong' }, svg);
        if (narrow) {
          const words = f.q.split(' '); let line = '', lines = [];
          words.forEach(w => { if ((line + ' ' + w).length > W / 7.6) { lines.push(line); line = w; } else line = line ? line + ' ' + w : w; });
          lines.push(line);
          lines.slice(0, 2).forEach((l, k) => C.el('tspan', { x: 0, dy: k ? 16 : 0, text: l }, t));
        } else t.textContent = f.q;
        [['ind', 'Industry'], ['other', 'No industry money']].forEach(([k, lab], j) => {
          const y = y0 + labelH + j * (barH + gap);
          C.el('rect', { x: left, y, width: W - left - right, height: barH, rx: 3, style: 'fill:var(--surface-2)' }, svg);
          const g = C.el('g', { class: 'grow-x' }, svg);
          const p = C.el('path', { d: C.hBarPath(left, y, Math.max(2, x(f[k]) - left), barH, 4), style: `fill:${cols[k]}` }, g);
          C.el('text', { x: x(f[k]) + 6, y: y + 13, class: 'label-strong', text: f[k] + '%' }, svg);
          C.bindTip(p, box, () => ({ value: f[k] + '%', title: lab, note: f.note }));
        });
      });
      box.appendChild(svg);
      C.observe(box);
    });
    const notes = $('#fundNotes'); notes.replaceChildren();
    F.FUNDING.forEach((f, i) => {
      const p = h('p', null, (i + 1) + '. ' + f.note + ' ');
      p.appendChild(link(f.src)); notes.appendChild(p);
    });
  }

  // ---------- quiz ----------
  function quiz() {
    const q = $('#quizQ'); if (!q) return;
    const opts = [['industry', 'Industry'], ['independent', 'Independent'], ['both', 'Both'], ['hoax', 'A hoax']];
    const label = Object.fromEntries(opts);
    let i = 0, score = 0, answered = false;
    const show = () => {
      answered = false;
      const item = F.QUIZ[i];
      q.textContent = item.claim;
      const box = $('#quizOpts'); box.replaceChildren();
      opts.forEach(([k, lab]) => {
        const b = h('button', 'btn', lab); b.dataset.k = k;
        b.addEventListener('click', () => answer(k, b));
        box.appendChild(b);
      });
      $('#quizWhy').hidden = true; $('#quizNext').hidden = true;
      $('#quizScore').textContent = `Claim ${i + 1} of ${F.QUIZ.length} · Score ${score}`;
    };
    const answer = (k, btn) => {
      if (answered) return; answered = true;
      const item = F.QUIZ[i], right = k === item.a;
      if (right) score++;
      document.querySelectorAll('#quizOpts .btn').forEach(b => {
        if (b.dataset.k === item.a) b.classList.add('right');
        else if (b === btn) b.classList.add('wrong');
        b.disabled = b !== btn && b.dataset.k !== item.a;
      });
      const why = $('#quizWhy'); why.replaceChildren();
      why.appendChild(h('strong', null, (right ? 'Right: ' : 'Not quite. ') + label[item.a] + '. '));
      why.appendChild(document.createTextNode(item.why + ' '));
      why.appendChild(link(item.src));
      why.hidden = false;
      const next = $('#quizNext');
      next.textContent = i + 1 < F.QUIZ.length ? 'Next claim' : 'See your score';
      next.hidden = false; next.focus({ preventScroll: true });
      $('#quizScore').textContent = `Claim ${i + 1} of ${F.QUIZ.length} · Score ${score}`;
    };
    $('#quizNext').addEventListener('click', () => {
      if (i + 1 < F.QUIZ.length) { i++; show(); return; }
      q.textContent = `You scored ${score} out of ${F.QUIZ.length}.`;
      $('#quizOpts').replaceChildren();
      const why = $('#quizWhy'); why.replaceChildren();
      why.appendChild(document.createTextNode(score >= 8 ? 'A sharp eye. ' : 'Hard, isn’t it? '));
      why.appendChild(document.createTextNode('Notice that the industry-funded claims all sound reasonable. That’s the point: funding rarely shows in the headline. Always look for who paid.'));
      const again = $('#quizNext'); again.textContent = 'Play again';
      again.onclick = () => { again.onclick = null; i = 0; score = 0; show(); };
    });
    show();
  }

  // ---------- chocolate p-hacking ----------
  const THINGS = ['Weight', 'Cholesterol', 'Sodium', 'Blood protein', 'Sleep quality', 'Well-being', 'Waist size', 'Blood pressure', 'Blood sugar',
    'Triglycerides', 'HDL', 'LDL', 'Mood', 'Energy', 'Hunger', 'Cravings', 'Body fat', 'Insulin', 'Heart rate', 'Skin', 'Focus', 'Stress',
    'Fatigue', 'Headaches', 'Digestion', 'Hydration', 'Muscle mass', 'Liver enzymes', 'Inflammation', 'Vitamin D'];
  const VERBS = { Weight: 'speeds weight loss', Cholesterol: 'lowers cholesterol', 'Sleep quality': 'helps you sleep', 'Well-being': 'makes you happier',
    'Waist size': 'shrinks your waist', 'Blood pressure': 'lowers blood pressure', 'Blood sugar': 'controls blood sugar', Mood: 'lifts your mood',
    Energy: 'boosts energy', Cravings: 'cuts cravings', 'Body fat': 'burns body fat', Skin: 'gives you better skin', Focus: 'sharpens focus', Stress: 'beats stress' };
  function choc() {
    const range = $('#nThings'); if (!range) return;
    const k = () => +range.value;
    const odds = () => {
      const p = 1 - Math.pow(0.95, k());
      $('#chocOdds').textContent = `Measure ${k()} unrelated thing${k() > 1 ? 's' : ''} and the chance at least one hits p < 0.05 by pure luck is ${Math.round(p * 100)}%. Bohannon measured 18: about 60%.`;
    };
    const run = () => {
      const n = k(), box = $('#chocOutcomes'); box.replaceChildren();
      const hits = [];
      THINGS.forEach((name, j) => {
        const d = h('div', 'outcome');
        d.appendChild(h('span', null, name));
        if (j < n) {
          const p = Math.random();
          if (p < 0.05) { d.classList.add('sig'); hits.push(name); }
          d.appendChild(h('span', 'p', 'p = ' + (p < 0.001 ? '<0.001' : p.toFixed(3))));
        } else { d.classList.add('off'); d.appendChild(h('span', 'p', 'not measured')); }
        box.appendChild(d);
      });
      const head = $('#chocHead');
      if (hits.length) {
        const best = hits.find(x => VERBS[x]) || hits[0];
        head.classList.add('win');
        head.querySelector('.h-tag').textContent = 'Press release · "statistically significant"';
        head.querySelector('.h-text').textContent = 'Study: dark chocolate ' + (VERBS[best] || 'improves ' + best.toLowerCase()) + '!';
      } else {
        head.classList.remove('win');
        head.querySelector('.h-tag').textContent = 'File drawer';
        head.querySelector('.h-text').textContent = 'Nothing "significant". This study quietly never gets published. Run it again?';
      }
    };
    const many = () => {
      let wins = 0; const n = k();
      for (let r = 0; r < 1000; r++) { for (let j = 0; j < n; j++) if (Math.random() < 0.05) { wins++; break; } }
      const head = $('#chocHead'); head.classList.add('win');
      head.querySelector('.h-tag').textContent = '1,000 studies of a food that does nothing';
      head.querySelector('.h-text').textContent = `${wins} of 1,000 found a "breakthrough" (${(wins / 10).toFixed(1)}%).`;
    };
    range.addEventListener('input', () => { $('#nThingsOut').textContent = k(); odds(); });
    $('#chocRun').addEventListener('click', run);
    $('#chocMany').addEventListener('click', many);
    odds();
  }

  // ---------- bacon translator ----------
  function bacon() {
    const g = $('#meatG'); if (!g) return;
    const base = $('#baseRisk');
    C.legend($('#iconLegend'), [{ color: 'var(--axis-ink)', label: 'Would get bowel cancer anyway' }, { color: 'var(--accent)', label: 'Extra cases from the meat' }]);
    const icons = $('#icons');
    for (let i = 0; i < 100; i++) icons.appendChild(document.createElement('i'));
    const draw = () => {
      const grams = +g.value, b = +base.value;
      const rr = Math.pow(1.18, grams / 50), extra = b * (rr - 1);
      $('#meatGOut').textContent = grams + ' g';
      $('#baseRiskOut').textContent = b + ' in 100';
      const ex = Math.round(extra);
      Array.from(icons.children).forEach((n, i) => { n.className = i < b ? 'base' : i < b + ex ? 'extra' : ''; });
      icons.setAttribute('aria-label', `${b} of 100 people get bowel cancer anyway; about ${round1(extra)} more from eating ${grams} g a day`);
      $('#baconBig').textContent = grams ? `+${Math.round((rr - 1) * 100)}% relative · +${round1(extra)} per 100 people` : 'No processed meat';
      $('#baconText').textContent = grams
        ? `If 100 people ate ${grams} g of processed meat every day for life, about ${round1(b + extra)} would get bowel cancer instead of ${b}. That's roughly 1 extra case for every ${Math.round(100 / extra)} people. Real and worth avoiding, but far from smoking, which multiplies lung cancer risk 15 to 30 times.`
        : 'Move the slider to see the extra risk.';
    };
    g.addEventListener('input', draw); base.addEventListener('input', draw);
    draw();
  }

  // ---------- lab stat cards ----------
  function stats() {
    const box = $('#labStats'); if (!box) return;
    const S = F.SRC;
    [
      ['40 of 50', 'random cookbook ingredients had studies linking them to cancer, some raising the risk and some lowering it.', S.schoenfeld],
      ['5×', 'Reviews with industry ties were five times as likely to find no link between sugary drinks and weight gain.', S.besRastrollo],
      ['18', 'papers retracted from Cornell’s famous food-psychology lab after its director described p-hacking on his own blog.', ['Brian Wansink (overview)', 'https://en.wikipedia.org/wiki/Brian_Wansink']],
      ['145', 'counts of faked or falsified data found against the leading "red wine is good for you" resveratrol researcher.', ['Retraction Watch, 2012', 'https://retractionwatch.com/2012/01/11/uconn-resveratrol-researcher-dipak-das-fingered-in-sweeping-misconduct-case/']],
      ['43 years', 'the full results of the Minnesota Coronary Experiment, a 9,423-person diet trial, sat unpublished (1973–2016).', ['Ramsden et al., BMJ 2016', 'https://doi.org/10.1136/bmj.i1246']],
      ['60%', 'of egg–cholesterol studies in the 2010s were industry-funded, up from 0% in the 1950s (analysis by an advocacy group).', S.barnard]
    ].forEach(([big, what, src]) => {
      const c = h('div', 'stat-card reveal');
      c.appendChild(h('div', 'big', big));
      c.appendChild(h('div', 'what', what));
      const s = h('div', 'src'); s.appendChild(link(src)); c.appendChild(s);
      box.appendChild(c);
    });
  }

  // ---------- shared stepper ----------
  function stepper(max, onChange, name) {
    const wrap = h('span', 'stepper');
    const minus = h('button', null, '−'), plus = h('button', null, '+'), out = h('output', null, '0');
    minus.type = plus.type = 'button';
    minus.setAttribute('aria-label', 'Fewer: ' + name); plus.setAttribute('aria-label', 'More: ' + name);
    let v = 0;
    const set = (n) => { v = Math.max(0, Math.min(max, n)); out.textContent = v; onChange(v); };
    minus.addEventListener('click', () => set(v - 1)); plus.addEventListener('click', () => set(v + 1));
    wrap.append(minus, out, plus);
    return wrap;
  }

  // ---------- sugar counter ----------
  function sugar() {
    const pick = $('#sugarPick'); if (!pick) return;
    const counts = {};
    F.DRINKS.forEach(d => {
      counts[d.id] = 0;
      const row = h('div', 'pick-row');
      const l = h('div'); l.appendChild(h('div', null, d.name)); if (d.note) l.appendChild(h('div', 'n', d.note));
      row.append(l, stepper(8, (v) => { counts[d.id] = v; draw(); }, d.name));
      pick.appendChild(row);
    });
    const draw = () => {
      let free = 0, lact = 0;
      F.DRINKS.forEach(d => { free += counts[d.id] * d.g * d.free; lact += counts[d.id] * d.g * (1 - d.free); });
      $('#sugarG').textContent = Math.round(free) + ' g';
      $('#sugarTsp').textContent = round1(free / 4);
      $('#sugarYr').textContent = round1(free * 365 / 1000) + ' kg';
      const cubes = $('#cubes'); cubes.replaceChildren();
      const nFree = Math.round(free / 4), nLact = Math.round(lact / 4);
      for (let i = 0; i < Math.min(nFree, 120); i++) { const c = h('i'); if (i >= 12.5) c.className = 'over'; cubes.appendChild(c); }
      for (let i = 0; i < Math.min(nLact, 40); i++) cubes.appendChild(h('i', 'lactose'));
      const v = $('#sugarVerdict');
      v.className = 'verdict-line' + (free > 25 ? ' bad' : free || lact ? ' ok' : '');
      v.textContent = free === 0 ? (lact ? 'No free sugar: milk’s lactose doesn’t count.' : 'Add a drink to start.')
        : free <= 25 ? 'Within the WHO’s ideal limit, from drinks alone.'
        : free <= 50 ? 'Over the WHO’s ideal 25 g before you’ve eaten anything.'
        : `Over the WHO’s 50 g daily maximum from drinks alone, about ${round1(free / 50)}× the limit. Red cubes are over it.`;
    };
    draw();
  }

  // ---------- standard drinks counter ----------
  function booze() {
    const pick = $('#boozePick'); if (!pick) return;
    const counts = {}, sdOf = (s) => s.ml * (s.abv / 100) * 0.789 / 10;
    const maxDay = $('#maxDay');
    F.SERVES.forEach(s => {
      counts[s.id] = 0;
      const row = h('div', 'pick-row');
      const l = h('div'); l.appendChild(h('div', null, s.name)); l.appendChild(h('div', 'n', round1(sdOf(s)) + ' standard drinks each'));
      row.append(l, stepper(40, (v) => { counts[s.id] = v; draw(true); }, s.name));
      pick.appendChild(row);
    });
    const draw = (fromStepper) => {
      let sd = 0; F.SERVES.forEach(s => { sd += counts[s.id] * sdOf(s); });
      if (fromStepper && +maxDay.value < Math.ceil(sd / 7 - 0.05)) maxDay.value = Math.min(20, Math.ceil(sd / 7 - 0.05));
      const day = +maxDay.value;
      $('#maxDayOut').textContent = day;
      const gDay = sd * 10 / 7;
      $('#sdWeek').textContent = round1(sd);
      $('#riskBreast').textContent = '+' + Math.round(7.1 * gDay / 10) + '%';
      $('#riskBowel').textContent = '+' + Math.round(7 * gDay / 10) + '%';
      const v = $('#boozeVerdict'), over = [];
      if (sd > 10.05) over.push(`${round1(sd)} standard drinks a week (guideline: 10)`);
      if (day > 4) over.push(`${day} on your heaviest day (guideline: 4)`);
      v.className = 'verdict-line' + (over.length ? ' bad' : sd || day ? ' ok' : '');
      v.textContent = sd === 0 && day === 0 ? 'Add some drinks to start.'
        : over.length ? 'Above the Australian guideline: ' + over.join(' and ') + '.'
        : 'Within the Australian guideline, though cancer risk still rises with every drink.';
    };
    maxDay.addEventListener('input', () => draw(false));
    draw(false);
  }

  function init() { funding(); quiz(); choc(); bacon(); stats(); sugar(); booze(); }
  return { init };
})();
