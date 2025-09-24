# Stage 1: Build React static files
FROM node:20-alpine AS build

WORKDIR /app/frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install --silent
COPY ./frontend/ ./
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY ./docker/nginx/development /etc/nginx/conf.d
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
