import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env' })

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const stmts = [
  // Add category column to Heat
  `ALTER TABLE Heat ADD COLUMN category TEXT NOT NULL DEFAULT 'none'`,

  // Add isCompetitive column to Event
  `ALTER TABLE Event ADD COLUMN isCompetitive INTEGER NOT NULL DEFAULT 0`,

  // Judge table
  `CREATE TABLE IF NOT EXISTS Judge (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL UNIQUE,
    pinHash TEXT NOT NULL
  )`,

  // FeedbackCategory table
  `CREATE TABLE IF NOT EXISTS FeedbackCategory (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,

  // ClosedScore table
  `CREATE TABLE IF NOT EXISTS ClosedScore (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    judgeId   INTEGER NOT NULL REFERENCES Judge(id) ON DELETE CASCADE,
    heatId    INTEGER NOT NULL REFERENCES Heat(id) ON DELETE CASCADE,
    studentId INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
    placement TEXT NOT NULL,
    UNIQUE(judgeId, heatId, studentId)
  )`,

  // OpenThumb table
  `CREATE TABLE IF NOT EXISTS OpenThumb (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    judgeId    INTEGER NOT NULL REFERENCES Judge(id) ON DELETE CASCADE,
    heatId     INTEGER NOT NULL REFERENCES Heat(id) ON DELETE CASCADE,
    studentId  INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
    categoryId INTEGER NOT NULL REFERENCES FeedbackCategory(id) ON DELETE CASCADE,
    sentiment  TEXT NOT NULL,
    UNIQUE(judgeId, heatId, studentId, categoryId)
  )`,

  // OpenNote table
  `CREATE TABLE IF NOT EXISTS OpenNote (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    judgeId   INTEGER NOT NULL REFERENCES Judge(id) ON DELETE CASCADE,
    heatId    INTEGER NOT NULL REFERENCES Heat(id) ON DELETE CASCADE,
    studentId INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
    note      TEXT NOT NULL,
    UNIQUE(judgeId, heatId, studentId)
  )`,

  // CompRound table
  `CREATE TABLE IF NOT EXISTS CompRound (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    eventId   INTEGER NOT NULL UNIQUE REFERENCES Event(id) ON DELETE CASCADE,
    round     TEXT NOT NULL DEFAULT 'final',
    finalSize INTEGER NOT NULL DEFAULT 6,
    semiSize  INTEGER NOT NULL DEFAULT 7
  )`,

  // CompScore table
  `CREATE TABLE IF NOT EXISTS CompScore (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    judgeId   INTEGER NOT NULL REFERENCES Judge(id) ON DELETE CASCADE,
    eventId   INTEGER NOT NULL REFERENCES Event(id) ON DELETE CASCADE,
    studentId INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
    place     INTEGER NOT NULL,
    UNIQUE(judgeId, eventId, studentId)
  )`,

  // SemiMark table
  `CREATE TABLE IF NOT EXISTS SemiMark (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    judgeId   INTEGER NOT NULL REFERENCES Judge(id) ON DELETE CASCADE,
    eventId   INTEGER NOT NULL REFERENCES Event(id) ON DELETE CASCADE,
    studentId INTEGER NOT NULL REFERENCES Student(id) ON DELETE CASCADE,
    called    INTEGER NOT NULL DEFAULT 0,
    UNIQUE(judgeId, eventId, studentId)
  )`,

  // Seed default feedback categories
  `INSERT OR IGNORE INTO FeedbackCategory (name, "order") VALUES
    ('Timing', 0),
    ('Footwork', 1),
    ('Musicality', 2),
    ('Partnering', 3),
    ('Expression', 4),
    ('Connection', 5),
    ('Movement', 6),
    ('Posture', 7),
    ('Styling', 8)`,
]

for (const sql of stmts) {
  try {
    await client.execute(sql)
    console.log('OK:', sql.slice(0, 60).replace(/\n/g, ' '))
  } catch (e) {
    if (e.message?.includes('duplicate column')) {
      console.log('SKIP (already exists):', sql.slice(0, 60).replace(/\n/g, ' '))
    } else {
      console.error('ERR:', e.message)
      console.error('SQL:', sql.slice(0, 120))
    }
  }
}

console.log('\nDone.')
