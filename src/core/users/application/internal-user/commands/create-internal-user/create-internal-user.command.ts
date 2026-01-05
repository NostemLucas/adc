import { CreateInternalUserDto } from './create-internal-user.dto'

export class CreateInternalUserCommand {
  constructor(public readonly dto: CreateInternalUserDto) {}
}
