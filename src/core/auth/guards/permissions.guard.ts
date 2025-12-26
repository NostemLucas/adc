import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Permission, RolePermissionChecker, Role } from '../domain/authorization'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'

/**
 * Permissions Guard
 *
 * Protects routes based on required permissions.
 * Works in conjunction with @RequirePermissions() decorator.
 *
 * The guard checks if the authenticated user's role has all required permissions.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    // Get user from request (set by JWT guard)
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      return false
    }

    // Get user's current active role
    const userRole = this.getUserRole(user)

    if (!userRole) {
      return false
    }

    // Check if user's role has ALL required permissions
    return RolePermissionChecker.hasAllPermissions(userRole, requiredPermissions)
  }

  /**
   * Extract role from user object
   * Uses the currentRole property which represents the active role
   */
  private getUserRole(user: any): Role | null {
    // Use currentRole which represents the active role
    if (user.currentRole) {
      return user.currentRole as Role
    }

    return null
  }
}
