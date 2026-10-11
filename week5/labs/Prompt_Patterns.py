# 🔹 Step 1: Install Required Library


# !pip install -q google-generativeai

     
# 🔹 Step 2: Import Libraries and Configure Gemini API


import os
import google.generativeai as genai
from PIL import Image
import IPython.display as display
from dotenv import load_dotenv

# Configure Gemini with your API key


load_dotenv()
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running.")

genai.configure(api_key=API_KEY)

     
# 🔹 Step 3: Load the Multimodal Gemini Model


# Load the multimodal model
vision_model = genai.GenerativeModel(model_name="gemini-flash-lite-latest")

     
# 🔹 Step 4: Load and Display an Image


# Load image (replace path with your image)
image_path = "sample_image.jpg"  # You can also upload via Colab or Jupyter

# Open and show the image
image = Image.open(image_path)
display.display(image)

# 🔹 Step 5: Prompt Pattern 1 – Descriptive Captioning


# Simple description prompt
prompt1 = "Describe this image in detail."

response1 = vision_model.generate_content([prompt1, image])
print("📝 Descriptive Caption:\n", response1.text)

# 🔹 Step 6: Prompt Pattern 2 – Creative Captioning


# Creative storytelling style caption
prompt2 = "Write a creative and imaginative caption for this image as if it's a scene from a storybook."

response2 = vision_model.generate_content([prompt2, image])
print("🎨 Creative Caption:\n", response2.text)

# 🔹 Step 7: Prompt Pattern 3 – Instructional Captioning


# Caption as if for educational use
prompt3 = "Explain what is happening in this image for a classroom lesson."

response3 = vision_model.generate_content([prompt3, image])
print("📚 Instructional Caption:\n", response3.text)
# /🔹 Step 8: Optional – Use Function for Reusability


def caption_image(image, prompt_style):
    prompt_map = {
        "descriptive": "Describe this image in detail.",
        "creative": "Write a creative and imaginative caption for this image.",
        "instructional": "Explain what is happening in this image as if for a classroom lesson."
    }
    prompt = prompt_map.get(prompt_style.lower(), "Describe the image.")
    response = vision_model.generate_content([prompt, image])
    return response.text

# Try it
print(caption_image(image, "creative"))

