from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Event, Registration
from .serializers import UserSerializer, EventSerializer, RegistrationSerializer
from django.shortcuts import get_object_or_404
from django.utils import timezone

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

class EventListCreateView(generics.ListCreateAPIView):
    queryset = Event.objects.filter(date__gte=timezone.now().date()).order_by('date')
    serializer_class = EventSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class EventDetailView(generics.RetrieveAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]

class RegisterForEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, event_id):
        event = get_object_or_404(Event, pk=event_id)
        
        if event.date < timezone.now().date():
            return Response({"error": "Cannot register for past events"}, status=status.HTTP_400_BAD_REQUEST)
        
        if Registration.objects.filter(user=request.user, event=event).exists():
            return Response({"error": "You are already registered for this event"}, status=status.HTTP_400_BAD_REQUEST)
        
        registration = Registration.objects.create(user=request.user, event=event)
        serializer = RegistrationSerializer(registration)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class UserEventsView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        user = get_object_or_404(User, pk=user_id)
        
        if self.request.user.id != int(user_id):
            return Event.objects.none()
            
        registrations = Registration.objects.filter(user=user).values_list('event_id', flat=True)
        return Event.objects.filter(id__in=registrations).order_by('date')

class CancelRegistrationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, event_id, user_id):
        if request.user.id != int(user_id):
            return Response({"error": "You can only cancel your own registrations"}, status=status.HTTP_403_FORBIDDEN)
            
        event = get_object_or_404(Event, pk=event_id)
        registration = get_object_or_404(Registration, user_id=user_id, event=event)
        registration.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
