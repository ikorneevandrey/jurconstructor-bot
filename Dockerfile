# Используем официальный образ Node.js с Alpine для минимального размера :cite[1]:cite[10]
FROM node:18-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только файлы зависимостей сначала для лучшего кэширования :cite[5]:cite[10]
COPY package*.json ./

# Стадия для установки зависимостей
FROM base AS deps
RUN npm ci --only=production

# Стадия разработки (если нужно)
FROM base AS development
RUN npm ci

# Финальная стадия :cite[1]:cite[10]
FROM base AS production

# Копируем только production зависимости
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Создаем непривилегированного пользователя для безопасности :cite[5]:cite[10]
RUN addgroup -g 1001 -S nodejs && \
    adduser -S telegrambot -u 1001

# Меняем владельца файлов
RUN chown -R telegrambot:nodejs /app
USER telegrambot

# Указываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]