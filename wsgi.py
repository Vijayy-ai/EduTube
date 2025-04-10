"""
Root-level WSGI module for Render deployment.
This acts as a proxy to the actual WSGI application in the backend directory.
"""

import os
import sys
import logging

# Set up basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('wsgi')

logger.info("Starting WSGI application")
logger.info(f"Current directory: {os.getcwd()}")

# Add the backend directory to Python's path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
    logger.info(f"Added {backend_path} to sys.path")

# Set the Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "edutube.settings")

# Import the application
try:
    # Import Django to verify the setup
    import django
    logger.info(f"Django version: {django.get_version()}")
    
    # Import the actual WSGI application from backend/edutube/wsgi.py
    from edutube.wsgi import application
    logger.info("Successfully imported application from edutube.wsgi")
    
except Exception as e:
    logger.error(f"Failed to import WSGI application: {str(e)}", exc_info=True)
    logger.error(f"Python path: {sys.path}")
    
    # Check if key files and directories exist
    logger.info(f"Backend directory exists: {os.path.exists(backend_path)}")
    edutube_path = os.path.join(backend_path, 'edutube')
    logger.info(f"Edutube directory exists: {os.path.exists(edutube_path)}")
    wsgi_path = os.path.join(edutube_path, 'wsgi.py')
    logger.info(f"WSGI file exists: {os.path.exists(wsgi_path)}")
    
    # List contents of key directories
    try:
        logger.info(f"Current directory contents: {os.listdir(os.getcwd())}")
        if os.path.exists(backend_path):
            logger.info(f"Backend directory contents: {os.listdir(backend_path)}")
            if os.path.exists(edutube_path):
                logger.info(f"Edutube directory contents: {os.listdir(edutube_path)}")
    except Exception as list_error:
        logger.error(f"Error listing directories: {str(list_error)}")
    
    # Provide a fallback application for error reporting
    def application(environ, start_response):
        status = '500 Internal Server Error'
        response_headers = [('Content-type', 'text/plain')]
        start_response(status, response_headers)
        
        error_message = f"Failed to import the Django WSGI application: {e}\n"
        error_message += f"Python path: {sys.path}\n"
        error_message += f"Backend directory exists: {os.path.exists(backend_path)}\n"
        
        return [error_message.encode('utf-8')]

# Log success
logger.info("WSGI proxy setup complete") 