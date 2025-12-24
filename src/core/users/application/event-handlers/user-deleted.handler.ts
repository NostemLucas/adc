import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { UserDeletedEvent } from '../../domain/events'

/**
 * Handler para el evento UserDeletedEvent.
 * Se ejecuta cuando se elimina un usuario (soft delete).
 */
@EventsHandler(UserDeletedEvent)
export class UserDeletedHandler implements IEventHandler<UserDeletedEvent> {
  private readonly logger = new Logger(UserDeletedHandler.name)

  async handle(event: UserDeletedEvent): Promise<void> {
    this.logger.log(
      `[DOMAIN EVENT] Usuario eliminado: ${event.username} (${event.email})`,
    )

    this.logger.log(`  - Fecha eliminación: ${event.deletedAt.toISOString()}`)

    // Aquí podrías:
    // - Revocar tokens de acceso
    // - Cerrar sesiones activas
    // - Notificar al usuario
    // - Registrar en auditoría
  }
}
