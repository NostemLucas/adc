import { Module, Global } from '@nestjs/common'
import { RequestContext } from './request-context.service'

/**
 * Módulo global que provee RequestContext en toda la aplicación.
 *
 * Se marca como @Global() para que esté disponible en todos los módulos
 * sin necesidad de importarlo explícitamente.
 */
@Global()
@Module({
  providers: [RequestContext],
  exports: [RequestContext],
})
export class ContextModule {}
