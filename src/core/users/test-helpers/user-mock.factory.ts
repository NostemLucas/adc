/**
 * User Mock Factory
 *
 * Helper functions to create mock users for testing.
 * Handles Value Objects (Email, CI, Phone) and UserStatus enum correctly.
 */

import { User } from '../domain/user.entity'
import { Role } from '../../roles/domain/role.entity'
import { Email, CI, Phone } from '../domain/value-objects'
import { UserStatus } from '../domain/constants'
import { Permission } from '../../permissions/domain/permission.entity'

/**
 * Create a mock Role for testing
 */
export function createMockRole(overrides?: Partial<Role>): Role {
  return {
    id: 'role-1',
    name: 'ADMINISTRADOR',
    description: 'Administrador del sistema',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    permissions: [],

    // Role methods (as jest mocks)
    isClient: false,
    isAdmin: true,
    isManager: false,
    isAuditor: false,
    update: jest.fn(),

    ...overrides,
  } as Role
}

/**
 * Create a mock Permission for testing
 */
export function createMockPermission(
  overrides?: Partial<Permission>,
): Permission {
  return {
    id: 'permission-1',
    name: 'CREATE_USER',
    description: 'Crear usuarios',
    resource: 'USERS',
    action: 'CREATE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as Permission
}

/**
 * Create a mock User for testing with Value Objects
 */
export function createMockUser(overrides?: Partial<User>): User {
  const defaultRole = createMockRole()

  return {
    id: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    names: 'Juan',
    lastNames: 'Pérez',
    email: Email.create('juan@example.com'),
    phone: Phone.create('70123456'),
    username: 'juanperez',
    password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // password123
    ci: CI.create('12345678'),
    image: null,
    address: null,
    status: UserStatus.ACTIVE,
    failedLoginAttempts: 0,
    lockUntil: null,
    roles: [defaultRole],

    // Computed properties
    get fullName() {
      return `${this.names} ${this.lastNames}`
    },

    get isLocked() {
      return this.lockUntil ? new Date() < this.lockUntil : false
    },

    get isActive() {
      return this.status === UserStatus.ACTIVE && !this.isLocked
    },

    get isInactive() {
      return this.status === UserStatus.INACTIVE
    },

    // Role checks (getters)
    get isAdmin() {
      return this.roles.some((role) => role.isAdmin)
    },

    get isManager() {
      return this.roles.some((role) => role.isManager)
    },

    get isClient() {
      return this.roles.some((role) => role.isClient)
    },

    get isAuditor() {
      return this.roles.some((role) => role.isAuditor)
    },

    // Methods as jest mocks
    canAttemptLogin: jest.fn().mockReturnValue(true),
    incrementFailedAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    changeStatus: jest.fn(),
    hasPermission: jest.fn().mockReturnValue(true),
    hasAnyPermission: jest.fn().mockReturnValue(true),
    hasAllPermissions: jest.fn().mockReturnValue(true),
    hasRole: jest.fn().mockReturnValue(true),

    ...overrides,
  } as User
}

/**
 * Create a mock User with invalid phone (for testing validation)
 */
export function createMockUserWithoutPhone(overrides?: Partial<User>): User {
  return createMockUser({
    phone: undefined,
    ...overrides,
  })
}

/**
 * Create a mock User with specific role
 */
export function createMockUserWithRole(
  roleName: string,
  overrides?: Partial<User>,
): User {
  const role = createMockRole({ name: roleName })
  return createMockUser({
    roles: [role],
    ...overrides,
  })
}

/**
 * Create multiple mock users
 */
export function createMockUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      id: `user-${i + 1}`,
      email: Email.create(`user${i + 1}@example.com`),
      username: `user${i + 1}`,
      ci: CI.create(`1234567${i}`),
    }),
  )
}

/**
 * Valid bcrypt hash for testing (password: password123)
 */
export const VALID_BCRYPT_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
