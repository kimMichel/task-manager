import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from './tasks.js'
import * as api from '../api/tasks.js'

vi.mock('../api/tasks.js')

const TASK_A = { id: 'aaaaaaaa-0000-0000-0000-000000000001', title: 'Task A', urgency: 'low', status: 'pending', description: '', createdAt: '2026-04-02T10:00:00.000Z' }
const TASK_B = { id: 'bbbbbbbb-0000-0000-0000-000000000002', title: 'Task B', urgency: 'high', status: 'pending', description: '', createdAt: '2026-04-02T11:00:00.000Z' }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// loadTasks
// ---------------------------------------------------------------------------

describe('loadTasks', () => {
  it('populates tasks on success', async () => {
    api.fetchTasks.mockResolvedValue([TASK_A, TASK_B])
    const store = useTaskStore()
    await store.loadTasks()
    expect(store.tasks).toEqual([TASK_A, TASK_B])
  })

  it('sets loading true while fetching then false after', async () => {
    let resolveFetch
    api.fetchTasks.mockReturnValue(new Promise(r => { resolveFetch = r }))
    const store = useTaskStore()
    const promise = store.loadTasks()
    expect(store.loading).toBe(true)
    resolveFetch([TASK_A])
    await promise
    expect(store.loading).toBe(false)
  })

  it('sets error and clears tasks on failure', async () => {
    api.fetchTasks.mockRejectedValue(new Error('network error'))
    const store = useTaskStore()
    store.tasks = [TASK_A]
    await store.loadTasks()
    expect(store.error).toBeTruthy()
    expect(store.tasks).toEqual([])
  })

  it('passes date to fetchTasks when provided', async () => {
    api.fetchTasks.mockResolvedValue([])
    const store = useTaskStore()
    await store.loadTasks('2026-04-02')
    expect(api.fetchTasks).toHaveBeenCalledWith('2026-04-02')
  })

  it('sets loading to false even when fetch fails', async () => {
    api.fetchTasks.mockRejectedValue(new Error('network error'))
    const store = useTaskStore()
    await store.loadTasks()
    expect(store.loading).toBe(false)
  })

  it('clears error on successful retry', async () => {
    api.fetchTasks.mockRejectedValueOnce(new Error('network error'))
    api.fetchTasks.mockResolvedValueOnce([TASK_A])
    const store = useTaskStore()
    await store.loadTasks()
    expect(store.error).toBeTruthy()
    await store.loadTasks()
    expect(store.error).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// addTask
// ---------------------------------------------------------------------------

describe('addTask', () => {
  it('appends the new task to tasks', async () => {
    api.createTask.mockResolvedValue(TASK_B)
    const store = useTaskStore()
    store.tasks = [TASK_A]
    await store.addTask({ title: 'Task B', urgency: 'high' })
    expect(store.tasks).toEqual([TASK_A, TASK_B])
  })

  it('sets error on failure', async () => {
    api.createTask.mockRejectedValue(new Error('validation error'))
    const store = useTaskStore()
    await store.addTask({ title: '', urgency: 'low' })
    expect(store.error).toBeTruthy()
  })

  it('does not mutate tasks on failure', async () => {
    api.createTask.mockRejectedValue(new Error('server error'))
    const store = useTaskStore()
    store.tasks = [TASK_A]
    await store.addTask({ title: 'Bad', urgency: 'low' })
    expect(store.tasks).toEqual([TASK_A])
  })

  it('clears error on successful retry', async () => {
    api.createTask.mockRejectedValueOnce(new Error('server error'))
    api.createTask.mockResolvedValueOnce(TASK_B)
    const store = useTaskStore()
    await store.addTask({ title: 'Bad', urgency: 'low' })
    expect(store.error).toBeTruthy()
    await store.addTask({ title: 'Task B', urgency: 'high' })
    expect(store.error).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// editTask
// ---------------------------------------------------------------------------

describe('editTask', () => {
  it('replaces the updated task in tasks', async () => {
    const updated = { ...TASK_A, status: 'done' }
    api.updateTask.mockResolvedValue(updated)
    const store = useTaskStore()
    store.tasks = [TASK_A, TASK_B]
    await store.editTask(TASK_A.id, { status: 'done' })
    expect(store.tasks).toEqual([updated, TASK_B])
  })

  it('sets error on failure', async () => {
    api.updateTask.mockRejectedValue(new Error('not found'))
    const store = useTaskStore()
    store.tasks = [TASK_A]
    await store.editTask(TASK_A.id, { status: 'done' })
    expect(store.error).toBeTruthy()
  })

  it('does not mutate tasks on failure', async () => {
    api.updateTask.mockRejectedValue(new Error('not found'))
    const store = useTaskStore()
    store.tasks = [TASK_A, TASK_B]
    await store.editTask(TASK_A.id, { status: 'done' })
    expect(store.tasks).toEqual([TASK_A, TASK_B])
  })
})

// ---------------------------------------------------------------------------
// removeTask
// ---------------------------------------------------------------------------

describe('removeTask', () => {
  it('removes the task from tasks', async () => {
    api.deleteTask.mockResolvedValue()
    const store = useTaskStore()
    store.tasks = [TASK_A, TASK_B]
    await store.removeTask(TASK_A.id)
    expect(store.tasks).toEqual([TASK_B])
  })

  it('sets error on failure', async () => {
    api.deleteTask.mockRejectedValue(new Error('not found'))
    const store = useTaskStore()
    store.tasks = [TASK_A]
    await store.removeTask(TASK_A.id)
    expect(store.error).toBeTruthy()
  })

  it('does not mutate tasks on failure', async () => {
    api.deleteTask.mockRejectedValue(new Error('not found'))
    const store = useTaskStore()
    store.tasks = [TASK_A, TASK_B]
    await store.removeTask(TASK_A.id)
    expect(store.tasks).toEqual([TASK_A, TASK_B])
  })

  it('passes date to deleteTask when provided', async () => {
    api.deleteTask.mockResolvedValue()
    const store = useTaskStore()
    store.tasks = [TASK_A]
    await store.removeTask(TASK_A.id, '2026-04-02')
    expect(api.deleteTask).toHaveBeenCalledWith(TASK_A.id, '2026-04-02')
  })
})
