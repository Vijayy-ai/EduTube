#!/usr/bin/env bash
# exit on error
set -o errexit

# Check Python version
echo "Checking Python version"
python --version
echo "Required Python version: 3.10.7"

# Attempt to use Python 3.10 if available
if command -v python3.10 &> /dev/null; then
    echo "Python 3.10 is available, using it..."
    alias python=python3.10
    python --version
fi

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

# Create a custom startup script in the project root
echo "Creating custom startup script..."
cd ..
cat > start_server.sh << 'EOF'
#!/bin/bash
# Custom startup script for Render

# Set working directory to backend
cd /opt/render/project/src/backend

# Add backend directory to Python path
export PYTHONPATH=/opt/render/project/src:/opt/render/project/src/backend

# Print environment for debugging
echo "PYTHONPATH: $PYTHONPATH"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Start Gunicorn with the correct module path
exec gunicorn --bind=0.0.0.0:${PORT:-10000} --workers=2 --threads=2 --timeout=120 edutube.wsgi:application
EOF

# Make the script executable
chmod +x start_server.sh
echo "Custom startup script created successfully" 