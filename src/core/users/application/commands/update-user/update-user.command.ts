import { UpdateUserDto } from './update-user.dto'

/**
 * Command para actualizar un usuario existente.
 */
export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdateUserDto,
  ) {}
}
