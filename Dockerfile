FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install --global pnpm@11.25.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN NODE_OPTIONS=--max-old-space-size=1536 pnpm docs:build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/docs/.vitepress/dist/ /usr/share/nginx/html/

EXPOSE 80
