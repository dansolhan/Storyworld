# Storyworld AI - Core Engineering Directives

This file defines the conventions and rules for the Storyworld AI project. AI agents must read and follow these rules on every task.

## 🎨 Styling & Theming
- **CSS Modules only** (`.module.css`). Do NOT use Tailwind or any other utility class frameworks.
- **Global Theme Variables**: Source all spacing, sizing, colors, typography, and border radius from `src/styles/theme.css`. Never hardcode values (use `var(--space-4)` instead of `16px`).
- **Dark only**: The app has one palette — the warm dark "Classical" ground. Do NOT add a light palette, a theme toggle, or `@media (prefers-color-scheme: …)` blocks. Any surface that needs a lighter value takes the next ground role up, not a conditional override.
- **Ground Roles, Not Shades**: Backgrounds are chosen by what the surface *is*, not how dark it looks: `--color-bg-canvas` (app ground) → `--color-bg-app` → `--color-bg-chrome` (menu bar, toolbar chips) → `--color-bg-panel` (rail, inspector) → `--color-bg-raised` (cards, fields, nodes) → `--color-bg-selected` → `--color-bg-float` (floating toolbars). Borders are `--color-line-soft` / `--color-line` / `--color-line-strong`; text runs `--color-text` → `--color-text-body` → `--color-text-muted` → `--color-text-dim` → `--color-text-faint`.
- **Accent Is a Stroke**: Gold (`--color-accent`, borders `--color-accent-line`) is applied as border, text and tint — `--color-accent-tint` for selected rows, `--color-accent-ring` for selection rings. Solid gold fills are reserved for the rare badge that must shout.
- **Spacing Scale**: Use a 4px base spacing scale — values must be multiples of 4 (4, 8, 12, 16, …). Design references that specify odd values (7px, 13px, 22px) are snapped to the nearest step. Fixed *structural* dimensions (rail 150px, inspector 400px, node widths) are exempt — they are layout contracts, not spacing.
- **Typography Tone**: Two serifs, no sans. `var(--font-heading)` (Cormorant Garamond) carries headings, kickers and figures — capped at weight 600 for interface headings, weight 400 for display sizes (30px+). `var(--font-body)` (Lora) carries body prose *and all interface text*. `var(--font-mono)` is only for ids, variable tokens and key caps. Counts and timestamps set `font-feature-settings: var(--font-features-tabular)`.
- **Kickers**: Small uppercase labels use `--text-kicker-sm` / `--text-kicker` with `letter-spacing: var(--tracking-kicker)`.
- **Radius**: `--radius-md` (4px) is the default for nearly everything; `--radius-sm` (3px) for inline chips inside a text line; `--radius-full` for pills.
- **Token Separation**: Define color tokens (`--color-*`) separately from structural tokens (`--space-*`, `--radius-*`, `--font-*`, `--duration-*`) so the palette can be retuned without affecting layout.
- **Deprecated Aliases**: The bottom block of `theme.css` re-points pre-redesign names (`--color-bg-primary`, `--color-primary-*`, `--font-family-sans`, …) at the current roles so untouched files still render correctly. NEVER use an alias in new code, and delete each one as its last caller migrates.

## 🧩 UI Primitives
- **Radix + CSS Modules**: Generic primitives in `src/components/ui/` are built on `@radix-ui/react-*` for behaviour and accessibility (focus management, keyboard nav, ARIA) and styled entirely in `.module.css`. Never reach for a styled component library.
- **shadcn as the API shape**: Follow shadcn/ui's structure — composable subcomponents over monolithic prop bags, `data-state` / `data-*` attributes as styling hooks, variant props for visual variations. Do NOT install shadcn or Tailwind; the CSS-Modules-only rule stands.
- **Icons**: `lucide-react`, already a dependency. Do not add another icon set or hand-roll SVGs for icons the set already has.

## 🏗️ Architecture & Organization
- **Component Driven**: Build everything as functional React components.
- **Feature-Sliced Design**: Organize code by domain/feature, not by technical type. Group feature-specific logic, state, and components into distinct folders inside `src/features/`.
  ```text
  src/
   ├── domain/                      <-- PURE DOMAIN (No UI dependencies, pure Types & Business Logic)
   ├── features/
   │    ├── editor/                 <-- FEATURE MODULE (Depends on UI libraries like React Flow)
   │    │    ├── store/             <-- Feature-specific Global State (separated into slices)
   │    │    └── components/        <-- Feature-specific UI
   │    └── player/                 <-- FEATURE MODULE
   └── components/ui/               <-- GENERIC UI (Buttons, Cards - Highly reusable)
  ```
