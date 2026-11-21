---
title: "Fixture note: memory per session, measured"
description: "A fixture for the notes tests: a draft note with every field the schema knows, so the index, the feed and the sitemap checks have one to leave out."
h1: "Fixture note: how much memory a session takes"
mainKeyword: "fixture note memory"
kind: test
topic: claude
evidence: "Resident memory of 1, 3 and 6 sessions on a 16 GB Mac, read from the process list (fixture text, not a real test)."
tested:
  day: 2026-11-20
  claudeCode: "2.1.0"
  model: "Sonnet 5.5"
  os: "macOS 27.3"
repro: "https://github.com/n-uf/fixture-repro"
published: 2026-12-01
updated: 2026-12-01
draft: true
author: n-uf
takeaways:
  - "A fixture takeaway that is long enough to pass the schema's twenty characters."
  - "A second fixture takeaway, also long enough for the schema to accept it."
  - "A third fixture takeaway, so the list has the three entries the schema asks for."
faq:
  - q: "Is this a real note?"
    a: "No. It is a fixture for the notes tests, a draft note that carries every field the schema knows. It lives under scripts/fixtures, outside src/content, so no production or preview build of the site ever shows it as a page, lists it, or puts it in the feed."
  - q: "Why does a fixture note carry a FAQ?"
    a: "A note's FAQ is optional, but when it exists it holds three to five questions, each answered in forty to sixty words. The fixture therefore has three, so the schema test, the FAQ check and the page template all see a complete, valid example of the section and not a stub."
  - q: "What happens to this note on its date?"
    a: "Nothing, because it is never merged into src/content. A real draft note keeps its go-live day in published, and the daily publish workflow flips its draft line to false on that day. The publish tests copy this file into a scratch checkout to prove that the flip and its guard accept a note."
sources:
  - title: "A fixture source"
    url: "https://example.com/fixture-source"
    checked: 2026-11-20
related:
  - /notes
  - /papyrus
---

The body of the fixture note: one plain paragraph, so the file is a complete note and nothing more.
