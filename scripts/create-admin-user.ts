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

async function createAdminUser() {
  console.log('🔐 Creating admin user...')

  try {
    // Buscar el rol de ADMINISTRADOR
    const adminRole = await prisma.role.findFirst({
      where: { name: 'ADMINISTRADOR' },
    })

    if (!adminRole) {
      console.error('❌ Role ADMINISTRADOR not found. Please run the roles seed first.')
      process.exit(1)
    }

    // Verificar si ya existe el usuario admin
    const existingUser = await prisma.user.findFirst({
      where: { username: 'admin' },
    })

    if (existingUser) {
      console.log('⚠️  Admin user already exists')
      return
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    // Crear usuario admin
    const adminUser = await prisma.user.create({
      data: {
        names: 'Admin',
        lastNames: 'System',
        email: 'admin@audit2.com',
        username: 'admin',
        password: hashedPassword,
        ci: '0000000',
        status: 'ACTIVE',
        roles: {
          connect: { id: adminRole.id },
        },
      },
      include: { roles: true },
    })

    console.log('✅ Admin user created successfully!')
    console.log('   Username:', adminUser.username)
    console.log('   Email:', adminUser.email)
    console.log('   Password: Admin123!')
    console.log('   Roles:', adminUser.roles.map(r => r.name).join(', '))
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
