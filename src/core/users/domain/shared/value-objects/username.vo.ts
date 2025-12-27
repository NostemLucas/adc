import { EmptyFieldException } from '../../user/exceptions'

/**
 * Username Value Object
 * Encapsula el nombre de usuario del sistema.
 *
 * Reglas de negocio:
 * - No puede estar vacío
 * - Se convierte a minúsculas
 * - Se elimina espacios en blanco
 * - Longitud mínima: 3 caracteres
 * - Longitud máxima: 20 caracteres
 * - Solo caracteres alfanuméricos, guiones y guiones bajos
 */
export class Username {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Crea un Username desde un string.
   * @throws EmptyFieldException si está vacío
   * @throws Error si el formato es inválido
   */
  static create(username: string): Username {
    const trimmed = username?.trim()

    // Validar que no esté vacío
    if (!trimmed) {
      throw new EmptyFieldException('nombre de usuario')
    }

    // Convertir a minúsculas y eliminar espacios
    const normalized = trimmed.toLowerCase().replace(/\s/g, '')

    // Validar longitud mínima
    if (normalized.length < 3) {
      throw new Error(
        'El nombre de usuario debe tener al menos 3 caracteres',
      )
    }

    // Validar longitud máxima
    if (normalized.length > 20) {
      throw new Error(
        'El nombre de usuario no puede tener más de 20 caracteres',
      )
    }

    // Validar formato: solo alfanuméricos, guiones y guiones bajos
    const validUsernamePattern = /^[a-z0-9_-]+$/
    if (!validUsernamePattern.test(normalized)) {
      throw new Error(
        'El nombre de usuario solo puede contener letras minúsculas, números, guiones y guiones bajos',
      )
    }

    // No puede empezar o terminar con guión o guión bajo
    if (/^[-_]|[-_]$/.test(normalized)) {
      throw new Error(
        'El nombre de usuario no puede empezar o terminar con guión o guión bajo',
      )
    }

    return new Username(normalized)
  }

  /**
   * Obtiene el valor del username.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Compara con otro Username.
   */
  equals(other: Username): boolean {
    return this.value === other.value
  }

  /**
   * Representación en string.
   */
  toString(): string {
    return this.value
  }
}
