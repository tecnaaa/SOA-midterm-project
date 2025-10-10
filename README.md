# Hệ thống Thanh toán Học phí Trực tuyến

## Giới thiệu

Hệ thống cho phép sinh viên thanh toán học phí trực tuyến thông qua tài khoản ngân hàng, với các tính năng:
- Tra cứu học phí theo MSSV
- Xác thực người dùng qua OTP
- Thanh toán học phí an toàn
- Gửi email xác nhận giao dịch

## Kiến trúc

### Frontend
- React + Vite
- Material-UI cho giao diện
- Axios cho API calls
- JWT cho authentication

### Backend
- FastAPI (Python)
- MongoDB cho database
- JWT cho authentication
- SMTP cho gửi email

### Infrastructure
- Docker và Docker Compose
- Nginx cho reverse proxy và SSL
- PM2 cho process management
- GitHub Actions cho CI/CD

## Cài đặt

### Yêu cầu
- Docker và Docker Compose
- Node.js 18+
- Python 3.11+
- Git

### Cài đặt cho Development

1. Clone repository:
```bash
git clone [repository-url]
cd tuition-payment
```

2. Chạy script cài đặt:
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. Khởi động môi trường development:
```bash
docker-compose -f docker-compose.dev.yml up
```

### Cài đặt cho Production

1. Cập nhật file .env với thông tin môi trường production

2. Build và chạy containers:
```bash
docker-compose up -d
```

## API Documentation

API documentation có sẵn tại:
- Swagger UI: https://yourdomain.com/docs
- ReDoc: https://yourdomain.com/redoc

## Development

### Cấu trúc thư mục
```
.
├── frontend/               # React frontend
├── services/              # Backend services
│   └── user-service/      # FastAPI backend
├── database/              # MongoDB initialization
├── nginx/                 # Nginx configuration
├── scripts/              # Utility scripts
└── docker-compose.yml    # Docker configuration
```

### Commands

#### Development
- `npm run dev` - Chạy frontend development server
- `uvicorn app:app --reload` - Chạy backend development server
- `pytest` - Chạy tests

#### Production
- `./scripts/deploy.sh` - Deploy to production
- `./scripts/backup.sh` - Backup database
- `./scripts/monitor.sh` - Monitor services

## Testing

### Backend Tests
```bash
cd services/user-service
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Security

- JWT authentication
- Rate limiting
- HTTPS/SSL
- Security headers
- OTP verification
- Input validation

## Monitoring

- Health checks
- Resource monitoring
- Error logging
- Transaction logging
- Automatic backups

## Contributing

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết chi tiết về quy trình đóng góp.

## License

[MIT License](LICENSE)

## Support

- Email: [email]
- Issues: GitHub Issues