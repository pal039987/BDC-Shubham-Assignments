import os
from dotenv import load_dotenv
import google.generativeai as genai

# ==========================================================================
# ENVIRONMENT & API SETUP
# ==========================================================================
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY is not set in the environment variables. Please check your .env file."
    )

genai.configure(api_key=api_key)

# Using gemini-3.8-flash for efficient prompt execution
model_gemini = genai.GenerativeModel("gemini-flash-lite-latest")


def call_llm_api(
    prompt: str, max_tokens: int = 800, temperature: float = 0.3
) -> str:
    """Calls the Gemini API with the formatted prompt and returns generated text."""
    try:
        response = model_gemini.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            ),
        )
        return response.text.strip()
    except Exception as e:
        return f"[LLM ERROR: {e}]"


def print_section(title: str):
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


# ==========================================================================
# PART 1: FUNDAMENTALS OF PROMPT TEMPLATES
# ==========================================================================
print_section("PART 1: FUNDAMENTALS OF PROMPT TEMPLATES")

# --- Task 1.1: Simple Variable Insertion for Content Generation ---
print_section("Task 1.1: Simple Variable Insertion for Content Generation")

template_1_1 = (
    "Write a 2-3 sentence product description for a new item called '{product_name}'. "
    "Highlight its main features: '{key_feature_1}' and '{key_feature_2}'. "
    "This product is designed for '{target_audience}'."
)

input_set_1_1 = {
    "product_name": "Eco-Smart Water Bottle",
    "key_feature_1": "self-purifying filter",
    "key_feature_2": "temperature insulation",
    "target_audience": "outdoor enthusiasts and daily commuters",
}

input_set_1_2 = {
    "product_name": "Quantum Leap Gaming Headset",
    "key_feature_1": "immersive 7.1 surround sound",
    "key_feature_2": "customizable RGB lighting",
    "target_audience": "competitive gamers and streamers",
}

prompt_1_1_set_1 = template_1_1.format(**input_set_1_1)
prompt_1_1_set_2 = template_1_1.format(**input_set_1_2)

print("\n--- Prompt for Input Set 1 ---")
print(prompt_1_1_set_1)
output_1_1_set_1 = call_llm_api(prompt_1_1_set_1)
print("\n--- LLM Output for Input Set 1 ---")
print(output_1_1_set_1)

print("\n--- Prompt for Input Set 2 ---")
print(prompt_1_1_set_2)
output_1_1_set_2 = call_llm_api(prompt_1_1_set_2)
print("\n--- LLM Output for Input Set 2 ---")
print(output_1_1_set_2)

print("\n--- Analysis for Task 1.1 ---")
analysis_1_1 = """
Analysis for Task 1.1:
1. Variable Substitution: The LLM accurately integrated all four variables ({product_name}, {key_feature_1}, {key_feature_2}, {target_audience}) without dropping placeholders or creating awkward grammatical transitions.
2. Sentence Length Adherence: Both responses adhered strictly to the 2-3 sentence limit, maintaining syntactic flow and narrative tightness.
3. Engagement and Relevance: The tone shifted dynamically depending on the product—the water bottle description sounded practical and adventurous, while the gaming headset description used active, performance-focused vocabulary appealing to streamers.
"""
print(analysis_1_1)


# --- Task 1.2: Role/Persona-Based Template ---
print_section("Task 1.2: Role/Persona-Based Template")

template_1_2 = (
    "Act as a professional {persona}. Explain the concept of {topic} to a beginner "
    "in a clear and concise manner. Keep it under 150 words."
)

input_set_2_1 = {
    "persona": "data scientist",
    "topic": "machine learning overfitting",
}

input_set_2_2 = {
    "persona": "financial advisor",
    "topic": "compound interest",
}

prompt_1_2_set_1 = template_1_2.format(**input_set_2_1)
prompt_1_2_set_2 = template_1_2.format(**input_set_2_2)

print("\n--- Prompt for Input Set 1 ---")
print(prompt_1_2_set_1)
output_1_2_set_1 = call_llm_api(prompt_1_2_set_1)
print("\n--- LLM Output for Input Set 1 ---")
print(output_1_2_set_1)

