import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, rm, readFile } from 'fs/promises'
import { join } from 'path'
import { readTasks, writeTasks, updateTask, deleteTask, isValidDate, rolloverPendingTasks } from './json-db.js'

const TEST_DIR = join(process.cwd(), 'src/db/test-data')

const TASK_A = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  title: 'Task A',
  description: 'First task',
  urgency: 'high',
  status: 'pending',
  createdAt: '2026-04-02T10:00:00.000Z',
}

const TASK_B = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  title: 'Task B',
  description: '',
  urgency: 'low',
  status: 'pending',
  createdAt: '2026-04-02T11:00:00.000Z',
}

before(async () => {
  await mkdir(TEST_DIR, { recursive: true })
})

after(async () => {
  await rm(TEST_DIR, { recursive: true, force: true })
})

describe('isValidDate', () => {
  it('returns true for a valid date', () => {
    assert.equal(isValidDate('2026-04-02'), true)
  })

  it('returns false for wrong format DD-MM-YYYY', () => {
    assert.equal(isValidDate('02-04-2026'), false)
  })

  it('returns false for slash-separated format', () => {
    assert.equal(isValidDate('2026/04/02'), false)
  })

  it('returns false for non-date string', () => {
    assert.equal(isValidDate('abc'), false)
  })

  it('returns false for invalid month', () => {
    assert.equal(isValidDate('2026-13-01'), false)
  })

  it('returns false for invalid day (Feb 30)', () => {
    assert.equal(isValidDate('2026-02-30'), false)
  })
})

describe('readTasks', () => {
  it('returns [] when the file does not exist', async () => {
    const result = await readTasks('2000-01-01', TEST_DIR)
    assert.deepEqual(result, [])
  })

  it('returns parsed tasks when the file exists', async () => {
    await writeTasks([TASK_A], '2026-04-01', TEST_DIR)
    const result = await readTasks('2026-04-01', TEST_DIR)
    assert.deepEqual(result, [TASK_A])
  })
})

describe('writeTasks', () => {
  it('writes tasks and can be read back (round-trip)', async () => {
    await writeTasks([TASK_A, TASK_B], '2026-04-02', TEST_DIR)
    const result = await readTasks('2026-04-02', TEST_DIR)
    assert.deepEqual(result, [TASK_A, TASK_B])
  })

  it('overwrites the file on second write', async () => {
    await writeTasks([TASK_A], '2026-04-03', TEST_DIR)
    await writeTasks([TASK_B], '2026-04-03', TEST_DIR)
    const result = await readTasks('2026-04-03', TEST_DIR)
    assert.deepEqual(result, [TASK_B])
  })
})

describe('updateTask', () => {
  it('updates matching fields on the correct task', async () => {
    await writeTasks([TASK_A, TASK_B], '2026-04-04', TEST_DIR)
    const updated = await updateTask('2026-04-04', TASK_A.id, { status: 'done', urgency: 'low' }, TEST_DIR)
    assert.equal(updated.status, 'done')
    assert.equal(updated.urgency, 'low')
  })

  it('preserves other tasks untouched', async () => {
    await writeTasks([TASK_A, TASK_B], '2026-04-05', TEST_DIR)
    await updateTask('2026-04-05', TASK_A.id, { status: 'done' }, TEST_DIR)
    const tasks = await readTasks('2026-04-05', TEST_DIR)
    assert.deepEqual(tasks.find((t) => t.id === TASK_B.id), TASK_B)
  })

  it('does not overwrite id or createdAt', async () => {
    await writeTasks([TASK_A], '2026-04-06', TEST_DIR)
    const updated = await updateTask(
      '2026-04-06',
      TASK_A.id,
      { id: 'evil-id', createdAt: '1970-01-01T00:00:00.000Z', title: 'Changed' },
      TEST_DIR,
    )
    assert.equal(updated.id, TASK_A.id)
    assert.equal(updated.createdAt, TASK_A.createdAt)
    assert.equal(updated.title, 'Changed')
  })

  it('returns null when task id is not found', async () => {
    await writeTasks([TASK_A], '2026-04-07', TEST_DIR)
    const result = await updateTask('2026-04-07', 'nonexistent-id', { status: 'done' }, TEST_DIR)
    assert.equal(result, null)
  })
})

