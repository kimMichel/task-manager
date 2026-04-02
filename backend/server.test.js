import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { rm } from 'fs/promises'
import { resolve } from 'path'
import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import * as db from './src/db/json-db.js'
import taskRoutes from './src/routes/tasks.js'

const DATA_TEST_DIR = resolve('./data-integration-test')
const CORS_ORIGIN = 'http://localhost:5173'

function buildApp() {
  const app = Fastify({ logger: false })
  app.register(helmet)
  app.register(cors, { origin: CORS_ORIGIN })

  const testDb = {
    readTasks: (date) => db.readTasks(date, DATA_TEST_DIR),
    writeTasks: (tasks, date) => db.writeTasks(tasks, date, DATA_TEST_DIR),
    updateTask: (date, id, updates) => db.updateTask(date, id, updates, DATA_TEST_DIR),
    deleteTask: (date, id) => db.deleteTask(date, id, DATA_TEST_DIR),
  }

  app.register(taskRoutes, { db: testDb })
  app.get('/health', async () => ({ status: 'ok' }))
  return app
}

before(async () => {
  await rm(DATA_TEST_DIR, { recursive: true, force: true })
})

after(async () => {
  await rm(DATA_TEST_DIR, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await buildApp().inject({ method: 'GET', url: '/health' })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), { status: 'ok' })
  })
})

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

describe('security headers', () => {
  it('sets X-Content-Type-Options: nosniff', async () => {
    const res = await buildApp().inject({ method: 'GET', url: '/health' })
    assert.equal(res.headers['x-content-type-options'], 'nosniff')
  })

  it('sets X-Frame-Options header', async () => {
    const res = await buildApp().inject({ method: 'GET', url: '/health' })
    assert.ok(res.headers['x-frame-options'])
  })

  it('sets Content-Security-Policy header', async () => {
    const res = await buildApp().inject({ method: 'GET', url: '/health' })
    assert.ok(res.headers['content-security-policy'])
  })

  it('sets Referrer-Policy header', async () => {
    const res = await buildApp().inject({ method: 'GET', url: '/health' })
    assert.ok(res.headers['referrer-policy'])
  })
})

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

describe('CORS', () => {
  it('allowed origin receives Access-Control-Allow-Origin header', async () => {
    const res = await buildApp().inject({
      method: 'GET',
      url: '/tasks',
      headers: { origin: CORS_ORIGIN },
    })
    assert.equal(res.headers['access-control-allow-origin'], CORS_ORIGIN)
  })

  it('OPTIONS preflight with allowed origin returns 204', async () => {
    const res = await buildApp().inject({
      method: 'OPTIONS',
      url: '/tasks',
      headers: {
        origin: CORS_ORIGIN,
        'access-control-request-method': 'POST',
      },
    })
    assert.equal(res.statusCode, 204)
  })
})

// ---------------------------------------------------------------------------
// Task routes — end-to-end with real file system
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().slice(0, 10)
const TOMORROW = (() => {
  const [y, m, d] = TODAY.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
})()

describe('task routes — end-to-end', () => {
  beforeEach(async () => {
    await rm(DATA_TEST_DIR, { recursive: true, force: true })
  })

  it('GET /tasks on a fresh day returns empty array', async () => {
    const res = await buildApp().inject({
      method: 'GET',
      url: `/tasks?date=${TODAY}`,
    })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), [])
  })

  it('POST creates task and returns 201 with id and createdAt', async () => {
    const res = await buildApp().inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Buy milk', urgency: 'low', date: TODAY },
    })
    assert.equal(res.statusCode, 201)
    const task = res.json()
    assert.ok(task.id)
    assert.ok(task.createdAt)
    assert.equal(task.title, 'Buy milk')
    assert.equal(task.urgency, 'low')
    assert.equal(task.status, 'pending')
  })

  it('GET after POST returns the created task', async () => {
    const app = buildApp()
    await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Read a book', urgency: 'medium', date: TODAY },
    })
    const res = await app.inject({ method: 'GET', url: `/tasks?date=${TODAY}` })
    assert.equal(res.statusCode, 200)
    const tasks = res.json()
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].title, 'Read a book')
  })

  it('PATCH updates a task and change persists in GET', async () => {
    const app = buildApp()
    const post = await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Exercise', urgency: 'high', date: TODAY },
    })
    const { id } = post.json()

    await app.inject({
      method: 'PATCH',
      url: `/tasks/${id}`,
      payload: { status: 'done', date: TODAY },
    })

    const res = await app.inject({ method: 'GET', url: `/tasks?date=${TODAY}` })
    const task = res.json().find((t) => t.id === id)
    assert.equal(task.status, 'done')
  })

  it('DELETE removes the task and it is absent in next GET', async () => {
    const app = buildApp()
    const post = await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Call dentist', urgency: 'medium', date: TODAY },
    })
    const { id } = post.json()

    const del = await app.inject({
      method: 'DELETE',
      url: `/tasks/${id}?date=${TODAY}`,
    })
    assert.equal(del.statusCode, 204)

    const res = await app.inject({ method: 'GET', url: `/tasks?date=${TODAY}` })
    assert.deepEqual(res.json(), [])
  })

  it('multiple POSTs all appear in GET', async () => {
    const app = buildApp()
    for (const title of ['Task A', 'Task B', 'Task C']) {
      await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title, urgency: 'low', date: TODAY },
      })
    }
    const res = await app.inject({ method: 'GET', url: `/tasks?date=${TODAY}` })
    assert.equal(res.json().length, 3)
  })

  it('tasks are scoped to day — POST on today absent when GET tomorrow', async () => {
    const app = buildApp()
    await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Today only', urgency: 'low', date: TODAY },
    })
    const res = await app.inject({ method: 'GET', url: `/tasks?date=${TOMORROW}` })
    assert.deepEqual(res.json(), [])
  })

  it('returns 400 after reaching the 20-task daily cap', async () => {
    const app = buildApp()
    for (let i = 0; i < 20; i++) {
      await app.inject({
        method: 'POST',
        url: '/tasks',
        payload: { title: `Task ${i}`, urgency: 'low', date: TODAY },
      })
    }
    const res = await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'One too many', urgency: 'low', date: TODAY },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /maximum/)
  })

  it('POST with invalid urgency returns 400 end-to-end', async () => {
    const res = await buildApp().inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', urgency: 'whenever', date: TODAY },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /urgency/)
  })

  it('PATCH on non-existent id returns 404 end-to-end', async () => {
    const res = await buildApp().inject({
      method: 'PATCH',
      url: '/tasks/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      payload: { status: 'done', date: TODAY },
    })
    assert.equal(res.statusCode, 404)
    assert.match(res.json().error, /not found/i)
  })
})
