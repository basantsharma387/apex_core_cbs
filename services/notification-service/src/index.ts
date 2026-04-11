import express from 'express'
import { Kafka } from 'kafkajs'
import { createLogger } from '@apex/logger'

const logger = createLogger('notification-service')
const PORT = process.env['NOTIFICATION_SERVICE_PORT'] ?? 3009

const kafka = new Kafka({ clientId: 'notification-service', brokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(',') })
const consumer = kafka.consumer({ groupId: 'notification-group' })

const app = express()
app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'notification-service' }))
app.listen(PORT, () => logger.info(`Notification service on :${PORT}`))

async function startConsumer() {
  try {
    await consumer.connect()
    await consumer.subscribe({ topics: ['ews.alert.high','aml.transaction.flagged','loans.application.approved','documents.approved'], fromBeginning: false })
    await consumer.run({ eachMessage: async ({ topic, message }) => {
      const payload = JSON.parse(message.value?.toString() ?? '{}') as { eventType: string; tenantId: string; payload: unknown }
      logger.info('Notification triggered', { topic, tenantId: payload.tenantId })
      // In production: send FCM push, email via SES/SendGrid
    }})
    logger.info('Notification consumer running')
  } catch (e) { logger.warn('Kafka consumer unavailable', { error: (e as Error).message }) }
}
startConsumer()
