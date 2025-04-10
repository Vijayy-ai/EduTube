#!/usr/bin/env python
"""
Direct WSGI connector for the Django application.
This file should be executed with Python path properly set.
"""

import os
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('backend_wsgi')

logger.info("Initializing backend_wsgi.py")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Current Python path: {sys.path}")

# Ensure backend is in the path
BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
    logger.info(f"Added backend directory to Python path: {BACKEND_DIR}")

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edutube.settings')
logger.info(f"Django settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")

# Import Django and the application
try:
    import django
    logger.info(f"Django version: {django.get_version()}")
    
    # This will import application from backend/edutube/wsgi.py
    from edutube.wsgi import application
    logger.info("Successfully imported application object from edutube.wsgi")
    
except Exception as e:
    logger.error(f"Error importing Django application: {e}", exc_info=True)
    
    # Create a fallback application for debugging
    def application(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-type', 'text/plain')]
        start_response(status, headers)
        
        error_message = [
            f"Failed to import Django application: {str(e)}",
            f"Python path: {sys.path}",
            f"Current directory: {os.getcwd()}",
            f"Backend directory exists: {os.path.exists(BACKEND_DIR)}"
        ]
        
        if os.path.exists(BACKEND_DIR):
            error_message.append(f"Backend directory contents: {os.listdir(BACKEND_DIR)}")
            
            edutube_dir = os.path.join(BACKEND_DIR, 'edutube')
            if os.path.exists(edutube_dir):
                error_message.append(f"edutube directory contents: {os.listdir(edutube_dir)}")
            else:
                error_message.append("edutube directory does not exist")
        
        return [('\n'.join(error_message)).encode('utf-8')]

# Log that we've completed initialization
logger.info("backend_wsgi.py initialization complete") 