import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { config } from './config'
import sdRoutes from './routes/sd.routes'
import metricsRoutes from './routes/metrics.routes'

const app = new Hono()

// Middlewares
app.use('*', logger())

// Routes
app.get('/', (c) => c.text('NIS-PromBridge is running!'))
app.route('/sd', sdRoutes)
app.route('/metrics', metricsRoutes)

console.log(`NIS-PromBridge starting on port ${config.PORT}`)

export default {
  port: config.PORT,
  fetch: app.fetch,
}
