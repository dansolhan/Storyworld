#!/usr/bin/env node
/**
 * design-snapshot — capture the app's *appearance* as standalone HTML.
 *
 * Renders the real app (and Storybook) in a headless browser, then serializes
 * the DOM together with the CSS that actually applied. The output is plain
 * HTML + CSS: no React, no TypeScript, no store, no build step required to
 * view it. Intended as an overview to hand to a design tool.
 *
 *   node tools/design-snapshot.mjs [options]
 *
 *   --skip-build       reuse an existing dist/ and cached Storybook build
 *   --only app|sb      capture only the app, or only Storybook
 *   --no-dark          skip the forced-dark variants
 *   --no-png           skip screenshots
 *   --zip              also write design-snapshot.zip
 *   --headed           show the browser (useful when a step misbehaves)
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'design-snapshot');
const ZIP = path.join(ROOT, 'design-snapshot.zip');
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'design-snapshot');
const SB_STATIC = path.join(CACHE, 'storybook');

const FONTS =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700' +
  '&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900' +
  '&family=Lora:ital,wght@0,400..700;1,400..700&display=swap';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const SKIP_BUILD = flag('skip-build');
const ONLY = opt('only', 'both');
const WANT_DARK = !flag('no-dark');
const WANT_PNG = !flag('no-png');
const WANT_ZIP = flag('zip');
const HEADED = flag('headed');

const VIEWPORT = { width: 1440, height: 900 };
const SB_VIEWPORT = { width: 1000, height: 700 };

const manifest = [];
const problems = [];

// ─────────────────────────────────────────────────────────── build helpers ──

function run(cmd, args, label, opts = {}) {
  return new Promise((resolve, reject) => {
    console.log(`  › ${label}`);
    const p = spawn(cmd, args, { cwd: ROOT, shell: true, stdio: 'inherit', ...opts });
    p.on('error', reject);
    p.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} failed (exit ${code})`))
    );
  });
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.map': 'application/json',
};

/** Minimal static file server with SPA fallback. Returns { origin, close }. */
async function serve(dir, { spa = false } = {}) {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(dir, url === '/' ? 'index.html' : url);
    if (!file.startsWith(dir)) return res.writeHead(403).end();
    if (!existsSync(file) || file.endsWith(path.sep)) {
      const asIndex = path.join(file, 'index.html');
      if (existsSync(asIndex)) file = asIndex;
      else if (spa) file = path.join(dir, 'index.html');
      else return res.writeHead(404).end();
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      });
      res.end(body);
    } catch {
      res.writeHead(500).end();
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => server.close(r)),
  };
}

// ──────────────────────────────────────────────────────────── serializing ──

/**
 * Runs *inside the page*. Collects the live DOM plus every CSS rule that the
 * document actually loaded, so the snapshot keeps real class names and
 * `var(--token)` references instead of flattened computed styles.
 */
