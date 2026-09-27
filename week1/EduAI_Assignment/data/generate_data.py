import pandas as pd
import numpy as np
from faker import Faker
import random

fake = Faker()
random.seed(42)
np.random.seed(42)

SUBJECTS = ["Math", "Physics", "Chemistry", "English", "Computer Science"]
NUM_STUDENTS = 50

rows = []
for student_id in range(1, NUM_STUDENTS + 1):
    name = fake.name()
    gender = random.choice(["Male", "Female"])
    semester = random.choice([1, 2, 3, 4])

    for subject in SUBJECTS:
        marks = int(np.clip(np.random.normal(70, 15), 0, 100))
        rows.append({
            "StudentID": student_id,
            "Name": name,
            "Gender": gender,
            "Semester": semester,
            "Subject": subject,
            "Marks": marks
        })

df = pd.DataFrame(rows)
df.to_csv("data/students_scores.csv", index=False)
print(f"Generated {len(df)} rows for {NUM_STUDENTS} students across {len(SUBJECTS)} subjects.")