import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { UsersController } from './users.controller'
import {
  UserRepository,
  InternalProfileRepository,
  ExternalProfileRepository,
} from './infrastructure/persistence'
import {
  USER_REPOSITORY,
  INTERNAL_PROFILE_REPOSITORY,
  EXTERNAL_PROFILE_REPOSITORY,
} from './infrastructure/di'
import { UserUniquenessValidator } from './domain/shared/services'

// User Commands
import {
  UpdateUserHandler,
  DeleteUserHandler,
  UploadAvatarHandler,
} from './application/user'

// Internal Profile Commands
import { CreateUserHandler } from './application/internal-profile'

// Queries
import { GetUserHandler, ListUsersHandler } from './application/user'

// Event Handlers
import {
  UserCreatedHandler,
  UserUpdatedHandler,
  UserDeletedHandler,
} from './application/user'

const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  UploadAvatarHandler,
]

const QueryHandlers = [GetUserHandler, ListUsersHandler]

const EventHandlers = [
  UserCreatedHandler,
  UserUpdatedHandler,
  UserDeletedHandler,
]

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    // Infrastructure - Repositories with DI tokens
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: INTERNAL_PROFILE_REPOSITORY,
      useClass: InternalProfileRepository,
    },
    {
      provide: EXTERNAL_PROFILE_REPOSITORY,
      useClass: ExternalProfileRepository,
    },

    // Domain Services (injected manually since they're framework-agnostic)
    {
      provide: UserUniquenessValidator,
      useFactory: (userRepository: UserRepository) =>
        new UserUniquenessValidator(userRepository),
      inject: [USER_REPOSITORY],
    },

    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [
    USER_REPOSITORY,
    INTERNAL_PROFILE_REPOSITORY,
    EXTERNAL_PROFILE_REPOSITORY,
  ],
})
export class UsersModule {}
