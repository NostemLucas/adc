import { Module, Global } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { FileStorageService } from './services/file-storage.service'
import { memoryStorage } from 'multer'

/**
 * Módulo global para la gestión de subida de archivos
 * Proporciona servicios, decoradores e interceptores reutilizables
 */
@Global()
@Module({
  imports: [
    // Configurar Multer para usar memoria (luego guardamos manualmente)
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize:
            configService.get<number>('MAX_FILE_SIZE') || 20 * 1024 * 1024, // 20MB por defecto
        },
      }),
    }),
  ],
  providers: [FileStorageService],
  exports: [FileStorageService, MulterModule],
})
export class FileUploadModule {}
