import { User } from '../user/user.entity'
import { ExternalProfile } from './external-profile.entity'
import { InvalidUserTypeException } from '../user/exceptions'

/**
 * Agregado ExternalUser
 *
 * Representa un usuario externo (cliente de una organización).
 * Combina User base + ExternalProfile.
 */
export class ExternalUser {
  private _user: User
  private _profile: ExternalProfile

  private constructor(user: User, profile: ExternalProfile) {
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

  get profile(): ExternalProfile {
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
    return this._user.isActive && this._profile.isActive
  }

  get isLocked(): boolean {
    return this._user.isLocked
  }

  // ===== GETTERS DE PROFILE =====

  get profileId(): string {
    return this._profile.id
  }

  get organizationId(): string {
    return this._profile.organizationId
  }

  get jobTitle(): string | null {
    return this._profile.jobTitle
  }

  get department(): string | null {
    return this._profile.department
  }

  get organizationalEmail(): string | null {
    return this._profile.organizationalEmail?.getValue() ?? null
  }

  get joinedAt(): Date {
    return this._profile.joinedAt
  }

  get leftAt(): Date | null {
    return this._profile.leftAt
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====

  canAttemptLogin(): boolean {
    // El usuario externo debe estar activo tanto en User como en Profile
    return this._user.canAttemptLogin() && this._profile.isActive
  }

  activateProfile(): void {
    this._profile.activate()
  }

  deactivateProfile(): void {
    this._profile.deactivate()
  }

  // ===== FACTORY METHOD =====

  static create(user: User, profile: ExternalProfile): ExternalUser {
    return new ExternalUser(user, profile)
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