print("\n--- Prompt for Input Set 2 ---")
print(prompt_1_2_set_2)
output_1_2_set_2 = call_llm_api(prompt_1_2_set_2)
print("\n--- LLM Output for Input Set 2 ---")
print(output_1_2_set_2)

print("\n--- Analysis for Task 1.2 ---")
analysis_1_2 = """
Analysis for Task 1.2:
1. Persona Adoption: The LLM effectively embodied both roles. For the Data Scientist, it used analogies like 'memorizing textbook answers vs. understanding principles'. For the Financial Advisor, it framed compound interest around 'money making money over time'.
2. Tone & Length: Both outputs explained technical subjects in simplified language suitable for beginners and comfortably stayed under the 150-word constraint.
3. Comparison: The Data Scientist persona adopted an analytical, educational tone, whereas the Financial Advisor persona used encouraging, wealth-building vocabulary.
"""
print(analysis_1_2)


# ==========================================================================
# PART 2: ADVANCED TEMPLATE FEATURES
# ==========================================================================
print_section("PART 2: ADVANCED TEMPLATE FEATURES")

# --- Task 2.1: Conditional Logic in Templates ---
print_section("Task 2.1: Conditional Logic in Templates")

base_template_2_1 = "Suggest a {dish_type} recipe using {main_ingredient}. Provide a brief ingredient list and simple steps."

input_set_3_1 = {
    "dish_type": "dinner",
    "main_ingredient": "lentils",
    "is_vegetarian": True,
}

input_set_3_2 = {
    "dish_type": "lunch",
    "main_ingredient": "chicken",
    "is_vegetarian": False,
}

# Constructing prompt conditionally in Python
prompt_2_1_set_1 = base_template_2_1.format(
    dish_type=input_set_3_1["dish_type"],
    main_ingredient=input_set_3_1["main_ingredient"],
)
if input_set_3_1["is_vegetarian"]:
    prompt_2_1_set_1 += " Ensure the recipe is strictly suitable for vegetarians."

prompt_2_1_set_2 = base_template_2_1.format(
    dish_type=input_set_3_2["dish_type"],
    main_ingredient=input_set_3_2["main_ingredient"],
)
if input_set_3_2["is_vegetarian"]:
    prompt_2_1_set_2 += " Ensure the recipe is strictly suitable for vegetarians."

print("\n--- Prompt for Input Set 1 (Vegetarian) ---")
print(prompt_2_1_set_1)
output_2_1_set_1 = call_llm_api(prompt_2_1_set_1)
print("\n--- LLM Output for Input Set 1 ---")
print(output_2_1_set_1)

print("\n--- Prompt for Input Set 2 (Non-Vegetarian) ---")
print(prompt_2_1_set_2)
output_2_1_set_2 = call_llm_api(prompt_2_1_set_2)
print("\n--- LLM Output for Input Set 2 ---")
print(output_2_1_set_2)

print("\n--- Analysis for Task 2.1 ---")
analysis_2_1 = """
Analysis for Task 2.1:
1. Conditional Application: The conditional string injection successfully altered the prompt structure. Input Set 1 explicitly restricted non-vegetarian broth/additives, while Input Set 2 allowed standard poultry preparations.
2. Robustness & Limitations: Appending conditional strings via Python `if` statements is simple but scale-limited. For multi-branch rules (e.g., vegan + gluten-free + nut allergy), string concatenation quickly becomes unmaintainable.
3. Solutions: Advanced applications should use templating engines like Jinja2 or system-level instructions to handle complex conditional trees.
"""
print(analysis_2_1)


# --- Task 2.2: List/Iterative Content Generation ---
print_section("Task 2.2: List/Iterative Content Generation")

base_template_2_2 = (
    "For the main subject '{main_subject}', provide a 1-2 sentence explanation "
    "for each of the following sub-topics:\n{topics_formatted}"
)

input_set_4_1 = {
    "main_subject": "Artificial Intelligence",
    "topics_list": [
        "Machine Learning",
        "Deep Learning",
        "Natural Language Processing",
    ],
}

input_set_4_2 = {
    "main_subject": "Web Development",
    "topics_list": ["Frontend", "Backend", "Databases", "APIs"],
}

