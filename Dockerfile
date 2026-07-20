# Dev-oriented image for the Next.js app.
# Postgres runs as a separate service (see docker-compose.yml).
FROM node:20-alpine

# Prisma needs OpenSSL at runtime.
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source. In compose we also bind-mount ./src, ./prisma
# and ./public so edits on the host are picked up live.
COPY . .

# Generate the Prisma client against the schema.
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
