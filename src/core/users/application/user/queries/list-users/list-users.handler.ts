import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../../domain'
import { USER_REPOSITORY } from '../../../../infrastructure'
import { User } from '../../../../domain/user'
import { ListUsersQuery } from './list-users.query'

/**
 * Handler para la query ListUsers.
 * Responsable de listar todos los usuarios activos.
 */
@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<User[]> {
    return await this.userRepository.findActiveUsers()
  }
}
