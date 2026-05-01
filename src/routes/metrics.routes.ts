import { Hono } from 'hono'
import {
  domainRegistry,
  operatorRegistry,
  dataQualityRegistry,
  metricsService,
} from '../services/metrics.service'

const router = new Hono()

router.get('/domains', async (c) => {
  await metricsService.updateDomainMetrics()
  const metrics = await domainRegistry.metrics()
  return c.text(metrics)
})

router.get('/operator-tickets', async (c) => {
  await metricsService.updateOperatorTicketMetrics()
  const metrics = await operatorRegistry.metrics()
  return c.text(metrics)
})

router.get('/data-quality', async (c) => {
  await metricsService.updateDataQualityMetrics()
  const metrics = await dataQualityRegistry.metrics()
  return c.text(metrics)
})

export default router
