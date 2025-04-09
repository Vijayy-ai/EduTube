from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
import firebase_admin
from firebase_admin import auth as firebase_auth

from .models import Profile
from .serializers import UserSerializer, ProfileSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user profiles
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Profile.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current user's profile"""
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

class CurrentUserView(APIView):
    """
    View to get the current authenticated user's details
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update the current user's details"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    """
    View for user registration
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        user_data = {
            'username': request.data.get('username'),
            'email': request.data.get('email'),
            'password': request.data.get('password'),
            'first_name': request.data.get('first_name', ''),
            'last_name': request.data.get('last_name', '')
        }
        
        # Check if user already exists
        if User.objects.filter(username=user_data['username']).exists():
            return Response({'username': ['User with this username already exists.']},
                            status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=user_data['email']).exists():
            return Response({'email': ['User with this email already exists.']},
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Create the user
        user_serializer = UserSerializer(data=user_data)
        if user_serializer.is_valid():
            user = user_serializer.save()
            user.set_password(user_data['password'])
            user.save()
            
            # Create profile for the user
            profile_data = {
                'user': user.id,
                'firebase_uid': request.data.get('firebase_uid', '')
            }
            profile_serializer = ProfileSerializer(data=profile_data)
            if profile_serializer.is_valid():
                profile_serializer.save()
            
            # Generate auth token
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'user': user_serializer.data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FirebaseAuthView(APIView):
    """
    View to authenticate with Firebase
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
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
                # First try to find by firebase_uid
                profile = Profile.objects.filter(firebase_uid=firebase_uid).first()
                if profile:
                    user = profile.user
                else:
                    # Then try by email
                    user = User.objects.get(email=email)
                    
                    # Update firebase_uid if not set
                    profile = Profile.objects.get_or_create(user=user)[0]
                    if not profile.firebase_uid:
                        profile.firebase_uid = firebase_uid
                        profile.save()
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
                
                # Create profile
                Profile.objects.create(user=user, firebase_uid=firebase_uid)
            
            # Generate or get existing token
            token, created = Token.objects.get_or_create(user=user)
            
            # Return user info and token
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
