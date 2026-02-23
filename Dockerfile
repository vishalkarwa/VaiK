FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY backend-ts/package*.json ./backend-ts/
WORKDIR /app/backend-ts
RUN npm install

# Copy application code
COPY backend-ts/ ./backend-ts/

# Expose port
EXPOSE 8000

# Run the application
CMD ["npm", "run", "dev"]
