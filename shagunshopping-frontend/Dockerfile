# ================================
# Multi-stage Dockerfile: Frontend SPA
# ================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Pass build-time environment variables
ARG VITE_API_URL
ARG VITE_CMS_URL
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_CMS_URL=${VITE_CMS_URL}
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}

RUN npm run build

# ================================
# Production Nginx Server
# ================================
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

