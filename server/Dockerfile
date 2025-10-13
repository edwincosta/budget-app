FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Install ts-node for development
RUN npm install -g ts-node typescript

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "run", "dev"]
