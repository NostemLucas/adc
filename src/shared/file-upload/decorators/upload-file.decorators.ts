import { applyDecorators, UseInterceptors } from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger'
import { FileValidationInterceptor } from '../interceptors/file-validation.interceptor'
import { FileValidationOptions, FileConfigs } from '../types/file-upload.types'

// ============================================================================
// 🛠️ HELPER FUNCTIONS
// ============================================================================

/**
 * Construye la descripción completa del archivo con restricciones
 */
function buildFileDescription(
  baseDescription: string,
  config: FileValidationOptions,
  required: boolean,
  additionalInfo?: string,
): string {
  const maxSizeMB = config.maxSizeInBytes
    ? (config.maxSizeInBytes / (1024 * 1024)).toFixed(2)
    : '5'

  const allowedTypes = config.allowedExtensions?.join(', ') || ''

  let description = baseDescription

  if (additionalInfo) {
    description += `\n\n${additionalInfo}`
  }

  if (allowedTypes) {
    description += `\n**Formatos permitidos:** ${allowedTypes}`
  }

  description += `\n**Tamaño máximo:** ${maxSizeMB}MB`

  if (!required) {
    description += '\n**Opcional**'
  }

  return description
}

// ============================================================================
// 🎯 INTERFACES
// ============================================================================

/**
 * Opciones para el decorador de upload
 */
interface UploadFileOptions {
  /** Nombre del campo (default: 'file') */
  field?: string
  /** Configuración de validación */
  config?: FileValidationOptions
  /** Descripción para Swagger */
  description?: string
  /** Si el archivo es requerido (default: true) */
  required?: boolean
}

interface UploadFilesOptions {
  /** Nombre del campo (default: 'files') */
  field?: string
  /** Número máximo de archivos (default: 10) */
  maxCount?: number
  /** Configuración de validación */
  config?: FileValidationOptions
  /** Descripción para Swagger */
  description?: string
  /** Si los archivos son requeridos (default: true) */
  required?: boolean
}

/**
 * 🔥 Decorador todo-en-uno para subir UN SOLO archivo
 * Combina: Multer + Validación + Swagger
 *
 * @example
 * ```typescript
 * @Post('upload-avatar')
 * @UploadFile({
 *   field: 'avatar',
 *   config: FileConfigs.UserAvatar,
 *   description: 'Subir avatar de usuario'
 * })
 * async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
 *   return this.userService.updateAvatar(file)
 * }
 * ```
 */
export function UploadFile(options: UploadFileOptions = {}): MethodDecorator {
  const fieldName = options.field || 'file'
  const config = options.config || {}
  const required = options.required ?? true
  const description = options.description || 'Subir archivo'

  // Usar helper para construir descripción
  const fullDescription = buildFileDescription(description, config, required)

  return applyDecorators(
    // ✅ Combinar interceptors en uno solo
    UseInterceptors(
      FileInterceptor(fieldName),
      new FileValidationInterceptor(fieldName, { ...config, required }, false),
    ),
    // Swagger
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: fullDescription,
      schema: {
        type: 'object',
        required: required ? [fieldName] : [],
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
            description: fullDescription,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Archivo subido exitosamente',
    }),
    ApiResponse({
      status: 400,
      description: 'Archivo inválido (tamaño, tipo o formato no permitido)',
    }),
  )
}

/**
 * 🔥 Decorador todo-en-uno para subir MÚLTIPLES archivos
 * Combina: Multer + Validación + Swagger
 *
 * @example
 * ```typescript
 * @Post('upload-documents')
 * @UploadFiles({
 *   field: 'documents',
 *   maxCount: 5,
 *   config: FileConfigs.Document,
 *   description: 'Subir documentos'
 * })
 * async uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
 *   return this.auditService.saveDocuments(files)
 * }
 * ```
 */
export function UploadFiles(options: UploadFilesOptions = {}): MethodDecorator {
  const fieldName = options.field || 'files'
  const maxCount = options.maxCount || 10
  const config = options.config || {}
  const required = options.required ?? true
  const description = options.description || 'Subir archivos'

  // Usar helper para construir descripción
  const fullDescription = buildFileDescription(
    description,
    config,
    required,
    `**Máximo de archivos:** ${maxCount}`,
  )

  return applyDecorators(
    // ✅ Combinar interceptors en uno solo
    UseInterceptors(
      FilesInterceptor(fieldName, maxCount),
      new FileValidationInterceptor(fieldName, { ...config, required }, true),
    ),
    // Swagger
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: fullDescription,
      schema: {
        type: 'object',
        required: required ? [fieldName] : [],
        properties: {
          [fieldName]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
            description: fullDescription,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Archivos subidos exitosamente',
    }),
    ApiResponse({
      status: 400,
      description: 'Archivos inválidos (tamaño, tipo o formato no permitido)',
    }),
  )
}

