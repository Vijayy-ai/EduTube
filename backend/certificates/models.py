from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel
from courses.models import Course

class Certificate(TimeStampedModel):
    """
    Certificate model for course completion with support for dynamic updates
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_certificates')
    # For dynamic certificates, this can be the main/first course, but we'll track all courses in related model
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_certificates')
    certificate_id = models.CharField(max_length=255, unique=True)  # Unique identifier for the certificate
    pdf_url = models.URLField(blank=True, null=True)  # URL to the certificate PDF
    ipfs_hash = models.CharField(max_length=255, blank=True, null=True)  # IPFS hash for the certificate
    blockchain_tx = models.CharField(max_length=255, blank=True, null=True)  # Blockchain transaction ID
    nft_token_id = models.CharField(max_length=255, blank=True, null=True)  # NFT token ID if minted
    is_valid = models.BooleanField(default=True)  # Flag to indicate if the certificate is valid
    is_dynamic = models.BooleanField(default=True)  # Whether this is a dynamic certificate
    last_updated = models.DateTimeField(auto_now=True)  # When the certificate was last updated
    metadata = models.JSONField(default=dict, blank=True)  # Additional metadata for dynamic certificates
    
    def __str__(self):
        return f"{self.user.username}'s {self.course.title} certificate"

class CertificateCourse(models.Model):
    """
    Model to track multiple courses in a dynamic certificate
    """
    certificate = models.ForeignKey(Certificate, on_delete=models.CASCADE, related_name='certificate_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificate_inclusions')
    added_at = models.DateTimeField(auto_now_add=True)
    quiz_score = models.FloatField(default=0.0)  # The score achieved in the quiz
    
    class Meta:
        unique_together = ('certificate', 'course')
        
    def __str__(self):
        return f"Course {self.course.title} in {self.certificate.certificate_id}"

class CertificateVerification(TimeStampedModel):
    """
    Record of certificate verification attempts
    """
    certificate = models.ForeignKey(Certificate, on_delete=models.CASCADE, related_name='verifications')
    verification_id = models.CharField(max_length=255, unique=True)
    verified_by = models.EmailField(blank=True, null=True)  # Email of person who verified
    is_valid = models.BooleanField()  # Result of verification
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    def __str__(self):
        return f"Verification {self.verification_id} for certificate {self.certificate.certificate_id}"
