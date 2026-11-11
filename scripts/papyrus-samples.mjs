#!/usr/bin/env node
/**
 * The /papyrus sample documents as files.
 *
 *   node scripts/papyrus-samples.mjs --pdf    write the HTML, print the PDFs with
 *                                             `papyrus pdf` (page counts checked) and
 *                                             record their sizes in pdf-sizes.json
 *   node scripts/papyrus-samples.mjs --check  fail unless the committed HTML, PDFs
 *                                             (fingerprints, no browser needed) and
 *                                             sizes all match the source; runs before
 *                                             `build`, so a stale sample cannot ship
 *
 * There is deliberately no mode that rewrites only the HTML: the PDFs, their
 * manifest and the size label on the page must change with it.
 *
 * One source, src/components/papyrus-samples/documents.mjs, feeds these files
 * (and so the PDFs) and the sheets on the /papyrus page. The PDF fingerprints
 * cover that file, the fonts and the generated HTML.
 *
 * Printing needs Playwright, which is not a dependency of the site. Install it
 * once somewhere outside the repo and point PAPYRUS_PLAYWRIGHT_DIR at that folder:
 *
 *   mkdir -p ~/papyrus-print && cd ~/papyrus-print && npm init -y && npm i playwright
 *   npx playwright install chromium        # or set PAPYRUS_CHROMIUM_PATH to a Chrome
 *   PAPYRUS_PLAYWRIGHT_DIR=~/papyrus-print node scripts/papyrus-samples.mjs --pdf
 *
 * The PDFs are committed build outputs; Vercel only serves them.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SAMPLES_DIR, sampleDocs, standaloneHtml } from '../src/components/papyrus-samples/documents.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', SAMPLES_DIR);
const config = path.join(root, 'scripts', 'papyrus-samples.config.json');
const sizesFile = path.join(root, 'src', 'components', 'papyrus-samples', 'pdf-sizes.json');
const args = new Set(process.argv.slice(2));

// The `papyrus` bin of the installed @n-uf/papyrus (its exports map hides package.json)
function papyrusCli() {
  const require = createRequire(import.meta.url);
  let dir = path.dirname(require.resolve('@n-uf/papyrus'));
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  return path.join(dir, typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.papyrus);
}

const files = sampleDocs.map((doc) => ({ doc, file: path.join(outDir, doc.html), html: standaloneHtml(doc.id) }));

/** Bytes of each committed PDF, as the page's "PDF · 2 pages · 169 KB" label reads them. */
function pdfSizes() {
  return Object.fromEntries(
    sampleDocs.map((doc) => {
      const pdf = path.join(outDir, doc.pdf);
      return [doc.pdf, fs.existsSync(pdf) ? fs.statSync(pdf).size : null];
    }),
  );
}

function fail(message) {
  console.error(`${message}\nRun: node scripts/papyrus-samples.mjs --pdf (then commit the files).`);
  process.exit(1);
}

if (args.has('--check')) {
  const stale = files.filter(({ file, html }) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html);
  if (stale.length) fail(`Out of date: ${stale.map((f) => path.relative(root, f.file)).join(', ')}.`);

  // PDFs against their sources (fingerprints in the manifest; no browser needed)
  const printed = run(['pdf', '--config', config, '--check'], { cwd: root });
  if (printed !== 0) fail('The committed PDFs are older than their sources.');

  // The sizes the page shows against the PDFs it links to
  const recorded = fs.existsSync(sizesFile) ? JSON.parse(fs.readFileSync(sizesFile, 'utf8')) : {};
  if (JSON.stringify(recorded) !== JSON.stringify(pdfSizes())) fail('pdf-sizes.json does not match the PDFs.');
  console.log('papyrus samples: HTML, PDFs and sizes match their source.');
} else if (args.has('--pdf')) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const { file, html } of files) {
    fs.writeFileSync(file, html);
    console.log(`wrote ${path.relative(root, file)}`);
  }
  // The CLI loads Playwright from its own folder, then from the working directory
  const base = pathToFileURL(outDir + path.sep).href;
  const status = run(['pdf', '--config', config, '--base-url', base], {
    cwd: process.env.PAPYRUS_PLAYWRIGHT_DIR || root,
  });
  if (status !== 0) process.exit(status);
  fs.writeFileSync(sizesFile, `${JSON.stringify(pdfSizes(), null, 2)}\n`);
  console.log(`wrote ${path.relative(root, sizesFile)}`);
} else {
  console.error('Nothing to do: use --pdf (write the HTML and print the PDFs) or --check. See the header of this file.');
  process.exit(1);
}

function run(cliArgs, { cwd }) {
  return spawnSync(process.execPath, [papyrusCli(), ...cliArgs], { stdio: 'inherit', cwd }).status ?? 1;
}
