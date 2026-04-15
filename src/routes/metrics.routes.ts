import { Hono } from 'hono'
import { domainRegistry, metricsService } from '../services/metrics.service'

const router = new Hono()

router.get('/domains', async (c) => {
  await metricsService.updateDomainMetrics()
  const metrics = await domainRegistry.metrics()
  return c.text(metrics)
})

export default router
