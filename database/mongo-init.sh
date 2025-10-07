#!/bin/bash
set -e

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
until mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    sleep 1
done

echo "MongoDB started, initializing database..."

# Create admin user if not exists
mongosh admin --eval "
  if (!db.getUser('${MONGO_INITDB_ROOT_USERNAME}')) {
    db.createUser({
      user: '${MONGO_INITDB_ROOT_USERNAME}',
      pwd: '${MONGO_INITDB_ROOT_PASSWORD}',
      roles: ['root']
    })
  }
"

# Initialize database with authentication
mongosh "mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@localhost:27017/admin" <<EOF
use ibanking_tuition

db.createCollection('users')
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })

# Insert user data
db.users.insertMany([
    {
        "username": "student01",
        "hashedPassword": "\$2b\$12\$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
        "fullName": "Nguyen Van A",
        "email": "hoaianduong214@gmail.com",
        "phone": "0901234567",
        "balance": 50000000,
        "role": "user",
        "createdAt": new Date()
    },
    {
        "username": "student02",
        "hashedPassword": "\$2b\$12\$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
        "fullName": "Tran Thi B",
        "email": "hoaianduong2411@gmail.com",
        "phone": "0902345678",
        "balance": 30000000,
        "role": "user",
        "createdAt": new Date()
    },
    {
        "username": "student03",
        "hashedPassword": "\$2b\$12\$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
        "fullName": "Le Van C",
        "email": "c.le@example.com",
        "phone": "0903456789",
        "balance": 20000000,
        "role": "user",
        "createdAt": new Date()
    },
    {
        "username": "student04",
        "hashedPassword": "\$2b\$12\$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
        "fullName": "Pham Thi D",
        "email": "d.pham@example.com",
        "phone": "0904567890",
        "balance": 40000000,
        "role": "user",
        "createdAt": new Date()
    }
])

db.createCollection('students')
db.students.createIndex({ "studentId": 1 }, { unique: true })
db.students.createIndex({ "isPaid": 1 })

# Insert sample student data
db.students.insertMany([
    {
        "studentId": "52300001",
        "fullName": "Nguyen Van Hoc",
        "tuitionAmount": 12500000,
        "isPaid": false,
        "createdAt": new Date("2025-10-01T07:00:00Z")
    },
    {
        "studentId": "52300002",
        "fullName": "Tran Thi Huong", 
        "tuitionAmount": 15000000,
        "isPaid": false,
        "createdAt": new Date("2025-10-01T07:15:00Z")
    },
    {
        "studentId": "52300003",
        "fullName": "Le Van Thanh",
        "tuitionAmount": 13500000,
        "isPaid": false,
        "createdAt": new Date("2025-10-01T07:30:00Z")
    },
    {
        "studentId": "52300004",
        "fullName": "Pham Minh Duc",
        "tuitionAmount": 14000000,
        "isPaid": false,
        "createdAt": new Date("2025-10-01T07:45:00Z")
    }
])

print("Database initialization completed!")
EOF