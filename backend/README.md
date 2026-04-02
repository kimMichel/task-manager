# Task Manager — Backend

Node.js + [Fastify](https://fastify.dev/) REST API that stores daily tasks as JSON files.

## Requirements

- Node.js 18+

## Setup

```bash
npm install
```

## Running

| Command | Description |
|---|---|
| `npm start` | Production server |
| `npm run dev` | Development server with hot-reload |
| `npm test` | Run all tests |

Or use the project-level script from `task-manager/`:

```bash
./dev.sh
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `DATA_DIR` | `../data` | Directory where daily JSON files are stored |

## Data Storage

Tasks are stored as JSON files under `DATA_DIR`, one file per day:

```
data/
  2026-04-01.json
  2026-04-02.json
```

Each file is a JSON array of task objects.

## Task Schema

```json
{
  "id":          "uuid-v4",
  "title":       "string (required, max 200 chars)",
  "description": "string (optional, max 1000 chars)",
  "urgency":     "low | medium | high",
  "status":      "pending | done",
  "createdAt":   "ISO 8601 timestamp"
}
```

Limits: max **20 tasks per day**.

---

## API Reference

All endpoints accept and return `application/json`.

### Health

#### `GET /health`

```json
{ "status": "ok" }
```

---

### Tasks

#### `GET /tasks`

Returns all tasks for a given day.

**Query params**

| Param | Required | Description |
|---|---|---|
| `date` | No | `YYYY-MM-DD` — defaults to today |

**Response `200`**

```json
[
  {
    "id": "a1b2c3d4-...",
    "title": "Write tests",
    "description": "",
    "urgency": "high",
    "status": "pending",
    "createdAt": "2026-04-02T10:00:00.000Z"
  }
]
```

---

#### `POST /tasks`

Creates a new task.

**Body**

```json
{
  "title":       "Write tests",
  "description": "optional",
  "urgency":     "high",
  "status":      "pending",
  "date":        "2026-04-02"
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | Yes | Non-empty string, max 200 chars |
| `urgency` | Yes | `low`, `medium`, or `high` |
| `description` | No | Max 1000 chars |
| `status` | No | `pending` (default) or `done` |
| `date` | No | `YYYY-MM-DD` — defaults to today |

**Response `201`** — the created task object.

---

#### `PATCH /tasks/:id`

Updates fields of an existing task.

**Params** — `:id` must be a valid UUID v4.

**Body** — any subset of updatable fields:

```json
{
  "title":       "Updated title",
  "description": "Updated description",
  "urgency":     "low",
  "status":      "done",
  "date":        "2026-04-02"
}
```

`id` and `createdAt` are immutable and will be ignored if provided.

**Response `200`** — the updated task object.

---

#### `DELETE /tasks/:id`

Deletes a task.

**Params** — `:id` must be a valid UUID v4.

**Query params**

| Param | Required | Description |
|---|---|---|
| `date` | No | `YYYY-MM-DD` — defaults to today |

**Response `204`** — no body.

---

## Error Responses

All errors follow the same shape:

```json
{ "error": "descriptive message" }
```

| Status | Meaning |
|---|---|
| `400` | Validation error (see message for details) |
| `404` | Task not found |
| `500` | Internal server error |
