import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UserRepository } from './infrastructure/user.repository'
import { RoleRepository } from '../roles/infrastructure/role.repository'
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  DeleteUserUseCase,
} from './application/use-cases'

@Module({
  controllers: [UsersController],
  providers: [
    UserRepository,
    RoleRepository,
    CreateUserUseCase,
    UpdateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    DeleteUserUseCase,
  ],
  exports: [UserRepository],
})
export class UsersModule {}