function serializeInPage() {
  const sheets = [];
  const external = [];
  for (const sheet of document.styleSheets) {
    try {
      sheets.push([...sheet.cssRules].map((r) => r.cssText).join('\n'));
    } catch {
      if (sheet.href) external.push(sheet.href); // cross-origin (Google Fonts)
    }
  }

  const body = document.body.cloneNode(true);
  body.querySelectorAll('script, noscript, link[rel="modulepreload"]').forEach((n) => n.remove());

  // Form state lives in DOM *properties*, which cloneNode does not carry — a
  // cloned <select> falls back to its placeholder. Reflect them to attributes.
  const live = document.body.querySelectorAll('input, textarea, select');
  const copy = body.querySelectorAll('input, textarea, select');
  live.forEach((src, i) => {
    const dst = copy[i];
    if (!dst) return;
    if (src.tagName === 'SELECT') {
      [...dst.options].forEach((o, j) =>
        j === src.selectedIndex ? o.setAttribute('selected', '') : o.removeAttribute('selected')
      );
    } else if (src.type === 'checkbox' || src.type === 'radio') {
      if (src.checked) dst.setAttribute('checked', '');
      else dst.removeAttribute('checked');
    } else if (src.tagName === 'TEXTAREA') {
      dst.textContent = src.value;
    } else if (src.value) {
      dst.setAttribute('value', src.value);
    }
  });

  // Canvas content is lost on clone; leave a visible placeholder rather than a blank box.
  body.querySelectorAll('canvas').forEach((c) => {
    const ph = document.createElement('div');
    ph.setAttribute('data-was', 'canvas');
    ph.setAttribute('style', c.getAttribute('style') || '');
    ph.style.background = 'repeating-linear-gradient(45deg,#0001 0 8px,#0000 8px 16px)';
    c.replaceWith(ph);
  });

  return {
    css: sheets.join('\n'),
    external,
    bodyHtml: body.innerHTML,
    bodyAttrs: [...document.body.attributes].map((a) => [a.name, a.value]),
    htmlAttrs: [...document.documentElement.attributes].map((a) => [a.name, a.value]),
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrs = (pairs) =>
  pairs.map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`).join('');

/**
 * Lift the declarations inside `@media (prefers-color-scheme: dark)` out of the
 * media query so the dark variant renders dark regardless of the viewer's OS.
 */
function forceDark(css) {
  const marker = '@media (prefers-color-scheme: dark)';
  const out = [];
  let i = 0;
  for (;;) {
    const at = css.indexOf(marker, i);
    if (at === -1) break;
    const open = css.indexOf('{', at);
    if (open === -1) break;
    let depth = 0, end = open;
    for (let j = open; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}' && --depth === 0) { end = j; break; }
    }
    out.push(css.slice(open + 1, end));
    i = end + 1;
  }
  return out.join('\n');
}

async function writeSnapshot({ slug, group, title, note, data, theme }) {
  const dark = theme === 'dark';
  const name = dark ? `${slug}.dark` : slug;
  const file = path.join(OUT, group, `${name}.html`);
  await mkdir(path.dirname(file), { recursive: true });

  const links = [...new Set([FONTS, ...data.external])]
    .map((h) => `<link rel="stylesheet" href="${h}">`)
    .join('\n');

  const override = dark ? forceDark(data.css) : '';

  const html = `<!doctype html>
<!-- @dsCard group="${esc(group)}" -->
<html${attrs(data.htmlAttrs)}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}${dark ? ' (dark)' : ''}</title>
${note ? `<!-- ${esc(note)} -->\n` : ''}${links}
<style>
${data.css}
</style>${override ? `
<!-- dark palette hoisted out of the prefers-color-scheme media query -->
<style>
:root { color-scheme: dark; }
${override}
</style>` : ''}
</head>
<body${attrs(data.bodyAttrs)}>
${data.bodyHtml}
</body>
</html>
`;
  await writeFile(file, html, 'utf8');
  return path.relative(OUT, file).split(path.sep).join('/');
}

/** Capture the page as-is: HTML (light + dark) and optionally a PNG. */
async function capture(page, { slug, group, title, note, clip }) {
  const data = await page.evaluate(serializeInPage);
  const files = [await writeSnapshot({ slug, group, title, note, data, theme: 'light' })];
  if (WANT_DARK) {
    files.push(await writeSnapshot({ slug, group, title, note, data, theme: 'dark' }));
  }

  let png = null;
  if (WANT_PNG) {
    png = `${group}/${slug}.png`;
    await page.screenshot({ path: path.join(OUT, png), ...(clip ? { clip } : {}) })
      .catch(() => { png = null; });
  }

  manifest.push({ slug, group, title, note: note || null, files, png });
  console.log(`  ✓ ${group}/${slug}`);
}

// ──────────────────────────────────────────────────────── interaction util ──

const settle = (page, ms = 350) => page.waitForTimeout(ms);

/** Click by accessible name; resolves false instead of throwing if absent. */
async function clickIfPresent(page, name, { exact = true, timeout = 4000 } = {}) {
  try {
    await page.getByRole('button', { name, exact }).first().click({ timeout });
    await settle(page);
    return true;
  } catch {
    return false;
  }
}

/** Open a MenuBar dropdown and pick an item. */
async function menu(page, top, item) {
  if (!(await clickIfPresent(page, top))) return false;
  if (!(await clickIfPresent(page, item))) {
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }
  await settle(page, 500);
  return true;
}

/**
 * React Flow restores the persisted viewport, which is usually zoomed into one
 * node. Frame the whole graph so the canvas reads as a graph.
 */
async function fitGraph(page) {
  await page.locator('.react-flow__controls-fitview').first().click({ timeout: 4000 })
    .catch(() => {});
  await settle(page, 900); // let the zoom transition finish
}

/**
 * Click a graph node that isn't sitting under the floating toolbar — after
 * fitView the topmost node often is, and the toolbar swallows the click.
 */
async function selectGraphNode(page) {
  const toolbar = await page.locator('[class*="toolbar"]').first().boundingBox().catch(() => null);
  const guard = (toolbar?.y ?? 0) + (toolbar?.height ?? 0) + 8;

  const nodes = page.locator('.react-flow__node');
  const total = await nodes.count();
  for (let i = 0; i < total; i++) {
    const box = await nodes.nth(i).boundingBox();
    if (box && box.y > guard) {
      await nodes.nth(i).click({ timeout: 5000 });
      await settle(page, 800);
      return true;
    }
  }
  throw new Error('no graph node clear of the toolbar');
}

async function dismiss(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await settle(page, 250);
  // Fall back to an explicit close control if Escape didn't take.
  for (const label of ['Close', '×', 'Cancel']) {
    if (await page.getByRole('button', { name: label, exact: true }).first().isVisible().catch(() => false)) {
      await clickIfPresent(page, label);
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────── app walk ──

async function captureApp(browser) {
  if (!existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    throw new Error('dist/ not found — run without --skip-build first');
  }
  const site = await serve(path.join(ROOT, 'dist'), { spa: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  const step = async (label, fn) => {
    try { await fn(); } catch (e) { problems.push(`app/${label}: ${e.message}`); }
  };

  try {
    await page.goto(site.origin, { waitUntil: 'networkidle' });
    await page.waitForSelector('#root > *', { timeout: 15000 });
    await settle(page, 600);

    await step('dashboard-empty', () =>
      capture(page, {
        slug: 'dashboard-empty', group: 'app', title: 'Dashboard — empty state',
      })
    );

    // Load Demo seeds exampleStory.json and jumps straight into the editor.
    await step('load-demo', async () => {
      if (!(await clickIfPresent(page, 'Load Demo'))) {
        throw new Error('"Load Demo" button not found');
      }
      await page.waitForSelector('.react-flow', { timeout: 15000 });
      await settle(page, 1200);
      await fitGraph(page);
    });

    await step('editor-graph', () =>
      capture(page, {
        slug: 'editor-graph', group: 'app', title: 'Graph editor — canvas, toolbar, menubar',
        note: 'React Flow canvas frozen at one zoom/pan; nodes are transform-positioned.',
      })
    );

    await step('dashboard-populated', async () => {
      if (!(await menu(page, 'File', '< Back to Dashboard'))) throw new Error('menu path failed');
      await settle(page, 600);
      await capture(page, {
        slug: 'dashboard-populated', group: 'app', title: 'Dashboard — with a saved story',
      });
      // Return to the editor for the remaining captures.
      await page.locator('[class*="storyCard"], [class*="StoryCard"]').first().click({ timeout: 4000 })
        .catch(() => clickIfPresent(page, 'Load Demo'));
      await page.waitForSelector('.react-flow', { timeout: 15000 });
      await settle(page, 1000);
      await fitGraph(page);
    });

    await step('editor-node-selected', async () => {
      await selectGraphNode(page);
      await capture(page, {
        slug: 'editor-node-selected', group: 'app',
        title: 'Editor — page selected, sidebar inspector open',
        note: 'Covers EditorSidebar, Tabs, RichTextEditor, EventsEditor, TagInput.',
      });
    });

    const panels = [
      ['Story', 'Settings', 'story-settings', 'Story settings drawer'],
      ['Data', 'Items', 'items-manager', 'Item manager'],
      ['Data', 'Variables', 'variables-manager', 'Variable manager'],
      ['Data', 'Audio', 'audio-manager', 'Audio manager'],
      ['Data', 'Atmosphere', 'atmosphere-manager', 'Atmosphere manager'],
      ['Data', 'Status Data', 'status-data-manager', 'Status data manager'],
      ['Data', 'Context', 'context-manager', 'Context manager'],
    ];
    for (const [top, item, slug, title] of panels) {
      await step(slug, async () => {
        if (!(await menu(page, top, item))) throw new Error(`${top} > ${item} unavailable`);
        await capture(page, { slug, group: 'app-panels', title });
        await dismiss(page);
      });
    }

    await step('player', async () => {
      if (!(await clickIfPresent(page, '▶ Play Story', { exact: false }))) {
        throw new Error('play button not found');
      }
      await settle(page, 1500);
      await capture(page, {
        slug: 'player-page', group: 'app', title: 'Player — page, choices, status',
        note: 'Covers Player, Inventory, StatusDataDisplay, ChoiceRenderer.',
      });
    });
  } finally {
    await ctx.close();
    await site.close();
  }
}

// ───────────────────────────────────────────────────────────── storybook ──

async function captureStorybook(browser) {
  if (!existsSync(path.join(SB_STATIC, 'index.html'))) {
    throw new Error('Storybook build not found — run without --skip-build first');
  }
  const site = await serve(SB_STATIC);
  const ctx = await browser.newContext({ viewport: SB_VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  try {
    const index = JSON.parse(await readFile(path.join(SB_STATIC, 'index.json'), 'utf8'));
    const stories = Object.values(index.entries ?? index.stories ?? {})
      .filter((e) => (e.type ?? 'story') === 'story');

    console.log(`  ${stories.length} stories`);

    for (const story of stories) {
      const slug = story.id;
      try {
        await page.goto(`${site.origin}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`, {
          waitUntil: 'load',
        });
        // Storybook renders asynchronously after load; wait for actual content
        // rather than the (always-present) empty root container.
        // NB: the 2nd positional arg is `arg`, not options — options come 3rd.
        await page.waitForFunction(
          () => {
            const r = document.querySelector('#storybook-root') || document.querySelector('#root');
            return !!r && r.children.length > 0 && r.getBoundingClientRect().height > 0;
          },
          undefined,
          { timeout: 15000 }
        );
        await settle(page, 600);
        await capture(page, {
          slug, group: 'components',
          title: `${story.title} — ${story.name}`,
        });
      } catch (e) {
        problems.push(`storybook/${slug}: ${e.message.split('\n')[0]}`);
      }
    }
  } finally {
    await ctx.close();
    await site.close();
  }
}

// ─────────────────────────────────────────────────────────────────── zip ──

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function walk(dir, base = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full, base)));
    // ZIP requires '/' separators; Compress-Archive on Windows PowerShell emits
    // '\', which non-Windows tools read as part of the filename.
    else out.push({ full, name: path.relative(base, full).split(path.sep).join('/') });
  }
  return out;
}

/** Write a spec-conformant zip (deflate, forward slashes) with no dependencies. */
async function writeZip(srcDir, dest) {
  const files = (await walk(srcDir)).sort((a, b) => a.name.localeCompare(b.name));
  const locals = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const raw = await readFile(f.full);
    const deflated = deflateRawSync(raw, { level: 9 });
    // Fall back to STORE when deflate doesn't help (already-compressed PNGs).
    const store = deflated.length >= raw.length;
    const data = store ? raw : deflated;
    const method = store ? 0 : 8;
    const crc = crc32(raw);
    const name = Buffer.from(f.name, 'utf8');

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);            // version needed
    lh.writeUInt16LE(0x0800, 6);        // flags: UTF-8 names
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(0, 10);            // mod time — fixed, keeps runs reproducible
    lh.writeUInt16LE(33, 12);           // mod date = 1980-01-01
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(data.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);            // extra field length
    locals.push(lh, name, data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);            // version made by
    cd.writeUInt16LE(20, 6);            // version needed
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(33, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt16LE(0, 30);            // extra
    cd.writeUInt16LE(0, 32);            // comment
    cd.writeUInt16LE(0, 34);            // disk number start
    cd.writeUInt16LE(0, 36);            // internal attrs
    cd.writeUInt32LE((0o100644 << 16) >>> 0, 38); // external attrs: regular file, 0644
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);

    offset += lh.length + name.length + data.length;
  }

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  await writeFile(dest, Buffer.concat([...locals, cdBuf, eocd]));
  return files.length;
}

// ────────────────────────────────────────────────────────── contact sheet ──

async function writeIndex() {
  const ORDER = ['app', 'app-panels', 'components'];
  const groups = [...new Set(manifest.map((m) => m.group))]
    .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));

  const section = (g) => {
    const cards = manifest
      .filter((m) => m.group === g)
      .map((m) => {
        const light = m.files[0];
        const dark = m.files[1];
        return `<figure>
  <a href="${light}"><iframe src="${light}" loading="lazy" title="${esc(m.title)}"></iframe></a>
  <figcaption>
    <strong>${esc(m.title)}</strong>
    <span><a href="${light}">html</a>${dark ? ` · <a href="${dark}">dark</a>` : ''}${m.png ? ` · <a href="${m.png}">png</a>` : ''}</span>
    ${m.note ? `<em>${esc(m.note)}</em>` : ''}
  </figcaption>
</figure>`;
      })
      .join('\n');
    return `<h2>${esc(g)}</h2>\n<div class="grid">\n${cards}\n</div>`;
  };

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>StoryworldAI — UI snapshot</title>
<link rel="stylesheet" href="${FONTS}">
<style>
  :root { color-scheme: light dark; --fg:#111827; --bg:#fff; --mut:#6b7280; --line:#e5e7eb; }
  @media (prefers-color-scheme: dark) { :root { --fg:#f8fafc; --bg:#0f172a; --mut:#94a3b8; --line:#334155; } }
  body { margin:0; padding:32px; font:16px/1.5 Inter,system-ui,sans-serif; color:var(--fg); background:var(--bg); }
  h1 { font-size:1.75rem; margin:0 0 4px; }
  p.lede { color:var(--mut); margin:0 0 32px; max-width:70ch; }
  h2 { font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:var(--mut);
       margin:40px 0 12px; padding-bottom:8px; border-bottom:1px solid var(--line); }
  .grid { display:grid; gap:24px; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); }
  figure { margin:0; border:1px solid var(--line); border-radius:12px; overflow:hidden; background:var(--bg); }
  iframe { width:1440px; height:900px; border:0; transform:scale(.28); transform-origin:0 0;
           pointer-events:none; background:#fff; }
  a:has(iframe) { display:block; height:252px; overflow:hidden; }
  figcaption { padding:12px 14px; border-top:1px solid var(--line); display:grid; gap:4px; font-size:.85rem; }
  figcaption span, figcaption em { color:var(--mut); font-size:.78rem; }
  a { color:inherit; }
</style></head>
<body>
<h1>StoryworldAI — UI snapshot</h1>
<p class="lede">Static HTML + CSS captured from the running app and Storybook. Real class names and
design tokens are preserved; no application logic is included. Each thumbnail links to a standalone file.</p>
${groups.map(section).join('\n')}
</body></html>
`;
  await writeFile(path.join(OUT, 'index.html'), html, 'utf8');
  await writeFile(
    path.join(OUT, 'manifest.json'),
    JSON.stringify({ entries: manifest }, null, 2),
    'utf8'
  );
}

