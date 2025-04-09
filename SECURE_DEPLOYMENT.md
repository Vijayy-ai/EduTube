# Secure Deployment Guide for EduTube

This guide explains how to securely deploy EduTube with proper handling of sensitive information and environment variables.

## Backend Deployment to Render

### Step 1: Prepare Your Environment Variables

1. **Create a secure set of environment variables** in Render:
   - Log in to Render dashboard
   - Create a new Web Service or select your existing one
   - Go to "Environment" tab
   - Add the following environment variables from your `.env` file:

   ```
   # Database 
   DATABASE_URL=postgresql://edutube_db_user:d4QuV99nvpcVQYPmRJOzjUrGWjIBuJKc@dpg-cvrds7ggjchc73b77280-a.oregon-postgres.render.com/edutube_db
   
   # API Keys
   YOUTUBE_API_KEY=your_youtube_api_key
   GEMINI_API_KEY=your_gemini_api_key
   
   # Cloudinary 
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Firebase
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   
   # ThirdWeb
   THIRDWEB_API_KEY=your_thirdweb_api_key
   THIRDWEB_PRIVATE_KEY=your_thirdweb_private_key
   
   # IPFS (Pinata)
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_api_key
   ```

   Replace `your_*` values with the actual values from your local `.env` file.

### Step 2: Deploy Your Backend

1. **Push your code** to GitHub, including the updated `render.yaml` file

2. **Create a new Web Service** in Render:
   - Connect to your GitHub repository
   - Select "Use render.yaml configuration"
   - Click "Create Web Service"

3. **After deployment**:
   - Your backend will be available at: `https://edutube-backend.onrender.com` (or your custom service name)
   - Admin panel will be at: `https://edutube-backend.onrender.com/admin/`
   - API endpoints will be at: `https://edutube-backend.onrender.com/api/`

4. **Run migrations** from the Render Shell:
   ```bash
   cd backend
   python manage.py migrate
   ```

5. **Create a superuser**:
   ```bash
   python manage.py createsuperuser
   ```

### Step 3: Where to Find Backend URLs

After your backend is deployed on Render, you'll have the following URLs:

- **Main Backend URL**: `https://edutube-backend.onrender.com` (replace with your actual service name)
- **API Base URL**: `https://edutube-backend.onrender.com/api/`
- **Admin Panel**: `https://edutube-backend.onrender.com/admin/`
- **API Token Authentication**: `https://edutube-backend.onrender.com/api-token-auth/`
- **Certificate Verification**: `https://edutube-backend.onrender.com/api/certificates/verify/{certificate_id}/`

You'll need these URLs for configuring your frontend.

## Frontend Deployment to Vercel

### Step 1: Update Frontend Environment Variables

1. Create a file `.env.production` in your frontend directory with updated backend URLs:
   ```
   REACT_APP_API_URL=https://edutube-backend.onrender.com/api
   REACT_APP_AUTH_API_URL=https://edutube-backend.onrender.com/api-token-auth
   
   # Firebase
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   
   # YouTube
   REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
   
   # ThirdWeb
   REACT_APP_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
   REACT_APP_THIRDWEB_CHAIN=polygon-mumbai
   REACT_APP_NFT_CONTRACT_ADDRESS=your_nft_contract_address
   
   # Build settings
   DISABLE_ESLINT_PLUGIN=true
   CI=false
   ```

### Step 2: Deploy to Vercel

1. **Login to Vercel**: https://vercel.com

2. **Import your GitHub repository**:
   - Click "Add New" → "Project"
   - Select your repository
   - Configure the project:
     - Framework: Create React App
     - Root Directory: `frontend`
     - Build Command: `npm run build:no-lint`
     - Output Directory: `build`

3. **Add Environment Variables**:
   - Go to "Settings" → "Environment Variables"
   - Add all variables from your `.env.production` file
   - Make sure to add each variable separately

4. **Deploy**:
   - Click "Deploy" and wait for the build to complete
   - Your frontend will be available at the URL provided by Vercel

### Step 3: Verify Deployment

1. Test your frontend by navigating to the Vercel URL
2. Make sure API calls are working (login, fetching content, etc.)

## Security Best Practices

1. **Never commit secrets** to your repository:
   - Ensure `.env` files are in `.gitignore`
   - Keep sensitive values in environment variables only

2. **Rotate API keys** periodically:
   - Update keys in Render and Vercel dashboards
   - No need to update your code

3. **Use environment-specific settings**:
   - Development: SQLite database locally
   - Production: PostgreSQL on Render

4. **Maintain secure connections**:
   - Ensure HTTPS is used for all communications
   - Set proper CORS headers (already configured in render.yaml)

## Troubleshooting

1. **Backend API not accessible**:
   - Check if your Render service is running
   - Verify the DATABASE_URL is correctly set
   - Check the logs in Render dashboard

2. **Frontend not connecting to backend**:
   - Verify the REACT_APP_API_URL points to your Render backend
   - Check browser console for CORS errors
   - Ensure your backend allows requests from your Vercel domain

3. **Database connection issues**:
   - Run the test script locally:
     ```bash
     cd backend
     python test_render_db.py
     ```
   - Check Render logs for connection errors 