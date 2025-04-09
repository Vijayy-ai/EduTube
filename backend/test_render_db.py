#!/usr/bin/env python
"""
Script to test connection to the specific Render PostgreSQL database.
Run this to verify your database connection:
python test_render_db.py
"""

import os
import sys
import psycopg2
import socket
from urllib.parse import urlparse

# The database URL to test
DATABASE_URL = "postgresql://edutube_db_user:d4QuV99nvpcVQYPmRJOzjUrGWjIBuJKc@dpg-cvrds7ggjchc73b77280-a.oregon-postgres.render.com/edutube_db"

def parse_db_url(url):
    """Parse database URL into components."""
    parsed = urlparse(url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],
        'user': parsed.username,
        'password': parsed.password
    }

def test_connectivity(host, port=5432):
    """Test if we can reach the database host."""
    print(f"Testing connectivity to host: {host} on port {port}...")
    try:
        # Try to resolve the hostname
        host_ip = socket.gethostbyname(host)
        print(f"✅ Hostname resolved to IP: {host_ip}")
        
        # Try to connect to the port
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)  # 5 second timeout
        result = sock.connect_ex((host_ip, port))
        if result == 0:
            print(f"✅ Successfully connected to {host}:{port}")
            sock.close()
            return True
        else:
            print(f"❌ Could not connect to {host}:{port}, error code: {result}")
            sock.close()
            return False
    except socket.gaierror:
        print(f"❌ Hostname {host} could not be resolved")
        return False
    except socket.error as e:
        print(f"❌ Socket error: {e}")
        return False

def test_psycopg2_connection():
    """Test connection using psycopg2."""
    print("\nTesting database connection with psycopg2...")
    
    # Parse the URL
    db_config = parse_db_url(DATABASE_URL)
    
    print(f"Database: {db_config['database']}")
    print(f"Host: {db_config['host']}")
    print(f"Port: {db_config['port']}")
    print(f"User: {db_config['user']}")
    
    try:
        # Test connectivity first
        if not test_connectivity(db_config['host'], db_config['port']):
            print("\nNetwork connectivity issues detected.")
            print("This could be due to:")
            print("1. Firewall blocking outbound connections")
            print("2. Database server is down or unreachable")
            print("3. Incorrect hostname or port")
            return False
        
        # Try connecting
        print("\nAttempting database connection...")
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            dbname=db_config['database'],
            user=db_config['user'],
            password=db_config['password'],
            connect_timeout=10,
            sslmode='require'
        )
        
        print("✅ Successfully connected to the database!")
        
        # Test a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"PostgreSQL version: {version[0]}")
        
        # Check for existing tables
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        table_count = cursor.fetchone()[0]
        print(f"Number of tables in database: {table_count}")
        
        if table_count == 0:
            print("\nDatabase appears to be empty. You'll need to run migrations.")
        else:
            # Get table names
            cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5;")
            tables = cursor.fetchall()
            print("Sample tables:", ", ".join([table[0] for table in tables]))
        
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("\nPossible issues:")
        print("1. Invalid database credentials")
        print("2. Database doesn't exist")
        print("3. Network connectivity issues")
        print("4. Firewall blocking the connection")
        return False

if __name__ == "__main__":
    print("=== RENDER POSTGRESQL CONNECTION TEST ===\n")
    test_psycopg2_connection()
    print("\n=== TEST COMPLETE ===") 