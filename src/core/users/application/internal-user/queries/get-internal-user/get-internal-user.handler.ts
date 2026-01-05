import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure/di'
import { User } from '../../../../domain'
import { GetInternalUserQuery } from './get-internal-user.query'

@QueryHandler(GetInternalUserQuery)
export class GetInternalUserHandler
  implements IQueryHandler<GetInternalUserQuery>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetInternalUserQuery): Promise<User> {
    const { userId } = query
    return await this.userRepository.findByIdOrFail(userId)
  }
}
