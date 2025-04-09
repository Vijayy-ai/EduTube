import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv
import sys

# Add the base directory to the Python path so we can import our wrapper modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-default-key-for-development')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'cloudinary',
    
    # Custom apps
    'api',
    'core',
    'users',
    'courses',
    'quizzes',
    'certificates',
]

MIDDLEWARE = [
    'django.middleware.cache.UpdateCacheMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.cache.FetchFromCacheMiddleware',
]

ROOT_URLCONF = 'edutube.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'edutube.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

# For now, we'll use SQLite for development to ensure the application works
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Once database connection issues are resolved, you can uncomment this code
# to use the PostgreSQL database
"""
# Parse database connection url strings
# The DATABASE_URL environment variable should be set as postgresql://username:password@hostname:port/database_name
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

# Configure timeout for database connections (helps with Supabase)
for database in DATABASES.values():
    database['CONN_MAX_AGE'] = 600  # 10 minutes
    database['CONN_HEALTH_CHECKS'] = True
"""

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/minute',
        'user': '60/minute'
    },
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS settings
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')

# Add CORS settings to allow credentials
CORS_ALLOW_CREDENTIALS = True

# Add additional CORS headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Add CORS methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# API Keys
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

# ThirdWeb settings
THIRDWEB_API_KEY = os.environ.get('THIRDWEB_API_KEY', '')
THIRDWEB_PRIVATE_KEY = os.environ.get('THIRDWEB_PRIVATE_KEY', '')

# IPFS (Pinata) settings
PINATA_API_KEY = os.environ.get('PINATA_API_KEY', '')
PINATA_SECRET_API_KEY = os.environ.get('PINATA_SECRET_API_KEY', '')

# Blockchain settings
BLOCKCHAIN_NETWORK = os.environ.get('BLOCKCHAIN_NETWORK', 'polygon-mumbai')
BLOCKCHAIN_RPC_URL = os.environ.get('BLOCKCHAIN_RPC_URL', 'https://rpc-mumbai.maticvigil.com')

# Site URL - Used for verification links in certificates
SITE_URL = os.environ.get('SITE_URL', 'https://edutube.learn')

# Add caching configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-edutube',
        'TIMEOUT': 300,  # 5 minutes default
    }
}

# Cloudinary Settings
import cloudinary
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
    api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET', ''),
    secure=True
)
