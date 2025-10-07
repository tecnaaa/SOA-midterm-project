import os
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
from fastapi import HTTPException
import logging
import time
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Add console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Add file handler
file_handler = logging.FileHandler('logs/mongodb.log')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# MongoDB connection settings
mongodb_host = os.getenv('MONGODB_HOST', 'tuition-payment-mongodb')
mongodb_port = int(os.getenv('MONGODB_PORT', '27017'))
mongodb_user = os.getenv('MONGODB_USER', 'admin')
mongodb_pass = os.getenv('MONGODB_PASSWORD', 'admin123')
database_name = os.getenv('DATABASE_NAME', 'ibanking_tuition')

# MongoDB connection retry settings
max_retries = 5
retry_delay = 5  # seconds
connection_timeout = 30000  # 30 seconds

# Construct MongoDB URL
mongodb_url = f"mongodb://{mongodb_user}:{mongodb_pass}@{mongodb_host}:{mongodb_port}/{database_name}?authSource=admin"

def get_db_connection() -> Optional[MongoClient]:
    for attempt in range(max_retries):
        try:
            # Connect to MongoDB with increased timeout
            client = MongoClient(mongodb_url, 
                               serverSelectionTimeoutMS=connection_timeout,
                               connectTimeoutMS=connection_timeout,
                               socketTimeoutMS=connection_timeout)
            
            # Test connection
            client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB at {mongodb_host}:{mongodb_port}")
            return client
            
        except (ServerSelectionTimeoutError, ConnectionFailure) as e:
            if attempt < max_retries - 1:
                logger.warning(f"Connection attempt {attempt + 1} failed: {str(e)}")
                time.sleep(retry_delay)
                continue
            logger.error(f"All connection attempts failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Database connection failed after multiple attempts"
            )
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected database error: {str(e)}"
            )

# Initialize database connection
client = get_db_connection()
db = client[database_name]

# Initialize collections
users_col = db["users"]
students_col = db["students"]
transactions_col = db["transactions"] 
otp_col = db["otp"]

# Create indexes
try:
    users_col.create_index([("username", ASCENDING)], unique=True)
    students_col.create_index([("studentId", ASCENDING)], unique=True)
    transactions_col.create_index([("transactionId", ASCENDING)], unique=True)
    otp_col.create_index([("code", ASCENDING), ("userId", ASCENDING)], unique=True)
    logger.info("Database indexes created successfully")
except Exception as e:
    logger.error(f"Error creating indexes: {str(e)}")
