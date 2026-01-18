# Dockerfile para desenvolvimento
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos
COPY . .

# Expor a porta do Vite
EXPOSE 8080

# Comando para desenvolvimento (com hot reload)
CMD ["npm", "run", "dev", "--", "--host"]

