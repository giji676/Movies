# docker/backend/Dockerfile
FROM python:3.13-slim

ARG BUILD_DATE
ENV BUILD_DATE=$BUILD_DATE

WORKDIR /app

# Install system dependencies
COPY backend/requirements.txt ./backend/
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy only requirements first
COPY backend/requirements.txt ./backend/

RUN pip install --upgrade pip && pip install gunicorn && pip install -r backend/requirements.txt

# Copy the rest of the code
COPY backend/ ./backend/
COPY docker/ ./docker/

WORKDIR /app/backend

# Use entrypoint for migrations & gunicorn
ENTRYPOINT ["sh", "/app/docker/backend/wsgi-entrypoint.sh"]
