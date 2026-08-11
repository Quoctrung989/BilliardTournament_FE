# ⚠️  KHÔNG DÙNG TRONG PRODUCTION — giữ làm phương án dự phòng.
#
# Từ 08/08/2026 frontend deploy trên Cloudflare Pages: Pages tự build từ nhánh
# `prod`, EC2 không tham gia. Service `frontend` đã xoá khỏi docker-compose.yml,
# job deploy đã gỡ khỏi workflow, và container này chưa từng được tạo trên server.
#
# Lý do chuyển: build FE bằng npm ngay trên EC2 là phần ngốn tài nguyên nhất của
# máy (lúc đó chỉ có 1.9 GiB RAM).
#
# Chỉ dùng lại nếu cần dựng frontend trên EC2 khi Cloudflare có sự cố. Khi đó nhớ
# truyền REACT_APP_API_URL đúng và trả port 80 lại cho Caddy.

# ---- Stage 1: build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# CRA nhúng biến REACT_APP_* vào bundle ngay lúc build, không phải lúc chạy
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# ---- Stage 2: serve ----
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
