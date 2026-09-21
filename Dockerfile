# Estágio 1: Build da aplicação React / Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copia dependências
COPY package*.json ./

# Instala todas as dependências
RUN npm ci

# Variáveis de ambiente injetadas no build do Vite
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# Copia o código do projeto
COPY . .

# Compila a aplicação estática
RUN npm run build

# Estágio 2: Servidor Nginx ultra-leve para produção
FROM nginx:alpine

# Copia a configuração do Nginx para suportar SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados da pasta dist
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
