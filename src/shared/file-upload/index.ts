/**
 * Punto de entrada principal para el módulo de File Upload
 * Exporta todos los decoradores, servicios, tipos y utilidades
 */

// Module
export { FileUploadModule } from './file-upload.module'

// Services
export { FileStorageService } from './services/file-storage.service'

// Types
export { FileType, FileConfigs } from './types/file-upload.types'
export type {
  FileValidationOptions,
  FileUploadConfig,
  UploadedFileInfo,
} from './types/file-upload.types'

// 🔥 All-in-One Decorators (Multer + Validation + Swagger)
// Estos decoradores son los recomendados para usar
export {
  UploadFile,
  UploadFiles,
  UploadAvatar,
  UploadDocument,
  UploadDocuments,
  UploadImage,
  UploadImages,
  UploadAuditAttachments,
} from './decorators/upload-file.decorators'

// Interceptors (uso interno)
export { FileValidationInterceptor } from './interceptors/file-validation.interceptor'
