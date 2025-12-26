import { Role } from './role.enum'
import { Permission } from './permission.vo'
import { Resource } from './resource.enum'
import { Action } from './action.enum'
import { RolePermissionChecker } from './role-permissions.config'

/**
 * Menu Item Interface
 *
 * Represents a menu item in the application.
 * Each menu can have children (submenus) and requires specific permissions.
 */
export interface MenuItem {
  id: string
  label: string
  icon?: string
  route?: string
  requiredPermissions: Permission[]
  children?: MenuItem[]
  order?: number
}

/**
 * Menu Configuration
 *
 * Defines all menus in the system and their required permissions.
 * This is used to build the navigation menu for each role dynamically.
 */
export const MENU_CONFIG: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
    requiredPermissions: [], // Everyone can see dashboard
    order: 1,
  },

  {
    id: 'users',
    label: 'Usuarios',
    icon: 'users',
    route: '/users',
    requiredPermissions: [Permission.create(Resource.USERS, Action.READ)],
    order: 2,
    children: [
      {
        id: 'users-list',
        label: 'Lista de Usuarios',
        route: '/users',
        requiredPermissions: [Permission.create(Resource.USERS, Action.READ)],
      },
      {
        id: 'users-create',
        label: 'Crear Usuario',
        route: '/users/create',
        requiredPermissions: [Permission.create(Resource.USERS, Action.CREATE)],
      },
    ],
  },

  {
    id: 'audits',
    label: 'Auditorías',
    icon: 'clipboard-check',
    route: '/audits',
    requiredPermissions: [Permission.create(Resource.AUDITS, Action.READ)],
    order: 3,
    children: [
      {
        id: 'audits-list',
        label: 'Mis Auditorías',
        route: '/audits',
        requiredPermissions: [Permission.create(Resource.AUDITS, Action.READ)],
      },
      {
        id: 'audits-create',
        label: 'Nueva Auditoría',
        route: '/audits/create',
        requiredPermissions: [
          Permission.create(Resource.AUDITS, Action.CREATE),
        ],
      },
      {
        id: 'audits-approve',
        label: 'Aprobar Auditorías',
        route: '/audits/approve',
        requiredPermissions: [
          Permission.create(Resource.AUDITS, Action.APPROVE),
        ],
      },
      {
        id: 'audits-assign',
        label: 'Asignar Auditorías',
        route: '/audits/assign',
        requiredPermissions: [
          Permission.create(Resource.AUDITS, Action.ASSIGN),
        ],
      },
    ],
  },

  {
    id: 'findings',
    label: 'Hallazgos',
    icon: 'alert-circle',
    route: '/findings',
    requiredPermissions: [Permission.create(Resource.FINDINGS, Action.READ)],
    order: 4,
    children: [
      {
        id: 'findings-list',
        label: 'Lista de Hallazgos',
        route: '/findings',
        requiredPermissions: [
          Permission.create(Resource.FINDINGS, Action.READ),
        ],
      },
      {
        id: 'findings-create',
        label: 'Registrar Hallazgo',
        route: '/findings/create',
        requiredPermissions: [
          Permission.create(Resource.FINDINGS, Action.CREATE),
        ],
      },
    ],
  },

  {
    id: 'reports',
    label: 'Reportes',
    icon: 'file-text',
    route: '/reports',
    requiredPermissions: [Permission.create(Resource.REPORTS, Action.READ)],
    order: 5,
    children: [
      {
        id: 'reports-list',
        label: 'Ver Reportes',
        route: '/reports',
        requiredPermissions: [Permission.create(Resource.REPORTS, Action.READ)],
      },
      {
        id: 'reports-create',
        label: 'Generar Reporte',
        route: '/reports/create',
        requiredPermissions: [
          Permission.create(Resource.REPORTS, Action.CREATE),
        ],
      },
      {
        id: 'reports-export',
        label: 'Exportar Reportes',
        route: '/reports/export',
        requiredPermissions: [
          Permission.create(Resource.REPORTS, Action.EXPORT),
        ],
      },
    ],
  },

  {
    id: 'clients',
    label: 'Clientes',
    icon: 'briefcase',
    route: '/clients',
    requiredPermissions: [Permission.create(Resource.CLIENTS, Action.READ)],
    order: 6,
    children: [
      {
        id: 'clients-list',
        label: 'Lista de Clientes',
        route: '/clients',
        requiredPermissions: [Permission.create(Resource.CLIENTS, Action.READ)],
      },
      {
        id: 'clients-create',
        label: 'Registrar Cliente',
        route: '/clients/create',
        requiredPermissions: [
          Permission.create(Resource.CLIENTS, Action.CREATE),
        ],
      },
    ],
  },

  {
    id: 'settings',
    label: 'Configuración',
    icon: 'settings',
    route: '/settings',
    requiredPermissions: [Permission.create(Resource.SETTINGS, Action.READ)],
    order: 7,
  },

  {
    id: 'notifications',
    label: 'Notificaciones',
    icon: 'bell',
    route: '/notifications',
    requiredPermissions: [
      Permission.create(Resource.NOTIFICATIONS, Action.READ),
    ],
    order: 8,
  },
]

/**
 * Menu Filter
 *
 * Helper class to filter menus based on user permissions
 */
export class MenuFilter {
  /**
   * Get menus for a specific role
   */
  static getMenusForRole(role: Role): MenuItem[] {
    const userPermissions = RolePermissionChecker.getPermissions(role)
    const filteredMenus = this.filterMenuItems(MENU_CONFIG, userPermissions)

    // Sort by order
    return filteredMenus.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  /**
   * Filter menu items based on permissions
   */
  private static filterMenuItems(
    items: MenuItem[],
    userPermissions: Permission[],
  ): MenuItem[] {
    return items
      .filter((item) => this.hasRequiredPermissions(item, userPermissions))
      .map((item) => ({
        ...item,
        children: item.children
          ? this.filterMenuItems(item.children, userPermissions)
          : undefined,
      }))
      .filter((item) => {
        // Remove parent menus with no children (if they had children before filtering)
        if (item.children !== undefined && item.children.length === 0) {
          return false
        }
        return true
      })
  }

  /**
   * Check if user has all required permissions for a menu item
   */
  private static hasRequiredPermissions(
    item: MenuItem,
    userPermissions: Permission[],
  ): boolean {
    // If no permissions required, everyone can see it
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true
    }

    // User must have ALL required permissions
    return item.requiredPermissions.every((required) =>
      userPermissions.some((userPerm) => userPerm.equals(required)),
    )
  }
}
