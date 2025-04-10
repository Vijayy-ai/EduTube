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
    # Not exiting here, will use command line parameters instead
    echo "Usando parámetros de línea de comandos en su lugar"
fi

# Configurar PYTHONPATH para incluir directorio actual y directorio edutube
export PYTHONPATH=$PYTHONPATH:$(pwd):$(pwd)/edutube

echo "PYTHONPATH configurado como: $PYTHONPATH"

# Iniciar Gunicorn
echo "Iniciando Gunicorn..."
if [ -f "gunicorn_config.py" ]; then
    # Usar archivo de configuración
    exec gunicorn -c gunicorn_config.py edutube.wsgi:application
else
    # Usar parámetros de línea de comandos
    exec gunicorn --bind=0.0.0.0:${PORT:-8000} --workers=2 --threads=2 --timeout=120 edutube.wsgi:application
fi 