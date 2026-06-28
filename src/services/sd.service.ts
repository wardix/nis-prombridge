import { config } from '../config'
import { gatewayClient } from '../gateway/client'

export interface PrometheusTarget {
  targets: string[]
  labels: Record<string, string>
}

interface FttxTarget {
  subscriber_id: string
  subscriber_name: string
  ip_address: string
  circuit_id: string | null
}

interface TicketMonitoringTarget {
  ticket_id: string
  subscriber_id: string
  subscriber_name: string
  ip_address: string
}

export class SDService {
  async getTicketMonitoringTargets(
    branchIds?: string[]
  ): Promise<PrometheusTarget[]> {
    // Default branch jika tidak ditentukan
    const branches =
      branchIds && branchIds.length > 0 ? branchIds : ['020', '027']

    const { results } = await gatewayClient.get<{ results: TicketMonitoringTarget[] }>(
      '/ticket/monitoring',
      { branch: branches.join(','), type_id: '6' }
    )

    const targets: PrometheusTarget[] = results.map((row) => ({
      targets: [row.ip_address],
      labels: {
        ip: row.ip_address,
        host: row.subscriber_name || 'Unknown',
        subscriber_name: row.subscriber_name || 'Unknown',
        ticket: String(row.ticket_id),
        subscriber_id: String(row.subscriber_id),
        ticketing: 'yes',
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

    const { results } = await gatewayClient.get<{ results: FttxTarget[] }>(
      '/subscriber/fttx-targets',
      { operator_id: '22', branch: branches.join(',') }
    )

    const targets: PrometheusTarget[] = results.map((row) => ({
      targets: [row.ip_address],
      labels: {
        ip: row.ip_address,
        host: row.subscriber_name || 'Unknown',
        subscriber_name: row.subscriber_name || 'Unknown',
        subscriber_id: String(row.subscriber_id),
        fttx: 'yes',
        operator: 'iforte',
      },
    }))

    return targets
  }

  async getFbstarFttxTargets(
    branchIds?: string[]
  ): Promise<PrometheusTarget[]> {
    // Default branch jika tidak ditentukan
    const branches =
      branchIds && branchIds.length > 0
        ? branchIds
        : ['020', '027', '028', '029']

    const { results } = await gatewayClient.get<{ results: FttxTarget[] }>(
      '/subscriber/fttx-targets',
      { operator_id: '1', branch: branches.join(',') }
    )

    const targets: PrometheusTarget[] = results.map((row) => ({
      targets: [row.ip_address],
      labels: {
        ip: row.ip_address,
        host: row.subscriber_name || 'Unknown',
        subscriber_name: row.subscriber_name || 'Unknown',
        subscriber_id: String(row.subscriber_id),
        circuit_id: row.circuit_id || '',
        fttx: 'yes',
        operator: 'fbstar',
      },
    }))

    return targets
  }

  async getCgsFttxTargets(branchIds?: string[]): Promise<PrometheusTarget[]> {
    // Default branch jika tidak ditentukan
    const branches =
      branchIds && branchIds.length > 0
        ? branchIds
        : ['020', '027', '028', '029']

    const { results } = await gatewayClient.get<{ results: FttxTarget[] }>(
      '/subscriber/fttx-targets',
      { operator_id: '2', branch: branches.join(',') }
    )

    const targets: PrometheusTarget[] = results.map((row) => ({
      targets: [row.ip_address],
      labels: {
        ip: row.ip_address,
        host: row.subscriber_name || 'Unknown',
        subscriber_name: row.subscriber_name || 'Unknown',
        subscriber_id: String(row.subscriber_id),
        fttx: 'yes',
        operator: 'cgs',
      },
    }))

    return targets
  }

  async getSipFttxTargets(branchIds?: string[]): Promise<PrometheusTarget[]> {
    // Default branch jika tidak ditentukan
    const branches =
      branchIds && branchIds.length > 0
        ? branchIds
        : ['020', '027', '028', '029']

    const { results } = await gatewayClient.get<{ results: FttxTarget[] }>(
      '/subscriber/fttx-targets',
      { operator_id: '13', branch: branches.join(',') }
    )

    const targets: PrometheusTarget[] = results.map((row) => ({
      targets: [row.ip_address],
      labels: {
        ip: row.ip_address,
        host: row.subscriber_name || 'Unknown',
        subscriber_name: row.subscriber_name || 'Unknown',
        subscriber_id: String(row.subscriber_id),
        fttx: 'yes',
        operator: 'sip',
      },
    }))

    return targets
  }
}

export const sdService = new SDService()