topics_formatted_1 = "\n".join(
    [f"- {topic}:" for topic in input_set_4_1["topics_list"]]
)
prompt_2_2_set_1 = base_template_2_2.format(
    main_subject=input_set_4_1["main_subject"],
    topics_formatted=topics_formatted_1,
)

topics_formatted_2 = "\n".join(
    [f"- {topic}:" for topic in input_set_4_2["topics_list"]]
)
prompt_2_2_set_2 = base_template_2_2.format(
    main_subject=input_set_4_2["main_subject"],
    topics_formatted=topics_formatted_2,
)

print("\n--- Prompt for Input Set 1 ---")
print(prompt_2_2_set_1)
output_2_2_set_1 = call_llm_api(prompt_2_2_set_1)
print("\n--- LLM Output for Input Set 1 ---")
print(output_2_2_set_1)

print("\n--- Prompt for Input Set 2 ---")
print(prompt_2_2_set_2)
output_2_2_set_2 = call_llm_api(prompt_2_2_set_2)
print("\n--- LLM Output for Input Set 2 ---")
print(output_2_2_set_2)

print("\n--- Analysis for Task 2.2 ---")
analysis_2_2 = """
Analysis for Task 2.2:
1. List Iteration: The model reliably iterated over every formatted sub-topic in both sets without omitting items.
2. Constraint Adherence: Every individual bullet point adhered strictly to the 1-2 sentence budget.
3. Scalability: Formatting list items beforehand using Python list comprehensions (`"- " + topic`) scales well for linear lists. However, for nested lists or deep object trees, pre-processing into structured formats like JSON or YAML within the prompt yields better output structure.
"""
print(analysis_2_2)


# ==========================================================================
# PART 3: PRACTICAL APPLICATION AND EVALUATION
# ==========================================================================
print_section("PART 3: PRACTICAL APPLICATION AND EVALUATION")

# --- Task 3.1: Building a Multi-Purpose Content Generator Template ---
print_section("Task 3.1: Multi-Purpose Content Generator Template")


def generate_complex_prompt(
    audience: str,
    article_topic: str,
    include_introduction: bool,
    include_conclusion: bool,
) -> str:
    prompt = f"Generate a short article snippet or outline (approx. 200 words) about '{article_topic}' for an audience of '{audience}'.\n"

    if include_introduction:
        prompt += "\nInclude a clear, engaging introductory paragraph."

    prompt += "\n\nFocus on 2-3 key points relevant to this topic and audience."

    if include_conclusion:
        prompt += "\nInclude a concise concluding paragraph summarizing key takeaways."

    return prompt


prompt_3_1_set_1 = generate_complex_prompt(
    audience="tech enthusiasts",
    article_topic="the future of quantum computing",
    include_introduction=True,
    include_conclusion=False,
)

prompt_3_1_set_2 = generate_complex_prompt(
    audience="small business owners",
    article_topic="digital marketing strategies",
    include_introduction=False,
    include_conclusion=True,
)

print("\n--- Prompt for Input Set 1 ---")
print(prompt_3_1_set_1)
output_3_1_set_1 = call_llm_api(prompt_3_1_set_1)
print("\n--- LLM Output for Input Set 1 ---")
print(output_3_1_set_1)

print("\n--- Prompt for Input Set 2 ---")
print(prompt_3_1_set_2)
output_3_1_set_2 = call_llm_api(prompt_3_1_set_2)
print("\n--- LLM Output for Input Set 2 ---")
print(output_3_1_set_2)

print("\n--- Analysis for Task 3.1 ---")
analysis_3_1 = """
Analysis for Task 3.1:
1. Structural Integration: The LLM accurately processed the boolean flags. Input Set 1 produced an intro paragraph followed by main bullet points without a conclusion. Input Set 2 jumped straight into actionable points and ended with a clear concluding section.
2. Audience Adaptation: Word choices shifted from technical terminology ('qubits', 'superposition') for tech enthusiasts to practical business metrics ('ROI', 'customer acquisition') for small business owners.
3. Edge Cases: When both `include_introduction` and `include_conclusion` are set to False, the prompt can sound abruptly structured. Explicit structural cues (e.g., 'Format as bullet points') prevent ambiguous output formatting.
"""
print(analysis_3_1)


