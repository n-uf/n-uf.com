// Lays an article out on A4 sheets on wide screens, the way papyrus lays out documents: fixed sheets, one page each,
// with a running head, a folio ("Page 2 of 5") and page numbers in the contents list.
// The server HTML is one long sheet with every word in it (what crawlers, narrow screens and no-JS readers get); this
// only moves the same blocks into more sheets. Blocks are never split: a block that doesn't fit starts the next sheet,
// taking with it a heading or a "…:" sentence left at the bottom; a block taller than a sheet gets a sheet that grows.

// @ts-ignore: plain JS module, shared with the build (and its tests)
import { dropLateLiveBlocks } from '../data/live-blocks.mjs';

const WIDE = '(min-width: 900px)';
// The `print-mode` class on <html> lays the article out on A4 sheets whatever the viewport width, with no reader bar,
// and measures them with the wrapping the print CSS gives code and tables (article.css). The page sets it from `?print`
// (any value): that is the page papyrus prints to the article's PDF (scripts/article-pdfs.mjs), whose A4 viewport is
// 794 px, below WIDE. Printing from the browser (the button, Cmd/Ctrl+P) sets it while the print dialog is open.
const PRINT_MODE = 'print-mode';
const inPrintMode = (): boolean => document.documentElement.classList.contains(PRINT_MODE);

function paginate(paper: HTMLElement): void {
  const first = paper.querySelector<HTMLElement>('.sheet');
  const head = first?.querySelector<HTMLElement>('.sheet-head');
  const foot = first?.querySelector<HTMLElement>('.sheet-foot');
  const body = first?.querySelector<HTMLElement>('.sheet-body');
  if (!first || !head || !foot || !body) return;

  // The blocks in reading order; a block inside a .flow wrapper (the body, the FAQ, sources, related) remembers it,
  // so each sheet gets its own shallow copy of the wrapper and the wrapper's styles still apply
  const items: { el: Element; wrap: Element | null }[] = [];
  for (const child of Array.from(body.children)) {
    if (child.classList.contains('flow')) {
      for (const inner of Array.from(child.children)) items.push({ el: inner, wrap: child });
    } else {
      items.push({ el: child, wrap: null });
    }
  }

  const sheets: HTMLElement[] = [];
  paper.textContent = '';
  const newSheet = (): HTMLElement => {
    const sheet = first.cloneNode(false) as HTMLElement;
    sheet.classList.add('paged');
    const sheetBody = body.cloneNode(false) as HTMLElement;
    sheet.append(head.cloneNode(true), sheetBody, foot.cloneNode(true));
    paper.append(sheet);
    sheets.push(sheet);
    return sheetBody;
  };

  let current = newSheet();
  let wrapOf: Element | null = null;
  let wrapCopy: Element | null = null;
  const place = (el: Element, wrap: Element | null): Element => {
    if (!wrap) {
      wrapOf = null;
      wrapCopy = null;
      current.append(el);
      return current;
    }
    if (wrapOf !== wrap || !wrapCopy || wrapCopy.parentElement !== current) {
      wrapCopy = wrap.cloneNode(false) as Element;
      current.append(wrapCopy);
      wrapOf = wrap;
    }
    wrapCopy.append(el);
    return wrapCopy;
  };
  const overflows = (): boolean => current.scrollHeight > current.clientHeight + 1;
  const blocksOnSheet = (): number => current.querySelectorAll(':scope > :not(.flow), :scope > .flow > *').length;

  for (const { el, wrap } of items) {
    // A sheet that grew to fit a tall block is full (its height is auto, so it would never overflow again and take
    // everything after it): the next block starts a new sheet
    if (current.parentElement?.classList.contains('tall')) {
      current = newSheet();
      wrapOf = null;
      wrapCopy = null;
    }
    const container = place(el, wrap);
    if (!overflows()) continue;
    if (blocksOnSheet() === 1) {
      // Taller than a sheet on its own: this sheet grows to fit it
      current.parentElement?.classList.add('tall');
      continue;
    }
    // Start the next sheet with this block, and with any heading it would leave alone at the bottom
    const carry: Element[] = [el];
    el.remove();
    let last = container.lastElementChild;
    // Keep with the block: a heading, or a sentence that ends in a colon and introduces it
    const keepsWithNext = (block: Element): boolean =>
      /^H[2-4]$/.test(block.tagName) || (block.tagName === 'P' && /:\s*$/.test(block.textContent ?? ''));
    while (last && keepsWithNext(last) && blocksOnSheet() > 1) {
      carry.unshift(last);
      last.remove();
      last = container.lastElementChild;
    }
    if (container !== current && container.children.length === 0) container.remove();
    current = newSheet();
    wrapOf = null;
    wrapCopy = null;
    for (const block of carry) place(block, wrap);
    if (overflows()) current.parentElement?.classList.add('tall');
  }

  sheets.forEach((sheet, index) => {
    const folio = sheet.querySelector('.folio');
    if (folio) folio.textContent = `Page ${index + 1} of ${sheets.length}`;
  });
  for (const slot of Array.from(paper.querySelectorAll<HTMLElement>('[data-page-of]'))) {
    const target = document.getElementById(slot.dataset.pageOf ?? '');
    const sheet = target?.closest<HTMLElement>('.sheet');
    if (sheet) slot.textContent = String(sheets.indexOf(sheet) + 1);
  }
}

