import { EmptyFieldException } from '../../user/exceptions'

/**
 * PersonName Value Object
 * Encapsula el nombre de una persona (names o lastNames).
 *
 * Reglas de negocio:
 * - No puede estar vacío
 * - Se elimina espacios en blanco al inicio/fin
 * - Capitaliza la primera letra de cada palabra
 * - Longitud mínima: 2 caracteres
 * - Longitud máxima: 50 caracteres
 */
export class PersonName {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Crea un PersonName desde un string.
   * @throws EmptyFieldException si el nombre está vacío
   * @throws Error si el formato es inválido
   */
  static create(name: string, fieldName: string = 'nombre'): PersonName {
    const trimmed = name?.trim()

    // Validar que no esté vacío
    if (!trimmed) {
      throw new EmptyFieldException(fieldName)
    }

    // Validar longitud mínima
    if (trimmed.length < 2) {
      throw new Error(`${fieldName} debe tener al menos 2 caracteres`)
    }

    // Validar longitud máxima
    if (trimmed.length > 50) {
      throw new Error(`${fieldName} no puede tener más de 50 caracteres`)
    }

    // Validar que solo contenga letras, espacios y algunos caracteres especiales
    const validNamePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/
    if (!validNamePattern.test(trimmed)) {
      throw new Error(
        `${fieldName} solo puede contener letras, espacios, guiones y apóstrofes`,
      )
    }

    // Capitalizar primera letra de cada palabra
    const capitalized = PersonName.capitalize(trimmed)

    return new PersonName(capitalized)
  }

  /**
   * Capitaliza la primera letra de cada palabra.
   */
  private static capitalize(text: string): string {
    return text
      .split(' ')
      .map((word) => {
        if (word.length === 0) return word
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }

  /**
   * Obtiene el valor del nombre.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Compara con otro PersonName.
   */
  equals(other: PersonName): boolean {
    return this.value === other.value
  }

  /**
   * Representación en string.
   */
  toString(): string {
    return this.value
  }
}
