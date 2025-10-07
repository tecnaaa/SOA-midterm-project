from fastapi import APIRouter, HTTPException
from app.models.student import Student
import json

router = APIRouter()

def load_student_data():
    try:
        with open('app/data/student.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading student data: {e}")
        return []

@router.get("/search/{student_id}")
async def search_tuition(student_id: str):
    students = load_student_data()
    student = next((s for s in students if s["studentId"] == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin sinh viên")
    return student