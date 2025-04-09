#!/usr/bin/env python
"""
Script to extract environment variables from .env files and format them for Render and Vercel dashboards.
Run this script to get environment variables in a format that can be easily copied to deployment platforms.

Usage:
python setup-env-vars.py
"""

import os
import re
from pathlib import Path

def parse_env_file(file_path):
    """Parse a .env file and return a dictionary of key-value pairs."""
    env_vars = {}
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return env_vars
    
    with open(file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            
            # Split at the first equals sign
            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip()
            
            # Store in dictionary
            if key and key not in env_vars:
                env_vars[key] = value
    
    return env_vars

def format_for_render(env_vars):
    """Format environment variables for Render dashboard."""
    output = []
    output.append("=== RENDER ENVIRONMENT VARIABLES ===")
    output.append("Copy and paste these into your Render dashboard Environment variables section:")
    output.append("")
    
    for key, value in env_vars.items():
        output.append(f"Key: {key}")
        output.append(f"Value: {value}")
        output.append("")
    
    return "\n".join(output)

def format_for_vercel(env_vars):
    """Format environment variables for Vercel dashboard."""
    output = []
    output.append("=== VERCEL ENVIRONMENT VARIABLES ===")
    output.append("Copy and paste these into your Vercel project Settings > Environment Variables section:")
    output.append("")
    
    for key, value in env_vars.items():
        output.append(f"Name: {key}")
        output.append(f"Value: {value}")
        output.append("")
    
    return "\n".join(output)

def main():
    """Main function to extract and display environment variables."""
    # Define base directory
    base_dir = Path(__file__).resolve().parent
    
    # Backend environment variables
    backend_env_path = os.path.join(base_dir, 'backend', '.env')
    backend_vars = parse_env_file(backend_env_path)
    
    # Frontend environment variables
    frontend_env_path = os.path.join(base_dir, 'frontend', '.env')
    frontend_vars = parse_env_file(frontend_env_path)
    
    # Print results to console
    print("\n=== DATABASE URL ===")
    database_url = backend_vars.get('DATABASE_URL', '')
    if not database_url:
        database_url = "postgresql://edutube_db_user:d4QuV99nvpcVQYPmRJOzjUrGWjIBuJKc@dpg-cvrds7ggjchc73b77280-a.oregon-postgres.render.com/edutube_db"
        print("DATABASE_URL not found in .env file. Using test database URL:")
    print(f"DATABASE_URL={database_url}")
    print("\nMake sure to add this to your Render environment variables!")
    
    print("\n" + "="*60 + "\n")
    
    # Add the DATABASE_URL to backend_vars if not present
    if 'DATABASE_URL' not in backend_vars:
        backend_vars['DATABASE_URL'] = database_url
    
    # Format for Render
    print(format_for_render(backend_vars))
    
    print("\n" + "="*60 + "\n")
    
    # Format for Vercel
    print(format_for_vercel(frontend_vars))
    
    # Save to files for easy reference
    with open('render-env-vars.txt', 'w') as f:
        f.write(format_for_render(backend_vars))
    
    with open('vercel-env-vars.txt', 'w') as f:
        f.write(format_for_vercel(frontend_vars))
    
    print("\n" + "="*60)
    print("Files 'render-env-vars.txt' and 'vercel-env-vars.txt' have been created")
    print("You can use these files to copy environment variables for deployment")
    print("="*60 + "\n")

if __name__ == "__main__":
    main() 