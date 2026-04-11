import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { PrismaClient } from '@prisma/client'
import { Kafka } from 'kafkajs'
import { createLogger } from '@apex/logger'
import { errorHandler, attachRequestId } from '@apex/middleware'
import { AMLService } from './services/amlService.js'
import { amlRouter } from './routes/aml.js'

const logger = createLogger('aml-service')
const PORT = process.env['AML_SERVICE_PORT'] ?? 3004
const prisma = new PrismaClient()
const kafka = new Kafka({ clientId: 'aml-service', brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(',') })
const producer = kafka.producer()
const amlService = new AMLService(prisma, producer)

const app = express()
app.use(helmet())
app.use(cors({ origin: (process.env['CORS_ORIGINS'] ?? '').split(','), credentials: true }))
app.use(express.json())
app.use(morgan('combined'))
app.use(attachRequestId)

app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'aml-service' }))
app.use('/api/v1/aml', amlRouter(amlService))
app.use(errorHandler)

async function start() {
  try { await producer.connect(); logger.info('Kafka producer connected') }
  catch (e) { logger.warn('Kafka unavailable', { error: (e as Error).message }) }
  app.listen(PORT, () => logger.info(`AML service on :${PORT}`))
}
start()
process.on('SIGTERM', async () => { await producer.disconnect().catch(() => {}); await prisma.$disconnect(); process.exit(0) })
