#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
LOG_DIR="/app/logs"
MONITOR_LOG="$LOG_DIR/monitoring.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_DISK=90

# Ensure log directory exists
mkdir -p $LOG_DIR

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $MONITOR_LOG
}

check_container_status() {
    log "Checking container status..."
    
    docker ps --format "{{.Names}}: {{.Status}}" | while read -r container; do
        if [[ $container == *"Up"* ]]; then
            log "${GREEN}✓ $container${NC}"
        else
            log "${RED}✗ $container${NC}"
        fi
    done
}

check_resource_usage() {
    log "Checking resource usage..."
    
    # CPU Usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
    if [ $CPU_USAGE -gt $ALERT_THRESHOLD_CPU ]; then
        log "${RED}High CPU usage: ${CPU_USAGE}%${NC}"
    else
        log "${GREEN}CPU usage: ${CPU_USAGE}%${NC}"
    fi
    
    # Memory Usage
    MEMORY_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
    if [ $MEMORY_USAGE -gt $ALERT_THRESHOLD_MEMORY ]; then
        log "${RED}High memory usage: ${MEMORY_USAGE}%${NC}"
    else
        log "${GREEN}Memory usage: ${MEMORY_USAGE}%${NC}"
    fi
    
    # Disk Usage
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d% -f1)
    if [ $DISK_USAGE -gt $ALERT_THRESHOLD_DISK ]; then
        log "${RED}High disk usage: ${DISK_USAGE}%${NC}"
    else
        log "${GREEN}Disk usage: ${DISK_USAGE}%${NC}"
    fi
}

check_service_health() {
    log "Checking service health..."
    
    # Backend API health check
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log "${GREEN}Backend API: Healthy${NC}"
    else
        log "${RED}Backend API: Not responding${NC}"
    fi
    
    # Frontend health check
    if curl -f http://localhost > /dev/null 2>&1; then
        log "${GREEN}Frontend: Healthy${NC}"
    else
        log "${RED}Frontend: Not responding${NC}"
    fi
    
    # MongoDB health check
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log "${GREEN}MongoDB: Healthy${NC}"
    else
        log "${RED}MongoDB: Not responding${NC}"
    fi
}

check_logs() {
    log "Checking for errors in logs..."
    
    # Check application logs for errors
    ERROR_COUNT=$(grep -i "error" $LOG_DIR/*.log 2>/dev/null | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        log "${YELLOW}Found $ERROR_COUNT errors in logs${NC}"
        log "Recent errors:"
        grep -i "error" $LOG_DIR/*.log 2>/dev/null | tail -n 5
    else
        log "${GREEN}No errors found in logs${NC}"
    fi
}

check_network() {
    log "Checking network connectivity..."
    
    # Check internal network
    if docker network inspect soa-midterm-network >/dev/null 2>&1; then
        log "${GREEN}Docker network: Connected${NC}"
    else
        log "${RED}Docker network: Disconnected${NC}"
    fi
    
    # Check external connectivity
    if ping -c 1 google.com >/dev/null 2>&1; then
        log "${GREEN}External network: Connected${NC}"
    else
        log "${RED}External network: Disconnected${NC}"
    fi
}

cleanup_old_logs() {
    # Keep logs for last 7 days only
    find $LOG_DIR -name "*.log" -type f -mtime +7 -exec rm {} \;
    log "Cleaned up logs older than 7 days"
}

# Main monitoring loop
main() {
    while true; do
        log "=== Starting monitoring cycle ==="
        
        check_container_status
        check_resource_usage
        check_service_health
        check_logs
        check_network
        
        # Cleanup old logs every day at midnight
        if [ "$(date +%H:%M)" = "00:00" ]; then
            cleanup_old_logs
        fi
        
        log "=== Monitoring cycle completed ==="
        log "Waiting for next cycle..."
        
        # Wait for 5 minutes before next check
        sleep 300
    done
}

# Start monitoring
main "$@"

# Create monitoring directories if they don't exist
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/provisioning

# Basic system monitoring dashboard
cat > monitoring/grafana/dashboards/system_metrics.json << 'EOF'
{
  "annotations": {
    "list": []
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "links": [],
  "liveNow": false,
  "panels": [
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 20,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "smooth",
            "lineWidth": 2,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "area"
            }
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "percent"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "id": 1,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "prometheus"
          },
          "expr": "system_cpu_usage",
          "refId": "A"
        }
      ],
      "title": "CPU Usage",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 20,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "smooth",
            "lineWidth": 2,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "area"
            }
          },
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "percent"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "id": 2,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "prometheus"
          },
          "expr": "system_memory_usage",
          "refId": "A"
        }
      ],
      "title": "Memory Usage",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "bars",
            "fillOpacity": 100,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "normal"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 8
      },
      "id": 3,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "prometheus"
          },
          "expr": "sum(rate(app_transaction_count[5m])) by (status)",
          "refId": "A"
        }
      ],
      "title": "Transaction Rate by Status",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "prometheus"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 20,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "smooth",
            "lineWidth": 2,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "area"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 1
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 8
      },
      "id": 4,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "mode": "single",
          "sort": "none"
        }
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "prometheus"
          },
          "expr": "histogram_quantile(0.95, sum(rate(app_request_latency_seconds_bucket[5m])) by (le))",
          "refId": "A"
        }
      ],
      "title": "API Latency (95th percentile)",
      "type": "timeseries"
    }
  ],
  "refresh": "5s",
  "schemaVersion": 38,
  "style": "dark",
  "tags": ["tuition-payment"],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "System Metrics",
  "version": 1,
  "weekStart": ""
}
EOF

# Create Grafana datasource provisioning
cat > monitoring/grafana/provisioning/datasources.yaml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF

# Create Grafana dashboard provisioning
cat > monitoring/grafana/provisioning/dashboards.yaml << 'EOF'
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Make the script executable
chmod +x monitor.sh