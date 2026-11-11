#!/usr/bin/env node
/**
 * The PDF of each /papyrus/<slug> article, printed by papyrus itself.
 *
 *   node scripts/article-pdfs.mjs --pdf [--only <slug>]   print the PDFs
 *   node scripts/article-pdfs.mjs --check                 fail on a missing or stale PDF (no browser, no build);
 *                                                         runs first in `pnpm build`, so a stale PDF cannot ship
 *
 * One source: the article's own page. `--pdf` makes a preview build (VERCEL_ENV=preview, so drafts are in it), serves
 * it on a free local port and runs `papyrus pdf` with a generated config: every article at
 * /papyrus/<slug>?print=1 (src/scripts/paginate.ts lays it out on A4 sheets at any width, with no reader bar), sheet
 * A4, page elements `.leaf` (the sheets are PapyrusLeaf, like the /papyrus page's). papyrus checks that each PDF has as many pages as the page has sheets.
 *
 * Output, in src/article-pdfs/ (NOT public/: a committed PDF of a draft would be readable on production before its
 * date; the build publishes only the PDFs of the articles it shows, see src/data/article-pdfs.mjs):
 *   <slug>.pdf              the PDF
 *   papyrus-manifest.json   papyrus's source fingerprints, which --check compares
 *   sizes.json              bytes and page count per slug, which the Download PDF button shows
 *
 * A PDF is stale when its article or the code that draws it changes: the article's .md (without its `draft:` line,
 * since going live flips only that line and must not make the PDF stale), src/pages/papyrus/[slug].astro,
 * src/styles/article.css, src/styles/global.css, src/scripts/paginate.ts and src/layouts/Layout.astro.
 *
 * Printing needs Playwright, which is not a dependency of the site. Install it once outside the repo and point
 * PAPYRUS_PLAYWRIGHT_DIR at that folder (as for scripts/papyrus-samples.mjs):
 *
 *   mkdir -p ~/papyrus-print && cd ~/papyrus-print && npm init -y && npm i playwright
 *   PAPYRUS_PLAYWRIGHT_DIR=~/papyrus-print node scripts/article-pdfs.mjs --pdf
 *
 * PAPYRUS_CHROMIUM_PATH picks the browser; on a Mac the installed Google Chrome is the default.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDF_DIR, articleSlugs, liveDatesTrailer, readSizes } from '../src/data/article-pdfs.mjs';
import { withoutDraftLine } from '../src/data/front-matter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, PDF_DIR);
const workDir = path.join(root, '.astro', 'article-pdfs'); // gitignored; the config and the fingerprinted sources
const configFile = path.join(workDir, 'papyrus.config.json');
const sizesFile = path.join(outDir, 'sizes.json');
const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

// What draws every article; a change to any of these makes every PDF stale
const SHARED_SOURCES = [
  'src/pages/papyrus/[slug].astro',
  // the paper of the /papyrus page, which the sheets reuse: a change there reprints the articles too
  'src/components/PapyrusLeaf.astro',
  'src/components/ExtLink.astro',
  'src/components/papyrus-samples/documents.mjs',
  'src/styles/article.css',
  'src/styles/global.css',
  'src/scripts/paginate.ts',
  'src/layouts/Layout.astro',
  // code that turns the markdown and the front matter into the page the PDF is printed from
  'src/data/live-blocks.mjs',
  'src/data/live.ts',
  'src/data/inline-code.mjs',
  'src/data/links.ts',
  'src/data/rehype-external-links.mjs',
  'src/data/articles.ts',
  'src/content.config.ts',
  'astro.config.mjs',
];

/** The `papyrus` bin of the installed @n-uf/papyrus (its exports map hides package.json) */
function papyrusCli() {
  const require = createRequire(import.meta.url);
  let dir = path.dirname(require.resolve('@n-uf/papyrus'));
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  return path.join(dir, typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.papyrus);
}

// What is running or made, so Ctrl+C or a kill leaves nothing behind
const children = new Set();
const cleanups = [];
/**
 * Stops a child and everything it started: each runs in its own process group (spawned `detached`), and the signal goes
 * to the whole group, so a pnpm that started astro, or a papyrus that started Chrome, leaves nothing running.
 */
function killGroup(child, signal = 'SIGTERM') {
  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      /* already gone */
    }
  }
}

function stopAll(code) {
  for (const child of children) killGroup(child);
  for (const cleanup of cleanups.splice(0).reverse()) {
    try {
      cleanup();
    } catch {
      /* the folder or server is already gone */
    }
  }
  process.exit(code);
}
process.on('SIGINT', () => stopAll(130));
process.on('SIGTERM', () => stopAll(143));

/**
 * Runs a command and resolves to its exit code; one that runs longer than `timeoutMs` is stopped (exit code 1).
 * Async, not spawnSync: this process also serves the pages papyrus prints, and must hear Ctrl+C.
 */
function runChild(command, cliArgs, { cwd, env, timeoutMs }) {
  return new Promise((resolve) => {
    // detached: its own process group, so a timeout or Ctrl+C can stop it with everything it started
    const child = spawn(command, cliArgs, { stdio: 'inherit', cwd, env, detached: true });
    children.add(child);
    const timer = setTimeout(() => {
      console.error(`article-pdfs: ${path.basename(command)} ran for more than ${Math.round(timeoutMs / 1000)} s; stopping it.`);
      killGroup(child);
    }, timeoutMs);
    const done = (code) => {
      clearTimeout(timer);
      children.delete(child);
      resolve(code ?? 1);
    };
    child.on('error', (error) => {
      console.error(`article-pdfs: could not run ${command}: ${error.message}`);
      done(1);
    });
    child.on('close', done);
  });
}

