# Task Manager — Frontend

Vue 3 + Vite single-page app for managing daily tasks.

## Requirements

- Node.js 18+
- Backend running on port `3000` (see [`../backend/README.md`](../backend/README.md))

## Setup

```bash
npm install
```

## Running

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot-reload (port 5173) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run all tests (single run) |
| `npm run test:watch` | Run tests in watch mode |

Or start both frontend and backend together from the project root:

```bash
./dev.sh
```

## Stack

| Tool | Purpose |
|---|---|
| [Vue 3](https://vuejs.org/) | UI framework (Composition API) |
| [Vite 5](https://vitejs.dev/) | Dev server and bundler |
| [Pinia](https://pinia.vuejs.org/) | State management |
| [Tailwind CSS v3](https://tailwindcss.com/) | Utility-first styling |
| [Vitest](https://vitest.dev/) | Unit and component tests |
| [Vue Test Utils](https://test-utils.vuejs.org/) | Component mounting helpers |

## Project Structure

```
src/
  api/
    tasks.js          ← HTTP client (fetch wrapper for the backend)
  composables/
    useTheme.js       ← Light/dark theme toggle + localStorage persistence
  stores/
    tasks.js          ← Pinia store (tasks state, CRUD actions, sortedTasks getter)
  components/
    TaskForm.vue      ← Create task form (title, urgency, description)
    TaskItem.vue      ← Task card (urgency border, status toggle, delete)
    TaskList.vue      ← Task list with loading/empty/error states
  App.vue             ← Root component (layout, theme toggle, wires store)
  main.js             ← App entry point
  style.css           ← Tailwind directives
```

## Dev Proxy

In development, Vite proxies `/api/*` → `http://localhost:3000/*`.  
No hardcoded URLs — the API client always calls `/api/tasks`.

## Features

- View today's tasks, sorted by urgency (high → medium → low)
- Create tasks with title, urgency, and optional description
- Toggle task status (pending ↔ done)
- Delete tasks
- Urgency-colored left border on each card (red / amber / green)
- Light/dark theme toggle with `localStorage` persistence

## Testing

```bash
npm test
```

60 tests across 7 test files:

| File | Coverage |
|---|---|
| `src/api/tasks.test.js` | HTTP client — all methods, error handling |
| `src/stores/tasks.test.js` | Pinia store — all actions, sortedTasks getter, state integrity |
| `src/composables/useTheme.test.js` | Theme toggle, persistence, init from localStorage |
| `src/components/TaskItem.test.js` | Rendering, urgency border, done styling, events |
| `src/components/TaskForm.test.js` | Validation, submit, form clear |
| `src/components/TaskList.test.js` | Loading/empty/error states, task rendering |
| `src/App.test.js` | Mount → loadTasks, form submit → addTask |
