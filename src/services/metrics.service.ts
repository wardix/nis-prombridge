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
}

export const metricsService = new MetricsService()
