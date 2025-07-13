# Dockerfile for a Next.js application

# Stage 1: Build the application
# Use a Node.js image that includes build tools
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set build-time environment variables (if any are needed during the build process)
# For example: ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# These should be passed with --build-arg during `docker build`

# Build the Next.js application for production
RUN npm run build

# Stage 2: Production image
# Use a smaller, more secure base image for the final container
FROM node:18-alpine

WORKDIR /app

# Copy only the necessary files from the builder stage
# This includes the .next directory (the build output) and node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
# The default command for a production Next.js app is `npm start`
CMD ["npm", "start"]
