FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Install Smithery dependencies and build
RUN npm install @smithery/sdk chalk && \
    npx -y @smithery/cli build -o .smithery/index.cjs

CMD ["node", "dist/index.js"]