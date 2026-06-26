import { PrismaClient } from '.prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
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

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
