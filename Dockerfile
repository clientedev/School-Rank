FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# Build the application (produces dist/index.cjs)
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/script ./script
COPY --from=builder /app/migrations ./migrations
EXPOSE 5000
ENV PORT=5000
USER node
CMD ["node", "./dist/index.cjs"]
