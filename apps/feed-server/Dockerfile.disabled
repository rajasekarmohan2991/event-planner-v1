# Simple Node Express feed server
FROM node:20-bullseye-slim

WORKDIR /app

COPY package.json ./
RUN npm install --only=production --no-audit --no-fund

COPY server.js ./

EXPOSE 4000
CMD ["npm", "start"]
