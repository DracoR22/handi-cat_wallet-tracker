# Use an official Node.js runtime as a parent image
FROM node:20-slim AS base

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json .
COPY pnpm-lock.yaml .

# Install pnpm and TypeScript globally
RUN npm install -g pnpm

# Install project dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN tsc

# Expose the application port
EXPOSE 3000

# Start the application
CMD [ "node", "dist/src/main.js" ]
