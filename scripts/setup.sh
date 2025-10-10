#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Starting project setup...${NC}"

# Kiểm tra các dependencies cần thiết
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        exit 1
    fi
}

check_dependency "docker"
check_dependency "docker-compose"
check_dependency "node"
check_dependency "python3"
check_dependency "pip"

# Tạo .env file nếu chưa tồn tại
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
MONGO_DATABASE=ibanking_tuition
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NODE_ENV=development
EOL
fi

# Tạo thư mục cần thiết
mkdir -p logs backups

# Cài đặt dependencies cho frontend
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install frontend dependencies${NC}"
    exit 1
fi

# Build frontend
echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build frontend${NC}"
    exit 1
fi

# Cài đặt dependencies cho backend
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd ../services/user-service
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install backend dependencies${NC}"
    exit 1
fi

# Tạo SSL certificates cho development
echo -e "${YELLOW}Generating SSL certificates...${NC}"
mkdir -p ../nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ../nginx/ssl/key.pem \
    -out ../nginx/ssl/cert.pem \
    -subj "/C=VN/ST=HCM/L=HCM/O=TDTU/CN=localhost"

# Phân quyền cho các script
cd ../../scripts
chmod +x *.sh

# Build và start containers
echo -e "${YELLOW}Starting Docker containers...${NC}"
cd ..
docker-compose -f docker-compose.dev.yml up -d --build

# Kiểm tra health của các services
echo -e "${YELLOW}Checking services health...${NC}"
sleep 10  # Đợi services khởi động

# Kiểm tra backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend is healthy${NC}"
else
    echo -e "${RED}Backend health check failed${NC}"
fi

# Kiểm tra frontend
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}Frontend is healthy${NC}"
else
    echo -e "${RED}Frontend health check failed${NC}"
fi

# Khởi tạo git hooks
echo "Setting up git hooks..."
cp .pre-commit-config.yaml .git/hooks/
pre-commit install

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "You can now access:
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc"