FROM node:20-alpine

WORKDIR /app

# OpenSSL — exigido pelo Prisma em Alpine
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# prisma fica em devDependencies; precisa estar presente para generate + migrate deploy
RUN npm ci && npx prisma generate

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Migrations + seed de teste + API
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/seed-admin.js && node src/server.js"]
