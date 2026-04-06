# Storyworld AI

Storyworld AI is an interactive text-based story creator and player. It features a fully-fledged visual logic builder, a rich text editor for authoring interactive paragraphs, and a robust headless game engine to run the stories, separating logic from the user interface.

## Main Features

- **Headless Story Engine**: A state-machine-based engine that processes JSON story data. It is entirely decoupled from the React UI to create a framework-agnostic, type-safe library capable of managing logic, rendering multi-paragraph text, and executing complex actions like variables and conditional choices.
- **Player UI Component**: A beautiful, highly-responsive reading view for interactive stories. It includes smooth audio transitions, contextual popovers for on-hover events, custom UI scrollbars, and fluid animations for transitions between paragraphs and choice resolution.
- **Visual Logic Tree Builder**: A node-based story visualization workspace powered by `@xyflow/react` that allows authors to visually explore passage relationships, map out storyline choices, and overview context parameters.
- **Rich Text Authoring**: Built with TipTap, the editor allows for complex nested context, paragraph-level manipulation, text variables, and rich inline styling integration.
- **Audio Management**: Seamless integration with Howler.js for background music, sound effects, staggers, and customizable fade transitions.
- **Persistence & Migration Data**: Stores ongoing stories dynamically using IndexedDB (`idb-keyval`), equipped with robust schemas capable of migrating data safely without data loss.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling & Animation**: CSS Modules, Framer Motion, Floating UI, Headless UI
- **State Management**: Zustand
- **Editor**: TipTap
- **Nodal Interface**: React Flow
- **Audio Framework**: Howler.js
- **Testing**: Vitest + Testing Library
- **UI Components Development**: Storybook

## How to Run the Project

Ensure you have Node.js and `npm` installed. Start by installing the project's dependencies:

```bash
npm install
```

### Running the Development Server
To start the Vite development server and view the project locally:

```bash
npm run dev
```

### Running Tests
This project uses Vitest. To run the complete test suite:

```bash
npm run test
```

For the Vitest UI interface:

```bash
npm run test:ui
```

### Running Storybook
View and develop UI components in isolation with Storybook:

```bash
npm run storybook
```

### Building for Production
To build a highly optimized production version of the application:

```bash
npm run build
```
