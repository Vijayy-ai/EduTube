#!/usr/bin/env bash
# exit on error
set -o errexit

# Print current directory
echo "Current directory: $(pwd)"
echo "Listing files: $(ls -la)"

# Check if backend/requirements.txt exists
if [ -f "backend/requirements.txt" ]; then
    echo "Found backend/requirements.txt"
else
    echo "ERROR: backend/requirements.txt not found!"
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies from backend/requirements.txt"
pip install -r backend/requirements.txt

# Install additional production dependencies
echo "Installing additional production dependencies"
pip install gunicorn psycopg2-binary dj-database-url whitenoise

# Navigate to the backend directory
cd backend

# Run Django migrations
echo "Running Django migrations"
python manage.py migrate

# Collect static files
echo "Collecting static files"
python manage.py collectstatic --no-input 