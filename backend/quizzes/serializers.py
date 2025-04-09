from rest_framework import serializers
from .models import Quiz, Question, Option, QuizAttempt
from courses.serializers import CourseSerializer

class OptionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Option model
    """
    class Meta:
        model = Option
        fields = ['id', 'question', 'text', 'is_correct']
        read_only_fields = ['id']
        extra_kwargs = {
            'is_correct': {'write_only': True}  # Hide correct answer from API response
        }

class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer for the Question model
    """
    options = OptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'difficulty', 'options', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class QuizSerializer(serializers.ModelSerializer):
    """
    Serializer for the Quiz model
    """
    questions = QuestionSerializer(many=True, read_only=True)
    course_details = CourseSerializer(source='course', read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'course', 'course_details', 'questions', 'question_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_question_count(self, obj):
        """
        Get the number of questions in the quiz
        """
        return obj.questions.count()

class AnswerSerializer(serializers.Serializer):
    """
    Serializer for quiz answers
    """
    question_id = serializers.IntegerField()
    option_id = serializers.IntegerField()
    
    def to_internal_value(self, data):
        """
        Convert string IDs to integers if needed
        """
        try:
            question_id = data.get('question_id')
            option_id = data.get('option_id')
            
            # Convert string IDs to integers if they're strings
            if isinstance(question_id, str) and question_id.isdigit():
                data['question_id'] = int(question_id)
                
            if isinstance(option_id, str) and option_id.isdigit():
                data['option_id'] = int(option_id)
                
        except (TypeError, ValueError) as e:
            # If conversion fails, let the normal validation handle it
            print(f"Error converting ID: {e}")
            pass
            
        return super().to_internal_value(data)

class QuizAttemptSerializer(serializers.ModelSerializer):
    """
    Serializer for the QuizAttempt model
    """
    quiz_details = QuizSerializer(source='quiz', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    answers = AnswerSerializer(many=True, required=False)
    
    class Meta:
        model = QuizAttempt
        fields = ['id', 'user', 'username', 'quiz', 'quiz_details', 'score', 'passed', 'answers', 'created_at']
        read_only_fields = ['id', 'user', 'score', 'passed', 'created_at']
    
    def create(self, validated_data):
        """
        Set the user to the current user if not provided
        """
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Get the quiz
        quiz = validated_data.get('quiz')
        
        # Remove answers from validated_data
        answers_data = validated_data.pop('answers', [])
        
        # Calculate score before creating attempt
        correct_count = 0
        total_questions = quiz.questions.count()
        
        for answer in answers_data:
            question_id = answer.get('question_id')
            option_id = answer.get('option_id')
            
            try:
                option = Option.objects.get(id=option_id, question_id=question_id)
                if option.is_correct:
                    correct_count += 1
            except Option.DoesNotExist:
                pass
        
        # Set score and passed status in validated_data
        if total_questions > 0:
            validated_data['score'] = (correct_count / total_questions) * 100
            validated_data['passed'] = validated_data['score'] >= 70  # Pass threshold is 70%
        else:
            validated_data['score'] = 0
            validated_data['passed'] = False
            
        # Store answers in JSON format for future reference
        validated_data['answers'] = [{
            'question_id': answer.get('question_id'),
            'option_id': answer.get('option_id')
        } for answer in answers_data]
        
        # Create the attempt with score already calculated
        attempt = super().create(validated_data)
        
        return attempt 