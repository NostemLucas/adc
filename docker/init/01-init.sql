-- Script de inicialización de la base de datos (opcional)
-- Este script se ejecuta automáticamente cuando se crea el contenedor por primera vez

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configuración de zona horaria
SET timezone = 'America/La_Paz';

-- Comentario sobre la base de datos
COMMENT ON DATABASE audit_db IS 'Base de datos para el sistema de auditorías';
