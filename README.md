# EduTube

A web application for creating educational courses from YouTube content, with built-in quiz generation and blockchain-verified certificates.

## Environment Setup

This project requires several environment variables to be set up. Follow these steps to get started:

### Backend Environment Setup

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit the `backend/.env` file and fill in your own values for each environment variable:
   - Add your Django secret key
   - Add API keys for YouTube, Firebase, ThirdWeb, Pinata, and Cloudinary
   - Configure your database connection

### Frontend Environment Setup

1. Copy the example environment file:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. Edit the `frontend/.env` file and fill in your own values for each environment variable:
   - Add your Firebase configuration
   - Add your YouTube API key
   - Add your ThirdWeb client ID and contract address

## Important Security Notes

- Never commit `.env` files or service account keys to the repository
- The `.gitignore` file is configured to exclude sensitive files like `.env` and `serviceAccountKey.json`
- Make sure to keep your API keys and secrets secure and rotate them regularly

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Features

- Course creation from YouTube videos and playlists
- Automatic quiz generation using AI
- Certificate generation for completed courses
- Blockchain verification of certificates using NFTs
- User dashboard to track progress 