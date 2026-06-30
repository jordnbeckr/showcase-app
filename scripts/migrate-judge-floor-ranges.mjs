import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env' })

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

await db.execute(`
  CREATE TABLE IF NOT EXISTS JudgeFloorRange (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    judgeId  INTEGER NOT NULL REFERENCES Judge(id) ON DELETE CASCADE,
    floorId  INTEGER NOT NULL REFERENCES Floor(id) ON DELETE CASCADE,
    heatFrom INTEGER NOT NULL,
    heatTo   INTEGER NOT NULL DEFAULT 9999
  )
`)

console.log('✓ JudgeFloorRange table created')
process.exit(0)
