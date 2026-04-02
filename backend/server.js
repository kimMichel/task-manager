import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import { resolve } from 'path'
import * as db from './src/db/json-db.js'
import taskRoutes from './src/routes/tasks.js'

const PORT = Number(process.env.PORT) || 3000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
const DATA_DIR = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : undefined

const fastify = Fastify({ logger: true })

fastify.register(helmet)
fastify.register(cors, { origin: CORS_ORIGIN })

const routeDb = DATA_DIR
  ? {
      readTasks: (date) => db.readTasks(date, DATA_DIR),
      writeTasks: (tasks, date) => db.writeTasks(tasks, date, DATA_DIR),
      updateTask: (date, id, updates) => db.updateTask(date, id, updates, DATA_DIR),
      deleteTask: (date, id) => db.deleteTask(date, id, DATA_DIR),
    }
  : db

fastify.register(taskRoutes, { db: routeDb })

fastify.get('/health', async () => ({ status: 'ok' }))

fastify.listen({ port: PORT, host: '127.0.0.1' }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

