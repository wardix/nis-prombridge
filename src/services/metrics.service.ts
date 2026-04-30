import { Registry, Gauge } from 'prom-client'
import { sql } from '../db/client'

// Domain Expiry Metrics Registry (Very Low Frequency)
export const domainRegistry = new Registry()

export const domainExpiryGauge = new Gauge({
  name: 'domain_expiry_timestamp',
  help: 'Unix timestamp of domain expiration date',
  labelNames: ['domain', 'expiry', 'csid', 'aspect', 'dependent_service'],
  registers: [domainRegistry],
})

// Operator Ticket Metrics Registry (SLA monitoring for operator/vendor tickets)
export const operatorRegistry = new Registry()

export const operatorTicketGauge = new Gauge({
  name: 'operator_ticket_created_timestamp_seconds',
  help: 'Unix timestamp when the operator ticket was created',
  labelNames: [
    'operator',
    'ticket',
    'csid',
    'host',
    'request_number',
    'ticket_number',
    'category',
    'status',
  ],
  registers: [operatorRegistry],
})

export class MetricsService {
  async updateDomainMetrics() {
    try {
      // Query 1: Mengambil data domain yang akan kadaluarsa
      const results = (await sql`
        SELECT 
            cs.CustDomain AS domain, 
            cs.CustServId AS subscriber_id, 
            cs.DomainExpireDate AS expiry_date,
            UNIX_TIMESTAMP(cs.DomainExpireDate) as expiry_timestamp
        FROM CustomerServices cs 
        LEFT JOIN Customer c ON cs.CustId = c.CustId 
        WHERE 
            c.BranchId = '020' 
            AND cs.CustStatus != 'NA' 
            AND cs.DomainExpireDate < CURDATE() + INTERVAL 60 DAY
            AND cs.ServiceId IN (
                SELECT ServiceId 
                FROM Services 
                WHERE ServiceGroup = 'DO'
            )
      `) as {
        domain: string
        subscriber_id: string
        expiry_date: Date | string
        expiry_timestamp: number
      }[]

      // Query 2: Mengambil layanan dependen yang terkait dengan domain (dari @z.sql)
      const dependentServices = (await sql`
        SELECT 
            cs.CustDomain AS domain, 
            MAX(cs.ServiceId) AS service_id
        FROM CustomerServices AS cs
        INNER JOIN Services AS s 
            ON s.ServiceId = cs.ServiceId
        WHERE 
            cs.CustDomain NOT IN ('', '-')
            AND cs.CustStatus IN ('AC', 'FR')
            AND cs.InvoiceType != 8
            AND s.ServiceGroup != 'DO'
        GROUP BY 
            cs.CustDomain
      `) as {
        domain: string
        service_id: number
      }[]

      // Memetakan domain ke dependent service_id untuk akses cepat
      const dependentServiceMap = new Map<string, string>()
      dependentServices.forEach((ds) => {
        dependentServiceMap.set(ds.domain, String(ds.service_id))
      })

      domainExpiryGauge.reset()
      results.forEach((row) => {
        if (!row.domain || row.expiry_timestamp === null) {
          return
        }

        // Memastikan format tanggal YYYY-MM-DD untuk label
        const dateObj = new Date(row.expiry_date)
        const dateString = dateObj.toISOString().split('T')[0]

        // Ambil dependent_service dari map atau set 'none'
        const dependentService = dependentServiceMap.get(row.domain) || 'none'

        domainExpiryGauge.set(
          {
            domain: row.domain,
            expiry: dateString,
            csid: String(row.subscriber_id),
            aspect: 'domain_monitoring',
            dependent_service: dependentService,
          },
          row.expiry_timestamp
        )
      })
    } catch (error) {
      console.error('Error updating domain metrics:', error)
    }
  }

  // New: Update operator/vendor ticket metrics for SLA monitoring
  async updateOperatorTicketMetrics() {
    try {
      const rows = (await sql`
        SELECT 
          fvt.insert_time,
          UNIX_TIMESTAMP(fvt.insert_time) AS insert_timestamp,
          cs.CustServId AS subscriber_id,
          cs.CustAccName AS subscriber_name,
          fvt.vendor_ticket_number AS request_number,
          fvt.vendor_escalation_ticket_number AS ticket_number,
          fvt.vendor_ticket_category AS category,
          fvt.vendor_ticket_status AS status,
          fvt.ticket_id
        FROM FiberVendorTickets fvt
        LEFT JOIN Tts t ON t.TtsId = fvt.ticket_id
        LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
        WHERE 
          fvt.fiber_vendor_id = 1
          AND t.Status NOT IN ('Call', 'Pending', 'Cancel', 'Closed')
      `) as {
        insert_time: Date | string | null
        insert_timestamp: number | null
        subscriber_id: string | null
        subscriber_name: string | null
        request_number: string | null
        ticket_number: string | null
        category: string | null
        status: string | null
        ticket_id: string | null
      }[]

      operatorTicketGauge.reset()

      rows.forEach((row) => {
        if (row.insert_timestamp === null || row.insert_timestamp === undefined) {
          return
        }

        const ticketNumber = row.ticket_number ?? 'pending'
        const category = row.category ?? 'unknown'
        const status = row.status ?? 'submitted'
        const host = row.subscriber_name ?? 'Unknown'

        operatorTicketGauge.set(
          {
            operator: 'fbstar',
            ticket: String(row.ticket_id ?? ''),
            csid: String(row.subscriber_id ?? ''),
            host,
            request_number: String(row.request_number ?? ''),
            ticket_number: ticketNumber,
            category,
            status,
          },
          Number(row.insert_timestamp)
        )
      })
    } catch (error) {
      console.error('Error updating operator ticket metrics:', error)
    }
  }
}

export const metricsService = new MetricsService()
