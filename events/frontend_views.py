from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def index(request):
    return render(request, 'index.html')

@ensure_csrf_cookie
def login_page(request):
    return render(request, 'login.html')

@ensure_csrf_cookie
def register_page(request):
    return render(request, 'register.html')

@login_required
@ensure_csrf_cookie
def my_events(request):
    return render(request, 'my_events.html')

@login_required
@ensure_csrf_cookie
def create_event(request):
    return render(request, 'create_event.html')
