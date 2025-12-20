# Sistema de Emails

Sistema completo de envío de emails con templates HTML profesionales para autenticación, recuperación de contraseña y notificaciones.

## 📧 Tipos de Emails Disponibles

1. **Código de Dos Factores (2FA)** - Para autenticación de dos pasos
2. **Recuperación de Contraseña** - Link para restablecer contraseña
3. **Bienvenida** - Email de bienvenida a nuevos usuarios
4. **Verificación de Email** - Link para verificar cuenta

## 🚀 Instalación

Las dependencias ya están instaladas:
```bash
npm install @nestjs-modules/mailer nodemailer handlebars
npm install --save-dev @types/nodemailer
```

## ⚙️ Configuración

### 1. Variables de Entorno

Agrega las siguientes variables en tu archivo `.env`:

```bash
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@audit2.com
MAIL_FROM_NAME=Audit2
APP_NAME=Audit2

# Frontend URL (para links en emails)
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail Setup (Recomendado para desarrollo)

Si usas Gmail, necesitas crear una **App Password**:

1. Ve a tu cuenta de Google → Seguridad
2. Habilita "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una nueva contraseña para "Correo"
5. Usa esa contraseña en `MAIL_PASSWORD`

### 3. Otras Opciones de SMTP

**SendGrid:**
```bash
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```bash
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USER=postmaster@yourdomain.mailgun.org
MAIL_PASSWORD=your-mailgun-password
```

**Ethereal (Testing):**
```bash
MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587
MAIL_USER=generated-user@ethereal.email
MAIL_PASSWORD=generated-password
```

Genera credenciales gratis en: https://ethereal.email/

### 4. Importar el Módulo

En `app.module.ts`:

```typescript
import { EmailModule } from './shared/email'

@Module({
  imports: [
    // ... otros módulos
    EmailModule,
  ],
})
export class AppModule {}
```

## 📝 Uso

### Inyectar el Servicio

```typescript
import { EmailService } from '@shared/email'

@Injectable()
export class AuthService {
  constructor(private readonly emailService: EmailService) {}
}
```

### 1. Enviar Código de 2FA

```typescript
await this.emailService.sendTwoFactorCode({
  to: 'user@example.com',
  userName: 'Juan Pérez',
  code: '123456',
  expiresInMinutes: 10,
})
```

### 2. Enviar Email de Recuperación de Contraseña

```typescript
const resetToken = 'generated-token-here'
const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

await this.emailService.sendResetPasswordEmail({
  to: 'user@example.com',
  userName: 'Juan Pérez',
  resetLink,
  expiresInMinutes: 30,
})
```

### 3. Enviar Email de Bienvenida

```typescript
const loginLink = `${process.env.FRONTEND_URL}/login`

await this.emailService.sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'Juan Pérez',
  loginLink,
})
```

### 4. Enviar Email de Verificación

```typescript
const verificationToken = 'generated-token-here'
const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`

