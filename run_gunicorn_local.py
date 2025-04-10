#!/usr/bin/env python
"""
Script to test running Gunicorn locally with the Django application.
Run this to verify your Gunicorn configuration before deploying to Render.

Usage:
python run_gunicorn_local.py
"""

import os
import subprocess
import sys
import time

def check_django_app():
    """Check if the Django application exists and is properly configured."""
    if not os.path.exists('backend'):
        print("❌ ERROR: 'backend' directory not found")
        return False
    
    if not os.path.exists('backend/edutube/wsgi.py'):
        print("❌ ERROR: 'backend/edutube/wsgi.py' not found")
        return False
    
    print("✅ Django application found with proper WSGI configuration")
    return True

def check_gunicorn_installation():
    """Check if Gunicorn is installed."""
    try:
        import gunicorn
        print(f"✅ Gunicorn is installed (version: {gunicorn.__version__})")
        return True
    except ImportError:
        print("❌ ERROR: Gunicorn is not installed")
        print("Please install Gunicorn: pip install gunicorn")
        return False

def run_gunicorn():
    """Run Gunicorn with the Django application."""
    os.chdir('backend')  # Change to the backend directory
    
    print("\n=== Starting Gunicorn with Django application ===")
    print("Press Ctrl+C to stop the server")
    print("Application will be available at http://localhost:8000\n")
    
    try:
        # First, try with gunicorn_config.py if it exists
        if os.path.exists('gunicorn_config.py'):
            print("Using gunicorn_config.py for configuration")
            subprocess.run(['gunicorn', '-c', 'gunicorn_config.py', 'edutube.wsgi:application'])
        else:
            # Otherwise, use command line arguments
            print("Using command line arguments for configuration")
            subprocess.run([
                'gunicorn',
                '--bind', '0.0.0.0:8000',
                '--workers', '2',
                '--threads', '2',
                '--timeout', '120',
                'edutube.wsgi:application'
            ])
    except KeyboardInterrupt:
        print("\nGunicorn server stopped")
    except Exception as e:
        print(f"\n❌ ERROR running Gunicorn: {e}")
    finally:
        os.chdir('..')  # Change back to the root directory

def main():
    """Main function to check configuration and run Gunicorn."""
    print("=== Gunicorn Local Test ===\n")
    
    if not check_django_app():
        print("\nPlease run this script from the root directory of your project")
        return
    
    if not check_gunicorn_installation():
        return
    
    run_gunicorn()

if __name__ == "__main__":
    main() 