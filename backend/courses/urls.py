from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'courses'

router = DefaultRouter()
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'lessons', views.LessonViewSet, basename='lesson')
router.register(r'user-courses', views.UserCourseViewSet, basename='user-course')

urlpatterns = [
    path('', include(router.urls)),
    path('search-youtube/', views.YouTubeSearchView.as_view(), name='youtube-search'),
    path('courses/search-youtube/', views.YouTubeSearchView.as_view(), name='youtube-search-alt'),
    path('youtube/playlist-items/<str:playlist_id>/', views.youtube_playlist_items, name='youtube-playlist-items'),
] 