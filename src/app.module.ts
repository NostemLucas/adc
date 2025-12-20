import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './shared/database/prisma.module'
import { LoggerModule } from './shared/logger/logger.module'
import { AuthModule } from './core/auth/auth.module'
import { UsersModule } from './core/users/users.module'
import { RolesModule } from './core/roles/roles.module'
import { SessionsModule } from './core/sessions/sessions.module'
import { NotificationsModule } from './core/notifications/notifications.module'
import { JwtAuthGuard } from './core/auth/guards/jwt-auth.guard'
import { RolesGuard } from './core/auth/guards/roles.guard'
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SessionsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
