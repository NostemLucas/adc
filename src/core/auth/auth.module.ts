import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { EmailModule } from '@shared/email'
import { AuthController } from './auth.controller'
import { AuthService } from './services/auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy'
import { UsersModule } from '../users/users.module'
import { SessionRepository } from '../sessions/infrastructure/session.repository'
import { OtpRepository } from './infrastructure/otp.repository'

@Module({
  imports: [
    PassportModule,
    EmailModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    SessionRepository,
    OtpRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
