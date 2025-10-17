FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (cached if package.json unchanged)
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Install Smithery CLI and build
RUN npm install -g @smithery/cli && \
    smithery build -o .smithery/index.cjs

CMD ["node", "dist/index.js"]