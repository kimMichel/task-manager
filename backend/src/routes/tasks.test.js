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

// ---------------------------------------------------------------------------
// GET /tasks — rollover integration
// ---------------------------------------------------------------------------

describe('GET /tasks rollover', () => {
  it('calls rolloverPendingTasks before returning today tasks', async () => {
    let rolloverCalled = false
    const db = {
      rolloverPendingTasks: async () => { rolloverCalled = true },
      readTasks: async () => [],
    }
    const today = new Date().toISOString().slice(0, 10)
    await buildApp(db).inject({ method: 'GET', url: `/tasks?date=${today}` })
    assert.equal(rolloverCalled, true)
  })

  it('does not call rolloverPendingTasks for past dates', async () => {
    let rolloverCalled = false
    const db = {
      rolloverPendingTasks: async () => { rolloverCalled = true },
      readTasks: async () => [],
    }
    await buildApp(db).inject({ method: 'GET', url: '/tasks?date=2020-01-01' })
    assert.equal(rolloverCalled, false)
  })
})

// ---------------------------------------------------------------------------
// children validation — POST /tasks
// ---------------------------------------------------------------------------

describe('POST /tasks — children validation', () => {
  it('creates a task with valid children array', async () => {
    const children = [{ title: 'Step one' }, { title: 'Step two' }]
    const created = makeTask({ children: children.map((c, i) => ({ id: `child-id-${i}`, title: c.title, done: false })) })
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children },
    })
    assert.equal(res.statusCode, 201)
    const body = res.json()
    assert.equal(body.children.length, 2)
    assert.equal(body.children[0].title, 'Step one')
    assert.equal(body.children[0].done, false)
    assert.ok(body.children[0].id, 'child id should be generated')
  })

  it('returns 400 when children array exceeds 10 items', async () => {
    const children = Array.from({ length: 11 }, (_, i) => ({ title: `Child ${i + 1}` }))
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /children/)
  })

  it('returns 400 when a child item has no title', async () => {
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children: [{ title: '' }] },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /child/)
  })

  it('returns 400 when a child item title exceeds 200 characters', async () => {
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children: [{ title: 'a'.repeat(201) }] },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /child/)
  })

  it('returns 400 when children is not an array', async () => {
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children: 'not-an-array' },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /children/)
  })

  it('creates a task with empty children array when omitted', async () => {
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low' },
    })
    assert.equal(res.statusCode, 201)
    assert.deepEqual(res.json().children, [])
  })
})

// ---------------------------------------------------------------------------
// children validation — PATCH /tasks/:id
// ---------------------------------------------------------------------------

describe('PATCH /tasks/:id — children validation', () => {
  it('updates children array on a task', async () => {
    const existing = makeTask({ children: [] })
    const updated = { ...existing, children: [{ id: 'c1', title: 'Updated child', done: true }] }
    const db = { updateTask: async () => updated }
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { children: [{ id: 'c1', title: 'Updated child', done: true }] },
    })
    assert.equal(res.statusCode, 200)
    assert.equal(res.json().children[0].title, 'Updated child')
  })

  it('returns 400 when patched children exceed 10 items', async () => {
    const db = { updateTask: async () => makeTask() }
    const children = Array.from({ length: 11 }, (_, i) => ({ id: `c${i}`, title: `Child ${i}`, done: false }))
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { children },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /children/)
  })

  it('returns 400 when a patched child item has empty title', async () => {
    const db = { updateTask: async () => makeTask() }
    const res = await buildApp(db).inject({
      method: 'PATCH',
      url: `/tasks/${VALID_UUID}`,
      payload: { children: [{ id: 'c1', title: '', done: false }] },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /child/)
  })
})

// ---------------------------------------------------------------------------
// child item description — POST /tasks
// ---------------------------------------------------------------------------

describe('POST /tasks — child description', () => {
  it('saves a child item with a description', async () => {
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children: [{ title: 'Child', description: 'Some detail' }] },
    })
    assert.equal(res.statusCode, 201)
    assert.equal(res.json().children[0].description, 'Some detail')
  })

  it('defaults child description to empty string when omitted', async () => {
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children: [{ title: 'Child' }] },
    })
    assert.equal(res.statusCode, 201)
    assert.equal(res.json().children[0].description, '')
  })

  it('returns 400 when child description exceeds 1000 characters', async () => {
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children: [{ title: 'Child', description: 'a'.repeat(1001) }] },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /child/)
  })

  it('returns 400 when child description is not a string', async () => {
    const db = { readTasks: async () => [], writeTasks: async () => {} }
    const res = await buildApp(db).inject({
      method: 'POST',
      url: '/tasks',
      payload: { title: 'Parent', urgency: 'low', children: [{ title: 'Child', description: 123 }] },
    })
    assert.equal(res.statusCode, 400)
    assert.match(res.json().error, /child/)
  })
})
