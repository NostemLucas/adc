import { InvalidPasswordException } from '../exceptions'

/**
 * HashedPassword Value Object
 * Encapsula una contraseña ya hasheada.
 *
 * Reglas de negocio:
 * - Debe ser un hash válido (bcrypt, argon2, SHA-512, SHA-256)
 * - No acepta contraseñas en texto plano
 * - Inmutable
 */
export class HashedPassword {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Crea un HashedPassword desde un string.
   * @throws InvalidPasswordException si no es un hash válido
   */
  static create(password: string): HashedPassword {
    if (!password) {
      throw new InvalidPasswordException('La contraseña no puede estar vacía')
    }

    if (!HashedPassword.isValidHash(password)) {
      throw new InvalidPasswordException(
        'La contraseña debe estar hasheada. Se detectó texto plano.',
      )
    }

    return new HashedPassword(password)
  }

  /**
   * Valida que sea un hash válido (no texto plano).
   * Soporta múltiples algoritmos: bcrypt, argon2, SHA-512, SHA-256
   */
  private static isValidHash(password: string): boolean {
    const hashPatterns = [
      /^\$2[aby]\$/, // bcrypt ($2a$, $2b$, $2y$)
      /^\$argon2/, // argon2 ($argon2i$, $argon2d$, $argon2id$)
      /^\$6\$/, // SHA-512 (crypt)
      /^\$5\$/, // SHA-256 (crypt)
    ]

    return hashPatterns.some((pattern) => pattern.test(password))
  }

  /**
   * Obtiene el valor del hash.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Compara con otro HashedPassword.
   */
  equals(other: HashedPassword): boolean {
    return this.value === other.value
  }

  /**
   * Representación en string.
   */
  toString(): string {
    // Por seguridad, no mostramos el hash completo
    return '[HASHED_PASSWORD]'
  }
}
