# --- Etape 1 : build du front ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Etape 2 : service statique + proxy via nginx ---
FROM nginx:alpine
# Le template est traite par envsubst au demarrage (${OLLAMA_URL}).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV OLLAMA_URL=http://host.docker.internal:11434
EXPOSE 80
