import { IEvent } from '@nestjs/cqrs'

export class OrganizationDeletedEvent implements IEvent {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly deletedAt: Date,
  ) {}
}
