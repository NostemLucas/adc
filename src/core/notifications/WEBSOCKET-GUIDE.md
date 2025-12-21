# 🔔 Guía Completa - Sistema de Notificaciones WebSocket

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura)
2. [Configuración del Cliente (Frontend)](#cliente-frontend)
3. [Uso en el Backend](#uso-backend)
4. [Salas (Rooms) y Permisos](#salas-rooms)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Testing](#testing)

---

## 🏗️ Arquitectura del Sistema {#arquitectura}

### Flujo de Notificaciones

```
┌─────────────┐
│   Backend   │
│   Action    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ NotificationBroadcastService│
│  - Crea notificación en BD  │
│  - Emite via WebSocket      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────┐
│ NotificationsGateway│
│  - Gestiona salas   │
│  - Emite eventos    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────┐
│  Cliente (Web)  │
│  - Recibe event │
│  - Muestra UI   │
└─────────────────┘
```

### Componentes Principales

1. **NotificationsGateway** - WebSocket Server (Socket.io)
2. **NotificationBroadcastService** - Servicio para enviar notificaciones
3. **Notification Entity** - Almacenamiento en BD
4. **Rooms/Salas** - Agrupación de usuarios por rol

---

## 🌐 Configuración del Cliente (Frontend) {#cliente-frontend}

### Instalación

```bash
npm install socket.io-client
```

### Conexión Básica

```typescript
// notifications.service.ts
import { io, Socket } from 'socket.io-client'

export class NotificationsService {
  private socket: Socket | null = null

  connect(token: string) {
    this.socket = io('http://localhost:3000/notifications', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.setupListeners()
  }

  private setupListeners() {
    if (!this.socket) return

    // Conexión exitosa
    this.socket.on('connect', () => {
      console.log('✅ Conectado a notificaciones')
    })

    // Recibir notificación
    this.socket.on('notification', (notification) => {
      console.log('📬 Nueva notificación:', notification)
      this.handleNotification(notification)
    })

    // Error de conexión
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error.message)
    })

    // Desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Desconectado:', reason)
    })
  }

  private handleNotification(notification: any) {
    // Mostrar toast/snackbar
    this.showToast(notification)

    // Actualizar contador de no leídas
    this.updateUnreadCount()

    // Reproducir sonido (opcional)
    this.playSound()
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }
}
```

### Ejemplo con React

```tsx
// useNotifications.hook.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Notification {
  id: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: Date
}

export function useNotifications(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!token) return

    // Conectar
    const newSocket = io('http://localhost:3000/notifications', {
      auth: { token },
      transports: ['websocket'],
    })

    newSocket.on('connect', () => {
      console.log('✅ Conectado')
      setIsConnected(true)
    })

    newSocket.on('notification', (notification: Notification) => {
      console.log('📬 Nueva notificación:', notification)

      // Agregar a la lista
      setNotifications(prev => [notification, ...prev])

      // Incrementar contador
      if (!notification.isRead) {
        setUnreadCount(prev => prev + 1)
      }

      // Mostrar toast
      showToast(notification)
    })

    newSocket.on('disconnect', () => {
      console.log('⚠️ Desconectado')
      setIsConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [token])

  return {
    socket,
    notifications,
    unreadCount,
    isConnected,
  }
}
```

### Ejemplo con Angular

```typescript
// notifications.service.ts
import { Injectable } from '@angular/core'
import { io, Socket } from 'socket.io-client'
import { BehaviorSubject, Observable } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private socket: Socket | null = null
  private notificationsSubject = new BehaviorSubject<any[]>([])
  private unreadCountSubject = new BehaviorSubject<number>(0)

  notifications$: Observable<any[]> = this.notificationsSubject.asObservable()
  unreadCount$: Observable<number> = this.unreadCountSubject.asObservable()

  connect(token: string) {
    this.socket = io('http://localhost:3000/notifications', {
      auth: { token },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('✅ Conectado a notificaciones')
    })

    this.socket.on('notification', (notification) => {
      const current = this.notificationsSubject.value
      this.notificationsSubject.next([notification, ...current])

      if (!notification.isRead) {
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1)
      }
    })
  }

  disconnect() {
    this.socket?.disconnect()
  }
}
```

---

## 🔧 Uso en el Backend {#uso-backend}

### Inyectar el Servicio

```typescript
import { NotificationBroadcastService } from '@core/notifications/application/services/notification-broadcast.service'

@Injectable()
export class MyService {
  constructor(
    private readonly notificationBroadcast: NotificationBroadcastService,
  ) {}
}
```

### Notificar a Administradores

```typescript
await this.notificationBroadcast.notifyAdmins({
  title: 'Nuevo usuario registrado',
  message: `El usuario ${user.fullName} se ha registrado`,
  link: `/users/${user.id}`,
  metadata: {
    userId: user.id,
    action: 'user_created',
  },
  createdById: currentUser.id,
})
```

### Notificar a Gerentes y Auditores

```typescript
await this.notificationBroadcast.notifyManagersAndAuditors({
  title: 'Nueva auditoría asignada',
  message: `Se ha creado la auditoría "${audit.title}"`,
  link: `/audits/${audit.id}`,
  metadata: {
    auditId: audit.id,
    action: 'audit_created',
  },
  createdById: currentUser.id,
})
```

### Notificar a Usuario Específico

```typescript
import { NotificationType } from '@core/notifications/domain/notification-type.enum'

await this.notificationBroadcast.notifyUser({
  userId: auditor.id,
  type: NotificationType.INFO,
  title: 'Te han asignado una auditoría',
  message: `Has sido asignado a "${audit.title}"`,
  link: `/audits/${audit.id}`,
  metadata: {
    auditId: audit.id,
    action: 'auditor_assigned',
  },
  createdById: currentUser.id,
})
```

### Notificar a Cliente

```typescript
await this.notificationBroadcast.notifyClient({
  userId: client.id,
  type: NotificationType.SUCCESS,
  title: 'Documento compartido',
  message: 'Se ha compartido un nuevo documento contigo',
  link: `/documents/${document.id}`,
  metadata: {
    documentId: document.id,
    action: 'document_shared',
  },
  createdById: currentUser.id,
})
```

---

## 🏠 Salas (Rooms) y Permisos {#salas-rooms}

### Sistema de Salas

| Sala | Usuarios | Uso |
|------|----------|-----|
| `admin` | Administradores | Notificaciones de sistema |
| `manager-auditor` | Gerentes + Auditores | Notificaciones de auditorías |
| `client-{userId}` | Cliente específico | Notificaciones personales para clientes |
| `user-{userId}` | Usuario específico | Notificaciones personales para cualquier usuario |

### Auto-Join

Cuando un usuario se conecta al WebSocket, automáticamente se une a las salas según sus roles:

```typescript
// Usuario Administrador
user.isAdmin → join('admin')
user.isAdmin → join('user-{userId}')

// Usuario Gerente
user.isManager → join('manager-auditor')
user.isManager → join('user-{userId}')

// Usuario Auditor
user.isAuditor → join('manager-auditor')
user.isAuditor → join('user-{userId}')

// Usuario Cliente
user.isClient → join('client-{userId}')
user.isClient → join('user-{userId}')
```

---

## 💡 Ejemplos Prácticos {#ejemplos-prácticos}

### 1. Notificar cuando se crea un usuario

```typescript
// src/core/users/application/use-cases/create-user.use-case.ts

async execute(dto: CreateUserDto, createdByUserId?: string): Promise<User> {
  // Crear usuario
  const user = await this.userRepository.create(...)

  // 🔔 Notificar a administradores
  await this.notificationBroadcast.notifyAdmins({
    title: 'Nuevo usuario creado',
    message: `Se ha creado el usuario ${user.fullName} (${user.username})`,
    link: `/users/${user.id}`,
    metadata: {
      userId: user.id,
      username: user.username,
      action: 'user_created',
    },
    createdById: createdByUserId,
  })

  return user
}
```

### 2. Notificar cuando se asigna una auditoría

```typescript
// src/core/audits/application/use-cases/assign-auditor.use-case.ts

async execute(auditId: string, auditorId: string, assignedBy: string) {
  const audit = await this.auditRepository.findById(auditId)
  const auditor = await this.userRepository.findById(auditorId)

  // Asignar auditor
  audit.assignAuditor(auditorId)
  await this.auditRepository.update(audit)

  // 🔔 Notificar al auditor
  await this.notificationBroadcast.notifyUser({
    userId: auditorId,
    type: NotificationType.INFO,
    title: 'Nueva auditoría asignada',
    message: `Has sido asignado a la auditoría "${audit.title}"`,
    link: `/audits/${audit.id}`,
    metadata: {
      auditId: audit.id,
      auditTitle: audit.title,
      action: 'auditor_assigned',
    },
    createdById: assignedBy,
  })

  // 🔔 Notificar a gerentes
  await this.notificationBroadcast.notifyManagersAndAuditors({
    title: 'Auditoría asignada',
    message: `${auditor.fullName} ha sido asignado a "${audit.title}"`,
    link: `/audits/${audit.id}`,
    metadata: {
      auditId: audit.id,
      auditorId: auditorId,
      action: 'auditor_assigned',
    },
    createdById: assignedBy,
  })
}
```

### 3. Notificar cuando se completa una auditoría

```typescript
async execute(auditId: string, completedBy: string) {
  const audit = await this.auditRepository.findById(auditId)

  audit.markAsCompleted()
  await this.auditRepository.update(audit)

  // 🔔 Notificar al cliente
  if (audit.clientId) {
    await this.notificationBroadcast.notifyClient({
      userId: audit.clientId,
      type: NotificationType.SUCCESS,
      title: 'Auditoría completada',
      message: `Tu auditoría "${audit.title}" ha sido completada`,
      link: `/audits/${audit.id}`,
      metadata: {
        auditId: audit.id,
        action: 'audit_completed',
      },
      createdById: completedBy,
    })
  }

  // 🔔 Notificar a gerentes
  await this.notificationBroadcast.notifyManagersAndAuditors({
    title: 'Auditoría completada',
    message: `La auditoría "${audit.title}" ha sido completada`,
    link: `/audits/${audit.id}`,
    metadata: {
      auditId: audit.id,
      action: 'audit_completed',
    },
    createdById: completedBy,
  })
}
```

---

## 🧪 Testing {#testing}

### Test Manual con Cliente JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Notificaciones</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Test WebSocket Notifications</h1>
  <div id="status">Desconectado</div>
  <div id="notifications"></div>

  <script>
    // Obtener token de login
    const token = localStorage.getItem('accessToken')

    if (!token) {
      alert('Debes hacer login primero')
    }

    // Conectar
    const socket = io('http://localhost:3000/notifications', {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      document.getElementById('status').textContent = '✅ Conectado'
      document.getElementById('status').style.color = 'green'
    })

    socket.on('notification', (notification) => {
      console.log('📬 Notificación:', notification)

      const div = document.createElement('div')
      div.style.border = '1px solid #ccc'
      div.style.padding = '10px'
      div.style.margin = '10px 0'
      div.innerHTML = `
        <strong>${notification.title}</strong><br>
        ${notification.message}<br>
        <small>${new Date(notification.createdAt).toLocaleString()}</small>
      `

      document.getElementById('notifications').prepend(div)
    })

    socket.on('disconnect', () => {
      document.getElementById('status').textContent = '❌ Desconectado'
      document.getElementById('status').style.color = 'red'
    })
  </script>
</body>
</html>
```

### Test con cURL (Crear notificación)

```bash
# 1. Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.accessToken')

# 2. Crear usuario (esto debe generar notificación)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "names": "Test",
    "lastNames": "User",
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "roleIds": ["role-id-here"]
  }'
```

---

## 📊 Tipos de Notificación

```typescript
enum NotificationType {
  INFO = 'INFO',       // Información general
  SUCCESS = 'SUCCESS', // Acción exitosa
  WARNING = 'WARNING', // Advertencia
  ERROR = 'ERROR',     // Error
}
```

### Uso recomendado por tipo

- **INFO**: Asignaciones, actualizaciones, nuevos registros
- **SUCCESS**: Completaciones, aprobaciones, éxitos
- **WARNING**: Vencimientos próximos, revisiones pendientes
- **ERROR**: Fallos, rechazos, problemas

---

## 🎯 Mejores Prácticas

1. **Siempre incluir metadata** - Facilita el debugging y tracking
2. **Links útiles** - Permitir navegación directa al recurso
3. **Mensajes claros** - Usar lenguaje simple y directo
4. **Metadata estructurada** - Usar objetos con campos consistentes
5. **Manejo de errores** - Catch errores de conexión en el cliente
6. **Reconexión automática** - Configurar Socket.io para reintentar
7. **Testing** - Probar diferentes escenarios antes de producción

---

## 🚀 Próximos Pasos

1. Abrir el cliente HTML de prueba
2. Hacer login en la aplicación
3. Abrir otra pestaña con el dashboard
4. Crear un usuario o auditoría
5. Ver la notificación aparecer en tiempo real

¡El sistema está listo para usar! 🎉
