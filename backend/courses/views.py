from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory
import googleapiclient.discovery
import os
from datetime import datetime
import redis
from django.core.cache import cache
import re
import json
import uuid
import random
from django.conf import settings
from django.http import JsonResponse
from django.db import IntegrityError, transaction
import hashlib  # For creating unique cache keys

from .models import Course, Lesson, UserCourse
from .serializers import CourseSerializer, LessonSerializer, UserCourseSerializer

# Custom throttle classes for courses API
class CourseUserRateThrottle(UserRateThrottle):
    rate = '30/minute'  # Increased from 10 to 30 requests per minute for authenticated users

class CourseAnonRateThrottle(AnonRateThrottle):
    rate = '15/minute'  # Increased from 3 to 15 requests per minute for anonymous users

# Initialize Redis connection
redis_client = redis.Redis.from_url(
    os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
    decode_responses=True
)

def get_youtube_service():
    """
    Create and return a YouTube API service object
    """
    api_key = os.environ.get('YOUTUBE_API_KEY', '').strip()
    
    if not api_key:
        print("ERROR: YouTube API key is not configured in the .env file")
        return None
    
    print(f"Initializing YouTube service with API key: {api_key[:5]}...{api_key[-4:]}")
    
    try:
        # Use caching to reduce API calls
        youtube = googleapiclient.discovery.build(
            "youtube", "v3", 
            developerKey=api_key,
            cache_discovery=False
        )
        
        # Test a simple API call to verify the key works
        try:
            # Make a minimal API call to test the key
            test_request = youtube.videos().list(
                part="snippet",
                id="dQw4w9WgXcQ", # A well-known video ID that's unlikely to be taken down
                maxResults=1
            )
            test_request.execute()
            print("YouTube API key is valid and working")
        except Exception as e:
            if "quota" in str(e).lower():
                print(f"ERROR: YouTube API quota exceeded: {str(e)}")
            elif "forbidden" in str(e).lower() or "403" in str(e):
                print(f"ERROR: YouTube API key is invalid or doesn't have proper permissions: {str(e)}")
            else:
                print(f"ERROR: YouTube API test request failed: {str(e)}")
            return None
            
        return youtube
    except Exception as e:
        print(f"ERROR: Failed to create YouTube service: {str(e)}")
        return None

