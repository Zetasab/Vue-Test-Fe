# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci

# Build frontend assets.
COPY . .
RUN npm run build-only

FROM node:22-alpine AS runtime
WORKDIR /app

# Lightweight static server for Railway.
RUN npm install -g serve
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
