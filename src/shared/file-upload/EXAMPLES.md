# 📚 Ejemplos de Uso - Sistema de File Upload

Este documento muestra diferentes formas de usar el sistema de file upload, desde la más simple hasta la más personalizada.

## 🎯 Nivel 1: Decoradores Predefinidos (MÁS SIMPLE)

Para casos comunes, usa los decoradores predefinidos. **Un solo decorador hace todo**: Multer + Validación + Swagger.

### Avatar de Usuario

```typescript
import { UploadAvatar } from '@shared/file-upload'

@Post(':id/avatar')
@UploadAvatar() // 🔥 Solo esto!
async uploadAvatar(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.userService.updateAvatar(id, file)
}
```

### Un Documento

```typescript
import { UploadDocument } from '@shared/file-upload'

@Post('upload-contract')
@UploadDocument('contract') // Campo: 'contract'
async uploadContract(@UploadedFile() file: Express.Multer.File) {
  return this.contractService.save(file)
}
```

### Múltiples Documentos

```typescript
import { UploadDocuments } from '@shared/file-upload'

@Post('upload-documents')
@UploadDocuments('attachments', 5) // Campo: 'attachments', máximo 5
async uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
  return this.auditService.saveDocuments(files)
}
```

### Una Imagen

```typescript
import { UploadImage } from '@shared/file-upload'

@Post('upload-photo')
@UploadImage('photo')
async uploadPhoto(@UploadedFile() file: Express.Multer.File) {
  return this.galleryService.save(file)
}
```

### Múltiples Imágenes

```typescript
import { UploadImages } from '@shared/file-upload'

@Post('upload-gallery')
@UploadImages('photos', 20) // Máximo 20 fotos
async uploadGallery(@UploadedFiles() files: Express.Multer.File[]) {
  return this.galleryService.saveMultiple(files)
}
```

### Archivos de Auditoría

```typescript
import { UploadAuditAttachments } from '@shared/file-upload'

@Post('upload-attachments')
@UploadAuditAttachments('files', 10)
async uploadAttachments(@UploadedFiles() files: Express.Multer.File[]) {
  return this.auditService.saveAttachments(files)
}
```

## 🎨 Nivel 2: Decoradores Genéricos (PERSONALIZABLE)

Para casos con configuraciones específicas, usa `@UploadFile()` o `@UploadFiles()`.

### Un Solo Archivo - Personalizado

```typescript
import { UploadFile, FileConfigs } from '@shared/file-upload'

@Post('upload')
@UploadFile({
  field: 'resume',                    // Nombre del campo
  config: FileConfigs.Document,       // Configuración de validación
  description: 'Subir currículum',    // Descripción para Swagger
  required: true,                      // Si es requerido
})
async uploadResume(@UploadedFile() file: Express.Multer.File) {
  return this.hrService.saveResume(file)
}
```

### Múltiples Archivos - Personalizado

```typescript
import { UploadFiles, FileConfigs } from '@shared/file-upload'

@Post('upload-evidence')
@UploadFiles({
  field: 'evidence',
  maxCount: 15,
  config: FileConfigs.AuditAttachment,
  description: 'Subir evidencias de auditoría',
  required: true,
})
async uploadEvidence(@UploadedFiles() files: Express.Multer.File[]) {
  return this.auditService.saveEvidence(files)
}
```

### Archivo Opcional

```typescript
import { UploadFile, FileConfigs } from '@shared/file-upload'

@Post('create-report')
@UploadFile({
  field: 'attachment',
  config: FileConfigs.Document,
  description: 'Adjuntar documento (opcional)',
  required: false, // 🔥 Archivo opcional
})
async createReport(
  @Body() dto: CreateReportDto,
  @UploadedFile() file?: Express.Multer.File,
) {
  return this.reportService.create(dto, file)
}
```

## ⚙️ Nivel 3: Configuración Totalmente Personalizada

Para validaciones únicas, crea tu propia configuración.

### Configuración Personalizada

```typescript
import { UploadFile, FileType, FileValidationOptions } from '@shared/file-upload'

const customVideoConfig: FileValidationOptions = {
  fileType: FileType.VIDEO,
  maxSizeInBytes: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: ['video/mp4', 'video/quicktime'],
  allowedExtensions: ['.mp4', '.mov'],
  required: true,
}

@Post('upload-video')
@UploadFile({
  field: 'video',
  config: customVideoConfig,
  description: 'Subir video de presentación',
})
async uploadVideo(@UploadedFile() file: Express.Multer.File) {
  return this.mediaService.saveVideo(file)
}
```

