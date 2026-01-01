import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../data/logs');

// Создаем директорию для логов
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: { 
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      },
      level: 'info'
    },
    {
      target: 'pino/file',
      options: { 
        destination: path.join(logDir, 'bot.log'),
        mkdir: true 
      },
      level: 'info'
    }
  ]
});

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  }
}, transport);

// Специальные методы для бизнес-логики
export const botLogger = {
  info: (message, meta = {}) => logger.info({ ...meta, module: 'bot' }, message),
  error: (message, error = null, meta = {}) => {
    if (error instanceof Error) {
      logger.error({ 
        ...meta, 
        module: 'bot',
        error: error.message,
        stack: error.stack 
      }, message);
    } else {
      logger.error({ ...meta, module: 'bot' }, message);
    }
  },
  userEvent: (userId, event, data = {}) => {
    logger.info({ 
      module: 'user',
      userId,
      event,
      ...data 
    }, `User ${userId}: ${event}`);
  },
  middlewareError: (middleware, error, ctx) => {
    logger.error({
      module: 'middleware',
      middleware,
      userId: ctx.from?.id,
      updateType: ctx.updateType,
      error: error.message
    }, `Middleware ${middleware} error`);
  }
};

export default botLogger;