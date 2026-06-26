import { PrismaLibSql } from '@prisma/adapter-libsql'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')
import * as crypto from 'crypto'
import * as path from 'path'

const adapter = new PrismaLibSql({
  url: 'file:' + path.resolve(__dirname, 'showcase.db'),
})
const db = new PrismaClient({ adapter })

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding...')

  // Studios
  const studioData = [
    { name: 'Beverly Hills', slug: 'beverly-hills', password: 'bh2026' },
    { name: 'Glendale-Montrose', slug: 'glendale-montrose', password: 'gm2026' },
    { name: 'Santa Barbara', slug: 'santa-barbara', password: 'sb2026' },
    { name: 'Santa Monica', slug: 'santa-monica', password: 'sm2026' },
    { name: 'Sherman Oaks', slug: 'sherman-oaks', password: 'so2026' },
    { name: 'Thousand Oaks', slug: 'thousand-oaks', password: 'to2026' },
    { name: 'Valencia', slug: 'valencia', password: 'val2026' },
    { name: 'Ventura', slug: 'ventura', password: 'ven2026' },
    { name: 'West Covina', slug: 'west-covina', password: 'wc2026' },
    { name: 'Woodland Hills', slug: 'woodland-hills', password: 'wh2026' },
  ]

  for (const [i, s] of studioData.entries()) {
    await db.studio.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name,
        slug: s.slug,
        passwordHash: hashPassword(s.password),
        order: i,
      },
    })
  }

  // Dance types (from the Excel heat list)
  const danceNames = [
    'Waltz', 'Tango', 'Foxtrot', 'Viennese Waltz', 'Quickstep',
    'Cha Cha', 'Rumba', 'Samba', 'Paso Doble', 'Jive',
    'Salsa', 'Bachata', 'Merengue', 'Hustle',
    'West Coast Swing', 'Lindy Hop', 'Argentine Tango',
    'Night Club 2 Step', 'Country 2 Step', 'Peabody',
    'Club Latin 3 Dance', 'Mystery 2 Dance', 'Medley',
  ]

  for (const [i, name] of danceNames.entries()) {
    await db.danceType.upsert({
      where: { name },
      update: {},
      create: { name, order: i },
    })
  }

  // Instructors (from Admin Config sheet)
  const instructors: { name: string; studio: string }[] = [
    { name: 'Jackie Buckmaster', studio: 'Beverly Hills' },
    { name: 'Chad Garrett', studio: 'Beverly Hills' },
    { name: 'Cecilia Hulett', studio: 'Beverly Hills' },
    { name: 'Scott Lopez', studio: 'Beverly Hills' },
    { name: 'Isaac Barahona', studio: 'Glendale-Montrose' },
    { name: 'Fernando Cortez', studio: 'Glendale-Montrose' },
    { name: 'Amaia Shah', studio: 'Glendale-Montrose' },
    { name: 'Katie Pia', studio: 'Glendale-Montrose' },
    { name: 'Sophie Gottler', studio: 'Glendale-Montrose' },
    { name: 'Allison Felix', studio: 'Santa Barbara' },
    { name: 'Eva Luo', studio: 'Santa Barbara' },
    { name: 'Drew Miller', studio: 'Santa Barbara' },
    { name: 'Grace Schuck', studio: 'Santa Barbara' },
    { name: 'Dibella Caminsky', studio: 'Santa Monica' },
    { name: 'Joel Rieck', studio: 'Santa Monica' },
    { name: 'Ty Kramer-Watson', studio: 'Santa Monica' },
    { name: 'Martin Barthold', studio: 'Sherman Oaks' },
    { name: 'Jordan Becker', studio: 'Sherman Oaks' },
    { name: 'Dani Bommer', studio: 'Sherman Oaks' },
    { name: 'Kat Dieguez', studio: 'Sherman Oaks' },
    { name: 'Cass Godinez', studio: 'Sherman Oaks' },
    { name: 'Vendela Lloyd', studio: 'Sherman Oaks' },
    { name: 'Tommy Shadi', studio: 'Sherman Oaks' },
    { name: 'Anthony Tatoosi', studio: 'Sherman Oaks' },
    { name: 'Edwin Cabrera', studio: 'Thousand Oaks' },
  ]

  for (const inst of instructors) {
    const studio = await db.studio.findUnique({ where: { name: inst.studio } })
    if (!studio) continue
    const existing = await db.instructor.findFirst({
      where: { name: inst.name, studioId: studio.id },
    })
    if (!existing) {
      await db.instructor.create({ data: { name: inst.name, studioId: studio.id } })
    }
  }

  // Students from Sherman Oaks (Excel roster)
  const shermanOaks = await db.studio.findUnique({ where: { slug: 'sherman-oaks' } })
  if (shermanOaks) {
    const students = [
      { firstName: 'Nancy', lastName: 'Riegling', role: 'Follower' },
      { firstName: 'Eva', lastName: 'McCormick', role: 'Follower' },
      { firstName: 'Shelby', lastName: 'Fogelman', role: 'Follower' },
      { firstName: 'Nicole', lastName: 'Nigosian', role: 'Follower' },
      { firstName: 'Richard', lastName: 'Roe', role: 'Leader' },
      { firstName: 'Richard', lastName: 'Garcia', role: 'Leader' },
      { firstName: 'David', lastName: 'Romm', role: 'Leader' },
      { firstName: 'Andrea', lastName: 'Danneker', role: 'Follower' },
      { firstName: 'Jaden', lastName: 'Chatchaiyan', role: 'Leader' },
      { firstName: 'Mike', lastName: 'Mahdesian', role: 'Leader' },
      { firstName: 'Khemnak', lastName: 'Chatchaiyan', role: 'Follower' },
    ]
    for (const s of students) {
      const existing = await db.student.findFirst({
        where: { firstName: s.firstName, lastName: s.lastName, studioId: shermanOaks.id },
      })
      if (!existing) {
        await db.student.create({ data: { ...s, studioId: shermanOaks.id } })
      }
    }
  }

  // Heats (116 heats from Excel, with dance type assignments)
  // Dance pattern repeats: W T F VW W T F VW W T F W T F VW Q ...
  const heatDances: Record<number, string> = {
    1: 'Waltz', 2: 'Tango', 3: 'Foxtrot', 4: 'Viennese Waltz',
    5: 'Waltz', 6: 'Tango', 7: 'Foxtrot', 8: 'Viennese Waltz',
    9: 'Waltz', 10: 'Tango', 11: 'Foxtrot', 12: 'Waltz',
    13: 'Tango', 14: 'Foxtrot', 15: 'Viennese Waltz', 16: 'Quickstep',
    17: 'Waltz', 18: 'Tango', 19: 'Foxtrot', 20: 'Waltz',
    21: 'Tango', 22: 'Foxtrot', 23: 'Viennese Waltz', 24: 'Waltz',
    25: 'Tango', 26: 'Foxtrot', 27: 'Viennese Waltz', 28: 'Quickstep',
    29: 'Waltz', 30: 'Tango', 31: 'Foxtrot', 32: 'Viennese Waltz',
    33: 'Cha Cha', 34: 'Rumba', 35: 'Cha Cha', 36: 'Rumba',
    37: 'Cha Cha', 38: 'Rumba', 39: 'Cha Cha', 40: 'Rumba',
    41: 'Cha Cha', 42: 'Rumba', 43: 'Cha Cha', 44: 'Rumba',
    45: 'Cha Cha', 46: 'Rumba', 47: 'Cha Cha', 48: 'Rumba',
    49: 'Cha Cha', 50: 'Rumba', 51: 'Jive', 52: 'Jive',
    53: 'Salsa', 54: 'Bachata', 55: 'Merengue', 56: 'Hustle',
    57: 'Samba', 58: 'Salsa', 59: 'Bachata', 60: 'Merengue',
    61: 'Hustle', 62: 'Samba', 63: 'Salsa', 64: 'Bachata',
    65: 'Merengue', 66: 'Hustle', 67: 'Samba', 68: 'Salsa',
    69: 'West Coast Swing', 70: 'Lindy Hop', 71: 'Salsa', 72: 'Bachata',
    73: 'Merengue', 74: 'Hustle', 75: 'Samba', 76: 'Salsa',
    77: 'Bachata', 78: 'Merengue', 79: 'Hustle', 80: 'Samba',
    81: 'Salsa', 82: 'Bachata', 83: 'Merengue', 84: 'Hustle',
    85: 'Samba', 86: 'Salsa', 87: 'West Coast Swing', 88: 'Lindy Hop',
    89: 'Salsa', 90: 'Salsa', 91: 'Bachata', 92: 'Merengue',
    93: 'Hustle', 94: 'Samba', 95: 'Salsa', 96: 'West Coast Swing',
    97: 'Lindy Hop', 98: 'Salsa', 99: 'Bachata', 100: 'Merengue',
    101: 'Hustle', 102: 'Samba', 103: 'Salsa', 104: 'Paso Doble',
    105: 'Peabody', 106: 'Country 2 Step', 107: 'Argentine Tango',
    108: 'West Coast Swing', 109: 'Night Club 2 Step', 110: 'Salsa',
    111: 'Bachata', 112: 'Merengue', 113: 'Hustle', 114: 'Samba',
    115: 'Club Latin 3 Dance', 116: 'Mystery 2 Dance',
  }

  const danceTypeMap: Record<string, number> = {}
  const allDances = await db.danceType.findMany()
  for (const d of allDances) danceTypeMap[d.name] = d.id

  for (const [numStr, danceName] of Object.entries(heatDances)) {
    const num = parseInt(numStr)
    const danceTypeId = danceTypeMap[danceName]
    if (!danceTypeId) continue
    await db.heat.upsert({
      where: { number: num },
      update: {},
      create: { number: num, danceTypeId },
    })
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
