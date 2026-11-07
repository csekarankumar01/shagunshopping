FROM node:20-alpine AS build
WORKDIR /opt/app
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENV NODE_ENV=production
RUN npm run build 2>/dev/null || true

FROM node:20-alpine
WORKDIR /opt/app
RUN apk add --no-cache vips-ffmpeg
COPY --from=build /opt/app ./
ENV NODE_ENV=production
EXPOSE 1337
CMD ["npm", "run", "start"]
