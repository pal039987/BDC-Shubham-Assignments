import pandas as pd
from models.student import Student


class GradeBook:
    """Loads student score data and provides aggregation/reporting methods."""

    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        self.students = {}  # {student_id: Student}
        self._build_students()

    def _build_students(self):
        for _, row in self.df.iterrows():
            sid = row["StudentID"]
            if sid not in self.students:
                self.students[sid] = Student(
                    student_id=sid,
                    name=row["Name"],
                    gender=row["Gender"],
                    semester=row["Semester"]
                )
            self.students[sid].add_mark(row["Subject"], row["Marks"])

    def get_top_performers(self, n: int = 5):
        """Returns top n students by average marks, as a list of dicts."""
        ranked = sorted(
            self.students.values(),
            key=lambda s: s.average_marks(),
            reverse=True
        )
        return [
            {
                "student_id": int(s.student_id),
                "name": s.name,
                "average": round(s.average_marks(), 2),
                "grade": s.get_grade()
            }
            for s in ranked[:n]
        ]

    def get_subject_average(self, subject: str) -> float:
        """Returns the average marks for a given subject."""
        subject_df = self.df[self.df["Subject"].str.lower() == subject.lower()]
        if subject_df.empty:
            return None
        return round(subject_df["Marks"].mean(), 2)

    def get_failures_by_subject(self) -> dict:
        """Returns count of failing students (Marks < 50) per subject."""
        fails = self.df[self.df["Marks"] < 50]
        counts = fails.groupby("Subject")["StudentID"].count()
        return counts.to_dict()

    def get_average_per_student_pivot(self):
        """Pivot table: rows = StudentID/Name, columns = Subject, values = Marks."""
        pivot = self.df.pivot_table(
            index=["StudentID", "Name"],
            columns="Subject",
            values="Marks"
        )
        pivot["Average"] = pivot.mean(axis=1)
        return pivot

    def _grade_bucket(self, marks: float) -> str:
        if marks >= 85:
            return "A"
        elif marks >= 70:
            return "B"
        elif marks >= 50:
            return "C"
        else:
            return "F"

    def get_grade_distribution_per_subject(self):
        """Count of students in each grade bucket, per subject."""
        df = self.df.copy()
        df["Grade"] = df["Marks"].apply(self._grade_bucket)
        distribution = df.groupby(["Subject", "Grade"]).size().unstack(fill_value=0)
        # ensure all grade columns exist even if a grade has zero students
        for grade in ["A", "B", "C", "F"]:
            if grade not in distribution.columns:
                distribution[grade] = 0
        return distribution[["A", "B", "C", "F"]]

    def get_overall_grade_distribution(self):
        """Overall count of each grade across all subject-entries (for pie chart)."""
        df = self.df.copy()
        df["Grade"] = df["Marks"].apply(self._grade_bucket)
        return df["Grade"].value_counts().to_dict()