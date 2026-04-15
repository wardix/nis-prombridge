import { Hono } from 'hono'
import { sdService } from '../services/sd.service'

const router = new Hono()

router.get('/ticket-monitoring', async (c) => {
  // Mendukung ?branch=020,027 atau ?branch=020&branch=027
  const branchParam = c.req.query('branch')
  const branchesParam = c.req.queries('branch')

  let branchList: string[] | undefined

  if (branchesParam && branchesParam.length > 0) {
    branchList = branchesParam
  } else if (branchParam) {
    branchList = branchParam.split(',')
  }

  const targets = await sdService.getTicketMonitoringTargets(branchList)
  return c.json(targets)
})

export default router
