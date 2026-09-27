from models.gradebook import GradeBook
from visuals.charts import save_performance_heatmap, save_grade_pie_chart

gb = GradeBook("data/students_scores.csv")

save_performance_heatmap(gb, "visuals/heatmap.png")
save_grade_pie_chart(gb, "visuals/grades_pie.png")

print("Top 5 performers:")
print(gb.get_top_performers(5))

print("\nMath average:")
print(gb.get_subject_average("Math"))

print("\nFailures by subject:")
print(gb.get_failures_by_subject())

print("\nPivot - average marks per student:")
print(gb.get_average_per_student_pivot().head())

print("\nGrade distribution per subject:")
print(gb.get_grade_distribution_per_subject())

print("\nOverall grade distribution:")
print(gb.get_overall_grade_distribution())

save_performance_heatmap(gb)
save_grade_pie_chart(gb)