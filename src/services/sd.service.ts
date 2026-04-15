import { sql } from '../db/client'
import { config } from '../config'

export interface PrometheusTarget {
  targets: string[]
  labels: Record<string, string>
}

export class SDService {
  async getTicketMonitoringTargets(
    branchIds?: string[]
  ): Promise<PrometheusTarget[]> {
    // Default branch jika tidak ditentukan
    const branches =
      branchIds && branchIds.length > 0 ? branchIds : ['020', '027']

    const results = (await sql`
      SELECT 
          t.TtsId AS ticket_id, 
          t.CustServId AS subscriber_id, 
          cs.CustAccName AS subscriber_name, 
          SUBSTRING_INDEX(TRIM(cst.Network), '/', 1) AS ip_address 
      FROM Tts t 
      LEFT JOIN Customer c ON c.CustId = t.CustId 
      LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId  
      LEFT JOIN CustomerServiceTechnical cst ON cst.CustServId = t.CustServId 
      WHERE 
          t.Status = ${'Open'} 
          AND t.TtsTypeId = 6 
          AND cst.Network LIKE ${'%/32'} 
          AND FIND_IN_SET(COALESCE(c.DisplayBranchId, c.BranchId), ${branches.join(',')})
    `) as {
      ticket_id: string
      subscriber_id: string
      subscriber_name: string
      ip_address: string
    }[]

    const targets: PrometheusTarget[] = results.map((row) => ({
      targets: [row.ip_address],
      labels: {
        ip: row.ip_address,
        host: row.subscriber_name || 'Unknown',
        ticket: String(row.ticket_id),
        csid: String(row.subscriber_id),
        aspect: 'ticket_monitoring',
      },
    }))

    return targets
  }
}

export const sdService = new SDService()
