import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { Logger } from '@nestjs/common'
import { UserCreatedEvent } from '../../../domain/user/events'

/**
 * Handler para el evento UserCreatedEvent.
 * Se ejecuta cuando se crea un nuevo usuario en el sistema.
 *
 * Casos de uso típicos:
 * - Enviar email de bienvenida
 * - Registrar auditoría
 * - Enviar notificación a administradores
 * - Crear registros relacionados en otros agregados
 */
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(UserCreatedHandler.name)

  async handle(event: UserCreatedEvent): Promise<void> {
    this.logger.log(
      `[DOMAIN EVENT] Usuario creado: ${event.fullName} (${event.email})`,
    )

    // EJEMPLO 1: Registrar en logs de auditoría
    this.logger.log(`  - ID: ${event.userId}`)
    this.logger.log(`  - Username: ${event.username}`)
    this.logger.log(`  - Type: ${event.type}`)
    this.logger.log(`  - Fecha creación: ${event.createdAt.toISOString()}`)

    // EJEMPLO 2: Aquí podrías enviar un email de bienvenida
    // await this.emailService.sendWelcomeEmail(event.email, event.fullName)

    // EJEMPLO 3: Aquí podrías registrar en una tabla de auditoría
    // await this.auditRepository.logUserCreation({
    //   userId: event.userId,
    //   action: 'USER_CREATED',
    //   timestamp: event.createdAt,
    //   metadata: {
    //     email: event.email,
    //     username: event.username,
    //     roles: event.roles,
    //   },
    // })

    // EJEMPLO 4: Notificar a administradores
    // if (event.roles.includes('ADMINISTRADOR')) {
    //   await this.notificationService.notifyAdmins(
    //     `Nuevo administrador creado: ${event.fullName}`
    //   )
    // }
  }
}
