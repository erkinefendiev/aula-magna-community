# Aula Magna Community Edition — one simple, robust image.
# At startup it creates/updates the SQLite schema in the mounted /data volume,
# ensures an admin account, then serves the app. Values "it just works" over
# image size (fine for a single self-hosted school).

FROM node:20-slim

# Prisma's query engine needs OpenSSL.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better layer caching).
COPY package.json ./
RUN npm install

# Copy the app + generate the Prisma client + build.
COPY . .
RUN npx prisma generate && npm run build

# The school's single database file lives here — mount a volume to keep it.
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/community.db"
VOLUME /data
EXPOSE 3080

# On boot: create/upgrade the SQLite schema, ensure the admin exists, then serve.
CMD ["sh", "-c", "mkdir -p /data && npx prisma db push --skip-generate && npx tsx prisma/seed.ts && npm run start"]
