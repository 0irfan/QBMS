FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install --legacy-peer-deps
# Ensure workspace node_modules exist so runner can merge (drizzle-orm etc.)
RUN (cd apps/api && npm install --no-save --legacy-peer-deps) || true
RUN npm run build --workspace=@qbms/database
RUN npm run build --workspace=@qbms/shared
RUN npm run build --workspace=@qbms/api

FROM base AS runner
ENV NODE_ENV=production
RUN apk add --no-cache wget
RUN mkdir -p /app/uploads /app/drizzle && chown -R node:node /app
# Copy all node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./dist
COPY --from=builder --chown=node:node /app/apps/api/scripts ./scripts
COPY --from=builder --chown=node:node /app/packages/database/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/packages/database/package.json ./packages/database/
COPY --from=builder --chown=node:node /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=node:node /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
RUN chown -R node:node /app
USER node
EXPOSE 4000
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
