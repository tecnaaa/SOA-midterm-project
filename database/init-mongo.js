// Tạo database và user admin
db = db.getSiblingDB('admin');

// Only create admin user if it doesn't exist
const adminUser = db.getUser("admin");
if (!adminUser) {
    db.createUser({
        user: 'admin',
        pwd: 'admin123',
        roles: ['root']
    });
}

// Chuyển sang database chính
db = db.getSiblingDB('ibanking_tuition');

// Xóa các collections nếu đã tồn tại
db.users.drop();
db.students.drop();
db.transactions.drop();
db.otp.drop();

// Tạo các collections
db.createCollection('users');
db.createCollection('students');
db.createCollection('transactions');
db.createCollection('otp');

// Tạo indexes
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.students.createIndex({ "studentId": 1 }, { unique: true });
db.students.createIndex({ "isPaid": 1 });
db.transactions.createIndex({ "userId": 1 });
db.transactions.createIndex({ "studentId": 1 });
db.transactions.createIndex({ "createdAt": 1 });
db.transactions.createIndex({ "status": 1 });
db.otp.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 300 });
db.otp.createIndex({ "transactionId": 1 });  // Removed unique constraint

// Import users data
try {
    const result = db.users.insertMany([
        {
            userID: 1,
            username: "student01",
            hashedPassword: "$2b$12$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
            fullName: "Nguyen Van A",
            email: "hadgclone01@gmail.com",
            phone: "0901234567",
            balance: 50000000,
            createdAt: new Date("2025-10-03T16:19:57.440Z")
        },
        {
            userID: 2,
            username: "student02",
            hashedPassword: "$2b$12$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
            fullName: "Tran Thi B",
            email: "minhkhai3105@gmail.com",
            phone: "0902345678",
            balance: 30000000,
            createdAt: new Date("2025-10-01T08:30:00Z")
        },
        {
            userID: 3,
            username: "student03",
            hashedPassword: "$2b$12$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
            fullName: "Le Van C",
            email: "hadg",
            phone: "0903456789",
            balance: 20000000,
            createdAt: new Date("2025-10-01T09:00:00Z")
        },
        {
            userID: 4,
            username: "student04",
            hashedPassword: "$2b$12$s81ZLDADtXiND2PzaKTP1OhypjHNmMp/Fk1XSXxQi9.Q9yweAEe9S",
            fullName: "Pham Thi D",
            email: "d.pham@example.com",
            phone: "0904567890",
            balance: 40000000,
            createdAt: new Date("2025-10-01T09:30:00Z")
        }
    ]);
    print("Users data imported successfully:", result.insertedCount);

    const studentsResult = db.students.insertMany([
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
    print("Students data imported successfully:", studentsResult.insertedCount);
} catch (error) {
    print("Error importing data:", error);
}

print("Database initialization completed successfully!");