# Render Deployment Guide

This document guides you through deploying the EduTube application to Render with your existing PostgreSQL database.

## Pre-Deployment Checklist

1. Make sure you have:
   - A GitHub repository with your code
   - Your Render PostgreSQL database (already created)
   - Your Render account

## Step 1: Test Database Connection Locally

Before deploying, you can test your database connection:

```bash
cd backend
python test_render_db.py
```

This script will verify if your Render PostgreSQL database is accessible.

## Step 2: Deploy to Render

1. **Log in** to your Render dashboard: https://dashboard.render.com

2. **Create a new Web Service**:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository that contains your code

3. **Configure the service**:
   - Name: `edutube-backend` (or your preferred name)
   - Make sure "Use render.yaml from repository" is selected
   - Click "Create Web Service"

4. **Wait for deployment**:
   - Render will automatically:
     - Install dependencies from requirements.txt
     - Set the DATABASE_URL to your specific PostgreSQL connection string
     - Run migrations
     - Start the Django application

## Step 3: Run Migrations (if needed)

If your database is empty or you need to run migrations, you can do it from the Render dashboard:

1. Go to your Web Service
2. Click on "Shell"
3. Run the following commands:
   ```bash
   cd backend
   python manage.py migrate
   ```

## Step 4: Create a superuser (if needed)

To access the admin panel:

1. Go to your Web Service
2. Click on "Shell"
3. Run:
   ```bash
   cd backend
   python manage.py createsuperuser
   ```
4. Follow the prompts to create an admin user

## Step 5: Import Data (if needed)

If you want to import data from your local SQLite database:

1. Export the data locally:
   ```bash
   cd backend
   python export_db.py
   ```

2. Upload the exported JSON file to Render:
   - Go to your Web Service
   - Click on "Shell"
   - Use an editor like `nano` to paste your JSON data:
     ```bash
     cd backend
     nano db_export.json
     # Paste your JSON data and save (Ctrl+X, then Y)
     ```

3. Import the data:
   ```bash
   python manage.py loaddata db_export.json
   ```

## Troubleshooting

If you encounter issues:

1. **Check logs** in the Render dashboard for errors
2. **Verify database connection** using the test script
3. **Check environment variables** are correctly set
4. **Ensure migrations** have run successfully

## Database Configuration

Your web service is configured with this database URL:
```
postgresql://edutube_db_user:d4QuV99nvpcVQYPmRJOzjUrGWjIBuJKc@dpg-cvrds7ggjchc73b77280-a.oregon-postgres.render.com/edutube_db
```

This is specified directly in your `render.yaml` file so no additional setup is required. 