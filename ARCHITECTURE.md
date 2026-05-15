# Storyworld Architecture

Storyworld is a 100% client-side React app (Vite + TypeScript) for authoring and playing branching, choice-driven stories. It has two top-level modes — **Editor** (visual graph authoring via React Flow) and **Player** (lightweight playback engine) — both reading the same JSON schema (`StoryData`).

## Top-Level Layout

| Folder | Purpose |
|---|---|
| [src/domain/](src/domain/) | Pure TypeScript entity types & business logic. **No UI dependencies.** Includes the migration system. |
| [src/features/editor/](src/features/editor/) | Visual graph editor (React Flow + Zustand). |
| [src/features/player/](src/features/player/) | Story playback UI and `StoryEngine`. |
| [src/features/dashboard/](src/features/dashboard/) | Project launcher / file browser. |
| [src/components/ui/](src/components/ui/) | Generic reusable UI primitives (Button, Card, Popover, Drawer, Tabs, RichTextEditor, …). |
| [src/lib/](src/lib/) | Core engine (`StoryEngine.ts`), `audioManager.ts`, `storyMapper.ts` (graph ↔ JSON compilation). |
| [src/styles/](src/styles/) | Global theme tokens (`theme.css`). |
| [src/hooks/](src/hooks/) | App-level shared hooks. Feature hooks live in their feature folder. |
| [src/data/](src/data/) | `exampleStory.json` — single source of example data. |

## Boot Sequence

1. [src/main.tsx](src/main.tsx) imports `theme.css` and mounts React.
2. [src/App.tsx](src/App.tsx) acts as a mode router (`dashboard` | `editor` | `player`).
3. `useStoryImport()` handles JSON loading; `useAppActions()` orchestrates mode transitions.
4. Editor mounts inside `ReactFlowProvider`. Player receives `storyData`, runs `migrateStory()`, and initializes the engine.

## Editor Architecture

### Store (Coordinator + Slices)

The root store at [src/features/editor/store/useEditorStore.ts](src/features/editor/store/useEditorStore.ts) is **strictly a coordinator** — zero business logic. It combines 12 slices via Zustand's spread pattern:

`graphSlice`, `pageSlice`, `paragraphSlice`, `choiceSlice`, `uiSlice`, `variableSlice`, `metadataSlice`, `eventSlice`, `audioSlice`, `atmosphereSlice`, `itemSlice`, `statusDataSlice`.

All slices live in [src/features/editor/store/slices/](src/features/editor/store/slices/). Each slice owns mutations for one domain entity (e.g., `pageSlice` → `addPage`, `updatePageTitle`).

**Auto-save**: a store subscription (useEditorStore.ts:68-103) debounces state snapshots and writes to IndexedDB via `idb-keyval` under the key `story-${storyId}`. Drag/pan phases are excluded to prevent jitter.

### Hooks

Organized by concern in [src/features/editor/hooks/](src/features/editor/hooks/):

- `graph/` — React Flow integration (`useNodes`, `useEdges`, `useGraphHandlers`).
- `page/` — Domain mutations (`usePageActions`, `useChoiceActions`, `useParagraphActions`).
- `story/` — Story-level state (`useSubplots`, `useStoryMetadata`).
- `view/` — UI state (sidebar, interaction toggles).
- `core/usePersistenceState.ts` — Hydration guard, uses `useShallow` to prevent re-renders.

### Components

[src/features/editor/components/GraphEditor.tsx](src/features/editor/components/GraphEditor.tsx) is the editor shell, mounting `EditorToolbar`, `FlowView`, `EditorSidebar`, and `EditorDashboard`. Custom React Flow node types live in `FlowView/`: **PageNode**, **ActionNode**, **PortalNode**.

## Player Architecture

### Engine

[src/lib/engine/StoryEngine.ts](src/lib/engine/StoryEngine.ts) is a vanilla Zustand store holding `currentPageId`, `variables`, `inventory`, `messages`, and `visitedPageIds`. It is dispatch-driven: `INITIALIZE`, `SELECT_CHOICE`, `HOVER_CHOICE`, `RESTART`.

[src/features/player/EngineContext.tsx](src/features/player/EngineContext.tsx) creates a singleton engine instance and exposes it via `useEngine()` + `useEngineStore()` selectors.

