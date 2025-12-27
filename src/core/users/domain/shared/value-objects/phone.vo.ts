import { InvalidPhoneFormatException } from '../../user/exceptions'

/**
 * Phone Value Object
 *
 * Encapsula:
 * - Validación de formato de teléfono boliviano
 * - Normalización (solo dígitos)
 * - Comportamiento relacionado al teléfono (tipo, formato, etc.)
 *
 * Garantiza que un Phone siempre sea válido.
 *
 * @example
 * ```typescript
 * const phone = Phone.create('70123456')
 * phone.getValue() // '70123456'
 * phone.getFormatted() // '70-12-3456'
 * phone.isMobile() // true
 * ```
 */
export class Phone {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Factory method para crear un Phone válido.
   *
   * @param phone String del teléfono
   * @returns Phone Value Object
   * @throws InvalidPhoneFormatException si el formato es inválido
   */
  static create(phone: string): Phone {
    const normalized = Phone.normalize(phone)

    if (!Phone.isValid(normalized)) {
      throw new InvalidPhoneFormatException()
    }

    return new Phone(normalized)
  }

  /**
   * Obtiene el valor del teléfono como string (solo dígitos).
   */
  getValue(): string {
    return this.value
  }

  /**
   * Obtiene el teléfono formateado para visualización.
   *
   * @example
   * Phone.create('70123456').getFormatted() // '70-12-3456'
   * Phone.create('22123456').getFormatted() // '2-212-3456' (fijo)
   */
  getFormatted(): string {
    if (this.isMobile()) {
      // Móvil: 70-12-3456
      return `${this.value.slice(0, 2)}-${this.value.slice(2, 4)}-${this.value.slice(4)}`
    } else {
      // Fijo: 2-212-3456
      return `${this.value.slice(0, 1)}-${this.value.slice(1, 4)}-${this.value.slice(4)}`
    }
  }

  /**
   * Verifica si es un número móvil.
   *
   * En Bolivia, los móviles empiezan con 6 o 7.
   */
  isMobile(): boolean {
    const firstDigit = this.value[0]
    return firstDigit === '6' || firstDigit === '7'
  }

  /**
   * Verifica si es un número fijo.
   */
  isLandline(): boolean {
    return !this.isMobile()
  }

  /**
   * Obtiene el operador móvil (solo para móviles).
   *
   * @returns Operador o null si es fijo
   */
  getCarrier(): string | null {
    if (!this.isMobile()) {
      return null
    }

    const firstTwoDigits = this.value.slice(0, 2)

    const carriers: Record<string, string> = {
      '60': 'Viva',
      '61': 'Viva',
      '62': 'Viva',
      '63': 'Viva',
      '70': 'Entel',
      '71': 'Entel',
      '72': 'Entel',
      '73': 'Entel',
      '74': 'Tigo',
      '75': 'Tigo',
      '76': 'Tigo',
      '77': 'Tigo',
      '78': 'Tigo',
      '79': 'Tigo',
    }

    return carriers[firstTwoDigits] || 'Desconocido'
  }

  /**
   * Obtiene el teléfono en formato internacional.
   *
   * @example
   * Phone.create('70123456').getInternational() // '+591 70123456'
   */
  getInternational(): string {
    return `+591 ${this.value}`
  }

  /**
   * Compara dos teléfonos por valor.
   */
  equals(other: Phone): boolean {
    return this.value === other.value
  }

  /**
   * Representación string del teléfono.
   */
  toString(): string {
    return this.value
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Normaliza un teléfono (solo dígitos, sin espacios ni guiones).
   */
  private static normalize(phone: string): string {
    return phone.trim().replace(/\D/g, '') // Eliminar todo excepto dígitos
  }

  /**
   * Valida el formato del teléfono.
   *
   * Formato válido: 8 dígitos numéricos
   * Primer dígito: 2, 3, 4, 6, 7 (departamentos y móviles)
   */
  private static isValid(phone: string): boolean {
    // 8 dígitos
    if (!/^\d{8}$/.test(phone)) {
      return false
    }

    // Primer dígito válido
    const firstDigit = phone[0]
    const validFirstDigits = ['2', '3', '4', '6', '7']

    return validFirstDigits.includes(firstDigit)
  }
}
