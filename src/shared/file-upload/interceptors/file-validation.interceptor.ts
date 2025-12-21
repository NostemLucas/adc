import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import type { FileValidationOptions } from '../types/file-upload.types'
import { FileStorageService } from '../services/file-storage.service'

/**
 * Interceptor para validar archivos subidos
 * Se ejecuta antes del controlador y valida los archivos según las opciones proporcionadas
 */
@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  private fileStorageService: FileStorageService

  constructor(
    private readonly fieldName: string,
    private readonly validationOptions?: FileValidationOptions,
    private readonly isMultiple: boolean = false,
  ) {
    // Crear instancia temporal del servicio para validación
    // En el módulo se inyectará la instancia real
    this.fileStorageService = new FileStorageService({
      get: () => undefined,
    } as any)
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const file = request.file
    const files = request.files

    if (this.isMultiple) {
      // Validar múltiples archivos
      const filesToValidate: Express.Multer.File[] = Array.isArray(files)
        ? files
        : files?.[this.fieldName] || []

      if (
        this.validationOptions?.required &&
        (!filesToValidate || filesToValidate.length === 0)
      ) {
        throw new BadRequestException(
          `Los archivos en el campo '${this.fieldName}' son requeridos`,
        )
      }

      filesToValidate.forEach((fileToValidate, index) => {
        try {
          this.fileStorageService.validateFile(
            fileToValidate,
            this.validationOptions || {},
          )
        } catch (error) {
          throw new BadRequestException(
            `Archivo ${index + 1}: ${error.message}`,
          )
        }
      })
    } else {
      // Validar un solo archivo
      const fileToValidate: Express.Multer.File = file || files?.[this.fieldName]?.[0]

      if (this.validationOptions?.required && !fileToValidate) {
        throw new BadRequestException(
          `El archivo en el campo '${this.fieldName}' es requerido`,
        )
      }

      if (fileToValidate) {
        this.fileStorageService.validateFile(
          fileToValidate,
          this.validationOptions || {},
        )
      }
    }

    return next.handle()
  }
}
