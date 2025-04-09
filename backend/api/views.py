from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.contrib.auth.models import User
from .models import Course, Quiz, Question, Option, UserCourse, Certificate, QuizAttempt
from .serializers import (
    UserSerializer, CourseSerializer, QuizSerializer, QuestionSerializer,
    OptionSerializer, UserCourseSerializer, CertificateSerializer, QuizAttemptSerializer
)
import googleapiclient.discovery
from youtube_transcript_api import YouTubeTranscriptApi
import openai
import uuid
import os
from datetime import datetime
from rest_framework.authtoken.models import Token
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
import json
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

# Initialize Firebase Admin SDK if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

# YouTube API service
def get_youtube_service():
    api_key = os.environ.get('YOUTUBE_API_KEY')
    if not api_key:
        print("WARNING: YOUTUBE_API_KEY environment variable is not set")
        return None
    
    try:
        return googleapiclient.discovery.build(
            "youtube", "v3", developerKey=api_key
        )
    except Exception as e:
        print(f"Error creating YouTube service: {e}")
        return None

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def firebase_auth(request):
    """
    Authenticate a user with a Firebase ID token.
    Creates a new user if one doesn't exist.
    Returns a Django auth token.
    """
    # Get the ID token from the request
    id_token = request.data.get('token')
    if not id_token:
        return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verify the ID token with Firebase
        decoded_token = firebase_auth.verify_id_token(id_token)
        
        # Get user info from the token
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email', '')
        name = decoded_token.get('name', '')
        
        if not email:
            return Response({'error': 'Email not found in token'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists in Django
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create a new user
            # Generate username from email
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=None  # Password is managed by Firebase
            )
            
            # Set name if available
            if name:
                names = name.split(' ', 1)
                user.first_name = names[0]
                if len(names) > 1:
                    user.last_name = names[1]
                user.save()
        
        # Generate or get existing token
        token, created = Token.objects.get_or_create(user=user)
        
        # Return user info and token
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    @action(detail=False, methods=['post'])
    def search_youtube(self, request):
        query = request.data.get('query', '')
        search_type = request.data.get('search_type', 'video')
        
        youtube = get_youtube_service()
        if not youtube:
            return Response(
                {"error": "YouTube API service could not be initialized. Check your API key."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        results = []
        
        try:
            if search_type == 'playlist':
                request = youtube.playlists().list(
                    part="snippet,contentDetails",
                    maxResults=10,
                    q=query
                )
                response = request.execute()
                
                for item in response.get('items', []):
                    playlist_id = item['id']
                    snippet = item['snippet']
                    content_details = item.get('contentDetails', {})
                    
                    results.append({
                        'id': playlist_id,
                        'title': snippet.get('title', ''),
                        'description': snippet.get('description', ''),
                        'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                        'channelTitle': snippet.get('channelTitle', ''),
                        'videoCount': content_details.get('itemCount', 0),
                        'publishedAt': snippet.get('publishedAt', '')
                    })
            else:
                request = youtube.search().list(
                    part="snippet",
                    maxResults=10,
                    q=query,
                    type="video"
                )
                response = request.execute()
                
                for item in response.get('items', []):
                    video_id = item['id']['videoId']
                    snippet = item['snippet']
                    
                    # Get video duration and statistics
                    video_request = youtube.videos().list(
                        part="contentDetails,statistics",
                        id=video_id
                    )
                    video_response = video_request.execute()
                    video_details = video_response.get('items', [{}])[0] if video_response.get('items') else {}
                    content_details = video_details.get('contentDetails', {})
                    statistics = video_details.get('statistics', {})
                    
                    results.append({
                        'id': video_id,
                        'title': snippet.get('title', ''),
                        'description': snippet.get('description', ''),
                        'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                        'channelTitle': snippet.get('channelTitle', ''),
                        'duration': content_details.get('duration', ''),
                        'viewCount': statistics.get('viewCount', 0),
                        'publishedAt': snippet.get('publishedAt', '')
                    })
                    
            return Response(results)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        course = self.get_object()
        user = request.user
        
        if UserCourse.objects.filter(user=user, course=course).exists():
            return Response({"detail": "Already enrolled in this course"}, status=status.HTTP_400_BAD_REQUEST)
        
        user_course = UserCourse.objects.create(user=user, course=course)
        serializer = UserCourseSerializer(user_course)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def generate_quiz(self, request, pk=None):
        course = self.get_object()
        
        try:
            # Get course details from YouTube
            youtube = get_youtube_service()
            
            # Get video details or playlist details
            if course.is_playlist:
                # For playlists, get the first few videos (up to 5)
                playlist_items_request = youtube.playlistItems().list(
                    part="snippet,contentDetails",
                    playlistId=course.youtube_id,
                    maxResults=5
                )
                playlist_response = playlist_items_request.execute()
                
                video_ids = [item['contentDetails']['videoId'] for item in playlist_response['items']]
            else:
                # Single video
                video_ids = [course.youtube_id]
            
            # Get transcripts for all videos
            all_transcripts = []
            for video_id in video_ids:
                try:
                    transcript = YouTubeTranscriptApi.get_transcript(video_id)
                    transcript_text = " ".join([entry['text'] for entry in transcript])
                    all_transcripts.append(transcript_text)
                except Exception as e:
                    print(f"Error getting transcript for video {video_id}: {e}")
            
            # Combine all transcripts
            transcript_text = " ".join(all_transcripts)
            
            # Truncate if too long (OpenAI has token limits)
            max_length = 8000
            if len(transcript_text) > max_length:
                transcript_text = transcript_text[:max_length]
            
            # Get video/playlist title and description
            if course.is_playlist:
                playlist_request = youtube.playlists().list(
                    part="snippet",
                    id=course.youtube_id
                )
                playlist_response = playlist_request.execute()
                playlist_data = playlist_response['items'][0]['snippet']
                title = playlist_data['title']
                description = playlist_data['description']
            else:
                video_request = youtube.videos().list(
                    part="snippet",
                    id=course.youtube_id
                )
                video_response = video_request.execute()
                video_data = video_response['items'][0]['snippet']
                title = video_data['title']
                description = video_data['description']
            
            # Get OpenAI API key from environment variable
            openai.api_key = os.environ.get('OPENAI_API_KEY')
            
            # Generate quiz questions using OpenAI
            # Create quiz with 15 questions (5 for each difficulty level)
            difficulty_levels = ['basic', 'intermediate', 'advanced']
            questions_per_level = 5
            
            # Create a new quiz for this course
            quiz = Quiz.objects.create(course=course)
            
            for difficulty in difficulty_levels:
                prompt = f"""
                Generate {questions_per_level} multiple-choice quiz questions about the following educational content.
                The questions should be at {difficulty} level.
                Each question should have 4 options with exactly one correct answer.
                
                Title: {title}
                Description: {description}
                Transcript: {transcript_text}
                
                Format:
                1. Question text
                A) First option (correct)
                B) Second option
                C) Third option
                D) Fourth option
                
                2. Question text
                A) First option
                B) Second option (correct)
                C) Third option
                D) Fourth option
                
                ... and so on.
                
                Make sure to mark the correct answer with (correct).
                The questions should test understanding of key concepts from the content.
                """
                
                try:
                    response = openai.ChatCompletion.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You are an educational quiz creator. Create challenging but fair multiple-choice questions based on educational content."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.7,
                        max_tokens=2500,
                        top_p=1.0,
                        frequency_penalty=0.0,
                        presence_penalty=0.0
                    )
                    
                    # Process the generated questions
                    generated_text = response.choices[0].message['content']
                    
                    # Parse the generated questions
                    lines = generated_text.strip().split('\n')
                    
                    current_question = None
                    options = []
                    correct_option = None
                    
                    for line in lines:
                        line = line.strip()
                        
                        if not line:
                            continue
                        
                        # Check if this is a question line (starts with a number and a dot)
                        if line[0].isdigit() and '.' in line[:3]:
                            # Save the previous question if exists
                            if current_question and options:
                                question = Question.objects.create(
                                    quiz=quiz,
                                    text=current_question,
                                    difficulty=difficulty
                                )
                                
                                for i, option_text in enumerate(options):
                                    Option.objects.create(
                                        question=question,
                                        text=option_text,
                                        is_correct=(i == correct_option)
                                    )
                            
                            # Start a new question
                            current_question = line.split('.', 1)[1].strip()
                            options = []
                            correct_option = None
                        
                        # Check if this is an option line
                        elif line and line[0] in "ABCD" and line[1] in [")", "."]:
                            option_text = line[2:].strip()
                            
                            # Check if this is the correct option
                            if "(correct)" in option_text.lower():
                                correct_option = len(options)
                                option_text = option_text.replace("(correct)", "").replace("(Correct)", "").strip()
                            
                            options.append(option_text)
                    
                    # Save the last question if exists
                    if current_question and options:
                        question = Question.objects.create(
                            quiz=quiz,
                            text=current_question,
                            difficulty=difficulty
                        )
                        
                        for i, option_text in enumerate(options):
                            Option.objects.create(
                                question=question,
                                text=option_text,
                                is_correct=(i == correct_option)
                            )
                
                except Exception as e:
                    return Response({"error": f"OpenAI API error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({"message": "Quiz generated successfully", "quiz_id": quiz.id}, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    
    @action(detail=True, methods=['post'])
    def submit_attempt(self, request, pk=None):
        quiz = self.get_object()
        user = request.user
        answers = request.data.get('answers', [])
        
        correct_count = 0
        total_questions = quiz.questions.count()
        
        for answer in answers:
            question_id = answer.get('question_id')
            selected_option_id = answer.get('option_id')
            
            try:
                question = Question.objects.get(id=question_id, quiz=quiz)
                if Option.objects.get(id=selected_option_id, question=question).is_correct:
                    correct_count += 1
            except (Question.DoesNotExist, Option.DoesNotExist):
                continue
        
        if total_questions > 0:
            score = (correct_count / total_questions) * 100
        else:
            score = 0
            
        # Pass if score is 70% or higher
        passed = score >= 70
        
        # Create quiz attempt
        attempt = QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score=score,
            passed=passed
        )
        
        # If passed, mark the course as completed
        if passed:
            user_course = UserCourse.objects.get(user=user, course=quiz.course)
            user_course.completed = True
            user_course.completed_at = datetime.now()
            user_course.progress = 100
            user_course.save()
            
            # Generate certificate
            certificate_id = f"CERT-{uuid.uuid4().hex[:8].upper()}"
            certificate = Certificate.objects.create(
                user=user,
                course=quiz.course,
                certificate_id=certificate_id
            )
            
        return Response({
            "score": score,
            "passed": passed,
            "correct": correct_count,
            "total": total_questions
        })

class UserCourseViewSet(viewsets.ModelViewSet):
    serializer_class = UserCourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserCourse.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        user_course = self.get_object()
        progress = request.data.get('progress', 0)
        
        user_course.progress = min(progress, 100)
        user_course.save()
        
        return Response(UserCourseSerializer(user_course).data)

class CertificateViewSet(viewsets.ModelViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mint_nft(self, request, pk=None):
        certificate = self.get_object()
        
        # In a real implementation, we would:
        # 1. Generate a PDF certificate
        # 2. Upload it to IPFS
        # 3. Mint an NFT with the IPFS link
        # 4. Store the blockchain transaction details
        
        # For now, we'll just simulate this
        certificate.ipfs_hash = f"ipfs://QmHash{uuid.uuid4().hex[:10]}"
        certificate.blockchain_tx = f"0x{uuid.uuid4().hex}"
        certificate.nft_token_id = str(uuid.uuid4().int)[:8]
        certificate.save()
        
        return Response(CertificateSerializer(certificate).data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """
    Get current user information
    """
    user = request.user
    return JsonResponse({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'profile': {
            'bio': user.profile.bio if hasattr(user, 'profile') else None,
            'avatar': user.profile.avatar.url if hasattr(user, 'profile') and user.profile.avatar else None,
            'wallet_address': user.profile.wallet_address if hasattr(user, 'profile') else None,
        }
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def config(request):
    """
    Provide frontend configuration settings
    """
    return Response({
        'simulate_minting': os.environ.get('SIMULATE_MINTING', 'True').lower() == 'true',
        'nft_contract_address': os.environ.get('NFT_CONTRACT_ADDRESS', ''),
        'blockchain_network': os.environ.get('BLOCKCHAIN_NETWORK', 'polygon-mumbai'),
        'api_version': '1.0.0',
        'pdf_viewer_enabled': True,
    })
