#!/usr/bin/env python
"""
Manual deployment script for Django on Render.
This script sets up the proper Python path and runs Gunicorn directly.
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Set up environment and start Gunicorn."""
    print("=" * 50)
    print("Manual Django Deployment Script")
    print("=" * 50)
    
    # Get backend directory
    backend_dir = Path('backend').absolute()
    
    # Check if the backend directory exists
    if not backend_dir.exists():
        print(f"ERROR: Backend directory not found at {backend_dir}")
        sys.exit(1)
    
    # Add the backend directory to Python path
    sys.path.insert(0, str(backend_dir))
    os.environ['PYTHONPATH'] = f"{os.environ.get('PYTHONPATH', '')}:{str(backend_dir)}"
    
    # Check if edutube/wsgi.py exists
    wsgi_path = backend_dir / 'edutube' / 'wsgi.py'
    if not wsgi_path.exists():
        print(f"ERROR: WSGI file not found at {wsgi_path}")
        sys.exit(1)
    
    print(f"Found WSGI file at {wsgi_path}")
    
    # Set the working directory to backend
    os.chdir(backend_dir)
    print(f"Changed working directory to {os.getcwd()}")
    
    # Print environment info
    print("\nEnvironment:")
    print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'Not set')}")
    print(f"PORT: {os.environ.get('PORT', '10000')}")
    
    # Get the port from environment or default to 10000
    port = os.environ.get('PORT', '10000')
    
    # Start Gunicorn
    print("\nStarting Gunicorn...")
    cmd = [
        'gunicorn',
        '--bind', f'0.0.0.0:{port}',
        '--workers', '2',
        '--threads', '2',
        '--timeout', '120',
        'edutube.wsgi:application'
    ]
    
    print(f"Running command: {' '.join(cmd)}")
    
    # Execute Gunicorn
    try:
        subprocess.run(cmd)
    except Exception as e:
        print(f"Error running Gunicorn: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 