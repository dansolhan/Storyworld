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

## Done — step 2, the ⌘K command palette

- **Ctrl+K / ⌘K** open it, both bound and the hint rendered per platform. Editor
  only — it searches one story's contents.
- **Four groups**, in the design's order: `PAGES`, `CHOICES`, `IN TEXT`,
  `ACTIONS`. Prose rows quote an excerpt and name where it lives
  ("The Forgotten Shrine · paragraph 1").
- **A memoised index** (`useSearchIndex`) flattens pages, choices and paragraphs,
  stripping HTML once per story change rather than once per keystroke. Variable
  tokens survive stripping, so `{{gold}}` is findable; contextual `data-context`
  text does not, since it belongs to screen 5a.
- **Substring matching**, all terms required, behind a single `matchPosition` so
  fuzzy can replace it later. Ranked pages → choices → prose, then by match
  position.
- **Empty query is a page switcher** — pages alphabetically, plus actions.
- **`⏎`** opens the highlighted row; **`⌘⏎`** fires the first action. Creating a
  page is ordered *last* among actions, so a matching command stays reachable —
  it is still first whenever nothing else matched.
- Selecting a row navigates, frames the page, opens the right tab and reveals the
  paragraph or choice, via a shared `useRevealPage` and a `revealRequest` in the
  store. The Choices tab's target link was rewritten onto it, and Story Health
  will use the same path.
- `findSmartNodePosition` was written but never called; both `+ Page` and the
  palette's create action now place pages through it instead of at a random
  offset that could land on top of an existing node.

## Done — step 3a, the Data workspace

- **A shared shell** (`DataWorkspace`) owning the header, one-line explanation,
  220px filter, accent `+ New`, table frame, row selection and the 400px detail
  panel. Each entity supplies only its columns and its detail form — the field
  sets have almost nothing in common, so a generic column config would have been
  four escape hatches wearing a trench coat.
