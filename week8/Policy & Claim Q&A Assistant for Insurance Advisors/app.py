import streamlit as st

from rag_agents import ask_question


# ============================================================
# PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="Insurance Policy & Claim Assistant",
    page_icon="🛡️",
    layout="wide"
)


# ============================================================
# HEADER
# ============================================================

st.title("🛡️ Insurance Policy & Claim Assistant")

st.write(
    "Ask questions about health policies, auto claims, "
    "and insurance regulations using the provided documents."
)


# ============================================================
# SIDEBAR
# ============================================================

with st.sidebar:

    st.header("📚 Knowledge Base")

    st.write(
        """
The assistant uses:

• Health Policy Terms
• Auto Claim Manual
• Insurance Regulations 2024
"""
    )

    st.divider()

    st.info(
        "Answers are generated only from the "
        "provided insurance documents."
    )


# ============================================================
# QUESTION INPUT
# ============================================================

question = st.text_area(
    "Enter your question:",
    placeholder=(
        "Example: What documents are required "
        "for an auto insurance claim?"
    ),
    height=120
)


# ============================================================
# ASK BUTTON
# ============================================================

if st.button(
    "🔍 Ask Assistant",
    type="primary"
):

    if not question.strip():

        st.warning(
            "Please enter a question."
        )

    else:

        with st.spinner(
            "Agents are analyzing the policy documents..."
        ):

            try:

                result = ask_question(
                    question.strip()
                )

                # ------------------------------------------
                # CATEGORY
                # ------------------------------------------

                st.subheader("📂 Query Category")

                st.write(
                    result["category"]
                )

                # ------------------------------------------
                # ANSWER
                # ------------------------------------------

                st.subheader("💡 Answer")

                st.write(
                    result["answer"]
                )

                # ------------------------------------------
                # SOURCES
                # ------------------------------------------

                if result["sources"]:

                    st.subheader(
                        "📄 Sources"
                    )

                    displayed_sources = set()

                    for source in result["sources"]:

                        source_name = (
                            f'{source["file"]} '
                            f'(Page {int(source["page"]) + 1})'
                            if str(source["page"]).isdigit()
                            else source["file"]
                        )

                        if source_name not in displayed_sources:

                            st.write(
                                f"• {source_name}"
                            )

                            displayed_sources.add(
                                source_name
                            )

            except Exception as e:

                st.error(
                    f"Error: {str(e)}"
                )


# ============================================================
# FOOTER
# ============================================================

st.divider()

st.caption(
    "Powered by Gemini + LangGraph + FAISS"
)