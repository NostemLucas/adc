import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserRepository } from 'src/core/users/infrastructure/user.repository'
import { NotificationResponseDto } from '../application/dto/notification-response.dto'

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(NotificationsGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized')
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from query or handshake
      const token =
        client.handshake.auth?.token || client.handshake.query?.token

      if (!token) {
        throw new UnauthorizedException('No token provided')
      }

      // Verify JWT
      const payload = this.jwtService.verify(token as string)
      const userId = payload.sub

      // Load user with roles
      const user = await this.userRepository.findById(userId)
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid user')
      }

      // Store user in socket data
      client.data.user = user

      // Join rooms based on roles
      if (user.isAdmin) {
        await client.join('admin')
        this.logger.log(`User ${user.username} joined admin room`)
      }

      if (user.isManager || user.isAuditor) {
        await client.join('manager-auditor')
        this.logger.log(`User ${user.username} joined manager-auditor room`)
      }

      if (user.isClient) {
        const clientRoom = `client-${user.id}`
        await client.join(clientRoom)
        this.logger.log(`User ${user.username} joined ${clientRoom} room`)
      }

      // Also join personal room
      await client.join(`user-${user.id}`)

      this.logger.log(
        `Client connected: ${client.id} (User: ${user.username})`,
      )
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user
    this.logger.log(
      `Client disconnected: ${client.id}${user ? ` (User: ${user.username})` : ''}`,
    )
  }

  // ===== EMIT METHODS =====

  emitToAdmins(notification: NotificationResponseDto) {
    this.server.to('admin').emit('notification', notification)
    this.logger.log(`Emitted notification to admin room: ${notification.id}`)
  }

  emitToManagersAndAuditors(notification: NotificationResponseDto) {
    this.server.to('manager-auditor').emit('notification', notification)
    this.logger.log(
      `Emitted notification to manager-auditor room: ${notification.id}`,
    )
  }

  emitToUser(userId: string, notification: NotificationResponseDto) {
    this.server.to(`user-${userId}`).emit('notification', notification)
    this.logger.log(
      `Emitted notification to user ${userId}: ${notification.id}`,
    )
  }

  emitToClient(userId: string, notification: NotificationResponseDto) {
    const clientRoom = `client-${userId}`
    this.server.to(clientRoom).emit('notification', notification)
    this.logger.log(
      `Emitted notification to client room ${clientRoom}: ${notification.id}`,
    )
  }

  // Broadcast to all connected clients
  broadcastAll(notification: NotificationResponseDto) {
    this.server.emit('notification', notification)
    this.logger.log(`Broadcasted notification to all: ${notification.id}`)
  }
}
