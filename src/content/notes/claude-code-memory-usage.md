---
title: "Claude Code memory usage: RAM per session, measured"
description: "Claude Code memory usage on a 16 GB Mac: about 230 to 290 MB of RAM per idle session, what MCP servers add, and a script to measure your own."
h1: "Claude Code memory usage: RAM per session, measured"
mainKeyword: "claude code memory usage"
kind: test
topic: claude
evidence: "Memory of 7 running Claude Code sessions on one 16 GB Mac, read from the process list 6 times, 30 seconds apart, and 4 more times 29 minutes later."
tested:
  day: 2026-11-21
  claudeCode: "2.1.330 (desktop app), 2.1.326 (CLI)"
  model: "Opus 5.5 (6 sessions), one chat window not recorded"
  os: "macOS 27.3, Apple M1, 16 GB"
published: 2026-11-28
updated: 2026-11-28
draft: true
author: n-uf
takeaways:
  - "An idle Claude Code session took about 230 to 290 MB of RAM (RSS) here. The one session that was running builds peaked at 920 MB."
  - "An MCP server adds one small process per session, 25 to 80 MB here. The builds and tests Claude starts add far more, but only while they run."
  - "On macOS the RSS of an idle session shrinks and grows back as pages are compressed, so also read the footprint and the swap use."
  - "Over 29 minutes the footprint of a session's claude process changed by -10 to +73 MB; the sessions that did work grew the most."
faq:
  - q: "How much RAM does a Claude Code session use?"
    a: "On a 16 GB Mac, an idle session used about 230 to 290 MB of resident memory, counting the claude process and its MCP server. A session running builds reached 920 MB. The claude process alone had a macOS footprint of 200 to 340 MB. Your numbers depend on your MCP servers and on what Claude runs."
  - q: "How many Claude Code sessions can I run at once?"
    a: "Memory alone allows many. Seven sessions here used about 2.5 GB of a 16 GB Mac. At 300 MB per idle session, ten would take about 3 GB; that is arithmetic, not a measurement. The limit is usually what the sessions start, such as builds and dev servers. Watch swap use, not the session count."
  - q: "Why is Claude Code using so much memory?"
    a: "Three things stand out: one long conversation in one process, MCP servers and hooks that start their own processes, and builds or tests that Claude starts. Anthropic's docs show a warning when a session's heap passes 2.5 GB. Run `/heapdump` to see whether the memory is in the JavaScript heap or in native memory."
  - q: "How do I reduce Claude Code RAM usage?"
    a: "Run `/compact` to shrink the context, or restart with `claude --continue` to resume in a fresh process. Start `claude --safe-mode` to check whether a plugin, an MCP server or a hook is the cause. Close sessions you are not using, and run heavy builds one at a time instead of in every session."
sources:
  - title: "Claude Code docs: Troubleshooting, High CPU or memory usage"
    url: "https://code.claude.com/docs/en/troubleshooting"
    checked: 2026-11-21
    supports: "the critical memory warning at 2.5 GB of heap, /compact, restart with claude --continue, claude --safe-mode, and what /heapdump writes"
related:
  - /notes
  - /claude-machine-transfer
---

## The short answer

An idle Claude Code session took about 230 to 290 MB of resident memory (RSS) on a 16 GB Mac. That counts the `claude` process and the MCP server it started. The one session that was running builds used about 650 MB and peaked at 920 MB. Seven sessions together used about 2.5 GB, which is 15% of the Mac's memory.

The `claude` process alone is the larger part: 200 to 440 MB of RSS, and a macOS memory footprint of 200 to 340 MB. An MCP server adds 25 to 80 MB. Processes that Claude starts for a task, such as builds and tests, add the most, but only while they run.

## How it was measured

The Mac is an Apple M1 with 16 GB of memory, running macOS 27.3. Seven Claude Code sessions were already running, and nothing was started, stopped or changed for the test: six sessions in the Claude desktop app (Claude Code 2.1.330, Opus 5.5 at high effort, from their command lines) and one small chat window that runs `claude -p` from the command-line version (2.1.326). The chat window's model is not recorded.

- **Process list.** `ps -Ao pid,ppid,rss,etime,%cpu,time,command` was read 6 times, 30 seconds apart, so the run covers 2.5 minutes.
- **Sessions.** Each session is its `claude` process plus every child found by walking the parent process id (ppid) tree: MCP servers, shells and anything else it started. The tool that took the samples is left out.
- **Footprint.** `footprint <pid>` was read for each `claude` process at every sample. RSS counts the pages that are in RAM right now; the footprint is the memory the process owns, compressed pages included.
- **Second pass.** The same read was repeated 4 times, 45 seconds apart, about 29 minutes after the first run, to see what half an hour does to the same sessions.
- **Busy or idle.** CPU use comes from the change in each process's cumulative CPU time between samples. A session whose processes together used more than 5% of a core at the median was called busy.
- **Labels.** Sessions are lettered A to G, oldest first. Names, paths and command arguments are not kept in this note.

Two limits to keep in mind. This is one Mac, seven sessions and 2.5 minutes. And every session was young: all seven started 9 to 20 minutes before the first sample, because the apps had been restarted shortly before. So the run says little about very long sessions.

## Results

Sizes are in MB. The three middle size columns are RSS; the last one is the footprint of the `claude` process.

