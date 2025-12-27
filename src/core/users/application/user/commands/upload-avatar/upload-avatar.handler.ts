import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure'
import { FileStorageService } from '@shared/file-upload'
import { UploadAvatarCommand } from './upload-avatar.command'

/**
 * Handler para el comando UploadAvatar.
 * Responsable de subir/actualizar el avatar de un usuario.
 */
@CommandHandler(UploadAvatarCommand)
export class UploadAvatarHandler
  implements ICommandHandler<UploadAvatarCommand>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(
    command: UploadAvatarCommand,
  ): Promise<{ avatarUrl: string; avatarPath: string }> {
    const { userId, file } = command

    // Obtener el usuario
    const user = await this.userRepository.findByIdOrFail(userId)

    // Eliminar avatar anterior si existe
    if (user.image) {
      await this.fileStorageService.deleteFile(user.image.getValue())
    }

    // Guardar nuevo avatar
    const uploadedFile = await this.fileStorageService.saveFile(
      file,
      'users/avatars',
      true, // Generar nombre único
    )

    // Actualizar usuario con la nueva ruta del avatar
    user.update({ image: uploadedFile.path })
    await this.userRepository.update(user)

    return {
      avatarUrl: uploadedFile.url || '',
      avatarPath: uploadedFile.path,
    }
  }
}
