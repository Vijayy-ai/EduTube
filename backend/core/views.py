from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint to verify API is working
    """
    # Check database connection
    is_db_connected = True
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        is_db_connected = False
    
    return Response({
        "status": "ok",
        "database": "connected" if is_db_connected else "disconnected",
        "service": "EduTube API"
    })
