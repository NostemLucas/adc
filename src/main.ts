import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { LoggerService } from './shared/logger/logger.service'
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter'
import { PrismaExceptionFilter } from './shared/filters/prisma-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default NestJS logger
  })

  // Obtener instancia del LoggerService
  const logger = app.get(LoggerService)

  // Usar nuestro logger custom
  app.useLogger(logger)

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Exception filters globales (el orden importa: más específico primero)
  app.useGlobalFilters(
    new PrismaExceptionFilter(logger),
    new AllExceptionsFilter(logger),
  )

  // Habilitar CORS si es necesario
  app.enableCors()

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Audit API')
    .setDescription('API para sistema de auditorías')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const port = Number(process.env.PORT) || 3000

  // Log de conexión a la base de datos
  logger.database.logConnection(
    'connect',
    process.env.DATABASE_URL?.split('@')[1]?.split('/')[1],
  )

  await app.listen(port)

  // Imprimir banner de inicio
  logger.startup.printStartupBanner(
    {
      appName: 'Audit API',
      version: '1.0.0',
      port,
      nodeEnv: process.env.NODE_ENV || 'development',
      apiPrefix: '/api/docs',
    },
    {
      type: 'PostgreSQL',
      host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0],
      database: process.env.DATABASE_URL?.split('@')[1]?.split('/')[1],
    },
  )

  // Handlers de shutdown graceful
  process.on('SIGINT', () => handleShutdown('SIGINT'))
  process.on('SIGTERM', () => handleShutdown('SIGTERM'))

  function handleShutdown(signal: string): void {
    logger.startup.printShutdown(`Received ${signal}`)
    logger.database.logConnection('disconnect')
    process.exit(0)
  }

  // Handler de errores no capturados
  process.on('unhandledRejection', (reason: Error) => {
    logger.startup.printError(reason, 'Unhandled Rejection')
    logger.exception.logUnhandledException(reason, {
      type: 'unhandledRejection',
    })
  })

  process.on('uncaughtException', (error: Error) => {
    logger.startup.printError(error, 'Uncaught Exception')
    logger.exception.logUnhandledException(error, { type: 'uncaughtException' })
    process.exit(1)
  })
}

bootstrap().catch((error: Error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})
