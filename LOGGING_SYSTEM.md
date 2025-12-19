# Sistema de Logging Implementado

## Descripción General

Se ha implementado un sistema completo de logging que registra todas las operaciones de la aplicación incluyendo:
- **Requests y Responses HTTP** con metadata completa
- **Información del usuario** (ID, email, IP, sistema operativo, navegador, dispositivo)
- **Excepciones de la aplicación** con stack traces completos
- **Errores de base de datos** (Prisma) con detalles técnicos
- **Rotación automática de archivos** de logs por día

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────┐
│         LoggerService (Winston)              │
│  - Configuración centralizada                │
│  - Múltiples transports (archivos + consola) │
│  - Rotación diaria de logs                   │
└───────────────┬─────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼──────┐  ┌────▼──────────────┐
│ Interceptor  │  │ Exception Filters  │
│ - HTTP logs  │  │ - Prisma errors    │
│ - Request    │  │ - All exceptions   │
│ - Response   │  │                    │
└──────────────┘  └────────────────────┘
```

## Componentes Implementados

### 1. **LoggerService** (`src/shared/logger/logger.service.ts`)

Servicio principal basado en Winston que maneja toda la lógica de logging:

**Características:**
- ✅ Múltiples transports con rotación diaria
- ✅ Formato JSON estructurado para análisis
- ✅ Separación de logs por tipo (error, http, combined)
- ✅ Detección automática de OS, navegador y dispositivo
- ✅ Sanitización de datos sensibles (passwords, tokens)
- ✅ Captura de IP real del cliente (considerando proxies)

**Archivos generados:**
```
logs/
├── error-2024-01-20.log      # Solo errores
├── http-2024-01-20.log       # Requests/responses HTTP
└── combined-2024-01-20.log   # Todos los logs
```

**Configuración de rotación:**
- Tamaño máximo por archivo: 20MB
- Retención: 30 días
- Formato de fecha: YYYY-MM-DD

### 2. **LoggingInterceptor** (`src/shared/interceptors/logging.interceptor.ts`)

Interceptor global que captura todas las peticiones HTTP:

```typescript
// Información registrada por cada request:
{
  method: 'POST',
  url: '/auth/login',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  os: 'Windows',
  browser: 'Chrome',
  device: 'Desktop',
  userId: 'uuid-123',        // Si está autenticado
  userEmail: 'user@mail.com', // Si está autenticado
  body: { /* sanitizado */ },
  query: { },
  params: { }
}

// Información registrada por cada response:
{
  method: 'POST',
  url: '/auth/login',
  statusCode: 200,
  responseTime: '45ms',
  ip: '192.168.1.1',
  userId: 'uuid-123',
  // ... otros metadatos
}
```

### 3. **AllExceptionsFilter** (`src/shared/filters/all-exceptions.filter.ts`)

Captura todas las excepciones no manejadas:

```typescript
// Información registrada:
{
  message: 'Error message',
  statusCode: 500,
  method: 'GET',
  url: '/users/123',
  ip: '192.168.1.1',
  userId: 'uuid-123',
  errorDetails: {
    name: 'ValidationError',
    stack: '...'
  }
}
```

### 4. **PrismaExceptionFilter** (actualizado)

Captura errores específicos de base de datos:

```typescript
// Información registrada:
{
  operation: 'POST /users',
  errorCode: 'P2002',        // Código de error Prisma
  errorMessage: 'Unique constraint violation',
  meta: { target: ['email'] },
  method: 'POST',
  url: '/users',
  userId: 'uuid-123',
  ip: '192.168.1.1'
}
```

## Métodos Disponibles en LoggerService

```typescript
// Logs generales
logger.log('Mensaje informativo', context)
logger.error('Error message', trace, context)
logger.warn('Warning message', context)
logger.debug('Debug message', context)

// Logs específicos HTTP
logger.logHttpRequest(req, context)
logger.logHttpResponse(req, res, responseTime, context)

// Logs de excepciones
logger.logException(error, context)

// Logs de base de datos
logger.logDatabaseError(error, operation, context)
```

## Configuración

### Variables de Entorno

Agrega a tu `.env`:

```env
# Nivel de logging (error, warn, info, debug, verbose)
LOG_LEVEL=info
```

### Activación Automática

El logger ya está configurado globalmente en:
- ✅ `app.module.ts` - LoggerModule y LoggingInterceptor
- ✅ `main.ts` - Exception filters con logger

## Ejemplos de Uso

### 1. Ejemplo de Log HTTP

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "secret123"
}
```

**Log generado:**
```json
{
  "timestamp": "2024-01-20 14:30:45",
  "level": "INFO",
  "message": "Incoming Request",
  "method": "POST",
  "url": "/auth/login",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
  "os": "Windows",
  "browser": "Chrome",
  "device": "Desktop",
  "body": {
    "username": "admin",
    "password": "***REDACTED***"
  }
}
```

### 2. Ejemplo de Log de Error de BD

**Request que causa error:**
```http
POST /users
{
  "email": "existing@email.com"  // Email duplicado
}
```