/**
 * The article as a printed document. It is a snapshot that outlives the day it was printed: the PDF of an article that
 * goes live first must not point at articles that are not live yet (a preview build, where it is printed, shows them all).
 * So the Related list (navigation, no use on paper) goes, links to other articles become plain text, and every other
 * link on the site becomes an absolute address, not the local one papyrus printed from. Off-site links keep their
 * address; their screen-reader notes go.
 */
function forPaper(paper: HTMLElement): void {
  paper.querySelector('.related')?.remove();
  // The "(opens in a new tab)" notes are for screen readers on a page; on paper they would just print
  for (const note of Array.from(paper.querySelectorAll('.sr-only'))) note.remove();
  const origin = new URL(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href).origin;
  for (const link of Array.from(paper.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'))) {
    const href = link.getAttribute('href') ?? '';
    if (/^\/papyrus\/[^/?#]/.test(href)) link.replaceWith(...Array.from(link.childNodes));
    else link.href = new URL(href, origin).href;
  }
}

const paper = document.querySelector<HTMLElement>('[data-paper]');
if (paper) {
  const original = paper.innerHTML;
  const wide = matchMedia(WIDE);
  // The PDF's page (`?print`) is a snapshot of the article on the day it goes live: a {{live:}} block stays only if its
  // target is live by then. A reader printing from the browser gets the page as it is today.
  const published = new URLSearchParams(location.search).has('print') ? (paper.dataset.published ?? '') : '';
  const layout = (): void => {
    try {
      const printing = inPrintMode();
      paper.innerHTML = printing && published ? dropLateLiveBlocks(original, published) : original;
      if (printing) forPaper(paper);
      if (wide.matches || printing) paginate(paper);
    } catch (error) {
      // Whatever went wrong, the reader gets the article as the server sent it
      console.error('paginate:', error);
      paper.innerHTML = original;
    } finally {
      document.documentElement.classList.remove('paginating');
    }
  };
  // Lay out once the web fonts are in, so the sheets break where they'll stay. Never wait longer than 1.5 s; a font
  // that arrives after that changes the text metrics, so lay out again then.
  const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
  const cap = new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1500));
  Promise.race([fontsReady.then(() => false), cap]).then((late) => {
    layout();
    if (late) fontsReady.then(layout);
  });
  wide.addEventListener('change', layout);

  // Print as A4, or Cmd/Ctrl+P: lay the sheets out as they print (code and tables wrap on paper, so they are taller than
  // on screen), and put the screen layout back when the dialog closes
  let enteredPrintMode = false;
  addEventListener('beforeprint', () => {
    if (inPrintMode()) return;
    enteredPrintMode = true;
    document.documentElement.classList.add(PRINT_MODE);
    layout();
  });
  addEventListener('afterprint', () => {
    if (!enteredPrintMode) return;
    enteredPrintMode = false;
    document.documentElement.classList.remove(PRINT_MODE);
    layout();
  });

  const print = document.querySelector<HTMLButtonElement>('[data-print]');
  if (print) {
    print.hidden = false;
    print.addEventListener('click', () => window.print());
  }
}
