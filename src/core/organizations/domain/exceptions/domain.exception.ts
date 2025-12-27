import { BadRequestException } from '@nestjs/common'

export class DomainException extends BadRequestException {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super({
      message,
      error: code,
    })
  }
}
