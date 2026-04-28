import { Hono } from 'hono'
import { sdService } from '../services/sd.service'

const router = new Hono()

// Helper to get branch list from query params
const getBranchList = (c: any): string[] | undefined => {
  const branchParam = c.req.query('branch')
  const branchesParam = c.req.queries('branch')

  if (branchesParam && branchesParam.length > 0) {
    return branchesParam
  }
  if (branchParam) {
    return branchParam.split(',')
  }
  return undefined
}

router.get('/ticket-monitoring', async (c) => {
  const branchList = getBranchList(c)
  const targets = await sdService.getTicketMonitoringTargets(branchList)
  return c.json(targets)
})

router.get('/iforte-fttx', async (c) => {
  const branchList = getBranchList(c)
  const targets = await sdService.getIforteFttxTargets(branchList)
  return c.json(targets)
})

router.get('/fbstar-fttx', async (c) => {
  const branchList = getBranchList(c)
  const targets = await sdService.getFbstarFttxTargets(branchList)
  return c.json(targets)
})

export default router
