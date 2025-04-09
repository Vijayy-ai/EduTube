from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
import uuid
import os
import json
import requests
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph
from reportlab.platypus.flowables import Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib.colors import black, blue, navy, white, red, green, yellow, cyan, Color
from io import BytesIO
import base64
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import cloudinary
import cloudinary.uploader
import traceback
import random
import hashlib
import time
from django.http import HttpResponse
from rest_framework.authtoken.models import Token

from .models import Certificate, CertificateVerification, CertificateCourse
from .serializers import CertificateSerializer, CertificateVerificationSerializer, PublicCertificateSerializer
from courses.models import Course
from quizzes.models import QuizAttempt

def generate_certificate_pdf(certificate, user, course):
    """
    Generate PDF certificate for a user and course
    For dynamic certificates, include all the courses the user has completed
    """
    try:
        # Create a BytesIO buffer to receive the PDF data
        buffer = BytesIO()
        
        # Create the PDF object, using the BytesIO buffer as its "file"
        # Changed to landscape for better certificate layout
        p = canvas.Canvas(buffer, pagesize=landscape(letter))
        p.setTitle(f"Certificate of Completion - {course.title}")
        p.setAuthor("EduTube Learning Platform")
        p.setSubject(f"Certificate for {user.username}")
        p.setKeywords(["certificate", "education", "completion", "edutube"])
        
        width, height = landscape(letter)  # Landscape for better certificate format
        
        # Try to register fonts, fall back to default if not available
        try:
            font_path = os.path.join(settings.BASE_DIR, 'certificates', 'fonts')
            regular_font = os.path.join(font_path, 'Roboto-Regular.ttf')
            bold_font = os.path.join(font_path, 'Roboto-Bold.ttf')
            
            if os.path.exists(regular_font) and os.path.exists(bold_font):
                pdfmetrics.registerFont(TTFont('Roboto', regular_font))
                pdfmetrics.registerFont(TTFont('Roboto-Bold', bold_font))
                regular_font_name = 'Roboto'
                bold_font_name = 'Roboto-Bold'
            else:
                # Fall back to default fonts
                regular_font_name = 'Helvetica'
                bold_font_name = 'Helvetica-Bold'
        except Exception as e:
            print(f"Error registering fonts: {e}")
            # Fall back to default fonts
            regular_font_name = 'Helvetica'
            bold_font_name = 'Helvetica-Bold'
        
        # Set up the certificate
        p.setTitle(f"Certificate of Completion - {course.title}")
        
        # Draw certificate border with more elegant design
        p.setStrokeColor(blue)
        p.setLineWidth(3)
        p.rect(30, 30, width - 60, height - 60, stroke=1, fill=0)
        
        # Add a subtle background color gradient
        # Draw horizontal bands for a more elegant look
        for y in range(30, int(height), 4):
            opacity = 0.03 - (0.02 * (y / height))  # Gradually decrease opacity
            if opacity > 0:
                p.setFillColor(Color(0.8, 0.8, 1, alpha=opacity))
                p.rect(30, y, width - 60, 2, fill=1, stroke=0)
        
        # Add decorative corners
        corner_size = 20
        p.setStrokeColor(blue)
        p.setLineWidth(2)
        
        # Top-left corner
        p.line(30, 30+corner_size, 30, 30)
        p.line(30, 30, 30+corner_size, 30)
        
        # Top-right corner
        p.line(width-30-corner_size, 30, width-30, 30)
        p.line(width-30, 30, width-30, 30+corner_size)
        
        # Bottom-left corner
        p.line(30, height-30-corner_size, 30, height-30)
        p.line(30, height-30, 30+corner_size, height-30)
        
        # Bottom-right corner
        p.line(width-30-corner_size, height-30, width-30, height-30)
        p.line(width-30, height-30, width-30, height-30-corner_size)
        
        # Add certificate header
        p.setFont(bold_font_name, 36)  # Increased font size
        p.setFillColor(navy)
        
        # For dynamic certificates, use a different title
        if certificate.is_dynamic and certificate.certificate_courses.count() > 1:
            header_text = "CERTIFICATE OF ACHIEVEMENT"
        else:
            header_text = "CERTIFICATE OF COMPLETION"
            
        header_width = stringWidth(header_text, bold_font_name, 36)
        p.drawString((width - header_width) / 2, height - 120, header_text)
        
        # Add decorative line
        p.setStrokeColor(blue)
        p.setLineWidth(2)
        p.line(width/4, height-140, width*3/4, height-140)
        
        # Add certificate text
        p.setFont(regular_font_name, 18)  # Increased font size
        p.setFillColor(black)
        p.drawCentredString(width/2, height-180, "This certificate is presented to")
        
        # Add user name
        user_name = f"{user.first_name} {user.last_name}".strip()
        if not user_name:
            user_name = user.username
        p.setFont(bold_font_name, 30)  # Larger font for name
        p.setFillColor(navy)
        p.drawCentredString(width/2, height-230, user_name)
        
        # Get quiz attempt to include score
        quiz_attempt = None
        try:
            # Try to find a successful quiz attempt for this course by this user
            quiz_attempts = QuizAttempt.objects.filter(
                user=user, 
                quiz__course=course,
                passed=True
            ).order_by('-score', '-created_at')
            
            if quiz_attempts.exists():
                quiz_attempt = quiz_attempts.first()
        except Exception as e:
            print(f"Error retrieving quiz attempt: {e}")
        
        # For dynamic certificates, we'll present multiple courses
        if certificate.is_dynamic and certificate.certificate_courses.count() > 0:
            p.setFont(regular_font_name, 18)
            p.setFillColor(black)
            p.drawCentredString(width/2, height-280, "for successfully completing the following courses:")
            
            # Add course list
            y_position = height - 330
            
            # Get all courses for this certificate
            courses = certificate.certificate_courses.all().order_by('-added_at')
            
            for i, cert_course in enumerate(courses[:5]):  # Limit to 5 courses for space
                course_title = cert_course.course.title
                if len(course_title) > 40:
                    course_title = course_title[:37] + "..."
                    
                p.setFont(bold_font_name, 16)
                p.setFillColor(navy)
                p.drawString(width/4, y_position, f"{i+1}. {course_title}")
                
                # Add completion date and score
                p.setFont(regular_font_name, 14)
                p.setFillColor(black)
                completion_date = cert_course.added_at.strftime("%B %d, %Y")
                p.drawString(width/4, y_position - 20, f"Completed: {completion_date} | Score: {cert_course.quiz_score:.1f}%")
                
                y_position -= 40
                
            # If there are more courses, indicate this
            if certificate.certificate_courses.count() > 5:
                p.setFont(regular_font_name, 14)
                p.setFillColor(black)
                more_count = certificate.certificate_courses.count() - 5
                p.drawString(width/4, y_position, f"+ {more_count} more course(s). View all online.")
                
                y_position -= 30
        else:
            # Single course certificate (original behavior)
            p.setFont(regular_font_name, 18)
            p.setFillColor(black)
            p.drawCentredString(width/2, height-280, "for successfully completing the course")
            
            # Add course title
            p.setFont(bold_font_name, 24)  # Larger font
            p.setFillColor(navy)
            
            # Handle long course titles by splitting them
            course_title = course.title
            if len(course_title) > 40:
                # Split the title for better display
                words = course_title.split()
                first_line = ' '.join(words[:len(words)//2])
                second_line = ' '.join(words[len(words)//2:])
                p.drawCentredString(width/2, height-330, first_line)
                p.drawCentredString(width/2, height-360, second_line)
                
                y_position = height - 410
            else:
                p.drawCentredString(width/2, height-330, course_title)
                
                y_position = height - 380
            
            # Add score if available
            if quiz_attempt:
                p.setFont(bold_font_name, 20)
                p.setFillColor(blue)
                p.drawCentredString(width/2, y_position, f"Score: {quiz_attempt.score:.1f}%")
                y_position -= 40
        
        # Add certificate date
        p.setFont(regular_font_name, 16)
        p.setFillColor(black)
        issue_date = certificate.last_updated.strftime("%B %d, %Y")
        p.drawCentredString(width/2, y_position, f"Last Updated: {issue_date}")
        
        # Add "Certified by EduTube" text
        p.setFont(bold_font_name, 18)
        p.setFillColor(navy)
        p.drawCentredString(width/2, 100, "Certified by EduTube Learning Platform")
        
        # Add certificate ID
        p.setFont(regular_font_name, 11)
        p.setFillColor(black)
        p.drawString(50, 50, f"Certificate ID: {certificate.certificate_id}")
        
        # Add verification info - use IPFS URL if available
        p.setFont(regular_font_name, 11)
        if certificate.ipfs_hash and not certificate.ipfs_hash.startswith('ipfs-placeholder'):
            p.drawString(50, 65, f"Verify at: https://ipfs.io/ipfs/{certificate.ipfs_hash}")
        else:
            # Fallback to site URL
            p.drawString(50, 65, f"Verify at: {settings.SITE_URL}/verify/{certificate.certificate_id}")
        
        # Add blockchain verification if available
        if certificate.blockchain_tx and not certificate.blockchain_tx.startswith('0x00000'):
            p.setFont(regular_font_name, 9)
            p.setFillColor(black)
            p.drawString(50, 80, f"Blockchain verification: {certificate.blockchain_tx[:20]}...")
            if certificate.blockchain_tx.startswith('0x'):
                p.drawString(50, 90, f"View on Polygon Scan: https://mumbai.polygonscan.com/tx/{certificate.blockchain_tx}")
        
        # Add dynamic certificate badge if applicable
        if certificate.is_dynamic:
            p.setFont(bold_font_name, 11)
            p.setFillColor(blue)
            p.drawRightString(width-50, 80, "DYNAMIC CERTIFICATE")
        
        # Close the PDF object cleanly
        p.showPage()
        p.save()
        
        # Return the PDF data
        buffer.seek(0)
        return buffer
    except Exception as e:
        print(f"Error generating certificate PDF: {str(e)}")
        # Create a simple error PDF to return
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=landscape(letter))
        p.setTitle("Error Certificate")
        p.drawString(100, 400, f"Error generating certificate: {str(e)}")
        p.showPage()
        p.save()
        buffer.seek(0)
        return buffer

def upload_to_cloudinary(pdf_buffer, certificate_id):
    """
    Upload a PDF file to Cloudinary
    """
    try:
        # Configure Cloudinary if not already configured
        try:
            # Check if Cloudinary is already configured
            cloudinary.config().cloud_name
        except:
            # Configure Cloudinary with environment variables
            cloudinary.config(
                cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
                api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
                api_secret=os.environ.get('CLOUDINARY_API_SECRET', ''),
                secure=True
            )
        
        # Add timestamp to prevent caching issues
        timestamp = int(datetime.now().timestamp())
        
        # Upload the PDF to Cloudinary with improved parameters
        result = cloudinary.uploader.upload(
            pdf_buffer,
            public_id=f"certificates/{certificate_id}_{timestamp}",
            folder="edutube",
            resource_type="raw",
            format="pdf",
            type="upload",
            overwrite=True,
            use_filename=True,
            unique_filename=True,
            flags="attachment",
            tags=["certificate", "pdf", "edutube"],
            quality="auto:best",
            access_mode="public",
            # Add these additional parameters to ensure public accessibility
            delivery_type="upload",
            invalidate=True,
            accessibility_analysis=True,
            public_access="true"
        )
        
        print(f"Cloudinary upload success! URL: {result['secure_url']}")
        
        # The secure_url is the URL with HTTPS
        # Return both secure and regular URLs for flexibility
        return result['secure_url']
    except Exception as e:
        print(f"Error uploading certificate to Cloudinary: {str(e)}")
        traceback.print_exc()  # Print detailed stack trace
        return None

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_certificate(request, certificate_id):
    """
    Verify a certificate by its ID
    """
    try:
        certificate = Certificate.objects.get(certificate_id=certificate_id)
    except Certificate.DoesNotExist:
        return Response({"valid": False, "message": "Certificate not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Record this verification attempt
    verification = CertificateVerification.objects.create(
        certificate=certificate,
        verification_id=uuid.uuid4().hex,
        verified_by=request.GET.get('email', None),
        is_valid=certificate.is_valid,
        ip_address=request.META.get('REMOTE_ADDR', None)
    )
    
    # Return the certificate data
    serializer = PublicCertificateSerializer(certificate)
    data = serializer.data
    data['valid'] = certificate.is_valid
    
    return Response(data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mint_nft_certificate(request, certificate_id):
    """
    Mint an NFT for a certificate
    """
    print(f"NFT minting started for certificate {certificate_id}")
    print(f"Request data: {request.data}")
    
    try:
        # First, check if wallet_address is in the request data
        wallet_address = request.data.get('wallet_address')
        
        # If not in request data, try to get it from user profile
        if not wallet_address:
            # Get from user profile
            profile = request.user.profile
            wallet_address = profile.wallet_address if hasattr(profile, 'wallet_address') else None
            print(f"Using wallet address from profile: {wallet_address}")
            
        # Create a fallback for development testing if still no wallet address
        if not wallet_address and settings.DEBUG:
            wallet_address = "0x123456789abcdef123456789abcdef123456789a"
            print(f"Using DEBUG fallback wallet address: {wallet_address}")
        
        print(f"Received wallet_address: {wallet_address}")
        
        # Validate wallet address
        if not wallet_address:
            return Response(
                {"error": "Wallet address is missing. Please connect your wallet and try again."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Clean and validate the wallet address
        wallet_address = wallet_address.strip()
        if not wallet_address.startswith('0x'):
            wallet_address = '0x' + wallet_address
            
        if len(wallet_address) != 42:  # Standard Ethereum address length with '0x' prefix
            return Response(
                {"error": f"Invalid wallet address format: {wallet_address}. Must be 42 characters long including 0x prefix."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the certificate
        try:
            certificate = Certificate.objects.get(certificate_id=certificate_id)
        except Certificate.DoesNotExist:
            return Response(
                {"error": "Certificate not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Force simulation mode if:
        # 1. SIMULATE_MINTING is set to True in environment variables
        # 2. We're in DEBUG mode and ThirdWeb SDK isn't available
        # 3. We encounter any import errors with ThirdWeb SDK
        
        force_simulation = False
        simulate_minting = os.environ.get('SIMULATE_MINTING', 'True').lower() == 'true'
        
        # Check if ThirdWeb is properly installed before attempting to use it
        try:
            import thirdweb
            print("ThirdWeb SDK is available")
        except ImportError:
            print("ThirdWeb SDK is not properly installed, forcing simulation mode")
            force_simulation = True
        
        # Use simulation mode if configured or forced
        if simulate_minting or force_simulation:
            print(f"Simulating NFT minting for {certificate_id} to {wallet_address}")
            
            # Generate a random token ID
            token_id = random.randint(1000000000, 9999999999)
            
            # Generate a simulated transaction hash
            tx_hash = f"0x{hashlib.sha256(f'{certificate_id}-{token_id}-{int(time.time())}'.encode()).hexdigest()[:64]}"
            
            # Update certificate with the token ID and transaction hash
            certificate.nft_token_id = str(token_id)
            certificate.blockchain_tx = tx_hash
            certificate.save()
            
            return Response({
                "success": True,
                "message": "NFT minted successfully (simulated)",
                "token_id": token_id,
                "transaction_hash": tx_hash
            })
        
        # Real minting implementation using ThirdWeb SDK
        try:
            # Import from our wrapper module instead of directly from thirdweb
            from thirdweb_wrapper import ThirdwebSDK, NFTMetadataInput
            from eth_account import Account
            
            print(f"Performing real NFT minting for {certificate_id} to {wallet_address}")
            
            # Get ThirdWeb credentials from settings
            private_key = settings.THIRDWEB_PRIVATE_KEY
            api_key = settings.THIRDWEB_API_KEY
            contract_address = os.environ.get('NFT_CONTRACT_ADDRESS', '')
            blockchain_network = settings.BLOCKCHAIN_NETWORK
            
            if not private_key or not api_key or not contract_address:
                return Response({
                    "error": "Missing ThirdWeb configuration. Please check your environment variables."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Log important info (excluding private key for security)
            print(f"Contract Address: {contract_address}")
            print(f"Blockchain Network: {blockchain_network}")
            
            # Initialize signer account from private key
            account = Account.from_key(private_key)
            
            # Initialize ThirdWeb SDK
            sdk = ThirdwebSDK.from_private_key(
                private_key=private_key,
                network=blockchain_network,
                api_key=api_key
            )
            
            # Get the NFT Collection contract
            nft_collection = sdk.get_contract(contract_address)
            
            # Prepare metadata for the NFT
            certificate_url = certificate.pdf_url if certificate.pdf_url else f"{settings.SITE_URL}/certificates/{certificate_id}"
            course_title = certificate.course.title if certificate.course else "Course"
            username = certificate.user.username
            
            # Prepare the NFT metadata
            metadata = NFTMetadataInput(
                name=f"EduTube Certificate: {course_title}",
                description=f"Certificate of completion for {course_title}, issued to {username}",
                image=certificate.pdf_url if certificate.pdf_url else None,
                external_url=certificate_url,
                attributes=[
                    {"trait_type": "Certificate ID", "value": certificate_id},
                    {"trait_type": "Course", "value": course_title},
                    {"trait_type": "Issued Date", "value": certificate.created_at.strftime("%Y-%m-%d")},
                    {"trait_type": "Recipient", "value": username}
                ]
            )
            
            print(f"Minting NFT with metadata: {metadata}")
            
            # Mint the NFT
            tx = nft_collection.erc721.mint_to(
                to_address=wallet_address,
                metadata=metadata
            )
            
            print(f"NFT minted successfully! Transaction: {tx}")
            
            # Update certificate with blockchain information
            certificate.nft_token_id = str(tx.id)
            certificate.blockchain_tx = tx.receipt.transaction_hash
            certificate.save()
            
            return Response({
                "success": True,
                "message": "NFT minted successfully on the blockchain",
                "token_id": tx.id,
                "transaction_hash": tx.receipt.transaction_hash
            })
            
        except ImportError as ie:
            print(f"Import error with ThirdWeb: {str(ie)}")
            # Fall back to simulation mode on import error
            print("Falling back to simulation mode due to ThirdWeb import error")
            
            # Generate a random token ID
            token_id = random.randint(1000000000, 9999999999)
            
            # Generate a simulated transaction hash
            tx_hash = f"0x{hashlib.sha256(f'{certificate_id}-{token_id}-{int(time.time())}'.encode()).hexdigest()[:64]}"
            
            # Update certificate with the token ID and transaction hash
            certificate.nft_token_id = str(token_id)
            certificate.blockchain_tx = tx_hash
            certificate.save()
            
            return Response({
                "success": True,
                "message": "NFT minted successfully (simulated due to SDK compatibility issue)",
                "token_id": token_id,
                "transaction_hash": tx_hash
            })
        except Exception as e:
            print(f"ThirdWeb minting error: {str(e)}")
            traceback.print_exc()
            return Response({"error": f"Real minting failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        print(f"Error minting NFT: {str(e)}")
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_quiz_score(user, course):
    """Helper function to get a user's quiz score for a course"""
    try:
        quiz_attempts = QuizAttempt.objects.filter(
            user=user, 
            quiz__course=course,
            passed=True
        ).order_by('-score', '-created_at')
        
        if quiz_attempts.exists():
            return quiz_attempts.first().score
    except Exception as e:
        print(f"Error getting quiz score: {e}")
    
    return 100  # Default to 100% if no score found

class CertificateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for certificates
    """
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only the current user's certificates
        """
        return Certificate.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_course(self, request, pk=None):
        """
        Add a course to a dynamic certificate
        """
        certificate = self.get_object()
        course_id = request.data.get('course_id')
        quiz_score = request.data.get('quiz_score', 0)
        
        if not course_id:
            return Response({
                'error': 'course_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({
                'error': 'Course not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user has completed the course
        if not course.user_enrollments.filter(user=request.user, completed=True).exists():
            return Response({
                'error': 'You must complete the course to add it to your certificate'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user has passed the quiz
        quiz_attempts = QuizAttempt.objects.filter(user=request.user, quiz__course=course, passed=True)
        if not quiz_attempts.exists():
            return Response({
                'error': 'You must pass the quiz to add the course to your certificate'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Add the course to the certificate
        certificate_course, created = CertificateCourse.objects.get_or_create(
            certificate=certificate,
            course=course,
            defaults={'quiz_score': quiz_score}
        )
        
        if not created:
            # Update the quiz score if it's higher
            if quiz_score > certificate_course.quiz_score:
                certificate_course.quiz_score = quiz_score
                certificate_course.save()
        
        # Update certificate metadata
        courses = CertificateCourse.objects.filter(certificate=certificate)
        certificate.metadata.update({
            'course_count': courses.count(),
            'last_course_added': course.title,
            'last_course_added_date': datetime.now().isoformat(),
            'average_score': sum(c.quiz_score for c in courses) / courses.count()
        })
        certificate.save()
        
        # Generate a new PDF with the updated information
        pdf_buffer = generate_certificate_pdf(certificate, request.user, certificate.course)
        
        # Upload the PDF to Cloudinary
        cloudinary_url = upload_to_cloudinary(pdf_buffer.getvalue(), certificate.certificate_id)
        
        if cloudinary_url:
            certificate.pdf_url = cloudinary_url
            certificate.save()
        
        # Upload to IPFS (optional - only if you want to update the blockchain record)
        # This would require minting a new NFT or updating the existing one
        
        return Response({
            'message': f'Course {course.title} added to certificate',
            'certificate': self.get_serializer(certificate).data
        })
    
    def create(self, request, *args, **kwargs):
        """
        Create a certificate for a completed course
        """
        # Extract and validate course_id
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({'error': 'course_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            course_id = int(course_id)
            course = Course.objects.get(pk=course_id)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid course ID format'}, status=status.HTTP_400_BAD_REQUEST)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check for quiz attempts - if user has a passing quiz attempt, allow certificate generation
        quiz_attempts = QuizAttempt.objects.filter(
            user=request.user, 
            quiz__course=course, 
            passed=True
        ).order_by('-created_at')
        
        if quiz_attempts.exists():
            # Get the most recent passed quiz attempt
            latest_attempt = quiz_attempts.first()
            print(f"Latest quiz attempt: {latest_attempt.id}, Score: {latest_attempt.score}%, Created: {latest_attempt.created_at}")
            
            # Always generate a new certificate for the latest quiz attempt
            certificate_id = uuid.uuid4().hex
            certificate = Certificate.objects.create(
                user=request.user,
                course=course,
                certificate_id=certificate_id,
                is_valid=True
            )
            
            print(f"New certificate created with ID: {certificate_id}")
            
            try:
                # Generate PDF certificate
                pdf_buffer = generate_certificate_pdf(certificate, request.user, course)
                
                # Try Cloudinary upload
                cloudinary_url = None
                try:
                    print(f"Uploading certificate {certificate_id} to Cloudinary...")
                    cloudinary_url = upload_to_cloudinary(pdf_buffer.getvalue(), certificate_id)
                    print(f"Cloudinary upload result: {cloudinary_url}")
                except Exception as cloud_error:
                    print(f"Cloudinary upload failed: {str(cloud_error)}")
                    traceback.print_exc()
                
                if cloudinary_url:
                    certificate.pdf_url = cloudinary_url
                    certificate.save()
                    print(f"Certificate {certificate_id} saved with Cloudinary URL: {cloudinary_url}")
                else:
                    # Fallback to local storage if Cloudinary upload fails
                    print(f"Falling back to local storage for certificate {certificate_id}")
                    pdf_path = f'certificates/{certificate_id}.pdf'
                    default_storage.save(pdf_path, ContentFile(pdf_buffer.getvalue()))
                    certificate.pdf_url = f"{settings.MEDIA_URL}{pdf_path}"
                    certificate.save()
                
                # Try to upload to IPFS if configurations are available
                try:
                    # Upload to IPFS via Pinata if credentials are available
                    pinata_api_key = os.environ.get('PINATA_API_KEY')
                    pinata_secret_key = os.environ.get('PINATA_SECRET_API_KEY')
                    
                    if pinata_api_key and pinata_secret_key:
                        self._upload_to_ipfs(certificate, pdf_buffer, course)
                except Exception as ipfs_error:
                    print(f"IPFS upload error (non-critical): {str(ipfs_error)}")
                
                serializer = self.get_serializer(certificate)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                # If certificate creation fails, delete the certificate
                print(f"Error during certificate creation: {str(e)}")
                traceback.print_exc()
                certificate.delete()
                return Response({
                    'error': f'Failed to generate certificate: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({
                'error': 'You must pass the quiz to get a certificate. Please complete the quiz first.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download the certificate PDF
        """
        try:
            certificate = self.get_object()
            print(f"Generating download for certificate: {certificate.certificate_id}")
            
            # Generate PDF
            pdf_buffer = generate_certificate_pdf(certificate, certificate.user, certificate.course)
            
            # Get the PDF bytes
            pdf_bytes = pdf_buffer.getvalue()
            
            # Set up proper response with correct headers
            response = Response(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename=certificate-{certificate.certificate_id}.pdf'
            response['Content-Length'] = len(pdf_bytes)
            response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Length'
            
            print(f"PDF generation successful, size: {len(pdf_bytes)} bytes")
            return response
            
        except Exception as e:
            print(f"Error generating PDF for download: {str(e)}")
            return Response({
                'error': f'Failed to generate PDF: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _upload_to_ipfs(self, certificate, pdf_buffer, course):
        """
        Helper method to upload a certificate to IPFS via Pinata
        """
        pinata_api_key = os.environ.get('PINATA_API_KEY')
        pinata_secret_key = os.environ.get('PINATA_SECRET_API_KEY')
        
        # Upload to IPFS via Pinata
        pinata_url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        
        # Prepare file for upload
        files = {
            'file': ('certificate.pdf', pdf_buffer.getvalue(), 'application/pdf')
        }
        
        # Metadata for the file
        data = {
            'pinataMetadata': json.dumps({
                'name': f'EduTube Certificate - {course.title}',
                'keyvalues': {
                    'certificateId': certificate.certificate_id,
                    'userId': str(certificate.user.id),
                    'courseId': str(course.id),
                    'issueDate': datetime.now().isoformat()
                }
            })
        }
        
        # Headers for the request
        headers = {
            'pinata_api_key': pinata_api_key,
            'pinata_secret_api_key': pinata_secret_key
        }
        
        # Make the request to Pinata
        response = requests.post(pinata_url, files=files, data=data, headers=headers)
        
        if response.status_code == 200:
            # Get the IPFS hash from the response
            response_json = response.json()
            ipfs_hash = response_json.get('IpfsHash')
            
            if ipfs_hash:
                certificate.ipfs_hash = ipfs_hash
                certificate.save()
                return True
        
        return False

class CertificateVerificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for certificate verifications (admin only)
    """
    queryset = CertificateVerification.objects.all()
    serializer_class = CertificateVerificationSerializer
    permission_classes = [permissions.IsAdminUser]

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def serve_pdf(request, certificate_id):
    """
    Serve the certificate PDF directly from the backend for better cross-browser compatibility
    with support for token-based authentication in query parameters
    """
    try:
        # Check if token is in query parameters
        token_param = request.query_params.get('token')
        
        # If token in query param, authenticate the user
        if token_param:
            try:
                # Get the user from token
                token = Token.objects.get(key=token_param)
                user = token.user
                # Set request.user manually for permission checks
                request.user = user
            except Token.DoesNotExist:
                pass  # Continue with anonymous access
        
        # Get the certificate
        certificate = Certificate.objects.get(certificate_id=certificate_id)
        
        # Check if public verification or user is authenticated as owner
        is_owner = request.user and request.user.is_authenticated and certificate.user == request.user
        is_staff = request.user and request.user.is_authenticated and request.user.is_staff
        
        # If not owner or staff, this could be a public verification check
        if not is_owner and not is_staff:
            # Only allow access if the certificate is verified
            if not certificate.is_verified:
                return Response(
                    {"error": "You do not have permission to view this certificate"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get the PDF URL from Cloudinary
        pdf_url = certificate.pdf_url
        
        if not pdf_url:
            return Response(
                {"error": "PDF not available for this certificate"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Download the PDF from Cloudinary
        response = requests.get(pdf_url)
        
        if response.status_code != 200:
            return Response(
                {"error": f"Failed to fetch PDF from cloud storage: {response.status_code}"}, 
                status=status.HTTP_502_BAD_GATEWAY
            )
        
        # Create a Django response with the PDF content
        django_response = HttpResponse(response.content, content_type='application/pdf')
        django_response['Content-Disposition'] = f'inline; filename="certificate-{certificate_id}.pdf"'
        
        # Add Cache-Control headers to improve performance
        django_response['Cache-Control'] = 'public, max-age=31536000'
        
        return django_response
        
    except Certificate.DoesNotExist:
        return Response(
            {"error": "Certificate not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error serving PDF: {str(e)}")
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
