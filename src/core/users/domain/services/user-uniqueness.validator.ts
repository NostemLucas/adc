import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../infrastructure/user.repository'
import {
  DuplicateEmailException,
  DuplicateUsernameException,
  DuplicateCiException,
} from '../exceptions'

/**
 * Domain Service para validar unicidad de usuarios.
 *
 * Este es un Domain Service porque:
 * - Encapsula lógica de dominio (unicidad de usuarios)
 * - Requiere acceso al repositorio (no puede ir en la entidad)
 * - Es reutilizable entre múltiples Use Cases
 * - No tiene estado (stateless)
 *
 * @see https://enterprisecraftsmanship.com/posts/domain-services-in-ddd/
 */
@Injectable()
export class UserUniquenessValidator {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Valida que email, username y CI sean únicos en el sistema.
   *
   * Usado en CREATE: valida que no exista ningún usuario con estos valores.
   *
   * @param email Email a validar
   * @param username Username a validar
   * @param ci CI a validar
   *
   * @throws DuplicateEmailException si el email ya existe
   * @throws DuplicateUsernameException si el username ya existe
   * @throws DuplicateCiException si el CI ya existe
   *
   * @example
   * ```typescript
   * // En CreateUserUseCase
   * await this.uniquenessValidator.validateForCreate(
   *   dto.email,
   *   dto.username,
   *   dto.ci
   * )
   * ```
   */
  async validateForCreate(
    email: string,
    username: string,
    ci: string,
  ): Promise<void> {
    // Ejecutar las 3 validaciones en paralelo para mejor performance
    const [existingEmail, existingUsername, existingCi] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByUsername(username),
      this.userRepository.findByCi(ci),
    ])

    if (existingEmail !== null) {
      throw new DuplicateEmailException(email)
    }

    if (existingUsername !== null) {
      throw new DuplicateUsernameException(username)
    }

    if (existingCi !== null) {
      throw new DuplicateCiException(ci)
    }
  }

  /**
   * Valida unicidad de campos que están siendo actualizados.
   *
   * Usado en UPDATE: solo valida campos que cambiaron y que son diferentes
   * al usuario actual (permite mantener los mismos valores).
   *
   * @param userId ID del usuario que se está actualizando
   * @param email Email nuevo (opcional)
   * @param currentEmail Email actual del usuario
   * @param username Username nuevo (opcional)
   * @param currentUsername Username actual del usuario
   * @param ci CI nuevo (opcional)
   * @param currentCi CI actual del usuario
   *
   * @throws DuplicateEmailException si el nuevo email existe en otro usuario
   * @throws DuplicateUsernameException si el nuevo username existe en otro usuario
   * @throws DuplicateCiException si el nuevo CI existe en otro usuario
   *
   * @example
   * ```typescript
   * // En UpdateUserUseCase
   * await this.uniquenessValidator.validateForUpdate(
   *   user.id,
   *   dto.email,
   *   user.email,
   *   dto.username,
   *   user.username,
   *   dto.ci,
   *   user.ci
   * )
   * ```
   */
  async validateForUpdate(
    userId: string,
    email: string | undefined,
    currentEmail: string,
    username: string | undefined,
    currentUsername: string,
    ci: string | undefined,
    currentCi: string,
  ): Promise<void> {
    const validations: Promise<void>[] = []

    // Solo validar email si está siendo actualizado Y es diferente
    if (email && email !== currentEmail) {
      validations.push(this.validateEmailUniqueness(email, userId))
    }

    // Solo validar username si está siendo actualizado Y es diferente
    if (username && username !== currentUsername) {
      validations.push(this.validateUsernameUniqueness(username, userId))
    }

    // Solo validar CI si está siendo actualizado Y es diferente
    if (ci && ci !== currentCi) {
      validations.push(this.validateCiUniqueness(ci, userId))
    }

    // Ejecutar todas las validaciones en paralelo
    await Promise.all(validations)
  }

  /**
   * Valida que un email sea único, excluyendo un usuario específico.
   *
   * @param email Email a validar
   * @param excludeUserId ID del usuario a excluir de la validación
   */
  private async validateEmailUniqueness(
    email: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existing = await this.userRepository.findByEmail(email)

    if (existing !== null && existing.id !== excludeUserId) {
      throw new DuplicateEmailException(email)
    }
  }

  /**
   * Valida que un username sea único, excluyendo un usuario específico.
   *
   * @param username Username a validar
   * @param excludeUserId ID del usuario a excluir de la validación
   */
  private async validateUsernameUniqueness(
    username: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existing = await this.userRepository.findByUsername(username)

    if (existing !== null && existing.id !== excludeUserId) {
      throw new DuplicateUsernameException(username)
    }
  }

  /**
   * Valida que un CI sea único, excluyendo un usuario específico.
   *
   * @param ci CI a validar
   * @param excludeUserId ID del usuario a excluir de la validación
   */
  private async validateCiUniqueness(
    ci: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existing = await this.userRepository.findByCi(ci)

    if (existing !== null && existing.id !== excludeUserId) {
      throw new DuplicateCiException(ci)
    }
  }
}
