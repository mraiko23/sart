FROM ghcr.io/puppeteer/puppeteer:21.11.0
USER root
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
