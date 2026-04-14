from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Student


@admin.register(Student)
class StudentAdmin(UserAdmin):
    list_display  = ('username', 'get_full_name', 'matricula', 'role', 'carrera', 'is_active')
    list_filter   = ('role', 'is_active', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'matricula', 'cedula')
    ordering      = ('last_name', 'first_name')

    fieldsets = UserAdmin.fieldsets + (
        ('Datos Académicos', {
            'fields': ('role', 'matricula', 'cedula', 'carrera', 'carrera_codigo', 'periodo_activo')
        }),
        ('Contacto', {
            'fields': ('telefono', 'celular', 'correo_personal', 'correo_institucional')
        }),
        ('Admin', {
            'fields': ('cargo',)
        }),
    )
