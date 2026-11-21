---
title: "Fixture note: memory per session, measured"
description: "A fixture for the notes tests: a draft note with every field the schema knows, so the index, the feed and the sitemap checks have one to leave out."
h1: "Fixture note: how much memory a session takes"
mainKeyword: "fixture note memory"
kind: test
topic: claude
evidence: "Resident memory of 1, 3 and 6 sessions on a 16 GB Mac, read from the process list (fixture text, not a real test)."
tested: 2026-11-20
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
    a: "No. It is a fixture for scripts/notes.test.mjs and lives outside src/content, so no build ever shows it as a page."
sources:
  - title: "A fixture source"
    url: "https://example.com/fixture-source"
    checked: 2026-11-20
related:
  - /notes
  - /papyrus
---

The body of the fixture note: one plain paragraph, so the file is a complete note and nothing more.
