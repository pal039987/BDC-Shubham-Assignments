import os
import yaml
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process, LLM
from crewai.tools import tool

# --------------------------------------------------
# Task 1.1: Install Libraries and Configure LLM
# --------------------------------------------------
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

# Model is read from .env so it can be swapped without touching code
# (Gemini model availability has been changing frequently — run check_models.py
# to see which models are currently available on your API key.)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
llm = LLM(model=f"gemini/{GEMINI_MODEL}", temperature=0.5)

print(f"CrewAI environment and LLM setup complete! Using model: {GEMINI_MODEL}")

# Create the agents_config.yaml file programmatically
yaml_content = """
agents:
  - id: data_analyst
    role: Data Analyst
    goal: Analyze provided data to identify key trends, anomalies, and statistical insights.
    backstory: An expert in statistical analysis and data interpretation. Transforms raw data into actionable insights, focusing on accuracy and detail.
    verbose: true
    allow_delegation: false
    tools:
      - analyze_data_tool

  - id: insight_generator
    role: Insight Generator
    goal: Synthesize data analysis findings into clear, concise, and actionable business insights and recommendations.
    backstory: A seasoned business strategist with a knack for distilling complex analytical results into strategic recommendations. Focuses on clarity and practical application.
    verbose: true
    allow_delegation: false
"""

with open("agents_config.yaml", "w") as f:
    f.write(yaml_content)

print("agents_config.yaml created successfully!")

# --------------------------------------------------
# Task 2.1: Implement a Custom Tool Function
# --------------------------------------------------
@tool("analyze_data_tool")
def analyze_data_tool(data_description: str) -> str:
    """A tool to perform basic data analysis on a given dataset (simulated).
    Pass a description of the dataset (e.g. 'sales data', 'customer feedback')
    and it returns a simulated analysis summary."""
    print(f"\n--- Tool: Analyzing data for '{data_description}' ---")
    desc = data_description.lower()

    if "sales" in desc:
        return (
            "Simulated Sales Data Analysis: Q1 sales increased by 15% YoY, driven by "
            "new product launches. Top performing region: North America (25% growth). "
            "Bottom performing: Europe (2% decline). Average order value increased by 8%."
        )
    elif "customer feedback" in desc or "sentiment" in desc:
        return (
            "Simulated Customer Feedback Analysis: 70% positive sentiment, 20% neutral, 10% negative. "
            "Key positive themes: 'ease of use', 'great support'. Key negative themes: 'pricing', 'buggy software'."
        )
    elif "website traffic" in desc:
        return (
            "Simulated Website Traffic Analysis: 30% increase in unique visitors last month. "
            "Bounce rate is 45%. Top referral source: social media (40%). Most popular page: product features (2x others)."
        )
    else:
        return (
            f"Simulated General Data Analysis for '{data_description}': "
            "Overall data shows a positive trend. Further specific analysis might be required."
        )

available_tools = {"analyze_data_tool": analyze_data_tool}

print("Custom tool 'analyze_data_tool' implemented and ready!")

# --------------------------------------------------
# Task 2.2: Load Agents from YAML
# --------------------------------------------------
def load_agents_from_yaml(config_file: str, llm, tools_map: dict):
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)

    agents = {}
    for agent_config in config['agents']:
        agent_id = agent_config.pop('id')
        agent_tools = []
        if 'tools' in agent_config:
            for tool_name in agent_config.pop('tools'):
                if tool_name in tools_map:
                    agent_tools.append(tools_map[tool_name])
                else:
                    print(f"Warning: Tool '{tool_name}' not found in tools_map for agent '{agent_id}'.")

        agents[agent_id] = Agent(
            llm=llm,
            tools=agent_tools,
            **agent_config
        )
    return agents

loaded_agents = load_agents_from_yaml('agents_config.yaml', llm, available_tools)

data_analyst_agent = loaded_agents['data_analyst']
insight_generator_agent = loaded_agents['insight_generator']

print("Agents loaded from YAML:")
print(f"  - Data Analyst Role: {data_analyst_agent.role}")
print(f"  - Insight Generator Role: {insight_generator_agent.role}")

# --------------------------------------------------
# Task 3: Define Tasks
# --------------------------------------------------
analyze_data_task = Task(
    description=(
        "Analyze the provided sales data for Q1 2024 and identify key trends, "
        "growth areas, and any significant anomalies. Focus on identifying regional "
        "performance differences and product category contributions. "
        "Provide a summary of the analysis findings."
    ),
    agent=data_analyst_agent,
    expected_output="A detailed analysis report on sales data, including trends, anomalies, and regional performance."
)

generate_insights_task = Task(
    description=(
        "Based on the data analysis report provided, generate 3-5 concise, actionable "
        "business insights. Each insight should be a clear statement, followed by a "
        "recommendation for a business strategy. Format the insights as bullet points "
        "starting with 'Insight:' and 'Recommendation:'."
    ),
    agent=insight_generator_agent,
    context=[analyze_data_task],
    expected_output="3-5 actionable business insights with corresponding recommendations, formatted as bullet points."
)

print("Tasks defined!")

# --------------------------------------------------
# Task 4: Create and Run the Crew
# --------------------------------------------------
business_intelligence_crew = Crew(
    agents=[data_analyst_agent, insight_generator_agent],
    tasks=[analyze_data_task, generate_insights_task],
    process=Process.sequential,
    verbose=True
)

print("\n--- Kicking off the Business Intelligence Crew! ---")

initial_data_context = {
    'data_description': 'sales data for Q1 2024, focusing on regional performance and product contributions'
}

result = business_intelligence_crew.kickoff(inputs=initial_data_context)

print("\n--- Workflow Finished! ---")
print("Final Insights Report:\n")
print(result)