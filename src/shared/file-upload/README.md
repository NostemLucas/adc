# 📁 Sistema de File Upload

Sistema estandarizado y reutilizable para la subida y gestión de archivos en el proyecto.

## 🎯 Características

- ✅ **Decoradores reutilizables** para validación y documentación Swagger
- ✅ **Servicio centralizado** para gestión de archivos
- ✅ **Validación automática** de tipo, tamaño y extensión
- ✅ **Configuraciones predefinidas** para casos comunes
- ✅ **Documentación Swagger automática**
- ✅ **TypeScript full** con tipos completos

## 📦 Instalación

El módulo ya está configurado globalmente en el proyecto. Solo necesitas importar los decoradores donde los uses.

## 🚀 Uso Rápido

### 1. Subir un solo archivo (Avatar de usuario)

```typescript
import {
  ApiSingleFile,
  ValidateSingleFile,
  FileConfigs,
} from '@shared/file-upload'

@Post(':id/avatar')
@ValidateSingleFile('avatar', FileConfigs.UserAvatar)
@ApiSingleFile('avatar', {
  description: 'Subir avatar de usuario',
  validation: FileConfigs.UserAvatar,
})
async uploadAvatar(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  const result = await this.fileStorageService.saveFile(
    file,
    'users/avatars',
    true
  )
  return result
}
```

### 2. Subir múltiples archivos (Documentos de auditoría)

```typescript
import {
  ApiMultipleFiles,
  ValidateMultipleFiles,
  FileConfigs,
} from '@shared/file-upload'

@Post('upload-documents')
@ValidateMultipleFiles('documents', 5, FileConfigs.Document)
@ApiMultipleFiles('documents', {
  description: 'Subir documentos de auditoría',
  maxFiles: 5,
  validation: FileConfigs.Document,
})
async uploadDocuments(
  @UploadedFiles() files: Express.Multer.File[],
) {
  const results = await Promise.all(
    files.map(file =>
      this.fileStorageService.saveFile(file, 'audits/documents', true)
    )
  )
  return results
}
```

### 3. Subir archivo con campos adicionales

```typescript
import {
  ApiFileFields,
  ValidateSingleFile,
  FileConfigs,
} from '@shared/file-upload'

@Post('create-with-image')
@ValidateSingleFile('image', FileConfigs.UserAvatar)
@ApiFileFields({
  files: [
    { name: 'image', maxCount: 1, required: true }
  ],
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string' }
  },
  validation: FileConfigs.UserAvatar
})
async createWithImage(
  @UploadedFile('image') image: Express.Multer.File,
  @Body() dto: CreateAuditDto,
) {
  const imageInfo = await this.fileStorageService.saveFile(
    image,
    'audits/images',
    true
  )

  return this.auditService.create({
    ...dto,
    imageUrl: imageInfo.url,
  })
}
```

## 🎨 Configuraciones Predefinidas

### UserAvatar
```typescript
FileConfigs.UserAvatar
// - Tipo: IMAGE
// - Tamaño máximo: 5MB
// - Formatos: .jpg, .jpeg, .png, .webp
// - MIME types: image/jpeg, image/png, image/webp
```

### Document
```typescript
FileConfigs.Document
// - Tipo: DOCUMENT
// - Tamaño máximo: 10MB
// - Formatos: .pdf, .doc, .docx
// - MIME types: application/pdf, application/msword, etc.
```

### AuditAttachment
```typescript
FileConfigs.AuditAttachment
// - Tipo: ANY
// - Tamaño máximo: 20MB
// - Formatos: .jpg, .jpeg, .png, .pdf, .xlsx
// - MIME types: image/*, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

## 🛠️ Configuración Personalizada

### Definir tus propias validaciones

```typescript
const customValidation: FileValidationOptions = {
  fileType: FileType.IMAGE,
  maxSizeInBytes: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ['image/png'],
  allowedExtensions: ['.png'],
  required: true,
}

