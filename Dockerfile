FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install --global pnpm@11.25.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm docs:build

FROM nginx:alpine

COPY --from=builder /app/docs/.vitepress/dist/ /usr/share/nginx/html/xm-knowledge/

EXPOSE 80
