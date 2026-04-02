import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTasks, createTask, updateTask, deleteTask } from './tasks.js'

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

function mockFetch(body, { status = 200 } = {}) {
  return vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }))
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// fetchTasks
// ---------------------------------------------------------------------------

describe('fetchTasks', () => {
  it('calls GET /api/tasks with no date param when none provided', async () => {
    mockFetch([])
    await fetchTasks()
    expect(fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({ method: 'GET' }))
  })

  it('appends date query param when provided', async () => {
    mockFetch([])
    await fetchTasks('2026-04-02')
    expect(fetch).toHaveBeenCalledWith('/api/tasks?date=2026-04-02', expect.objectContaining({ method: 'GET' }))
  })

  it('returns parsed JSON array on success', async () => {
    const tasks = [{ id: VALID_UUID, title: 'Test', urgency: 'low', status: 'pending' }]
    mockFetch(tasks)
    const result = await fetchTasks()
    expect(result).toEqual(tasks)
  })

  it('throws when response is not ok', async () => {
    mockFetch({ error: 'Internal server error' }, { status: 500 })
    await expect(fetchTasks()).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// createTask
// ---------------------------------------------------------------------------

describe('createTask', () => {
  it('calls POST /api/tasks with JSON headers and body', async () => {
    const payload = { title: 'New task', urgency: 'high' }
    mockFetch({ id: VALID_UUID, ...payload, status: 'pending' }, { status: 201 })
    await createTask(payload)
    expect(fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }))
  })

  it('returns the created task on success', async () => {
    const task = { id: VALID_UUID, title: 'New task', urgency: 'high', status: 'pending' }
    mockFetch(task, { status: 201 })
    const result = await createTask({ title: 'New task', urgency: 'high' })
    expect(result).toEqual(task)
  })

  it('throws when response is not ok', async () => {
    mockFetch({ error: 'title is required' }, { status: 400 })
    await expect(createTask({})).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// updateTask
// ---------------------------------------------------------------------------

describe('updateTask', () => {
  it('calls PATCH /api/tasks/:id with correct body', async () => {
    const updates = { status: 'done' }
    const updated = { id: VALID_UUID, title: 'Task', urgency: 'low', status: 'done' }
    mockFetch(updated)
    await updateTask(VALID_UUID, updates)
    expect(fetch).toHaveBeenCalledWith(`/api/tasks/${VALID_UUID}`, expect.objectContaining({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }))
  })

  it('returns the updated task on success', async () => {
    const updated = { id: VALID_UUID, title: 'Task', urgency: 'low', status: 'done' }
    mockFetch(updated)
    const result = await updateTask(VALID_UUID, { status: 'done' })
    expect(result).toEqual(updated)
  })

  it('throws when response is not ok', async () => {
    mockFetch({ error: 'Task not found' }, { status: 404 })
    await expect(updateTask(VALID_UUID, { status: 'done' })).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

describe('deleteTask', () => {
  it('calls DELETE /api/tasks/:id with no date when none provided', async () => {
    mockFetch(null, { status: 204 })
    await deleteTask(VALID_UUID)
    expect(fetch).toHaveBeenCalledWith(`/api/tasks/${VALID_UUID}`, expect.objectContaining({ method: 'DELETE' }))
  })

  it('appends date query param when provided', async () => {
    mockFetch(null, { status: 204 })
    await deleteTask(VALID_UUID, '2026-04-02')
    expect(fetch).toHaveBeenCalledWith(`/api/tasks/${VALID_UUID}?date=2026-04-02`, expect.objectContaining({ method: 'DELETE' }))
  })

  it('resolves without error on 204', async () => {
    mockFetch(null, { status: 204 })
    await expect(deleteTask(VALID_UUID)).resolves.toBeUndefined()
  })

  it('throws when response is not ok', async () => {
    mockFetch({ error: 'Task not found' }, { status: 404 })
    await expect(deleteTask(VALID_UUID)).rejects.toThrow()
  })
})
