# Use a light Python image
FROM python:3.10-slim

# Set the working directory to /app
WORKDIR /app

# Copy your requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all your project files into the container
COPY . .

# Expose the port FastAPI uses (7860 is the default for HF Spaces)
EXPOSE 7860

# Command to run your FastAPI app
# Make sure "api:app" matches your filename (api.py) and variable name (app)
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]