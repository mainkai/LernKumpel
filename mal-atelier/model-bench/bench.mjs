#!/usr/bin/env node
// Benchmark OpenRouter models for the Mal-Atelier tasks (drawing evaluation and AI image edit).
//
//   OPENROUTER_API_KEY=... node mal-atelier/model-bench/bench.mjs eval  [--models a,b] [--config file] [--dry-run]
//   OPENROUTER_API_KEY=... node mal-atelier/model-bench/bench.mjs image [--models a,b] [--config file] [--dry-run]
//
// Results (JSON + HTML report + generated images) are written to model-bench/results/<timestamp>-<mode>/.
// The prompts and request bodies mirror mal-atelier/index.html - keep them in sync.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BENCH_DIR = path.dirname(fileURLToPath(import.meta.url));
const API = 'https://openrouter.ai/api/v1';

// --- prompts (copied from mal-atelier/index.html) ---

const evalPrompt = (task) => `Du bist ein KI-Bildbewerter für Kinderzeichnungen. Aufgabe: "Male ${task}".
                    Bewerte, wie gut die Zeichnung zur Aufgabe passt.
                    Außerdem soll die Qualität (Farben, Details) der Zeichnung berücksichtigt werden.
                    Je mehr Details, Kreativität und Farbauswahl, desto höher die Bewertung.
                    Hat die Aufgabe eine besondere Regel (z.B. nur bestimmte Farben oder Formen), zählt das Einhalten der Regel mehr als viele Farben.
                    Wenn das Bild schlecht ist, kannst du es mit einem lustigen / sarkastischen Spruch kommentieren (aber in Worten, die kleine Kinder noch verstehen).
                    Antworte nur als JSON mit den Feldern:
                    - score: ganze Zahl 0 bis 100
                    - feedback: kurzer freundlicher Satz auf Deutsch (max 120 Zeichen)
                    - emoji: genau ein passendes Bewertungs-Emoji (z.B. 🤩, 🙂, 😅, 😎, 🥳, 🙈).`;

const imagePrompt = (task) =>
  `Verwandle diese Kinderzeichnung in ein buntes, freundliches Bild im Kinderbuch-Stil. Motiv: ${task}. Behalte die Grundidee der Zeichnung bei.`;

const judgePrompt = (task) => `Bild 1 ist eine Kinderzeichnung zur Aufgabe "Male ${task}". Bild 2 wurde von einer KI daraus erzeugt
(Ziel: buntes, freundliches Bild im Kinderbuch-Stil, Grundidee der Zeichnung beibehalten).
Bewerte Bild 2 jeweils von 1 (schlecht) bis 10 (hervorragend):
- fidelity: Bleiben Motiv, Komposition und Ideen der Kinderzeichnung erkennbar erhalten?
- style: Wirkt es wie eine hochwertige, bunte Kinderbuch-Illustration?
- childFriendly: Ist es für kleine Kinder geeignet und freundlich (nichts Gruseliges, keine Artefakte)?
- overall: Gesamteindruck, wie sehr würde sich ein Kind darüber freuen?
Antworte nur als JSON: {"fidelity":n,"style":n,"childFriendly":n,"overall":n,"comment":"kurzer Satz auf Deutsch"}`;

// --- helpers (parseJsonFromText mirrors the app) ---

