# 🚀 Inicio Rápido: Sistema de Emails

Guía de 5 minutos para tener emails funcionando con **Ethereal Email** (servicio de prueba gratuito de Nodemailer).

## Paso 1: Generar Credenciales de Prueba Automáticamente

Ejecuta el script que genera credenciales de Ethereal automáticamente:

```bash
npx ts-node scripts/setup-test-email.ts
```

Verás algo como:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Cuenta de prueba de Ethereal Email creada:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Host:     smtp.ethereal.email
Port:     587
Secure:   false
User:     john.doe123@ethereal.email
Password: abc123xyz789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Ver emails en: https://ethereal.email/messages
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Tip: Copia estas credenciales a tu archivo .env:

MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=john.doe123@ethereal.email
MAIL_PASSWORD=abc123xyz789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Paso 2: Configurar `.env`

Copia las credenciales generadas a tu archivo `.env`:

```bash
# Email Configuration
MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=john.doe123@ethereal.email
MAIL_PASSWORD=abc123xyz789
MAIL_FROM=noreply@audit2.com
MAIL_FROM_NAME=Audit2
APP_NAME=Audit2

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Paso 3: Iniciar la Aplicación

```bash
npm run start:dev
```

## Paso 4: Probar Recuperación de Contraseña

### Con cURL:

```bash
# Solicitar recuperación de contraseña
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Respuesta:

```json
{
  "message": "Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña"
}
```

### En los logs verás:

```
[EmailService] Email enviado exitosamente a user@example.com: Recuperar contraseña - Audit2
[EmailService] 📧 Preview: https://ethereal.email/message/ZmFrZS1tZXNzYWdlLWlkLTEyMzQ1Njc
```

## Paso 5: Ver el Email

1. Copia la URL de preview de los logs
2. Pégala en tu navegador
3. ¡Verás el email con el link de recuperación!

O visita https://ethereal.email/messages y busca tu email.

## Paso 6: Probar Reset de Contraseña

Copia el token del email y úsalo para resetear la contraseña:

```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DEL_EMAIL",
    "newPassword": "NewSecurePass123!"
  }'
```

## 📝 Endpoints Disponibles

### 1. Recuperar Contraseña
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 2. Restablecer Contraseña
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "token-del-email",
  "newPassword": "NewPass123!"
}
```

### 3. Enviar Código 2FA (requiere autenticación)
```http
POST /auth/send-2fa-code
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🎨 Tipos de Emails Disponibles

### En AuthService:

```typescript
// 1. Recuperación de contraseña
await this.authService.forgotPassword('user@example.com')

// 2. Código de 2FA
await this.authService.sendTwoFactorCode(userId)
```

### Directamente con EmailService:

```typescript
// 3. Email de bienvenida
await this.emailService.sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'Juan Pérez',
  loginLink: 'http://app.com/login',
})

// 4. Verificación de email
await this.emailService.sendVerificationEmail({
  to: 'user@example.com',
  userName: 'Juan Pérez',
  verificationLink: 'http://app.com/verify?token=abc',
})
```

## 🧪 Testing Completo

```bash
# 1. Generar credenciales
npx ts-node scripts/setup-test-email.ts

# 2. Copiar credenciales a .env

# 3. Iniciar app
npm run start:dev

# 4. Probar forgot-password
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# 5. Ver email en: https://ethereal.email/messages
```

## 🔧 Troubleshooting

### No recibo emails

1. **Verifica las credenciales en `.env`**
   ```bash
   cat .env | grep MAIL_
   ```

2. **Revisa los logs de la aplicación**
   ```
   [EmailService] Email enviado exitosamente...
   [EmailService] 📧 Preview: https://ethereal.email/...
   ```

3. **Copia la URL de preview** y ábrela en el navegador

### Email no se envía

1. **Verifica que EmailModule esté importado** en `app.module.ts`
2. **Verifica que las credenciales sean correctas**
3. **Revisa si hay errores en los logs**:
   ```
   [EmailService] Error enviando email: ...
   ```

## 🚀 Próximos Pasos

### Para Producción:

Reemplaza Ethereal con un servicio real:

#### Gmail:
```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

#### SendGrid:
```bash
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=SG.your-api-key
```

## 📚 Documentación Completa

- `src/shared/email/README.md` - Guía completa del sistema de emails
- `src/shared/email/INTEGRATION_EXAMPLE.md` - Ejemplos de integración
- Swagger: http://localhost:3000/api/docs

## ✅ Checklist

- [x] Dependencias instaladas
- [x] EmailModule configurado
- [x] OtpRepository creado
- [x] AuthService actualizado con forgot-password y reset-password
- [x] Endpoints agregados al AuthController
- [x] Templates HTML profesionales creados
- [x] Script de generación de credenciales de prueba

## 🎉 ¡Todo Listo!

Ahora puedes:
- ✅ Enviar emails de recuperación de contraseña
- ✅ Enviar códigos de 2FA
- ✅ Enviar emails de bienvenida
- ✅ Enviar emails de verificación
- ✅ Ver previews de emails en desarrollo
