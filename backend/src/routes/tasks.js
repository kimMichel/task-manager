import { randomUUID } from 'crypto'
import { isValidDate, readTasks as defaultReadTasks, writeTasks as defaultWriteTasks, updateTask as defaultUpdateTask, deleteTask as defaultDeleteTask, rolloverPendingTasks as defaultRolloverPendingTasks } from '../db/json-db.js'

const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 1000
const MAX_TASKS_PER_DAY = 20
const VALID_URGENCY = new Set(['low', 'medium', 'high'])
const VALID_STATUS = new Set(['pending', 'done'])
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateDate(date, reply) {
  if (date !== undefined && !isValidDate(date)) {
    reply.code(400).send({ error: 'invalid date format, expected YYYY-MM-DD' })
    return false
  }
  return true
}

function validateUUID(id, reply) {
  if (!UUID_REGEX.test(id)) {
    reply.code(400).send({ error: 'invalid task id' })
    return false
  }
  return true
}

function validateType(value, name, type, reply) {
  if (value !== undefined && typeof value !== type) {
    reply.code(400).send({ error: `${name} must be a ${type}` })
    return false
  }
  return true
}

function validateLength(value, name, max, reply) {
  if (value !== undefined && value.length > max) {
    reply.code(400).send({ error: `${name} must be ${max} characters or fewer` })
    return false
  }
  return true
}

function validateEnum(value, name, allowed, reply) {
  if (value !== undefined && !allowed.has(value)) {
    reply.code(400).send({ error: `${name} must be one of: ${[...allowed].join(', ')}` })
    return false
  }
  return true
}

async function dbCall(fn, reply) {
  try {
    return await fn()
  } catch {
    reply.code(500).send({ error: 'Internal server error' })
    return null
  }
}

export default async function taskRoutes(fastify, opts = {}) {
  const readTasks = opts.db?.readTasks ?? defaultReadTasks
  const writeTasks = opts.db?.writeTasks ?? defaultWriteTasks
  const updateTask = opts.db?.updateTask ?? defaultUpdateTask
  const deleteTask = opts.db?.deleteTask ?? defaultDeleteTask
  const rolloverPendingTasks = opts.db?.rolloverPendingTasks ?? defaultRolloverPendingTasks

  fastify.get('/tasks', async (request, reply) => {
    const { date } = request.query
    if (!validateDate(date, reply)) return
    const today = new Date().toISOString().slice(0, 10)
    const resolvedDate = date ?? today
    if (resolvedDate === today) {
      await dbCall(() => rolloverPendingTasks(resolvedDate), reply)
    }
    return dbCall(() => readTasks(date), reply)
  })

  fastify.post('/tasks', async (request, reply) => {
    const { title, description = '', urgency, status = 'pending', date } = request.body ?? {}

    if (!validateDate(date, reply)) return
    if (!validateType(title, 'title', 'string', reply)) return
    if (!validateType(description, 'description', 'string', reply)) return

    if (!title || !title.trim()) {
      return reply.code(400).send({ error: 'title is required' })
    }

    if (!validateLength(title, 'title', MAX_TITLE_LENGTH, reply)) return
    if (!validateLength(description, 'description', MAX_DESCRIPTION_LENGTH, reply)) return

    if (urgency === undefined) {
      return reply.code(400).send({ error: 'urgency is required' })
    }
    if (!validateEnum(urgency, 'urgency', VALID_URGENCY, reply)) return
    if (!validateEnum(status, 'status', VALID_STATUS, reply)) return

    const tasks = await dbCall(() => readTasks(date), reply)
    if (tasks === null) return

    if (tasks.length >= MAX_TASKS_PER_DAY) {
      return reply.code(400).send({ error: `maximum ${MAX_TASKS_PER_DAY} tasks per day` })
    }

    const task = {
      id: randomUUID(),
      title: title.trim(),
      description,
      urgency,
      status,
      createdAt: new Date().toISOString(),
    }

    const written = await dbCall(() => writeTasks([...tasks, task], date), reply)
    if (written === null) return

    return reply.code(201).send(task)
  })

  fastify.patch('/tasks/:id', async (request, reply) => {
    const { id } = request.params
    if (!validateUUID(id, reply)) return

    const body = request.body ?? {}
    const { date } = body

    if (!validateDate(date, reply)) return
    if (!validateType(body.title, 'title', 'string', reply)) return
    if (!validateType(body.description, 'description', 'string', reply)) return
    if (!validateLength(body.title, 'title', MAX_TITLE_LENGTH, reply)) return
    if (!validateEnum(body.urgency, 'urgency', VALID_URGENCY, reply)) return
    if (!validateEnum(body.status, 'status', VALID_STATUS, reply)) return

    const updated = await dbCall(() => updateTask(date, id, body), reply)
    if (updated === null && reply.sent) return

    if (updated === null) {
      return reply.code(404).send({ error: 'Task not found' })
    }

    return updated
  })

  fastify.delete('/tasks/:id', async (request, reply) => {
    const { id } = request.params
    if (!validateUUID(id, reply)) return

    const { date } = request.query
    if (!validateDate(date, reply)) return

    const deleted = await dbCall(() => deleteTask(date, id), reply)
    if (deleted === null && reply.sent) return

    if (deleted === null) {
      return reply.code(404).send({ error: 'Task not found' })
    }

    return reply.code(204).send()
  })
}
