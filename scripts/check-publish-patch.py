#!/usr/bin/env python3
"""Check the patch the scheduled publish job hands over, BEFORE it is applied.

.github/workflows/publish.yml runs in two jobs. `build` (no secret) flips due drafts with scripts/publish-due.mjs,
builds the site and uploads the flip as `git diff` output plus a page list. `push` (holds the write deploy key, runs
no node) downloads both and runs this script on them first. The patch comes from a job that ran third-party code
(pnpm install and build scripts), so it is treated as untrusted: it is accepted only if it is exactly what
publish-due.mjs writes, a `draft: true` -> `draft: false` change on pages that already exist, and nothing else.

Ported from n-uf/cl_audit_home (scripts/check-publish-patch.py). The one change: any content collection counts, i.e.
any folder directly under src/content whose name is lowercase letters, digits and dashes (papyrus today), instead of
a fixed list of sections. Pages are `src/content/<collection>/<slug>.md`, one level deep.

Python 3 standard library only (no repo-installed tooling runs in the job that has the key).

    python3 -I scripts/check-publish-patch.py [--root <repo>] [--today YYYY-MM-DD] <patch-file> <pages-file>

  patch-file  `git diff --no-color` output of the flip
  pages-file  one `<collection>/<slug>` per line (what publish-due.mjs prints), e.g. `papyrus/html-to-pdf`
  --root      the checkout the patch will be applied to, a clean checkout of the commit the patch was made on
              (default: the current directory). If it is a git work tree the files are read from its HEAD, else
              from the files themselves (for tests).
  --today     the day to compare `published` with (default: today, UTC); for tests only, the workflow never sets it

Exit 0: the patch is acceptable; the commit message is the only line on stdout, `publish: papyrus/a, papyrus/b`
(the pages in the patch's order). Exit 1: refused, with the reason on stderr (`check-publish-patch: refused: ...`).
Exit 2: wrong usage or an unreadable input file.

The rules, all of which must hold:
  0. The patch and the page list are each smaller than 64 KB (65536 bytes), checked by size before they are read.
     Input the parser can't make sense of (an absurd number, say) is a refusal too, never a traceback.
  1. Every file in the patch is a plain modification (no new, deleted, renamed or copied file, no mode change, no
     binary patch) of an existing regular file src/content/<collection>/<slug>.md.
     Anything the parser does not know is refused.
  2. Each file has exactly one hunk, and the hunk removes exactly one line, a top-level `draft:` line whose value
     is true (true, True or TRUE, optional trailing comment), and adds exactly one line directly after it: the same
     line with the value written as `false`. The hunk has at least one context line (changed nothing), and may end
     with `\\ No newline at end of file` after a context line, nowhere else. The hunk must sit where its header says,
     in the HEAD version of the file, with the removed line inside the front matter (after its opening `---` and
     before its closing `---`), so a `draft: true` in the body, a code sample say, can't be flipped. That front
     matter has exactly one top-level `draft:` line (an indented one is another key's), and it is the changed one.
  3. The file's `published` day (a date, or a timestamp read as its UTC day, as publish-due.mjs reads it) is today
     (UTC) or earlier: nothing goes out early.
  4. The page list matches the files in the patch exactly, each page once.
"""
import datetime
import os
import re
import subprocess
import sys

MAX_PATCH_BYTES = 65536

# a content collection: a folder directly under src/content (publish-due.mjs uses the same two rules)
COLLECTION = r"[a-z0-9][a-z0-9-]*"
SLUG = r"[A-Za-z0-9][A-Za-z0-9_-]*"
PATH_RE = re.compile(r"^src/content/(%s)/(%s)\.md$" % (COLLECTION, SLUG))
PAGE_RE = re.compile(r"^(%s)/(%s)$" % (COLLECTION, SLUG))
INDEX_RE = re.compile(r"^index [0-9a-f]{7,64}\.\.[0-9a-f]{7,64} 100644$")
HUNK_RE = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?: .*)?$")
# the line publish-due.mjs flips: a top-level `draft:` key (optionally quoted), a true value, an optional comment
DRAFT_TRUE_RE = re.compile(r"""^(?P<key>(?P<q>["']?)draft(?P=q)[ \t]*:[ \t]+)(?P<value>true|True|TRUE)(?P<rest>(?:[ \t]+#.*)?[ \t]*\r?)$""")


class Refused(Exception):
    pass


def refuse(msg):
    raise Refused(msg)


