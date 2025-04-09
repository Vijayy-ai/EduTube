from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'quizzes'

router = DefaultRouter()
router.register(r'quizzes', views.QuizViewSet, basename='quiz')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'attempts', views.QuizAttemptViewSet, basename='attempt')

urlpatterns = [
    path('', include(router.urls)),
    path('generate/', views.GenerateQuizView.as_view(), name='generate'),
] 