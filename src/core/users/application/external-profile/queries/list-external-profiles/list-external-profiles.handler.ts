import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure/di'
import { User } from '../../../../domain'
import { ListExternalProfilesQuery } from './list-external-profiles.query'

@QueryHandler(ListExternalProfilesQuery)
export class ListExternalProfilesHandler
  implements IQueryHandler<ListExternalProfilesQuery>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListExternalProfilesQuery): Promise<User[]> {
    // Retorna todos los usuarios activos
    // TODO: Filtrar por usuarios que tengan ExternalProfile
    return await this.userRepository.findActiveUsers()
  }
}
