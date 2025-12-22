import { applyDecorators, UseInterceptors } from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { FileValidationInterceptor } from '../interceptors/file-validation.interceptor'
import { FileValidationOptions, FileConfigs } from '../types/file-upload.types'

/**
 * Decorador para validar un solo archivo subido
 *
 * @example
 * ```typescript
 * @Post('upload-avatar')
 * @ValidateSingleFile('avatar', FileConfigs.UserAvatar)
 * uploadAvatar(@UploadedFile() file: Express.Multer.File) {
 *   return this.userService.updateAvatar(file)
 * }
 * ```
 */
export function ValidateSingleFile(
  fieldName: string = 'file',
  validationOptions?: FileValidationOptions,
) {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName)),
    UseInterceptors(
      new FileValidationInterceptor(fieldName, validationOptions, false),
    ),
  )
}

/**
 * Decorador para validar múltiples archivos subidos
 *
 * @example
 * ```typescript
 * @Post('upload-documents')
 * @ValidateMultipleFiles('documents', 5, FileConfigs.Document)
 * uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
 *   return this.auditService.uploadDocuments(files)
 * }
 * ```
 */
export function ValidateMultipleFiles(
  fieldName: string = 'files',
  maxCount: number = 10,
  validationOptions?: FileValidationOptions,
) {
  return applyDecorators(
    UseInterceptors(FilesInterceptor(fieldName, maxCount)),
    UseInterceptors(
      new FileValidationInterceptor(fieldName, validationOptions, true),
    ),
  )
}

/**
 * Decorador combinado: validación + documentación Swagger para un solo archivo
 *
 * @example
 * ```typescript
 * @Post('upload-avatar')
 * @UploadSingleFile({
 *   fieldName: 'avatar',
 *   validation: FileConfigs.UserAvatar,
 *   swagger: {
 *     description: 'Subir avatar de usuario',
 *     required: true
 *   }
 * })
 * uploadAvatar(@UploadedFile() file: Express.Multer.File) {
 *   return this.userService.updateAvatar(file)
 * }
 * ```
 */
export function UploadSingleFile(options: {
  fieldName?: string
  validation?: FileValidationOptions
  swagger?: {
    description?: string
    required?: boolean
  }
}) {
  const fieldName = options.fieldName || 'file'
  const validation = options.validation

  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName)),
    UseInterceptors(
      new FileValidationInterceptor(fieldName, validation, false),
    ),
  )
}

/**
 * Decorador combinado: validación + documentación Swagger para múltiples archivos
 *
 * @example
 * ```typescript
 * @Post('upload-documents')
 * @UploadMultipleFiles({
 *   fieldName: 'documents',
 *   maxCount: 5,
 *   validation: FileConfigs.Document,
 *   swagger: {
 *     description: 'Subir documentos de auditoría',
 *   }
 * })
 * uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
 *   return this.auditService.uploadDocuments(files)
 * }
 * ```
 */
export function UploadMultipleFiles(options: {
  fieldName?: string
  maxCount?: number
  validation?: FileValidationOptions
  swagger?: {
    description?: string
  }
}) {
  const fieldName = options.fieldName || 'files'
  const maxCount = options.maxCount || 10
  const validation = options.validation

  return applyDecorators(
    UseInterceptors(FilesInterceptor(fieldName, maxCount)),
    UseInterceptors(new FileValidationInterceptor(fieldName, validation, true)),
  )
}

// Exportar configuraciones predefinidas para uso rápido
export { FileConfigs }
