import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma: any }

function createPrismaClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client')
  const { PrismaLibSql: Adapter } = require('@prisma/adapter-libsql')
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // Use https:// transport for Turso in serverless (avoids WebSocket cold-start latency)
  const resolvedUrl = tursoUrl ? tursoUrl.replace(/^libsql:\/\//, 'https://') : null
  const adapter = new Adapter(
    resolvedUrl
      ? { url: resolvedUrl, authToken: tursoToken }
      : { url: 'file:' + path.resolve(process.cwd(), 'prisma/showcase.db') }
  )
  return new PrismaClient({ adapter })
}

export const db: ReturnType<typeof createPrismaClient> = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
