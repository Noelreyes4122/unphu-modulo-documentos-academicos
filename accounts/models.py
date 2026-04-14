from django.contrib.auth.models import AbstractUser
from django.db import models


class Student(AbstractUser):
    """Custom user model that represents a student (or admin staff)."""

    ROLE_STUDENT = 'student'
    ROLE_ADMIN   = 'admin'
    ROLE_CHOICES = [
        (ROLE_STUDENT, 'Estudiante'),
        (ROLE_ADMIN,   'Personal Administrativo'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_STUDENT)

    # Academic data
    matricula              = models.CharField(max_length=20, blank=True)
    cedula                 = models.CharField(max_length=20, blank=True, verbose_name='Cédula')
    carrera                = models.CharField(max_length=200, blank=True)
    carrera_codigo         = models.CharField(max_length=30, blank=True)
    periodo_activo         = models.CharField(max_length=30, blank=True, default='1-2026')

    # Contact
    telefono               = models.CharField(max_length=20, blank=True)
    celular                = models.CharField(max_length=20, blank=True)
    correo_personal        = models.EmailField(blank=True)
    correo_institucional   = models.EmailField(blank=True)

    # Admin-only fields
    cargo                  = models.CharField(max_length=100, blank=True,
                                              help_text='Cargo del personal (solo admin)')

    class Meta:
        verbose_name        = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.get_full_name()} ({self.matricula or self.username})'

    @property
    def initials(self):
        parts = self.get_full_name().split()
        return ''.join(p[0].upper() for p in parts[:2]) if parts else self.username[:2].upper()

    @property
    def is_admin_staff(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser

    @property
    def periodo_label(self):
        """Returns a human-friendly period label, e.g. '1-2026 → Enero–Abril 2026'."""
        try:
            num, year = self.periodo_activo.split('-')
            labels = {'1': 'Enero–Abril', '2': 'Mayo–Agosto', '3': 'Septiembre–Diciembre'}
            return f"{labels.get(num, num)} {year}"
        except Exception:
            return self.periodo_activo
