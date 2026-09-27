import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process, LLM
# from crewai_tools import SerperDevTool  # Optional: for internet search if you have a Serper API key

# --------------------------------------------------
# Task 1.1: Install Libraries and Configure LLM
# --------------------------------------------------
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

# Use CrewAI's native LLM class with the "gemini/<model>" string format.
# Passing a ChatGoogleGenerativeAI object directly causes a known bug where
# CrewAI mangles the model name (models/gemini/... ) before it reaches LiteLLM.
llm = LLM(model="gemini/gemini-2.0-flash", temperature=0.7)

# Optional: Initialize Serper Tool if you have an API key
# os.environ["SERPER_API_KEY"] = os.getenv("SERPER_API_KEY", "")
# search_tool = SerperDevTool()

print("CrewAI environment setup complete!")

# --------------------------------------------------
# Task 2.1: The Planner Agent
# --------------------------------------------------
planner = Agent(
    role='Article Planner',
    goal='Create a detailed, step-by-step outline for a comprehensive article on a given topic, including key sections, sub-topics, and main points.',
    backstory=(
        "An expert in content strategy and project management, known for meticulous "
        "planning and clear instructions. Always ensures all necessary information "
        "is covered in a logical and structured manner."
    ),
    llm=llm,
    verbose=True,
    allow_delegation=False
)

print("Planner Agent created!")

# --------------------------------------------------
# Task 2.2: The Executor Agent
# --------------------------------------------------
executor = Agent(
    role='Article Writer',
    goal='To write a high-quality, engaging article based on the provided detailed outline and key points.',
    backstory=(
        "A skilled wordsmith with a knack for transforming complex information "
        "into readable and compelling narratives. Focuses on clarity, creativity, "
        "and accuracy. Can incorporate research findings if provided."
    ),
    llm=llm,
    verbose=True,
    allow_delegation=False
)

print("Executor Agent created!")

# Optional Researcher Agent (requires SERPER_API_KEY)
# researcher = Agent(
#     role='Research Analyst',
#     goal='Conduct thorough research to gather factual information, statistics, and examples on specified topics.',
#     backstory=(
#         "A meticulous researcher with a keen eye for detail and accuracy. "
#         "Excels at finding relevant information quickly and summarizing it effectively."
#     ),
#     llm=llm,
#     tools=[search_tool],
#     verbose=True,
#     allow_delegation=False
# )

# --------------------------------------------------
# Task 3.1: Planning Task
# --------------------------------------------------
article_topic = "The Impact of AI on Future Job Markets"

plan_task = Task(
    description=f"Create a detailed outline for a blog post/article about '{article_topic}'. "
                "The outline should include: a catchy title, an introduction section, "
                "3-4 main body sections with specific sub-topics/points for each, and a conclusion section. "
                "The outline should be clear enough for an AI writer to follow easily. "
                "Output the full outline including section headings and bullet points for sub-topics.",
    expected_output="A detailed article outline with a title, introduction, 3-4 body sections with sub-points, and a conclusion.",
    agent=planner,
    output_file='article_plan.md'
)

print("Planning Task created!")

# --------------------------------------------------
# Task 3.2: Execution Task
# --------------------------------------------------
write_task = Task(
    description=f"Write a comprehensive and engaging article about '{article_topic}' based on the outline "
                "provided by the Article Planner (see context). "
                "Ensure the article is well-structured, informative, and approximately 800-1000 words. "
                "Maintain a professional yet accessible tone. Expand on all points in the outline. "
                "Do not include any introductory or concluding remarks about the writing process, just the article itself.",
    expected_output="A polished, complete article of 800-1000 words following the provided outline.",
    agent=executor,
    context=[plan_task],  # Automatically passes plan_task's output as context
    output_file='final_article.md'
)

print("Execution Task created!")

# --------------------------------------------------
# Task 4.1: Form the Crew
# --------------------------------------------------
project_crew = Crew(
    agents=[planner, executor],
    tasks=[plan_task, write_task],
    process=Process.sequential,
    verbose=True
)

print("Crew formed!")

# --------------------------------------------------
# Task 4.2: Execute the Crew
# --------------------------------------------------
print("\n--- Kicking off the CrewAI Workflow! ---")
result = project_crew.kickoff(inputs={'topic': article_topic})

print("\n--- Workflow Finished! ---")
print("Final Result of the Crew:\n")
print(result)

print("\nAlso check 'article_plan.md' and 'final_article.md' files for full outputs.")