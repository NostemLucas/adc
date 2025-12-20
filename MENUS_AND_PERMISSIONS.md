# 📋 Sistema de Menús y Permisos

Sistema completo de control de acceso basado en roles (RBAC) con menús dinámicos filtrados por permisos del usuario.

## 📁 Arquitectura

### Modelos de Base de Datos

```
User ─┐
      ├─→ Role ─→ Permission
Menu ─┘
```

- **Permission**: Permisos granulares (ej: `users.create`, `audits.read`)
- **Role**: Agrupa permisos (ej: ADMINISTRADOR, GERENTE, AUDITOR, CLIENTE)
- **Menu**: Estructura jerárquica con permisos requeridos
- **User**: Tiene roles, hereda permisos de sus roles

### Estructura de Archivos

```
src/core/
├── permissions/
│   └── domain/
│       └── permission.entity.ts
├── menus/
│   ├── domain/
│   │   └── menu.entity.ts
│   ├── application/
│   │   ├── dto/
│   │   │   └── menu-response.dto.ts
│   │   └── use-cases/
│   │       └── get-user-menus.use-case.ts
│   ├── infrastructure/
│   │   └── menu.repository.ts
│   ├── menus.controller.ts
│   └── menus.module.ts
└── users/
    └── infrastructure/
        └── user.repository.ts (actualizado para incluir permissions)
```

## 🔑 Permisos Definidos

### Recursos y Acciones

| Recurso | Acciones Disponibles |
|---------|---------------------|
| users | read, create, update, delete |
| roles | read, create, update, delete |
| audits | read, create, update, delete, export |
| evaluations | read, create, update, delete |
| reports | read, export |
| dashboard | read |
| settings | read, update |

### Permisos por Rol

#### ADMINISTRADOR (22 permisos)
- ✅ Todos los permisos del sistema

#### GERENTE (10 permisos)
- ✅ dashboard.read
- ✅ audits.* (read, create, update, export)
- ✅ evaluations.* (read, create, update)
- ✅ reports.* (read, export)

#### AUDITOR (6 permisos)
- ✅ dashboard.read
- ✅ audits.read, audits.update
- ✅ evaluations.* (read, create, update)

#### CLIENTE (2 permisos)
- ✅ dashboard.read
- ✅ audits.read

## 🗂️ Estructura de Menús

### Jerarquía Completa

```
📊 Dashboard (/dashboard)
   └─ Requiere: dashboard.read

⚙️ Administración (sin ruta, menú padre)
   ├─ 👥 Usuarios (/users)
   │  └─ Requiere: users.read
   └─ 🛡️ Roles (/roles)
      └─ Requiere: roles.read

📝 Auditorías (sin ruta, menú padre)
   ├─ 📋 Lista de Auditorías (/audits)
   │  └─ Requiere: audits.read
   └─ ✅ Evaluaciones (/evaluations)
      └─ Requiere: evaluations.read

📈 Reportes (/reports)
   └─ Requiere: reports.read

🔧 Configuración (/settings)
   └─ Requiere: settings.read
```

## 🎯 Lógica de Filtrado

### Algoritmo

1. **Obtener todos los menús** con su jerarquía completa desde la BD
2. **Obtener permisos del usuario** a través de sus roles
3. **Filtrado recursivo**:
   - Para cada menú, verificar si el usuario tiene al menos uno de los permisos requeridos
   - Filtrar hijos recursivamente
   - **Regla especial**: Menús padre sin permisos propios solo se muestran si tienen al menos un hijo accesible
4. **Retornar estructura filtrada** al frontend

### Código Clave

```typescript
// Menu.entity.ts
filterByPermissions(userPermissionIds: string[]): Menu | null {
  const filteredChildren = this.children
    .map((child) => child.filterByPermissions(userPermissionIds))
    .filter((child): child is Menu => child !== null)

  // Menú padre sin permisos: mostrar solo si tiene hijos accesibles
  if (this.permissionIds.length === 0 && this.hasChildren) {
    return filteredChildren.length === 0 ? null : this.withChildren(filteredChildren)
  }

  // Menú con permisos: verificar acceso del usuario
  if (!this.hasPermission(userPermissionIds)) {
    return null
  }

  return this.withChildren(filteredChildren)
}
```

## 🚀 Uso

### API Endpoint

```bash
GET /menus
Authorization: Bearer <JWT_TOKEN>
```

### Respuesta para ADMINISTRADOR

```json
{
  "menus": [
    {
      "id": "...",
      "name": "Dashboard",
      "icon": "HomeIcon",
      "path": "/dashboard",
      "order": 1,
      "parentId": null,
      "children": []
    },
    {
      "id": "...",
      "name": "Administración",
      "icon": "SettingsIcon",
      "path": null,
      "order": 2,
      "parentId": null,
      "children": [
        {
          "id": "...",
          "name": "Usuarios",
          "icon": "UsersIcon",
          "path": "/users",
          "order": 1,
          "parentId": "...",
          "children": []
        },
        {
          "id": "...",
          "name": "Roles",
          "icon": "ShieldIcon",
          "path": "/roles",
          "order": 2,
          "parentId": "...",
          "children": []
        }
      ]
    }
    // ... más menús
  ]
}
```

