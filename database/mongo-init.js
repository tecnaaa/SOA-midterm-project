db = db.getSiblingDB('ibanking_tuition');

// Drop existing collections
db.students.drop();
db.users.drop();
db.transactions.drop();
db.otp.drop();

// Create collections with schema validation
db.createCollection("students", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["studentId", "fullName", "tuitionAmount", "isPaid"],
         properties: {
            studentId: {
               bsonType: "string",
               description: "Mã số sinh viên"
            },
            fullName: {
               bsonType: "string",
               description: "Họ và tên sinh viên"
            },
            tuitionAmount: {
               bsonType: "number",
               description: "Tổng học phí cần đóng"
            },
            isPaid: {
               bsonType: "bool",
               description: "Trạng thái đã đóng học phí"
            },
            lastPaymentDate: {
               bsonType: ["date", "null"],
               description: "Ngày thanh toán gần nhất"
            },
            lastPaymentAmount: {
               bsonType: ["number", "null"],
               description: "Số tiền thanh toán gần nhất"
            },
            createdAt: {
               bsonType: "date",
               description: "Ngày tạo"
            }
         }
      }
   }
});

// Create indexes
db.students.createIndex({ "studentId": 1 }, { unique: true });
db.students.createIndex({ "isPaid": 1 });

// Create other collections
db.createCollection('users');
db.createCollection('transactions');
db.createCollection('otp');

// Create indexes for other collections
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.transactions.createIndex({ "userId": 1 });
db.transactions.createIndex({ "studentId": 1 });
db.transactions.createIndex({ "createdAt": 1 });
db.otp.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 300 });
db.otp.createIndex({ "transactionId": 1 });

// Load sample data
let studentsData = [
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
    }
];

db.students.insertMany(studentsData);

// Thêm dữ liệu mẫu cho users với mật khẩu "password123"
db.users.insertMany([
    {
        username: "student01",
        hashedPassword: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNZhm2s5Q2e6u",
        fullName: "Nguyen Van A",
        email: "hoaianduong214@gmail.com",
        phone: "0901234567",
        balance: 50000000,
        role: "user",
        createdAt: new Date()
    },
    {
        username: "student02",
        hashedPassword: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNZhm2s5Q2e6u",
        fullName: "Tran Thi B",
        email: "hoaianduong2411@gmail.com",
        phone: "0902345678",
        balance: 30000000,
        role: "user",
        createdAt: new Date()
    }
]);

// Thêm một số giao dịch mẫu
const user1Id = db.users.findOne({ username: "user1" })._id;
const student1Id = "52300003";

db.transactions.insertMany([
    {
        userId: user1Id,
        studentId: student1Id,
        amount: 12000000,
        status: "SUCCESS",
        createdAt: new Date(),
        completedAt: new Date()
    }
]);