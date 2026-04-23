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

  async getIforteFttxTargets(
    branchIds?: string[]
  ): Promise<PrometheusTarget[]> {
    // Default branch jika tidak ditentukan
    const branches =
      branchIds && branchIds.length > 0
        ? branchIds
        : ['020', '027', '028', '029']

    const results = (await sql`
      SELECT 
          cs.CustServId AS subscriber_id, 
          cs.CustAccName AS subscriber_name, 
          SUBSTRING_INDEX(TRIM(cst.Network), '/', 1) AS ip_address 
      FROM CustomerServiceTechnical cst 
      LEFT JOIN CustomerServices cs ON cs.CustServId = cst.CustServId 
      LEFT JOIN CustomerServiceTechnicalLink cstl ON cstl.custServId = cst.CustServId 
      LEFT JOIN noc_fiber nf ON nf.id = cstl.foVendorId 
      LEFT JOIN fiber_vendor fv ON fv.id = nf.vendorId 
      LEFT JOIN Customer c ON c.CustId = cs.CustId 
      WHERE 
          fv.name = ${'Iforte'} 
          AND cs.CustStatus IN ('AC', 'FR') 
          AND cst.Network LIKE ${'%/32'} 
          AND FIND_IN_SET(COALESCE(c.DisplayBranchId, c.BranchId), ${branches.join(',')})
    `) as {
      subscriber_id: string
      subscriber_name: string
      ip_address: string
    }[]

    const targets: PrometheusTarget[] = results.map((row) => ({
      targets: [row.ip_address],
      labels: {
        ip: row.ip_address,
        host: row.subscriber_name || 'Unknown',
        csid: String(row.subscriber_id),
        aspect: 'fttx',
        operator: 'Iforte',
      },
    }))

    return targets
  }
}

export const sdService = new SDService()
