/**
 * Command para eliminar un usuario (soft delete).
 */
export class DeleteUserCommand {
  constructor(public readonly userId: string) {}
}
