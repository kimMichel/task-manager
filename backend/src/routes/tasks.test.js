import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import taskRoutes from './tasks.js'

const VALID_UUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const OTHER_UUID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

function makeTask(overrides = {}) {
  return {
    id: VALID_UUID,
    title: 'Buy groceries',
    description: '',
    urgency: 'medium',
    status: 'pending',
    createdAt: '2026-04-02T10:00:00.000Z',
    ...overrides,
  }
}

function buildApp(db) {
  const app = Fastify({ logger: false })
  app.register(taskRoutes, { db })
  return app
}

// ---------------------------------------------------------------------------
// GET /tasks
// ---------------------------------------------------------------------------

describe('GET /tasks', () => {
  it('returns 200 with array of tasks', async () => {
    const task = makeTask()
    const db = { readTasks: async () => [task] }
    const res = await buildApp(db).inject({ method: 'GET', url: '/tasks' })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), [task])
  })

  it('passes the date query param to readTasks', async () => {
    let capturedDate
    const db = { readTasks: async (date) => { capturedDate = date; return [] } }
    await buildApp(db).inject({ method: 'GET', url: '/tasks?date=2026-04-02' })
    assert.equal(capturedDate, '2026-04-02')
  })

  it('returns 400 for an invalid date', async () => {
    const db = { readTasks: async () => [] }
    const res = await buildApp(db).inject({ method: 'GET', url: '/tasks?date=not-a-date' })
    assert.equal(res.statusCode, 400)
  })

  it('returns 500 with generic message when db throws', async () => {
    const db = { readTasks: async () => { throw new Error('disk failure') } }
    const res = await buildApp(db).inject({ method: 'GET', url: '/tasks' })
    assert.equal(res.statusCode, 500)
    assert.equal(res.json().error, 'Internal server error')
  })
})

// ---------------------------------------------------------------------------
// POST /tasks
// ---------------------------------------------------------------------------

describe('POST /tasks', () => {
  it('returns 201 with created task including id and createdAt', async () => {
    const db = { readTasks: async () => [] }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'New task', urgency: 'high' },
    })
    assert.equal(res.statusCode, 201)
    const body = res.json()
    assert.ok(body.id)
    assert.ok(body.createdAt)
    assert.equal(body.title, 'New task')
    assert.equal(body.urgency, 'high')
  })

  it('defaults status to pending when omitted', async () => {
    const db = { readTasks: async () => [] }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', urgency: 'low' },
    })
    assert.equal(res.json().status, 'pending')
  })

  it('returns 400 when title is missing', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { urgency: 'low' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /title/)
  })

  it('returns 400 when title is empty string', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: '   ', urgency: 'low' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /title/)
  })

  it('returns 400 when title is not a string', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 123, urgency: 'low' },
    })
    assert.equal(res.statusCode, 400)
  })

  it('returns 400 when description is not a string', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', description: ['array'], urgency: 'low' },
    })
    assert.equal(res.statusCode, 400)
  })

  it('returns 400 when urgency is missing', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /urgency/)
  })

  it('returns 400 when urgency is invalid', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', urgency: 'critical' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /urgency/)
  })

  it('returns 400 when status is invalid', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', urgency: 'low', status: 'in-progress' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /status/)
  })

  it('returns 400 for invalid date', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', urgency: 'low', date: 'bad-date' },
    })
    assert.equal(res.statusCode, 400)
  })

  it('returns 500 with generic message when db throws', async () => {
    const db = { readTasks: async () => { throw new Error('disk failure') } }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', urgency: 'low' },
    })
    assert.equal(res.statusCode, 500)
    assert.equal(res.json().error, 'Internal server error')
  })
})

// ---------------------------------------------------------------------------
// PATCH /tasks/:id
// ---------------------------------------------------------------------------

describe('PATCH /tasks/:id', () => {
  it('returns 200 with the updated task', async () => {
    const task = makeTask()
    const db = { updateTask: async () => ({ ...task, status: 'done' }) }
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { status: 'done' },
    })
    assert.equal(res.statusCode, 200)
    assert.equal(res.json().status, 'done')
  })

  it('returns 404 when task not found', async () => {
    const db = { updateTask: async () => null }
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { status: 'done' },
    })
    assert.equal(res.statusCode, 404)
    assert.match(res.json().error, /not found/i)
  })

  it('returns 400 for invalid UUID :id', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: '/tasks/not-a-uuid',
      payload: { status: 'done' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /invalid task id/i)
  })

  it('returns 400 for invalid date', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { date: 'bad-date', status: 'done' },
    })
    assert.equal(res.statusCode, 400)
  })

  it('returns 400 when urgency is invalid', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { urgency: 'extreme' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /urgency/)
  })

  it('returns 400 when status is invalid', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { status: 'in-progress' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /status/)
  })

  it('returns 400 when title is not a string', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { title: 99 },
    })
    assert.equal(res.statusCode, 400)
  })

  it('returns 400 when description is not a string', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { description: true },
    })
    assert.equal(res.statusCode, 400)
  })

  it('returns 500 with generic message when db throws', async () => {
    const db = { updateTask: async () => { throw new Error('disk failure') } }
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { status: 'done' },
    })
    assert.equal(res.statusCode, 500)
    assert.equal(res.json().error, 'Internal server error')
  })
})

