import { InvalidCiFormatException } from '../exceptions'

/**
 * CI (Cédula de Identidad) Value Object
 *
 * Encapsula:
 * - Validación de formato de CI boliviano
 * - Normalización (solo dígitos)
 * - Comportamiento relacionado al CI (departamento, extensión, etc.)
 *
 * Garantiza que un CI siempre sea válido.
 *
 * @example
 * ```typescript
 * const ci = CI.create('12345678')
 * ci.getValue() // '12345678'
 * ci.getDepartment() // 'La Paz'
 * ci.getExtension() // '1'
 * ```
 */
export class CI {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Factory method para crear un CI válido.
   *
   * @param ci String del CI
   * @returns CI Value Object
   * @throws InvalidCiFormatException si el formato es inválido
   */
  static create(ci: string): CI {
    const normalized = CI.normalize(ci)

    if (!CI.isValid(normalized)) {
      throw new InvalidCiFormatException()
    }

    return new CI(normalized)
  }

  /**
   * Obtiene el valor del CI como string.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Obtiene el código de extensión (primeros dígitos).
   *
   * En Bolivia, los primeros dígitos identifican el departamento:
   * 1: La Paz, 2: Oruro, 3: Potosí, 4: Cochabamba, etc.
   *
   * @example
   * CI.create('12345678').getExtension() // '1' (La Paz)
   */
  getExtension(): string {
    return this.value.substring(0, 2)
  }

  /**
   * Obtiene el departamento de emisión del CI.
   *
   * @example
   * CI.create('12345678').getDepartment() // 'La Paz'
   * CI.create('74567890').getDepartment() // 'Santa Cruz'
   */
  getDepartment(): string {
    const extension = this.getExtension()
    const firstDigit = extension[0]

    const departments: Record<string, string> = {
      '1': 'La Paz',
      '2': 'Oruro',
      '3': 'Potosí',
      '4': 'Cochabamba',
      '5': 'Chuquisaca',
      '6': 'Tarija',
      '7': 'Santa Cruz',
      '8': 'Beni',
      '9': 'Pando',
    }

    return departments[firstDigit] || 'Desconocido'
  }

  /**
   * Obtiene el CI formateado para visualización.
   *
   * @example
   * CI.create('12345678').getFormatted() // '1234567-8 LP'
   */
  getFormatted(): string {
    const ext = this.getExtension()
    const number = this.value.substring(0, this.value.length - 1)
    const verifier = this.value.substring(this.value.length - 1)

    return `${number}-${verifier} ${this.getDepartmentCode()}`
  }

  /**
   * Obtiene el código del departamento (siglas).
   */
  getDepartmentCode(): string {
    const codes: Record<string, string> = {
      'La Paz': 'LP',
      'Oruro': 'OR',
      'Potosí': 'PT',
      'Cochabamba': 'CB',
      'Chuquisaca': 'CH',
      'Tarija': 'TJ',
      'Santa Cruz': 'SC',
      'Beni': 'BE',
      'Pando': 'PD',
    }

    return codes[this.getDepartment()] || 'XX'
  }

  /**
   * Compara dos CIs por valor.
   */
  equals(other: CI): boolean {
    return this.value === other.value
  }

  /**
   * Representación string del CI.
   */
  toString(): string {
    return this.value
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Normaliza un CI (solo dígitos, trim).
   */
  private static normalize(ci: string): string {
    return ci.trim().replace(/\D/g, '') // Eliminar todo excepto dígitos
  }

  /**
   * Valida el formato del CI.
   *
   * Formato válido: 7-10 dígitos numéricos
   */
  private static isValid(ci: string): boolean {
    return /^\d{7,10}$/.test(ci)
  }
}
