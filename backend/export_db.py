#!/usr/bin/env python
"""
Script to export data from SQLite to JSON for migration to PostgreSQL.
Run this before deploying to Render:
python export_db.py

After deploying, you can import the data using:
python manage.py loaddata db_export.json
"""

import os
import sys
import django
import json
from datetime import datetime

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edutube.settings')
django.setup()

# Import Django models
from django.apps import apps
from django.core.serializers.json import DjangoJSONEncoder
from django.core.management import call_command

def export_data():
    """Export all data from the SQLite database to a JSON file."""
    print("Exporting data from SQLite database...")
    
    # Create a timestamp for the export file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"db_export_{timestamp}.json"
    
    try:
        # Use Django's dumpdata command to export all data
        call_command('dumpdata', 
                     '--exclude', 'contenttypes', 
                     '--exclude', 'auth.Permission',
                     '--indent', '2',
                     '--output', filename)
        
        print(f"✅ Data exported successfully to {filename}")
        print(f"To import this data to PostgreSQL run: python manage.py loaddata {filename}")
        return True
    except Exception as e:
        print(f"❌ Error exporting data: {str(e)}")
        return False

if __name__ == "__main__":
    export_data() 