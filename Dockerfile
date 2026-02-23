# === Base build stage ===
FROM node:18-bullseye-slim AS base

WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./

# Copy source code
COPY ./src ./src

# Install all dependencies (including dev dependencies for building)
# Prefer npm if package-lock.json exists; otherwise fall back to yarn when available.
RUN if [ -f package-lock.json ]; then \
    npm ci; \
    elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
    else \
    npm install; \
    fi

# Compile TypeScript
RUN yarn build


# === Production stage ===
FROM node:18-bullseye-slim AS production

# Install Chrome/Chromium dependencies for Puppeteer on Debian slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer / Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium
ENV DOCKERIZED=true

WORKDIR /app
ENV NODE_ENV=production

# Copy package files
COPY package.json ./
COPY package-lock.json ./

# Install only production dependencies (prefer npm if lockfile present)
RUN if [ -f package-lock.json ]; then \
    npm ci --only=production; \
    elif [ -f yarn.lock ]; then \
    yarn install --production --frozen-lockfile; \
    else \
    npm install --only=production; \
    fi

# Copy compiled output from base stage
COPY --from=base /app/dist ./dist

# Copy ecosystem config for PM2 if using PM2
COPY ecosystem.config.json ./

# Expose port (adjust if needed)
EXPOSE 3000

# Run the application
CMD ["node", "./dist/index.js"]
