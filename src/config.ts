import { z } from 'zod'

const configSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('3306').transform(Number),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  TICKET_TYPE_1_NAME: z.string().default('incident'),
  TICKET_TYPE_2_NAME: z.string().default('request'),
  REGION_MAPPING: z
    .string()
    .default('{}')
    .transform((str) => {
      try {
        return JSON.parse(str) as Record<string, string>
      } catch {
        return {} as Record<string, string>
      }
    }),
})

export const config = configSchema.parse(process.env)
export type Config = z.infer<typeof configSchema>
