import streamlit as st
import os
import time
from dotenv import load_dotenv
import google.generativeai as genai
from langfuse import get_client, propagate_attributes
import uuid

# --------------------------------------------------
# Setup
# --------------------------------------------------
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel("gemini-flash-lite-latest")
langfuse = get_client()

# --------------------------------------------------
# Prompt Templates (v1: few-shot, v2: zero-shot, v3: CoT)
# --------------------------------------------------
def build_prompt(version: str, document_text: str) -> str:
    if version == "v1_few_shot":
        return f"""You are a legal assistant. Follow the example below to summarize, extract entities, and explain a legal document in plain English.

Example:
Document: "This Agreement is made between ABC Corp and XYZ Ltd on January 5, 2023, governed by the laws of Delaware."
Summary: A contract between ABC Corp and XYZ Ltd, effective January 5, 2023, under Delaware law.
Entities: Parties: ABC Corp, XYZ Ltd | Date: January 5, 2023 | Jurisdiction: Delaware
Plain English: This is an agreement between two companies, ABC Corp and XYZ Ltd, that started on January 5, 2023, and follows Delaware's laws.

Now do the same for this document:
Document: {document_text}

Provide:
Summary:
Entities:
Plain English:"""

    elif version == "v2_zero_shot":
        return f"""Analyze the following legal document. Provide:
1. A concise summary
2. Named entities (parties involved, dates, jurisdictions)
3. A plain English explanation for a non-lawyer

Document:
{document_text}

Summary:
Entities:
Plain English:"""

    elif version == "v3_cot":
        return f"""You are a legal assistant. Think step by step before answering.

Step 1: Read the document carefully and identify its purpose.
Step 2: Identify all parties, dates, and jurisdictions mentioned.
Step 3: Summarize the document concisely.
Step 4: Rewrite the summary in plain English for someone with no legal background.

Document:
{document_text}

Now provide your final answer in this format:
Summary:
Entities:
Plain English:"""

    else:
        raise ValueError(f"Unknown prompt version: {version}")


# --------------------------------------------------
# Run prompt with Langfuse tracking
# --------------------------------------------------
def run_legal_analysis(document_text: str, prompt_version: str):
    prompt = build_prompt(prompt_version, document_text)

    with langfuse.start_as_current_observation(
        as_type="generation",
        name=f"legal-analysis-{prompt_version}",
        input={"prompt": prompt},
        model="gemini-3.6-flash",
    ) as generation:
        with propagate_attributes(
            trace_name=f"legal-doc-{prompt_version}",
            user_id="legal-assistant-user",
            session_id=str(uuid.uuid4()),
        ):
            start_time = time.time()
            try:
                response = model.generate_content(prompt)
                output_text = response.text.strip()
                usage = getattr(response, "usage_metadata", None)
                input_tokens = usage.prompt_token_count if usage else None
                output_tokens = usage.candidates_token_count if usage else None
            except Exception as e:
                output_text = f"Error: {e}"
                input_tokens = output_tokens = None

            latency = round(time.time() - start_time, 2)

            generation.update(
                output=output_text,
                usage_details={
                    "input": input_tokens,
                    "output": output_tokens,
                },
            )

    return {
        "prompt_version": prompt_version,
        "prompt": prompt,
        "output": output_text,
        "latency_sec": latency,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
    }


# --------------------------------------------------
# Streamlit UI
# --------------------------------------------------
st.set_page_config(page_title="Smart Legal Assistant", layout="wide")
st.title("⚖️ Smart Legal Assistant")
st.markdown("Upload a legal document, choose a prompt strategy, and see how it performs.")

uploaded_file = st.file_uploader("📄 Upload a legal document (.txt)", type=["txt"])
manual_text = st.text_area("Or paste document text here:", height=200)

document_text = ""
if uploaded_file is not None:
    document_text = uploaded_file.read().decode("utf-8")
elif manual_text:
    document_text = manual_text

prompt_version = st.selectbox(
    "🧪 Choose Prompt Version",
    ["v1_few_shot", "v2_zero_shot", "v3_cot"]
)

if st.button("🚀 Analyze Document"):
    if not document_text.strip():
        st.warning("Please upload or paste a document first.")
    else:
        with st.spinner("Analyzing..."):
            result = run_legal_analysis(document_text, prompt_version)

        st.subheader("📊 Results")
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Latency (sec)", result["latency_sec"])
        with col2:
            st.metric("Total Tokens", (result["input_tokens"] or 0) + (result["output_tokens"] or 0))

        st.subheader("📝 Output")
        st.info(result["output"])

        with st.expander("View full prompt used"):
            st.code(result["prompt"])

        langfuse.flush()
        st.success("Trace logged to Langfuse. Check your Langfuse dashboard to compare prompt versions.")