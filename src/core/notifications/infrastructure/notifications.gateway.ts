import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type {
  IUserRepository,
  IInternalProfileRepository,
  IExternalProfileRepository,
} from 'src/core/users/domain'
import {
  USER_REPOSITORY,
  INTERNAL_PROFILE_REPOSITORY,
  EXTERNAL_PROFILE_REPOSITORY,
} from 'src/core/users/infrastructure/di'
import {
  InternalUser,
  ExternalUser,
  SystemRole,
} from 'src/core/users/domain'
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
  server!: Server

  private readonly logger = new Logger(NotificationsGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(INTERNAL_PROFILE_REPOSITORY)
    private readonly internalProfileRepository: IInternalProfileRepository,
    @Inject(EXTERNAL_PROFILE_REPOSITORY)
    private readonly externalProfileRepository: IExternalProfileRepository,
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

      // Load user
      const user = await this.userRepository.findById(userId)
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid user')
      }

      // Load user with profile
      let fullUser: InternalUser | ExternalUser
      if (user.isInternal) {
        const profile = await this.internalProfileRepository.findByUserId(user.id)
        if (!profile) {
          throw new UnauthorizedException('Profile not found')
        }
        fullUser = InternalUser.create(user, profile)
      } else {
        const profile = await this.externalProfileRepository.findByUserId(user.id)
        if (!profile) {
          throw new UnauthorizedException('Profile not found')
        }
        fullUser = ExternalUser.create(user, profile)
      }

      // Store user in socket data
      client.data.user = user
      client.data.fullUser = fullUser

      // Join rooms based on user type and roles
      if (fullUser instanceof InternalUser) {
        // INTERNAL users - join rooms based on roles
        if (fullUser.hasRole(SystemRole.ADMINISTRADOR)) {
          await client.join('admin')
          this.logger.log(`User ${fullUser.username} joined admin room`)
        }

        if (
          fullUser.hasRole(SystemRole.GERENTE) ||
          fullUser.hasRole(SystemRole.AUDITOR)
        ) {
          await client.join('manager-auditor')
          this.logger.log(
            `User ${fullUser.username} joined manager-auditor room`,
          )
        }
      } else {
        // EXTERNAL users - join client room
        const clientRoom = `client-${fullUser.id}`
        await client.join(clientRoom)
        this.logger.log(`User ${fullUser.username} joined ${clientRoom} room`)
      }

      // Also join personal room
      await client.join(`user-${user.id}`)

      this.logger.log(`Client connected: ${client.id} (User: ${user.username})`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Connection error: ${message}`)
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
