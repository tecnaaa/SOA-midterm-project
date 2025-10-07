import os
import json
from datetime import datetime
import asyncio
from typing import Dict, List
import aiofiles
import logging

class EmailQueue:
    def __init__(self):
        self.queue_path = os.getenv('EMAIL_QUEUE_PATH', 'email_queue')
        self.max_retries = int(os.getenv('EMAIL_QUEUE_MAX_RETRIES', 3))
        os.makedirs(self.queue_path, exist_ok=True)

    async def enqueue(self, email_data: Dict):
        """Thêm email vào queue khi gửi thất bại"""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')
        filename = f"{timestamp}.json"
        filepath = os.path.join(self.queue_path, filename)
        
        email_data['attempts'] = email_data.get('attempts', 0)
        email_data['next_attempt'] = datetime.utcnow().isoformat()
        
        async with aiofiles.open(filepath, 'w') as f:
            await f.write(json.dumps(email_data))
        
        logging.info(f"Email queued: {filepath}")

    async def process_queue(self, email_service):
        """Xử lý các email trong queue"""
        while True:
            try:
                files = os.listdir(self.queue_path)
                for filename in files:
                    if not filename.endswith('.json'):
                        continue
                        
                    filepath = os.path.join(self.queue_path, filename)
                    async with aiofiles.open(filepath, 'r') as f:
                        content = await f.read()
                        email_data = json.loads(content)
                    
                    if email_data['attempts'] >= self.max_retries:
                        logging.error(f"Max retries exceeded for email: {filepath}")
                        # Di chuyển vào thư mục failed
                        failed_dir = os.path.join(self.queue_path, 'failed')
                        os.makedirs(failed_dir, exist_ok=True)
                        os.rename(filepath, os.path.join(failed_dir, filename))
                        continue
                    
                    # Thử gửi lại email
                    success = await email_service.send_email(
                        email_data['to'],
                        email_data['subject'],
                        email_data['body']
                    )
                    
                    if success:
                        os.remove(filepath)
                        logging.info(f"Queued email sent successfully: {filepath}")
                    else:
                        email_data['attempts'] += 1
                        async with aiofiles.open(filepath, 'w') as f:
                            await f.write(json.dumps(email_data))
            
            except Exception as e:
                logging.error(f"Error processing email queue: {str(e)}")
            
            # Đợi 5 phút trước khi xử lý tiếp
            await asyncio.sleep(300)