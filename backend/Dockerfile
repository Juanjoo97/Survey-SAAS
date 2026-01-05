# Utilizar una imagen base oficial de Node.js
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de package.json y package-lock.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar todo el código fuente del backend
COPY . .

# Construir el proyecto TypeScript
RUN npm run build

# Exponer el puerto (Render usa variable PORT)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "start"]
