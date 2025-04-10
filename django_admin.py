#!/usr/bin/env python
"""
Django Admin Wrapper Script.
This script provides a proxy to the Django manage.py commands with the correct Python path.

Usage:
  python django_admin.py [command] [args]

Examples:
  python django_admin.py check
  python django_admin.py migrate
  python django_admin.py createsuperuser
"""

import os
import sys
import subprocess

def main():
    """Set up the environment and run Django manage.py command."""
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Set up the backend path
    backend_dir = os.path.join(current_dir, 'backend')
    
    # Ensure backend is in the Python path
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edutube.settings')
    
    # Check if managep.py exists
    manage_py = os.path.join(backend_dir, 'manage.py')
    if not os.path.exists(manage_py):
        print(f"Error: manage.py not found at {manage_py}")
        sys.exit(1)
    
    # Get command line arguments
    if len(sys.argv) > 1:
        args = sys.argv[1:]
    else:
        print("No command specified. Usage: python django_admin.py [command] [args]")
        print("Example: python django_admin.py migrate")
        sys.exit(1)
    
    # Execute the manage.py command
    os.chdir(backend_dir)  # Change to backend directory
    
    # Print some debug info
    print(f"Current directory: {os.getcwd()}")
    print(f"Running command: python manage.py {' '.join(args)}")
    
    # Run the command
    cmd = [sys.executable, 'manage.py'] + args
    subprocess.run(cmd)

if __name__ == '__main__':
    main() 