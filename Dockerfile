FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
COPY packages ./packages
COPY apps/website/package.json ./apps/website/package.json
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages ./packages
COPY --from=build --chown=node:node /app/apps/website/.next ./apps/website/.next
COPY --from=build --chown=node:node /app/apps/website/public ./apps/website/public
COPY --from=build --chown=node:node /app/apps/website/next.config.mjs ./apps/website/next.config.mjs
USER node
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "apps/website", "--hostname", "0.0.0.0"]
