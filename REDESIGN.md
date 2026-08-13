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

## Done — step 3b, logic as sentences

- **Rules read as prose.** All 17 blueprint templates were reworded from labels
  to clauses — `Give {{count}} {{itemId}}` became `give the reader {{count}}
  {{itemId}}`, `Set variable {{variable}} to {{value}}` became `set {{variable}}
  to {{value}}` — so a rule reads left to right: *If the reader carries the
  Strange Golden Key → Then keep the reader on this page*. Data is untouched: the
  same `events[]` carrying the same `logicTree` the evaluator reads, so **no
  `CURRENT_VERSION` bump**.
- **Moments, not event names.** Each `EventDefinition` gained a `label` — "When
  the reader arrives", "Whether this is shown at all" — and `RuleEditor` titles a
  section with it. `eventLabel` falls back to the raw name so a story carrying a
  moment this build does not know still shows its rules instead of losing them.
- **Groups join inline.** `and_group` renders as "… and …" on one line rather
  than as a header over an indented list, which is the whole reason the rule
  reads as a sentence. A group nested inside another is bracketed, so "a and (b
  or c)" cannot be misread. `ConditionalBlueprint` gained `joinWord` for this.
- **The rule picker** is a 640×470 dialog: query row, a 170px category rail with
  live counts, results grouped by category, each row showing the sentence the
  rule would become plus `name · used n times in this story`. `⇥` walks the rail,
  `↑↓` moves, `⏎` inserts into the named destination. Categories come from a new
  `BlueprintCategory` on every blueprint, so a new blueprint appears in the
  picker by existing — there is no second list to keep in step.
- **Preview sentences use nouns, not ellipses.** Three tokens in a row rendered
  as "… … …", which tells an author nothing. `tokenNoun` maps each token to a
  noun phrase ("an item", "a page"), with per-blueprint overrides where one token
  name has to read two ways — `{{comparison}}` compares a variable in one
  blueprint and a quantity in another.
- **Order is still editable.** The drag handles are gone but actions run in
  sequence, so each row has up/down/remove — which, unlike dragging, works from
  the keyboard.
- **Retired:** `LogicTreeBuilder` (toolbox, tree, node, story, context, types),
  `EventsEditor`, and the `react-arborist` dependency. The reusable sentence
  pieces moved to `RuleEditor/sentence/`.

Three things fell out of it:

- **The Play button never worked.** `onClick={onPlay}` handed React's click event
  to `handlePlay`, whose first parameter is an optional start page — so the
  engine started at a page id that was a `MouseEvent`, no page matched, and every
  story opened on "— The End —". Present on `master` too. The prop type is
  `() => void`, which is exactly why TypeScript could not see it; a test now
  asserts Play is called with no arguments.
- **`{{text}}` had no editor.** `Change choice text` has been in the registry all
  along, but `BlueprintToken` had no branch for its token, so the sentence
  printed a literal `{{text}}` and clicking did nothing. It now opens a free-text
  field, and `MessageInput` took `title`/`placeholder` props rather than being
  cloned a fourth time.
- **Two moments shared one label.** `onEvaluate` was renamed to
  `calculateVisibility` by the 1.1.0 migration, but both were still offered to
  authors — under identical titles, one of them deprecated. `onEvaluate` is now
  marked `legacy` and excluded from what can be added, while keeping its label so
  old stories still display. "Add a moment" also dedupes by label, so a story
  carrying the old name is not offered its replacement.

## Done — step 3c, choice-first branching

- **`⌘⏎` while writing a choice branches to a new page.** The page comes into
  existence, the choice points at it, and the camera moves to show it — but the
  selection does not, so the author stays in the choice list they were writing.
  Plain Enter is deliberately left alone: it does nothing in a single-line input,
  and claiming it would let a stray keystroke create a page. Both `⌘` and `Ctrl`
  are accepted, as everywhere else.
- **A choice that already had a target is simply repointed**, and the toast says
  so. Stopping to confirm would defeat the point of a shortcut; the undo is what
  makes that safe.
- **Undo is a scoped toast**, not an editor-wide stack: "New page created, and
  the choice repointed at it. — Undo" deletes the page and puts the old target
  back. Order matters inside it, because deleting a page clears any choice naming
  it, so the old target has to be restored afterwards.
