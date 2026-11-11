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
import argparse, glob, os, re
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
# names a line break would split ("Claude" / "Code"); a no-break space holds them together
KEEP_TOGETHER = ["Claude Code", "US Letter", "React PDF"]

ap = argparse.ArgumentParser()
ap.add_argument("--font", required=True)
ap.add_argument("--only", nargs="*", default=[], help="slugs to render; default all")
args = ap.parse_args()


def font(size, wght):
    f = ImageFont.truetype(args.font, size, layout_engine=ImageFont.Layout.RAQM)
    f.set_variation_by_axes([14, wght])
    return f


def front_matter_value(src, key):
    m = re.match(r"---\r?\n(.*?)\r?\n---", src, re.S)
    if not m:
        return None
    line = re.search(rf"^{key}:[ \t]*(.*?)[ \t]*$", m.group(1), re.M)
    if not line:
        return None
    v = line.group(1)
    if v.startswith('"') and v.endswith('"') and len(v) >= 2:
        return v[1:-1].replace('\\"', '"').replace("\\\\", "\\")
    if v.startswith("'") and v.endswith("'") and len(v) >= 2:
        return v[1:-1].replace("''", "'")
    return v


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
for key, project in PROJECTS.items():
    for md in sorted(glob.glob(os.path.join(ROOT, "src/content", key, "*.md"))):
        slug = os.path.splitext(os.path.basename(md))[0]
        if args.only and slug not in args.only:
            continue
        h1 = front_matter_value(open(md, encoding="utf-8").read(), "h1")
        if not h1:
            print("skipped (no h1):", md)
            continue
        out, size, n = card(project, h1)
        folder = os.path.join(ROOT, "public/og", key)
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, f"{slug}.png")
        out.save(path, optimize=True)
        made += 1
        print(f"wrote public/og/{key}/{slug}.png  {os.path.getsize(path) // 1024} KB  {size}px x{n}")
if made == 0:
    print("no articles, nothing to render")
