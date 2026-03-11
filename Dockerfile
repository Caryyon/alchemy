FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY landing /usr/share/nginx/html/landing
COPY nginx-landing.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
