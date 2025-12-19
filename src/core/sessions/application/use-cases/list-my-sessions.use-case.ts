import { Injectable } from '@nestjs/common'
import { SessionRepository } from '../../infrastructure/session.repository'
import { Session } from '../../domain/session.entity'

@Injectable()
export class ListMySessionsUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(userId: string): Promise<Session[]> {
    return await this.sessionRepository.findActiveByUserId(userId)
  }
}
