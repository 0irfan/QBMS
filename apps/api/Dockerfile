FROM node:18-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci 2>/dev/null || npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install
# Ensure workspace node_modules exist so runner can merge (drizzle-orm etc.)
RUN (cd apps/api && npm install --no-save) || true
RUN npm run build --workspace=@qbms/database
RUN npm run build --workspace=@qbms/shared
RUN npm run build --workspace=@qbms/api

FROM base AS runner
ENV NODE_ENV=production
RUN apk add --no-cache wget
RUN mkdir -p /app/uploads /app/drizzle && chown -R node:node /app
# Copy builder root node_modules; merge API workspace (dereference symlinks); then add real drizzle-orm+pg so subpath resolves
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./_api_nm
RUN cp -rL ./_api_nm/. ./node_modules/ 2>/dev/null || true; rm -rf ./_api_nm
RUN mkdir -p /tmp/add && cd /tmp/add && echo '{"dependencies":{"drizzle-orm":"^0.29.3","pg":"^8.11.3"}}' > package.json && npm install --no-package-lock && cp -r node_modules/. /app/node_modules/ && rm -rf /tmp/add
RUN chown -R node:node /app
COPY --from=builder --chown=node:node /app/apps/api/dist ./dist
COPY --from=builder --chown=node:node /app/apps/api/scripts ./scripts
COPY --from=builder --chown=node:node /app/packages/database/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/packages/database/package.json ./packages/database/
COPY --from=builder --chown=node:node /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=node:node /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=node:node /app/packages/shared/dist ./packages/shared/dist
USER node
EXPOSE 4000
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
