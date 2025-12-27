/**
 * Users Domain Layer
 *
 * Organizado por Agregados (DDD):
 * - User: Entidad base con información común
 * - InternalProfile: Perfil para usuarios del sistema (staff)
 * - ExternalProfile: Perfil para usuarios de organizaciones (clientes)
 */

// ===== USER AGGREGATE =====
export * from './user'

// ===== INTERNAL PROFILE AGGREGATE =====
export * from './internal-profile'

// ===== EXTERNAL PROFILE AGGREGATE =====
export * from './external-profile'

// ===== SHARED COMPONENTS =====
export * from './shared'
