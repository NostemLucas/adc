import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../infrastructure/user.repository'
import { User } from '../../domain/user.entity'

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return await this.userRepository.findActiveUsers()
  }
}
