"""
Root-level WSGI module for Render deployment.
This imports the actual application from the backend directory.
"""

import os
import sys
import importlib

# Add the backend directory to Python's path
print("Current directory:", os.getcwd())
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
print("Backend path:", backend_path)
print("Backend path exists:", os.path.exists(backend_path))

# Ensure the backend directory is in the Python path
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
    print(f"Added {backend_path} to sys.path")

print("Python path:", sys.path)
print("Files in backend directory:", os.listdir(backend_path) if os.path.exists(backend_path) else "Backend directory not found")

# Add the current directory to the path as well
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    print(f"Added {current_dir} to sys.path")

# Set the Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "edutube.settings")

# Import the actual WSGI application
try:
    # Try different import methods in sequence
    attempts = [
        ('edutube.wsgi', 'Direct import from edutube.wsgi'),
        ('backend.edutube.wsgi', 'Nested import from backend.edutube.wsgi')
    ]
    
    application = None
    last_error = None
    
    for module_path, description in attempts:
        try:
            print(f"Attempting to import {module_path}...")
            module = importlib.import_module(module_path)
            application = getattr(module, 'application', None)
            if application:
                print(f"✅ Successfully imported application from {module_path}")
                break
            else:
                print(f"❌ No application found in {module_path}")
        except ImportError as e:
            print(f"❌ Failed to import from {module_path}: {e}")
            last_error = e
    
    # Check if application was loaded
    if application:
        print("✅ WSGI application loaded successfully")
    else:
        raise ImportError(f"Could not import application from any module path. Last error: {last_error}")
    
except Exception as e:
    print(f"ERROR: Failed to import WSGI application: {e}")
    print(f"Python path: {sys.path}")
    print(f"Backend directory exists: {os.path.exists(backend_path)}")
    print(f"Edutube directory exists: {os.path.exists(os.path.join(backend_path, 'edutube'))}")
    print(f"WSGI file exists: {os.path.exists(os.path.join(backend_path, 'edutube', 'wsgi.py'))}")
    
    # List contents of directories to help debug
    print("Contents of current directory:", os.listdir(os.getcwd()))
    if os.path.exists(backend_path):
        print("Contents of backend directory:", os.listdir(backend_path))
        edutube_path = os.path.join(backend_path, 'edutube')
        if os.path.exists(edutube_path):
            print("Contents of edutube directory:", os.listdir(edutube_path))
    
    # Create a basic WSGI application for error display
    def application(environ, start_response):
        status = '500 Internal Server Error'
        response_headers = [('Content-type', 'text/plain')]
        start_response(status, response_headers)
        
        error_message = f"Failed to import the Django WSGI application: {e}\n"
        error_message += f"Python path: {sys.path}\n"
        error_message += f"Backend directory exists: {os.path.exists(backend_path)}\n"
        error_message += f"Files in backend directory: {os.listdir(backend_path) if os.path.exists(backend_path) else 'N/A'}\n"
        
        return [error_message.encode('utf-8')]

# Output for debugging
print(f"WSGI application loaded successfully from {backend_path}") 