const parseJsonFromText = (text) => {
  if (!text) return null;
  const direct = text.trim();
  try {
    return JSON.parse(direct);
  } catch {
    const start = direct.indexOf('{');
    const end = direct.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(direct.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const extractGeneratedImageUrl = (apiResult) => {
  const choice = apiResult?.choices?.[0]?.message;
  if (!choice) return '';
  if (Array.isArray(choice.images) && choice.images[0]?.image_url?.url) return choice.images[0].image_url.url;
  if (Array.isArray(choice.content)) {
    for (const part of choice.content) {
      if (part?.type === 'image_url' && part?.image_url?.url) return part.image_url.url;
      if (part?.type === 'output_image' && part?.image_url) return part.image_url;
    }
  }
  if (typeof choice.content === 'string') {
    const match = choice.content.match(/https?:\/\/\S+/);
    if (match) return match[0];
  }
  return '';
};

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const stdev = (xs) => {
  if (xs.length < 2) return null;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n, digits = 2) => (n == null || Number.isNaN(n) ? '–' : Number(n).toFixed(digits));
const fmtCost = (n) => (n == null ? '–' : `$${Number(n).toFixed(5)}`);
const slug = (s) => s.replace(/[^a-z0-9._-]+/gi, '_');

const readDataUrl = async (file) => {
  const buf = await readFile(path.resolve(BENCH_DIR, file));
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
};

const pool = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

// --- OpenRouter ---

const apiKey = process.env.OPENROUTER_API_KEY?.trim();

const callOpenRouter = async ({ model, messages, responseFormat, cfg }) => {
  const send = (includeTemperature) => {
    const body = { model, messages, usage: { include: true } };
    if (includeTemperature) body.temperature = 0.2;
    if (responseFormat) body.response_format = responseFormat;
    return fetch(`${API}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'LernKumpel-Malatelier-Bench'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(cfg.timeoutMs)
    });
  };

  let lastError;
  for (let attempt = 0; attempt <= cfg.retries; attempt++) {
    const started = performance.now();
    try {
      let response = await send(true);
      if (!response.ok) {
        const text = await response.text();
        if (response.status === 400 && /unsupported parameter[^\n]*temperature|temperature[^\n]*not supported/i.test(text)) {
          response = await send(false);
        } else {
          const err = new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
          err.retryable = response.status === 429 || response.status >= 500;
          throw err;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
      }
      const json = await response.json();
      if (json.error) {
        const err = new Error(`API error: ${JSON.stringify(json.error).slice(0, 300)}`);
        err.retryable = true;
        throw err;
      }
      return { json, seconds: (performance.now() - started) / 1000, cost: json.usage?.cost ?? null, provider: json.provider ?? null };
    } catch (err) {
      lastError = err;
      const retryable = err.retryable || err.name === 'TimeoutError' || err.name === 'TypeError';
      if (!retryable || attempt === cfg.retries) break;
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  throw lastError;
};

const checkModels = async (models) => {
  const known = new Set();
  for (const query of ['', '?output_modalities=all']) {
    const res = await fetch(`${API}/models${query}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Could not load model list: HTTP ${res.status}`);
    for (const m of (await res.json()).data) known.add(m.id);
  }
  const missing = models.filter((m) => !known.has(m));
  if (missing.length) console.warn(`⚠ Not available on OpenRouter, skipped: ${missing.join(', ')}`);
  return models.filter((m) => known.has(m));
};

// --- eval benchmark ---

const runEval = async (cfg, models, outDir) => {
  const { drawings, runs } = cfg.eval;
  const images = await Promise.all(drawings.map((d) => readDataUrl(d.file)));
  const jobs = models.flatMap((model) => drawings.flatMap((drawing, di) => Array.from({ length: runs }, (_, run) => ({ model, drawing, di, run }))));
  console.log(`Eval: ${models.length} models × ${drawings.length} drawings × ${runs} runs = ${jobs.length} calls`);

  let done = 0;
  const calls = await pool(jobs, cfg.concurrency, async ({ model, drawing, di, run }) => {
    const base = { model, drawing: drawing.file, run };
    try {
      const r = await callOpenRouter({
        model,
        cfg,
        responseFormat: { type: 'json_object' },
        messages: [{ role: 'user', content: [{ type: 'text', text: evalPrompt(drawing.task) }, { type: 'image_url', image_url: { url: images[di] } }] }]
      });
      const text = r.json?.choices?.[0]?.message?.content || '';
      const parsed = parseJsonFromText(text);
      const score = Number(parsed?.score);
      const result = {
        ...base,
        ok: true,
        seconds: r.seconds,
        cost: r.cost,
        provider: r.provider,
        validJson: !!parsed && Number.isFinite(score),
        score: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : null,
        feedback: parsed?.feedback ?? null,
        emoji: parsed?.emoji ?? null,
        raw: parsed ? undefined : text.slice(0, 500)
      };
      console.log(`[${++done}/${jobs.length}] ${model} ${drawing.file}#${run}: ${result.score ?? 'invalid'} (${fmt(r.seconds, 1)}s, ${fmtCost(r.cost)})`);
      return result;
    } catch (err) {
      console.log(`[${++done}/${jobs.length}] ${model} ${drawing.file}#${run}: ERROR ${err.message}`);
      return { ...base, ok: false, error: err.message };
    }
  });

  const summary = models.map((model) => {
    const mine = calls.filter((c) => c.model === model);
    const okCalls = mine.filter((c) => c.ok);
    const valid = okCalls.filter((c) => c.validJson);
    const perDrawing = drawings.map((d) => {
      const scores = valid.filter((c) => c.drawing === d.file).map((c) => c.score);
      return { file: d.file, mean: mean(scores), stdev: stdev(scores), scores };
    });
    // Pairwise agreement between the model's mean scores and the expected quality order.
    let agree = 0;
    let pairs = 0;
    for (let i = 0; i < drawings.length; i++) {
      for (let j = i + 1; j < drawings.length; j++) {
        const [a, b] = [perDrawing[i].mean, perDrawing[j].mean];
        const dq = drawings[i].quality - drawings[j].quality;
        if (a == null || b == null || dq === 0) continue;
        pairs++;
        if (Math.sign(a - b) === Math.sign(dq)) agree++;
        else if (a === b) agree += 0.5;
      }
    }
    const stdevs = perDrawing.map((p) => p.stdev).filter((s) => s != null);
    const costs = okCalls.map((c) => c.cost).filter((c) => c != null);
    return {
      model,
      calls: mine.length,
      ok: okCalls.length,
      validJson: valid.length,
      avgSeconds: mean(okCalls.map((c) => c.seconds)),
      avgCost: mean(costs),
      totalCost: sum(costs),
      rankAgreement: pairs ? agree / pairs : null,
      avgStdev: mean(stdevs),
      perDrawing
    };
  });

  await writeFile(path.join(outDir, 'results.json'), JSON.stringify({ config: cfg.eval, summary, calls }, null, 2));
  await writeFile(path.join(outDir, 'report.html'), evalReport(cfg, summary, calls, images));
  return sum(summary.map((s) => s.totalCost));
};

const evalReport = (cfg, summary, calls, images) => {
  const { drawings } = cfg.eval;
  const rows = summary
    .map((s) => {
      const cells = s.perDrawing
        .map((p) => {
          const texts = calls
            .filter((c) => c.model === s.model && c.drawing === p.file)
            .map((c) => (c.ok ? (c.validJson ? `${c.score} ${c.emoji ?? ''} – ${c.feedback ?? ''}` : `invalid: ${c.raw ?? ''}`) : `error: ${c.error}`));
          return `<td class="num"><details><summary>${fmt(p.mean, 0)}${p.stdev != null ? ` <small>±${fmt(p.stdev, 0)}</small>` : ''}</summary><ul>${texts.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></details></td>`;
        })
        .join('');
      return `<tr><td><code>${esc(s.model)}</code></td><td class="num">${s.ok}/${s.calls}</td><td class="num">${s.validJson}/${s.ok}</td>
        <td class="num">${s.rankAgreement == null ? '–' : `${fmt(s.rankAgreement * 100, 0)}%`}</td><td class="num">${fmt(s.avgStdev, 1)}</td>
        <td class="num">${fmt(s.avgSeconds, 1)}s</td><td class="num">${fmtCost(s.avgCost)}</td>${cells}</tr>`;
    })
    .join('\n');
  const heads = drawings
    .map((d, i) => `<th><img src="${images[i]}" alt=""><br>${esc(d.task)}<br><small>quality ${d.quality}</small></th>`)
    .join('');
  return page(
    'Mal-Atelier – Bewertungs-Benchmark',
    `<p>${summary.length} Modelle, ${drawings.length} Zeichnungen, ${cfg.eval.runs} Durchläufe. Gesamtkosten: ${fmtCost(sum(summary.map((s) => s.totalCost)))}.
     <b>Rang-Übereinstimmung</b> = Anteil der Zeichnungspaare, die das Modell so ordnet wie das erwartete <code>quality</code>.
     <b>±</b> = Streuung zwischen Durchläufen. Klick auf einen Score zeigt das Feedback.</p>
     <div class="scroll"><table><thead><tr><th>Modell</th><th>OK</th><th>JSON</th><th>Rang</th><th>±</th><th>Zeit</th><th>Kosten/Req</th>${heads}</tr></thead><tbody>${rows}</tbody></table></div>`
  );
};

// --- image benchmark ---

const saveImage = async (url, outDir, name) => {
  let buf;
  let ext = 'png';
  const m = url.match(/^data:image\/(\w+);base64,(.*)$/s);
  if (m) {
    ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    buf = Buffer.from(m[2], 'base64');
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not download image: HTTP ${res.status}`);
    const type = res.headers.get('content-type') || '';
    ext = type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : 'png';
    buf = Buffer.from(await res.arrayBuffer());
  }
  const file = `${name}.${ext}`;
  await writeFile(path.join(outDir, file), buf);
  return { file, dataUrl: `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}` };
};

const runImage = async (cfg, models, outDir) => {
  const { drawing, runs, judge } = cfg.image;
  const source = await readDataUrl(drawing.file);
  const prompt = cfg.image.prompt?.trim() || imagePrompt(drawing.task);
  await writeFile(path.join(outDir, `source${path.extname(drawing.file)}`), await readFile(path.resolve(BENCH_DIR, drawing.file)));
  const jobs = models.flatMap((model) => Array.from({ length: runs }, (_, run) => ({ model, run })));
  console.log(`Image: ${models.length} models × ${runs} runs = ${jobs.length} calls${judge?.enabled ? ` (+ judge ${judge.model})` : ''}`);

  let done = 0;
  const results = await pool(jobs, cfg.concurrency, async ({ model, run }) => {
    const base = { model, run };
    try {
      const r = await callOpenRouter({
        model,
        cfg,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: source } }] }]
      });
      const url = extractGeneratedImageUrl(r.json);
      if (!url) throw new Error(`No image returned: ${JSON.stringify(r.json?.choices?.[0]?.message ?? r.json).slice(0, 300)}`);
      const saved = await saveImage(url, outDir, `${slug(model)}-${run}`);
      const result = { ...base, ok: true, seconds: r.seconds, cost: r.cost, provider: r.provider, file: saved.file };

      if (judge?.enabled) {
        try {
          const j = await callOpenRouter({
            model: judge.model,
            cfg,
            responseFormat: { type: 'json_object' },
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: judgePrompt(drawing.task) },
                  { type: 'image_url', image_url: { url: source } },
                  { type: 'image_url', image_url: { url: saved.dataUrl } }
                ]
              }
            ]
          });
          result.judge = parseJsonFromText(j.json?.choices?.[0]?.message?.content || '');
          result.judgeCost = j.cost;
        } catch (err) {
          result.judgeError = err.message;
        }
      }
      console.log(`[${++done}/${jobs.length}] ${model}#${run}: ok (${fmt(r.seconds, 1)}s, ${fmtCost(r.cost)})${result.judge ? ` judge ${result.judge.overall}/10` : ''}`);
      return result;
    } catch (err) {
      console.log(`[${++done}/${jobs.length}] ${model}#${run}: ERROR ${err.message}`);
      return { ...base, ok: false, error: err.message };
    }
  });

  await writeFile(path.join(outDir, 'results.json'), JSON.stringify({ config: cfg.image, prompt, results }, null, 2));
  await writeFile(path.join(outDir, 'report.html'), imageReport(cfg, prompt, results, `source${path.extname(drawing.file)}`));
  return sum(results.map((r) => (r.cost ?? 0) + (r.judgeCost ?? 0)));
};