### Respuesta para CLIENTE

```json
{
  "menus": [
    {
      "id": "...",
      "name": "Dashboard",
      "icon": "HomeIcon",
      "path": "/dashboard",
      "order": 1,
      "parentId": null,
      "children": []
    },
    {
      "id": "...",
      "name": "Auditorías",
      "icon": "DocumentIcon",
      "path": null,
      "order": 3,
      "parentId": null,
      "children": [
        {
          "id": "...",
          "name": "Lista de Auditorías",
          "icon": "ListIcon",
          "path": "/audits",
          "order": 1,
          "parentId": "...",
          "children": []
        }
      ]
    }
  ]
}
```

## 🧪 Testing

### Crear Usuarios de Prueba

```bash
# Crear roles
npx ts-node prisma/seeds/roles.seed.ts

# Crear permisos y menús
npx ts-node prisma/seeds/permissions-and-menus.seed.ts

# Crear usuario admin
npx ts-node scripts/create-admin-user.ts

# Crear usuario cliente
npx ts-node scripts/create-client-user.ts
```

### Probar Endpoint

```bash
# Login como admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'

# Obtener menús (usar el accessToken del login)
curl -X GET http://localhost:3000/menus \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## 🔒 Seguridad

### Ventajas de este Enfoque

1. **Filtrado en Backend**: El servidor decide qué menús mostrar, no el cliente
2. **Un solo endpoint**: El frontend solo llama `/menus` y recibe la estructura filtrada
3. **Caché eficiente**: Los menús se pueden cachear por usuario/rol
4. **Sin exponer permisos**: El frontend no necesita saber los permisos exactos
5. **Validación doble**: Los guards de rutas validan permisos en el backend

### Guards de Permisos (Futuro)

Para proteger rutas individuales:

```typescript
@Get()
@RequiresPermission('users.read')
async findAll() { ... }
```

## 📝 Notas Importantes

1. **Menús sin permisos**: Los menús padre que no tienen permisos asociados (como "Administración") solo se muestran si tienen al menos un hijo accesible
2. **Herencia de permisos**: Los usuarios heredan permisos de TODOS sus roles
3. **Permisos únicos**: Un permiso se identifica por `[resource].[action]` (ej: `users.create`)
4. **Orden de menús**: Los menús se ordenan por el campo `order`
5. **Soft delete**: Los menús con `deletedAt` o `isActive=false` no se muestran

## 🎨 Integración Frontend

El frontend debe:

1. Llamar `/menus` después del login
2. Guardar la estructura en estado global (Redux/Context)
3. Renderizar el sidebar dinámicamente basándose en la respuesta
4. Usar `path` para las rutas de navegación
5. Usar `icon` para mostrar los íconos apropiados
6. Respetar la jerarquía `parent` → `children`

### Ejemplo React

```tsx
function Sidebar() {
  const { menus } = useMenus() // Hook que llama /menus

  return (
    <nav>
      {menus.map(menu => (
        <MenuItem key={menu.id} menu={menu} />
      ))}
    </nav>
  )
}

function MenuItem({ menu }) {
  if (menu.children.length > 0) {
    return (
      <Collapsible title={menu.name} icon={menu.icon}>
        {menu.children.map(child => (
          <MenuItem key={child.id} menu={child} />
        ))}
      </Collapsible>
    )
  }

  return <Link to={menu.path}>{menu.name}</Link>
}
```

## ✅ Checklist de Implementación

- [x] Modelo Permission en Prisma
- [x] Modelo Menu en Prisma
- [x] Relaciones Role ↔ Permission
- [x] Relaciones Menu ↔ Permission
- [x] Migración de base de datos
- [x] Seed de permisos
- [x] Seed de menús
- [x] Asignación de permisos a roles
- [x] Entidad Permission (domain)
- [x] Entidad Menu (domain)
- [x] MenuRepository
- [x] GetUserMenusUseCase
- [x] MenusController
- [x] MenusModule
- [x] Actualizar UserRepository para incluir permissions
- [x] Actualizar Role entity para incluir permissions
- [x] Endpoint GET /menus
- [x] Lógica de filtrado recursivo
- [x] Scripts de creación de usuarios de prueba
- [x] Testing con diferentes roles

## 🚀 Mejoras Futuras

1. **Guards de Permisos**: `@RequiresPermission()` decorator
2. **Caché de menús**: Redis/in-memory cache por rol
3. **Administración de permisos**: CRUD de permisos desde admin
4. **Permisos condicionales**: Permisos basados en ownership (ej: solo ver sus propias auditorías)
5. **Audit log**: Registrar cambios en permisos y roles
6. **Badges de menús**: Contadores dinámicos (ej: "3 notificaciones nuevas")
