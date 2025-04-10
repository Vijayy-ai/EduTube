#!/bin/bash
# Simple script to start Django with Gunicorn on Render

# Print current directory
echo "Current directory: $(pwd)"
echo "Listing files: $(ls -la)"

# Go to the backend directory
cd backend
echo "Changed to backend directory: $(pwd)"
echo "Listing backend files: $(ls -la)"

# Check if wsgi.py exists in the edutube directory
if [ -f "edutube/wsgi.py" ]; then
    echo "✅ Found edutube/wsgi.py"
else
    echo "❌ ERROR: edutube/wsgi.py not found!"
    exit 1
fi

# Set PYTHONPATH to include the current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)
echo "Set PYTHONPATH to: $PYTHONPATH"

# Start Gunicorn with plain, simple configuration
echo "Starting Gunicorn with Django application..."
exec gunicorn --bind=0.0.0.0:$PORT --workers=2 --threads=2 --timeout=120 edutube.wsgi:application 