- **A page with no prose is drawn as unwritten** — kicker `Location · Unwritten`,
  a faint border and a dimmed title. Derived from `paragraphs`, so nothing has to
  remember to clear a flag, and no schema change: **no `CURRENT_VERSION` bump**.
  An action-only page carries the mark permanently, which is honest — it has
  nothing for the reader to read.
- **Dashed still means "plot / action".** The design gives dashed to unwritten
  pages, but the canvas already spends that stroke on page type, and one border
  cannot carry two facts. Unwritten fades instead, so an unwritten plot page
  reads as *both*.

Three things fell out of it:

- **There was no way to delete a page.** React Flow's own delete removes the
  *node* and leaves `pages[id]` behind — an orphan the compiler still emitted,
  with choices elsewhere still naming it as a destination. `deletePage` now
  clears all four places a page exists: the node, the page record, the edges
  touching it, and any choice pointing at it. It also drops the selection and the
  start page when they were the deleted page.
- **`useRevealPage` did two things at once.** Revealing a page selects it and
  hands the inspector over; branching only wants the camera. `useFramePage` is
  the camera half, and `useRevealPage` now builds on it.
- **A `Toast` primitive**, on `@radix-ui/react-toast` per the Radix + CSS Modules
  rule, holding exactly one message: two stacked Undos would leave the author
  guessing which belonged to which action. `src/test/setup.ts` gained a
  pointer-capture stub, because jsdom implements pointer events but not pointer
  capture and Radix's swipe gesture reaches for it.

## Done — step 4b, story health

- **Eight checks, grouped by check**, each with its own count and a line saying
  why it matters. A group that finds nothing keeps its place and says what it
  verified — "every page can be reached" — because a group that vanished on
  passing would leave the author unsure it had run.
- **Nothing is stored.** `buildHealthReport` is a pure function over the same
  collections the editor edits, memoised on their identity, so the report cannot
  go stale and there is no "re-run checks" button. **No `CURRENT_VERSION` bump.**
- **The rail counts only what breaks a story** — unreachable pages, choices whose
  target has been deleted, a missing start page. Unwritten pages and unused data
  are notes: a draft always has some, and a badge that never reaches zero stops
  being read. The screen shows both figures, `1 BREAKING · 4 TO LOOK AT`.
- **Reachability is walked forward from the start page**, not counted inbound. A
  cluster of pages linking only to each other passes an inbound count while a
  reader can reach none of them; walking forward catches the whole island. Both
  edges the engine actually follows are included — a choice's `targetPageId` and
  the `go_to_subplot` action, at any depth of branch. Posting a message is not
  movement.
- **The bias is against false positives.** A jump inside an item's context choice
  counts as reachable from anywhere, because the item can be carried anywhere. An
  action-only choice — no target, but rules — is a supported shape, so only a
  choice with neither is reported. Without a start page the reachability check
  does not run at all and says why, rather than reporting every page as
  unreachable.
- **Clicking a page finding reveals it on the canvas.** Unused data rows name the
  entity without a jump: selection inside a data workspace is local state, and a
  cross-workspace reveal is real plumbing that wants its own step.

One thing fell out of it, and it changed a check:

- **"Dead ends" was a false-positive generator.** It reported pages with no
  choices and no `end_story` rule — but the player ends the story whenever a page
  offers no visible choices, and `end_story` only *records data* on the way out.
  Running it against the demo proved it: both of that story's intended endings
  were flagged, and no story anywhere uses `end_story`. Nothing in the data
  distinguishes "an ending" from "I forgot the choices", so the check became
  **Endings** — an inventory for the author to check against the endings they
  meant, with `end_story` noted where present. A screen that flags every ending in
  every story is a screen nobody reads twice.

## Done — step 4a, the dashboard

- **Rows, not cards**, most recently edited first — which is almost always the one
  you came to open. A story saved before timestamps existed sorts last rather than
  jumping to the top on a missing value.
- **The meta line is real counts**: pages, choices, subplots, things to fix, last
  edited. Where the design said "dead ends" it says **things to fix**, taken from
  the same `buildHealthReport` the Story health screen reads — so the shelf and
  that screen can never disagree about how many problems a story has. `4b`
  established that a page with no choices is how an ending is written, so a
  dead-end count would have been a fiction. "Nothing to fix" is stated rather than
  omitted, and `0 subplots` is left out because a story that never had them does
  not need telling.
