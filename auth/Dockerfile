FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# will add later --omit=dev for prod env
RUN npm install

COPY src ./src
COPY tsconfig.json ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
