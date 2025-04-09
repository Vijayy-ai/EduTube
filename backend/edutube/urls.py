from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken import views as auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include([
        # Core app endpoints (health checks, etc.)
        path('', include('core.urls')),
        
        # User management
        path('', include('users.urls')),
        
        # Courses app - main functionality
        path('', include('courses.urls')),
        
        # Quizzes app
        path('', include('quizzes.urls')),
        
        # Certificates app
        path('', include('certificates.urls')),
        
        # Legacy API endpoints (marked for deprecation)
        # These should eventually be removed or properly refactored
        path('legacy/', include('api.urls')),
    ])),
    
    # Authentication endpoints
    path('api-auth/', include('rest_framework.urls')),
    path('api-token-auth/', auth_views.obtain_auth_token),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
