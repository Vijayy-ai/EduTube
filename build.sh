#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r backend/requirements.txt

# Install additional production dependencies
pip install gunicorn psycopg2-binary dj-database-url

# Navigate to the backend directory
cd backend

# Run Django migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --no-input 