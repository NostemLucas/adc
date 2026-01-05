import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { InternalUsersController } from './internal-users.controller'
import { ExternalProfilesController } from './external-profiles.controller'
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

// Internal User Commands & Queries
import {
  CreateInternalUserHandler,
  UpdateInternalUserHandler,
  DeleteInternalUserHandler,
  GetInternalUserHandler,
  ListInternalUsersHandler,
} from './application/internal-user'

// External Profile Commands & Queries
import {
  CreateExternalProfileHandler,
  UpdateExternalProfileHandler,
  DeleteExternalProfileHandler,
  GetExternalProfileHandler,
  ListExternalProfilesHandler,
} from './application/external-profile'

// Shared User Commands (upload avatar, etc.)
import { UploadAvatarHandler } from './application/user'

// Event Handlers
import {
  UserCreatedHandler,
  UserUpdatedHandler,
  UserDeletedHandler,
} from './application/user'

const InternalUserHandlers = [
  CreateInternalUserHandler,
  UpdateInternalUserHandler,
  DeleteInternalUserHandler,
  GetInternalUserHandler,
  ListInternalUsersHandler,
]

const ExternalProfileHandlers = [
  CreateExternalProfileHandler,
  UpdateExternalProfileHandler,
  DeleteExternalProfileHandler,
  GetExternalProfileHandler,
  ListExternalProfilesHandler,
]

const SharedCommandHandlers = [UploadAvatarHandler]

const EventHandlers = [
  UserCreatedHandler,
  UserUpdatedHandler,
  UserDeletedHandler,
]

@Module({
  imports: [CqrsModule],
  controllers: [InternalUsersController, ExternalProfilesController],
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
    ...InternalUserHandlers,
    ...ExternalProfileHandlers,
    ...SharedCommandHandlers,
    ...EventHandlers,
  ],
  exports: [
    USER_REPOSITORY,
    INTERNAL_PROFILE_REPOSITORY,
    EXTERNAL_PROFILE_REPOSITORY,
  ],
})
export class UsersModule {}
