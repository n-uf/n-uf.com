---
title: "Claude Code memory usage: RAM per session, measured"
description: "Claude Code memory usage on a 16 GB Mac: about 230 to 290 MB of RAM per idle session, what MCP servers add, and a script to measure your own."
h1: "Claude Code memory usage: RAM per session, measured"
mainKeyword: "claude code memory usage"
kind: test
topic: claude
evidence: "Memory of 7 open Claude Code sessions, 9 to 51 minutes old, on one 16 GB Mac: the process list read 6 times, 30 seconds apart, then 4 more times 29 minutes later."
tested:
  day: 2026-11-21
  claudeCode: "2.1.330 (desktop app), 2.1.326 (CLI)"
  model: "Opus 5.5 (6 sessions), one chat window not recorded"
  os: "macOS 27.3, Apple M1, 16 GB"
published: 2026-11-28
updated: 2026-11-28
draft: false
author: n-uf
takeaways:
  - "An idle Claude Code session took about 230 to 290 MB of RAM (RSS) on our 16 GB Mac. The one session running builds peaked at 920 MB."
  - "An MCP server runs as two small processes (npm and node) in every session that loads it: 25 to 80 MB together here. Builds and tests that Claude starts cost far more, but only while they run."
  - "On a Mac that is short of memory, an idle session's RSS shrinks and grows back as pages are compressed. Read the footprint and the swap as well."
  - "Over 29 minutes, the footprints of the claude processes changed by -10 to +73 MB. The busy session and the one taking the samples grew the most."
faq:
  - q: "How much RAM does a Claude Code session use?"
    a: "On our 16 GB Mac, an idle session used about 230 to 290 MB of RSS: the claude process plus its MCP server. The one session running builds reached 920 MB. The claude process alone had a macOS footprint of 200 to 340 MB. The sessions were under an hour old, and your MCP servers will change the numbers."
  - q: "How many Claude Code sessions can I run at once?"
    a: "Seven sessions here used about 2.5 GB, plus 1.6 to 1.9 GB for the desktop app, and the 16 GB Mac was already short of memory. At 300 MB per idle session, ten would take about 3 GB; that's arithmetic, not a measurement. Builds and dev servers cost more. Watch swap, not the session count."
  - q: "Why is Claude Code using so much memory?"
    a: "Look at what the session started. Here the big jumps came from builds, a headless browser and MCP servers, not from the claude process. Anthropic's docs warn when a session's heap passes 2.5 GB and say `/compact` frees memory. If memory stays high, `/heapdump` shows whether it sits in the JavaScript heap or in native memory."
  - q: "How do I reduce Claude Code RAM usage?"
    a: "Run `/compact`, or restart and run `claude --continue` to resume in a fresh process. Restart with `claude --safe-mode` to check whether a plugin, MCP server or hook is the cause. Load only the MCP servers a project needs, close sessions you aren't using, and don't run heavy builds in every session at once."
sources:
  - title: "Claude Code docs: Troubleshooting, High CPU or memory usage"
    url: "https://code.claude.com/docs/en/troubleshooting"
    checked: 2026-11-21
    supports: "the critical memory warning at 2.5 GB of heap, /compact, restart with claude --continue, claude --resume, claude --safe-mode, and what /heapdump writes and prints"
related:
  - /notes
  - /claude-machine-transfer
---

## The short answer

Claude Code memory usage on our 16 GB Mac: an idle session took about 230 to 290 MB of resident memory (RSS), counting the `claude` process and the MCP server it started. The one session running builds sat around 650 MB and peaked at 920 MB. All seven open sessions came to about 2.5 GB, roughly 15% of the Mac's memory.

Most of it is the `claude` process: 200 to 440 MB of RSS, or 200 to 340 MB of macOS footprint. An MCP server adds 25 to 80 MB. Builds and tests that Claude starts cost the most, but only while they run.

The sessions were young, 9 to 51 minutes old. Read these as numbers for a fresh session, not one that has been open all week.

## How we measured

Our Mac is an Apple M1 with 16 GB, on macOS 27.3. We measured the seven Claude Code sessions that were already open and didn't start, stop or change anything for the test. Six ran in the Claude desktop app: Claude Code 2.1.330, Opus 5.5 at high effort, as their command lines show. The seventh was a small chat window that keeps a `claude -p` process from the command-line install (2.1.326) open. Its model isn't on its command line, so we don't know it.

