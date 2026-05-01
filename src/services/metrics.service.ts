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
    'aspect',
    'created_at',
  ],
  registers: [operatorRegistry],
})

export const dataQualityRegistry = new Registry()

export const dataQualityMissingCIDGauge = new Gauge({
  name: 'data_quality_missing_circuit_id',
  help: 'Pelanggan aktif yang belum memiliki Vendor Circuit ID',
  labelNames: ['operator', 'csid', 'host', 'status'],
  registers: [dataQualityRegistry],
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
        if (
          row.insert_timestamp === null ||
          row.insert_timestamp === undefined
        ) {
          return
        }

        const ticketNumber = row.ticket_number ?? 'pending'
        const category = row.category ?? 'unknown'
        const status = row.status ?? 'submitted'
        const host = row.subscriber_name ?? 'Unknown'

        // Format the insert_time to 'YYYY-MM-DD HH:mm'
        let createdAt = 'Unknown'
        if (row.insert_time) {
          const date = new Date(row.insert_time)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            createdAt = `${year}-${month}-${day} ${hours}:${minutes}`
          }
        }

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
            aspect: 'ticket',
            created_at: createdAt,
          },
          Number(row.insert_timestamp)
        )
      })
    } catch (error) {
      console.error('Error updating operator ticket metrics:', error)
    }
  }

  async updateDataQualityMetrics() {
    try {
      const rows = (await sql`
        SELECT 
            cstl.CustServId AS subscriber_id, 
            cs.CustAccName AS subscriber_name, 
            cstc.value AS circuit_id, 
            cs.CustStatus AS subscription_status 
        FROM CustomerServiceTechnicalCustom cstc 
        LEFT JOIN CustomerServiceTechnicalLink cstl 
            ON cstl.id = cstc.technicalTypeId 
        LEFT JOIN CustomerServices cs 
            ON cs.CustServId = cstl.CustServId 
        LEFT JOIN Customer c 
            ON c.CustId = cs.CustId 
        LEFT JOIN noc_fiber nf 
            ON nf.id = cstl.foVendorId 
        LEFT JOIN fiber_vendor fv 
            ON nf.vendorId = fv.id 
        WHERE 
            cstc.technicalType = 'link' 
            AND cstc.attribute = 'Vendor CID' 
            AND cstl.CustServId IS NOT NULL 
            AND cs.CustStatus NOT IN ('NA', 'BL') 
            AND fv.id = 1 
            AND (cstc.value = '' OR cstc.value IS NULL);
      `) as {
        subscriber_id: string | null
        subscriber_name: string | null
        circuit_id: string | null
        subscription_status: string | null
      }[]

      dataQualityMissingCIDGauge.reset()

      rows.forEach((row) => {
        const csid = String(row.subscriber_id ?? '')
        const host = row.subscriber_name ?? 'Unknown'
        const status = row.subscription_status ?? 'Unknown'

        dataQualityMissingCIDGauge.set(
          {
            operator: 'fbstar',
            csid,
            host,
            status,
          },
          1
        )
      })
    } catch (error) {
      console.error('Error updating data quality metrics:', error)
    }
  }
}

export const metricsService = new MetricsService()
