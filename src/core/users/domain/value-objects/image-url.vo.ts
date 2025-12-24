/**
 * ImageUrl Value Object
 * Encapsula una URL de imagen.
 *
 * Reglas de negocio:
 * - Puede ser null/undefined (campo opcional)
 * - Si se proporciona, debe ser una URL válida o ruta válida
 * - Se elimina espacios en blanco
 */
export class ImageUrl {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  /**
   * Crea un ImageUrl desde un string.
   * Retorna null si el string está vacío.
   * @throws Error si el formato es inválido
   */
  static create(imageUrl: string | null | undefined): ImageUrl | null {
    // Si es null, undefined o vacío, retornar null
    if (!imageUrl || !imageUrl.trim()) {
      return null
    }

    const trimmed = imageUrl.trim()

    // Validar que sea una URL válida o ruta válida
    const isValidUrl = ImageUrl.isValidUrlOrPath(trimmed)

    if (!isValidUrl) {
      throw new Error(
        'La URL de imagen no es válida',
      )
    }

    return new ImageUrl(trimmed)
  }

  /**
   * Valida si es una URL o ruta válida.
   */
  private static isValidUrlOrPath(value: string): boolean {
    // Permitir URLs completas (http, https)
    const urlPattern = /^https?:\/\/.+/i
    if (urlPattern.test(value)) {
      return true
    }

    // Permitir rutas relativas válidas
    const pathPattern = /^[a-zA-Z0-9_\-/\.]+\.(jpg|jpeg|png|gif|webp|svg)$/i
    if (pathPattern.test(value)) {
      return true
    }

    // Permitir rutas que empiecen con /
    const absolutePathPattern = /^\/[a-zA-Z0-9_\-/\.]+$/
    if (absolutePathPattern.test(value)) {
      return true
    }

    return false
  }

  /**
   * Obtiene el valor de la URL.
   */
  getValue(): string {
    return this.value
  }

  /**
   * Compara con otra ImageUrl.
   */
  equals(other: ImageUrl): boolean {
    return this.value === other.value
  }

  /**
   * Representación en string.
   */
  toString(): string {
    return this.value
  }
}
