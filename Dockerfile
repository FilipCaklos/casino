# Use official Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package.json
COPY backend/package.json ./backend/package.json

# Install dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy all files
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./backend/public/

# Expose port
EXPOSE 5000

# Start server
WORKDIR /app/backend
CMD ["npm", "start"]
