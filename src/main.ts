import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { LoggerService } from './shared/logger/logger.service'
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter'
import { PrismaExceptionFilter } from './shared/filters/prisma-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Obtener instancia del LoggerService
  const logger = app.get(LoggerService)

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

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  const appUrl = await app.getUrl()
  logger.log(`Application is running on: ${appUrl}`)
  logger.log(`Swagger documentation available at: ${appUrl}/api/docs`)
}
bootstrap()