| Session | Kind | Age at start | State | Total, median (max) | `claude` process | Children | Footprint |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | Desktop | 20 min | Busy: builds running in children | 646 (920) | 439 | 200 | 337 |
| B | Desktop | 19 min | Active: took the samples | 386 (400) | 360 | 28 | 302 |
| C | Desktop | 19 min | Idle | 231 (400) | 205 | 26 | 276 |
| D | Chat window | 10 min | Idle | 133 (133) | 133 | 0 | 117 |
| E | Desktop | 9 min | Idle | 286 (363) | 206 | 81 | 204 |
| F | Desktop | 9 min | Light | 506 (537) | 411 | 95 | 287 |
| G | Desktop | 9 min | Idle | 292 (372) | 212 | 80 | 218 |

What the numbers say:

- **Idle.** Sessions C, E and G, where the `claude` process used under 1% of a core, took 231 to 292 MB in total.
- **Busy.** Only A was clearly busy, and the work was in its children: builds and checks that came and went. Its children held 200 MB at the median and 487 MB at the peak. This is one session, so treat 650 to 920 MB as an example, not a typical value.
- **Chat window.** The one-shot `claude -p` process with no MCP server was the smallest: 133 MB of RSS, 117 MB of footprint.
- **All sessions.** The seven sessions added up to 2.5 GB of RSS at the median (2.9 GB at the peak), out of 16 GB. Their footprints added up to about 1.7 GB.
- **The desktop app.** The Claude desktop app's own processes held another 1.6 to 1.9 GB of RSS during the run. That is shared by all desktop sessions and is not part of any one of them. A command-line user does not have it.

## What drives memory up

**The session itself.** The `claude` process is a JavaScript process, and it is most of a quiet session: 200 to 340 MB of footprint here. It grows with the conversation, and Anthropic's docs say a critical warning appears when a session's heap passes 2.5 GB.

**MCP servers.** Each desktop session had one MCP server, started through `npm exec`. It showed up as two small processes, 25 to 80 MB together. Children were 7% to 31% of a session's total. Every additional server is another process in every session that loads it, so ten MCP servers in six sessions are sixty server processes, not ten.

**What Claude runs.** Shells that stay open cost 2 to 3 MB each. Builds, test runs and dev servers cost far more, and they belong to the session that started them. Session A's peak came from these.

**Long sessions.** A second pass of 4 samples, 45 seconds apart, ran about 29 minutes after the first. Five of the seven sessions were still running; two had ended. Those five were now 38 to 51 minutes old. The footprint of their `claude` processes changed by -10, +5, +14, +47 and +73 MB. The two sessions that had been doing the work grew the most, and the idle ones stayed nearly flat. That is a small growth over half an hour, and nowhere near the 2.5 GB warning. It is too short to say how fast a session grows over days.

**A browser is a child too.** In the second pass, session B had a browser running as a child. Its children held 515 MB at the median and 830 MB at the peak, more than the 388 MB `claude` process itself, and the session's total reached 1.3 GB. Children are not always small.

**Compression hides memory.** On macOS, RSS is not a steady number for an idle process. The Mac was short on memory: it had about 2.4 GB of its 3 GB swap in use and its memory compressor held 4.0 to 5.6 GB. Idle sessions lost pages to compression, and gained them back when touched. Session E's `claude` process went from 93 MB to 282 MB of RSS over the six samples while its footprint stayed between 198 and 217 MB. The second pass showed the same thing across time: the RSS of four of the five `claude` processes was lower than half an hour earlier (one went from 411 to 282 MB), while their footprints were flat or higher. If you read only RSS on a busy Mac, an idle session can look much smaller than it is, and an old one can look as if it shrank.

## Measure your own sessions

The script below prints one row per running Claude Code session: total RSS, the `claude` process, its children, the number of processes and the age in minutes. It is read-only, runs one `ps` call and prints no names, paths or arguments. It works on macOS and Linux.

```bash
#!/usr/bin/env bash
# Prints the resident memory (RSS) of each running Claude Code session: the claude process and everything it started.
# Read-only (one ps call). Prints no names, paths or arguments. Works on macOS and Linux.
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

Save it as `claude-ram.sh`, run `bash claude-ram.sh`, and repeat it a few times, for example `for i in 1 2 3; do bash claude-ram.sh; sleep 30; done`, because RSS moves. On a Mac, add `footprint <pid>` for one `claude` process to see the memory it owns, and `sysctl vm.swapusage` to see whether the Mac is swapping. The script counts every process whose command is `claude`, so a one-off `claude -p` run shows up as its own row. The totals add up RSS, which counts shared pages more than once, so the sum overstates what the Mac really uses.

## What to do about it

- **Check the swap first.** On a Mac, `sysctl vm.swapusage` and Activity Monitor's memory pressure graph say more than any one process. If swap is large and growing, you have too much running, whatever each session reports.
- **Compact or restart long sessions.** Anthropic's docs suggest `/compact` regularly, and restarting and running `claude --continue` to resume the conversation in a fresh process. They put the warning at 2.5 GB of heap.
- **Test for a heavy plugin, MCP server or hook.** `claude --safe-mode` starts without them. If memory drops, add them back one at a time.
- **Load only the MCP servers a project needs.** Each one is a process in every session that loads it.
- **Do not run heavy builds in every session at once.** In these results, the children of one busy session cost more than the sessions that were idle.
- **Close sessions you are not using.** An idle session costs a few hundred MB. You can resume it later with `claude --resume`.
- **If memory stays high, run `/heapdump`.** It prints whether the memory is in the JavaScript heap or in native memory, and writes a diagnostics file you can attach to an issue. Do not share the heap snapshot itself, because it holds your whole conversation.
