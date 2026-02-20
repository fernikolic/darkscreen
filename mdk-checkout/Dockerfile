FROM node:20-slim AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Run
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy @moneydevkit native Lightning bindings (serverExternalPackages not included in standalone)
COPY --from=deps /app/node_modules/@moneydevkit ./node_modules/@moneydevkit

EXPOSE 8080
CMD ["node", "server.js"]
