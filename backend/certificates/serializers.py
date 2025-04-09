from rest_framework import serializers
from .models import Certificate, CertificateVerification, CertificateCourse
from courses.serializers import CourseSerializer
from django.contrib.auth.models import User
import uuid

class CertificateVerificationSerializer(serializers.ModelSerializer):
    """
    Serializer for certificate verification records
    """
    class Meta:
        model = CertificateVerification
        fields = ['id', 'certificate', 'verification_id', 'verified_by', 'is_valid', 'ip_address', 'created_at']
        read_only_fields = ['id', 'verification_id', 'created_at']
    
    def create(self, validated_data):
        """
        Set a unique verification ID
        """
        validated_data['verification_id'] = str(uuid.uuid4())
        return super().create(validated_data)

class CertificateCourseSerializer(serializers.ModelSerializer):
    """
    Serializer for tracking courses included in a certificate
    """
    course_details = CourseSerializer(source='course', read_only=True)
    
    class Meta:
        model = CertificateCourse
        fields = ['id', 'certificate', 'course', 'course_details', 'added_at', 'quiz_score']
        read_only_fields = ['id', 'added_at']

class CertificateSerializer(serializers.ModelSerializer):
    """
    Serializer for certificates
    """
    course_details = CourseSerializer(source='course', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    user_fullname = serializers.SerializerMethodField(read_only=True)
    verifications = CertificateVerificationSerializer(many=True, read_only=True)
    certificate_courses = CertificateCourseSerializer(many=True, read_only=True)
    course_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'user', 'username', 'user_fullname', 'course', 'course_details', 
            'certificate_id', 'pdf_url', 'ipfs_hash', 'blockchain_tx', 'nft_token_id',
            'is_valid', 'verifications', 'created_at', 'updated_at', 'is_dynamic',
            'last_updated', 'metadata', 'certificate_courses', 'course_count'
        ]
        read_only_fields = ['id', 'certificate_id', 'ipfs_hash', 'blockchain_tx', 'nft_token_id', 
                           'created_at', 'updated_at', 'last_updated']
    
    def get_user_fullname(self, obj):
        """
        Get the user's full name (first + last)
        """
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def get_course_count(self, obj):
        """
        Get the count of courses included in this certificate
        """
        return obj.certificate_courses.count()
    
    def create(self, validated_data):
        """
        Set the certificate_id and user if not provided
        """
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Generate unique certificate ID
        validated_data['certificate_id'] = f"EDUTUBE-{str(uuid.uuid4())[:8].upper()}"
        
        return super().create(validated_data)

class PublicCertificateSerializer(serializers.ModelSerializer):
    """
    Limited serializer for public certificate verification
    """
    course_title = serializers.CharField(source='course.title', read_only=True)
    issued_to = serializers.SerializerMethodField()
    issued_on = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Certificate
        fields = ['certificate_id', 'course_title', 'issued_to', 'issued_on', 'is_valid', 'ipfs_hash', 'blockchain_tx']
    
    def get_issued_to(self, obj):
        """
        Get the user's full name or username
        """
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name if full_name else obj.user.username 