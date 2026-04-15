import { SQL } from 'bun'
import { config } from '../config'

// Bun:sql connection for MySQL
// Format: mysql://user:password@host:port/database
const connectionString = `mysql://${config.DB_USER}:${encodeURIComponent(config.DB_PASSWORD)}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`

export const sql = new SQL(connectionString)

// Helper function to maintain compatibility if needed,
// though we'll prefer using `sql` directly with tagged templates
export async function query<T>(queryStr: string): Promise<T[]> {
  // Note: Using raw queries with bun:sql requires caution.
  // We'll use this as a bridge for now or update services to use sql`` directly.
  return (await sql.query(queryStr).all()) as T[]
}
