import { Injectable, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../domain/repositories'
import { USER_REPOSITORY } from '../../domain/repositories'
import { FileStorageService } from '@shared/file-upload'

/**
 * Caso de uso para subir/actualizar el avatar de un usuario
 */
@Injectable()
export class UploadAvatarUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string; avatarPath: string }> {
    // Obtener el usuario
    const user = await this.userRepository.findByIdOrFail(userId)

    // Eliminar avatar anterior si existe
    if (user.image) {
      await this.fileStorageService.deleteFile(user.image)
    }

    // Guardar nuevo avatar
    const uploadedFile = await this.fileStorageService.saveFile(
      file,
      'users/avatars',
      true, // Generar nombre único
    )

    // Actualizar usuario con la nueva ruta del avatar
    user.image = uploadedFile.path
    await this.userRepository.update(user)

    return {
      avatarUrl: uploadedFile.url || '',
      avatarPath: uploadedFile.path,
    }
  }
}