### Solo Imágenes PNG

```typescript
const pngOnlyConfig: FileValidationOptions = {
  fileType: FileType.IMAGE,
  maxSizeInBytes: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ['image/png'],
  allowedExtensions: ['.png'],
  required: true,
}

@Post('upload-logo')
@UploadFile({
  field: 'logo',
  config: pngOnlyConfig,
  description: 'Subir logo (solo PNG)',
})
async uploadLogo(@UploadedFile() file: Express.Multer.File) {
  return this.brandingService.saveLogo(file)
}
```

## 📦 Guardar Archivos con FileStorageService

Después de recibir el archivo, usa el servicio para guardarlo.

### Guardar Un Solo Archivo

```typescript
import { FileStorageService } from '@shared/file-upload'

constructor(
  private readonly fileStorageService: FileStorageService
) {}

@Post('upload-avatar')
@UploadAvatar()
async uploadAvatar(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  // Guardar el archivo
  const savedFile = await this.fileStorageService.saveFile(
    file,
    'users/avatars',  // Subdirectorio
    true              // Generar nombre único
  )

  // savedFile contiene: originalName, filename, path, mimetype, size, url

  return {
    message: 'Avatar subido exitosamente',
    url: savedFile.url,
    path: savedFile.path,
  }
}
```

### Guardar Múltiples Archivos

```typescript
@Post('upload-documents')
@UploadDocuments('documents', 10)
async uploadDocuments(@UploadedFiles() files: Express.Multer.File[]) {
  // Guardar todos los archivos
  const savedFiles = await Promise.all(
    files.map(file =>
      this.fileStorageService.saveFile(file, 'audits/documents', true)
    )
  )

  return {
    message: `${savedFiles.length} documentos subidos exitosamente`,
    files: savedFiles.map(f => ({
      name: f.originalName,
      url: f.url,
    })),
  }
}
```

### Reemplazar Archivo Anterior

```typescript
@Post(':id/avatar')
@UploadAvatar()
async uploadAvatar(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  const user = await this.userRepository.findById(id)

  // Eliminar avatar anterior si existe
  if (user.image) {
    await this.fileStorageService.deleteFile(user.image)
  }

  // Guardar nuevo avatar
  const savedFile = await this.fileStorageService.saveFile(
    file,
    'users/avatars',
    true
  )

  // Actualizar usuario
  user.image = savedFile.path
  await this.userRepository.update(user)

  return { url: savedFile.url }
}
```

## 🎯 Comparación: Antes vs Ahora

### ❌ Antes (Repetitivo)

```typescript
@Post('upload-avatar')
@UseInterceptors(FileInterceptor('avatar'))
@UseInterceptors(new FileValidationInterceptor('avatar', {
  fileType: FileType.IMAGE,
  maxSizeInBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  required: true,
}, false))
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      avatar: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@ApiResponse({ status: 201, description: 'Avatar subido exitosamente' })
@ApiResponse({ status: 400, description: 'Archivo inválido' })
async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

### ✅ Ahora (Simple)

```typescript
@Post('upload-avatar')
@UploadAvatar() // 🔥 Solo una línea!
async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

## 🔥 Decoradores Disponibles

### Predefinidos (Más Comunes)

| Decorador | Descripción | Tipo | Tamaño | Formatos |
|-----------|-------------|------|--------|----------|
| `@UploadAvatar()` | Avatar de usuario | Imagen | 5MB | jpg, png, webp |
| `@UploadDocument()` | Un documento | Documento | 10MB | pdf, doc, docx |
| `@UploadDocuments()` | Múltiples documentos | Documentos | 10MB c/u | pdf, doc, docx |
| `@UploadImage()` | Una imagen | Imagen | 5MB | jpg, png, webp |
| `@UploadImages()` | Múltiples imágenes | Imágenes | 5MB c/u | jpg, png, webp |
| `@UploadAuditAttachments()` | Archivos de auditoría | Cualquiera | 20MB c/u | jpg, png, pdf, xlsx |

### Genéricos (Personalizables)

| Decorador | Uso | Parámetros |
|-----------|-----|------------|
| `@UploadFile()` | Un archivo | `{ field, config, description, required }` |
| `@UploadFiles()` | Múltiples archivos | `{ field, maxCount, config, description, required }` |

