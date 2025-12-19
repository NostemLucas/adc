import { Injectable } from '@nestjs/common'
import { SessionRepository } from '../../infrastructure/session.repository'

@Injectable()
export class InvalidateSessionUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    await this.sessionRepository.invalidateSession(sessionId)
  }
}
