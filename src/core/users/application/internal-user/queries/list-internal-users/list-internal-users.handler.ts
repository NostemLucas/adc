import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure/di'
import { User } from '../../../../domain'
import { ListInternalUsersQuery } from './list-internal-users.query'

@QueryHandler(ListInternalUsersQuery)
export class ListInternalUsersHandler
  implements IQueryHandler<ListInternalUsersQuery>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListInternalUsersQuery): Promise<User[]> {
    // Retorna todos los usuarios activos
    // TODO: Filtrar por usuarios que tengan InternalProfile
    return await this.userRepository.findActiveUsers()
  }
}