## 📋 Resumen de Parámetros

### UploadFile Options

```typescript
{
  field?: string                      // default: 'file'
  config?: FileValidationOptions      // Configuración de validación
  description?: string                // Para Swagger
  required?: boolean                  // default: true
}
```

### UploadFiles Options

```typescript
{
  field?: string                      // default: 'files'
  maxCount?: number                   // default: 10
  config?: FileValidationOptions      // Configuración de validación
  description?: string                // Para Swagger
  required?: boolean                  // default: true
}
```

### FileValidationOptions

```typescript
{
  fileType?: FileType                 // IMAGE, DOCUMENT, AUDIO, VIDEO, ANY
  maxSizeInBytes?: number            // Tamaño máximo
  allowedMimeTypes?: string[]        // Tipos MIME permitidos
  allowedExtensions?: string[]       // Extensiones permitidas
  required?: boolean                 // Si es requerido
}
```

## 💡 Tips y Mejores Prácticas

1. **Usa decoradores predefinidos cuando sea posible**
   ```typescript
   ✅ @UploadAvatar()
   ❌ @UploadFile({ field: 'avatar', config: FileConfigs.UserAvatar })
   ```

2. **Especifica el nombre del campo si no es el default**
   ```typescript
   @UploadAvatar('profilePicture') // Campo: 'profilePicture'
   ```

3. **Limita el número de archivos para uploads múltiples**
   ```typescript
   @UploadDocuments('docs', 5) // Máximo 5 documentos
   ```

4. **Usa required: false para archivos opcionales**
   ```typescript
   @UploadFile({ field: 'attachment', required: false })
   ```

5. **Siempre elimina archivos antiguos antes de guardar nuevos**
   ```typescript
   if (user.image) {
     await this.fileStorageService.deleteFile(user.image)
   }
   ```

6. **Guarda la ruta relativa en la BD, no la URL completa**
   ```typescript
   user.image = savedFile.path // ✅ 'users/avatars/123.jpg'
   user.image = savedFile.url  // ❌ 'http://localhost:3000/uploads/...'
   ```

## 🎯 Casos de Uso Reales

### Crear Usuario con Avatar

```typescript
@Post('create-with-avatar')
@UploadAvatar()
async createUserWithAvatar(
  @Body() dto: CreateUserDto,
  @UploadedFile() avatar: Express.Multer.File,
) {
  // Guardar avatar
  const savedAvatar = await this.fileStorageService.saveFile(
    avatar,
    'users/avatars',
    true
  )

  // Crear usuario con la ruta del avatar
  const user = await this.userService.create({
    ...dto,
    image: savedAvatar.path,
  })

  return { ...user, avatarUrl: savedAvatar.url }
}
```

### Auditoría con Múltiples Evidencias

```typescript
@Post('audits/:id/upload-evidence')
@UploadAuditAttachments('evidence', 15)
async uploadEvidence(
  @Param('id') auditId: string,
  @UploadedFiles() files: Express.Multer.File[],
) {
  // Guardar todas las evidencias
  const savedFiles = await Promise.all(
    files.map(file =>
      this.fileStorageService.saveFile(
        file,
        `audits/${auditId}/evidence`,
        true
      )
    )
  )

  // Asociar con la auditoría
  await this.auditService.addEvidence(
    auditId,
    savedFiles.map(f => f.path)
  )

  return {
    message: `${savedFiles.length} evidencias subidas`,
    files: savedFiles,
  }
}
```

### Reporte con Documento Opcional

```typescript
@Post('create-report')
@UploadDocument('attachment', false) // Opcional
async createReport(
  @Body() dto: CreateReportDto,
  @UploadedFile() attachment?: Express.Multer.File,
) {
  let attachmentPath: string | undefined

  if (attachment) {
    const saved = await this.fileStorageService.saveFile(
      attachment,
      'reports/attachments',
      true
    )
    attachmentPath = saved.path
  }

  return this.reportService.create({
    ...dto,
    attachmentPath,
  })
}
```

## ✨ Resultado

Con estos decoradores:
- ✅ **90% menos código** en controllers
- ✅ **Swagger automático** sin configuración manual
- ✅ **Validación automática** sin interceptores manuales
- ✅ **Código limpio y legible**
- ✅ **Reutilizable en todo el proyecto**
- ✅ **Type-safe con TypeScript**
