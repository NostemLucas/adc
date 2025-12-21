# 🏗️ Arquitectura del Sistema de File Upload

## Mejoras Implementadas

### ✅ 1. UseInterceptors combinados (IMPLEMENTADO)

**Problema anterior:**
```typescript
UseInterceptors(FileInterceptor(fieldName)),
UseInterceptors(new FileValidationInterceptor(...)),
```

**Solución implementada:**
```typescript
UseInterceptors(
  FileInterceptor(fieldName),
  new FileValidationInterceptor(fieldName, { ...config, required }, false),
),
```

**Beneficios:**
- ✅ Código más limpio y legible
- ✅ Menos decoradores aplicados
- ✅ Más fácil de debuggear
- ✅ Mejor rendimiento (menos overhead de decoradores)

---

### ✅ 2. Lógica de descripción extraída a helper (IMPLEMENTADO)

**Problema anterior:**
Lógica de construcción de descripción repetida en cada decorador.

**Solución implementada:**
```typescript
/**
 * Construye la descripción completa del archivo con restricciones
 */
function buildFileDescription(
  baseDescription: string,
  config: FileValidationOptions,
  required: boolean,
  additionalInfo?: string,
): string {
  // ... lógica centralizada
}
```

**Beneficios:**
- ✅ DRY (Don't Repeat Yourself)
- ✅ Fácil de mantener y actualizar
- ✅ Facilita i18n en el futuro
- ✅ Menos código duplicado

**Uso:**
```typescript
const fullDescription = buildFileDescription(description, config, required)
// Para múltiples archivos:
const fullDescription = buildFileDescription(
  description,
  config,
  required,
  `**Máximo de archivos:** ${maxCount}`,
)
```

---

### ✅ 3. Swagger ApiResponse más flexible (IMPLEMENTADO)

**Problema anterior:**
```typescript
ApiResponse({
  status: 201,
  description: 'Archivo subido exitosamente',
  schema: {
    type: 'object',
    properties: {
      originalName: { type: 'string' },
      filename: { type: 'string' },
      path: { type: 'string' },
      // ... muy específico
    },
  },
})
```

**Solución implementada:**
```typescript
ApiResponse({
  status: 201,
  description: 'Archivo subido exitosamente',
  // Sin schema rígido - cada controller define su respuesta
})
```

**Beneficios:**
- ✅ No asume estructura de respuesta
- ✅ Más flexible para diferentes casos de uso
- ✅ Compatible con S3, CDN, etc.
- ✅ Controllers pueden devolver lo que necesiten

---

### ✅ 4. FileConfigs.Image separado de UserAvatar (IMPLEMENTADO)

**Problema anterior:**
```typescript
UploadImage -> UserAvatar  // ❌ Confusión semántica
UploadImages -> UserAvatar
```

**Solución implementada:**
```typescript
export const FileConfigs = {
  /**
   * Configuración específica para avatares de usuario
   * Optimizada para fotos de perfil pequeñas
   */
  UserAvatar: { ... },

  /**
   * Configuración genérica para imágenes
   * Usar para galerías, fotos de productos, etc. (no avatares)
   */
  Image: { ... },
}
```

**Uso actualizado:**
```typescript
export function UploadImage(fieldName: string = 'image'): MethodDecorator {
  return UploadFile({
    field: fieldName,
    config: FileConfigs.Image, // ✅ Claridad semántica
    description: 'Subir imagen',
    required: true,
  })
}
```

**Beneficios:**
- ✅ Claridad semántica (Avatar ≠ Image genérica)
- ✅ Fácil de entender el propósito
- ✅ Preparado para diferentes configuraciones futuras
- ✅ Autodocumentado con JSDoc

---

## ⚠️ Consideración Arquitectónica: Interceptor con DI

### Estado Actual

**Implementación actual:**
```typescript
UseInterceptors(
  FileInterceptor(fieldName),
  new FileValidationInterceptor(fieldName, { ...config, required }, false),
),
```

**Implicaciones:**

❌ **Limitación: No participa del DI de NestJS**

El interceptor se instancia manualmente, por lo que:
- No puede inyectar servicios en el constructor
- No puede usar `@Inject()` decorators
- No tiene acceso a ConfigService, Logger, etc.

**Cuándo es un problema:**
- Si necesitas inyectar servicios (Logger, Config, etc.)
- Si necesitas feature flags dinámicos
- Si requieres configuración desde DB
- Si necesitas auditoría de uploads

**Cuándo NO es un problema (situación actual):**
- ✅ Validación es estática y basada en opciones
- ✅ No necesita servicios externos
- ✅ Toda la lógica está en el servicio FileStorageService
- ✅ Funciona perfectamente para el caso de uso actual

### Solución Alternativa (Para el futuro si es necesario)

Si en el futuro necesitas DI en el interceptor:

#### Opción 1: Metadata-based Interceptor

```typescript
// 1. Crear metadata key
export const FILE_VALIDATION_OPTIONS = 'file_validation_options'

// 2. Decorador que establece metadata
export function UploadFile(options: UploadFileOptions = {}): MethodDecorator {
  return applyDecorators(
    SetMetadata(FILE_VALIDATION_OPTIONS, {
      fieldName,
      config,
      required,
      isMultiple: false,
    }),
    UseInterceptors(FileInterceptor(fieldName)),
    UseInterceptors(FileValidationInterceptor), // ← Sin 'new'
    // ...
  )
}

// 3. Interceptor lee metadata
@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector, // ✅ DI!
    private readonly logger: Logger,       // ✅ DI!
    private readonly config: ConfigService, // ✅ DI!
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const options = this.reflector.get(FILE_VALIDATION_OPTIONS, context.getHandler())
    // ... usar options
  }
}
```

**Ventajas:**
- ✅ Participa del DI
- ✅ Puede inyectar servicios
- ✅ Más "NestJS way"

**Desventajas:**
- ❌ Más complejo
- ❌ Más difícil de debuggear
- ❌ Requiere conocimiento de Reflector
- ❌ Puede ser overkill para validación simple

#### Opción 2: Factory Pattern

```typescript
export function createFileValidationInterceptor(
  fieldName: string,
  config: FileValidationOptions,
  isMultiple: boolean,
) {
  @Injectable()
  class DynamicFileValidationInterceptor implements NestInterceptor {
    constructor(
      private readonly logger: Logger, // ✅ DI!
    ) {}

    intercept(context: ExecutionContext, next: CallHandler) {
      // Usa fieldName, config del closure
    }
  }

  return DynamicFileValidationInterceptor
}
```

**Ventajas:**
- ✅ DI disponible
- ✅ Menos metadata

**Desventajas:**
- ❌ Crea clases dinámicamente
- ❌ Puede afectar tree-shaking
- ❌ Más complejo

### Recomendación Actual

**NO refactorizar ahora** porque:

1. ✅ La implementación actual funciona perfectamente
2. ✅ No necesitas inyectar servicios en el interceptor
3. ✅ La validación es simple y basada en opciones
4. ✅ YAGNI (You Aren't Gonna Need It)

**Refactorizar solo si:**
- Necesitas Logger en el interceptor
- Necesitas ConfigService para validaciones dinámicas
- Necesitas auditoría de cada upload
- Necesitas integración con sistemas externos

---

## 📊 Comparación: Antes vs Después

### Antes de las mejoras

```typescript
export function UploadFile(options: UploadFileOptions = {}) {
  const fieldName = options.field || 'file'
  const config = options.config || {}
  const required = options.required ?? true
  const description = options.description || 'Subir archivo'

  // ❌ Lógica duplicada
  const maxSizeMB = config.maxSizeInBytes
    ? (config.maxSizeInBytes / (1024 * 1024)).toFixed(2)
    : '5'
  const allowedTypes = config.allowedExtensions?.join(', ') || ''
  let fullDescription = description
  if (allowedTypes) {
    fullDescription += `\n\n**Formatos permitidos:** ${allowedTypes}`
  }
  fullDescription += `\n**Tamaño máximo:** ${maxSizeMB}MB`
  if (!required) {
    fullDescription += '\n**Opcional**'
  }

  return applyDecorators(
    // ❌ Interceptors duplicados
    UseInterceptors(FileInterceptor(fieldName)),
    UseInterceptors(new FileValidationInterceptor(...)),
    ApiConsumes('multipart/form-data'),
    ApiBody({ ... }),
    // ❌ Response schema rígido
    ApiResponse({
      status: 201,
      schema: {
        type: 'object',
        properties: { originalName, filename, path, url, ... }
      }
    }),
  )
}
```

### Después de las mejoras

```typescript
export function UploadFile(options: UploadFileOptions = {}): MethodDecorator {
  const fieldName = options.field || 'file'
  const config = options.config || {}
  const required = options.required ?? true
  const description = options.description || 'Subir archivo'

  // ✅ Helper reutilizable
  const fullDescription = buildFileDescription(description, config, required)

  return applyDecorators(
    // ✅ Interceptors combinados
    UseInterceptors(
      FileInterceptor(fieldName),
      new FileValidationInterceptor(fieldName, { ...config, required }, false),
    ),
    ApiConsumes('multipart/form-data'),
    ApiBody({ ... }),
    // ✅ Response flexible
    ApiResponse({
      status: 201,
      description: 'Archivo subido exitosamente',
    }),
    ApiResponse({
      status: 400,
      description: 'Archivo inválido',
    }),
  )
}
```

**Resultado:**
- 📉 Menos líneas de código
- 📈 Mayor claridad
- 🔧 Más mantenible
- 🎯 Más flexible

---

## 🎯 Configuraciones Disponibles

```typescript
export const FileConfigs = {
  UserAvatar: {
    // Para avatares de usuario (fotos de perfil)
    fileType: FileType.IMAGE,
    maxSizeInBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  Image: {
    // Para imágenes genéricas (galerías, productos)
    fileType: FileType.IMAGE,
    maxSizeInBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },

  Document: {
    // Para documentos (PDF, Word)
    fileType: FileType.DOCUMENT,
    maxSizeInBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
  },

  AuditAttachment: {
    // Para archivos de auditoría (múltiples tipos)
    fileType: FileType.ANY,
    maxSizeInBytes: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.xlsx'],
  },
}
```

---

## 🚀 Uso Recomendado

### Para Avatares
```typescript
@Post(':id/avatar')
@UploadAvatar()
async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

### Para Imágenes Genéricas
```typescript
@Post('gallery')
@UploadImages('photos', 20)
async uploadGallery(@UploadedFiles() files: Express.Multer.File[]) {
  // ...
}
```

### Para Documentos
```typescript
@Post('documents')
@UploadDocument('contract')
async uploadContract(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

### Personalizado
```typescript
@Post('custom')
@UploadFile({
  field: 'myFile',
  config: {
    fileType: FileType.VIDEO,
    maxSizeInBytes: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['video/mp4'],
    allowedExtensions: ['.mp4'],
  },
  description: 'Subir video',
  required: true,
})
async uploadVideo(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

---

## 📝 Resumen de Mejoras

| Mejora | Estado | Impacto |
|--------|--------|---------|
| ✅ UseInterceptors combinados | Implementado | Alto - Código más limpio |
| ✅ Helper buildFileDescription() | Implementado | Medio - DRY, mantenible |
| ✅ ApiResponse flexible | Implementado | Medio - Menos acoplamiento |
| ✅ FileConfigs.Image separado | Implementado | Bajo - Claridad semántica |
| ⚠️ Interceptor con DI | Pendiente | Bajo - YAGNI por ahora |

**Conclusión:** El sistema está significativamente mejorado con mejor arquitectura, mantenibilidad y flexibilidad.

---

*Última actualización: 2025-12-20*
