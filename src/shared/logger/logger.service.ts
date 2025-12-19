import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common'
import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { Request, Response } from 'express'

interface LogContext {
  userId?: string
  userEmail?: string
  ip?: string
  userAgent?: string
  os?: string
  browser?: string
  device?: string
  method?: string
  url?: string
  statusCode?: number
  responseTime?: number
  error?: any
  errorDetails?: any
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`

        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata, null, 2)}`
        }

        return msg
      })
    )

    // Transport para errores
    const errorTransport = new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })

    // Transport para requests HTTP
    const httpTransport = new DailyRotateFile({
      filename: 'logs/http-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })

    // Transport para logs combinados
    const combinedTransport = new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })

    // Transport para consola (desarrollo)
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          let msg = `${timestamp} ${level}: ${message}`

          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`
          }

          return msg
        })
      ),
    })

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [
        errorTransport,
        httpTransport,
        combinedTransport,
        consoleTransport,
      ],
    })
  }

  /**
   * Log general
   */
  log(message: string, context?: LogContext) {
    this.logger.info(message, context)
  }

  /**
   * Log de error
   */
  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { ...context, trace })
  }

  /**
   * Log de advertencia
   */
  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context)
  }

  /**
   * Log de debug
   */
  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context)
  }

  /**
   * Log de verbose
   */
  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context)
  }

  /**
   * Log de request HTTP
   */
  logHttpRequest(req: Request, context?: Partial<LogContext>) {
    const userAgent = req.headers['user-agent'] || 'Unknown'
    const { os, browser, device } = this.parseUserAgent(userAgent)

    this.logger.info('Incoming Request', {
      method: req.method,
      url: req.url,
      ip: this.getClientIp(req),
      userAgent,
      os,
      browser,
      device,
      body: this.sanitizeBody(req.body),
      query: req.query,
      params: req.params,
      ...context,
    })
  }

  /**
   * Log de response HTTP
   */
  logHttpResponse(
    req: Request,
    res: Response,
    responseTime: number,
    context?: Partial<LogContext>
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown'
    const { os, browser, device } = this.parseUserAgent(userAgent)

    this.logger.info('Outgoing Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: this.getClientIp(req),
      userAgent,
      os,
      browser,
      device,
      ...context,
    })
  }

  /**
   * Log de excepciones
   */
  logException(error: Error, context?: LogContext) {
    this.logger.error('Exception Thrown', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...context,
    })
  }

  /**
   * Log de errores de base de datos
   */
  logDatabaseError(error: any, operation: string, context?: LogContext) {
    this.logger.error('Database Error', {
      operation,
      errorCode: error.code,
      errorMessage: error.message,
      meta: error.meta,
      ...context,
    })
  }

  /**
   * Parsear User-Agent para extraer OS, browser y device
   */
  private parseUserAgent(userAgent: string): {
    os: string
    browser: string
    device: string
  } {
    let os = 'Unknown'
    let browser = 'Unknown'
    let device = 'Desktop'

    // Detectar OS
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac OS')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad'))
      os = 'iOS'

    // Detectar Browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
    else if (userAgent.includes('Edg')) browser = 'Edge'
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera'

    // Detectar Device
    if (
      userAgent.includes('Mobile') ||
      userAgent.includes('Android') ||
      userAgent.includes('iPhone')
    ) {
      device = 'Mobile'
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet'
    }

    return { os, browser, device }
  }

  /**
   * Obtener IP real del cliente
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    const ip = forwarded
      ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
      : req.socket.remoteAddress

    return ip || 'Unknown'
  }

  /**
   * Sanitizar body para no exponer información sensible
   */
  private sanitizeBody(body: any): any {
    if (!body) return body

    const sanitized = { ...body }
    const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken']

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***'
      }
    })

    return sanitized
  }
}
