import { UpdateExternalProfileDto } from './update-external-profile.dto'

export class UpdateExternalProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdateExternalProfileDto,
  ) {}
}
