import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Cargar variables de entorno
config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function seedRoles() {
  console.log('🌱 Seeding roles...')

  const roles = [
    {
      name: 'ADMINISTRADOR',
      description: 'Administrador del sistema con acceso total',
    },
    {
      name: 'GERENTE',
      description: 'Gerente con acceso a auditorías y reportes',
    },
    {
      name: 'AUDITOR',
      description: 'Auditor con acceso a evaluaciones',
    },
    {
      name: 'CLIENTE',
      description: 'Cliente con acceso de solo lectura a sus auditorías',
    },
  ]

  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
    console.log(`  ✅ ${createdRole.name}`)
  }

  console.log('\n✅ Roles seeded successfully!')
}

seedRoles()
  .catch((e) => {
    console.error('❌ Error seeding roles:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
