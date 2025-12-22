import { Injectable, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../domain/repositories'
import { USER_REPOSITORY } from '../../domain/repositories'
import { User } from '../../domain/user.entity'

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<User[]> {
    return await this.userRepository.findActiveUsers()
  }
}
