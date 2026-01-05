import { SetMetadata } from '@nestjs/common'

/**
 * Metadata key para marcar endpoints que solo usuarios internos pueden acceder
 */
export const INTERNAL_ONLY_KEY = 'internalOnly'

/**
 * Decorator para marcar endpoints que SOLO usuarios internos pueden acceder.
 *
 * Los usuarios externos/clientes recibirán un 403 Forbidden.
 *
 * @example
 * @InternalOnly()
 * @Post('internal-users')
 * async createInternalUser(@Body() dto: CreateInternalUserDto) {
 *   // Solo accesible por usuarios internos
 * }
 */
export const InternalOnly = () => SetMetadata(INTERNAL_ONLY_KEY, true)
