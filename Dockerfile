FROM node:18-alpine

WORKDIR /app

# Chrome/Chromium 의존성 설치 (puppeteer-core용)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Puppeteer 환경 변수 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Copy application code
COPY . .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Build for Smithery
RUN npx -y @smithery/cli build -o .smithery/index.cjs

CMD ["node", "dist/index.js"]