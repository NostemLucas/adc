import { UpdateInternalUserDto } from './update-internal-user.dto'

export class UpdateInternalUserCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdateInternalUserDto,
  ) {}
}
