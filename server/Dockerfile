FROM node:20.18.1-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Create node_modules directory
RUN mkdir -p /app/node_modules && chown -R node:node /app

# Invalidate cache when dependencies change
ARG CACHEBUST=2

COPY package*.json ./

# Install dependencies as node user
USER node
RUN npm ci

# Install ts-node for development
USER root
RUN npm install -g ts-node typescript

USER node
COPY --chown=node:node . .

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev:watch"]
