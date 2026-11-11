#!/usr/bin/env node
/**
 * The /papyrus sample documents as files.
 *
 *   node scripts/papyrus-samples.mjs          write public/papyrus-samples/*.html
 *   node scripts/papyrus-samples.mjs --check  fail if the committed HTML differs
 *                                             from its source (runs before `build`)
 *   node scripts/papyrus-samples.mjs --pdf    write the HTML, then print the PDFs
 *                                             with `papyrus pdf` (page counts checked)
 *   node scripts/papyrus-samples.mjs --pdf-check   report PDFs older than their sources
 *
 * One source, src/components/papyrus-samples/documents.mjs, feeds both these
 * files (and so the PDFs) and the sheets on the /papyrus page.
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
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SAMPLES_DIR, sampleDocs, standaloneHtml } from '../src/components/papyrus-samples/documents.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', SAMPLES_DIR);
const config = path.join(root, 'scripts', 'papyrus-samples.config.json');
const cli = path.join(root, 'node_modules', '@n-uf', 'papyrus', 'src', 'pdf', 'cli.js');
const args = new Set(process.argv.slice(2));

const files = sampleDocs.map((doc) => ({ file: path.join(outDir, doc.html), html: standaloneHtml(doc.id) }));

if (args.has('--check')) {
  const stale = files.filter(({ file, html }) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html);
  if (stale.length) {
    console.error(
      `Out of date: ${stale.map((f) => path.relative(root, f.file)).join(', ')}.\n` +
        'Run: node scripts/papyrus-samples.mjs --pdf (then commit the files).',
    );
    process.exit(1);
  }
  console.log('papyrus samples: the committed HTML matches its source.');
} else if (args.has('--pdf-check')) {
  run(['pdf', '--config', config, '--check']);
} else {
  fs.mkdirSync(outDir, { recursive: true });
  for (const { file, html } of files) {
    fs.writeFileSync(file, html);
    console.log(`wrote ${path.relative(root, file)}`);
  }
  if (args.has('--pdf')) {
    const base = pathToFileURL(outDir + path.sep).href;
    run(['pdf', '--config', config, '--base-url', base]);
  }
}

function run(cliArgs) {
  const result = spawnSync(process.execPath, [cli, ...cliArgs], {
    stdio: 'inherit',
    // The CLI loads Playwright from its own folder, then from the working directory
    cwd: process.env.PAPYRUS_PLAYWRIGHT_DIR || root,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