- **`savedAt` rides on the autosave envelope, not in the store.** `lastSavedAt`
  deliberately is not persisted — it is the guard that stops autosave looping —
  so the timestamp goes on the snapshot wrapper instead, where it cannot trip
  `hasPersistedChange`. Not a `StoryData` change, so **no `CURRENT_VERSION`
  bump**; a story saved before it shows no timestamp rather than a wrong one.
- **`Play` loads the story and hands it straight to the player**, from its own
  start page. It is the same load path as `Open` — only what happens afterwards
  differs — so leaving the player lands you in that story's editor, which is what
  an author expects.
- **The empty state** is the design's dashed panel: kicker `WITH NOTHING ON THE
  SHELF`, "Begin a story", one sentence, then `+ New story` with demo and import
  as underlined links. Once there is a shelf, the same three actions move to the
  header with the same weighting, so nothing has to be learned twice.
- **Deleting a story says what it costs** — "24 pages and 46 choices. Autosave
  lives in this browser only, so there is no copy to fall back on." Its own dialog
  rather than the Data workspace's: what is lost is the story, not a reference to
  it, so the sentence differs. Replaces a `window.confirm` that could say neither.
- **`relativeTime`** is shared, pure and takes `now` as a parameter. It stops
  being relative after a week, because "edited 23 days ago" is harder to place
  than a date.

Two smaller things:

- **This was the last screen built out of inline styles**, and the last one
  reaching for the deprecated `--font-family-sans` / `--color-text-*-primary`
  aliases. Those aliases still have callers in `Drawer`, `RichTextEditor` and
  `ExpandableBottomPanel`, so none can be deleted yet.
- `StoryGrid` and `StoryCard` are gone, replaced by `StoryRow` and `EmptyShelf`.

## Done — step 5d, status data on its own page

The first of the schema steps. **`CURRENT_VERSION` 1.1.0 → 1.2.0**, with a
migration and migration tests, per `claude.md`.

- **One migration per step, not one for all three.** The version number is a claim
  about the shape of the data: bumping once up front and implementing over three
  commits would stamp every autosave `1.2.0` while the data still lacked the later
  shapes — and since the runner matches on `from`, those stories would never
  receive the migration they needed. Separate hops also isolate `5a`, the risky
  one, where a repair can be added as a further hop; a combined migration that has
  already run on someone's story cannot be safely edited.
- **`condition: LogicNode[]` replaces `conditionals: Conditional[]`.** An array
  rather than the design's single node, so it is the same shape as every other
  condition in the story — `RuleEditor` renders it and `evaluateEventVisibility`
  reads it with no adapter between. Empty means always; several roots are ANDed.
- **The migration is written against `LegacyRecord`, not against today's types.**
  It deliberately does not import `conditionalsToLogicTree`: a migration is frozen
  history and has to keep producing the shape *this* version expected, so
  importing today's adapter would silently re-point the hop at a future shape and
  corrupt the chain for anyone upgrading through it.
- **The preview and the player share one function.** `statusEntryIsVisible` is
  used by both, because the design greys hidden entries in the editor and omits
  them in the player — which only works if the two agree about *which* are hidden.
  Two implementations would eventually disagree and the preview would be lying.
  Verified against the demo: the ledger preview greys "☠ Poisoned" and the player
  omits it.
- **The hidden reason names the entry's own condition** — "hidden — needs:
  isPoisoned equal true" — rather than working out which clause failed. Always
  true, and it points at exactly what to edit. A second evaluator that reported
  rather than decided could disagree with the real one.
- **Up/down rather than drag**, consistent with the rule rows from 3b and with no
  new dependency. Order is stored as `priority`, so moving a row swaps the two
  rows' priorities rather than reindexing — everything else reads priority,
  including the player.
- **`ConditionListEditor` is new and reusable**: a bare `LogicNode[]` in, a
  changed one out, using the same sentences and the same picker as the rules.
  `RulePicker` gained an `only` prop, since a status entry asks a question and an
  action there would never be run. `7a`'s outcomes will want exactly this.
- **`conditionText`** renders a condition as flat text for the SHOWN WHEN column
  and the preview's reason, mirroring `BlueprintToken`'s labels — the two are read
  side by side, and a difference between them would make both untrustworthy.
- **Retired**: `StatusDataManager` and its modal. `EditorDashboard` is down to
  Contextual text alone.

Two things the demo exposed:

- **An empty title is a real shape, not an unfinished one** — the demo's "☠
  Poisoned" entry carries its label in the value. The preview rendered a bare
  ":" for it until it was taught what the player already knew, and the table now
  says "value only" rather than calling it untitled.
- **The evaluator fails open on a blueprint it does not recognise**, so a
  condition from a newer build shows the entry rather than silently swallowing it.
  The preview inherits that by sharing the function, which is the point.

## Done — steps 5a & 6a, contextual text as shared entries

The second schema step. **`CURRENT_VERSION` 1.2.0 → 1.3.0**, with a migration and
migration tests.

- **Entries are first-class and shared.** Before this, every mark carried its own
  copy of the note inside the paragraph HTML, so the same explanation written on
  three pages was three unrelated copies — editing one changed nothing else. A mark
  now holds only `data-context-id`, and the note lives in `contextualText`.
- **The migration interprets nothing.** Every existing mark becomes its own entry.
  Deciding that two identical notes are "the same" would be an irreversible guess
  about intent, so the workspace *offers* the join instead — "these say exactly the
  same thing · Use one entry for all of these" — and `mergeContextualEntries`
  repoints every mark. That is how an existing story reaches the REUSED group, by
  the author's choice rather than ours.
- **The rewrite is surgical.** Only the matched span's attributes change; every
  other byte of the author's prose survives. Parsing and reserialising through
  `innerHTML` would normalise entity encoding, attribute quoting and self-closing
  tags — silently editing writing the migration was not asked to touch. A test
  asserts the prose either side of a mark is byte-identical.
- **Marking is a picker, not a blank form** (6a). Selecting a phrase and choosing
  Contextual text lists the existing entries with what each says and where it is
  used; writing a new one is the fallback. This is what makes sharing possible at
  all — before, marking always wrote another copy.
- **The picker is injected, not imported.** `RichTextEditor` is generic UI, so the
  feature raises "attach an entry to this range" and `ParagraphBlock` supplies the
  store-aware picker. A `useEditorStore` import in `components/ui` would tie every
  consumer of the editor to the editor feature.
- **`usedOnPageIds` is deliberately not stored.** Where an entry appears is derived
  from the marks, like item and variable usage — a stored list would drift the
  first time a paragraph was edited.
- **A dangling mark renders as ordinary prose**, and Story Health gained a
  breaking check naming the page. A reader never meets a phrase that looks
  clickable and does nothing; deleting an entry does not rewrite the author's
  paragraphs behind their back.
- **Retired**: `ContextManager` and its modal — so all six modal managers are now
  gone and `EditorDashboard` holds only the story-settings drawer. `ItemManager`
  went too: nothing had mounted it since `3a`.

Three things this step surfaced:

- **The migration nearly did nothing at all.** `new RegExp(`${name}=…`)` inside
  a template literal put a *backspace character* in the pattern, not a word
  boundary, so no attribute ever matched. Every story would have kept its old
  marks while the extension stopped reading them — every popover silently dead.
  Caught by the migration tests, which is exactly what they are for.
- **"Reused" has to count marks, not pages.** Two phrases in one paragraph pointing
  at the same entry is reuse, and grouping by page count called it "used once" —
  a lie, since editing it changes two places. Found by marking a second phrase in
  the running app; the unit tests had only covered the across-pages case.
- **The rail counts entries, not marks.** They were the same figure until entries
  became shared. The old count scanned paragraph HTML for a class token, which is
  now both wrong and unnecessary.

## Done — step 7a, derived text

A new capability, and the last of the schema work — **with no `CURRENT_VERSION`
bump**, as predicted. `derivedTexts` is a new optional collection and the tokens
only exist where an author put one, so an old story has nothing to upcast. The
migration rule covers *breaking* changes; this breaks nothing.

- **One collection, not two.** The handoff proposed keeping inline outcomes inside
  paragraph HTML and only named ones on the story. That would put structured data
  back into prose — invisible to Story Health, awkward to edit, and the exact shape
  schema 1.3.0 had just migrated away from. All derived texts live in
  `derivedTexts`; "reusable" is only `name` being set.
- **An inline atom node, not a mark.** A mark wraps words that already exist; a
  derived text *is* the placeholder, and what it says depends on state. The node
  serialises empty — the player replaces the whole element — so nothing is ever a
  second copy of what lives in the collection.
- **The chip shows the alternatives**, `{Old Gil / a stranger}`, through a React
  node view. Reading what a sentence might say without opening anything is the
  point of the design's chip. `white-space: nowrap` is load-bearing, per the
  design: the chip is inline-flex inside justified prose and a wrap lets the text
  escape its own border box.
- **The node view is injected, not imported** — the same layering as 6a's picker.
  Showing outcomes needs the store, and `RichTextEditor` is generic UI.
- **Order is the semantics.** The first outcome whose condition holds wins, so the
  list is explicitly ordered and the badge says which one resolves under the
  starting values — evaluated by the same `evaluateEventVisibility` the player
  uses, so the badge cannot disagree with the reader. Up/down rather than the
  design's drag handles, matching the rule rows and status entries.
- **Conditions are `LogicNode[]`**, so `ConditionListEditor` from 5d took them
  unchanged, and an empty condition reads as "otherwise — the fallback". The design
  proposed `LogicNode | null`; an empty array says the same thing in the shape the
  rest of the codebase speaks.
- **Derived texts resolve before `{{variable}}` substitution**, so an outcome can
  itself contain a token — "the {{title}} nods" is a reasonable thing to write.
- **Story Health gained a breaking check**: a derived text with no unconditional
  outcome, no outcomes at all, or a deleted entry can leave a gap in a sentence,
  and none of that is visible while writing — the chip looks the same either way.
  The editor also says so at the point of editing.

One thing worth noting: a token whose derived text has been deleted resolves to
nothing and the sentence closes over it, rather than showing a reader scaffolding.
That is the same bargain contextual entries strike, and the same reason: deleting
should not rewrite an author's paragraphs behind their back.

## Done — steps 2c & 6b, the player as an open book

- **`2c` is not a two-column reading view.** The handoff README has no section for
  it — only its name in the build order — so this step began by reading the
  prototype, where 2c is *"an open book: story on the recto, the reader's ledger on
  the verso, gutter down the middle"*. The earlier note in this file was a guess and
  was wrong; had it been built from the guess, the whole shape would have been off.
- **A volume lying on a desk.** Three grounds now, where there were two:
  `--player-bg-ground` is the desk the book sits on, `--player-bg-lighter` the
  recto, `--player-bg-ledger` the verso. The gutter is a 1px gradient that fades at
  head and foot, so it reads as a fold rather than a panel divider ruled edge to
  edge.
- **The recto is a printed page**: a running head, a 42px title flush left, the
  `─ ✦ ─` ornament, and a drop cap on the opening paragraph. The design's right-hand
  running head holds "CHAPTER ONE", which a branching story has no equivalent for —
  so that slot stays empty and speaks up only at an ending, with "Last page". It
  briefly said "This page", which was filling a slot rather than saying anything.
- **Justified prose, hyphenated, at the page's full width.** Hyphenation is what
  tightens justified copy — without it a long word stretches the line's word-spaces
  and the page grows rivers. Capping the measure was tried and **reverted**: it
  wrapped the text well short of the page and read as a fault rather than as
  typesetting. The recto runs full width, as the prototype draws it.
- **Choices are numbered lines**, accent numeral in a fixed 14px column so the texts
  align down the page, hairlines between them, sitting at the foot of the page via
  `margin-top: auto` — so a short page still reads as a page.
- **`6b` is a colophon**: the rule, `THE END` letterspaced in the accent, and two
  ways on — `Begin again` and `Back to the editor`. **No statistics and no ending
  counts**, and the ledger keeps showing exactly what it showed during play. A test
  asserts the page offers exactly two buttons, so a future "you visited 14 pages"
  cannot creep in.
- **One way out during play**, in the ledger's head. The floating "■ Stop Playing"
  and the "Storyworld Engine" header bar are both gone: a reader finishing a story
  was being offered four ways to leave it, which is what the design's bare ending is
  reacting against.
- **The ledger is rows, not cards** — label left, figure right in the heading face
  with tabular digits, hairline between. `CARRIED` holds pills with the count in the
  label ("River Coin ×2"), and the item context menu — Examine and context choices —
  is unchanged behind them.
- **The contextual mark takes the accent**, with a dotted underline. The handoff
  replaces the teal `--color-success` here outright, so there is one gold across the
  app; the mark is annotated, not linked away, which is what the dots say.
- `--font-family-serif` and `--font-family-sans` are gone from the player, which
  removes two more callers of the deprecated aliases.

Two notes for later:

- The design's ledger shows an **Afflictions row of pill chips**, which our status
  entries cannot express: an entry carries one value string, not a list. Rendering
  it would need a shape change, so the rows stay label/value.
- The player keeps its **paper texture** — the reader's surface is allowed to feel
  like paper while the editor stays flat. They are different rooms, which is why the
  handoff keeps `player-theme.css` separate in the first place.

## Done — step 5c, crossings and plot navigation (lanes deliberately not built)

**The design's lanes were rejected, on purpose.** 5c draws subplots as horizontal
lanes across one canvas. That contradicts what subplots are *for*: isolating a group
of pages into an abstraction you enter, the same way you fold a function body. Lanes
flatten it — five 20-page subplots become 100 nodes on one canvas, which is the mess
subplots exist to avoid — and they scale badly in the one direction a canvas cannot
buy more of. The filtered model stays.

What survives is 5c's own criticism of the old portal, which holds regardless:
*"portals as a labelled crossing rather than a mystery node."*

- **The crossing card** replaces the 44px glyph with a tooltip. 190px, ringed in the
  accent because it is a doorway rather than a page, and it says what it stands for:
  the plot, **how many pages are on the other side**, the page you arrive at, and the
  choice that takes you there — "2 pages · from The Awakening · *Lift the floorboard*".
  An abstraction should hide detail, not hide what it is.
- **The rail lists the plots**, with each plot's colour and its page count, plus
  `+ New subplot`. Plots sit between STORY and DATA: they are places on the canvas,
  not a collection you edit. The toolbar picker stays — the design draws both, and
  they read the same `currentPlotId`.
- **Subplots have a colour**, an optional field with a colour derived from the plot's
  position when it is absent — so every existing story gets distinct dots with **no
  migration**.
- **Cross-plot edges are dashed in the accent**, replacing a hard-coded purple from
  before the redesign.

One thing had to be fixed before any of it could be seen:

- **Synthetic nodes had been dead since schema 1.0.0.** `syncSyntheticNodes` read a
  choice's behaviour from `choice.actions`, and the 1.0.0 migration moves actions
  into `events` and *drops* that field — so for every migrated story the loop found
  nothing and the canvas silently stopped drawing crossings and action markers. The
  demo has three crossings and seven action-only choices, and rendered **zero** of
  them. `choiceInvocations` now reads both shapes, walking to the bottom of a logic
  tree, and tests pin the events case. There was no mystery node to relabel; there
  was no node at all.

## Next

Roughly in dependency order. — fold the six modal managers into one workspace
   behind the rail. Retires `ExpandableBottomPanel` and `SidePanel`, still used
   by six managers. **This also removes a real trap**: the Audio manager is a
   true modal that covers the rail, so while it is open the rail — the
   navigation model — cannot be reached. Escape now backs out of any workspace,
   which patches it, but the modal should not be covering the rail at all.
1. **`6c` History & export**, **`6d` shortcut sheet**.

## Deferred, with reasons

- **Lanes as an opt-in overview.** Rejected as the canvas's normal state, but a
  deliberate "All plots" view — filtering by default, lanes when asked for — would
  give the whole-story picture without costing the abstraction. Worth revisiting if
  orientation across plots turns out to be a real need rather than a supposed one.
- **A cross-workspace entity reveal.** Story Health's unused-data rows would
  like to open Items with that row selected, but each data workspace holds its
  selection in local state. A `revealEntity` alongside `revealRequest` would
  serve Health, the palette and Story Settings — worth doing once, deliberately,
  rather than as a side effect of a design step.
- **An explicit "this is an ending" marker on `Page`.** Without one, `4b` cannot
  tell an intended ending from a page whose choices were forgotten, which is why
  the check is an inventory rather than a fault. Adding one is a schema change:
  `CURRENT_VERSION`, a migration and a migration test.
- **Naming a derived text reusable, and its own workspace.** `7a` shipped inline
  derived texts end to end; `name` exists on the model but nothing sets it yet, so
  there is no rail item and no `{merchantName}` addressing. The collection is
  already shaped for it.
- **"Try another state" in the derived-text preview** — setting variable values to
  see which outcome wins under other conditions. It needs a scratch evaluation
  context the editor has no notion of; the "resolves now" badge covers the starting
  state.
- **The 5a "returning state" round trip** — the design's "See all entries — the
  mark is kept, and you come straight back", with `pendingContextualMark` in the
  store and a returning bar above the workspace header. The picker covers the
  common case; this is for when an author wants the whole list mid-sentence.
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
- **`Item.contextChoices` is authorable nowhere.** The player's inventory reads
  it — Examine, Use — but `ItemManager` only ever wrote `[]`, and the item detail
  panel does not add it either. `3b` has now built the editor this needs:
  `RuleEditor` takes a `targetType`, so adding `'contextChoice'` to it plus a
  choice list in `ItemDetail` is the remaining work. The usage index and the
  blueprint usage counts already read context choices, so they are visible even
  while unauthorable.

## Known rot

Still open:

- **A general undo stack.** `3c` built a scoped toast instead, and page deletion now
  has one too. Worth doing properly: it touches every slice and needs its own testing.

Fixed after the design steps:

- **A page could only be deleted by keyboard, on the canvas.** Every other entity in
  the app — items, variables, atmospheres, audio, status entries, contextual entries,
  whole stories — had a visible delete; a page had none. The inspector's Settings tab
  now carries "Delete this page", where the rest of what a page *is* already lives.

  Neither route confirms first: the delete is undoable, and a confirmation on every
  delete makes the ordinary case tedious. Both go through `useDeletePages`, so the
  message and the restore are defined once — the canvas deletes inside
  `onNodesChange`, because React Flow hands removals to the store rather than to a
  component, and then hands back what went so this can say the same thing about it.

  React Flow also binds **Backspace alone** by default, so the Delete key did nothing
  — which reads as the feature being broken rather than as a different shortcut. Both
  are bound now. The button sits below a rule in the danger outline, so it reads as its
  own zone rather than as one more setting — outlined rather than filled, because
  colour is a stroke here and an undoable delete should be findable, not frightening.

- **The page title moved from Settings to Write.** It is content, not configuration:
  the player sets it as the page's headline directly above the prose, and this is the
  one place you see both while writing. Settings keeps what a page *is* — type,
  atmosphere, start page, id — and the delete.

- **Opening a story wiped its contextual entries.** The autosave snapshot never
  recorded the *story schema* version, so `handleOpenExisting` passed the snapshot
  envelope's `version: 3` to `migrateStory` — and every open re-ran the whole
  migration chain over data that was already current. Harmless until `1.3.0`, whose
  contextual-text step scanned the prose for legacy `data-context` marks and then
  *assigned* the result: on a second pass it found none and wrote `{}` over the real
  entries. The marks kept their ids, so the references survived and every note's text
  was gone.

  Three fixes: the migration seeds from what is already there and never replaces it
  (**a migration has to survive being run twice**); the snapshot records
  `storyVersion`, so a current story skips the chain entirely; and the id-keyed
  `pages` record is converted to a list at the boundary where it is read.

  That last one was load-bearing and hidden: `ensurePagesArray`, inside the chain, had
  been doing that conversion by accident. Skipping migrations for an already-current
  story broke opening it outright — caught only by driving the real app, since every
  unit test builds `pages` in whichever shape it wants.

- **Deleting a node on the canvas orphaned its page.** `onNodesChange` applied React
  Flow's `remove` change to `nodes` alone, so the node vanished while the page record,
  its edges and every choice pointing at it survived — invisible, unreachable, and
  still emitted by the compiler. Removals now route through `deletePage`.

  Closing it made the deletion *real*, which meant it could destroy prose, so
  `deletePage` returns what it removed and the canvas offers it back: "Deleted 'The
  Locked Door'. — Undo". The restore is targeted rather than a wholesale state
  rollback, so an author who deletes a page, edits something else, then reaches for
  Undo gets the page back and keeps the edit. Verified on the demo: 22 pages → 21 with
  Story Health noticing the page the removal orphaned, then Undo returning both to
  where they were.

  Synthetic nodes are deliberately not removable — a crossing card and an action
  marker are derived from a choice, so deleting one would only have it reappear on the
  next sync. The choice is the thing to edit.

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
