import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env' })

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const stmts = [
  `CREATE TABLE IF NOT EXISTS Floor (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    label   TEXT NOT NULL UNIQUE,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS HeatFloorAssignment (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    heatId    INTEGER NOT NULL REFERENCES Heat(id) ON DELETE CASCADE,
    studentId INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
    floorId   INTEGER NOT NULL REFERENCES Floor(id) ON DELETE CASCADE,
    UNIQUE(heatId, studentId)
  )`,

  `CREATE TABLE IF NOT EXISTS JudgeFloor (
    judgeId INTEGER NOT NULL REFERENCES Judge(id) ON DELETE CASCADE,
    floorId INTEGER NOT NULL REFERENCES Floor(id) ON DELETE CASCADE,
    PRIMARY KEY (judgeId, floorId)
  )`,
]

for (const sql of stmts) {
  try {
    await client.execute(sql)
    console.log('OK:', sql.slice(0, 60).replace(/\n/g, ' '))
  } catch (e) {
    console.error('ERR:', e.message)
  }
}
console.log('Done.')
