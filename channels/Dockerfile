FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY discord-relay-bot.js ./
CMD ["node", "discord-relay-bot.js"]