describe('deleteTask', () => {
  it('removes the task with matching id and returns it', async () => {
    await writeTasks([TASK_A, TASK_B], '2026-04-08', TEST_DIR)
    const deleted = await deleteTask('2026-04-08', TASK_A.id, TEST_DIR)
    assert.deepEqual(deleted, TASK_A)
  })

  it('preserves remaining tasks after deletion', async () => {
    await writeTasks([TASK_A, TASK_B], '2026-04-09', TEST_DIR)
    await deleteTask('2026-04-09', TASK_A.id, TEST_DIR)
    const tasks = await readTasks('2026-04-09', TEST_DIR)
    assert.deepEqual(tasks, [TASK_B])
  })

  it('returns null when task id is not found', async () => {
    await writeTasks([TASK_A], '2026-04-10', TEST_DIR)
    const result = await deleteTask('2026-04-10', 'nonexistent-id', TEST_DIR)
    assert.equal(result, null)
  })
})

describe('security — path traversal', () => {
  const maliciousDate = '../../etc/passwd'

  it('readTasks throws on path traversal date', async () => {
    await assert.rejects(() => readTasks(maliciousDate, TEST_DIR))
  })

  it('writeTasks throws on path traversal date', async () => {
    await assert.rejects(() => writeTasks([TASK_A], maliciousDate, TEST_DIR))
  })

  it('writeTasks does not create any file outside the data dir', async () => {
    try { await writeTasks([TASK_A], maliciousDate, TEST_DIR) } catch {}
    await assert.rejects(
      () => readFile(join(TEST_DIR, '../../etc/passwd')),
      'malicious file should not exist',
    )
  })

  it('updateTask throws on path traversal date', async () => {
    await assert.rejects(() => updateTask(maliciousDate, TASK_A.id, { status: 'done' }, TEST_DIR))
  })

  it('deleteTask throws on path traversal date', async () => {
    await assert.rejects(() => deleteTask(maliciousDate, TASK_A.id, TEST_DIR))
  })
})

// ---------------------------------------------------------------------------
// rolloverPendingTasks
// ---------------------------------------------------------------------------

