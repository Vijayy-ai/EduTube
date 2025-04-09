from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action

import os
from youtube_transcript_api import YouTubeTranscriptApi
import googleapiclient.discovery
import google.generativeai as genai

from .models import Quiz, Question, Option, QuizAttempt
from .serializers import QuizSerializer, QuestionSerializer, OptionSerializer, QuizAttemptSerializer, AnswerSerializer
from courses.models import Course

def get_youtube_service():
    """
    Create and return a YouTube API service object
    """
    return googleapiclient.discovery.build(
        "youtube", "v3", 
        developerKey=os.environ.get('YOUTUBE_API_KEY')
    )

class QuizViewSet(viewsets.ModelViewSet):
    """
    ViewSet for quizzes
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    
    def get_queryset(self):
        """
        Optionally filter by course_id
        """
        queryset = Quiz.objects.all()
        course_id = self.request.query_params.get('course', None)
        
        # Check if course_id is valid before filtering
        if course_id is not None and course_id != 'undefined' and course_id.isdigit():
            queryset = queryset.filter(course_id=course_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def submit_attempt(self, request, pk=None):
        """
        Submit an attempt for a quiz
        """
        quiz = self.get_object()
        user = request.user
        
        # Add debugging information
        print("Submit attempt for quiz:", pk)
        print("Request data:", request.data)
        print("User:", user.username)
        
        # Parse answers from request
        answers = request.data.get('answers', [])
        print("Received answers:", answers)
        
        answers_serializer = AnswerSerializer(data=answers, many=True)
        if not answers_serializer.is_valid():
            print("Answer serializer errors:", answers_serializer.errors)
            return Response(answers_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create attempt
        attempt_data = {
            'user': user.id,
            'quiz': quiz.id,
            'answers': answers_serializer.validated_data
        }
        
        attempt_serializer = QuizAttemptSerializer(data=attempt_data, context={'request': request})
        if attempt_serializer.is_valid():
            attempt = attempt_serializer.save()
            return Response(QuizAttemptSerializer(attempt).data)
        
        print("Attempt serializer errors:", attempt_serializer.errors)
        return Response(attempt_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for questions
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    
    def get_queryset(self):
        """
        Optionally filter by quiz_id
        """
        queryset = Question.objects.all()
        quiz_id = self.request.query_params.get('quiz', None)
        if quiz_id is not None:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset

class QuizAttemptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for quiz attempts
    """
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return only the current user's attempts
        """
        return QuizAttempt.objects.filter(user=self.request.user)

class GenerateQuizView(APIView):
    """
    View for generating a quiz from a course
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """
        Generate a quiz for a course using Google's Gemini AI
        """
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({'error': 'course_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get course details from YouTube
        youtube = get_youtube_service()
        
        # Get video details or playlist details
        video_ids = []
        
        if course.is_playlist:
            # For playlists, get the first few videos (up to 5)
            try:
                playlist_items_request = youtube.playlistItems().list(
                    part="snippet,contentDetails",
                    playlistId=course.youtube_id,
                    maxResults=5
                )
                playlist_response = playlist_items_request.execute()
                
                video_ids = [item['contentDetails']['videoId'] for item in playlist_response['items']]
            except Exception as e:
                print(f"Error fetching playlist items: {e}")
                return Response({"error": f"Failed to fetch playlist items: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Single video - just use the video ID directly
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
        
        # Truncate if too long (Gemini also has token limits)
        max_length = 10000  # Gemini can handle more tokens than GPT-3
        if len(transcript_text) > max_length:
            transcript_text = transcript_text[:max_length]
        
        # Get video/playlist title and description
        if course.is_playlist:
            try:
                playlist_request = youtube.playlists().list(
                    part="snippet",
                    id=course.youtube_id
                )
                playlist_response = playlist_request.execute()
                playlist_data = playlist_response['items'][0]['snippet']
                title = playlist_data['title']
                description = playlist_data['description']
            except Exception as e:
                print(f"Error fetching playlist details: {e}")
                # If we can't get the playlist details, use the course title and description
                title = course.title
                description = course.description
        else:
            try:
                video_request = youtube.videos().list(
                    part="snippet",
                    id=course.youtube_id
                )
                video_response = video_request.execute()
                video_data = video_response['items'][0]['snippet']
                title = video_data['title']
                description = video_data['description']
            except Exception as e:
                print(f"Error fetching video details: {e}")
                # If we can't get the video details, use the course title and description
                title = course.title
                description = course.description
        
        # Get Gemini API key from environment variable
        gemini_api_key = os.environ.get('GEMINI_API_KEY', '')
        if not gemini_api_key:
            return Response({"error": "Gemini API key not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # If transcript is empty, use the video title and description for quiz generation
        if not transcript_text:
            transcript_text = f"Title: {title}\n\nDescription: {description}"
            print(f"Warning: No transcript available. Using title and description only for quiz generation.")
        
        # Continue with the rest of the quiz generation logic...
        # ...existing code...


