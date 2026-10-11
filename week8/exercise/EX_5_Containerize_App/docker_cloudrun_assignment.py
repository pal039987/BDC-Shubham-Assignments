# ============================================================
# DOCKER + CLOUD RUN ASSIGNMENT
# Complete Notebook - Single Cell
# ============================================================

import os
import subprocess
import time
import requests


# ============================================================
# 1. PROJECT INFORMATION
# ============================================================

print("=" * 70)
print("DOCKER + GOOGLE CLOUD RUN ASSIGNMENT")
print("=" * 70)

print(
    """
Application selected:
Option A - FastAPI RAG API

Reason:
The FastAPI RAG API was already implemented and tested
locally in the previous assignment. Containerizing it
allows the same application to be deployed consistently
on Google Cloud Run.
"""
)


# ============================================================
# 2. CHECK REQUIRED FILES
# ============================================================

print("=" * 70)
print("PROJECT FILE CHECK")
print("=" * 70)

required_files = [
    "main.py",
    "Dockerfile",
    "requirements.txt",
    "README.md",
]

for file_name in required_files:

    if os.path.exists(file_name):

        print(
            f"SUCCESS: {file_name} found"
        )

    else:

        print(
            f"WARNING: {file_name} not found"
        )


# ============================================================
# 3. LOCAL FASTAPI TEST
# ============================================================

print("\n" + "=" * 70)
print("LOCAL FASTAPI TEST")
print("=" * 70)

print(
    """
Before Docker:
Make sure the application works locally.

Command:
python3 main.py

The API should listen on:
http://127.0.0.1:8080

Swagger:
http://127.0.0.1:8080/docs
"""
)


# ============================================================
# 4. DOCKER BUILD COMMAND
# ============================================================

print("\n" + "=" * 70)
print("DOCKER BUILD")
print("=" * 70)

print(
    "Run in terminal:"
)

print(
    "docker build -t rag-fastapi:v1 ."
)


# ============================================================
# 5. DOCKER RUN COMMAND
# ============================================================

print("\n" + "=" * 70)
print("DOCKER RUN")
print("=" * 70)

print(
    "Run in terminal:"
)

print(
    "docker run --rm -p 8080:8080 --env-file .env rag-fastapi:v1"
)


# ============================================================
# 6. LOCAL CONTAINER HEALTH TEST
# ============================================================

print("\n" + "=" * 70)
print("LOCAL CONTAINER TEST")
print("=" * 70)

try:

    response = requests.get(
        "http://127.0.0.1:8080/health",
        timeout=10,
    )

    print(
        "Status code:",
        response.status_code
    )

    print(
        "Response:",
        response.json()
    )

except Exception as exc:

    print(
        "Container/API is not currently running."
    )

    print(
        "Start the Docker container first."
    )

    print(
        "Error:",
        exc
    )


# ============================================================
# 7. LOCAL CONTAINER CHAT TEST
# ============================================================

try:

    response = requests.post(
        "http://127.0.0.1:8080/chat",
        json={
            "query": (
                "What is Retrieval Augmented Generation?"
            )
        },
        timeout=60,
    )

    print("\n" + "=" * 70)
    print("LOCAL DOCKER CHAT TEST")
    print("=" * 70)

    print(
        "Status code:",
        response.status_code
    )

    print(
        response.json()
    )

except Exception as exc:

    print(
        "Chat endpoint test skipped:"
    )

    print(exc)


# ============================================================
# 8. GOOGLE CLOUD CLI COMMANDS
# ============================================================

print("\n" + "=" * 70)
print("GOOGLE CLOUD SETUP")
print("=" * 70)

print(
    """
Authenticate:

gcloud auth login

Set your project:

gcloud config set project YOUR_PROJECT_ID

Set region:

gcloud config set run/region asia-south1
"""
)


# ============================================================
# 9. ENABLE REQUIRED GOOGLE CLOUD APIS
# ============================================================

print("\n" + "=" * 70)
print("ENABLE GOOGLE CLOUD APIS")
print("=" * 70)

