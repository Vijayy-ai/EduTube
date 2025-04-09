from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel

class Course(TimeStampedModel):
    """
    Course model representing a YouTube video or playlist
    """
    DIFFICULTY_CHOICES = [
        ('basic', 'Basic'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    youtube_id = models.CharField(max_length=100)  # YouTube video or playlist ID
    is_playlist = models.BooleanField(default=False)
    thumbnail_url = models.URLField(blank=True, null=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='basic')
    
    class Meta:
        ordering = ['-created_at']  # Order by creation date (newest first)
    
    def __str__(self):
        return self.title

class UserCourse(TimeStampedModel):
    """
    Many-to-many relationship between User and Course with additional fields
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='user_enrollments')
    completed = models.BooleanField(default=False)
    progress = models.FloatField(default=0.0)  # Percentage of completion
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_lessons = models.JSONField(default=list, blank=True, null=True)  # Store IDs of completed lessons
    
    class Meta:
        unique_together = ('user', 'course')
        ordering = ['id']  # Default ordering by 'id' or any other field you prefer
    
    def __str__(self):
        return f"{self.user.username} - {self.course.title}"

class Lesson(TimeStampedModel):
    """
    Lesson model for playlist courses
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    youtube_id = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    duration = models.CharField(max_length=10, blank=True, null=True)  # Duration in minutes:seconds
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.title
