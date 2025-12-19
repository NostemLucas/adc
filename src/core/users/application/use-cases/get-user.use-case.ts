import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from '../../infrastructure/user.repository'
import { User } from '../../domain/user.entity'

@Injectable()
export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`)
    }

    return user
  }
}
