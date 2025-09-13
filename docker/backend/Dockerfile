# docker/backend/Dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt ./backend/

RUN apt-get update && \
    apt-get install -y ffmpeg

COPY backend/ ./backend/
COPY docker/ ./docker/

RUN pip install --upgrade pip
RUN pip install gunicorn
RUN pip install -r backend/requirements.txt

WORKDIR /app/backend
