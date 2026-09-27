from fastapi import FastAPI
from fastapi.responses import FileResponse
import os

from models import PatientAnalyzer
from charts import generate_bmi_gender_chart, generate_age_distribution_chart

app = FastAPI(title="HealthStat API", description="Patient Data Analysis & Visualization API")

CSV_PATH = "patients_data.csv"
BMI_CHART_PATH = "bmi_gender_barplot.png"
AGE_CHART_PATH = "age_distribution.png"

analyzer = PatientAnalyzer(CSV_PATH)

# Generate charts on startup if they don't already exist
if not os.path.exists(BMI_CHART_PATH):
    generate_bmi_gender_chart(analyzer, BMI_CHART_PATH)
if not os.path.exists(AGE_CHART_PATH):
    generate_age_distribution_chart(analyzer, AGE_CHART_PATH)


@app.get("/")
def root():
    return {"message": "Welcome to the HealthStat API. Visit /docs for API documentation."}


@app.get("/stats/bmi")
def get_average_bmi():
    """Returns the average BMI across all patients."""
    return {"average_bmi": analyzer.get_average_bmi()}


@app.get("/stats/gender-distribution")
def get_gender_distribution():
    """Returns the count of patients by gender."""
    return analyzer.get_gender_distribution()


@app.get("/risk/high")
def get_high_risk_patients():
    """Returns list of high-risk patients (BMI > 30, High BP, or Cholesterol > 240)."""
    return analyzer.get_high_risk_patients()


@app.get("/charts/bmi-gender")
def get_bmi_gender_chart():
    """Serves the BMI-by-gender barplot as an image."""
    return FileResponse(BMI_CHART_PATH, media_type="image/png")


@app.get("/charts/age-dist")
def get_age_distribution_chart():
    """Serves the age distribution histogram as an image."""
    return FileResponse(AGE_CHART_PATH, media_type="image/png")