- We read `ps -Ao pid,ppid,rss,etime,%cpu,time,command` six times, 30 seconds apart: 2.5 minutes in all.
- A session is its `claude` process plus everything under it in the process tree: MCP servers, shells, builds. The sampling script itself is left out.
- At each sample we also ran `footprint <pid>` on every `claude` process. RSS is the pages in RAM right now. The footprint is the memory the process owns, compressed pages included.
- About 29 minutes later we read the same list four more times, 45 seconds apart.
- CPU use is the change in each process's CPU time between samples. At the median, a session using more than 5% of a core counts as busy here, 1% to 5% as light, and under 1% as idle.
- Sessions are lettered A to G, oldest first. We kept no names, paths or arguments.

What this can't tell you: it's one Mac, seven sessions and two windows of 2.5 and 2.25 minutes. Every session was young, 9 to 20 minutes old in the first pass and 38 to 51 in the second. Only A was really busy, so its numbers are one example, not a norm. B is the session that ran the measurement. And the Mac was short of memory the whole time, which pushes the RSS of idle processes down.

## Results

All sizes are MB. Total, `claude` process and children are RSS; the last column is the footprint of the `claude` process.

| Session | Kind | Age at start | State | Total, median (max) | `claude` process | Children | Footprint |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | Desktop | 20 min | Busy: builds running in children | 646 (920) | 439 | 200 | 337 |
| B | Desktop | 19 min | Light; took the samples | 386 (400) | 360 | 28 | 302 |
| C | Desktop | 19 min | Idle | 231 (400) | 205 | 26 | 276 |
| D | Chat window | 10 min | Idle | 133 (133) | 133 | 0 | 117 |
| E | Desktop | 9 min | Idle | 286 (363) | 206 | 81 | 204 |
| F | Desktop | 9 min | Light | 506 (537) | 411 | 95 | 287 |
| G | Desktop | 9 min | Idle | 292 (372) | 212 | 80 | 218 |

The idle sessions, C, E and G, took 231 to 292 MB each.

A was the only busy one, and the work was in its children: builds and checks that started and finished during the run. They held 200 MB at the median and 487 MB at the peak. That's one session, so take 650 to 920 MB as an example of a busy session, not a typical one.

The chat window, D, had no MCP server and was the smallest: 133 MB of RSS and 117 MB of footprint. Its `claude -p` process stays open and streams JSON in and out.

Together the seven came to 2.5 GB of RSS at the median and 2.9 GB at the peak. Their footprints added up to about 1.7 GB. On top of that, the desktop app's own processes held 1.6 to 1.9 GB. All the desktop sessions share it, and you don't have it if you only use the command line.

## What drives memory up

The `claude` process is a JavaScript process, and in a quiet session it's most of the cost: 200 to 340 MB of footprint here. Anthropic's docs say `/compact` frees memory, so the conversation is part of it, and they show a critical warning once a session's heap passes 2.5 GB. None of ours came close.

Each desktop session had one MCP server, started with `npm exec`. It shows up as two processes, `npm` and the `node` server under it, 25 to 80 MB together. Children of all kinds were 7% to 31% of a session's total. A server runs once in every session that loads it, so ten MCP servers across six sessions means sixty running servers.

Shells that Claude leaves open cost 1 to 3 MB each. Builds, test runs and dev servers cost far more, and they count against the session that started them. A's 920 MB peak came from its build.

Half an hour later, five of the seven sessions were still open (D and E had ended), now 38 to 51 minutes old. The footprints of their `claude` processes had moved by -10, +5, +14, +47 and +73 MB. A, the busy one, grew 47 MB. B, which was running the measurement, grew 73. The idle ones barely moved. That's nowhere near the 2.5 GB warning, but half an hour says nothing about a session that runs for days.

Children aren't always small. In the second pass B was running a headless Chrome for a screenshot check. Its children held 515 MB at the median and 830 MB at the peak, more than its own 388 MB `claude` process, and the session's total reached 1.3 GB.

### RSS moves on a Mac

On macOS the RSS of an idle process doesn't sit still, and this Mac was short of memory: under 0.8 GB free at every sample, 4.0 to 5.6 GB in the memory compressor, and about 1.2 GB written to swap between the two passes. Idle sessions lost pages to the compressor and got them back when touched. E's `claude` process went from 93 to 282 MB of RSS over six samples while its footprint stayed between 198 and 217 MB.

