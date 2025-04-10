"""
Root-level WSGI module for Render deployment.
This imports the actual application from the backend directory.
"""

import os
import sys

# Add the backend directory to Python's path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

# Import the actual WSGI application
try:
    from edutube.wsgi import application
except ImportError as e:
    print(f"ERROR: Failed to import 'edutube.wsgi.application': {e}")
    print(f"Python path: {sys.path}")
    print(f"Backend directory exists: {os.path.exists(backend_path)}")
    print(f"Edutube directory exists: {os.path.exists(os.path.join(backend_path, 'edutube'))}")
    print(f"WSGI file exists: {os.path.exists(os.path.join(backend_path, 'edutube', 'wsgi.py'))}")
    
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