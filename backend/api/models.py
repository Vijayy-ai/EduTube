from django.db import models
from django.contrib.auth.models import User

class Course(models.Model):
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='basic')
    
    def __str__(self):
        return self.title

class Quiz(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Quiz for {self.course.title}"

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    difficulty = models.CharField(max_length=20, choices=Course.DIFFICULTY_CHOICES, default='basic')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.text[:50]

class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return self.text[:50]

class UserCourse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='users')
    completed = models.BooleanField(default=False)
    progress = models.FloatField(default=0.0)  # Percentage of completion
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'course')
    
    def __str__(self):
        return f"{self.user.username} - {self.course.title}"

class Certificate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    certificate_id = models.CharField(max_length=255, unique=True)
    ipfs_hash = models.CharField(max_length=255, blank=True, null=True)
    blockchain_tx = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    pdf_url = models.URLField(blank=True, null=True)
    nft_token_id = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"Certificate for {self.user.username} - {self.course.title}"

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.FloatField()  # Percentage score
    created_at = models.DateTimeField(auto_now_add=True)
    passed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username} attempt on {self.quiz.course.title}"
