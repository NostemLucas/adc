import { Injectable, NotFoundException, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../domain/repositories'
import { USER_REPOSITORY } from '../../domain/repositories'
import { User } from '../../domain/user.entity'

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`)
    }

    return user
  }
}