/** Runs `papyrus` and resolves to its exit code. */
const runPapyrus = (cliArgs, { cwd, env, timeoutMs }) => runChild(process.execPath, [papyrusCli(), ...cliArgs], { cwd, env, timeoutMs });

const CHECK_TIMEOUT_MS = 2 * 60 * 1000;
const BUILD_TIMEOUT_MS = 5 * 60 * 1000;
const PRINT_TIMEOUT_MS = 15 * 60 * 1000;

/** Writes the papyrus config and each article's fingerprinted source; returns the slugs. */
function prepare() {
  const slugs = articleSlugs(root);
  const sourcesDir = path.join(workDir, 'sources');
  fs.rmSync(sourcesDir, { recursive: true, force: true });
  fs.mkdirSync(sourcesDir, { recursive: true });
  const rel = (file) => path.relative(workDir, file).split(path.sep).join('/');
  for (const slug of slugs) {
    const text = fs.readFileSync(path.join(root, 'src', 'content', 'papyrus', `${slug}.md`), 'utf8');
    // The article without its draft line, and the go-live days of the articles its {{live:}} blocks point at: the print
    // layout keeps a block only if its target is live by this article's day, so a moved date reprints the PDF
    fs.writeFileSync(path.join(sourcesDir, `${slug}.md`), withoutDraftLine(text) + liveDatesTrailer(text, root));
  }
  const config = {
    docUrl: '/papyrus/{id}?print=1',
    outDir: rel(outDir),
    sheet: 'A4',
    pageSelector: '.leaf',
    sources: SHARED_SOURCES.map((source) => rel(path.join(root, source))),
    docs: slugs.map((slug) => ({ id: slug, sources: [rel(path.join(sourcesDir, `${slug}.md`))] })),
  };
  fs.writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`);
  return slugs;
}

/** { slug: { bytes, pages } } for the PDFs that exist, bytes from the file, pages from papyrus's manifest. */
function measuredSizes(slugs) {
  const manifestFile = path.join(outDir, 'papyrus-manifest.json');
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { docs: {} };
  const sizes = {};
  for (const slug of slugs) {
    const pdf = path.join(outDir, `${slug}.pdf`);
    if (fs.existsSync(pdf)) sizes[slug] = { bytes: fs.statSync(pdf).size, pages: manifest.docs?.[slug]?.pages ?? null };
  }
  return sizes;
}

function fail(message) {
  console.error(`${message}\nRun: node scripts/article-pdfs.mjs --pdf (then commit src/article-pdfs).`);
  process.exit(1);
}

/** Serves a built folder the way Vercel does (/x -> x.html or x/index.html); resolves to { server, port }. */
function serve(dir) {
  const server = http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    } catch {
      pathname = '/';
    }
    const base = path.join(dir, path.normalize(pathname));
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };
    const inside = (f) => f === dir || f.startsWith(dir + path.sep);
    const found = [base, `${base}.html`, path.join(base, 'index.html')].find((f) => inside(f) && fs.existsSync(f) && fs.statSync(f).isFile());
    if (!found) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(found)] ?? 'application/octet-stream' });
    res.end(fs.readFileSync(found));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

if (flag('--check')) {
  const slugs = prepare();
  if (slugs.length > 0) {
    if ((await runPapyrus(['pdf', '--config', configFile, '--check'], { cwd: root, env: process.env, timeoutMs: CHECK_TIMEOUT_MS })) !== 0) {
      fail('Some article PDFs are missing or older than their sources.');
    }
  }
  if (JSON.stringify(readSizes(root)) !== JSON.stringify(measuredSizes(slugs))) {
    fail('src/article-pdfs/sizes.json does not match the PDFs.');
  }
  console.log(`article PDFs: ${slugs.length} article(s), PDFs and sizes match their sources.`);
} else if (flag('--pdf')) {
  const slugs = prepare();
  if (slugs.length === 0) {
    console.log('article PDFs: no articles in src/content/papyrus, nothing to print.');
    process.exit(0);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const built = fs.mkdtempSync(path.join(os.tmpdir(), 'article-pdfs-build-'));
  cleanups.push(() => fs.rmSync(built, { recursive: true, force: true }));
  let status = 1;
  try {
    // A preview build, so drafts are in it; its own copy step publishes the PDFs that exist, which is harmless here
    const buildStatus = await runChild('pnpm', ['exec', 'astro', 'build', '--outDir', built], {
      cwd: root,
      env: { ...process.env, VERCEL_ENV: 'preview' },
      timeoutMs: BUILD_TIMEOUT_MS,
    });
    if (buildStatus !== 0) throw new Error('the preview build failed');
    prepare(); // astro clears its .astro folder, with the config in it
    const { server, port } = await serve(built);
    cleanups.push(() => server.close());
    try {
      const env = { ...process.env };
      if (!env.PAPYRUS_CHROMIUM_PATH && fs.existsSync(MAC_CHROME)) env.PAPYRUS_CHROMIUM_PATH = MAC_CHROME;
      const only = option('--only');
      status = await runPapyrus(
        ['pdf', '--config', configFile, '--base-url', `http://127.0.0.1:${port}`, ...(only ? ['--only', only] : [])],
        { cwd: process.env.PAPYRUS_PLAYWRIGHT_DIR || root, env, timeoutMs: PRINT_TIMEOUT_MS },
      );
    } finally {
      server.close();
    }
  } finally {
    fs.rmSync(built, { recursive: true, force: true });
  }
  if (status !== 0) process.exit(status);
  fs.writeFileSync(sizesFile, `${JSON.stringify(measuredSizes(slugs), null, 2)}\n`);
  console.log(`wrote ${path.relative(root, sizesFile)}`);
} else {
  console.error('Nothing to do: use --pdf (print the PDFs) or --check. See the header of this file.');
  process.exit(1);
}
