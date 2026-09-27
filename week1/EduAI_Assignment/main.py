from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from models.gradebook import GradeBook
from visuals.charts import save_performance_heatmap, save_grade_pie_chart
import os

app = FastAPI(title="EduAI - Student Grade Intelligence Engine")

CSV_PATH = "data/students_scores.csv"
HEATMAP_PATH = "visuals/heatmap.png"
PIE_CHART_PATH = "visuals/grades_pie.png"

gb = GradeBook(CSV_PATH)

# Pre-generate visuals once at startup so endpoints just serve the files
save_performance_heatmap(gb, HEATMAP_PATH)
save_grade_pie_chart(gb, PIE_CHART_PATH)


@app.get("/")
def root():
    return {"message": "Welcome to EduAI - Student Grade Intelligence Engine"}


@app.get("/students/top/{n}")
def get_top_students(n: int):
    if n <= 0:
        raise HTTPException(status_code=400, detail="n must be a positive integer")
    return gb.get_top_performers(n)


@app.get("/subjects/average/{subject}")
def get_subject_avg(subject: str):
    avg = gb.get_subject_average(subject)
    if avg is None:
        raise HTTPException(status_code=404, detail=f"Subject '{subject}' not found")
    return {"subject": subject, "average_marks": avg}


@app.get("/subjects/failures")
def get_failures():
    return gb.get_failures_by_subject()


@app.get("/visuals/heatmap")
def get_heatmap():
    if not os.path.exists(HEATMAP_PATH):
        raise HTTPException(status_code=404, detail="Heatmap not found")
    return FileResponse(HEATMAP_PATH, media_type="image/png")


@app.get("/visuals/grades-pie")
def get_grades_pie():
    if not os.path.exists(PIE_CHART_PATH):
        raise HTTPException(status_code=404, detail="Pie chart not found")
    return FileResponse(PIE_CHART_PATH, media_type="image/png")