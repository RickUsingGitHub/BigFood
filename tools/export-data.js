// Regenerates data/cases.json, data/cases.csv and data/foods.json from assets/js/data.js.
// Usage: node tools/export-data.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
global.window = {};
require(path.join(root, 'assets/js/data.js'));
const { EVENTS, FOODS, TACTICS, GRID, OUTCOMES } = window.FOOD;

const tactic = Object.fromEntries(TACTICS.map(t => [t.id, t.name]));
const food = Object.fromEntries(FOODS.map(f => [f.id, f.name]));

const cases = EVENTS.slice().sort((a, b) => a.year - b.year).map(e => ({
  id: e.id, year: e.year, foods: e.foods.map(f => food[f]), who: e.who, where: e.where,
  tactic: tactic[e.tactic], status: e.status, usd_millions: e.usd || null,
  title: e.title, description: e.text, sources: e.src.map(([label, url]) => ({ label, url }))
}));

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const header = ['year', 'foods', 'who', 'where', 'tactic', 'status', 'usd_millions', 'title', 'description', 'sources'];
const rows = cases.map(c => [c.year, c.foods.join('; '), c.who, c.where, c.tactic, c.status, c.usd_millions, c.title, c.description,
  c.sources.map(s => s.url).join(' ')]);
const csv = [header].concat(rows).map(r => r.map(csvCell).join(',')).join('\n') + '\n';

const foods = FOODS.map(f => ({
  id: f.id, name: f.name, verdict: f.verdict, certainty: f.certainty, summary: f.one,
  told: f.told, evidence: f.now, science: f.science.map(([text, ...srcs]) => ({ text, sources: srcs.map(([label, url]) => ({ label, url })) })),
  australia: f.oz, what_to_do: f.tip
}));
const grid = GRID.map(r => ({ row: r.name, benchmark: !!r.bench,
  cells: Object.fromEntries(OUTCOMES.map(o => [o.name, r.cells[o.id] && r.cells[o.id][0] != null ? { value: r.cells[o.id][0], note: r.cells[o.id][1] } : null])) }));

fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/cases.json'), JSON.stringify(cases, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'data/cases.csv'), csv);
fs.writeFileSync(path.join(root, 'data/foods.json'), JSON.stringify({ foods, evidence_grid: grid }, null, 2) + '\n');
console.log(`Wrote ${cases.length} cases and ${foods.length} foods.`);