def read_bytes(path):
    try:
        with open(path, "rb") as f:
            return f.read()
    except OSError as e:
        print("check-publish-patch: cannot read %s: %s" % (path, e.strerror), file=sys.stderr)
        sys.exit(2)


def read_input(path, what):
    """An input file (the patch or the page list), refused unless it is under MAX_PATCH_BYTES. The size is checked
    before anything is read, and the read itself stops one byte past the cap (the file could grow in between)."""
    try:
        size = os.path.getsize(path)
        if size >= MAX_PATCH_BYTES:
            refuse("the %s is %d bytes, too large to be a flip (the limit is %d)" % (what, size, MAX_PATCH_BYTES - 1))
        with open(path, "rb") as f:
            data = f.read(MAX_PATCH_BYTES)
    except OSError as e:
        print("check-publish-patch: cannot read %s: %s" % (path, e.strerror), file=sys.stderr)
        sys.exit(2)
    if len(data) >= MAX_PATCH_BYTES:
        refuse("the %s is %d bytes or more, too large to be a flip (the limit is %d)" % (what, MAX_PATCH_BYTES, MAX_PATCH_BYTES - 1))
    return data


def split_lines(data):
    """Lines without their `\\n`, byte for byte (latin1), so a CRLF file keeps its `\\r`; no phantom last line."""
    text = data.decode("latin1")
    if text == "":
        return []
    lines = text.split("\n")
    if lines[-1] == "":
        lines.pop()
    return lines


def parse_pages(data):
    text = data.decode("utf-8", "replace")
    if "\0" in text:
        refuse("the page list contains a NUL byte")
    lines = text.split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    pages = []
    for n, line in enumerate(lines, 1):
        if not PAGE_RE.match(line):
            refuse("page list line %d is not <collection>/<slug>: %r" % (n, line[:80]))
        if line in pages:
            refuse("page list names %s twice" % line)
        pages.append(line)
    if not pages:
        refuse("the page list is empty")
    return pages


def read_page(root, rel):
    """The bytes of an existing page: its HEAD version if root is a git work tree, else the file itself (tests)."""
    if os.path.exists(os.path.join(root, ".git")):
        def git(*args):
            try:
                return subprocess.run(["git", "-c", "core.hooksPath=/dev/null", "-C", root] + list(args), capture_output=True)
            except OSError as e:
                refuse("cannot run git to read HEAD:%s (%s)" % (rel, e.strerror))
        entry = git("ls-tree", "HEAD", "--", rel)
        if entry.returncode != 0 or not entry.stdout.startswith(b"100644 blob "):
            refuse("%s is not an existing regular file in HEAD of the checkout" % rel)
        shown = git("show", "HEAD:" + rel)
        if shown.returncode != 0:
            refuse("cannot read HEAD:%s" % rel)
        return shown.stdout
    path = os.path.join(root, rel)
    if os.path.islink(path) or not os.path.isfile(path):
        refuse("%s is not an existing regular file in the checkout" % rel)
    real_root = os.path.realpath(root)
    if os.path.commonpath([real_root, os.path.realpath(path)]) != real_root:
        refuse("%s resolves outside the checkout" % rel)
    return read_bytes(path)


def utc_day(raw):
    """The UTC day (YYYY-MM-DD) of a YAML date or timestamp value, as publish-due.mjs reads it; None if it is neither."""
    m = re.match(r"""^(["']?)(\d{4})-(\d{2})-(\d{2})(?:(?:[Tt]|[ \t]+)(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?[ \t]*(Z|z|[+-]\d{1,2}(?::?\d{2})?)?)?\1$""", raw)
    if not m:
        return None
    _, y, mo, d, hh, mi, ss, zone = m.groups()
    try:
        if hh is None:
            return datetime.date(int(y), int(mo), int(d)).isoformat()
        offset = datetime.timedelta(0)  # a timestamp with no zone is UTC in YAML
        if zone and zone not in ("Z", "z"):
            z = re.match(r"^([+-])(\d{1,2}):?(\d{2})?$", zone)
            offset = datetime.timedelta(hours=int(z.group(2)), minutes=int(z.group(3) or 0))
            if z.group(1) == "-":
                offset = -offset
        local = datetime.datetime(int(y), int(mo), int(d), int(hh), int(mi), int(ss or 0))
        return (local - offset).date().isoformat()
    except ValueError:
        return None


