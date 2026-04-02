import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'

const PORT = Number(process.env.PORT) || 3000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

const fastify = Fastify({ logger: true })

fastify.register(helmet)
fastify.register(cors, { origin: CORS_ORIGIN })

fastify.get('/health', async () => ({ status: 'ok' }))

fastify.listen({ port: PORT, host: '127.0.0.1' }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