Half an hour later, four of the five `claude` processes had a lower RSS than before (F's fell from 411 to 282 MB), and every MCP server was down to 12 to 15 MB. Their footprints were within 10 MB of before, or higher. Read only RSS on a Mac under pressure and an idle session looks smaller than it is, and an old one looks as if it shrank.

## Measure your own sessions

This script prints one row per running Claude Code session: total RSS, the `claude` process, its children, the number of child processes and the age in minutes. It only reads: one `ps` call, and it prints no names, paths or arguments. We ran it on macOS. It uses nothing but `ps` and `awk`, but we haven't tried it on Linux.

```bash
#!/usr/bin/env bash
# Prints the resident memory (RSS) of each running Claude Code session: the claude process and everything it started.
# Read-only (one ps call). Prints no names, paths or arguments. Tested on macOS.
# Sessions are lettered A, B, C... from the oldest to the newest. Sizes are MB; age is in minutes.
ps -Ao pid=,ppid=,rss=,etime=,command= | awk '
function mins(t,   d, p, n, v) {            # etime "[[dd-]hh:]mm:ss" to minutes
  d = 0; if (index(t, "-")) { split(t, p, "-"); d = p[1]; t = p[2] }
  n = split(t, p, ":"); v = (n == 3) ? p[1] * 60 + p[2] : p[1]
  return d * 1440 + v
}
{
  pid = $1; parent[pid] = $2; mem[pid] = $3 / 1024; age[pid] = mins($4)
  cmd = $0; sub(/^ *[0-9]+ +[0-9]+ +[0-9]+ +[^ ]+ +/, "", cmd)
  if (cmd !~ /disclaimer/ && (cmd ~ /^(node |[^ ]*\/node )?([^ ]*\/)?claude( |$)/ || cmd ~ /^\/.*claude\.app\/Contents\/MacOS\/claude( |$)/)) main[pid] = 1
}
END {
  for (p in parent) {                       # walk up to the nearest claude process
    r = p
    while (!(r in main) && (r in parent) && r != 1) r = parent[r]
    if (r in main) { total[r] += mem[p]; if (p != r) { kids[r]++; kidmem[r] += mem[p] } }
  }
  n = 0; for (p in main) order[++n] = p
  for (i = 2; i <= n; i++) { v = order[i]; j = i - 1; while (j > 0 && age[order[j]] < age[v]) { order[j + 1] = order[j]; j-- } order[j + 1] = v }
  printf "%-8s %8s %8s %8s %9s %8s\n", "session", "total", "claude", "children", "processes", "age_min"
  for (i = 1; i <= n; i++) {
    p = order[i]
    printf "%-8s %8.0f %8.0f %8.0f %9d %8d\n", substr("ABCDEFGHIJKLMNOPQRSTUVWXYZ", i, 1), total[p], mem[p], kidmem[p], kids[p] + 0, age[p]
    sum += total[p]
  }
  printf "%-8s %8.0f\n", "all", sum
}'
```

Save it as `claude-ram.sh` and run it a few times, since RSS moves: `for i in 1 2 3; do bash claude-ram.sh; sleep 30; done`. On a Mac, `footprint <pid>` on one `claude` process shows the memory it owns, and `sysctl vm.swapusage` shows whether the Mac is swapping. Every process whose command is `claude` gets a row, so a one-off `claude -p` run shows up too. RSS counts shared pages once per process, so the total overstates what the Mac really uses.

## What to do about it

- Check swap first. On a Mac, `sysctl vm.swapusage` and the memory pressure graph in Activity Monitor tell you more than any one process. If swap is large and growing, too much is running, whatever each session reports.
- Compact or restart long sessions. Anthropic's docs suggest running `/compact` regularly, or restarting and running `claude --continue` to resume the conversation in a fresh process. The warning comes at 2.5 GB of heap.
- Rule out a plugin, MCP server or hook. The docs suggest restarting with `claude --safe-mode` to check whether one of them is the cause. If memory drops, add them back one at a time.
- Load only the MCP servers a project needs. Each one runs again in every session.
- Don't run heavy builds in every session at once. At its peak, the busy session's children alone (487 MB) took more than any idle session in total.
- Close sessions you aren't using. An idle one costs a few hundred MB, and `claude --resume` brings it back later.
- If memory stays high, run `/heapdump`. It prints whether the memory is in the JavaScript heap or in native memory, and writes two files to `~/Desktop`: a diagnostics file you can attach to an issue, and a heap snapshot. Don't share the snapshot. It holds your whole conversation and any credentials in the process.