const imageReport = (cfg, prompt, results, sourceFile) => {
  const sorted = [...results].sort((a, b) => (b.judge?.overall ?? -1) - (a.judge?.overall ?? -1) || (a.cost ?? 9) - (b.cost ?? 9));
  const cards = sorted
    .map((r) => {
      const j = r.judge;
      return `<figure class="card ${r.ok ? '' : 'failed'}">
        ${r.ok ? `<a href="${esc(r.file)}"><img src="${esc(r.file)}" alt="${esc(r.model)}" loading="lazy"></a>` : `<div class="error">${esc(r.error)}</div>`}
        <figcaption><code>${esc(r.model)}</code>${cfg.image.runs > 1 ? ` #${r.run}` : ''}<br>
        ${r.ok ? `${fmt(r.seconds, 1)}s · ${fmtCost(r.cost)}${r.provider ? ` · ${esc(r.provider)}` : ''}` : ''}
        ${j ? `<br>Treue ${j.fidelity} · Stil ${j.style} · Kindgerecht ${j.childFriendly} · <b>Gesamt ${j.overall}/10</b><br><small>${esc(j.comment)}</small>` : ''}
        ${r.judgeError ? `<br><small>Judge-Fehler: ${esc(r.judgeError)}</small>` : ''}</figcaption></figure>`;
    })
    .join('\n');
  const total = sum(results.map((r) => r.cost ?? 0));
  return page(
    'Mal-Atelier – Bilderstellungs-Benchmark',
    `<div class="source"><img src="${esc(sourceFile)}" alt="Ausgangszeichnung"><div><p><b>Prompt:</b> ${esc(prompt)}</p>
     <p>${results.length} Bilder, Kosten Bilderstellung: ${fmtCost(total)}${cfg.image.judge?.enabled ? `, Judge: <code>${esc(cfg.image.judge.model)}</code>` : ''}. Sortiert nach Judge-Gesamtnote.</p></div></div>
     <div class="grid">${cards}</div>`
  );
};

const page = (title, body) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><style>
:root{--bg:#fafaf7;--fg:#222;--muted:#666;--card:#fff;--line:#ddd;--bad:#c33}
@media (prefers-color-scheme:dark){:root{--bg:#18181a;--fg:#eee;--muted:#aaa;--card:#232326;--line:#3a3a3e;--bad:#f77}}
body{font:14px/1.45 system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0;padding:16px}
h1{font-size:20px}small,figcaption{color:var(--muted)}code{font-size:12px}
.scroll{overflow-x:auto}table{border-collapse:collapse;background:var(--card)}th,td{border:1px solid var(--line);padding:6px 8px;vertical-align:top}
th img{width:110px;border-radius:6px}.num{text-align:right;white-space:nowrap}details ul{white-space:normal;text-align:left;min-width:260px;margin:4px 0;padding-left:16px}
.source{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}.source img{width:220px;border-radius:8px;border:1px solid var(--line)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:16px}
.card{margin:0;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}.card img{width:100%;display:block}
.card figcaption{padding:8px 10px}.failed .error{padding:10px;color:var(--bad);font-size:12px;word-break:break-word}
</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`;

// --- main ---

const args = process.argv.slice(2);
const mode = args[0];
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (!['eval', 'image'].includes(mode)) {
  console.error('Usage: node bench.mjs <eval|image> [--models a,b] [--config file] [--dry-run]');
  process.exit(1);
}
if (!apiKey) {
  console.error('Please set OPENROUTER_API_KEY.');
  process.exit(1);
}

const configPath = path.resolve(opt('config') ?? path.join(BENCH_DIR, 'bench.config.mjs'));
const cfg = (await import(pathToFileURL(configPath).href)).default;
const requested = opt('models')?.split(',').map((m) => m.trim()).filter(Boolean) ?? cfg[mode].models;
const models = await checkModels(requested);

if (args.includes('--dry-run')) {
  const perModel = mode === 'eval' ? cfg.eval.drawings.length * cfg.eval.runs : cfg.image.runs;
  console.log(`${mode}: ${models.length} models, ${models.length * perModel} calls:\n  ${models.join('\n  ')}`);
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.join(BENCH_DIR, 'results', `${stamp}-${mode}`);
await mkdir(outDir, { recursive: true });

const totalCost = mode === 'eval' ? await runEval(cfg, models, outDir) : await runImage(cfg, models, outDir);
console.log(`\nTotal cost: ${fmtCost(totalCost)}\nReport: ${path.join(outDir, 'report.html')}`);
