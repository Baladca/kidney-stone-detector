FROM pytorch/pytorch:2.2.0-cuda11.8-cudnn8-runtime

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir "numpy<2"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .


ENV YOLO_CONFIG_DIR=/tmp 
ENV PYTHONUNBUFFERED=1

EXPOSE 7860

CMD ["gunicorn", "-b", "0.0.0.0:7860", "--timeout", "120", "--workers", "1", "--threads", "4", "--worker-class", "gthread", "app:app"]