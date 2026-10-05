# Multi-stage Dockerfile for NTUNHS Course Master
# Stage 1: Build static assets
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Run type check and build
RUN npm run lint && npm run build

# Stage 2: Serve using lightweight web server
FROM node:20-alpine AS runner
WORKDIR /app

# Install preview server or serve
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose default port
EXPOSE 3000

# Start server
CMD ["serve", "-s", "dist", "-l", "3000"]
