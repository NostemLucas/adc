/**
 * Address Value Object
 * Encapsula una dirección física.
 *
 * Reglas de negocio:
 * - Puede ser null/undefined (campo opcional)
 * - Si se proporciona, se normaliza (trim, espacios múltiples)
 * - Longitud máxima: 200 caracteres
 */
export class Address {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Crea un Address desde un string.
   * Retorna null si el string está vacío.
   * @throws Error si el formato es inválido
   */
  static create(address: string | null | undefined): Address | null {
    // Si es null, undefined o vacío, retornar null
    if (!address || !address.trim()) {
      return null
    }

    const trimmed = address.trim()

    // Validar longitud máxima
    if (trimmed.length > 200) {
      throw new Error(
        'La dirección no puede tener más de 200 caracteres',
      )
    }

    // Normalizar: reemplazar múltiples espacios por uno solo
    const normalized = trimmed.replace(/\s+/g, ' ')

    return new Address(normalized)
  }

  /**
   * Obtiene el valor de la dirección.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Compara con otra Address.
   */
  equals(other: Address): boolean {
    return this.value === other.value
  }

  /**
   * Representación en string.
   */
  toString(): string {
    return this.value
  }
}
