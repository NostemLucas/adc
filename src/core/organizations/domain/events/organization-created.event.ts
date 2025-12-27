import { IEvent } from '@nestjs/cqrs'

export class OrganizationCreatedEvent implements IEvent {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly createdAt: Date,
  ) {}
}
