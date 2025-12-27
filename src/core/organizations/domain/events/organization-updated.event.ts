import { IEvent } from '@nestjs/cqrs'

export class OrganizationUpdatedEvent implements IEvent {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly updatedFields: string[],
    public readonly updatedAt: Date,
  ) {}
}
