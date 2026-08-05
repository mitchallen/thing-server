# docker build -t <your username>/thing-server .
# docker run -p 1234:3000 -d <your username>/thing-server

# --- Stage 1: Build ---
FROM node:24-alpine AS builder
WORKDIR /usr/src/app

# Copy package files first for better caching, then install ALL dependencies
# (devDependencies included — TypeScript is needed to compile).
# A wildcard ensures both package.json AND package-lock.json are copied.
COPY package*.json ./
RUN npm ci

# Copy sources and compile src/*.ts -> dist/, copying the *.yaml alongside
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Stage 2: Production ---
FROM node:24-alpine AS prod
WORKDIR /usr/src/app

# Upgrade OS packages to fix vulnerabilities.
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Install production dependencies only, then drop npm/corepack/yarn
# (not needed at runtime since we run node directly).
COPY package*.json ./
RUN npm ci --omit=dev && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn*

# Copy the compiled app from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Bundle app data (data/ is the default things.json; can be overridden with a volume)
COPY data ./data

# Security: run as non-root
USER node

EXPOSE 3000

CMD [ "node", "dist/index.js" ]