class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for courses
    """
    queryset = Course.objects.all().order_by('-created_at')  # Order by creation date (newest first)
    serializer_class = CourseSerializer
    throttle_classes = [CourseUserRateThrottle, CourseAnonRateThrottle]
    
    def get_permissions(self):
        """
        Override to allow anyone to view courses but only authenticated users to create/edit
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'enroll', 'generate_quiz']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            # For update, partial_update, destroy
            permission_classes = [permissions.IsAdminUser]
        
        return [permission() for permission in permission_classes]
    
    # Cache the list method for 5 minutes
    @method_decorator(cache_page(60 * 5))
    def list(self, request, *args, **kwargs):
        """
        List all courses with caching
        """
        response = super().list(request, *args, **kwargs)
        
        # Add cache headers to the response
        response["Cache-Control"] = "public, max-age=300"  # 5 minutes
        response["Vary"] = "Accept, Authorization"
        
        return response
        
    # Cache the retrieve method for 10 minutes
    @method_decorator(cache_page(60 * 10))
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single course with caching
        """
        response = super().retrieve(request, *args, **kwargs)
        
        # Add cache headers to the response
        response["Cache-Control"] = "public, max-age=600"  # 10 minutes
        response["Vary"] = "Accept, Authorization"
        
        return response
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """
        Enroll the current user in a course
        """
        # Override the permission check for this action specifically
        self.permission_classes = [permissions.IsAuthenticated]
        self.check_permissions(request)
        
        course = self.get_object()
        user = request.user
        
        print(f"Enrolling user {user.username} in course {course.title}")
        
        # Check if already enrolled
        if UserCourse.objects.filter(user=user, course=course).exists():
            print(f"User {user.username} already enrolled in course {course.title}")
            return Response({'detail': 'Already enrolled in this course'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Create enrollment
        try:
            enrollment = UserCourse.objects.create(
                user=user,
                course=course,
                progress=0.0,
                completed=False
            )
            
            print(f"Successfully enrolled user {user.username} in course {course.title}")
            serializer = UserCourseSerializer(enrollment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error enrolling user {user.username} in course {course.title}: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    def create(self, request, *args, **kwargs):
        """
        Create a new course with detailed error handling
        """
        print(f"Attempting to create course: {request.data}")
        
        try:
            # Extract relevant data fields
            title = request.data.get('title', '')
            description = request.data.get('description', '')
            youtube_id = request.data.get('youtube_id', '')
            is_playlist = request.data.get('is_playlist', False)
            thumbnail_url = request.data.get('thumbnail_url', '')
            difficulty = request.data.get('difficulty', 'basic')
            
            # Validate required fields
            if not title:
                return Response({'detail': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not youtube_id:
                return Response({'detail': 'YouTube ID is required'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Validate the YouTube ID before saving
            youtube = get_youtube_service()
            if youtube:
                try:
                    if is_playlist:
                        # Check if it's a valid playlist ID
                        playlist_request = youtube.playlists().list(
                            part="snippet",
                            id=youtube_id
                        )
                        playlist_response = playlist_request.execute()
                        if not playlist_response.get('items'):
                            return Response({'detail': 'Invalid YouTube playlist ID'}, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        # Check if it's a valid video ID
                        video_request = youtube.videos().list(
                            part="snippet",
                            id=youtube_id
                        )
                        video_response = video_request.execute()
                        if not video_response.get('items'):
                            return Response({'detail': 'Invalid YouTube video ID'}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    print(f"Error validating YouTube ID: {str(e)}")
                    # Continue even if validation fails due to API issues
            
            # Check if course already exists
            if Course.objects.filter(youtube_id=youtube_id).exists():
                existing_course = Course.objects.get(youtube_id=youtube_id)
                print(f"Course with YouTube ID {youtube_id} already exists")
                
                # Auto-enroll user in existing course
                try:
                    if not UserCourse.objects.filter(user=request.user, course=existing_course).exists():
                        UserCourse.objects.create(
                            user=request.user,
                            course=existing_course,
                            progress=0.0,
                            completed=False
                        )
                        print(f"User {request.user.username} auto-enrolled in existing course {existing_course.title}")
                except Exception as enroll_err:
                    print(f"Error auto-enrolling in existing course: {str(enroll_err)}")
                
                # Return the existing course
                serializer = self.get_serializer(existing_course)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            # Create the new course
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            print(f"Created new course: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        
        except Exception as e:
            print(f"Error creating course: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override to add user enrollment status
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Add enrollment status for authenticated users
        if request.user.is_authenticated:
            try:
                enrollment = UserCourse.objects.get(user=request.user, course=instance)
                data['enrolled'] = True
                data['progress'] = enrollment.progress
                data['completed'] = enrollment.completed
            except UserCourse.DoesNotExist:
                data['enrolled'] = False
                data['progress'] = 0
                data['completed'] = False
        
        return Response(data)

    @action(detail=True, methods=['post'])
    def generate_quiz(self, request, pk=None):
        """
        Generate a quiz for this course
        """
        # Override default permissions for this action
        self.permission_classes = [permissions.IsAuthenticated]
        self.check_permissions(request)
        
        # Get the course
        course = self.get_object()
        user = request.user
        
        # Extract options from request data
        difficulty = request.data.get('difficulty', 'basic')
        question_count = int(request.data.get('question_count', 10))
        force_new = request.data.get('force_new', False)  # New parameter to force a new quiz

        # Check if this is a retake - if a quiz already exists for this course
        from quizzes.models import Quiz, QuizAttempt
        
        # Find existing quiz for this course
        existing_quiz = Quiz.objects.filter(course=course).first()
        
        # If a quiz exists and force_new is True, we'll handle previous attempts differently 
        if existing_quiz and force_new:
            # Delete previous attempts for this quiz by this user
            QuizAttempt.objects.filter(user=user, quiz=existing_quiz).delete()
            # Log this for debugging
            print(f"Deleted previous quiz attempts for user {user.username} on quiz {existing_quiz.id}")
            
            # We'll generate a new quiz and replace the old one
            print(f"Replacing existing quiz {existing_quiz.id} with a new one")
            existing_quiz.delete()
        
        # If quiz already exists and we're not forcing a new one, return it
        if existing_quiz and not force_new:
            from quizzes.serializers import QuizSerializer
            return Response(QuizSerializer(existing_quiz).data)
        
        try:
            # Import necessary modules here to avoid circular imports
            import os
            from google.generativeai import GenerativeModel
            import google.generativeai as genai
            from youtube_transcript_api import YouTubeTranscriptApi
            from quizzes.models import Quiz, Question, Option
            
            # Get YouTube service for fetching video details
            youtube = get_youtube_service()
            if not youtube:
                return Response(
                    {'error': 'YouTube API service could not be initialized'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Get video IDs to process
            if course.is_playlist:
                try:
                    # For playlists, get the first few videos (up to 5)
                    playlist_items_request = youtube.playlistItems().list(
                        part="snippet,contentDetails",
                        playlistId=course.youtube_id,
                        maxResults=5
                    )
                    playlist_response = playlist_items_request.execute()
                    video_ids = [item['contentDetails']['videoId'] for item in playlist_response['items']]
                except Exception as e:
                    print(f"Error fetching playlist items: {str(e)}")
                    # Fallback - if we can't get playlist items, treat as single video
                    video_ids = [course.youtube_id]
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
            
            # Truncate if too long (Gemini has token limits)
            max_length = 10000
            if len(transcript_text) > max_length:
                transcript_text = transcript_text[:max_length]
                
            # Get content details from YouTube
            if course.is_playlist:
                title = course.title
                description = course.description
            else:
                # Get video details
                video_request = youtube.videos().list(
                    part="snippet",
                    id=course.youtube_id
                )
                video_response = video_request.execute()
                if 'items' in video_response and video_response['items']:
                    video_data = video_response['items'][0]['snippet']
                    title = video_data.get('title', course.title)
                    description = video_data.get('description', course.description)
                else:
                    title = course.title
                    description = course.description
            
            # Get Gemini API key from environment
            gemini_api_key = os.environ.get('GEMINI_API_KEY')
            if not gemini_api_key:
                return Response(
                    {'error': 'Gemini API key not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Configure the Gemini API
            genai.configure(api_key=gemini_api_key)
            
            # Check available models and use fallback if needed
            try:
                # List available models
                available_models = genai.list_models()
                model_names = [model.name for model in available_models]
                print(f"Available Gemini models: {model_names}")
                
                # Try to find appropriate models for text generation
                preferred_models = [
                    'models/gemini-1.5-pro',
                    'models/gemini-pro',
                    'models/gemini-1.0-pro',
                    'models/gemini-1.5-flash',
                    'models/text-bison-001'
                ]
                
                # Find the first preferred model that's available
                model_name = None
                for preferred in preferred_models:
                    if any(preferred in m for m in model_names):
                        matching_models = [m for m in model_names if preferred in m]
                        model_name = matching_models[0]  # Take the first match
                        break
                
                if not model_name:
                    # No preferred models found, just try the first one that's not an embedding model
                    non_embedding_models = [m for m in model_names if 'embedding' not in m.lower()]
                    if non_embedding_models:
                        model_name = non_embedding_models[0]
                    
                if not model_name:
                    print("No suitable text generation models found, using fallback")
                    raise Exception("No text generation models available")
                
                print(f"Using Gemini model: {model_name}")
                
            except Exception as e:
                print(f"Error with Gemini models: {str(e)}, using fallback quiz generation")
                # Skip AI generation entirely and use fallback
                return self._generate_fallback_quiz(course, title, description)
            
            # Set up the Gemini model
            generation_config = {
                "temperature": 0.7,
                "top_p": 1,
                "top_k": 32,
                "max_output_tokens": 8192,
            }
            
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
            ]
            
            # Use the dynamically determined model name
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    generation_config=generation_config,
                    safety_settings=safety_settings
                )
            except Exception as model_error:
                print(f"Error creating Gemini model: {str(model_error)}, trying fallback model")
                # Try with an alternative model name if the first one fails
                try:
                    model = genai.GenerativeModel(
                        model_name="gemini-1.5-pro",  # Try alternate model
                        generation_config=generation_config,
                        safety_settings=safety_settings
                    )
                except Exception as e:
                    return Response(
                        {'error': f'Failed to initialize Gemini AI model: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            # First try using Gemini AI to generate questions
            questions_generated = 0
            use_fallback = False
            
            try:
                # Create a new quiz
                quiz = Quiz.objects.create(
                    course=course,
                    title=f"Quiz for {course.title}"
                )
                
                # Generate questions for each difficulty level using AI
                for diff_level in ['basic', 'intermediate', 'advanced']:
                    # Skip if we've generated enough questions already
                    if questions_generated >= question_count:
                        break
                    
                    # How many questions to generate at this difficulty level
                    questions_per_level = min(5, question_count - questions_generated)
                    
                    # Skip this difficulty level if user didn't request it
                    if difficulty != 'all' and difficulty != diff_level:
                        continue
                    
                    prompt = f"""
                    Generate {questions_per_level} multiple-choice quiz questions about the following educational content.
                    The questions should be at {diff_level} level.
                    Each question should have 4 options with exactly one correct answer.
                    
                    Title: {title}
                    Description: {description}
                    Transcript: {transcript_text}
                    
                    Format each question as:
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
                    Questions should be clear, concise, and focused on the important educational content.
                    DO NOT include any explanations, just the questions and options as specified.
                    """
                    
                    # Generate content with Gemini
                    response = model.generate_content(prompt)
                    generated_text = response.text
                    
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
                                    difficulty=diff_level
                                )
                                
                                for i, option_text in enumerate(options):
                                    Option.objects.create(
                                        question=question,
                                        text=option_text,
                                        is_correct=(i == correct_option)
                                    )
                                
                                questions_generated += 1
                            
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
                            difficulty=diff_level
                        )
                        
                        for i, option_text in enumerate(options):
                            Option.objects.create(
                                question=question,
                                text=option_text,
                                is_correct=(i == correct_option)
                            )
                        
                        questions_generated += 1
                
                # If no questions were generated, use the fallback
                if questions_generated == 0:
                    quiz.delete()
                    return self._generate_fallback_quiz(course, title, description)
                
                # Return success
                from quizzes.serializers import QuizSerializer
                return Response(
                    {
                        'message': 'Quiz generated successfully',
                        'id': quiz.id, 
                        'quiz': QuizSerializer(quiz).data
                    },
                    status=status.HTTP_201_CREATED
                )
                
            except Exception as ai_error:
                print(f"Error during AI quiz generation: {str(ai_error)}")
                # Clean up any partially created quiz
                try:
                    if 'quiz' in locals() and quiz:
                        quiz.delete()
                except Exception:
                    pass
                
                # Use the fallback method
                return self._generate_fallback_quiz(course, title, description)
        
        except Exception as e:
            print(f"Error generating quiz: {str(e)}")
            return Response(
                {'error': f'Failed to generate quiz: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def quiz(self, request, pk=None):
        """
        Get quizzes for a specific course
        """
        from quizzes.models import Quiz
        from quizzes.serializers import QuizSerializer
        
        course = self.get_object()
        quizzes = Quiz.objects.filter(course=course)
        
        if not quizzes.exists():
            return Response({'detail': 'No quiz found for this course'}, status=status.HTTP_404_NOT_FOUND)
        
        # Return the most recent quiz
        quiz = quizzes.order_by('-id').first()
        serializer = QuizSerializer(quiz)
        return Response(serializer.data)

    def _generate_fallback_quiz(self, course, title, description):
        """
        Generate a simple quiz with sample questions when AI generation fails
        """
        from quizzes.models import Quiz, Question, Option
        
        print("Using fallback method to generate sample quiz questions")
        
        # Create a new quiz
        quiz = Quiz.objects.create(
            course=course,
            title=f"Quiz for {course.title}"
        )
        
        # Generate some sample questions based on the video title
        sample_questions = [
            {
                "text": f"What is the main topic of '{title}'?",
                "options": [
                    {"text": "The content shown in the video", "is_correct": True},
                    {"text": "An unrelated topic", "is_correct": False},
                    {"text": "The history of YouTube", "is_correct": False},
                    {"text": "None of the above", "is_correct": False}
                ],
                "difficulty": "basic"
            },
            {
                "text": f"Who created '{title}'?",
                "options": [
                    {"text": "The channel owner", "is_correct": True},
                    {"text": "A random content creator", "is_correct": False},
                    {"text": "An AI system", "is_correct": False},
                    {"text": "Unknown", "is_correct": False}
                ],
                "difficulty": "basic"
            },
            {
                "text": "What platform is this content hosted on?",
                "options": [
                    {"text": "YouTube", "is_correct": True},
                    {"text": "Vimeo", "is_correct": False},
                    {"text": "Facebook", "is_correct": False},
                    {"text": "TikTok", "is_correct": False}
                ],
                "difficulty": "basic"
            },
            {
                "text": "Which of the following is true about this content?",
                "options": [
                    {"text": "It is available online", "is_correct": True},
                    {"text": "It requires a special subscription", "is_correct": False},
                    {"text": "It's only available in printed form", "is_correct": False},
                    {"text": "It doesn't exist", "is_correct": False}
                ],
                "difficulty": "basic"
            },
            {
                "text": "What is required to watch this content?",
                "options": [
                    {"text": "Internet access", "is_correct": True},
                    {"text": "Special hardware", "is_correct": False},
                    {"text": "A paid subscription", "is_correct": False},
                    {"text": "Administrative permission", "is_correct": False}
                ],
                "difficulty": "basic"
            }
        ]
        
        # Create the sample questions in the database
        questions_generated = 0
        for q_data in sample_questions:
            question = Question.objects.create(
                quiz=quiz,
                text=q_data["text"],
                difficulty=q_data["difficulty"]
            )
            
            for o_data in q_data["options"]:
                Option.objects.create(
                    question=question,
                    text=o_data["text"],
                    is_correct=o_data["is_correct"]
                )
            
            questions_generated += 1
        
        # Return success
        from quizzes.serializers import QuizSerializer
        return Response(
            {
                'message': 'Quiz generated successfully (using sample questions)',
                'id': quiz.id, 
                'quiz': QuizSerializer(quiz).data
            },
            status=status.HTTP_201_CREATED
        )

class LessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for lessons
    """
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    
    def get_permissions(self):
        """
        Override to allow anyone to view lessons but only admins to create/edit
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Optionally filter by course_id
        """
        queryset = Lesson.objects.all()
        course_id = self.request.query_params.get('course_id', None)
        if course_id is not None:
            queryset = queryset.filter(course_id=course_id)
        return queryset

class UserCourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user course enrollments
    """
    serializer_class = UserCourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only the current user's courses
        """
        return UserCourse.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """
        Update a user's progress in a course
        """
        user_course = self.get_object()
        progress = request.data.get('progress', user_course.progress)
        completed_lesson = request.data.get('lesson_id')
        
        # Update progress
        user_course.progress = progress
        
        # Add to completed lessons if provided
        if completed_lesson:
            if not user_course.completed_lessons:
                user_course.completed_lessons = []
            
            if completed_lesson not in user_course.completed_lessons:
                user_course.completed_lessons.append(completed_lesson)
        
        # Check if all lessons are completed
        lesson_count = Lesson.objects.filter(course=user_course.course).count()
        if lesson_count > 0 and len(user_course.completed_lessons or []) == lesson_count:
            user_course.completed = True
            user_course.completed_at = timezone.now()
        
        user_course.save()
        
        serializer = self.get_serializer(user_course)
        return Response(serializer.data)

class YouTubeSearchView(APIView):
    """
    View for searching YouTube videos and playlists
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Empty list to override default authentication
    # Use minimal throttling to conserve quota
    throttle_classes = [CourseUserRateThrottle, CourseAnonRateThrottle]
    
    def options(self, request, *args, **kwargs):
        """
        Handle OPTIONS requests for CORS preflight
        """
        response = Response()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    
    def post(self, request):
        """
        Search YouTube for videos or playlists
        """
        # Debug info
        print(f"YouTubeSearchView.post called by user: {request.user}")
        print(f"Request data: {request.data}")
        
        # Get parameters from request data
        query = request.data.get('query', '')
        video_id = request.data.get('video_id', '')
        playlist_id = request.data.get('playlist_id', '')
        search_type = request.data.get('search_type', 'video')
        
        print(f"Search parameters: query='{query}', video_id='{video_id}', playlist_id='{playlist_id}', search_type='{search_type}'")
        
        # Allow searching by video_id or playlist_id as well
        if not query and not video_id and not playlist_id:
            return Response({'error': 'Query, video_id, or playlist_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create a unique cache key based on all parameters
        cache_params = {
            'query': query,
            'video_id': video_id,
            'playlist_id': playlist_id,
            'search_type': search_type
        }
        cache_key_str = json.dumps(cache_params, sort_keys=True)
        cache_key = f"youtube_search_{hashlib.md5(cache_key_str.encode()).hexdigest()}"
        
        # Check Redis cache first
        try:
            cached_results = redis_client.get(cache_key)
            if cached_results:
                print(f"Using Redis cached results for key: {cache_key}")
                results = json.loads(cached_results)
                
                # Add cache control headers to let frontend know the response is cached
                response = Response(results)
                response["X-Cache"] = "HIT"
                response["X-Cache-Source"] = "Redis"
                response["Cache-Control"] = "public, max-age=86400"  # 24 hours
                response["Access-Control-Allow-Origin"] = "*"
                response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
                response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
                return response
        except Exception as redis_error:
            print(f"Redis error: {redis_error}")
            # If Redis fails, fall back to Django's cache
            try:
                cached_results = cache.get(cache_key)
                if cached_results:
                    print(f"Using Django cached results for key: {cache_key}")
                    
                    # Add cache control headers
                    response = Response(cached_results)
                    response["X-Cache"] = "HIT"
                    response["X-Cache-Source"] = "Django Cache"
                    response["Cache-Control"] = "public, max-age=86400"  # 24 hours
                    response["Access-Control-Allow-Origin"] = "*"
                    response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
                    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
                    return response
            except Exception as cache_error:
                print(f"Django cache error: {cache_error}")
                # Continue with API call if caching fails
        
        try:
            # Test that we can get the YouTube service with the API key
            try:
                youtube = get_youtube_service()
                if not youtube:
                    return Response(
                        {'error': 'YouTube API service could not be initialized. Check your API key.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except Exception as e:
                print(f"Error initializing YouTube service: {e}")
                return Response(
                    {'error': f'YouTube API initialization error: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
            results = []
            
            try:
                # If searching by ID, don't limit results
                if video_id or playlist_id:
                    # Get details for specific video or playlist
                    if search_type == 'playlist' and playlist_id:
                        # Get playlist details
                        playlist_request = youtube.playlists().list(
                            part="snippet,contentDetails",
                            id=playlist_id
                        )
                        playlist_response = playlist_request.execute()
                        
                        for item in playlist_response.get('items', []):
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
                    elif search_type == 'video' and video_id:
                        # Get video details
                        video_request = youtube.videos().list(
                            part="snippet,contentDetails,statistics",
                            id=video_id
                        )
                        video_response = video_request.execute()
                        
                        for item in video_response.get('items', []):
                            video_id = item['id']
                            snippet = item['snippet']
                            content_details = item.get('contentDetails', {})
                            statistics = item.get('statistics', {})
                            
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
                # For regular search queries, get a mix of playlists and videos
                elif search_type == 'all' and query:
                    # Create a cache key based on the query
                    cache_key = f"youtube_search_{query.lower().replace(' ', '_')}"
                    cached_results = cache.get(cache_key)
                    
                    if cached_results:
                        print(f"Using cached results for query: {query}")
                        return Response(cached_results)
                    
                    # Search for both videos and playlists
                    # First, get videos (limited to 1)
                    print("Searching for videos (limited to 1 result)...")
                    video_search_request = youtube.search().list(
                        part="snippet",
                        maxResults=5,  # Get more to filter out shorts
                        q=query,
                        type="video"
                    )
                    video_response = video_search_request.execute()
                    
                    # Filter out shorts (typically < 1 min and have #shorts in title or description)
                    filtered_videos = []
                    video_count = 0
                    for item in video_response.get('items', []):
                        video_id = item['id']['videoId']
                        snippet = item['snippet']
                        title = snippet.get('title', '').lower()
                        description = snippet.get('description', '').lower()
                        
                        # Skip shorts
                        if '#shorts' in title or '#shorts' in description or 'short' in title or '/shorts/' in description:
                            print(f"Skipping likely short: {title}")
                            continue
                        
                        # Get video duration to check if it's a short
                        video_request = youtube.videos().list(
                            part="contentDetails,statistics",
                            id=video_id
                        )
                        video_response = video_request.execute()
                        video_details = video_response.get('items', [{}])[0] if video_response.get('items') else {}
                        content_details = video_details.get('contentDetails', {})
                        statistics = video_details.get('statistics', {})
                        
                        # Parse duration to check if it's a short (less than 1 minute)
                        duration_str = content_details.get('duration', '')
                        if 'PT' in duration_str:
                            if 'M' not in duration_str and 'H' not in duration_str:
                                # Only seconds, likely a short
                                print(f"Skipping short duration video: {title}, duration: {duration_str}")
                                continue
                        
                        filtered_videos.append({
                            'id': video_id,
                            'title': snippet.get('title', ''),
                            'description': snippet.get('description', ''),
                            'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                            'channelTitle': snippet.get('channelTitle', ''),
                            'duration': content_details.get('duration', ''),
                            'viewCount': statistics.get('viewCount', 0),
                            'publishedAt': snippet.get('publishedAt', '')
                        })
                        
                        video_count += 1
                        if video_count >= 1:  # Only include 1 video
                            break
                    
                    # Then, get playlists (limited to 1)
                    print("Searching for playlists (limited to 1 result)...")
                    playlist_search_request = youtube.search().list(
                        part="snippet",
                        maxResults=1,
                        q=query,
                        type="playlist"
                    )
                    playlist_response = playlist_search_request.execute()
                    
                    # Get playlist IDs
                    playlist_ids = [item['id']['playlistId'] for item in playlist_response.get('items', [])]
                    
                    # Get detailed information for these playlists
                    if playlist_ids:
                        playlist_request = youtube.playlists().list(
                            part="snippet,contentDetails",
                            id=",".join(playlist_ids)
                        )
                        playlist_response = playlist_request.execute()
                        
                        for item in playlist_response.get('items', []):
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
                    
                    # Add filtered videos to results
                    results.extend(filtered_videos)
                    
                    # Cache the results for 10 minutes
                    cache.set(cache_key, results, 60 * 10)
                    
                elif search_type == 'playlist':
                    print("Searching for playlists...")
                    # First, search for playlists using the search endpoint
                    search_request = youtube.search().list(
                        part="snippet",
                        maxResults=2,  # Limit to 2 playlists
                        q=query,
                        type="playlist"
                    )
                    search_response = search_request.execute()
                    print(f"Playlist search response received with {len(search_response.get('items', []))} items")
                    
                    # Get the playlist IDs from the search results
                    playlist_ids = [item['id']['playlistId'] for item in search_response.get('items', [])]
                    
                    # If we have playlist IDs, get more details
                    if playlist_ids:
                        # Get detailed information for these playlists
                        playlist_request = youtube.playlists().list(
                            part="snippet,contentDetails",
                            id=",".join(playlist_ids)
                        )
                        playlist_response = playlist_request.execute()
                        
                        for item in playlist_response.get('items', []):
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
                        # For no results
                        print("No playlists found matching the query")
                else:
                    print("Searching for videos...")
                    search_request = youtube.search().list(
                        part="snippet",
                        maxResults=5,  # Get more to filter out shorts
                        q=query,
                        type="video"
                    )
                    response = search_request.execute()
                    print(f"Video search response received with {len(response.get('items', []))} items")
                    
                    # Filter out shorts and limit to 2 videos
                    video_count = 0
                    for item in response.get('items', []):
                        video_id = item['id']['videoId']
                        snippet = item['snippet']
                        title = snippet.get('title', '').lower()
                        description = snippet.get('description', '').lower()
                        
                        # Skip shorts
                        if '#shorts' in title or '#shorts' in description or 'short' in title or '/shorts/' in description:
                            print(f"Skipping likely short: {title}")
                            continue
                        
                        # Get video duration and statistics
                        video_request = youtube.videos().list(
                            part="contentDetails,statistics",
                            id=video_id
                        )
                        video_response = video_request.execute()
                        video_details = video_response.get('items', [{}])[0] if video_response.get('items') else {}
                        content_details = video_details.get('contentDetails', {})
                        statistics = video_details.get('statistics', {})
                        
                        # Parse duration to check if it's a short (less than 1 minute)
                        duration_str = content_details.get('duration', '')
                        if 'PT' in duration_str:
                            if 'M' not in duration_str and 'H' not in duration_str:
                                # Only seconds, likely a short
                                print(f"Skipping short duration video: {title}, duration: {duration_str}")
                                continue
                        
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
                        
                        video_count += 1
                        if video_count >= 2:  # Only include 2 videos
                            break
                    
                print(f"Returning {len(results)} results")
                
                # Cache the results in both Redis and Django's cache for redundancy
                try:
                    # Set in Redis with an expiration of 24 hours (86400 seconds)
                    redis_client.setex(cache_key, 86400, json.dumps(results))
                    print(f"Results cached in Redis with key: {cache_key}")
                except Exception as redis_error:
                    print(f"Failed to cache in Redis: {redis_error}")
                    # If Redis fails, use Django's cache as fallback
                    try:
                        # Cache in Django's cache for 24 hours
                        cache.set(cache_key, results, 60 * 60 * 24)
                        print(f"Results cached in Django's cache with key: {cache_key}")
                    except Exception as cache_error:
                        print(f"Failed to cache in Django's cache: {cache_error}")
                
                # Add explicit CORS and cache-control headers to the response
                response = Response(results)
                response["Access-Control-Allow-Origin"] = "*"
                response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
                response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
                response["X-Cache"] = "MISS"
                response["Cache-Control"] = "public, max-age=86400"  # 24 hours
                return response
            except Exception as api_err:
                print(f"YouTube API error: {str(api_err)}")
                error_response = Response({'error': f'YouTube API error: {str(api_err)}'}, 
                               status=status.HTTP_400_BAD_REQUEST)
                error_response["Access-Control-Allow-Origin"] = "*"
                error_response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
                error_response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
                return error_response
        except Exception as e:
            print(f"Unexpected error in YouTube search: {str(e)}")
            error_response = Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            error_response["Access-Control-Allow-Origin"] = "*"
            error_response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            error_response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            return error_response

@api_view(['POST', 'OPTIONS'])
@permission_classes([permissions.AllowAny])
@throttle_classes([CourseUserRateThrottle, CourseAnonRateThrottle])
def test_youtube_search(request):
    """
    Endpoint for YouTube search with caching
    """
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = Response()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type, Authorization"
        return response
    
    query = request.data.get('query', '')
    video_id = request.data.get('video_id', '')
    playlist_id = request.data.get('playlist_id', '')
    search_type = request.data.get('search_type', 'video')
    
    # Cache key based on the search parameters
    cache_key = f"youtube_search_{search_type}_{query}_{video_id}_{playlist_id}"
    cached_results = cache.get(cache_key)
    
    if cached_results:
        print(f"Returning cached results for '{query or video_id or playlist_id}'")
        return Response(cached_results)
    
    # Allow searching by video_id or playlist_id as well
    if not query and not video_id and not playlist_id:
        return Response({'error': 'Query, video_id, or playlist_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        youtube = get_youtube_service()
        results = []
        
        if search_type == 'playlist' or (search_type == 'all' and playlist_id):
            if playlist_id:
                # Get specific playlist details
                playlist_request = youtube.playlists().list(
                    part="snippet,contentDetails",
                    id=playlist_id
                )
                playlist_response = playlist_request.execute()
                
                for item in playlist_response.get('items', []):
                    playlist_id = item['id']
                    snippet = item['snippet']
                    content_details = item.get('contentDetails', {})
                    
                    results.append({
                        'videoId': None,
                        'playlistId': playlist_id,
                        'title': snippet['title'],
                        'description': snippet['description'],
                        'thumbnail': snippet['thumbnails']['high']['url'] if 'high' in snippet['thumbnails'] else snippet['thumbnails']['default']['url'],
                        'channelTitle': snippet['channelTitle'],
                        'publishedAt': snippet['publishedAt'],
                        'itemCount': content_details.get('itemCount', 0)
                    })
            else:
                # Search for playlists
                playlist_search_request = youtube.search().list(
                    part="snippet",
                    q=query,
                    type="playlist",
                    maxResults=10
                )
                playlist_search_response = playlist_search_request.execute()
                
                for item in playlist_search_response.get('items', []):
                    playlist_id = item['id']['playlistId']
                    snippet = item['snippet']
                    
                    results.append({
                        'videoId': None,
                        'playlistId': playlist_id,
                        'title': snippet['title'],
                        'description': snippet['description'],
                        'thumbnail': snippet['thumbnails']['high']['url'] if 'high' in snippet['thumbnails'] else snippet['thumbnails']['default']['url'],
                        'channelTitle': snippet['channelTitle'],
                        'publishedAt': snippet['publishedAt']
                    })
        
        if search_type == 'video' or (search_type == 'all' and video_id):
            if video_id:
                # Get specific video details
                video_request = youtube.videos().list(
                    part="snippet,contentDetails,statistics",
                    id=video_id
                )
                video_response = video_request.execute()
                
                for item in video_response.get('items', []):
                    video_id = item['id']
                    snippet = item['snippet']
                    statistics = item.get('statistics', {})
                    content_details = item.get('contentDetails', {})
                    
                    results.append({
                        'videoId': video_id,
                        'playlistId': None,
                        'title': snippet['title'],
                        'description': snippet['description'],
                        'thumbnail': snippet['thumbnails']['high']['url'] if 'high' in snippet['thumbnails'] else snippet['thumbnails']['default']['url'],
                        'channelTitle': snippet['channelTitle'],
                        'publishedAt': snippet['publishedAt'],
                        'viewCount': statistics.get('viewCount', 0),
                        'duration': content_details.get('duration', '')
                    })
            else:
                # Search for videos
                search_request = youtube.search().list(
                    part="snippet",
                    q=query,
                    type="video",
                    maxResults=20
                )
                search_response = search_request.execute()
                
                # Get video IDs from search results
                video_ids = [item['id']['videoId'] for item in search_response.get('items', [])]
                
                if video_ids:
                    # Get detailed video information
                    videos_request = youtube.videos().list(
                        part="snippet,contentDetails,statistics",
                        id=",".join(video_ids)
                    )
                    videos_response = videos_request.execute()
                    
                    video_details = {}
                    for item in videos_response.get('items', []):
                        video_details[item['id']] = {
                            'duration': item.get('contentDetails', {}).get('duration', ''),
                            'viewCount': item.get('statistics', {}).get('viewCount', 0)
                        }
                    
                    # Combine search results with detailed information
                    for item in search_response.get('items', []):
                        video_id = item['id']['videoId']
                        snippet = item['snippet']
                        details = video_details.get(video_id, {})
                        
                        results.append({
                            'videoId': video_id,
                            'playlistId': None,
                            'title': snippet['title'],
                            'description': snippet['description'],
                            'thumbnail': snippet['thumbnails']['high']['url'] if 'high' in snippet['thumbnails'] else snippet['thumbnails']['default']['url'],
                            'channelTitle': snippet['channelTitle'],
                            'publishedAt': snippet['publishedAt'],
                            'viewCount': details.get('viewCount', 0),
                            'duration': details.get('duration', '')
                        })
        
        # Cache the results
        cache.set(cache_key, results, 60 * 30)  # Cache for 30 minutes
        
        # Add explicit CORS headers to the response
        response = Response(results)
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    except Exception as e:
        print(f"Error in test_youtube_search: {str(e)}")
        error_response = Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        error_response["Access-Control-Allow-Origin"] = "*"
        error_response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        error_response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return error_response

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def youtube_playlist_items(request, playlist_id):
    """
    Get videos from a YouTube playlist
    """
    print(f"Fetching videos for playlist: {playlist_id}")
    
    try:
        api_key = os.environ.get('YOUTUBE_API_KEY', '').strip()
        if not api_key:
            return Response({'error': 'YouTube API key is not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        youtube = googleapiclient.discovery.build(
            "youtube", "v3", 
            developerKey=api_key
        )
        
        # Get playlist items
        playlist_items = []
        next_page_token = None
        
        while True:
            # Get playlist items (up to 50 at a time)
            playlist_request = youtube.playlistItems().list(
                part="snippet,contentDetails",
                maxResults=50,
                playlistId=playlist_id,
                pageToken=next_page_token
            )
            playlist_response = playlist_request.execute()
            
            # Get all video IDs to fetch details in a single request
            video_ids = [item['contentDetails']['videoId'] for item in playlist_response.get('items', [])]
            
            if video_ids:
                # Get video details (duration, view count, etc.)
                video_request = youtube.videos().list(
                    part="contentDetails,statistics",
                    id=','.join(video_ids)
                )
                video_response = video_request.execute()
                video_details = {item['id']: item for item in video_response.get('items', [])}
                
                # Combine playlist item data with video details
                for item in playlist_response.get('items', []):
                    video_id = item['contentDetails']['videoId']
                    snippet = item['snippet']
                    content_details = video_details.get(video_id, {}).get('contentDetails', {})
                    statistics = video_details.get(video_id, {}).get('statistics', {})
                    
                    playlist_items.append({
                        'id': video_id,
                        'title': snippet.get('title', ''),
                        'description': snippet.get('description', ''),
                        'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                        'channelTitle': snippet.get('channelTitle', ''),
                        'duration': content_details.get('duration', ''),
                        'viewCount': statistics.get('viewCount', 0),
                        'publishedAt': snippet.get('publishedAt', '')
                    })
            
            # Check if there are more pages
            next_page_token = playlist_response.get('nextPageToken')
            if not next_page_token or len(playlist_items) >= 50:  # Limit to 50 videos max
                break
        
        print(f"Retrieved {len(playlist_items)} videos from playlist {playlist_id}")
        return Response(playlist_items)
        
    except Exception as e:
        print(f"Error fetching playlist items: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
