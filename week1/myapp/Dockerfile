# Use official Python base image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Copy local code to container
COPY . .

# Install required Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Expose port for API
EXPOSE 8000

# Start the FastAPI app using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]