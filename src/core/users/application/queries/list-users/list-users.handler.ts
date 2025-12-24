import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../domain/repositories'
import { USER_REPOSITORY } from '../../../domain/repositories'
import { User } from '../../../domain/user.entity'
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
