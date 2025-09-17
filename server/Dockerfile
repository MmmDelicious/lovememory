FROM node:18-alpine

WORKDIR /app

# Копируем package*.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Создаем необходимые директории
RUN mkdir -p logs uploads models

# Экспонируем порт
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "run", "dev"]
