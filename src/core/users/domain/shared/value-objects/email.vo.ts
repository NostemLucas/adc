import { InvalidEmailFormatException } from '../../user/exceptions'

/**
 * Email Value Object
 *
 * Encapsula:
 * - Validación de formato de email
 * - Normalización (lowercase, trim)
 * - Comportamiento relacionado al email (dominio, etc.)
 *
 * Garantiza que un Email siempre sea válido.
 *
 * @example
 * ```typescript
 * const email = Email.create('John@Example.com')
 * email.getValue() // 'john@example.com'
 * email.getDomain() // 'example.com'
 * email.getLocalPart() // 'john'
 * ```
 */
export class Email {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Factory method para crear un Email válido.
   *
   * @param email String del email
   * @returns Email Value Object
   * @throws InvalidEmailFormatException si el formato es inválido
   */
  static create(email: string): Email {
    const normalized = Email.normalize(email)

    if (!Email.isValid(normalized)) {
      throw new InvalidEmailFormatException()
    }

    return new Email(normalized)
  }

  /**
   * Obtiene el valor del email como string.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Obtiene el dominio del email (parte después del @).
   *
   * @example
   * Email.create('user@example.com').getDomain() // 'example.com'
   */
  getDomain(): string {
    return this.value.split('@')[1]
  }

  /**
   * Obtiene la parte local del email (parte antes del @).
   *
   * @example
   * Email.create('user@example.com').getLocalPart() // 'user'
   */
  getLocalPart(): string {
    return this.value.split('@')[0]
  }

  /**
   * Verifica si es un email personal (gmail, hotmail, etc.).
   */
  isPersonalEmail(): boolean {
    const personalDomains = [
      'gmail.com',
      'hotmail.com',
      'yahoo.com',
      'outlook.com',
      'live.com',
      'icloud.com',
    ]

    return personalDomains.includes(this.getDomain())
  }

  /**
   * Verifica si es un email corporativo.
   */
  isCorporateEmail(): boolean {
    return !this.isPersonalEmail()
  }

  /**
   * Compara dos emails por valor.
   */
  equals(other: Email): boolean {
    return this.value === other.value
  }

  /**
   * Representación string del email.
   */
  toString(): string {
    return this.value
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Normaliza un email (lowercase, trim).
   */
  private static normalize(email: string): string {
    return email.trim().toLowerCase()
  }

  /**
   * Valida el formato del email.
   */
  private static isValid(email: string): boolean {
    // RFC 5322 simplificado
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}
