import { Resource } from './resource.enum'
import { Action } from './action.enum'

/**
 * Permission Value Object
 *
 * Represents a permission in the system as a combination of Resource:Action
 * Example: "users:create", "audits:read", "reports:export"
 *
 * This is a Value Object because:
 * - It has no identity (two permissions with same resource:action are equal)
 * - It's immutable
 * - It's side-effect free
 */
export class Permission {
  private readonly value: string

  private constructor(
    private readonly resource: Resource,
    private readonly action: Action,
  ) {
    this.value = `${resource}:${action}`
  }

  /**
   * Create a permission from resource and action
   */
  static create(resource: Resource, action: Action): Permission {
    return new Permission(resource, action)
  }

  /**
   * Create a permission from string (e.g., "users:create")
   */
  static fromString(permissionString: string): Permission {
    const [resource, action] = permissionString.split(':')

    if (!resource || !action) {
      throw new Error(`Invalid permission format: ${permissionString}`)
    }

    if (!Object.values(Resource).includes(resource as Resource)) {
      throw new Error(`Invalid resource: ${resource}`)
    }

    if (!Object.values(Action).includes(action as Action)) {
      throw new Error(`Invalid action: ${action}`)
    }

    return new Permission(resource as Resource, action as Action)
  }

  /**
   * Get the resource of this permission
   */
  getResource(): Resource {
    return this.resource
  }

  /**
   * Get the action of this permission
   */
  getAction(): Action {
    return this.action
  }

  /**
   * Get the string representation (e.g., "users:create")
   */
  toString(): string {
    return this.value
  }

  /**
   * Check if this permission equals another
   */
  equals(other: Permission): boolean {
    if (!other) return false
    return this.value === other.value
  }

  /**
   * Get the value (for serialization)
   */
  getValue(): string {
    return this.value
  }
}