- **One Entity Per File**: Every component, hook, or utility of significant size lives in its own file, named after the entity (e.g., `useNodes.ts`). No god-files mixing unrelated entities.
- **Strict Typing**: Enforce strict TypeScript typing. NEVER use `any`. Only use `unknown` when structurally necessary.
- **Data Models**: Define interfaces for domain entities (`Page`, `Choice`, `Paragraph`) in `src/domain/`. Use type-only imports (`import type { Page } from ...`) when consuming them in components.
- **Props Interfaces**: Define and export the props interface directly above each component.
- **No Barrel Files**: Do NOT use `index.ts` re-export files. Import directly from the source file to keep dependency graphs clear and prevent circularity.

## 📦 Data Files
- **Example Story Data**: Maintained strictly in `src/data/exampleStory.json`. Do not create or use a TypeScript version (`exampleStory.ts`) — import the JSON directly to avoid duplicate state.

## 🚚 Schema & Data Migrations
- **Strict Backward Compatibility**: The root JSON schema (`StoryData`) keeps an internal `version` number for save/import flows.
- **[CRITICAL] Migration Rule**: EVERY time a breaking change is made to the JSON structure of a story (e.g., adding a new required field, renaming properties, changing data shapes), you MUST:
  1. Increment the `CURRENT_VERSION` in `src/domain/Story/migrations/migrations.ts`.
  2. Write a new migration script in `migrations.ts` that safely upcasts the old schema version to the new version without data loss.
  3. Update the test suite in `migrations.test.ts` to verify this specific migration flow works correctly.

## 🧱 Components
- **Generic UI**: Place highly reusable, generic UI components (Buttons, Inputs, Cards, Popovers) in `src/components/ui/`.
- **Rule of Three (DRY)**: Avoid premature abstraction, but extract once a pattern appears three times. Maintain healthy separation of concerns by extracting reusable utility functions or generic UI components when justified.
- **Extract Logic to Hooks**: Components render UI; hooks own behavior. Extract complex logic, `useEffect` orchestrations, or coupled state into custom hooks (e.g., `useAtmosphere`).
- **Component Size Limit**: Components must rarely exceed 200 lines. If a component grows beyond this, extract internal state and logic into custom hooks or imported functions.

## 🛠️ State Management
- **Client-Side First**: The engine is a 100% client-side React app built with Vite.
- **Global State (Zustand)**: Use Zustand for global state. Split state into logical stores (e.g., `useEditorStore`, `usePlayerStore`) rather than one monolith.
- **Editor vs Player Isolation**: Treat Editor and Player as fundamentally distinct state applications. The Editor manages complex node/edge relationships; the Player boots from a lightweight JSON payload (`Page[]`). They must have isolated Zustand stores.
- **[CRITICAL] Domain Slicing Pattern**: Never create god-file Zustand stores that mix library-specific mapping (React Flow nodes/edges) with domain business logic (adding Pages/Choices). Subdivide complex stores into slices organized by domain entity (e.g., `src/features/editor/domain/Page/pageSlice.ts`). The root store (e.g., `useEditorStore.ts`) must strictly act as a coordinator combining slices, with zero business logic itself.
- **Local React State**: Prefer `useState`, `useMemo`, `useCallback` for localized, transient component state (e.g., open/closed toggles).

## 🪝 Hooks
- **One Hook Per File**: Every custom hook lives in its own file. Do NOT group multiple hooks into a single "state" or "hooks" file.
- **Feature-Specific Hooks**: Place in domain-specific subfolders (e.g., `src/features/editor/hooks/graph/useNodes.ts`).
- **Shared Hooks**: Generic hooks used across features live in `src/hooks/`.
- **Focused Selectors**: Hooks should return the smallest possible slice of state. Use `useShallow` when returning objects containing multiple properties from a store to prevent unnecessary re-renders.

## 🤖 AI Conduct
- **Honest & Critical Sparring Partner**: Be honest. Do not coddle or exaggerate the quality of ideas. Be critical where criticism is due. Maintain a friendly and joyous tone, but absolutely object if a suggested approach represents an anti-pattern, a bad architectural choice, or flawed logic.

## 🧪 Testing
- **Test Coverage**: All new features, utilities, and slices MUST have corresponding unit or integration tests. New functionality is not complete until covered by tests.

## 🛠️ Shell Execution
The project is developed across both **Windows** and **Linux** environments. Detect the active environment and adapt shell commands accordingly:
- **Windows**: Always prefix shell executions with `cmd /c` to ensure the process terminates correctly and sends an EOF signal. Example: `cmd /c pip list` instead of just `pip list`.
- **Linux / macOS**: Use standard POSIX shell commands directly (e.g., `pip list`, `ls`, `npm run dev`). Do NOT prefix with `cmd /c`.
- **Cross-platform scripts**: When adding npm scripts or tooling commands, prefer cross-platform invocations (e.g., `cross-env`, Node-based scripts) over shell-specific syntax so they work on both environments without modification.