### Boot Flow

[src/features/player/Player.tsx](src/features/player/Player.tsx) receives `storyData`, runs `migrateStory()`, then dispatches `INITIALIZE`. From there, `PageRenderer` and `ChoiceRenderer` subscribe to engine state and re-render on dispatch.

### Player Hooks

`useContextualPopover` (global hotkey listener), `useTicker` (animation frame loop), `useChoiceSound`, `useEngineEffects` (side-effect adapter for transitions and end-of-story).

## Domain & Migrations

Each entity has its own file under [src/domain/](src/domain/): `Page`, `Choice`, `Paragraph`, `StoryData`, `StoryVariable`, `AudioItem`, `Item`, `Atmosphere`, `StatusData`, `LogicNode`, `Subplot`.

**Migration system** lives in [src/domain/Story/migrations/migrations.ts](src/domain/Story/migrations/migrations.ts):

- `CURRENT_VERSION` is the source of truth (currently `'1.1.0'`).
- `migrateStory(json)` walks the version chain, throwing if a gap exists, and returns a typed `StoryData`.
- Each migration is `(oldStory: any) => any`. `ensurePagesArray()` handles legacy object-keyed pages.
- Tests live in `migrations.test.ts` and cover each step in the chain.

**When changing the schema**: bump `CURRENT_VERSION`, add a migration function, add a test. See [claude.md](claude.md) for the full rule.

## Data Flow

**Editor → Save**:
1. Slice mutation updates `useEditorStore` (pages, nodes, edges).
2. Debounced store subscription snapshots state → `idb-keyval` IndexedDB.
3. Export: `compileGraphToStory()` in [src/lib/storyMapper.ts](src/lib/storyMapper.ts) filters out synthetic nodes, maps edges to `Choice.targetPageId`, and emits a typed `StoryData` with the current version.

**JSON → Player**:
1. Load JSON → `migrateStory()` upcasts to `CURRENT_VERSION`.
2. `Player` mounts inside `EngineContext` → engine dispatches `INITIALIZE`.
3. User interactions dispatch `SELECT_CHOICE` → engine evaluates visibility logic → re-renders.

## Styling

- **CSS Modules only.** Every component has a sibling `.module.css`.
- All design tokens live in [src/styles/theme.css](src/styles/theme.css) — colors, spacing (4px scale), typography, radius — as CSS custom properties.
- Typography is split: `--font-family-serif` (Lora) for story content; `--font-family-sans` (Inter) for UI.
- [src/index.css](src/index.css) holds the global reset; [src/features/player/player-theme.css](src/features/player/player-theme.css) holds player-specific overrides.

## Tooling

- **Vite** + **Vitest** (node environment, 8 test files, co-located `.test.ts`).
- **TypeScript** strict mode — no `any` permitted.
- **Storybook** for component docs (`.stories.tsx`).
- Key runtime libs: **Zustand** (state), **React Flow** (graph), **Tiptap** (rich text), **Motion** (animation), **Howler** (audio), **idb-keyval** (IndexedDB).

## Notable Patterns & Gotchas

- **Synthetic graph nodes.** `ActionNode` and `PortalNode` exist only in the editor canvas — they are not persisted. `compileGraphToStory()` strips them before save. Do not add domain logic that assumes they're in `StoryData`.
- **Save queue.** `useEditorStore.ts:38-60` uses a promise-based queue to prevent IndexedDB race conditions during rapid drags. Modify with care.
- **Event system.** Pages, Paragraphs, and Choices all carry an `events[]` array. Each event has a name (e.g., `calculateVisibility`, `onSelect`) and a `logicTree` (branching conditionals/actions). It is data-driven, not an observer pattern.
- **UI metadata persistence.** Graph node positions live in `StoryData.uiMetadata` so layout survives round-trips without re-computation.
- **Story ID is required.** IndexedDB persists per `story-${storyId}`. New/loaded stories must be assigned an ID — it is not derived from filename.
- **Conditional visibility is render-time.** Paragraphs/choices with `calculateVisibility` events are evaluated by [src/lib/engine/logic/evaluator.ts](src/lib/engine/logic/evaluator.ts) on each render — keep these expressions cheap.
- **No barrel files.** Always import from the source file directly. See [claude.md](claude.md).
