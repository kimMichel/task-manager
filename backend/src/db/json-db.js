import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, resolve } from 'path'

const DEFAULT_DATA_DIR = join(process.cwd(), '..', 'data')

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const ALLOWED_UPDATE_FIELDS = new Set(['title', 'description', 'urgency', 'status', 'children'])

export function isValidDate(date) {
  if (!DATE_REGEX.test(date)) return false
  const d = new Date(date)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date
}

function resolveFilePath(date, dataDir) {
  const dir = resolve(dataDir ?? DEFAULT_DATA_DIR)
  const day = date ?? new Date().toISOString().slice(0, 10)
  const filePath = join(dir, `${day}.json`)
  if (!filePath.startsWith(dir + '/') && filePath !== dir) {
    throw new Error('Invalid date: path traversal detected')
  }
  return { filePath, dir }
}

export async function readTasks(date, dataDir) {
  const { filePath } = resolveFilePath(date, dataDir)
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function writeTasks(tasks, date, dataDir) {
  const { filePath, dir } = resolveFilePath(date, dataDir)
  await mkdir(dir, { recursive: true })
  await writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8')
}

export async function updateTask(date, id, updates, dataDir) {
  const tasks = await readTasks(date, dataDir)
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) return null

  const safeUpdates = {}
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (field in updates) safeUpdates[field] = updates[field]
  }

  tasks[index] = { ...tasks[index], ...safeUpdates }
  await writeTasks(tasks, date, dataDir)
  return tasks[index]
}

export async function deleteTask(date, id, dataDir) {
  const tasks = await readTasks(date, dataDir)
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) return null

  const [deleted] = tasks.splice(index, 1)
  await writeTasks(tasks, date, dataDir)
  return deleted
}

const URGENCY_ORDER = { high: 0, medium: 1, low: 2 }
const MAX_TASKS = 20

export async function rolloverPendingTasks(todayDate, dataDir) {
  const d = new Date(todayDate)
  d.setUTCDate(d.getUTCDate() - 1)
  const yesterdayDate = d.toISOString().slice(0, 10)

  const [todayTasks, yesterdayTasks] = await Promise.all([
    readTasks(todayDate, dataDir),
    readTasks(yesterdayDate, dataDir),
  ])

  const pendingYesterday = yesterdayTasks
    .filter((t) => t.status === 'pending')
    .sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3))

  const slots = MAX_TASKS - todayTasks.length
  if (slots <= 0 || pendingYesterday.length === 0) return

  const toMove = pendingYesterday.slice(0, slots)
  const toKeep = pendingYesterday.slice(slots)
  const done = yesterdayTasks.filter((t) => t.status !== 'pending')

  await Promise.all([
    writeTasks([...todayTasks, ...toMove], todayDate, dataDir),
    writeTasks([...done, ...toKeep], yesterdayDate, dataDir),
  ])
}
