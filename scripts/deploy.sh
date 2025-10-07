#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_DIR="/app"
BACKUP_DIR="/app/backups"
ENV_FILE=".env"
LOG_FILE="/app/logs/deploy.log"

# Ensure log directory exists
mkdir -p $(dirname $LOG_FILE)

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log "${RED}.env file not found. Please create it first.${NC}"
        exit 1
    fi
}

create_backup() {
    log "Creating backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p $BACKUP_DIR
    
    # Backup MongoDB data
    docker-compose exec -T mongodb mongodump --out /data/db/backup
    
    # Create timestamped backup archive
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf $BACKUP_FILE $APP_DIR/data/mongodb/backup
    
    if [ $? -eq 0 ]; then
        log "${GREEN}Backup created successfully: $BACKUP_FILE${NC}"
    else
        log "${RED}Backup failed${NC}"
        exit 1
    fi
}

pull_latest_changes() {
    log "Pulling latest changes from repository..."
    
    git fetch origin
    git reset --hard origin/main
    
    if [ $? -eq 0 ]; then
        log "${GREEN}Successfully pulled latest changes${NC}"
    else
        log "${RED}Failed to pull latest changes${NC}"
        exit 1
    fi
}

build_and_deploy() {
    log "Building and deploying services..."
    
    # Build images
    docker-compose -f docker-compose.yml build --no-cache
    
    if [ $? -ne 0 ]; then
        log "${RED}Build failed${NC}"
        exit 1
    fi
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log "${GREEN}Services deployed successfully${NC}"
    else
        log "${RED}Deployment failed${NC}"
        exit 1
    fi
}

check_services_health() {
    log "Checking services health..."
    
    # Wait for services to be ready
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log "${GREEN}Backend service is healthy${NC}"
    else
        log "${RED}Backend service is not responding${NC}"
        exit 1
    fi
    
    # Check frontend
    if curl -f http://localhost > /dev/null 2>&1; then
        log "${GREEN}Frontend service is healthy${NC}"
    else
        log "${RED}Frontend service is not responding${NC}"
        exit 1
    fi
    
    # Check MongoDB
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log "${GREEN}MongoDB is healthy${NC}"
    else
        log "${RED}MongoDB is not responding${NC}"
        exit 1
    fi
}

cleanup() {
    log "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backups (keeping last 5)
    cd $BACKUP_DIR && ls -t | tail -n +6 | xargs -r rm --
    
    log "${GREEN}Cleanup completed${NC}"
}

# Main deployment process
main() {
    log "Starting deployment process..."
    
    check_prerequisites
    create_backup
    pull_latest_changes
    build_and_deploy
    check_services_health
    cleanup
    
    log "${GREEN}Deployment completed successfully${NC}"
}

# Execute main function
main "$@"