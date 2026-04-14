from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages


def login_view(request):
    if request.user.is_authenticated:
        if request.user.role == 'admin':
            return redirect('admin_panel')
        return redirect('perfil')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if user.role == 'admin':
                messages.error(request, 'Usa el Acceso Administrativo para iniciar sesión.')
            else:
                login(request, user)
                next_url = request.GET.get('next', 'perfil')
                return redirect(next_url)
        else:
            messages.error(request, 'Usuario o contraseña incorrectos.')

    return render(request, 'accounts/login.html')


def admin_login_view(request):
    if request.user.is_authenticated:
        if request.user.role == 'admin':
            return redirect('admin_panel')
        return redirect('perfil')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if user.role != 'admin':
                messages.error(request, 'Acceso denegado. Este portal es solo para personal de Registro.')
            else:
                login(request, user)
                return redirect('admin_panel')
        else:
            messages.error(request, 'Usuario o contraseña incorrectos.')

    return render(request, 'accounts/admin_login.html')


def logout_view(request):
    logout(request)
    return redirect('login')
