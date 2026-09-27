import matplotlib
matplotlib.use("Agg")  # non-interactive backend, needed for servers/scripts

import matplotlib.pyplot as plt
import seaborn as sns

from models import PatientAnalyzer


def generate_bmi_gender_chart(analyzer: PatientAnalyzer, output_path="bmi_gender_barplot.png"):
    """Seaborn barplot: Average BMI by gender."""
    df = analyzer.df
    avg_bmi_by_gender = df.groupby("Gender")["BMI"].mean().reset_index()

    plt.figure(figsize=(6, 5))
    sns.barplot(data=avg_bmi_by_gender, x="Gender", y="BMI", hue="Gender", legend=False)
    plt.title("Average BMI by Gender")
    plt.xlabel("Gender")
    plt.ylabel("Average BMI")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    print(f"Saved: {output_path}")


def generate_age_distribution_chart(analyzer: PatientAnalyzer, output_path="age_distribution.png"):
    """Matplotlib histogram: Age distribution."""
    df = analyzer.df

    plt.figure(figsize=(6, 5))
    plt.hist(df["Age"], bins=10, color="steelblue", edgecolor="black")
    plt.title("Age Distribution")
    plt.xlabel("Age")
    plt.ylabel("Number of Patients")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    analyzer = PatientAnalyzer("patients_data.csv")
    generate_bmi_gender_chart(analyzer)
    generate_age_distribution_chart(analyzer)