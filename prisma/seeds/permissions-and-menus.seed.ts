import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Cargar variables de entorno
config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function seedPermissionsAndMenus() {
  console.log('🌱 Seeding permissions and menus...')

  // ========== PERMISOS ==========
  console.log('📋 Creating permissions...')

  const permissions = [
    // Usuarios
    {
      name: 'users.read',
      resource: 'users',
      action: 'read',
      description: 'Ver usuarios',
    },
    {
      name: 'users.create',
      resource: 'users',
      action: 'create',
      description: 'Crear usuarios',
    },
    {
      name: 'users.update',
      resource: 'users',
      action: 'update',
      description: 'Editar usuarios',
    },
    {
      name: 'users.delete',
      resource: 'users',
      action: 'delete',
      description: 'Eliminar usuarios',
    },

    // Roles
    {
      name: 'roles.read',
      resource: 'roles',
      action: 'read',
      description: 'Ver roles',
    },
    {
      name: 'roles.create',
      resource: 'roles',
      action: 'create',
      description: 'Crear roles',
    },
    {
      name: 'roles.update',
      resource: 'roles',
      action: 'update',
      description: 'Editar roles',
    },
    {
      name: 'roles.delete',
      resource: 'roles',
      action: 'delete',
      description: 'Eliminar roles',
    },

    // Auditorías
    {
      name: 'audits.read',
      resource: 'audits',
      action: 'read',
      description: 'Ver auditorías',
    },
    {
      name: 'audits.create',
      resource: 'audits',
      action: 'create',
      description: 'Crear auditorías',
    },
    {
      name: 'audits.update',
      resource: 'audits',
      action: 'update',
      description: 'Editar auditorías',
    },
    {
      name: 'audits.delete',
      resource: 'audits',
      action: 'delete',
      description: 'Eliminar auditorías',
    },
    {
      name: 'audits.export',
      resource: 'audits',
      action: 'export',
      description: 'Exportar auditorías',
    },

    // Evaluaciones
    {
      name: 'evaluations.read',
      resource: 'evaluations',
      action: 'read',
      description: 'Ver evaluaciones',
    },
    {
      name: 'evaluations.create',
      resource: 'evaluations',
      action: 'create',
      description: 'Crear evaluaciones',
    },
    {
      name: 'evaluations.update',
      resource: 'evaluations',
      action: 'update',
      description: 'Editar evaluaciones',
    },
    {
      name: 'evaluations.delete',
      resource: 'evaluations',
      action: 'delete',
      description: 'Eliminar evaluaciones',
    },

    // Reportes
    {
      name: 'reports.read',
      resource: 'reports',
      action: 'read',
      description: 'Ver reportes',
    },
    {
      name: 'reports.export',
      resource: 'reports',
      action: 'export',
      description: 'Exportar reportes',
    },

    // Dashboard
    {
      name: 'dashboard.read',
      resource: 'dashboard',
      action: 'read',
      description: 'Ver dashboard',
    },

    // Configuración
    {
      name: 'settings.read',
      resource: 'settings',
      action: 'read',
      description: 'Ver configuración',
    },
    {
      name: 'settings.update',
      resource: 'settings',
      action: 'update',
      description: 'Editar configuración',
    },
  ]

  const createdPermissions: Record<string, { id: string }> = {}
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    })
    createdPermissions[perm.name] = permission
    console.log(`  ✅ ${perm.name}`)
  }

  // ========== MENÚS ==========
  console.log('\n📱 Creating menus...')

  // Menú padre: Dashboard
  const dashboardMenu = await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Dashboard',
      icon: 'HomeIcon',
      path: '/dashboard',
      order: 1,
      permissions: {
        connect: [{ id: createdPermissions['dashboard.read'].id }],
      },
    },
  })
  console.log(`  ✅ Dashboard`)

  // Menú padre: Administración
  const adminMenu = await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Administración',
      icon: 'SettingsIcon',
      path: null, // Menú padre sin ruta
      order: 2,
    },
  })
  console.log(`  ✅ Administración`)

  // Submenú: Usuarios
  await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Usuarios',
      icon: 'UsersIcon',
      path: '/users',
      order: 1,
      parentId: adminMenu.id,
      permissions: {
        connect: [{ id: createdPermissions['users.read'].id }],
      },
    },
  })
  console.log(`    ↳ Usuarios`)

  // Submenú: Roles
  await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Roles',
      icon: 'ShieldIcon',
      path: '/roles',
      order: 2,
      parentId: adminMenu.id,
      permissions: {
        connect: [{ id: createdPermissions['roles.read'].id }],
      },
    },
  })
  console.log(`    ↳ Roles`)

  // Menú padre: Auditorías
  const auditsMenu = await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Auditorías',
      icon: 'DocumentIcon',
      path: null,
      order: 3,
    },
  })
  console.log(`  ✅ Auditorías`)

  // Submenú: Lista de Auditorías
  await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000006' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Lista de Auditorías',
      icon: 'ListIcon',
      path: '/audits',
      order: 1,
      parentId: auditsMenu.id,
      permissions: {
        connect: [{ id: createdPermissions['audits.read'].id }],
      },
    },
  })
  console.log(`    ↳ Lista de Auditorías`)

  // Submenú: Evaluaciones
  await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000007' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000007',
      name: 'Evaluaciones',
      icon: 'CheckIcon',
      path: '/evaluations',
      order: 2,
      parentId: auditsMenu.id,
      permissions: {
        connect: [{ id: createdPermissions['evaluations.read'].id }],
      },
    },
  })
  console.log(`    ↳ Evaluaciones`)

  // Menú padre: Reportes
  await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000008' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000008',
      name: 'Reportes',
      icon: 'ChartIcon',
      path: '/reports',
      order: 4,
      permissions: {
        connect: [{ id: createdPermissions['reports.read'].id }],
      },
    },
  })
  console.log(`  ✅ Reportes`)

  // Menú: Configuración
  await prisma.menu.upsert({
    where: { id: '00000000-0000-0000-0000-000000000009' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000009',
      name: 'Configuración',
      icon: 'CogIcon',
      path: '/settings',
      order: 5,
      permissions: {
        connect: [{ id: createdPermissions['settings.read'].id }],
      },
    },
  })
  console.log(`  ✅ Configuración`)

  // ========== ASIGNAR PERMISOS A ROLES EXISTENTES ==========
  console.log('\n🔐 Assigning permissions to roles...')

  // Admin: todos los permisos
  const adminRole = await prisma.role.findFirst({
    where: { name: 'ADMINISTRADOR' },
  })
  if (adminRole) {
    await prisma.role.update({
      where: { id: adminRole.id },
      data: {
        permissions: {
          connect: Object.values(createdPermissions).map((p) => ({ id: p.id })),
        },
      },
    })
    console.log(
      `  ✅ ADMINISTRADOR: ${Object.keys(createdPermissions).length} permisos`,
    )
  }

  // Gerente: permisos de auditorías y reportes
  const managerRole = await prisma.role.findFirst({
    where: { name: 'GERENTE' },
  })
  if (managerRole) {
    await prisma.role.update({
      where: { id: managerRole.id },
      data: {
        permissions: {
          connect: [
            { id: createdPermissions['dashboard.read'].id },
            { id: createdPermissions['audits.read'].id },
            { id: createdPermissions['audits.create'].id },
            { id: createdPermissions['audits.update'].id },
            { id: createdPermissions['audits.export'].id },
            { id: createdPermissions['evaluations.read'].id },
            { id: createdPermissions['evaluations.create'].id },
            { id: createdPermissions['evaluations.update'].id },
            { id: createdPermissions['reports.read'].id },
            { id: createdPermissions['reports.export'].id },
          ],
        },
      },
    })
    console.log(`  ✅ GERENTE: 10 permisos`)
  }

  // Auditor: permisos de lectura de auditorías y evaluaciones
  const auditorRole = await prisma.role.findFirst({
    where: { name: 'AUDITOR' },
  })
  if (auditorRole) {
    await prisma.role.update({
      where: { id: auditorRole.id },
      data: {
        permissions: {
          connect: [
            { id: createdPermissions['dashboard.read'].id },
            { id: createdPermissions['audits.read'].id },
            { id: createdPermissions['audits.update'].id },
            { id: createdPermissions['evaluations.read'].id },
            { id: createdPermissions['evaluations.create'].id },
            { id: createdPermissions['evaluations.update'].id },
          ],
        },
      },
    })
    console.log(`  ✅ AUDITOR: 6 permisos`)
  }

  // Cliente: solo lectura de sus auditorías
  const clientRole = await prisma.role.findFirst({ where: { name: 'CLIENTE' } })
  if (clientRole) {
    await prisma.role.update({
      where: { id: clientRole.id },
      data: {
        permissions: {
          connect: [
            { id: createdPermissions['dashboard.read'].id },
            { id: createdPermissions['audits.read'].id },
          ],
        },
      },
    })
    console.log(`  ✅ CLIENTE: 2 permisos`)
  }

  console.log('\n✅ Permissions and menus seeded successfully!')
}

seedPermissionsAndMenus()
  .catch((e) => {
    console.error('❌ Error seeding permissions and menus:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