- **Items** (`3a`'s own columns: NAME / ID / TAGS / USED ON) and **Variables**
  (`5b`'s: NAME / TYPE / STARTS AS / TAGS / READ BY) have moved in. The
  workspace replaces the canvas and inspector rather than covering them; React
  Flow stays mounted but hidden so the viewport survives.
- **One usage index** (`buildUsageIndex`) scanning the graph once: `{{tokens}}`
  in paragraphs, choices and `StatusData.value`; blueprint params by *blueprint
  id* rather than by param name, recursively through every `logicTree` branch and
  through legacy `actions`/`conditionals`; `Atmosphere.music`; and indirect
  references inside an item's own `contextChoices`. It feeds USED ON, WHERE IT
  APPEARS and — when it arrives — `4b`'s UNUSED group.
- **Variable names are immutable.** Renaming would mean re-keying the record and
  rewriting every reference; READ BY shows exactly what that would have to touch.
  `+ New variable` therefore asks for the name up front, and validates it against
  what `{{token}}` can actually address.
- **Deleting warns and proceeds**, naming what depends on it, through a real
  dialog rather than `window.confirm`.
- **WHERE IT APPEARS** names each site's relationship in an author's words —
  given, taken away, condition, printed, set — and clicking a page reveals it on
  the graph.

Still modal until their own screens exist: Atmospheres and Audio (`4c`), Status
data (`5d`), Contextual text (`5a`).

## Done — step 4c, Atmospheres & audio

- **Atmospheres as expanding rows**, one open at a time: colour dot, name, page
  count, Rename/Delete; a 34px play button beside a waveform whose played portion
  fills, with a playhead and a `m:ss / m:ss` readout; a settings line of TRACK,
  FADE IN, VOLUME, COLOUR; and USED ON page chips with `+ n more`. Collapsed rows
  are one line — track, fade, page count — and an atmosphere with no track says so
  in the accent.
- **`fadeIn` and `volume` are new but optional.** `claude.md`'s migration rule
  covers *breaking* changes; two optional fields with defaults break nothing, so
  there is **no `CURRENT_VERSION` bump**. `atmosphereSettings` is the single place
  absence is resolved, defaulting to exactly what the player hardcoded before —
  1000ms and full category volume.
- **The player honours them.** `StoryEngine` emits fade and volume with the
  PLAY_SOUND effect, and `useEngineEffects` uses them instead of a fixed 1000ms.
  `audioManager.play` gained a `volume` option that writes back to the cached
  config, so a track shared by two atmospheres does not keep the first one's
  level.
- **Colour is four palette swatches plus a picker**, and a colour already set
  outside the palette keeps its own swatch rather than being silently rewritten.
- **The Audio library** is a third caller of `3a`'s table shell — title, type,
  description, and how many atmospheres play the track — with the waveform in its
  detail panel and the existing uploader behind `+ Upload audio`.
- Rename edits in place, committing on Enter and abandoning on Escape; deleting
  warns with the page count through the shared dialog.

Two things fell out of it:

- **Waveforms never worked for the bundled example music.** `WaveformDisplay`
  assumed every track was a base64 data URI, but the demo's tracks are paths
  under `public/`, so `atob` threw and the bars were flat. Decoding now handles
  both, and `AudioWaveform` replaced `WaveformDisplay` — one waveform component,
  and the uploader's preview gained playback.
- Only Status data (`5d`) and Contextual text (`5a`) are still modals.

## Next

Roughly in dependency order. — fold the six modal managers into one workspace
   behind the rail. Retires `ExpandableBottomPanel` and `SidePanel`, still used
   by six managers. **This also removes a real trap**: the Audio manager is a
   true modal that covers the rail, so while it is open the rail — the
   navigation model — cannot be reached. Escape now backs out of any workspace,
   which patches it, but the modal should not be covering the rail at all.
1. **`3b` Logic as sentences** — replace the drag-and-drop `LogicTreeBuilder`
   with prose and a searchable rule picker. Same data model (`events[]` with
   `logicTree`); presentation only. Likely retires `react-arborist`.
2. **`3c` Choice-first branching** — `⌘⏎` in a choice creates and links a page;
   dashed `NEW · UNWRITTEN` node; undo toast. The Choices tab already has the
   structure and both buttons.
3. **`4b` Story health** — pure derivation over existing state: unreachable
   pages, dead ends, unconnected choices, unused items/variables/audio/
   atmospheres. Add `'health'` to `EditorWorkspace`.
4. **`4a` Dashboard**.
5. **Schema work** (each needs a `CURRENT_VERSION` bump, a migration and a
   migration test, per `claude.md`):
   - `5d` per-entry visibility conditions on status data
   - `5a`/`6a` contextual text as first-class shared entries
   - `7a` **Derived text** — a new capability; inline token plus reusable
     entries
6. **Player pass** — `2c` two-column reading view, `6b` bare end-of-story.
7. **`5c` Subplots as lanes**, which changes how `FlowView` positions nodes and
   replaces portal nodes with labelled crossing cards.
8. **`6c` History & export**, **`6d` shortcut sheet**.

## Deferred, with reasons

- **Rail items `Outline` and `Text search`** — in the design, absent from the
  codebase. The rail lists only places you can actually go, so they were left
  out rather than shipped disabled. Add to `RAIL_SECTIONS` when built. Text
  search should read the palette's index (`useSearchIndex`) rather than build
  its own.
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
- **`Item.contextChoices` is authorable nowhere.** The player's inventory reads
  it — Examine, Use — but `ItemManager` only ever wrote `[]`, and the new detail
  panel does not add it either, because editing one needs a nested logic editor
  and `3b` is about to replace the logic editor wholesale. The usage index does
  count references made from inside a context choice, so they are at least
  visible.

## Known rot

Fixed after step 1b:

- **`storyMapper.test.ts` passed the wrong assertion.** It expected
  `parseStoryToGraph` to return `uiMetadata.nodes` verbatim, which contradicts
  that function's purpose — it deliberately refreshes node data from the domain
  pages, because the saved React Flow state can be stale. The test now asserts
  what the function actually promises: layout from `uiMetadata`, data from
  `pages`. The fixture even contains the stale case (an empty `targetPageId`
  that the sync corrects), so the test is now worth something.
- **Audio manager** is on the palette. The badges were purple and blue; music
  takes the accent and effects stay neutral. The canvas waveform reads
  `--color-accent-line` off the element at draw time, since canvas needs a
  resolved colour but should not pin a hex.
- **`SidePanel/index.ts` barrel deleted** — nothing imported it; its one
  consumer already imported the file directly.
- **`FloatingEdge` memoization.** `edgeParams` depended on individual
  coordinates rather than the nodes, so that a `selected` flip would not
  recompute geometry. React Compiler cannot verify a dependency list narrower
  than what the body reads, so it was skipping the whole component;
  `getEdgeParams` is cheap arithmetic, so depending on the nodes and letting the
  component be optimised is the better trade.
- **`Input` and `TextArea` generated ids with `Math.random()` during render.**
  Now `useId`. While there, both gained `aria-invalid` and `aria-describedby`,
  so the error text they already rendered is actually announced.

Also cleared, in a pass of its own after step 1b:

- **`npm run lint` reports zero problems**, down from 152 at the branch point.
  All 94 `any`s are gone, along with the React hook-correctness errors
  (refs read during render, `setState` in effect bodies, a stale closure in
  `AudioUploader`) and the fast-refresh violations.
- Two bugs surfaced while typing, both recorded above and below: the
  `Conditional[]` adapter, and a `title` field the contextual-text popover was
  never sent.
- Contexts and hooks were split out of component modules — `EngineContext`
  became `engineContext` / `useEngine` / `useEngineStore` / `EngineProvider`,
  and `LogicTreeContext` got its own file — which is what `claude.md`'s
  one-entity-per-file rule wanted anyway.
- `src/features/player/context/PageContext.tsx` was deleted: nothing imported
  `PageProvider` or `usePageId`.

- The root-level throwaway pile is gone: `upgradeStory.ts`,
  `upgradeStorySelect.ts`, `migrate_adventure.cjs`, `migrate_adventure.js`,
  `test_adventure.json`, `test_output.txt`, `lint_output.txt`, and an
  `eslint.json` that turned out to be a stale captured lint report rather than
  config. All were unreferenced one-offs superseded by the migration system.

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
