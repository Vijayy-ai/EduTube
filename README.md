# EduTube Learning Platform

A modern online learning platform built with Django and React.

## Local Development with SQLite

The project is configured to use SQLite for local development, making it easier to set up and test.

### Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Edutube
   ```

2. Set up the backend:
   ```
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

3. Set up the frontend:
   ```
   cd frontend
   npm install
   npm start
   ```

4. Access the application at http://localhost:3000

## Deploying to Render

The project is configured to deploy to Render with automatic PostgreSQL database setup.

### Deployment Instructions

1. Before deploying, export your local data (if needed):
   ```
   cd backend
   python export_db.py
   ```
   This creates a JSON file with your local data.

2. Push your code to GitHub.

3. Connect your GitHub repo to Render.

4. Create a new Web Service in Render:
   - Choose "Build and deploy from a Git repository"
   - Select your GitHub repo
   - The `render.yaml` file will automatically configure:
     - The Django backend service
     - A PostgreSQL database
     - All necessary environment variables

5. After deployment is complete, you can import your local data (if needed):
   - Go to the Render dashboard
   - Open a shell for your backend service
   - Upload your exported JSON file
   - Run:
     ```
     python manage.py loaddata your_export_file.json
     ```

### Important Notes

- The project automatically uses SQLite locally and PostgreSQL on Render
- The `DATABASE_URL` environment variable is automatically set by Render
- All other required environment variables are defined in `render.yaml`

## Troubleshooting

If you encounter database connection issues on Render:

1. Check the logs in the Render dashboard
2. Verify that the PostgreSQL database service is running
3. The database connection is automatically managed by Render through the `DATABASE_URL` environment variable

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html) 