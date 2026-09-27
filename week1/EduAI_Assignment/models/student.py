class Student:
    """Represents a single student with their marks across subjects."""

    def __init__(self, student_id: int, name: str, gender: str, semester: int):
        self.student_id = student_id
        self.name = name
        self.gender = gender
        self.semester = semester
        self.marks = {}  # {subject: marks}

    def add_mark(self, subject: str, marks: float):
        self.marks[subject] = marks

    def average_marks(self) -> float:
        if not self.marks:
            return 0.0
        return sum(self.marks.values()) / len(self.marks)

    def get_grade(self, average: float = None) -> str:
        avg = average if average is not None else self.average_marks()
        if avg >= 85:
            return "A"
        elif avg >= 70:
            return "B"
        elif avg >= 50:
            return "C"
        else:
            return "F"

    def __repr__(self):
        return f"Student({self.student_id}, {self.name}, avg={self.average_marks():.2f})"