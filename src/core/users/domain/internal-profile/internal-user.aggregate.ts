import { User } from '../user/user.entity'
import { InternalProfile } from './internal-profile.entity'
import { SystemRole } from '../shared/constants'
import { InvalidUserTypeException } from '../user/exceptions'

/**
 * Agregado InternalUser
 *
 * Representa un usuario interno del sistema (administrador, gerente, auditor).
 * Combina User base + InternalProfile.
 */
export class InternalUser {
  private _user: User
  private _profile: InternalProfile

  private constructor(user: User, profile: InternalProfile) {
    // VALIDACIÓN: El userId del perfil debe coincidir con el id del usuario
    if (profile.userId !== user.id) {
      throw new InvalidUserTypeException(
        'El perfil no corresponde a este usuario',
      )
    }

    this._user = user
    this._profile = profile
  }

  // ===== GETTERS DE USER =====

  get id(): string {
    return this._user.id
  }

  get user(): User {
    return this._user
  }

  get profile(): InternalProfile {
    return this._profile
  }

  get email(): string {
    return this._user.email.getValue()
  }

  get username(): string {
    return this._user.username.getValue()
  }

  get fullName(): string {
    return this._user.fullName
  }

  get isActive(): boolean {
    return this._user.isActive
  }

  get isLocked(): boolean {
    return this._user.isLocked
  }

  // ===== GETTERS DE PROFILE =====

  get profileId(): string {
    return this._profile.id
  }

  get roles(): SystemRole[] {
    return this._profile.roles
  }

  get department(): string | null {
    return this._profile.department
  }

  get employeeCode(): string | null {
    return this._profile.employeeCode
  }

  get hireDate(): Date | null {
    return this._profile.hireDate
  }

  get primaryRole(): SystemRole {
    return this._profile.primaryRole
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====

  get isAdmin(): boolean {
    return this._profile.isAdmin
  }

  get isManager(): boolean {
    return this._profile.isManager
  }

  get isAuditor(): boolean {
    return this._profile.isAuditor
  }

  hasRole(role: SystemRole): boolean {
    return this._profile.hasRole(role)
  }

  hasAnyRole(...roles: SystemRole[]): boolean {
    return this._profile.hasAnyRole(...roles)
  }

  hasAllRoles(...roles: SystemRole[]): boolean {
    return this._profile.hasAllRoles(...roles)
  }

  canAttemptLogin(): boolean {
    return this._user.canAttemptLogin()
  }

  // ===== FACTORY METHOD =====

  static create(user: User, profile: InternalProfile): InternalUser {
    return new InternalUser(user, profile)
  }

  /**
   * Extrae todos los eventos de dominio del agregado (User + Profile).
   */
  getDomainEvents() {
    return [...this._user.domainEvents, ...this._profile.domainEvents]
  }

  /**
   * Limpia los eventos de dominio del agregado.
   */
  clearDomainEvents(): void {
    this._user.clearDomainEvents()
    this._profile.clearDomainEvents()
  }
}