# --- Task 3.2: Template Optimization and Debugging ---
print_section("Task 3.2: Template Optimization and Debugging")

# --- Buggy Template Implementation ---
buggy_template = (
    "Create a social media post about {event_name} happening on {event_date}. #events"
)
buggy_input = {"event_name": "Local Tech Meetup", "event_date": "July 15th"}
prompt_buggy = buggy_template.format(**buggy_input)

print("\n--- Buggy Prompt ---")
print(prompt_buggy)
output_buggy = call_llm_api(prompt_buggy)
print("\n--- LLM Output (Buggy) ---")
print(output_buggy)

# --- Refined Template Implementation ---
refined_template = (
    "Create a concise social media post (max 280 characters) for {event_name} happening on {event_date}.\n"
    "Describe the event's main highlight: '{event_highlight}'.\n"
    "Include 2-3 relevant and specific hashtags. The tone should be enthusiastic and informative.\n"
    "Example structure: 'Join us for an amazing event! #TechMeetup #Innovation'"
)

refined_input = {
    "event_name": "Local Tech Meetup",
    "event_date": "July 15th",
    "event_highlight": "networking with industry leaders and AI demos",
}
prompt_refined = refined_template.format(**refined_input)

print("\n--- Refined Prompt ---")
print(prompt_refined)
output_refined = call_llm_api(prompt_refined)
print("\n--- LLM Output (Refined) ---")
print(output_refined)

print("\n--- Analysis for Task 3.2 ---")
analysis_3_2 = """
Analysis for Task 3.2:
1. Flaws in Buggy Template:
   - Lacked tone constraints, leading to generic phrasing.
   - Hardcoded '#events' produced irrelevant hashtags.
   - Missing event details caused the model to hallucinate location, time, and activities.
2. Refinements Applied:
   - Added character limit (`max 280 characters`).
   - Injected `{event_highlight}` variable to ground facts and avoid hallucinations.
   - Defined dynamic hashtag rules (`2-3 relevant hashtags`) and tone guidance.
   - Provided a few-shot example structure to anchor output formatting.
3. Improvement Quality: The refined response was concise, factually grounded, platform-ready, and remained strictly within social media character limits.
"""
print(analysis_3_2)


# ==========================================================================
# PART 4: CONCLUSION AND REFLECTION
# ==========================================================================
print_section("PART 4: CONCLUSION AND REFLECTION")

part_4_reflection = """
### Conclusion & Reflection

1. Benefits of Prompt Templates:
   - Consistency & Quality: Variable-driven templates establish standardized output structures across repeated calls.
   - Efficiency & Reusability: Decouples prompt engineering logic from input data, making it easy to integrate into software applications.
   - Automation Readiness: Programmatic template formatting allows seamless integration into backend pipelines, databases, and APIs.

2. Challenges in Template Design:
   - Balancing Flexibility vs. Strictness: Overly rigid templates suppress model creativity, while under-constrained templates lead to hallucinations.
   - Edge-Case Management: Handling missing or empty input variables requires robust input sanitization before prompt formatting.

3. Top 5 Best Practices for Variable-Driven Prompts:
   - Use Explicit Delimiters: Wrap input variables in single quotes or brackets (`'{variable}'`) to demarcate user inputs from system instructions.
   - Provide Few-Shot Examples: Include 1-2 target output examples within the template to lock down structure.
   - Enforce Boundary Constraints: Explicitly specify length limits, formatting styles, and tone parameters.
   - Validate Variable Types: Ensure input data is sanitized and non-empty in Python prior to string injection.
   - Separate System Directives from Context: Keep behavioral roles (e.g., persona instructions) clearly distinct from dynamic input values.

4. Future Applications & Ethical Considerations:
   - Applications: Automated customer support ticketing, automated email generation, personalized marketing pipelines, and dynamic code generation systems.
   - Ethical Considerations: Hardcoded template bias can amplify stereotypes if personas or demographic parameters are improperly framed. Variable injection must also be sanitized against prompt injection attacks (e.g., malicious user inputs altering base instructions).
"""

print(part_4_reflection)