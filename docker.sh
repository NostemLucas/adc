#!/bin/bash

# Script de ayuda para gestión de Docker
# Uso: ./docker.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Verificar que Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose no está instalado"
        exit 1
    fi

    print_success "Docker está instalado correctamente"
}

# Comandos disponibles
show_help() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Docker Helper - Sistema de Auditorías${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Uso: ./docker.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo ""
    echo -e "${YELLOW}Base de Datos:${NC}"
    echo "  db:start       - Iniciar solo PostgreSQL + pgAdmin"
    echo "  db:stop        - Detener base de datos"
    echo "  db:restart     - Reiniciar base de datos"
    echo "  db:logs        - Ver logs de PostgreSQL"
    echo "  db:shell       - Conectar a PostgreSQL shell"
    echo "  db:backup      - Crear backup de la base de datos"
    echo "  db:restore     - Restaurar backup"
    echo ""
    echo -e "${YELLOW}Aplicación Completa:${NC}"
    echo "  up             - Iniciar todo (App + DB + pgAdmin)"
    echo "  down           - Detener todo"
    echo "  restart        - Reiniciar todo"
    echo "  build          - Reconstruir imágenes"
    echo "  logs           - Ver logs de todos los servicios"
    echo "  app:logs       - Ver solo logs de la aplicación"
    echo ""
    echo -e "${YELLOW}Mantenimiento:${NC}"
    echo "  clean          - Limpiar contenedores y volúmenes"
    echo "  status         - Ver estado de servicios"
    echo "  migrate        - Ejecutar migraciones de Prisma"
    echo "  seed           - Ejecutar seed de datos"
    echo ""
    echo -e "${YELLOW}Desarrollo:${NC}"
    echo "  dev            - Modo desarrollo (solo BD + app local)"
    echo ""
}

# Iniciar solo base de datos
db_start() {
    print_info "Iniciando PostgreSQL y pgAdmin..."
    docker compose up -d postgres pgadmin
    print_success "Base de datos iniciada"
    echo ""
    print_info "Conexión PostgreSQL:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  User: postgres"
    echo "  Pass: postgres"
    echo "  DB:   audit_db"
    echo ""
    print_info "pgAdmin: http://localhost:5050"
    echo "  Email: admin@audit.com"
    echo "  Pass:  admin123"
}

# Detener base de datos
db_stop() {
    print_info "Deteniendo base de datos..."
    docker compose stop postgres pgadmin
    print_success "Base de datos detenida"
}

# Reiniciar base de datos
db_restart() {
    print_info "Reiniciando base de datos..."
    docker compose restart postgres pgadmin
    print_success "Base de datos reiniciada"
}

# Ver logs de PostgreSQL
db_logs() {
    print_info "Mostrando logs de PostgreSQL (Ctrl+C para salir)..."
    docker compose logs -f postgres
}

# Conectar a shell de PostgreSQL
db_shell() {
    print_info "Conectando a PostgreSQL shell..."
    docker compose exec postgres psql -U postgres -d audit_db
}

# Backup de base de datos
db_backup() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_info "Creando backup en $BACKUP_FILE..."
    docker compose exec -T postgres pg_dump -U postgres audit_db > "$BACKUP_FILE"
    print_success "Backup creado: $BACKUP_FILE"
}

# Restaurar backup
db_restore() {
    if [ -z "$2" ]; then
        print_error "Especifica el archivo de backup"
        echo "Uso: ./docker.sh db:restore backup.sql"
        exit 1
    fi

    if [ ! -f "$2" ]; then
        print_error "Archivo no encontrado: $2"
        exit 1
    fi

    print_warning "Esto sobrescribirá la base de datos actual"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Operación cancelada"
        exit 1
    fi

    print_info "Restaurando backup desde $2..."
    docker compose exec -T postgres psql -U postgres audit_db < "$2"
    print_success "Backup restaurado"
}

# Iniciar todo el stack
up() {
    print_info "Iniciando stack completo..."
    docker compose -f docker-compose.full.yml up -d --build
    print_success "Stack iniciado"
    echo ""
    print_info "Servicios disponibles:"
    echo "  API:     http://localhost:3000"
    echo "  Swagger: http://localhost:3000/api/docs"
    echo "  pgAdmin: http://localhost:5050"
}

# Detener todo
down() {
    print_info "Deteniendo servicios..."
    docker compose -f docker-compose.full.yml down
    print_success "Servicios detenidos"
}

# Reiniciar todo
restart() {
    print_info "Reiniciando servicios..."
    docker compose -f docker-compose.full.yml restart
    print_success "Servicios reiniciados"
}

# Reconstruir imágenes
build() {
    print_info "Reconstruyendo imágenes..."
    docker compose -f docker-compose.full.yml build --no-cache
    print_success "Imágenes reconstruidas"
}

# Ver logs de todos los servicios
logs() {
    print_info "Mostrando logs (Ctrl+C para salir)..."
    docker compose -f docker-compose.full.yml logs -f
}

# Ver logs solo de la app
app_logs() {
    print_info "Mostrando logs de la aplicación (Ctrl+C para salir)..."
    docker compose -f docker-compose.full.yml logs -f app
}

# Limpiar todo
clean() {
    print_warning "Esto eliminará todos los contenedores, volúmenes y datos"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Operación cancelada"
        exit 1
    fi

    print_info "Limpiando..."
    docker compose down -v
    docker compose -f docker-compose.full.yml down -v
    print_success "Limpieza completada"
}

# Ver estado
status() {
    print_info "Estado de servicios:"
    echo ""
    docker compose ps
    echo ""
    docker compose -f docker-compose.full.yml ps
}

# Ejecutar migraciones
migrate() {
    if docker compose ps | grep -q app; then
        print_info "Ejecutando migraciones en contenedor..."
        docker compose -f docker-compose.full.yml exec app npx prisma migrate deploy
    else
        print_info "Ejecutando migraciones localmente..."
        npx prisma migrate dev
    fi
    print_success "Migraciones completadas"
}

# Seed de datos
seed() {
    if docker compose ps | grep -q app; then
        print_info "Ejecutando seed en contenedor..."
        docker compose -f docker-compose.full.yml exec app npx prisma db seed
    else
        print_info "Ejecutando seed localmente..."
        npx prisma db seed
    fi
    print_success "Seed completado"
}

# Modo desarrollo
dev() {
    print_info "Iniciando modo desarrollo..."
    print_info "1. Iniciando base de datos..."
    docker compose up -d postgres

    print_info "2. Esperando a que PostgreSQL esté listo..."
    sleep 5

    print_info "3. Ejecutando migraciones..."
    npx prisma migrate dev

    print_success "Entorno listo para desarrollo"
    echo ""
    print_info "Ahora ejecuta: npm run start:dev"
}

# Main
main() {
    check_docker

    case "${1:-help}" in
        db:start)
            db_start
            ;;
        db:stop)
            db_stop
            ;;
        db:restart)
            db_restart
            ;;
        db:logs)
            db_logs
            ;;
        db:shell)
            db_shell
            ;;
        db:backup)
            db_backup
            ;;
        db:restore)
            db_restore "$@"
            ;;
        up)
            up
            ;;
        down)
            down
            ;;
        restart)
            restart
            ;;
        build)
            build
            ;;
        logs)
            logs
            ;;
        app:logs)
            app_logs
            ;;
        clean)
            clean
            ;;
        status)
            status
            ;;
        migrate)
            migrate
            ;;
        seed)
            seed
            ;;
        dev)
            dev
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"
