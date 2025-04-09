#!/usr/bin/env bash
# Script para iniciar la aplicación con Gunicorn en Render

# Cambiar al directorio backend
cd backend

# Mostrar directorio actual y archivos para depuración
echo "Directorio actual: $(pwd)"
echo "Archivos en el directorio: $(ls -la)"

# Mostrar el archivo wsgi.py
echo "Contenido de la carpeta edutube:"
ls -la edutube/

# Verificar si el módulo WSGI existe
if [ -f "edutube/wsgi.py" ]; then
    echo "✅ Archivo wsgi.py encontrado"
else
    echo "❌ ERROR: No se encontró el archivo wsgi.py"
    exit 1
fi

# Verificar si existe el archivo de configuración de Gunicorn
if [ -f "gunicorn_config.py" ]; then
    echo "✅ Archivo de configuración de Gunicorn encontrado"
else
    echo "❌ ERROR: No se encontró el archivo de configuración de Gunicorn"
    exit 1
fi

# Configurar PYTHONPATH si es necesario
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Iniciar Gunicorn con el archivo de configuración
echo "Iniciando Gunicorn con archivo de configuración..."
exec gunicorn -c gunicorn_config.py 