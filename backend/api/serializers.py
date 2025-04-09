from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Course, Quiz, Question, Option, UserCourse, Certificate, QuizAttempt

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'text', 'difficulty', 'options']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'course', 'questions', 'created_at']

class UserCourseSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = UserCourse
        fields = ['id', 'user', 'course', 'completed', 'progress', 'started_at', 'completed_at']

class CertificateSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Certificate
        fields = ['id', 'user', 'course', 'certificate_id', 'ipfs_hash', 'blockchain_tx', 
                 'created_at', 'pdf_url', 'nft_token_id']

class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz = QuizSerializer(read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = ['id', 'user', 'quiz', 'score', 'created_at', 'passed'] 