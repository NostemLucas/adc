/**
 * System Actions
 *
 * Represents the possible actions that can be performed on resources.
 * Used in combination with Resource to form permissions (e.g., "users:create")
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  APPROVE = 'approve',
  ASSIGN = 'assign',
}