def page_info(root, rel):
    """(lines, close, published): the page's lines (byte for byte), the index of the `---` that closes its front
    matter, and its `published` day (UTC)."""
    lines = split_lines(read_page(root, rel))
    first = lines[0][3:] if lines and lines[0].startswith("\u00ef\u00bb\u00bf") else (lines[0] if lines else "")  # a UTF-8 BOM, read as latin1
    if not re.match(r"^---[ \t]*\r?$", first):
        refuse("%s has no front matter" % rel)
    close = next((i for i in range(1, len(lines)) if re.match(r"^---[ \t]*\r?$", lines[i])), None)
    if close is None:
        refuse("%s has no closing --- of its front matter" % rel)
    values = []
    for text in lines[1:close]:  # top-level keys only: an indented line belongs to another key's block
        m = re.match(r"""^(["']?)published\1[ \t]*:(?=[ \t]|$)(.*?)\r?$""", text)
        if m:
            values.append(re.match(r"^[ \t]*(.*?)(?:[ \t]+#.*)?[ \t]*$", m.group(2)).group(1))
    if len(values) != 1:
        refuse("%s has no published day" % rel if not values else "%s has more than one `published:` line" % rel)
    day = utc_day(values[0])
    if day is None:
        refuse("%s: can't read its published day %r" % (rel, values[0][:40]))
    return lines, close, day


def check_page(root, rel, old_side, at, old_start, today):
    """The hunk (old side = context and removed lines, the removed one at index `at`, starting at line `old_start`)
    must be exactly where it says in the page, with the removed line inside the front matter, and the page must be due."""
    lines, close, published = page_info(root, rel)
    start = old_start - 1
    if lines[start:start + len(old_side)] != old_side:
        refuse("%s: the hunk does not match the file in the checkout at line %d" % (rel, old_start))
    if not 0 < start + at < close:
        refuse("%s: the changed line (%d) is outside the front matter (lines 2-%d)" % (rel, start + at + 1, close))
    # exactly one top-level `draft:` line in the front matter (as publish-due reads it: an indented one belongs to
    # another key's block), and it is the changed one
    drafts = [k for k in range(1, close) if re.match(r"""^(["']?)draft\1[ \t]*:(?=[ \t]|$)""", lines[k])]
    if len(drafts) != 1:
        refuse("%s: the front matter has %d top-level `draft:` lines, a flip needs exactly one" % (rel, len(drafts)))
    if drafts[0] != start + at:
        refuse("%s: the changed line (%d) is not the front matter's `draft:` line (%d)" % (rel, start + at + 1, drafts[0] + 1))
    if published > today:
        refuse("%s isn't due: published %s is after today, %s (UTC)" % (rel, published, today))


