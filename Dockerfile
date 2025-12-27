# Giai đoạn 1: Cài đặt dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Cài đặt gói cần thiết cho Alpine
RUN apk add --no-cache libc6-compat

# Sao chép các tệp cấu hình và cài đặt dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Giai đoạn 2: Build ứng dụng
FROM node:22-alpine AS builder
WORKDIR /app

# Sao chép node_modules từ giai đoạn deps
COPY --from=deps /app/node_modules ./node_modules

# Sao chép toàn bộ mã nguồn
COPY . .

# Build ứng dụng Next.js
RUN npm run build

# Giai đoạn 3: Tạo image production
FROM node:22-alpine AS production
WORKDIR /app

# Sao chép các tệp cần thiết từ giai đoạn builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Thiết lập biến môi trường
ENV NODE_ENV=production

# Mở cổng ứng dụng (thường là 3000 cho Next.js)
EXPOSE 3000

# Lệnh khởi động ứng dụng
CMD ["node", "server.js"]