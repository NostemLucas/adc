/**
 * Users Application Layer
 *
 * Organizado por Agregados (DDD):
 * - User: Comandos transversales y event handlers
 * - InternalUser: Comandos y queries para usuarios internos
 * - ExternalProfile: Comandos y queries para usuarios externos
 */

// ===== USER (SHARED & EVENT HANDLERS) =====
export * from './user'

// ===== INTERNAL USER AGGREGATE =====
export * from './internal-user'

// ===== EXTERNAL PROFILE AGGREGATE =====
export * from './external-profile'
