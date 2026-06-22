# docker build -t <your username>/thing-server .
# docker run -p 1234:3000 -d <your username>/thing-server

# --- Stage 1: Dependencies ---
FROM node:24-alpine AS builder
WORKDIR /usr/src/app

# Copy package files first for better caching, then install prod dependencies.
# A wildcard ensures both package.json AND package-lock.json are copied.
COPY package*.json ./
RUN npm ci --omit=dev

# --- Stage 2: Production ---
FROM node:24-alpine AS prod
WORKDIR /usr/src/app

# Upgrade OS packages to fix vulnerabilities, and drop npm/corepack/yarn
# (not needed at runtime since we run node directly).
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/* && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn*

# Copy production dependencies from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Bundle app source (data/ is the default things.json; can be overridden with a volume)
COPY package*.json ./
COPY src ./src
COPY data ./data

# Security: run as non-root
USER node

EXPOSE 3000

CMD [ "node", "src/index.js" ]
