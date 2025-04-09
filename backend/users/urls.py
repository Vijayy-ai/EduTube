from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'users'

router = DefaultRouter()
router.register(r'profiles', views.ProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', views.CurrentUserView.as_view(), name='me'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('firebase-auth/', views.FirebaseAuthView.as_view(), name='firebase-auth'),
] 