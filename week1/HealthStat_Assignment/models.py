import pandas as pd


class Patient:
    """Represents a single patient record."""

    def __init__(self, patient_id, age, gender, weight, height,
                 bp_systolic, bp_diastolic, cholesterol, diabetes, smoker, bmi=None):
        self.patient_id = patient_id
        self.age = age
        self.gender = gender
        self.weight = weight
        self.height = height
        self.bp_systolic = bp_systolic
        self.bp_diastolic = bp_diastolic
        self.cholesterol = cholesterol
        self.diabetes = diabetes
        self.smoker = smoker
        self.bmi = bmi if bmi is not None else self.calculate_bmi()

    def calculate_bmi(self):
        """BMI = weight(kg) / (height(m))^2"""
        height_m = self.height / 100
        return round(self.weight / (height_m ** 2), 2)

    def to_dict(self):
        return {
            "PatientID": self.patient_id,
            "Age": self.age,
            "Gender": self.gender,
            "Weight": self.weight,
            "Height": self.height,
            "BP_Systolic": self.bp_systolic,
            "BP_Diastolic": self.bp_diastolic,
            "Cholesterol": self.cholesterol,
            "Diabetes": self.diabetes,
            "Smoker": self.smoker,
            "BMI": self.bmi,
        }


class PatientAnalyzer:
    """Loads patient data and provides analysis methods."""

    def __init__(self, csv_path="patients_data.csv"):
        self.csv_path = csv_path
        self.df = self._load_and_clean_data()

    def _load_and_clean_data(self):
        df = pd.read_csv(self.csv_path)

        # Handle missing values: fill numeric columns with column mean
        numeric_cols = ["Weight", "Height", "Cholesterol"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].mean())

        # Create BMI column
        df["BMI"] = round(df["Weight"] / ((df["Height"] / 100) ** 2), 2)

        return df

    def get_average_bmi(self):
        return round(self.df["BMI"].mean(), 2)

    def get_gender_distribution(self):
        return self.df["Gender"].value_counts().to_dict()

    def get_high_risk_patients(self):
        """Patients with BMI > 30, High BP (systolic > 140), or Cholesterol > 240."""
        high_risk_df = self.df[
            (self.df["BMI"] > 30) |
            (self.df["BP_Systolic"] > 140) |
            (self.df["Cholesterol"] > 240)
        ]
        return high_risk_df.to_dict(orient="records")