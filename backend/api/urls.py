from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api import views

router = DefaultRouter()
# router.register(r'courses', views.CourseViewSet)
# router.register(r'quizzes', views.QuizViewSet)
# router.register(r'user-courses', views.UserCourseViewSet, basename='user-course')
# router.register(r'certificates', views.CertificateViewSet, basename='certificate')

urlpatterns = [
    # path('', include(router.urls)),
    path('firebase-auth/', views.firebase_auth, name='firebase-auth'),
    path('me/', views.current_user, name='current-user'),
    path('config/', views.config, name='config'),
] 