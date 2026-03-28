FROM node:22-alpine

WORKDIR /app

# Dépendances d'abord (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Sources
COPY . .

# Générer le Prisma Client
RUN npx prisma generate

# Dossier uploads persisté via volume
RUN mkdir -p uploads

EXPOSE 3001

ENTRYPOINT ["sh", "entrypoint.sh"]
