import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs/promises'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import {
  FileValidationOptions,
  UploadedFileInfo,
  FileType,
} from '../types/file-upload.types'

/**
 * Servicio para gestionar el almacenamiento de archivos
 * Maneja validación, guardado y eliminación de archivos
 */
@Injectable()
export class FileStorageService {
  private readonly uploadPath: string

  constructor(private readonly configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>('UPLOAD_PATH') || './uploads'
    this.ensureUploadDirectoryExists()
  }

  /**
   * Asegura que el directorio de uploads existe
   */
  private async ensureUploadDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.uploadPath)
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true })
    }
  }

  /**
   * Asegura que un subdirectorio existe
   */
  private async ensureSubdirectoryExists(subdirectory: string): Promise<void> {
    const fullPath = path.join(this.uploadPath, subdirectory)
    try {
      await fs.access(fullPath)
    } catch {
      await fs.mkdir(fullPath, { recursive: true })
    }
  }

  /**
   * Valida un archivo según las opciones proporcionadas
   */
  validateFile(
    file: Express.Multer.File | undefined,
    options: FileValidationOptions,
  ): void {
    // Verificar si el archivo es requerido
    if (options.required && !file) {
      throw new BadRequestException('El archivo es requerido')
    }

    if (!file) return

    // Validar tamaño
    const maxSize = options.maxSizeInBytes || 5 * 1024 * 1024 // 5MB por defecto
    if (file.size > maxSize) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Tamaño máximo: ${this.formatBytes(maxSize)}`,
      )
    }

    // Validar tipo MIME
    if (
      options.allowedMimeTypes &&
      !options.allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos permitidos: ${options.allowedMimeTypes.join(', ')}`,
      )
    }

    // Validar extensión
    if (options.allowedExtensions) {
      const fileExt = path.extname(file.originalname).toLowerCase()
      if (!options.allowedExtensions.includes(fileExt)) {
        throw new BadRequestException(
          `Extensión no permitida. Extensiones permitidas: ${options.allowedExtensions.join(', ')}`,
        )
      }
    }

    // Validar tipo de archivo
    if (options.fileType && options.fileType !== FileType.ANY) {
      this.validateFileType(file, options.fileType)
    }
  }

  /**
   * Valida el tipo de archivo
   */
  private validateFileType(
    file: Express.Multer.File,
    fileType: FileType,
  ): void {
    const mimeType = file.mimetype.toLowerCase()

    switch (fileType) {
      case FileType.IMAGE:
        if (!mimeType.startsWith('image/')) {
          throw new BadRequestException('El archivo debe ser una imagen')
        }
        break
      case FileType.DOCUMENT:
        if (
          !mimeType.includes('pdf') &&
          !mimeType.includes('document') &&
          !mimeType.includes('msword')
        ) {
          throw new BadRequestException('El archivo debe ser un documento')
        }
        break
      case FileType.AUDIO:
        if (!mimeType.startsWith('audio/')) {
          throw new BadRequestException('El archivo debe ser un audio')
        }
        break
      case FileType.VIDEO:
        if (!mimeType.startsWith('video/')) {
          throw new BadRequestException('El archivo debe ser un video')
        }
        break
    }
  }

  /**
   * Guarda un archivo en el sistema
   */
  async saveFile(
    file: Express.Multer.File,
    subdirectory: string = '',
    generateUniqueName: boolean = true,
  ): Promise<UploadedFileInfo> {
    await this.ensureSubdirectoryExists(subdirectory)

    const filename = generateUniqueName
      ? this.generateUniqueFilename(file.originalname)
      : file.originalname

    const relativePath = path.join(subdirectory, filename)
    const fullPath = path.join(this.uploadPath, relativePath)

    await fs.writeFile(fullPath, file.buffer)

    return {
      originalName: file.originalname,
      filename,
      path: relativePath,
      mimetype: file.mimetype,
      size: file.size,
      url: this.generatePublicUrl(relativePath),
    }
  }

  /**
   * Elimina un archivo del sistema
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadPath, filePath)
      await fs.unlink(fullPath)
    } catch (error) {
      // Si el archivo no existe, no hacer nada
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadPath, filePath)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Genera un nombre único para el archivo
   */
  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName)
    const timestamp = Date.now()
    const uuid = uuidv4().substring(0, 8)
    return `${timestamp}-${uuid}${ext}`
  }

  /**
   * Genera una URL pública para el archivo
   */
  private generatePublicUrl(relativePath: string): string {
    const baseUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3000'
    return `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`
  }

  /**
   * Formatea bytes a formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}
