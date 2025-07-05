# Node.js LTS 버전 사용
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 (캐싱 활용)
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && \
    npm ci --only=development

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 프로덕션 이미지
FROM node:20-alpine

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

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && \
    npm cache clean --force

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 실행 권한 부여
RUN chmod +x ./dist/index.js

# 전역 설치 (선택사항)
RUN npm link

# 기본 명령어
CMD ["node", "dist/index.js"]