import { CreateExternalProfileDto } from './create-external-profile.dto'

export class CreateExternalProfileCommand {
  constructor(public readonly dto: CreateExternalProfileDto) {}
}
