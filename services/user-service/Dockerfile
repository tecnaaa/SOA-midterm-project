FROM python:3.11-slim

WORKDIR /app

# Cài đặt các dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code và đảm bảo middleware là một package
COPY . .
RUN touch middleware/__init__.py

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Khởi chạy ứng dụng
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]