// ---------------------------------------------------------------------------
// DELETE /tasks/:id
// ---------------------------------------------------------------------------

describe('DELETE /tasks/:id', () => {
  it('returns 204 on success', async () => {
    const task = makeTask()
    const db = { deleteTask: async () => task }
    const res = await buildApp(db).inject({
      method: 'DELETE',
      url: `/tasks/${VALID_UUID}`,
    })
    assert.equal(res.statusCode, 204)
  })

  it('passes date query param to deleteTask', async () => {
    let capturedDate
    const db = { deleteTask: async (date) => { capturedDate = date; return makeTask() } }
    await buildApp(db).inject({ method: 'DELETE', url: `/tasks/${VALID_UUID}?date=2026-04-02` })
    assert.equal(capturedDate, '2026-04-02')
  })

  it('returns 404 when task not found', async () => {
    const db = { deleteTask: async () => null }
    const res = await buildApp(db).inject({
      method: 'DELETE',
      url: `/tasks/${VALID_UUID}`,
    })
    assert.equal(res.statusCode, 404)
    assert.match(res.json().error, /not found/i)
  })

  it('returns 400 for invalid UUID :id', async () => {
    const db = {}
    const res = await buildApp(db).inject({
      method: 'DELETE',
      url: '/tasks/not-a-uuid',
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /invalid task id/i)
  })

  it('returns 400 for invalid date', async () => {
    const db = { deleteTask: async () => {} }
    const res = await buildApp(db).inject({
      method: 'DELETE',
      url: `/tasks/${VALID_UUID}?date=bad-date`,
    })
    assert.equal(res.statusCode, 400)
  })

  it('returns 500 with generic message when db throws', async () => {
    const db = { deleteTask: async () => { throw new Error('disk failure') } }
    const res = await buildApp(db).inject({
      method: 'DELETE',
      url: `/tasks/${VALID_UUID}`,
    })
    assert.equal(res.statusCode, 500)
    assert.equal(res.json().error, 'Internal server error')
  })
})

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

describe('security', () => {
  it('POST does not store extra fields (field injection)', async () => {
    let stored
    const db = {
      readTasks: async () => [],
      writeTasks: async (tasks) => { stored = tasks },
    }
    await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', urgency: 'low', isAdmin: true, __proto__: {} },
    })
    assert.equal(stored[0].isAdmin, undefined)
  })

  it('POST returns 400 when daily task cap (20) is reached', async () => {
    const full = Array.from({ length: 20 }, (_, i) => makeTask({ id: `${i}`.padStart(8, '0') + '-0000-0000-0000-000000000000' }))
    const db = { readTasks: async () => full, writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'One too many', urgency: 'low' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /maximum/)
  })

  it('POST returns 400 when title exceeds 200 characters', async () => {
    const db = { readTasks: async () => [] }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'a'.repeat(201), urgency: 'low' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /title/)
  })

  it('POST returns 400 when description exceeds 1000 characters', async () => {
    const db = { readTasks: async () => [] }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Task', urgency: 'low', description: 'a'.repeat(1001) },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /description/)
  })

  it('PATCH returns 400 for path-traversal :id', async () => {
    const db = { updateTask: async () => {} }
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: '/tasks/..%2F..%2Fetc%2Fpasswd',
      payload: { status: 'done' },
    })
    assert.equal(res.statusCode, 400)
  })

  it('DELETE returns 400 for path-traversal :id', async () => {
    const db = { deleteTask: async () => {} }
    const res = await buildApp(db).inject({
      method: 'DELETE',
      url: '/tasks/..%2F..%2Fetc%2Fpasswd',
    })
    assert.equal(res.statusCode, 400)
  })

  it('PATCH returns 400 for title exceeding 200 characters', async () => {
    const db = { updateTask: async () => {} }
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { title: 'a'.repeat(201) },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /title/)
  })
})
