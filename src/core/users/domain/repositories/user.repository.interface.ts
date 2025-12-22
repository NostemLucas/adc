import { User } from '../user.entity'

/**
 * User Repository Interface (Port)
 *
 * Defines the contract for user persistence operations.
 * This interface belongs to the domain layer and is implemented
 * by the infrastructure layer (dependency inversion).
 *
 * Benefits:
 * - Testable: Easy to mock in unit tests
 * - Decoupled: Use cases don't depend on concrete implementation
 * - Flexible: Can swap implementations (e.g., Prisma, TypeORM, MongoDB)
 */
export interface IUserRepository {
  /**
   * Find user by ID
   * @param id User ID
   * @returns User or null if not found
   */
  findById(id: string): Promise<User | null>

  /**
   * Find user by ID or throw error
   * @param id User ID
   * @returns User
   * @throws NotFoundException if user not found
   */
  findByIdOrFail(id: string): Promise<User>

  /**
   * Find user by email
   * @param email User email
   * @returns User or null if not found
   */
  findByEmail(email: string): Promise<User | null>

  /**
   * Find user by username
   * @param username Username
   * @returns User or null if not found
   */
  findByUsername(username: string): Promise<User | null>

  /**
   * Find user by username or email (for login)
   * @param usernameOrEmail Username or email
   * @returns User or null if not found
   */
  findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null>

  /**
   * Find user by CI (Cédula de Identidad)
   * @param ci CI number
   * @returns User or null if not found
   */
  findByCi(ci: string): Promise<User | null>

  /**
   * Find all active users
   * @returns Array of active users
   */
  findActiveUsers(): Promise<User[]>

  /**
   * Find users by role
   * @param roleId Role ID
   * @returns Array of users with that role
   */
  findByRole(roleId: string): Promise<User[]>

  /**
   * Save user (create or update)
   * @param user User entity
   * @returns Saved user
   */
  save(user: User): Promise<User>

  /**
   * Delete user (soft delete)
   * @param id User ID
   */
  delete(id: string): Promise<void>

  /**
   * Check if email exists
   * @param email Email to check
   * @param excludeUserId Optional user ID to exclude (for updates)
   * @returns True if exists, false otherwise
   */
  existsByEmail(email: string, excludeUserId?: string): Promise<boolean>

  /**
   * Check if username exists
   * @param username Username to check
   * @param excludeUserId Optional user ID to exclude (for updates)
   * @returns True if exists, false otherwise
   */
  existsByUsername(username: string, excludeUserId?: string): Promise<boolean>

  /**
   * Check if CI exists
   * @param ci CI to check
   * @param excludeUserId Optional user ID to exclude (for updates)
   * @returns True if exists, false otherwise
   */
  existsByCi(ci: string, excludeUserId?: string): Promise<boolean>
}
