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

  const adapter = new Adapter(
    tursoUrl
      ? { url: tursoUrl, authToken: tursoToken }
      : { url: 'file:' + path.resolve(process.cwd(), 'prisma/showcase.db') }
  )
  return new PrismaClient({ adapter })
}

export const db: ReturnType<typeof createPrismaClient> = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
