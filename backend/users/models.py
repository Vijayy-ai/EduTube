from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel

class Profile(TimeStampedModel):
    """
    User profile model that extends the built-in User model
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    firebase_uid = models.CharField(max_length=128, blank=True, null=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    wallet_address = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"