// ──────────────────────────────────────────────────────────────────── main ──

async function main() {
  const wantApp = ONLY === 'both' || ONLY === 'app';
  const wantSb = ONLY === 'both' || ONLY === 'sb';

  if (!SKIP_BUILD) {
    console.log('building…');
    // `npm run build` runs `tsc -b` first; we only need rendered output, and
    // type errors elsewhere in the repo shouldn't block a design snapshot.
    if (wantApp) await run('npx', ['vite', 'build'], 'vite build (no typecheck)');
    if (wantSb) {
      await rm(SB_STATIC, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      // An interrupted build leaves Storybook's own vite cache inconsistent,
      // which yields a bundle whose importFn doesn't match index.json.
      await rm(path.join(ROOT, 'node_modules', '.cache', 'storybook'),
        { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      await mkdir(CACHE, { recursive: true });
      await run('npx', ['storybook', 'build', '-o', SB_STATIC, '--quiet'], 'storybook build');
    }
  }

  // Clear only the groups being regenerated, so `--only app` doesn't discard
  // an existing Storybook capture (and vice versa). Carry the rest forward.
  const APP_GROUPS = ['app', 'app-panels'];
  const SB_GROUPS = ['components'];
  const stale = [...(wantApp ? APP_GROUPS : []), ...(wantSb ? SB_GROUPS : [])];

  const prevPath = path.join(OUT, 'manifest.json');
  if (existsSync(prevPath)) {
    try {
      const prev = JSON.parse(await readFile(prevPath, 'utf8'));
      manifest.push(...(prev.entries ?? []).filter((e) => !stale.includes(e.group)));
    } catch { /* regenerate from scratch */ }
  }

  await mkdir(OUT, { recursive: true });
  for (const g of stale) {
    await rm(path.join(OUT, g), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }

  const browser = await chromium.launch({ headless: !HEADED });
  try {
    if (wantApp) { console.log('capturing app…'); await captureApp(browser); }
    if (wantSb) { console.log('capturing storybook…'); await captureStorybook(browser); }
  } finally {
    await browser.close();
  }

  await writeIndex();

  console.log(`\n${manifest.length} states captured → design-snapshot/index.html`);
  if (problems.length) {
    console.log(`\n${problems.length} step(s) did not capture:`);
    for (const p of problems) console.log(`  ! ${p}`);
  }

  if (WANT_ZIP) {
    await rm(ZIP, { force: true });
    const n = await writeZip(OUT, ZIP);
    const mb = ((await readFile(ZIP)).length / 1024 / 1024).toFixed(1);
    console.log(`packed ${n} files → ${path.relative(ROOT, ZIP)} (${mb} MB)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
