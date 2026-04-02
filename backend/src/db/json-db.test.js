import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, rm, readFile } from 'fs/promises'
import { join } from 'path'
import { readTasks, writeTasks, updateTask, deleteTask, isValidDate } from './json-db.js'

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
