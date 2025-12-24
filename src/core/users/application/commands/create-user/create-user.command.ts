import { CreateUserDto } from '../../dto/create-user.dto'

/**
 * Command para crear un nuevo usuario.
 * Representa la intención de crear un usuario en el sistema.
 */
export class CreateUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}
