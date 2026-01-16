# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Stage 2: Setup Backend & Serve
FROM node:22-alpine
WORKDIR /app

# Copy Backend
COPY backend/package*.json ./
RUN npm install --production

COPY backend .

# Copy Built Frontend to public/dist folder
# (We need to configure Fastify to serve this later, or use Nginx. 
# For a single container, let's assume Fastify serves static files or we use a separate simple server.
# Actually, the user asked for a "complete working project". 
# The simplest "production" way in one container is backend serving frontend static files.)
COPY --from=frontend-builder /app/dist ./public

# Config
ENV PORT=3000
ENV SMTP_PORT=2525
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3000 2525

CMD ["node", "src/index.js"]
