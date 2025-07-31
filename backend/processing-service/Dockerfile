FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y netcat-openbsd
COPY . /app
RUN pip install --no-cache-dir fastapi uvicorn[standard] aiokafka
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]