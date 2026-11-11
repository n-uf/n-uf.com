#!/usr/bin/env python3
"""Renders a share image (og:image, 1200x630) for every article: public/og/<project>/<slug>.png.

  python3 scripts/render-og-pages.py --font /path/to/Inter-variable.ttf [--only slug ...]
  (needs Pillow with raqm)

Same dark page as public/og.png: the article's h1 in white, the project's name above it, the five colours of the n-uf
mark and the address below. Nothing else, no picture. The font is NOT in the repo and is not shipped to the browser:
Inter's variable font from Google Fonts (OFL, axes opsz + wght) is only used here to draw the cards.
Cards are drawn for drafts too (a draft's card ships before its date, which the site accepts).
Run it again after changing an article's h1, then commit the PNG with the article.

To give another project its own articles, add it to PROJECTS (its collection folder under src/content)."""
import argparse, glob, os, re, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W, H = 1200, 630
BG = (10, 10, 12)               # --bg of the site
INK = (242, 242, 240)           # --ink
MUTED = (140, 140, 138)         # --muted over the background
DOTS = [(244, 114, 182), (251, 146, 60), (251, 191, 36), (52, 211, 153), (34, 211, 238)]   # --accent-0..4
# the project's name as written (lower case), and its address on the card
PROJECTS = {"papyrus": {"name": "papyrus", "address": "n-uf.com/papyrus"}}
NBSP = " "
# names a line break must not split; a no-break space holds a name that has a space in it. The wrap splits only at plain
# spaces, so "papyrus" and "n-uf.com" are already whole; add a name with a space here when an h1 needs one.
KEEP_TOGETHER = ["papyrus", "n-uf.com"]

ap = argparse.ArgumentParser()
ap.add_argument("--font", required=True)
ap.add_argument("--only", nargs="*", default=[], help="slugs to render; default all")
args = ap.parse_args()


def font(size, wght):
    f = ImageFont.truetype(args.font, size, layout_engine=ImageFont.Layout.RAQM)
    f.set_variation_by_axes([14, wght])
    return f


def front_matter_h1(src):
    """The h1 of an article: a single-line plain or quoted value. Raises ValueError (with the reason) for anything
    else: no front matter, no h1, a folded or literal block (`>-`, `|`), a value that continues on the next line."""
    m = re.match(r"﻿?---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|$)", src, re.S)
    if not m:
        raise ValueError("no front matter")
    lines = m.group(1).split("\n")
    for i, raw in enumerate(lines):
        line = raw.rstrip("\r")
        found = re.match(r"""^(["']?)h1\1[ \t]*:(?:[ \t]+(.*?))?[ \t]*$""", line)
        if not found:
            continue
        v = found.group(2) or ""
        if v == "" or v[0] in ">|&*![{":
            raise ValueError(f"h1 must be one line of plain or quoted text, got `{line.strip()}`")
        if i + 1 < len(lines) and lines[i + 1][:1] in (" ", "\t") and lines[i + 1].strip():
            raise ValueError("h1 continues on the next line; write it on one line")
        if v[0] == '"':
            q = re.match(r'^"((?:[^"\\]|\\.)*)"[ \t]*(?:#.*)?$', v)
            if not q:
                raise ValueError(f"can't read the quoted h1 `{v}`")
            return re.sub(r'\\(["\\])', r"\1", q.group(1))   # one pass, so \\" is a backslash and then the end
        if v[0] == "'":
            q = re.match(r"^'((?:[^']|'')*)'[ \t]*(?:#.*)?$", v)
            if not q:
                raise ValueError(f"can't read the quoted h1 `{v}`")
            return q.group(1).replace("''", "'")
        return re.sub(r"[ \t]+#.*$", "", v).strip()
    raise ValueError("no h1")


def wrap(text, f, width):
    for name in KEEP_TOGETHER:
        text = text.replace(name, name.replace(" ", NBSP))
    lines, line = [], ""
    for word in text.split(" "):   # plain spaces only, so a no-break space holds
        trial = f"{line} {word}".strip()
        if f.getlength(trial) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    # no single word alone on the last line: take the word before it along, if that still fits
    if len(lines) > 1 and " " not in lines[-1] and " " in lines[-2]:
        head, moved = lines[-2].rsplit(" ", 1)
        if f.getlength(f"{moved} {lines[-1]}") <= width:
            lines[-2:] = [head, f"{moved} {lines[-1]}"]
    return [l.replace(NBSP, " ") for l in lines]   # draw the no-break space as a plain one (same width)


def card(project, h1):
    out = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(out)
    left, width = 80, 1040
    # the project's name, then the article's h1
    d.text((left, 110), project["name"], font=font(30, 600), fill=MUTED, anchor="ls")
    size = 80
    while True:
        f = font(size, 700)
        lines = wrap(h1, f, width)
        if (len(lines) <= 4 and max(f.getlength(l) for l in lines) <= width) or size <= 44:
            break
        size -= 2
    y = 110 + 40 + size
    for line in lines:
        d.text((left, y), line, font=f, fill=INK, anchor="ls")
        y += round(size * 1.16)
    # the five colours of the n-uf mark, then the address
    for i, color in enumerate(DOTS):
        x = left + i * 26
        d.rounded_rectangle((x, 552, x + 18, 570), radius=4, fill=color)
    d.text((left + 5 * 26 + 14, 570), project["address"], font=font(26, 500), fill=MUTED, anchor="ls")
    return out, size, len(lines)


made = 0
skipped = []
for key, project in PROJECTS.items():
    for md in sorted(glob.glob(os.path.join(ROOT, "src/content", key, "*.md"))):
        slug = os.path.splitext(os.path.basename(md))[0]
        if args.only and slug not in args.only:
            continue
        try:
            h1 = front_matter_h1(open(md, encoding="utf-8").read())
        except ValueError as why:
            skipped.append(f"{os.path.relpath(md, ROOT)}: {why}")
            continue
        out, size, n = card(project, h1)
        folder = os.path.join(ROOT, "public/og", key)
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, f"{slug}.png")
        out.save(path, optimize=True)
        made += 1
        print(f"wrote public/og/{key}/{slug}.png  {os.path.getsize(path) // 1024} KB  {size}px x{n}")
if skipped:
    print("skipped, no card drawn:")
    for line in skipped:
        print("  " + line)
    sys.exit(1)
if made == 0:
    print("no articles, nothing to render")
