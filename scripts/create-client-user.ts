import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'

// Cargar variables de entorno
config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function createClientUser() {
  console.log('👤 Creating client user...')

  try {
    // Buscar el rol de CLIENTE
    const clientRole = await prisma.role.findFirst({
      where: { name: 'CLIENTE' },
    })

    if (!clientRole) {
      console.error('❌ Role CLIENTE not found.')
      process.exit(1)
    }

    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findFirst({
      where: { username: 'cliente' },
    })

    if (existingUser) {
      console.log('⚠️  Client user already exists')
      return
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('Cliente123!', 10)

    // Crear usuario cliente
    const clientUser = await prisma.user.create({
      data: {
        names: 'Cliente',
        lastNames: 'Test',
        email: 'cliente@audit2.com',
        username: 'cliente',
        password: hashedPassword,
        ci: '1111111',
        status: 'ACTIVE',
        roles: {
          connect: { id: clientRole.id },
        },
      },
      include: { roles: true },
    })

    console.log('✅ Client user created successfully!')
    console.log('   Username:', clientUser.username)
    console.log('   Email:', clientUser.email)
    console.log('   Password: Cliente123!')
    console.log('   Roles:', clientUser.roles.map(r => r.name).join(', '))
  } catch (error) {
    console.error('❌ Error creating client user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createClientUser()
