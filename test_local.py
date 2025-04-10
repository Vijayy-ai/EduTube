#!/usr/bin/env python
"""
Comprehensive test script for local Django configuration and database connection.
This script will check your Django setup and test the PostgreSQL connection.

Usage:
python test_local.py
"""

import os
import sys
import subprocess
import importlib.util
from pathlib import Path

def print_header(text):
    """Print a header with decoration."""
    print("\n" + "=" * 60)
    print(f" {text} ".center(60, '='))
    print("=" * 60)

def print_step(step):
    """Print a step in the testing process."""
    print(f"\n🔍 {step}")

def test_django_installation():
    """Test if Django is installed."""
    print_step("Checking Django installation")
    
    try:
        import django
        print(f"✅ Django is installed (version: {django.__version__})")
        return True
    except ImportError:
        print("❌ Django is not installed. Please install Django: pip install django")
        return False

def test_project_structure():
    """Test if the project structure is correct."""
    print_step("Checking project structure")
    
    structure_ok = True
    
    # Check backend directory
    if not os.path.exists('backend'):
        print("❌ 'backend' directory not found")
        structure_ok = False
    else:
        print("✅ 'backend' directory found")
    
    # Check Django project
    if not os.path.exists('backend/edutube'):
        print("❌ 'backend/edutube' directory not found")
        structure_ok = False
    else:
        print("✅ 'backend/edutube' directory found")
    
    # Check settings.py
    if not os.path.exists('backend/edutube/settings.py'):
        print("❌ 'backend/edutube/settings.py' not found")
        structure_ok = False
    else:
        print("✅ 'backend/edutube/settings.py' found")
    
    # Check wsgi.py
    if not os.path.exists('backend/edutube/wsgi.py'):
        print("❌ 'backend/edutube/wsgi.py' not found")
        structure_ok = False
    else:
        print("✅ 'backend/edutube/wsgi.py' found")
    
    return structure_ok

def test_environment_variables():
    """Test if environment variables are correctly set."""
    print_step("Checking environment variables")
    
    # Check if .env file exists
    if os.path.exists('backend/.env'):
        print("✅ 'backend/.env' file found")
        
        # Try to load .env file
        try:
            from dotenv import load_dotenv
            load_dotenv('backend/.env')
            print("✅ .env file loaded successfully")
        except ImportError:
            print("❌ python-dotenv not installed. Please install: pip install python-dotenv")
    else:
        print("❌ 'backend/.env' file not found")
    
    # Check critical environment variables
    critical_vars = [
        'SECRET_KEY',
        'DATABASE_URL',
        'DEBUG',
    ]
    
    for var in critical_vars:
        if var in os.environ:
            if var == 'DATABASE_URL':
                # Mask the sensitive details in DATABASE_URL
                db_url = os.environ[var]
                masked_url = mask_sensitive_url(db_url)
                print(f"✅ {var} is set: {masked_url}")
            else:
                print(f"✅ {var} is set" + (": " + os.environ[var] if var == 'DEBUG' else ""))
        else:
            print(f"❌ {var} is not set")

def mask_sensitive_url(url):
    """Mask sensitive information in a URL."""
    if not url:
        return None
    
    # Simple masking for demonstration
    if '@' in url:
        # For database URLs like postgresql://user:password@host:port/dbname
        parts = url.split('@')
        if len(parts) > 1:
            auth_part = parts[0]
            host_part = '@'.join(parts[1:])
            
            if ':' in auth_part and '//' in auth_part:
                scheme_user = auth_part.split(':')
                if len(scheme_user) > 1:
                    return f"{scheme_user[0]}:****@{host_part}"
    
    # If we can't parse properly, just mask most of the URL
    return url[:10] + "..." + url[-10:]

def test_database_connection():
    """Test the database connection."""
    print_step("Testing database connection")
    
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    # Display the masked URL for verification
    masked_url = mask_sensitive_url(db_url)
    print(f"📊 Testing connection to: {masked_url}")
    
    # Try to connect using psycopg2
    try:
        import psycopg2
        
        # Parse the database URL
        if db_url.startswith('postgresql://'):
            # Format: postgresql://user:password@host:port/dbname
            userpass, hostportdb = db_url.split('@', 1)
            userpass = userpass.split('://', 1)[1]
            user, password = userpass.split(':', 1)
            hostport, dbname = hostportdb.split('/', 1)
            if ':' in hostport:
                host, port = hostport.split(':', 1)
                port = int(port)
            else:
                host = hostport
                port = 5432
            
            # Try to connect
            print("🔄 Connecting to PostgreSQL database...")
            conn = psycopg2.connect(
                dbname=dbname,
                user=user,
                password=password,
                host=host,
                port=port
            )
            
            # Check connection
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Successfully connected to PostgreSQL database!")
            print(f"📋 PostgreSQL version: {version[0]}")
            
            # Count tables
            cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
            table_count = cursor.fetchone()[0]
            print(f"📋 Database has {table_count} tables")
            
            cursor.close()
            conn.close()
            return True
            
        else:
            print(f"❌ Unsupported database URL format: {masked_url}")
            return False
            
    except ImportError:
        print("❌ psycopg2 not installed. Please install: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"❌ Failed to connect to database: {str(e)}")
        return False

def test_wsgi_module():
    """Test importing the WSGI module."""
    print_step("Testing WSGI module import")
    
    wsgi_path = Path('backend/edutube/wsgi.py')
    if not wsgi_path.exists():
        print(f"❌ WSGI module not found at expected location: {wsgi_path}")
        return False
    
    try:
        # Add the backend directory to the path
        sys.path.insert(0, str(Path('backend').absolute()))
        
        # Try to import the wsgi module
        import edutube.wsgi
        print("✅ Successfully imported WSGI module")
        
        # Check application attribute
        if hasattr(edutube.wsgi, 'application'):
            print("✅ WSGI application found in module")
            return True
        else:
            print("❌ WSGI module does not have 'application' attribute")
            return False
            
    except ImportError as e:
        print(f"❌ Failed to import WSGI module: {str(e)}")
        return False
    finally:
        # Clean up the path
        if str(Path('backend').absolute()) in sys.path:
            sys.path.remove(str(Path('backend').absolute()))

def main():
    """Main function to run all tests."""
    print_header("Django Local Deployment Test")
    
    # Track overall success
    success = True
    
    # Test Django installation
    if not test_django_installation():
        success = False
    
    # Test project structure
    if not test_project_structure():
        success = False
    
    # Test environment variables
    test_environment_variables()
    
    # Test WSGI module
    if not test_wsgi_module():
        success = False
    
    # Test database connection
    if not test_database_connection():
        success = False
    
    # Print overall result
    print_header("Test Results")
    if success:
        print("✅ All critical tests passed! Your Django application is configured correctly.")
        print("🚀 You can now run the application locally with:")
        print("   - cd backend && python manage.py runserver")
        print("   - OR: python run_gunicorn_local.py")
    else:
        print("❌ Some tests failed. Please fix the issues before deploying.")
    
    return success

if __name__ == "__main__":
    main() 