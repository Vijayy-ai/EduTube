"""
Configuración de Gunicorn para Render
"""

import multiprocessing
import os

# Configuración base de Gunicorn
bind = "0.0.0.0:" + os.environ.get("PORT", "8000")
workers = multiprocessing.cpu_count() * 2 + 1
threads = 2

# Configuración de logging
loglevel = 'debug'
accesslog = '-'
errorlog = '-'

# Configuración de timeout
timeout = 120

# Configuración específica para Django
raw_env = [
    f"DJANGO_SETTINGS_MODULE=edutube.settings",
]

# Configuración del directorio de trabajo
# Esto es importante para que Gunicorn encuentre correctamente el módulo WSGI
chdir = os.path.dirname(os.path.abspath(__file__))

# Configuración del módulo WSGI
wsgi_app = "edutube.wsgi:application" 