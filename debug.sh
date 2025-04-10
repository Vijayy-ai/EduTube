#!/bin/bash
# Debugging script to examine the Render environment

echo "========================"
echo "ENVIRONMENT EXAMINATION"
echo "========================"

echo -e "\n1. CURRENT DIRECTORY AND FILES"
echo "Current location: $(pwd)"
echo "Directory listing:"
ls -la

echo -e "\n2. BACKEND DIRECTORY CONTENTS"
if [ -d "backend" ]; then
  echo "Backend directory exists"
  cd backend
  echo "Contents of backend directory:"
  ls -la
  
  echo -e "\nContents of backend/edutube directory:"
  if [ -d "edutube" ]; then
    ls -la edutube/
    
    if [ -f "edutube/wsgi.py" ]; then
      echo -e "\nContent of wsgi.py file:"
      cat edutube/wsgi.py
    else
      echo "wsgi.py not found!"
    fi
  else
    echo "edutube directory not found!"
  fi
  
  cd ..
else
  echo "backend directory not found!"
fi

echo -e "\n3. PYTHON PATH"
echo "PYTHONPATH: $PYTHONPATH"

echo -e "\n4. PYTHON VERSION"
python --version

echo -e "\n5. INSTALLED PACKAGES"
pip list | grep -E 'django|gunicorn'

echo "========================"
echo "END OF DEBUG INFORMATION"
echo "========================" 