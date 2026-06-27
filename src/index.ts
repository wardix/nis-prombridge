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

import { gatewayClient } from './gateway/client'

console.log(`NIS-PromBridge starting on port ${config.PORT}`)

// Opsional: Verifikasi koneksi gateway
gatewayClient
  .get<{ status: string }>('/health')
  .then((res) => {
    if (res.status === 'ok') {
      console.log('Gateway connection verified: OK')
    } else {
      console.warn('Gateway health check returned unexpected status:', res)
    }
  })
  .catch((err) => {
    console.warn('Could not verify gateway connection at startup:', err.message)
  })

Bun.serve({
  port: config.PORT,
  fetch: app.fetch,
})
