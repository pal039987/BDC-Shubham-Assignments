import os
import asyncio
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# --------------------------------------------------
# Configure Gemini client
# --------------------------------------------------
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("WARNING: GOOGLE_API_KEY not found in environment variables. Please set it in .env file.")
else:
    print("Gemini API key loaded!")

client = genai.Client(api_key=api_key)

LLM_MODEL = "gemini-flash-lite-latest"
print(f"Using LLM Model: {LLM_MODEL}")

# --------------------------------------------------
# Simulated product database
# --------------------------------------------------
product_database = {
    "laptop": {
        "name": "ProBook X1",
        "specs": "16-inch Retina display, M3 Pro chip, 16GB RAM, 512GB SSD, 12-hour battery life.",
        "features": "Lightweight aluminum unibody, advanced cooling system, backlit keyboard, Thunderbolt 4 ports.",
        "price": "$1999",
        "warranty": "1-year limited warranty."
    },
    "smartphone": {
        "name": "NexPhone Ultra",
        "specs": "6.7-inch OLED display, A10 Bionic chip, 8GB RAM, 256GB storage, triple-lens camera system.",
        "features": "Water and dust resistant, face unlock, fast charging, 5G connectivity.",
        "price": "$999",
        "warranty": "1-year manufacturer warranty."
    },
    "headphones": {
        "name": "SoundWave Pro",
        "specs": "Over-ear design, Active Noise Cancellation (ANC), Bluetooth 5.2, 30-hour battery life.",
        "features": "Comfortable earcups, foldable design, ambient sound mode, custom EQ settings via app.",
        "price": "$299",
        "warranty": "6-month limited warranty."
    }
}

print("Product database simulated with:", list(product_database.keys()))


def get_product_context(query: str, current_product: str = None) -> tuple:
    """
    Identifies a product in the query and returns its details.
    Prioritizes explicit mentions, otherwise uses the current product context.
    Returns (product_name, product_details_string).
    """
    detected_product = None
    for product_key in product_database.keys():
        if product_key in query.lower():
            detected_product = product_key
            break

    if detected_product:
        details = product_database[detected_product]
        product_details_string = (
            f"Product Name: {details['name']}\nSpecs: {details['specs']}\n"
            f"Features: {details['features']}\nPrice: {details['price']}\n"
            f"Warranty: {details['warranty']}"
        )
        return detected_product, product_details_string
    elif current_product and current_product in product_database:
        details = product_database[current_product]
        product_details_string = (
            f"Product Name: {details['name']}\nSpecs: {details['specs']}\n"
            f"Features: {details['features']}\nPrice: {details['price']}\n"
            f"Warranty: {details['warranty']}"
        )
        return current_product, product_details_string
    else:
        return None, None


print("get_product_context function defined!")


# --------------------------------------------------
# LLM response function (Gemini)
# --------------------------------------------------
async def get_llm_response(conversation_history: list, product_context_string: str = None) -> str:
    """
    Generates a response from Gemini, dynamically injecting product context.
    """
    base_instruction = (
        "You are a helpful product inquiry assistant. Your goal is to answer questions "
        "about products based on the provided product details. If a question is outside "
        "the scope of the provided product details or unrelated to products, kindly state "
        "that you can only assist with product inquiries. Always be polite and concise."
    )

    if product_context_string:
        system_instruction = (
            f"{base_instruction}\n\nCURRENT PRODUCT DETAILS:\n{product_context_string}\n\n"
            "Answer user questions strictly based on these details. If a question is about "
            "a different product, ask the user to specify which product they are interested in."
        )
    else:
        system_instruction = (
            f"{base_instruction}\n\nNo specific product context provided. Please ask the user "
            "to specify a product (e.g., laptop, smartphone, headphones) before answering "
            "product-specific questions."
        )

    # Gemini uses "model" instead of "assistant" for the AI's role
    contents = []
    for msg in conversation_history:
        role = "model" if msg["role"] == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=LLM_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=150,
            ),
        )
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return "I'm sorry, I'm having trouble connecting to the AI right now. Please try again later."


print("get_llm_response function defined!")


# --------------------------------------------------
# Main chat loop
# --------------------------------------------------
async def run_product_assistant():
    conversation_history = []
    current_product_key = None
    product_details_string = None

    print("Welcome to the Product Inquiry Assistant! You can ask about: laptop, smartphone, headphones.")
    print("Type 'exit' to end the conversation.")
    print("--------------------------------------------------------------------------------------")

    while True:
        user_query = input("\nYour question: ")
        if user_query.lower() == "exit":
            print("Thank you for using the Product Inquiry Assistant. Goodbye!")
            break

        detected_product, new_product_details_string = get_product_context(user_query, current_product_key)

        if detected_product and detected_product != current_product_key:
            print(f"Assistant: Switching context to {product_database[detected_product]['name']}.")
            current_product_key = detected_product
            product_details_string = new_product_details_string
            conversation_history = []
        elif detected_product is None and current_product_key is None:
            print("Assistant: Please specify which product you are interested in (e.g., laptop, smartphone, headphones).")
            continue

        conversation_history.append({"role": "user", "content": user_query})

        llm_response = await get_llm_response(conversation_history, product_details_string)

        conversation_history.append({"role": "assistant", "content": llm_response})

        print(f"Assistant: {llm_response}")


print("run_product_assistant function defined!")

if __name__ == "__main__":
    asyncio.run(run_product_assistant())