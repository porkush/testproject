from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    
    path('events/', views.EventListCreateView.as_view(), name='event-list-create'),
    path('events/<int:pk>/', views.EventDetailView.as_view(), name='event-detail'),
    path('events/<int:event_id>/register/', views.RegisterForEventView.as_view(), name='event-register'),
    
    path('users/<int:user_id>/events/', views.UserEventsView.as_view(), name='user-events'),
    
    path('events/<int:event_id>/cancel/<int:user_id>/', views.CancelRegistrationView.as_view(), name='cancel-registration'),
]
