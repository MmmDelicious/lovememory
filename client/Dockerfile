FROM node:18-alpine

WORKDIR /app

# Копируем package*.json
COPY package*.json package-lock.json* ./

# Устанавливаем зависимости с обходом конфликтов peer dependencies
RUN npm install --legacy-peer-deps

# Копируем исходный код
COPY . .

# Экспонируем порт
EXPOSE 5173

# Запускаем dev сервер
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
