FROM python:3.11-slim

WORKDIR /app

# Install system libraries for FAISS OpenMP and Matplotlib rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port (Railway dynamically binds $PORT)
ENV PORT=8000
ENV CUDA_VISIBLE_DEVICES=-1
ENV OMP_NUM_THREADS=1
ENV TOKENIZERS_PARALLELISM=false
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
