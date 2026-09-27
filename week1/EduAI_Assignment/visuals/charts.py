import matplotlib
matplotlib.use("Agg")  # non-interactive backend, saving to file
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd


def save_performance_heatmap(gradebook, output_path="visuals/heatmap.png"):
    """Seaborn heatmap: Student vs Subject marks."""
    pivot = gradebook.df.pivot_table(
        index="Name", columns="Subject", values="Marks"
    )

    plt.figure(figsize=(10, 14))
    sns.heatmap(pivot, annot=False, cmap="YlGnBu", linewidths=0.5)
    plt.title("Student Performance Heatmap (Student vs Subject)")
    plt.xlabel("Subject")
    plt.ylabel("Student")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    print(f"Heatmap saved to {output_path}")


def save_grade_pie_chart(gradebook, output_path="visuals/grades_pie.png"):
    """Matplotlib pie chart: overall grade distribution."""
    distribution = gradebook.get_overall_grade_distribution()

    # ensure consistent order A, B, C, F
    order = ["A", "B", "C", "F"]
    labels = [g for g in order if g in distribution]
    sizes = [distribution[g] for g in labels]
    colors = ["#4CAF50", "#2196F3", "#FFC107", "#F44336"]

    plt.figure(figsize=(6, 6))
    plt.pie(sizes, labels=labels, autopct="%1.1f%%", colors=colors, startangle=90)
    plt.title("Overall Grade Distribution")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
    print(f"Pie chart saved to {output_path}")