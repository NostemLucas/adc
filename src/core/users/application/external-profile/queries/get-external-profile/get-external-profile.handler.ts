import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure/di'
import { User } from '../../../../domain'
import { GetExternalProfileQuery } from './get-external-profile.query'

@QueryHandler(GetExternalProfileQuery)
export class GetExternalProfileHandler
  implements IQueryHandler<GetExternalProfileQuery>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetExternalProfileQuery): Promise<User> {
    const { userId } = query
    return await this.userRepository.findByIdOrFail(userId)
  }
}
