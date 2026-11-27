---
title: "React stepper component for jobs and onboarding flows"
description: "A React stepper component from dynia: numbered pipeline steps in four states, todo, active, done and warn, with accessible labels, for jobs and onboarding."
h1: "React stepper component: a pipeline of four step states"
mainKeyword: "react stepper component"
kind: use-case
draft: false
published: 2026-11-27
updated: 2026-11-27
author: n-uf
takeaways:
  - "dynia's `Stepper` is a one-line pipeline: numbered steps from 01, joined by arrows, each in one of four states, `todo`, `active`, `done` or `warn`."
  - "Done steps turn green, the active one pulses cyan, and a step that needs attention turns magenta and stays still."
  - "It is a display: it takes `steps`, an accessible `label` and `wrap`, and no click handlers, so moving between steps is your app's job."
  - "It is accessible by default: an ordered list with a name, `aria-current=\"step\"` on the active step and a hidden state word after the others."
  - "The package is private and not installable yet; the stepper runs live on dynia.n-uf.com."
faq:
  - q: "What does dynia's React stepper component show?"
    a: "A pipeline in one line. Each step has a number from 01, a label and an optional short note such as 64%, and the steps are joined by arrows. Each step is in one of four states: `todo`, `active`, `done` or `warn`. The stepper draws the states your app gives it and does not move between steps itself."
  - q: "How do I mark the current step in a React stepper?"
    a: "Set that step's `state` to `\"active\"`. dynia draws it with a pulsing cyan dot and sets `aria-current=\"step\"` on it, so assistive technology knows where the job is. Earlier steps are `\"done\"`, which turns them green, and later ones stay `\"todo\"`. A step that is behind is `\"warn\"`."
  - q: "Is the dynia stepper accessible?"
    a: "Yes. It renders an ordered list whose accessible name is the `label` you pass, and the active step carries `aria-current=\"step\"`. After each other step it adds a visually hidden word: done, needs attention or to do. The arrows between steps are hidden from assistive technology, so a screen reader hears only the steps."
  - q: "Can the stepper handle clicks, back and next buttons or validation?"
    a: "No. `Stepper` takes only `steps`, `label` and `wrap`, with no click handlers, no back or next buttons and no step content. It shows progress. Your app owns the flow, its validation and its routing, and it passes the new states in when something changes."
  - q: "Where can I see the dynia stepper running?"
    a: "On dynia.n-uf.com. Its library's Pipeline and surfaces page shows the `Stepper` with live samples, its props and the code, built from dynia itself. The dynia package is private for now and not on a public registry, so you can't install it yet. The code on this page is the component's real API."
sources:
  - title: "dynia library: Pipeline and surfaces (dynia.n-uf.com/library/blocks/pipeline)"
    url: "https://dynia.n-uf.com/library/blocks/pipeline"
    checked: 2026-11-17
    supports: "a stepper for a job that runs in stages, and the cards and panel headers around it; live samples, props and code"
  - title: "dynia: Status (dynia.n-uf.com/dossier/status)"
    url: "https://dynia.n-uf.com/dossier/status"
    checked: 2026-11-17
    supports: "where dynia stands: its version and whether you can get it yet"
related:
  - /dynia
  - /dynia/react-dashboard-components
actions:
  - heading: "Watch a pipeline stepper run in a live library page"
    text: "dynia's library page for the pipeline shows the stepper in its states, with live samples, its props and the code. It is a live demo, and the package is private for now."
    label: "Open the stepper demo"
    href: "https://dynia.n-uf.com/library/blocks/pipeline"
---
A React stepper component shows where a job or a flow is: which steps are done, which one is running and which one needs attention. dynia's `Stepper` is a pipeline in one line, with numbered steps joined by arrows, each in one of four states: `todo`, `active`, `done` or `warn`. It draws the states your app gives it. Moving from step to step is your app's job.

dynia is private for now. The package `@n-uf/dynia` is not on a public registry, so you can't install it yet. The code below is its real API, and the [stepper on dynia.n-uf.com](https://dynia.n-uf.com/library/blocks/pipeline) runs live.

## What does the stepper show?

The steps of a pipeline, such as `01 upload → 02 detect → 03 review`, in a single line. Each step has a dot, a number, a label and, if you give one, a short note after it, such as `64%`. The state decides how it looks and what a screen reader hears:

| State | How it looks | What a screen reader adds |
| --- | --- | --- |
| `todo` | Plain, not yet reached | "(to do)" |
| `active` | The dot pulses cyan: running now | Marked as the current step |
| `done` | Turns green | "(done)" |
| `warn` | A still magenta dot and magenta text: behind or needs attention | "(needs attention)" |

`active` is the step in progress, and `warn` is for one that is behind.

## How do I add a React stepper component to my app?

Give `Stepper` a list of steps and a `label`, the accessible name of the list. Each step needs an `id`, a `label` and a `state`, and may have a `note`:

```tsx
import { Stepper, type DyniaStep } from "@n-uf/dynia";

const steps: DyniaStep[] = [
  { id: "upload", label: "upload", state: "done" },
  { id: "detect", label: "detect", state: "active", note: "64%" },
  { id: "review", label: "review", state: "todo" },
  { id: "export", label: "export", state: "todo" },
];

export function JobPipeline() {
  return <Stepper steps={steps} label="Document pipeline" />;
}
```

The numbers are drawn for you: `01`, `02`, and so on, in the order of the array.

## A React stepper component example, driven by app state

Derive the steps from whatever tracks your flow. Here the flow is one number, the index of the current step:

```tsx
const names = ["upload", "detect", "review", "export"];

function stepsFor(current: number): DyniaStep[] {
  return names.map((label, index) => ({
    id: label,
    label,
    state: index < current ? "done" : index === current ? "active" : "todo",
  }));
}

<Stepper steps={stepsFor(job.stage)} label="Document pipeline" />
```

When the job moves on, `stage` changes, `stepsFor` returns new states and the stepper redraws. For a job that reports progress, put it in `note`, such as `note: "64%"`.

## How do I mark a step that is behind?

Use `warn`. It gives the step a magenta dot and magenta text without a pulse, and a screen reader hears "(needs attention)" after it:

```tsx
{ id: "review", label: "review", state: "warn", note: "2 days" }
```

An onboarding flow can use it for a step that is overdue or needs the user's attention, while the active step is the one they are on now.

## Do I need to add a stylesheet?

A shell renders dynia's stylesheet itself, and `DyniaDashboard` is one. A primitive on its own, such as `Stepper`, needs the stylesheet rendered once, the way dynia's own small-screen example does it: `DyniaStyles` inside a `dy-canvas` element with the dynia variables:

```tsx
import { DyniaStyles, Stepper } from "@n-uf/dynia/primitives";
import { dyniaVars } from "@n-uf/dynia/tokens";

<div className="dy-canvas" style={dyniaVars({ radius: 0 })}>
  <DyniaStyles />
  <Stepper steps={steps} label="Document pipeline" />
</div>
```

The styles are scoped and self-contained, so there is no Tailwind setup. In a Next.js app, list `@n-uf/dynia` and `@n-uf/angiospermae` in `transpilePackages`, because the package ships TypeScript source.

## What goes in a step's label and its note?

The `label` is the step's name, such as `upload` or `detect`, and it is drawn after the number. The `note` is a short readout after the label, such as `23` or `64%`, for a count or a progress value. Keep both short, because the whole pipeline sits on one line. A step with no `note` draws none.

## Can the stepper fit a narrow screen?

By default, `Stepper` stays on one line and clips what doesn't fit. Pass `wrap` to let the steps wrap onto more lines instead:

```tsx
<Stepper steps={steps} label="Document pipeline" wrap />
```

In the dashboard header, the stepper already wraps.

## Does the dashboard shell have a stepper?

Yes. `DyniaDashboard` takes `steps` for a pipeline in its header, and `stepsLabel` for the accessible name, which defaults to "Pipeline". It is the same stepper, with `wrap` on, next to the breadcrumb and the actions. See the guide to [React dashboard components](/dynia/react-dashboard-components) for the shell and the blocks that go under it.

## Is it a form wizard?

No. `Stepper` is a display. It takes `steps`, `label` and `wrap`, and there are no click handlers, no back and next buttons and no step content. If your flow needs validation, routing between steps or clickable steps, you write that, and the stepper shows the result. That keeps it small, and it means the same component works for a job that runs by itself, such as a document pipeline, and for an onboarding flow a person moves through.

The package is private, so you can read this page and try the demo, but you can't install it yet. Every guide to the kit is listed on the [dynia guides](/dynia) page. The sister kits have their own: [harbuz's guides](/harbuz) and [kavun's guides](/kavun).