def parse_patch(data, root, today):
    if b"\0" in data:
        refuse("the patch contains a NUL byte (binary content)")
    lines = split_lines(data)
    if not lines:
        refuse("the patch is empty")
    files = []  # (relative path, removed line)
    i, n = 0, len(lines)
    while i < n:
        # --- the file header: exactly diff --git, index (mode 100644), ---, +++
        m = re.match(r"^diff --git a/(\S+) b/(\S+)$", lines[i])
        if not m:
            refuse("line %d is not a plain `diff --git a/<path> b/<path>` header: %r" % (i + 1, lines[i][:80]))
        a, b = m.group(1), m.group(2)
        if a != b:
            refuse("line %d: a rename or copy (%s -> %s)" % (i + 1, a, b))
        if not PATH_RE.match(a):
            refuse("line %d: %s is not src/content/<collection>/<slug>.md" % (i + 1, a))
        if a in [f[0] for f in files]:
            refuse("%s appears twice in the patch" % a)
        i += 1
        if i >= n or not INDEX_RE.match(lines[i]):
            refuse("%s: expected an `index <hash>..<hash> 100644` line (a new, deleted, binary or mode-changed file is refused), got %r"
                   % (a, lines[i][:80] if i < n else "end of patch"))
        i += 1
        if i >= n or lines[i] != "--- a/" + a:
            refuse("%s: expected `--- a/%s`" % (a, a))
        i += 1
        if i >= n or lines[i] != "+++ b/" + a:
            refuse("%s: expected `+++ b/%s`" % (a, a))
        i += 1

        # --- exactly one hunk
        if i >= n:
            refuse("%s: no hunk" % a)
        h = HUNK_RE.match(lines[i])
        if not h:
            refuse("%s: line %d is not a hunk header: %r" % (a, i + 1, lines[i][:80]))
        # a flip hunk is a few lines near the top of the page: a long number is refused before int() reads it
        if any(g is not None and len(g) > 6 for g in h.groups()[:4]):
            refuse("%s: line %d: a hunk header with an absurd line number or count: %r" % (a, i + 1, lines[i][:80]))
        old_count = int(h.group(2)) if h.group(2) is not None else 1
        new_count = int(h.group(4)) if h.group(4) is not None else 1
        if int(h.group(1)) < 1:
            refuse("%s: line %d: the hunk starts at line 0 (a flip changes an existing line)" % (a, i + 1))
        i += 1
        seen_old = seen_new = 0
        old_side, removed_at = [], -1  # the context and removed lines, and where the removed one is
        removed, added, tags = [], [], []  # `tags`: the first character of every hunk line, in order
        prev = ""
        while (seen_old < old_count or seen_new < new_count) and i < n:
            line = lines[i]
            if line.startswith("\\ "):  # `\ No newline at end of file` in the middle of the hunk: never
                refuse("%s: line %d: a no-newline marker is only accepted as the last line of the hunk, after a context line" % (a, i + 1))
            tag, body = line[:1], line[1:]
            if tag == " ":
                seen_old += 1
                seen_new += 1
                old_side.append(body)
            elif tag == "-":
                seen_old += 1
                removed.append(body)
                removed_at = len(old_side)
                old_side.append(body)
            elif tag == "+":
                seen_new += 1
                added.append(body)
            else:
                refuse("%s: line %d is not a hunk line: %r" % (a, i + 1, line[:80]))
            prev = tag
            tags.append(tag)
            i += 1
        if seen_old != old_count or seen_new != new_count:
            refuse("%s: the hunk is shorter than its header says" % a)
        if i < n and lines[i].startswith("\\ "):  # a marker after the last hunk line: the only place it may be
            if prev != " " or lines[i] != "\\ No newline at end of file":
                refuse("%s: line %d: a no-newline marker is only accepted as the last line of the hunk, after a context line" % (a, i + 1))
            i += 1
        if " " not in tags:
            refuse("%s: the hunk has no context line (a flip always has the front matter's lines around it)" % a)
        if i < n and not lines[i].startswith("diff --git "):
            refuse("%s: more than one hunk, or text after the hunk (line %d: %r); a page has one `draft:` line" % (a, i + 1, lines[i][:80]))

        # --- the change itself: one `draft: true` line becomes the same line with `false`
        if len(removed) != 1 or len(added) != 1:
            refuse("%s: the hunk must remove exactly one line and add exactly one (removes %d, adds %d)" % (a, len(removed), len(added)))
        if "-+" not in "".join(tags):
            refuse("%s: the added line must come directly after the removed `draft:` line" % a)
        d = DRAFT_TRUE_RE.match(removed[0])
        if not d:
            refuse("%s: the removed line is not a `draft: true` line: %r" % (a, removed[0][:80]))
        expected = d.group("key") + "false" + d.group("rest")
        if added[0] != expected:
            refuse("%s: the added line must be %r, got %r" % (a, expected[:80], added[0][:80]))
        check_page(root, a, old_side, removed_at, int(h.group(1)), today)
        files.append((a, removed[0]))
    return [f[0] for f in files]


USAGE = "usage: check-publish-patch.py [--root <repo>] [--today YYYY-MM-DD] <patch-file> <pages-file>"


def main(argv):
    root = os.getcwd()
    today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    args = argv[1:]
    while args and args[0] in ("--root", "--today"):
        if len(args) < 2:
            print(USAGE, file=sys.stderr)
            return 2
        if args[0] == "--root":
            root = args[1]
        else:
            today = args[1]
        args = args[2:]
    if len(args) != 2 or any(a.startswith("--") for a in args) or not re.match(r"^\d{4}-\d{2}-\d{2}$", today):
        print(USAGE, file=sys.stderr)
        return 2
    patch_path, pages_path = args
    try:
        patch = read_input(patch_path, "patch")
        pages_raw = read_input(pages_path, "page list")
        pages = parse_pages(pages_raw)
        files = parse_patch(patch, root, today)
        from_patch = [re.sub(r"^src/content/", "", p)[:-3] for p in files]  # the patch's order
        if sorted(from_patch) != sorted(pages):
            refuse("the page list (%s) does not match the files in the patch (%s)" % (", ".join(sorted(pages)), ", ".join(sorted(from_patch))))
    except Refused as e:
        print("check-publish-patch: refused: %s" % e, file=sys.stderr)
        return 1
    except (ValueError, OverflowError, IndexError) as e:
        # input the rules above didn't foresee: still a refusal (exit 1), never a traceback
        print("check-publish-patch: refused: unreadable input (%s: %s)" % (type(e).__name__, str(e)[:120]), file=sys.stderr)
        return 1
    print("publish: " + ", ".join(from_patch))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
