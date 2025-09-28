# The first stage
# Build React static files
FROM node:20-alpine AS build

ARG BUILD_DATE
ENV BUILD_DATE=$BUILD_DATE

WORKDIR /app/frontend
COPY ./frontend/package.json ./
COPY ./frontend/package-lock.json ./
COPY ./frontend/.env.production ./frontend/.env.production
RUN npm install --silent
COPY ./frontend/.env.production .env.production
COPY ./frontend/ ./
RUN cat .env.production
RUN npm run build

# The second stage
# Copy React static files and start nginx
FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
