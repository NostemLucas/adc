import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { NotFoundException, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../domain/repositories'
import { USER_REPOSITORY } from '../../../infrastructure'
import { User } from '../../../domain/user'
import { GetUserQuery } from './get-user.query'

/**
 * Handler para la query GetUser.
 * Responsable de obtener un usuario por su ID.
 */
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<User> {
    const { userId } = query

    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`)
    }

    return user
  }
}
