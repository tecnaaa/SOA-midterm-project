from fastapi import Request
import time
from services.monitoring import track_request, update_system_info
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def log_middleware(request: Request, call_next):
    """Log và track request metrics"""
    start_time = time.time()
    
    response = await call_next(request)
    
    # Calculate request duration
    duration = time.time() - start_time
    
    # Track request metrics
    track_request(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration=duration
    )
    
    # Update system metrics periodically (every 10th request)
    if int(time.time()) % 10 == 0:
        update_system_info()
    
    return response