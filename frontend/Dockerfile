# Сборка
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# Раздача статики через nginx
FROM nginx:alpine
# Копируем содержимое папки сборки (без вложенной папки), чтобы index.html был в корне root
COPY --from=build /app/dist/oper-review-frontend/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
