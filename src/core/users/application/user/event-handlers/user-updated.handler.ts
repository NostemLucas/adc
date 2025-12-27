import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { UserUpdatedEvent } from '../../../domain/user/events'

/**
 * Handler para el evento UserUpdatedEvent.
 * Se ejecuta cuando se actualiza un usuario existente.
 */
@EventsHandler(UserUpdatedEvent)
export class UserUpdatedHandler implements IEventHandler<UserUpdatedEvent> {
  private readonly logger = new Logger(UserUpdatedHandler.name)

  async handle(event: UserUpdatedEvent): Promise<void> {
    this.logger.log(
      `[DOMAIN EVENT] Usuario actualizado: ${event.fullName} (${event.email})`,
    )

    this.logger.log(`  - Campos actualizados: ${event.updatedFields.join(', ')}`)
    this.logger.log(`  - Fecha actualización: ${event.updatedAt.toISOString()}`)

    // Aquí podrías:
    // - Invalidar cache del usuario
    // - Notificar al usuario sobre cambios en su perfil
    // - Registrar en auditoría qué campos cambiaron
  }
}
