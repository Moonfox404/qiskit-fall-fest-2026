FROM python:3.11

# Set working directory to the backend folder to copy the requirements
WORKDIR /app/backend

# Copy just the requirements file first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies (this layer gets cached unless requirements.txt changes!)
RUN pip install --no-cache-dir -r requirements.txt

# Switch back to the parent directory so module imports like `from backend.models` work perfectly
WORKDIR /app

# Run Uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