await this.emailService.sendVerificationEmail({
  to: 'user@example.com',
  userName: 'Juan Pérez',
  verificationLink,
})
```

### 5. Email Personalizado

```typescript
await this.emailService.sendCustomEmail(
  'user@example.com',
  'Asunto del email',
  'nombre-template', // template debe existir en /templates
  {
    variable1: 'valor1',
    variable2: 'valor2',
  },
)
```

## 🎨 Templates

Los templates están en `src/shared/email/templates/` usando **Handlebars**.

### Estructura de Template

```handlebars
{{#> base}}
  <div class="greeting">
    Hola {{userName}},
  </div>

  <div class="message">
    Tu mensaje aquí
  </div>

  <div class="code-box">
    <div class="code">{{code}}</div>
  </div>
{{/base}}
```

### Variables Globales Disponibles

Disponibles en todos los templates:
- `{{appName}}` - Nombre de la aplicación
- `{{currentYear}}` - Año actual

### Clases CSS Disponibles

- `.greeting` - Saludo inicial
- `.message` - Mensaje general
- `.code-box` - Contenedor para códigos
- `.code` - Código grande centrado
- `.button` - Botón de acción
- `.warning` - Mensaje de advertencia
- `.info` - Mensaje informativo
- `.divider` - Línea divisoria

## 🔧 Ejemplo Completo: Integración con Auth

### En AuthService

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { EmailService } from '@shared/email'
import { OtpRepository } from './infrastructure/otp.repository'
import { UserRepository } from '../users/infrastructure/user.repository'

@Injectable()
export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly otpRepository: OtpRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async sendTwoFactorCode(userId: string): Promise<void> {
    // 1. Generar código OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 2. Guardar en BD
    await this.otpRepository.create({
      userId,
      code,
      type: 'TWO_FACTOR',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
    })

    // 3. Obtener usuario
    const user = await this.userRepository.findById(userId)

    // 4. Enviar email
    await this.emailService.sendTwoFactorCode({
      to: user.email,
      userName: user.fullName,
      code,
      expiresInMinutes: 10,
    })
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    // 1. Buscar usuario
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      // Por seguridad, no revelar si el email existe
      return
    }

    // 2. Generar token
    const resetToken = crypto.randomBytes(32).toString('hex')

    // 3. Guardar token en BD
    await this.otpRepository.create({
      userId: user.id,
      code: resetToken,
      type: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
    })

    // 4. Crear link de reset
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    // 5. Enviar email
    await this.emailService.sendResetPasswordEmail({
      to: user.email,
      userName: user.fullName,
      resetLink,
      expiresInMinutes: 30,
    })
  }
}
```

### En AuthController

```typescript
import { Controller, Post, Body } from '@nestjs/common'
import { Public } from './decorators/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-2fa')
  async sendTwoFactor(@Body() dto: { userId: string }) {
    await this.authService.sendTwoFactorCode(dto.userId)
    return { message: 'Código enviado exitosamente' }
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: { email: string }) {
    await this.authService.sendPasswordResetEmail(dto.email)
    return { message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' }
  }
}
```

## 🧪 Testing en Desarrollo

### Opción 1: Ethereal Email (Recomendado)

1. Ve a https://ethereal.email/
2. Crea una cuenta de prueba
3. Usa las credenciales en tu `.env`
4. Los emails se capturan en https://ethereal.email/messages

### Opción 2: Preview en Navegador

El módulo tiene `preview: true` en desarrollo. Los emails se abrirán automáticamente en tu navegador.

### Opción 3: MailHog (Local)

```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Configuración:
```bash
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=""
MAIL_PASSWORD=""
```

Ver emails en: http://localhost:8025

## 📊 Logs

El servicio registra automáticamente:
- ✅ Emails enviados exitosamente
- ❌ Errores al enviar emails

```
[EmailService] Email enviado exitosamente a user@example.com: Código de verificación - Audit2
[EmailService] Error enviando email a invalid@email.com: SMTP connection failed
```

## 🎨 Personalizar Templates

### Crear Nuevo Template

1. Crea archivo en `templates/mi-template.hbs`:

```handlebars
{{#> base}}
  <div class="greeting">
    Hola {{userName}},
  </div>

  <div class="message">
    {{customMessage}}
  </div>
{{/base}}
```

2. Usa el método `sendCustomEmail`:

```typescript
await this.emailService.sendCustomEmail(
  'user@example.com',
  'Mi Asunto',
  'mi-template',
  {
    userName: 'Juan',
    customMessage: 'Este es mi mensaje personalizado',
  },
)
```

## ⚠️ Consideraciones de Producción

1. **Rate Limiting**: Implementa límites de envío para prevenir spam
2. **Queue System**: Usa Bull/BullMQ para envíos asíncronos
3. **Email Validation**: Valida emails antes de enviar
4. **Bounce Handling**: Maneja rebotes y emails inválidos
5. **Unsubscribe Links**: Agrega links de cancelación de suscripción
6. **DKIM/SPF**: Configura autenticación de dominio
7. **Monitoring**: Monitorea tasas de entrega y bounces

## 🔐 Seguridad

- ✅ No incluir información sensible en emails
- ✅ Usar HTTPS en todos los links
- ✅ Tokens de un solo uso con expiración
- ✅ No revelar si un email existe en el sistema
- ✅ Rate limiting en endpoints de envío de email

## 🆘 Troubleshooting

### Email no se envía

1. Verifica credenciales SMTP
2. Revisa logs del servidor
3. Verifica firewall/puerto
4. Prueba con Ethereal primero

### Email va a spam

1. Configura SPF/DKIM
2. Usa un dominio verificado
3. Evita palabras spam
4. Mantén ratio envío/bounces bajo

### Template no se encuentra

1. Verifica ruta del template
2. Asegúrate que el archivo `.hbs` existe
3. Revisa nombre del template (sin extensión)

## 📚 Recursos

- [Nodemailer Docs](https://nodemailer.com/)
- [NestJS Mailer](https://nest-modules.github.io/mailer/)
- [Handlebars Docs](https://handlebarsjs.com/)
- [Ethereal Email](https://ethereal.email/)
