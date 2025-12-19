import { Module } from '@nestjs/common'
import { SessionsController } from './sessions.controller'
import { SessionRepository } from './infrastructure/session.repository'
import { ListMySessionsUseCase } from './application/use-cases/list-my-sessions.use-case'
import { InvalidateSessionUseCase } from './application/use-cases/invalidate-session.use-case'

@Module({
  controllers: [SessionsController],
  providers: [
    SessionRepository,
    ListMySessionsUseCase,
    InvalidateSessionUseCase,
  ],
  exports: [SessionRepository],
})
export class SessionsModule {}