@Post('upload')
@ValidateSingleFile('file', customValidation)
@ApiSingleFile('file', { validation: customValidation })
async upload(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

## 📚 API del FileStorageService

### saveFile()
Guarda un archivo en el sistema de archivos.

```typescript
const result = await this.fileStorageService.saveFile(
  file,                    // Express.Multer.File
  'users/avatars',        // subdirectorio
  true                    // generar nombre único
)

// Resultado:
// {
//   originalName: 'avatar.jpg',
//   filename: '1234567890-abc123.jpg',
//   path: 'users/avatars/1234567890-abc123.jpg',
//   mimetype: 'image/jpeg',
//   size: 123456,
//   url: 'http://localhost:3000/uploads/users/avatars/1234567890-abc123.jpg'
// }
```

### deleteFile()
Elimina un archivo del sistema.

```typescript
await this.fileStorageService.deleteFile('users/avatars/old-avatar.jpg')
```

### validateFile()
Valida un archivo según opciones.

```typescript
this.fileStorageService.validateFile(file, {
  fileType: FileType.IMAGE,
  maxSizeInBytes: 5 * 1024 * 1024,
  required: true,
})
// Lanza BadRequestException si no es válido
```

### fileExists()
Verifica si un archivo existe.

```typescript
const exists = await this.fileStorageService.fileExists('users/avatars/avatar.jpg')
```

## 🎭 Decoradores Disponibles

### Validación

#### @ValidateSingleFile()
Valida un solo archivo subido.

```typescript
@ValidateSingleFile(
  'fieldName',           // nombre del campo (default: 'file')
  validationOptions      // opciones de validación
)
```

#### @ValidateMultipleFiles()
Valida múltiples archivos subidos.

```typescript
@ValidateMultipleFiles(
  'fieldName',           // nombre del campo (default: 'files')
  10,                    // máximo de archivos (default: 10)
  validationOptions      // opciones de validación
)
```

### Documentación Swagger

#### @ApiSingleFile()
Documenta endpoint que acepta un archivo.

```typescript
@ApiSingleFile(
  'fieldName',
  {
    description: 'Descripción del archivo',
    validation: FileConfigs.UserAvatar,
  }
)
```

#### @ApiMultipleFiles()
Documenta endpoint que acepta múltiples archivos.

```typescript
@ApiMultipleFiles(
  'fieldName',
  {
    description: 'Descripción de los archivos',
    maxFiles: 5,
    validation: FileConfigs.Document,
  }
)
```

#### @ApiFileFields()
Documenta endpoint que acepta archivos + campos.

```typescript
@ApiFileFields({
  files: [
    { name: 'avatar', maxCount: 1, required: true },
    { name: 'documents', maxCount: 5 }
  ],
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string' }
  },
  validation: FileConfigs.UserAvatar
})
```

#### @ApiFileUploadResponse()
Documenta la respuesta exitosa de un upload.

```typescript
@ApiFileUploadResponse('Archivo subido exitosamente')
```

## 🔒 Validaciones

Las validaciones se ejecutan automáticamente con los decoradores `@Validate*File()`:

1. **Archivo requerido**: Si `required: true`, el archivo debe estar presente
2. **Tamaño**: No debe exceder `maxSizeInBytes`
3. **Tipo MIME**: Debe estar en `allowedMimeTypes`
4. **Extensión**: Debe estar en `allowedExtensions`
5. **Tipo de archivo**: Debe coincidir con `fileType` (IMAGE, DOCUMENT, etc.)

## 🌐 URLs Públicas

El servicio genera automáticamente URLs públicas basadas en:

```env
APP_URL=http://localhost:3000
```

URL resultante: `{APP_URL}/uploads/{relativePath}`

## 📂 Estructura de Archivos

Los archivos se guardan en:

```
uploads/
├── users/
│   └── avatars/
│       └── 1234567890-abc123.jpg
├── audits/
│   ├── documents/
│   └── images/
└── ...
```

Configurable con:

```env
UPLOAD_PATH=./uploads
```

## 🎯 Ejemplo Completo: Upload de Avatar

### 1. Use Case

```typescript
// upload-avatar.use-case.ts
@Injectable()
export class UploadAvatarUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(userId: string, file: Express.Multer.File) {
    const user = await this.userRepository.findByIdOrFail(userId)

    // Eliminar avatar anterior
    if (user.image) {
      await this.fileStorageService.deleteFile(user.image)
    }

    // Guardar nuevo avatar
    const uploadedFile = await this.fileStorageService.saveFile(
      file,
      'users/avatars',
      true
    )

    // Actualizar usuario
    user.image = uploadedFile.path
    await this.userRepository.update(user)

    return uploadedFile
  }
}
```

### 2. Controller

```typescript
// users.controller.ts
@Post(':id/avatar')
@ValidateSingleFile('avatar', FileConfigs.UserAvatar)
@ApiSingleFile('avatar', {
  description: 'Avatar del usuario',
  validation: FileConfigs.UserAvatar,
})
@ApiFileUploadResponse('Avatar subido exitosamente')
async uploadAvatar(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  const result = await this.uploadAvatarUseCase.execute(id, file)

  return {
    message: 'Avatar actualizado exitosamente',
    avatarUrl: result.url,
    avatarPath: result.path,
  }
}
```

### 3. Probar con cURL

```bash
curl -X POST http://localhost:3000/users/123/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

## ⚙️ Variables de Entorno

```env
# Ruta base para uploads (default: ./uploads)
UPLOAD_PATH=./uploads

# Tamaño máximo global (default: 20MB)
MAX_FILE_SIZE=20971520

# URL base de la aplicación (para generar URLs públicas)
APP_URL=http://localhost:3000
```

## 🎨 TypeScript Support

Todos los tipos están completamente tipados:

```typescript
import type {
  FileType,
  FileValidationOptions,
  UploadedFileInfo,
} from '@shared/file-upload'
```

## 🚧 Mejoras Futuras

- [ ] Soporte para almacenamiento en la nube (S3, GCS, Azure)
- [ ] Procesamiento de imágenes (resize, crop, optimize)
- [ ] Generación automática de thumbnails
- [ ] Streaming para archivos grandes
- [ ] Escaneo de virus
- [ ] Caché de archivos

## 📝 Notas

- Los archivos se guardan primero en memoria (multer memory storage) y luego se escriben manualmente
- Esto permite validar antes de guardar y tener control total del proceso
- Los nombres de archivos se generan con timestamp + UUID para evitar colisiones
- El servicio es global y puede ser inyectado en cualquier módulo

## ✅ Ventajas de este Sistema

1. **DRY**: No repetir código de validación y guardado
2. **Consistencia**: Misma forma de manejar archivos en todo el proyecto
3. **Documentación automática**: Swagger se genera automáticamente
4. **Type-safe**: TypeScript completo
5. **Fácil de usar**: Solo decoradores y servicio
6. **Flexible**: Configuraciones personalizables
7. **Mantenible**: Cambios en un solo lugar