describe('rolloverPendingTasks', () => {
  const TODAY = '2026-04-03'
  const YESTERDAY = '2026-04-02'

  const PENDING_HIGH   = { id: 'h1h1h1h1-0000-0000-0000-000000000001', title: 'High task',   urgency: 'high',   status: 'pending', createdAt: '2026-04-02T08:00:00.000Z', description: '' }
  const PENDING_MEDIUM = { id: 'm2m2m2m2-0000-0000-0000-000000000002', title: 'Medium task', urgency: 'medium', status: 'pending', createdAt: '2026-04-02T09:00:00.000Z', description: '' }
  const PENDING_LOW    = { id: 'l3l3l3l3-0000-0000-0000-000000000003', title: 'Low task',    urgency: 'low',    status: 'pending', createdAt: '2026-04-02T10:00:00.000Z', description: '' }
  const DONE_TASK      = { id: 'd4d4d4d4-0000-0000-0000-000000000004', title: 'Done task',   urgency: 'high',   status: 'done',    createdAt: '2026-04-02T11:00:00.000Z', description: '' }

  it('moves all pending tasks from yesterday to today when space is available', async () => {
    await writeTasks([PENDING_HIGH, PENDING_LOW], YESTERDAY, TEST_DIR)
    await writeTasks([], TODAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const today = await readTasks(TODAY, TEST_DIR)
    assert.equal(today.length, 2)
  })

  it('preserves createdAt from the original task', async () => {
    await writeTasks([PENDING_HIGH], YESTERDAY, TEST_DIR)
    await writeTasks([], TODAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const today = await readTasks(TODAY, TEST_DIR)
    assert.equal(today[0].createdAt, PENDING_HIGH.createdAt)
  })

  it('does not move done tasks from yesterday', async () => {
    await writeTasks([DONE_TASK, PENDING_LOW], YESTERDAY, TEST_DIR)
    await writeTasks([], TODAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const today = await readTasks(TODAY, TEST_DIR)
    assert.equal(today.length, 1)
    assert.equal(today[0].id, PENDING_LOW.id)
  })

  it('removes moved tasks from yesterday file', async () => {
    await writeTasks([PENDING_HIGH, PENDING_LOW], YESTERDAY, TEST_DIR)
    await writeTasks([], TODAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const yesterday = await readTasks(YESTERDAY, TEST_DIR)
    assert.equal(yesterday.length, 0)
  })

  it('leaves done tasks in yesterday file after rollover', async () => {
    await writeTasks([DONE_TASK, PENDING_LOW], YESTERDAY, TEST_DIR)
    await writeTasks([], TODAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const yesterday = await readTasks(YESTERDAY, TEST_DIR)
    assert.equal(yesterday.length, 1)
    assert.equal(yesterday[0].id, DONE_TASK.id)
  })

  it('fills up to 20 tasks, leaving excess in yesterday by urgency order', async () => {
    const existing = Array.from({ length: 18 }, (_, i) => ({
      id: `eeeeeeee-0000-0000-0000-${String(i).padStart(12, '0')}`,
      title: `Existing ${i}`, urgency: 'low', status: 'pending',
      createdAt: '2026-04-03T07:00:00.000Z', description: '',
    }))
    await writeTasks(existing, TODAY, TEST_DIR)
    await writeTasks([PENDING_LOW, PENDING_MEDIUM, PENDING_HIGH], YESTERDAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const today = await readTasks(TODAY, TEST_DIR)
    const yesterday = await readTasks(YESTERDAY, TEST_DIR)
    assert.equal(today.length, 20)
    assert.equal(yesterday.length, 1)
    assert.equal(yesterday[0].id, PENDING_LOW.id)
  })

  it('rolls over by urgency order: high before medium before low', async () => {
    const existing = Array.from({ length: 19 }, (_, i) => ({
      id: `eeeeeeee-0000-0000-0000-${String(i).padStart(12, '0')}`,
      title: `Existing ${i}`, urgency: 'low', status: 'pending',
      createdAt: '2026-04-03T07:00:00.000Z', description: '',
    }))
    await writeTasks(existing, TODAY, TEST_DIR)
    await writeTasks([PENDING_LOW, PENDING_MEDIUM, PENDING_HIGH], YESTERDAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const today = await readTasks(TODAY, TEST_DIR)
    const rolledOver = today.slice(19)
    assert.equal(rolledOver[0].urgency, 'high')
  })

  it('does nothing if today is already at 20 tasks', async () => {
    const full = Array.from({ length: 20 }, (_, i) => ({
      id: `ffffffff-0000-0000-0000-${String(i).padStart(12, '0')}`,
      title: `Full ${i}`, urgency: 'low', status: 'pending',
      createdAt: '2026-04-03T07:00:00.000Z', description: '',
    }))
    await writeTasks(full, TODAY, TEST_DIR)
    await writeTasks([PENDING_HIGH], YESTERDAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const today = await readTasks(TODAY, TEST_DIR)
    const yesterday = await readTasks(YESTERDAY, TEST_DIR)
    assert.equal(today.length, 20)
    assert.equal(yesterday.length, 1)
  })

  it('does nothing if yesterday has no pending tasks', async () => {
    await writeTasks([DONE_TASK], YESTERDAY, TEST_DIR)
    await writeTasks([], TODAY, TEST_DIR)
    await rolloverPendingTasks(TODAY, TEST_DIR)
    const today = await readTasks(TODAY, TEST_DIR)
    assert.equal(today.length, 0)
  })
})
