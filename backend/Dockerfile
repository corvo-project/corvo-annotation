FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE ${PORT}

# Shell form so that $PORT is expanded at runtime; exec keeps uvicorn as PID 1
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --root-path /igg-annotation/api"]
