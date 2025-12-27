/**
 * Command para subir/actualizar el avatar de un usuario.
 */
export class UploadAvatarCommand {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {}
}
