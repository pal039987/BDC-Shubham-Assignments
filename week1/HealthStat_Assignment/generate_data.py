import pandas as pd
import numpy as np
import random

np.random.seed(42)
random.seed(42)

NUM_PATIENTS = 200

def generate_patients_data(num_patients=NUM_PATIENTS):
    data = {
        "PatientID": [f"P{str(i).zfill(4)}" for i in range(1, num_patients + 1)],
        "Age": np.random.randint(18, 80, size=num_patients),
        "Gender": np.random.choice(["Male", "Female"], size=num_patients),
        "Weight": np.round(np.random.normal(70, 15, size=num_patients), 1),   # kg
        "Height": np.round(np.random.normal(165, 10, size=num_patients), 1),  # cm
        "BP_Systolic": np.random.randint(90, 180, size=num_patients),
        "BP_Diastolic": np.random.randint(60, 110, size=num_patients),
        "Cholesterol": np.random.randint(150, 300, size=num_patients),
        "Diabetes": np.random.choice(["Yes", "No"], size=num_patients, p=[0.3, 0.7]),
        "Smoker": np.random.choice(["Yes", "No"], size=num_patients, p=[0.25, 0.75]),
    }

    df = pd.DataFrame(data)

    # Introduce a few missing values randomly, to make cleaning meaningful
    for col in ["Weight", "Height", "Cholesterol"]:
        missing_indices = df.sample(frac=0.03, random_state=1).index
        df.loc[missing_indices, col] = np.nan

    return df


if __name__ == "__main__":
    df = generate_patients_data()
    df.to_csv("patients_data.csv", index=False)
    print(f"Generated patients_data.csv with {len(df)} rows.")
    print(df.head())