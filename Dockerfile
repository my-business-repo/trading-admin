FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package.json package-lock.json ./

# Install dependencies (without dev dependencies)
RUN npm install --omit=dev

# Copy the rest of the app files, including the prisma folder
COPY . .

# Generate Prisma client
RUN npx prisma migrate deploy
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# Start the Next.js app
CMD ["npm", "start"]

# Expose port 3000 for Next.js
EXPOSE 3000