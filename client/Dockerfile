FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 5173

# Create .env file from environment variable at runtime
CMD sh -c 'echo "VITE_API_GATEWAY_URL=${VITE_API_GATEWAY_URL:-http://localhost:3001}" > .env && npm run dev -- --host 0.0.0.0'
