# Supabase PostgreSQL Setup Guide for EduTube

This guide will help you set up the PostgreSQL database connection with Supabase for the EduTube project.

## Prerequisites

1. Ensure you have the following packages installed in your virtual environment:
   ```bash
   pip install dj-database-url python-dotenv psycopg2-binary
   ```

2. Make sure your Supabase project is active and the database is running.

## Configuration Steps

### 1. Verify Supabase Connection Information

1. Log in to your Supabase dashboard at https://app.supabase.io
2. Go to your project settings
3. Under "Database" tab, find your connection information:
   - Host: `db.vunvgtxwvkzaccbgcpph.supabase.co`
   - Database name: `postgres`
   - User: `postgres`
   - Password: Your Supabase database password
   - Port: `5432`

### 2. Test Connectivity

Before configuring your application, test if you can connect to the database:

```bash
# Install psql command line tool if needed
psql -h db.vunvgtxwvkzaccbgcpph.supabase.co -U postgres -d postgres
```

You'll be prompted for your password. If you can connect, the database is accessible from your network.

### 3. Setup Your .env File

Make sure your `.env` file has the correct connection string:

```
DATABASE_URL=postgresql://postgres:your_password_here@db.vunvgtxwvkzaccbgcpph.supabase.co:5432/postgres
```

Note: Special characters in your password need to be URL-encoded:
- Replace `@` with `%40`
- Replace `#` with `%23`
- Replace `&` with `%26`
- Replace `+` with `%2B`

### 4. Configure settings.py

Update your `settings.py` file to use the database URL:

```python
import dj_database_url
from dotenv import load_dotenv

load_dotenv()

# Parse database connection url strings
database_url = os.environ.get('DATABASE_URL', None)

if database_url:
    # Use the DATABASE_URL environment variable
    DATABASES = {
        'default': dj_database_url.parse(database_url)
    }
else:
    # Fallback to SQLite if no DATABASE_URL is provided
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Configure timeout for database connections
for database in DATABASES.values():
    database['CONN_MAX_AGE'] = 600  # 10 minutes
    database['CONN_HEALTH_CHECKS'] = True
```

### 5. Troubleshooting Connection Issues

If you're experiencing connection issues, consider:

1. **Network Issues**: 
   - Make sure you don't have firewall restrictions blocking PostgreSQL
   - Consider using pgAdmin to test your connection visually
   - Check if your IP is whitelisted in Supabase settings

2. **DNS Resolution**:
   - If hostname cannot be resolved, try using the direct IP address instead
   - You can get the IP address by pinging the hostname or using DNS lookup tools

3. **SSL Requirements**:
   - Supabase may require SSL connections. Add `?sslmode=require` to your connection string:
   ```
   DATABASE_URL=postgresql://postgres:your_password_here@db.vunvgtxwvkzaccbgcpph.supabase.co:5432/postgres?sslmode=require
   ```

4. **Connection Pooling**:
   - Supabase has connection limits. Use a connection pooler if needed

### 6. Migrate Your Schema

Once connected, run migrations:

```bash
python manage.py migrate
```

### 7. Advanced: Database Backup and Restore

When moving from SQLite to PostgreSQL, you might need to transfer data:

1. Dump your SQLite data:
   ```bash
   python manage.py dumpdata > data_backup.json
   ```

2. Connect to PostgreSQL and load the data:
   ```bash
   python manage.py loaddata data_backup.json
   ```

## Next Steps

Once your database is properly configured, focus on:

1. Creating necessary tables via migrations
2. Setting up API endpoints
3. Connecting your frontend to the backend API

For any issues connecting to Supabase, check their documentation or contact their support for specific networking requirements that may not be covered here. 