print(
    """
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
"""
)


# ============================================================
# 10. CREATE ARTIFACT REGISTRY REPOSITORY
# ============================================================

print("\n" + "=" * 70)
print("ARTIFACT REGISTRY")
print("=" * 70)

print(
    """
Create repository:

gcloud artifacts repositories create rag-repo \\
    --repository-format=docker \\
    --location=asia-south1 \\
    --description="Docker repository for RAG API"
"""
)


# ============================================================
# 11. CONFIGURE DOCKER AUTHENTICATION
# ============================================================

print("\n" + "=" * 70)
print("DOCKER AUTHENTICATION")
print("=" * 70)

print(
    "gcloud auth configure-docker asia-south1-docker.pkg.dev"
)


# ============================================================
# 12. TAG DOCKER IMAGE
# ============================================================

print("\n" + "=" * 70)
print("TAG DOCKER IMAGE")
print("=" * 70)

print(
    """
Replace YOUR_PROJECT_ID with your actual GCP project ID.

docker tag rag-fastapi:v1 \\
    asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/rag-repo/rag-fastapi:v1
"""
)


# ============================================================
# 13. PUSH IMAGE
# ============================================================

print("\n" + "=" * 70)
print("PUSH IMAGE")
print("=" * 70)

print(
    """
docker push \\
    asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/rag-repo/rag-fastapi:v1
"""
)


# ============================================================
# 14. DEPLOY TO CLOUD RUN
# ============================================================

print("\n" + "=" * 70)
print("DEPLOY TO CLOUD RUN")
print("=" * 70)

print(
    """
gcloud run deploy rag-fastapi \\
    --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/rag-repo/rag-fastapi:v1 \\
    --region asia-south1 \\
    --port 8080 \\
    --allow-unauthenticated \\
    --min 0 \\
    --memory 2Gi \\
    --cpu 1
"""
)


# ============================================================
# 15. CLOUD RUN URL TEST
# ============================================================

print("\n" + "=" * 70)
print("CLOUD RUN VERIFICATION")
print("=" * 70)

print(
    """
After deployment, Google Cloud Run will display a URL.

Example:

https://rag-fastapi-xxxxx-uc.a.run.app

Test health:

curl https://YOUR_CLOUD_RUN_URL/health

Test chat:

curl -X POST "https://YOUR_CLOUD_RUN_URL/chat" \\
    -H "Content-Type: application/json" \\
    -d '{"query":"What is Retrieval Augmented Generation?"}'
"""
)


# ============================================================
# 16. CLOUD RUN SWAGGER
# ============================================================

print("\n" + "=" * 70)
print("CLOUD RUN SWAGGER")
print("=" * 70)

print(
    """
Open:

https://YOUR_CLOUD_RUN_URL/docs
"""
)


# ============================================================
# 17. CLEANUP COMMANDS
# ============================================================

print("\n" + "=" * 70)
print("OPTIONAL CLEANUP")
print("=" * 70)

print(
    """
Delete Cloud Run service:

gcloud run services delete rag-fastapi \\
    --region asia-south1

Delete Artifact Registry image:

gcloud artifacts docker images delete \\
    asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/rag-repo/rag-fastapi:v1
"""
)


# ============================================================
# 18. ASSIGNMENT REFLECTION
# ============================================================

print("\n" + "=" * 70)
print("REFLECTION")
print("=" * 70)

print(
    """
Key concepts learned:

1. Docker packages the application and dependencies
   into a portable container image.

2. The same container can run consistently across
   development and cloud environments.

3. Artifact Registry stores the Docker image.

4. Cloud Run runs the container as a managed serverless
   service.

5. Cloud Run automatically creates immutable revisions
   when a new deployment is made.

6. The application must listen on 0.0.0.0 and use the
   PORT environment variable.

7. Docker + Cloud Run simplifies deployment of AI APIs.
"""
)


# ============================================================
# END
# ============================================================

print("\nAssignment notebook instructions completed.")