**Log generado:**
```json
{
  "timestamp": "2024-01-20 14:35:12",
  "level": "ERROR",
  "message": "Database Error",
  "operation": "POST /users",
  "errorCode": "P2002",
  "errorMessage": "Unique constraint failed on the fields: (`email`)",
  "meta": {
    "target": ["email"]
  },
  "method": "POST",
  "url": "/users",
  "ip": "192.168.1.1",
  "userId": "admin-uuid"
}
```

### 3. Ejemplo de Log de Excepción

**Excepción lanzada:**
```typescript
throw new UnauthorizedException('Credenciales inválidas')
```

**Log generado:**
```json
{
  "timestamp": "2024-01-20 14:40:22",
  "level": "ERROR",
  "message": "Exception Thrown",
  "name": "UnauthorizedException",
  "message": "Credenciales inválidas",
  "stack": "UnauthorizedException: Credenciales inválidas\n    at AuthService.login...",
  "method": "POST",
  "url": "/auth/login",
  "statusCode": 401,
  "ip": "192.168.1.1"
}
```

## Características de Seguridad

### Datos Sensibles Sanitizados

Los siguientes campos se ocultan automáticamente en los logs:
- `password` → `***REDACTED***`
- `token` → `***REDACTED***`
- `refreshToken` → `***REDACTED***`
- `accessToken` → `***REDACTED***`

### IP Real del Cliente

El logger detecta la IP real incluso detrás de proxies:
```typescript
// Busca en headers (en orden):
// 1. x-forwarded-for
// 2. req.socket.remoteAddress
```

## Detección de Dispositivos

El logger analiza el User-Agent para extraer:

**Sistema Operativo:**
- Windows, macOS, Linux, Android, iOS

**Navegador:**
- Chrome, Firefox, Safari, Edge, Opera

**Tipo de Dispositivo:**
- Desktop, Mobile, Tablet

## Rotación de Archivos

Configuración actual:
```typescript
{
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',    // Máximo 20MB por archivo
  maxFiles: '30d'    // Retener 30 días
}
```

**Ejemplo de archivos generados:**
```
logs/
├── combined-2024-01-20.log (15.2 MB)
├── combined-2024-01-21.log (18.7 MB)
├── combined-2024-01-22.log (3.1 MB)
├── error-2024-01-20.log (2.4 MB)
├── error-2024-01-21.log (1.8 MB)
├── http-2024-01-20.log (12.3 MB)
└── http-2024-01-21.log (8.9 MB)
```

## Uso Personalizado

Si necesitas logging en tus servicios:

```typescript
import { LoggerService } from '@shared/logger/logger.service'

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  async myMethod() {
    // Log simple
    this.logger.log('Operación iniciada')

    try {
      // Tu lógica
    } catch (error) {
      // Log con contexto
      this.logger.error('Error en operación', error.stack, {
        operation: 'myMethod',
        additionalData: 'value'
      })
    }
  }
}
```

## Monitoreo y Análisis

### Ver logs en tiempo real:

```bash
# Todos los logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# Solo errores
tail -f logs/error-$(date +%Y-%m-%d).log

# Solo HTTP
tail -f logs/http-$(date +%Y-%m-%d).log
```

### Buscar en logs:

```bash
# Buscar por usuario
grep "userId.*abc-123" logs/combined-*.log

# Buscar errores de un endpoint
grep "POST /users" logs/error-*.log

# Buscar por IP
grep "192.168.1.1" logs/http-*.log
```

## Beneficios del Sistema

✅ **Debugging eficiente** - Stack traces completos y contexto rico
✅ **Auditoría completa** - Registro de todas las operaciones
✅ **Análisis de uso** - Estadísticas de endpoints y usuarios
✅ **Seguridad** - Detección de actividades sospechosas
✅ **Performance** - Medición de tiempos de respuesta
✅ **Compliance** - Logs estructurados para regulaciones

## Próximos Pasos (Opcionales)

### Integración con Servicios Externos

Si necesitas enviar logs a servicios de monitoreo:

```typescript
// Agregar transport para Elasticsearch
new winston.transports.Elasticsearch({
  level: 'info',
  clientOpts: { node: 'http://localhost:9200' }
})

// Agregar transport para CloudWatch
new WinstonCloudWatch({
  logGroupName: 'audit-app',
  logStreamName: 'production'
})
```

### Métricas Personalizadas

Puedes agregar métricas específicas:

```typescript
logger.log('User action', {
  action: 'file_download',
  fileSize: '2.5MB',
  duration: '1200ms',
  userId: user.id
})
```

## Notas Importantes

⚠️ **Los logs contienen información sensible** - Asegúrate de que el directorio `logs/` esté en `.gitignore`
⚠️ **Rotación automática** - Los archivos antiguos se eliminan después de 30 días
⚠️ **Performance** - El logging asíncrono no afecta el rendimiento de la aplicación

---

🎯 **Sistema de logging profesional implementado y listo para producción**