// ============================================================================
// 🎯 DECORADORES PREDEFINIDOS PARA CASOS COMUNES
// ============================================================================

/**
 * 🎨 Decorador específico para subir AVATAR de usuario
 *
 * @example
 * ```typescript
 * @Post(':id/avatar')
 * @UploadAvatar()
 * async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
 *   return this.userService.updateAvatar(file)
 * }
 *
 * // O con campo personalizado:
 * @Post('profile')
 * @UploadAvatar('profilePicture')
 * async updateProfile(@UploadedFile() file: Express.Multer.File) {
 *   return this.userService.updateProfile(file)
 * }
 * ```
 */
export function UploadAvatar(fieldName: string = 'avatar'): MethodDecorator {
  return UploadFile({
    field: fieldName,
    config: FileConfigs.UserAvatar,
    description: 'Subir imagen de avatar',
    required: true,
  })
}

/**
 * 📄 Decorador específico para subir UN DOCUMENTO
 *
 * @example
 * ```typescript
 * @Post('upload-contract')
 * @UploadDocument('contract')
 * async uploadContract(@UploadedFile() file: Express.Multer.File) {
 *   return this.contractService.save(file)
 * }
 * ```
 */
export function UploadDocument(
  fieldName: string = 'document',
): MethodDecorator {
  return UploadFile({
    field: fieldName,
    config: FileConfigs.Document,
    description: 'Subir documento',
    required: true,
  })
}

/**
 * 📄 Decorador específico para subir MÚLTIPLES DOCUMENTOS
 *
 * @example
 * ```typescript
 * @Post('upload-documents')
 * @UploadDocuments('attachments', 5)
 * async uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
 *   return this.auditService.saveDocuments(files)
 * }
 * ```
 */
export function UploadDocuments(
  fieldName: string = 'documents',
  maxCount: number = 10,
): MethodDecorator {
  return UploadFiles({
    field: fieldName,
    maxCount,
    config: FileConfigs.Document,
    description: 'Subir documentos',
    required: true,
  })
}

/**
 * 🖼️ Decorador específico para subir UNA IMAGEN
 *
 * @example
 * ```typescript
 * @Post('upload-image')
 * @UploadImage('photo')
 * async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
 *   return this.galleryService.save(file)
 * }
 * ```
 */
export function UploadImage(fieldName: string = 'image'): MethodDecorator {
  return UploadFile({
    field: fieldName,
    config: FileConfigs.Image, // ✅ Usa config específica para imágenes
    description: 'Subir imagen',
    required: true,
  })
}

/**
 * 🖼️ Decorador específico para subir MÚLTIPLES IMÁGENES
 *
 * @example
 * ```typescript
 * @Post('upload-gallery')
 * @UploadImages('photos', 20)
 * async uploadGallery(@UploadedFiles() files: Express.Multer.File[]) {
 *   return this.galleryService.saveMultiple(files)
 * }
 * ```
 */
export function UploadImages(
  fieldName: string = 'images',
  maxCount: number = 10,
): MethodDecorator {
  return UploadFiles({
    field: fieldName,
    maxCount,
    config: FileConfigs.Image, // ✅ Usa config específica para imágenes
    description: 'Subir imágenes',
    required: true,
  })
}

/**
 * 📎 Decorador específico para archivos adjuntos de auditoría
 *
 * @example
 * ```typescript
 * @Post('upload-attachments')
 * @UploadAuditAttachments('files', 5)
 * async uploadAttachments(@UploadedFiles() files: Express.Multer.File[]) {
 *   return this.auditService.saveAttachments(files)
 * }
 * ```
 */
export function UploadAuditAttachments(
  fieldName: string = 'attachments',
  maxCount: number = 10,
): MethodDecorator {
  return UploadFiles({
    field: fieldName,
    maxCount,
    config: FileConfigs.AuditAttachment,
    description: 'Subir archivos adjuntos de auditoría',
    required: true,
  })
}
