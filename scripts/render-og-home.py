#!/usr/bin/env python3
"""Renders the home share image public/og.png (1200x630): python3 scripts/render-og-home.py --font Geist.ttf --mono GeistMono.ttf  (needs Pillow)

The n-uf wordmark with the five coloured squares between n and uf, every project name from src/data/projects.ts (in
that order, each with an underline in the accent colour that repeats every five projects, like the home page), and the
tagline. One row of names when they fit, otherwise two centred rows (first row the longer one). After adding a project
to src/data/projects.ts run this again and commit the PNG; og.png stays the og:image and twitter:image in
src/layouts/Layout.astro (X, LinkedIn and Slack do not show SVG images).
The fonts are NOT in the repo and are only used here: Geist and Geist Mono variable fonts from Google Fonts (OFL),
e.g. https://github.com/google/fonts/raw/main/ofl/geist/Geist%5Bwght%5D.ttf and .../ofl/geistmono/GeistMono%5Bwght%5D.ttf
(the site itself ships them through @fontsource-variable/geist and geist-mono)."""
import argparse, math, os, re
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W, H = 1200, 630
SS = 2                          # drawn at 2x and scaled down, for smooth edges
BG = (10, 10, 12)               # --bg of the site
INK = (242, 242, 240)           # --ink
MUTED = (149, 149, 148)         # the tagline
ACCENTS = [(244, 114, 182), (251, 146, 60), (251, 191, 36), (52, 211, 153), (34, 211, 238)]   # --accent-0..4
TAGLINE = "Utilities for fun and for professional work."

SHIFT = -28                     # the whole block sits this far above where the seven-project image had it
WORD_SIZE, WORD_WEIGHT = 200, 800
N_INK_LEFT, UF_INK_LEFT, UF_INK_RIGHT, WORD_BASE = 395, 639, 823, 311 + SHIFT
SQ_X, SQ_Y, SQ_SIZE, SQ_PITCH, SQ_RADIUS = 516, 249 + SHIFT, 17, 21.06, 4
NAME_SIZE, NAME_WEIGHT, NAME_GAP = 28, 500, 40      # names at 28 px (12 px wider than the old 24 px), 40 px apart
NAME_BASE, ROW_PITCH = 395 + SHIFT + 28, 46         # baseline of the first row of names, distance between rows
UNDERLINE_OFFSET, UNDERLINE_H = 9, 2
TAG_SIZE, TAG_BASE_GAP = 22, 58                     # the tagline's baseline sits this far below the last row
MAX_ROW = 1080                  # a row of names wider than this splits (60 px side margins)

ap = argparse.ArgumentParser()
ap.add_argument("--font", required=True, help="Geist variable font (.ttf)")
ap.add_argument("--mono", required=True, help="Geist Mono variable font (.ttf)")
ap.add_argument("--out", default=os.path.join(ROOT, "public", "og.png"))
args = ap.parse_args()

src = open(os.path.join(ROOT, "src", "data", "projects.ts"), encoding="utf-8").read()
names = re.findall(r'^\s+name:\s*"([^"]+)"', src, re.M)
if not names:
    raise SystemExit("no project names found in src/data/projects.ts")


def font(path, size, weight):
    f = ImageFont.truetype(path, size * SS)
    f.set_variation_by_axes([weight])
    return f


def s(v):
    return round(v * SS)


img = Image.new("RGB", (W * SS, H * SS), BG)
d = ImageDraw.Draw(img)

# wordmark: placed by the ink of the glyphs, so the spacing is tuned in pixels, not in font metrics
word = font(args.font, WORD_SIZE, WORD_WEIGHT)


def ink_left(text):
    m = Image.new("L", (W * SS, H * SS), 0)
    ImageDraw.Draw(m).text((s(500), s(WORD_BASE)), text, font=word, fill=255, anchor="ls")
    return m.getbbox()[0] - s(500)


d.text((s(N_INK_LEFT) - ink_left("n"), s(WORD_BASE)), "n", font=word, fill=INK, anchor="ls")
# "uf": u and f spaced so that the pair's ink spans UF_INK_LEFT..UF_INK_RIGHT
f_mask = Image.new("L", (W * SS, H * SS), 0)
ImageDraw.Draw(f_mask).text((s(500), s(WORD_BASE)), "f", font=word, fill=255, anchor="ls")
f_x = s(UF_INK_RIGHT) - (f_mask.getbbox()[2] - s(500))
d.text((s(UF_INK_LEFT) - ink_left("u"), s(WORD_BASE)), "u", font=word, fill=INK, anchor="ls")
d.text((f_x, s(WORD_BASE)), "f", font=word, fill=INK, anchor="ls")

for i, c in enumerate(ACCENTS):
    x = SQ_X + i * SQ_PITCH
    d.rounded_rectangle([s(x), s(SQ_Y), s(x + SQ_SIZE) - 1, s(SQ_Y + SQ_SIZE) - 1], radius=s(SQ_RADIUS), fill=c)

# names, one or two centred rows
mono = font(args.mono, NAME_SIZE, NAME_WEIGHT)


def row_width(row):
    return sum(mono.getlength(n) for n in row) / SS + NAME_GAP * (len(row) - 1)


rows = [names]
if row_width(names) > MAX_ROW:
    k = math.ceil(len(names) / 2)
    rows = [names[:k], names[k:]]
    if max(row_width(r) for r in rows) > MAX_ROW:
        raise SystemExit("names do not fit in two rows; shrink NAME_SIZE")

idx = 0
for r, row in enumerate(rows):
    y = NAME_BASE + r * ROW_PITCH
    x = (W - row_width(row)) / 2
    for n in row:
        w = mono.getlength(n) / SS
        d.text((s(x), s(y)), n, font=mono, fill=INK, anchor="ls")
        d.rectangle([s(x), s(y + UNDERLINE_OFFSET), s(x + w) - 1, s(y + UNDERLINE_OFFSET + UNDERLINE_H) - 1], fill=ACCENTS[idx % 5])
        x += w + NAME_GAP
        idx += 1

tag = font(args.mono, TAG_SIZE, 400)
d.text((s(W / 2), s(NAME_BASE + (len(rows) - 1) * ROW_PITCH + TAG_BASE_GAP)), TAGLINE, font=tag, fill=MUTED, anchor="ms")

out = img.resize((W, H), Image.LANCZOS)
out.save(args.out, optimize=True)
print(f"{args.out}: {len(names)} projects in {len(rows)} row(s), {os.path.getsize(args.out)} bytes")
