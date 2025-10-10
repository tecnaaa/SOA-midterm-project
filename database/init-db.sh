#!/bin/bash

# Chờ MongoDB khởi động
sleep 5

# Kết nối và khởi tạo dữ liệu
mongosh -u admin -p admin123 <<EOF
use ibanking_tuition;

// Xóa dữ liệu cũ nếu có
db.users.drop();
db.students.drop();
db.transactions.drop();
db.otp.drop();

// Tạo collections và indexes
db.createCollection('users');
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.createCollection('students');
db.students.createIndex({ "studentId": 1 }, { unique: true });
db.students.createIndex({ "isPaid": 1 });

db.createCollection('transactions');
db.transactions.createIndex({ "userId": 1 });
db.transactions.createIndex({ "studentId": 1 });
db.transactions.createIndex({ "createdAt": 1 });
db.transactions.createIndex({ "status": 1 });

db.createCollection('otp');
db.otp.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 300 });
db.otp.createIndex({ "transactionId": 1 });

// Thêm dữ liệu mẫu users
db.users.insertMany([
    {
        username: "student01",
        hashedPassword: "\$2b\$12\$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
        fullName: "Nguyen Van A",
        email: "hoaianduong214@gmail.com",
        phone: "0901234567",
        balance: 50000000,
        role: "user",
        createdAt: new Date()
    },
    {
        username: "student02",
        hashedPassword: "\$2b\$12\$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
        fullName: "Tran Thi B",
        email: "hoaianduong2411@gmail.com",
        phone: "0902345678",
        balance: 30000000,
        role: "user",
        createdAt: new Date()
    },
    {
        username: "student03",
        hashedPassword: "\$2b\$12\$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
        fullName: "Le Van C",
        email: "c.le@example.com",
        phone: "0903456789",
        balance: 20000000,
        role: "user",
        createdAt: new Date()
    },
    {
        username: "student04",
        hashedPassword: "\$2b\$12\$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
        fullName: "Pham Thi D",
        email: "d.pham@example.com",
        phone: "0904567890",
        balance: 40000000,
        role: "user",
        createdAt: new Date()
    }
]);

// Thêm dữ liệu mẫu students
db.students.insertMany([
    {
        studentId: "52300001",
        fullName: "Nguyen Van Hoc",
        tuitionAmount: 12500000,
        isPaid: false,
        createdAt: new Date("2025-10-01T07:00:00Z")
    },
    {
        studentId: "52300002",
        fullName: "Tran Thi Huong",
        tuitionAmount: 15000000,
        isPaid: false,
        createdAt: new Date("2025-10-01T07:15:00Z")
    },
    {
        studentId: "52300003",
        fullName: "Le Van Thanh",
        tuitionAmount: 13500000,
        isPaid: false,
        createdAt: new Date("2025-10-01T07:30:00Z")
    },
    {
        studentId: "52300004",
        fullName: "Pham Minh Duc",
        tuitionAmount: 14000000,
        isPaid: false,
        createdAt: new Date("2025-10-01T07:45:00Z")
    }
]);

print("Database initialization completed!");
EOF