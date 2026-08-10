# Storyworld redesign — progress and what's left

Tracks the implementation of the **Classical** redesign (warm dark ground,
editorial serif, gold accent applied as stroke). The design reference lives in
the Claude Design project `Storyworld Redesign.dc.html`; its handoff document
names each screen by a stable id (`1b`, `3a`, `7a`…) and those ids are used
here.

The handoff is a static HTML prototype, not production code. Where it and this
codebase disagree, the decisions taken are recorded below.

## Done — step 1b, the editor shell

The foundation every other screen is drawn inside.

- **Dark-only tokens** in `src/styles/theme.css`, expressed as ground *roles*
  (`canvas` → `app` → `chrome` → `panel` → `raised` → `selected` → `float`)
  rather than shades. Light mode and every `prefers-color-scheme` block are
  gone.
- **Cormorant Garamond + Lora**, replacing Cinzel and an Inter that was loaded
  but never referenced. Radius ramp retuned to 3/4/7px.
- **Menu bar** — wordmark, story title, Play. The wordmark *is* the File/Story
  menu, since the design draws no menu row and those actions had nowhere else
  to live.
- **Navigation rail** (150px) driven by a single `activeWorkspace` value, which
  replaced seven mutually-exclusive booleans and ~150 lines of reset
  boilerplate.
- **Canvas** — 24px dot grid via React Flow's own `<Background>`, a
  three-control floating toolbar, page nodes as the design's card with kicker
  and dashed borders for plot pages, hairline edges with pill labels.
- **Inspector** (400px, persistent) — Write / Choices / Logic / Settings,
  replacing a bottom drawer that covered the canvas. Story-level summary at
  rest. `Play from here` works.
- **Primitives** restyled onto the palette; `MenuBar` and `Tabs` deleted as
  dead. New components (wordmark menu, dialog, inspector tabs) are on Radix.

## Next

Roughly in dependency order.

1. **⌘K command palette** — pages, full-text matches over paragraphs, and
   actions. Needs a page index and a text index. The `⌘K` chip is deliberately
   *not* rendered until this works. Add `'palette'` to `EditorDialog`.
2. **`3a` Data workspace** — fold the six modal managers into one workspace
   behind the rail. Retires `ExpandableBottomPanel` and `SidePanel`, still used
   by six managers. **This also removes a real trap**: the Audio manager is a
   true modal that covers the rail, so while it is open the rail — the
   navigation model — cannot be reached. Escape now backs out of any workspace,
   which patches it, but the modal should not be covering the rail at all.
3. **`3b` Logic as sentences** — replace the drag-and-drop `LogicTreeBuilder`
   with prose and a searchable rule picker. Same data model (`events[]` with
   `logicTree`); presentation only. Likely retires `react-arborist`.
4. **`3c` Choice-first branching** — `⌘⏎` in a choice creates and links a page;
   dashed `NEW · UNWRITTEN` node; undo toast. The Choices tab already has the
   structure and both buttons.
5. **`4b` Story health** — pure derivation over existing state: unreachable
   pages, dead ends, unconnected choices, unused items/variables/audio/
   atmospheres. Add `'health'` to `EditorWorkspace`.
6. **`4a` Dashboard** and **`4c` Atmospheres & audio**.
7. **Schema work** (each needs a `CURRENT_VERSION` bump, a migration and a
   migration test, per `claude.md`):
   - `5d` per-entry visibility conditions on status data
   - `5a`/`6a` contextual text as first-class shared entries
   - `7a` **Derived text** — a new capability; inline token plus reusable
     entries
8. **Player pass** — `2c` two-column reading view, `6b` bare end-of-story.
9. **`5c` Subplots as lanes**, which changes how `FlowView` positions nodes and
   replaces portal nodes with labelled crossing cards.
10. **`6c` History & export**, **`6d` shortcut sheet**.

## Deferred, with reasons

- **Rail items `Outline` and `Text search`** — in the design, absent from the
  codebase. The rail lists only places you can actually go, so they were left
  out rather than shipped disabled. Add to `RAIL_SECTIONS` when built.
- **Headless-layer migration to Radix.** `Combobox` has ten call sites, six of
  them logic pickers where type-to-filter is the point, and Radix has no
  combobox primitive. `Popover` has six call sites that anchor to coordinates
  from a text selection, against Radix's anchor-first API — including the
  rich-text editor's selection popovers and the player's. Both keep their
  current libraries (`@headlessui/react`, `@floating-ui/react`) and were
  restyled in place. This wants its own step with its own testing.
- **Visual regression** via the installed Playwright runner — worth having once
  the design stops moving; against a design mid-implementation it is a
  snapshot-churn machine.
- **Story health count badge** on the rail — arrives with `4b`.

## Known rot, not yet addressed

- `src/lib/storyMapper.test.ts` has **one failing test**, and it failed before
  this work started: the fixture does not expect the `atmosphereId` and
  `events` keys that `syncSyntheticNodes` now writes onto nodes. Either the
  fixture or the sync is wrong; deciding which is a separate question.
- The **Audio manager** still holds hardcoded light-theme colours, including a
  canvas waveform painted `#6366f1`. It is restyled with `3a`.
- `src/components/ui/SidePanel/index.ts` is a **barrel file**, which
  `claude.md` forbids. It goes when `SidePanel` does.
- `FloatingEdge` has two **React Compiler memoization** lint errors on a
  pre-existing `useMemo` whose manual dependency list cannot be preserved.
- `Input` generates its id with **`Math.random()`** in render, which the purity
  lint rightly objects to; `useId` is the fix.

## Conventions this work established

Recorded in `claude.md`, but worth restating:

- Backgrounds are chosen by **role**, not by how dark they look.
- The accent is a **stroke** — border, text, tint. Solid gold fills are
  reserved for the rare badge that must shout.
- Fixed **structural** dimensions (rail 150px, inspector 400px, node 160px) are
  layout contracts and exempt from the 4px spacing scale. Everything else snaps
  to it, including the prototype's odd values.
- Deprecated token aliases live at the bottom of `theme.css`. Never use one in
  new code; delete each as its last caller migrates.
