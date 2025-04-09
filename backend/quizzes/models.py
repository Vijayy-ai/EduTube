from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel
from courses.models import Course

class Quiz(TimeStampedModel):
    """
    Quiz model associated with a course
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return self.title or f"Quiz for {self.course.title}"

class Question(TimeStampedModel):
    """
    Question model for a quiz
    """
    DIFFICULTY_CHOICES = [
        ('basic', 'Basic'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='basic')
    
    def __str__(self):
        return self.text[:50]

class Option(models.Model):
    """
    Option model for a question (multiple choice)
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.text[:30]} - {'Correct' if self.is_correct else 'Incorrect'}"

class QuizAttempt(TimeStampedModel):
    """
    Record of a user's attempt at a quiz
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.FloatField()  # Percentage score
    passed = models.BooleanField(default=False)
    answers = models.JSONField(blank=True, null=True)  # Store user's answers
    
    def __str__(self):
        return f"{self.user.username}'s attempt at {self.quiz.course.title} quiz"
