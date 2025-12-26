import { Role } from './role.enum'
import { Permission } from './permission.vo'
import { Resource } from './resource.enum'
import { Action } from './action.enum'

/**
 * Role Permissions Configuration
 *
 * This is the single source of truth for permissions in the system.
 * Each role has a specific set of permissions defined here.
 *
 * When roles are stored in the database, this configuration should be
 * used to sync them via seeders.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMINISTRADOR]: [
    // Users - Full access
    Permission.create(Resource.USERS, Action.CREATE),
    Permission.create(Resource.USERS, Action.READ),
    Permission.create(Resource.USERS, Action.UPDATE),
    Permission.create(Resource.USERS, Action.DELETE),

    // Roles - Full access
    Permission.create(Resource.ROLES, Action.READ),

    // Audits - Full access
    Permission.create(Resource.AUDITS, Action.CREATE),
    Permission.create(Resource.AUDITS, Action.READ),
    Permission.create(Resource.AUDITS, Action.UPDATE),
    Permission.create(Resource.AUDITS, Action.DELETE),
    Permission.create(Resource.AUDITS, Action.APPROVE),
    Permission.create(Resource.AUDITS, Action.ASSIGN),

    // Findings - Full access
    Permission.create(Resource.FINDINGS, Action.CREATE),
    Permission.create(Resource.FINDINGS, Action.READ),
    Permission.create(Resource.FINDINGS, Action.UPDATE),
    Permission.create(Resource.FINDINGS, Action.DELETE),

    // Reports - Full access
    Permission.create(Resource.REPORTS, Action.CREATE),
    Permission.create(Resource.REPORTS, Action.READ),
    Permission.create(Resource.REPORTS, Action.UPDATE),
    Permission.create(Resource.REPORTS, Action.DELETE),
    Permission.create(Resource.REPORTS, Action.EXPORT),

    // Clients - Full access
    Permission.create(Resource.CLIENTS, Action.CREATE),
    Permission.create(Resource.CLIENTS, Action.READ),
    Permission.create(Resource.CLIENTS, Action.UPDATE),
    Permission.create(Resource.CLIENTS, Action.DELETE),

    // Settings - Full access
    Permission.create(Resource.SETTINGS, Action.READ),
    Permission.create(Resource.SETTINGS, Action.UPDATE),

    // Notifications - Full access
    Permission.create(Resource.NOTIFICATIONS, Action.READ),
    Permission.create(Resource.NOTIFICATIONS, Action.CREATE),
  ],

  [Role.GERENTE]: [
    // Users - Read only
    Permission.create(Resource.USERS, Action.READ),

    // Audits - Create, read, update, approve, assign
    Permission.create(Resource.AUDITS, Action.CREATE),
    Permission.create(Resource.AUDITS, Action.READ),
    Permission.create(Resource.AUDITS, Action.UPDATE),
    Permission.create(Resource.AUDITS, Action.APPROVE),
    Permission.create(Resource.AUDITS, Action.ASSIGN),

    // Findings - Read and update
    Permission.create(Resource.FINDINGS, Action.READ),
    Permission.create(Resource.FINDINGS, Action.UPDATE),

    // Reports - Create, read, export
    Permission.create(Resource.REPORTS, Action.CREATE),
    Permission.create(Resource.REPORTS, Action.READ),
    Permission.create(Resource.REPORTS, Action.EXPORT),

    // Clients - Read
    Permission.create(Resource.CLIENTS, Action.READ),

    // Notifications - Read
    Permission.create(Resource.NOTIFICATIONS, Action.READ),
  ],

  [Role.AUDITOR]: [
    // Audits - Read and update assigned audits
    Permission.create(Resource.AUDITS, Action.READ),
    Permission.create(Resource.AUDITS, Action.UPDATE),

    // Findings - Create, read, update
    Permission.create(Resource.FINDINGS, Action.CREATE),
    Permission.create(Resource.FINDINGS, Action.READ),
    Permission.create(Resource.FINDINGS, Action.UPDATE),

    // Reports - Create and read
    Permission.create(Resource.REPORTS, Action.CREATE),
    Permission.create(Resource.REPORTS, Action.READ),

    // Clients - Read
    Permission.create(Resource.CLIENTS, Action.READ),

    // Notifications - Read
    Permission.create(Resource.NOTIFICATIONS, Action.READ),
  ],

  [Role.CLIENTE]: [
    // Audits - Read only (own audits)
    Permission.create(Resource.AUDITS, Action.READ),

    // Findings - Read only (from own audits)
    Permission.create(Resource.FINDINGS, Action.READ),

    // Reports - Read only (own reports)
    Permission.create(Resource.REPORTS, Action.READ),

    // Notifications - Read
    Permission.create(Resource.NOTIFICATIONS, Action.READ),
  ],
}

/**
 * Helper class for checking role permissions
 */
export class RolePermissionChecker {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role]
    return rolePermissions.some((p) => p.equals(permission))
  }

  /**
   * Check if a role has all of the required permissions
   */
  static hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every((permission) =>
      this.hasPermission(role, permission),
    )
  }

  /**
   * Check if a role has any of the required permissions
   */
  static hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(role, permission))
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Get all permissions as strings for a role
   */
  static getPermissionsAsStrings(role: Role): string[] {
    return this.getPermissions(role).map((p) => p.toString())
  }
}
