# Hướng dẫn Đóng góp

## Quy trình Đóng góp

1. Fork dự án
2. Tạo branch cho tính năng của bạn (`git checkout -b feature/AmazingFeature`)
3. Commit các thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## Chuẩn bị Môi trường Phát triển

### Yêu cầu
- Docker và Docker Compose
- Node.js 18+
- Python 3.11+
- Git

### Cài đặt
1. Clone dự án:
```bash
git clone [url-repository]
cd SOA-midterm-project
```

2. Cài đặt dependencies cho frontend:
```bash
cd frontend
npm install
```

3. Cài đặt dependencies cho backend:
```bash
cd services/user-service
pip install -r requirements.txt
```

4. Khởi động môi trường development:
```bash
docker-compose -f docker-compose.dev.yml up
```

## Quy ước Code

### Frontend (React)
- Sử dụng ESLint với cấu hình có sẵn
- Sử dụng Prettier cho format code
- Viết test cho components mới
- Sử dụng TypeScript cho code mới

### Backend (FastAPI)
- Tuân thủ PEP 8
- Viết docstring cho tất cả các functions/classes
- Sử dụng type hints
- Viết test cho các endpoints mới

## Quy trình Review Code

1. Mỗi PR cần có:
   - Mô tả chi tiết thay đổi
   - Link đến issue liên quan (nếu có)
   - Screenshots (nếu có UI changes)
   - Kết quả test

2. Code review checklist:
   - Code có tuân thủ style guide?
   - Có test coverage đầy đủ?
   - Có xử lý error cases?
   - Performance có ổn không?

## Báo cáo Lỗi

Khi báo cáo lỗi, vui lòng cung cấp:
- Mô tả chi tiết lỗi
- Các bước tái hiện
- Expected vs Actual behavior
- Screenshots nếu có
- Môi trường (OS, browser, versions)

## Liên hệ

Nếu có thắc mắc, vui lòng liên hệ:
- Email: [email]
- Discord: [discord-channel]