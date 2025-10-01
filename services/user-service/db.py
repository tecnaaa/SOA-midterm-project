from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["ibanking_tuition"]

users_col = db["users"]
students_col = db["students"]
accounts_col = db["accounts"]
transactions_col = db["transactions"]
otp_col = db["otp"]
admin_col = db["admin"]
