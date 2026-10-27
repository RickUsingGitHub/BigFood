# Big Food on Trial

An interactive, evidence-based website about what we eat and drink. For sugar, soft drinks, fruit juice, artificial sweeteners, ultra-processed food, alcohol, red and processed meat, eggs, milk, seed oils, butter and saturated fat, salt, baby formula, breakfast cereal and coffee, it covers two things:

1. **What the best current science says.** Trials first, then large reviews and the WHO, IARC, World Cancer Research Fund and NHMRC.
2. **The dodgy side.** Industry-funded studies, buried trials, front groups, lobbying against taxes and warning labels, health-halo marketing, p-hacking, price-fixing and fraud, with every case sourced.

A companion to [Big Pharma on Trial](https://github.com/RickUsingGitHub/BigPharma).

## What's on the site

| Section | What it does |
|---|---|
| **The menu** | A "hype gap" chart comparing what we were told about each food (and who said it) with where the evidence lands now. Fifteen food files, each with a verdict, an evidence-strength rating, the key science with sources, the dodgy history, the Australian angle and what to actually do. |
| **The evidence grid** | 16 foods × 7 outcomes (heart, type 2 diabetes, bowel cancer, other cancers, weight, teeth, early death). Tap a square for the detail. Whole grains and fruit & veg sit at the bottom as benchmarks. |
| **The playbook** | 11 tactics, from "Pay for friendly science" to "Manufacture doubt", each with its cases and "has it been fixed?" |
| **The lab** | A "follow the money" chart (industry v independent conclusions), a **"Who paid for it?" quiz**, a **chocolate p-hacking machine** (recreating the 2015 chocolate diet hoax), a **"bacon causes cancer" translator** that turns relative risk into people, plus research-on-research stats. |
| **Try it yourself** | A **sugar counter** for your daily drinks (teaspoons, kilograms a year, WHO limits) and a **standard drinks counter** (Australian guideline, relative breast and bowel cancer risk). |
| **Meanwhile, in Australia** | The Heart Foundation Tick on McDonald's, Milo's 4.5 stars, Heinz toddler snacks, the "Australian Paradox", the Sydney Diet Heart Study and fake free-range eggs. |
| **The verdict** | What the science agrees on, which scares don't hold up, an 11-point "is Big Food getting better?" scorecard, and the bottom line. |
| **Every case** | A timeline and a searchable, filterable, sortable table of all 51 cases, also downloadable as [CSV](data/cases.csv) or [JSON](data/cases.json). The food files and evidence grid are in [data/foods.json](data/foods.json). |

## Viewing it

It is a plain static site (HTML, CSS and vanilla JavaScript, with no build step and no dependencies).

- **Locally:** open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit <http://localhost:8000>.
- **GitHub Pages:** go to *Settings → Pages → Build and deployment*, choose *Deploy from a branch*, pick `main` and the `/ (root)` folder, then save. The site appears at `https://<username>.github.io/BigFood/`.

## Files

```
index.html             page structure and static text
assets/css/style.css   design tokens (light and dark), layout, components
assets/js/data.js      everything factual: foods, evidence grid, tactics, cases, quiz, counters, scorecard
assets/js/charts.js    small SVG helpers (tooltips, responsive redraw, reveal-on-scroll)
assets/js/tools.js     the lab and the counters
assets/js/app.js       hype-gap chart, food files, evidence grid, playbook, timeline, case table, sources
tools/export-data.js   regenerates data/cases.csv, data/cases.json and data/foods.json
```

## Adding or correcting something

1. Edit `assets/js/data.js`. Every case needs at least one source link, and every science point carries its own source.
2. Run `node tools/export-data.js` to refresh the downloadable data.
3. Open the page and check the food file, the grid and the case table.

Corrections are welcome. Please open an issue with a source.

## Caveats

- Most nutrition evidence is observational: "linked to" isn't "causes". Certainty ratings reflect that.
- The hype-gap positions and grid cells are judgement calls summarising the cited sources, at typical intakes.
- Funding isn't proof of fraud. Some of the worst p-hacking and fraud cases here were academics.
- Nothing here is medical advice.
