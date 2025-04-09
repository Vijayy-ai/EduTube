from rest_framework import serializers
from .models import Course, Lesson, UserCourse
from django.contrib.auth.models import User

class LessonSerializer(serializers.ModelSerializer):
    """
    Serializer for the Lesson model
    """
    class Meta:
        model = Lesson
        fields = ['id', 'course', 'title', 'description', 'youtube_id', 'order', 'duration', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CourseSerializer(serializers.ModelSerializer):
    """
    Serializer for the Course model
    """
    lessons = LessonSerializer(many=True, read_only=True)
    lesson_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'youtube_id', 'is_playlist', 'thumbnail_url', 'difficulty', 'lessons', 'lesson_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_lesson_count(self, obj):
        """
        Get the number of lessons in the course
        """
        return obj.lessons.count()

class UserCourseSerializer(serializers.ModelSerializer):
    """
    Serializer for the UserCourse model
    """
    course_details = CourseSerializer(source='course', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserCourse
        fields = ['id', 'user', 'username', 'course', 'course_details', 'completed', 'progress', 'completed_at', 'completed_lessons', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user', 'course']
    
    def create(self, validated_data):
        """
        Set the user to the current user if not provided
        """
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data) 