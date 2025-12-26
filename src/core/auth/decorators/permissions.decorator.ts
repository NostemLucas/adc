import { SetMetadata } from '@nestjs/common'
import { Permission } from '../domain/authorization'

/**
 * Permissions Decorator
 *
 * Use this decorator to protect routes/controllers with specific permissions.
 * The user must have ALL specified permissions to access the route.
 *
 * @example
 * ```typescript
 * @Post()
 * @RequirePermissions(
 *   Permission.create(Resource.USERS, Action.CREATE)
 * )
 * async createUser(@Body() dto: CreateUserDto) {
 *   // ...
 * }
 * ```
 */
export const PERMISSIONS_KEY = 'permissions'

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)
