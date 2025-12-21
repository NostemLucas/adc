/**
 * Tipos y configuraciones para el sistema de subida de archivos
 */

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  ANY = 'any',
}

export interface FileValidationOptions {
  /** Tipos de archivo permitidos */
  fileType?: FileType
  /** Tamaño máximo en bytes (por defecto 5MB) */
  maxSizeInBytes?: number
  /** Tipos MIME permitidos */
  allowedMimeTypes?: string[]
  /** Extensiones permitidas */
  allowedExtensions?: string[]
  /** Si el archivo es requerido */
  required?: boolean
}

export interface FileUploadConfig {
  /** Nombre del campo en el formulario */
  fieldName: string
  /** Opciones de validación */
  validation: FileValidationOptions
  /** Carpeta de destino */
  destination?: string
  /** Si se debe generar un nombre único */
  generateUniqueName?: boolean
}

export interface UploadedFileInfo {
  /** Nombre original del archivo */
  originalName: string
  /** Nombre guardado en el servidor */
  filename: string
  /** Ruta completa del archivo */
  path: string
  /** Tipo MIME */
  mimetype: string
  /** Tamaño en bytes */
  size: number
  /** URL pública (si aplica) */
  url?: string
}

/**
 * Configuraciones predefinidas para tipos comunes
 */
export const FileConfigs: Record<string, FileValidationOptions> = {
  /**
   * Configuración específica para avatares de usuario
   * Optimizada para fotos de perfil pequeñas
   */
  UserAvatar: {
    fileType: FileType.IMAGE,
    maxSizeInBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  /**
   * Configuración genérica para imágenes
   * Usar para galerías, fotos de productos, etc. (no avatares)
   */
  Image: {
    fileType: FileType.IMAGE,
    maxSizeInBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  /**
   * Configuración para documentos (PDF, Word)
   */
  Document: {
    fileType: FileType.DOCUMENT,
    maxSizeInBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
  },

  /**
   * Configuración para archivos adjuntos de auditoría
   * Acepta múltiples tipos: imágenes, PDFs, Excel
   */
  AuditAttachment: {
    fileType: FileType.ANY,
    maxSizeInBytes: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.xlsx'],
  },
}
