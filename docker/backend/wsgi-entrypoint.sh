#!/bin/sh

echo "Starting backend entrypoint..."

# Wait for static volume
until [ -d /app/backend/movie/static/ ]; do
    echo "Waiting for movie volume..."
    sleep 1
done

# Wait for DB & run migrations
until python manage.py migrate; do
    echo "Waiting for DB to be ready..."
    sleep 2
done

# Collect static files
python manage.py collectstatic --noinput

# Start gunicorn
exec gunicorn movie.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 4
