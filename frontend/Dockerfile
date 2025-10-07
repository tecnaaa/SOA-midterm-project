FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies và terser
RUN npm install && npm install terser -D

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Stage 2 - Nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]