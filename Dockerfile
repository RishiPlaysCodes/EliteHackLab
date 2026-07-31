FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy application
COPY . .

# Setup database
RUN node db/setup.js

# Create uploads directory
RUN mkdir -p public/uploads

# Expose port
EXPOSE 3000

# Run
CMD ["node", "src/server.js"]
