import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import { Kafka } from 'kafkajs'
import { createLogger } from '@apex/logger'
import { ewsRouter } from './routes/ews.js'
import { EWSService } from './services/ewsService.js'

const logger = createLogger('ews-service')
const PORT = process.env['EWS_SERVICE_PORT'] ?? 3003

const prisma = new PrismaClient()
const redis  = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379')

const kafka = new Kafka({
  clientId: 'ews-service',
  brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
})
const kafkaProducer = kafka.producer()

const ewsService = new EWSService(prisma, redis, kafkaProducer)

const app = express()
app.use(helmet())
app.use(cors({ origin: (process.env['CORS_ORIGINS'] ?? '').split(','), credentials: true }))
app.use(express.json())
app.use(morgan('combined'))

app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'ews-service' }))

app.use('/api/v1/ews', ewsRouter(ewsService))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.name === 'ZodError') {
    res.status(400).json({ header: { status: 'ERROR', code: '400', message: 'Validation failed' }, body: err })
    return
  }
  logger.error('Unhandled error', { error: err.message })
  res.status(500).json({ header: { status: 'ERROR', code: '500', message: 'Internal server error' }, body: null })
})

async function start() {
  try {
    await kafkaProducer.connect()
    logger.info('Kafka producer connected')
  } catch (e) {
    logger.warn('Kafka unavailable — continuing without event publishing', { error: (e as Error).message })
  }
  app.listen(PORT, () => logger.info(`EWS service running on :${PORT}`))
}

start()

process.on('SIGTERM', async () => {
  await kafkaProducer.disconnect().catch(() => {})
  await prisma.$disconnect()
  redis.disconnect()
  process.exit(0)
})
