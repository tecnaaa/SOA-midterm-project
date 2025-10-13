#!/bin/bash

# Cấu hình
BACKUP_DIR="/app/backups"
MONGO_HOST="mongodb"
MONGO_PORT="27017"
MONGO_DB="ibanking_tuition"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${DATE}"
LOG_FILE="/app/logs/backup.log"

# Tạo thư mục backup nếu chưa tồn tại
mkdir -p $BACKUP_DIR

# Function để ghi log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
    echo "$1"
}

# Kiểm tra kết nối MongoDB
log "Checking MongoDB connection..."
if ! mongosh --quiet --host $MONGO_HOST --port $MONGO_PORT --eval "db.adminCommand('ping')" > /dev/null; then
    log "Error: Cannot connect to MongoDB"
    exit 1
fi

# Backup database
log "Starting backup of $MONGO_DB"
if mongodump --host $MONGO_HOST --port $MONGO_PORT --db $MONGO_DB --out "${BACKUP_DIR}/${BACKUP_NAME}"; then
    log "Database backup completed successfully"
    
    # Nén file backup
    cd $BACKUP_DIR
    tar -czf "${BACKUP_NAME}.tar.gz" $BACKUP_NAME
    rm -rf $BACKUP_NAME
    
    # Xóa các backup cũ hơn 30 ngày
    find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete
    
    # Tính dung lượng backup
    BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    log "Backup size: $BACKUP_SIZE"
    
    # Kiểm tra tính toàn vẹn của file backup
    if tar -tzf "${BACKUP_NAME}.tar.gz" > /dev/null; then
        log "Backup integrity check passed"
    else
        log "Error: Backup integrity check failed"
        exit 1
    fi
else
    log "Error: Database backup failed"
    exit 1
fi

# Thống kê
TOTAL_BACKUPS=$(ls -1 $BACKUP_DIR/backup_*.tar.gz | wc -l)
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)

log "Backup statistics:"
log "- Total backups: $TOTAL_BACKUPS"
log "- Total size: $TOTAL_SIZE"
log "Backup process completed"