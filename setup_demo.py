"""
setup_demo.py — UNPHU SIST
Run once after migrations to populate demo users and document types.

  python manage.py shell < setup_demo.py
  OR
  python setup_demo.py
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unphusist.settings')
django.setup()

from django.utils import timezone
from accounts.models import Student
from documents.models import DocumentType, DocumentRequest, AuditLog

print("═" * 55)
print("  UNPHU SIST — Demo Setup")
print("═" * 55)

# ── 1. Document Types ────────────────────────────────────────
print("\n[1/3] Creando tipos de documento...")

DOCS = [
    dict(
        name='Carta Universitaria',
        slug='carta-universitaria',
        icon='📜',
        price=650,
        delivery_days=0,   # Same day!
        auto_pdf=True,
        order=1,
    ),
    dict(
        name='Constancia de Estudios',
        slug='constancia-estudios',
        icon='📋',
        price=650,
        delivery_days=0,   # Same day!
        auto_pdf=True,
        order=2,
    ),
    dict(
        name='Récord de Notas Oficial',
        slug='record-notas',
        icon='📊',
        price=850,
        delivery_days=3,
        auto_pdf=False,
        order=3,
    ),
    dict(
        name='Certificación de Graduación',
        slug='cert-graduacion',
        icon='🎓',
        price=1200,
        delivery_days=5,
        auto_pdf=False,
        order=4,
    ),
    dict(
        name='Pensum Aprobado',
        slug='pensum-aprobado',
        icon='📄',
        price=500,
        delivery_days=3,
        auto_pdf=False,
        order=5,
    ),
    dict(
        name='Certificado de Conducta',
        slug='cert-conducta',
        icon='🏅',
        price=450,
        delivery_days=3,
        auto_pdf=False,
        order=6,
    ),
    dict(
        name='Copia de Título',
        slug='copia-titulo',
        icon='🏛',
        price=2500,
        delivery_days=7,
        auto_pdf=False,
        order=7,
    ),
]

for d in DOCS:
    dt, created = DocumentType.objects.update_or_create(
        slug=d.pop('slug'),
        defaults=d,
    )
    status = "CREADO" if created else "actualizado"
    print(f"   {dt.icon} {dt.name} — {status}")

# ── 2. Users ─────────────────────────────────────────────────
print("\n[2/3] Creando usuarios demo...")

STUDENTS = [
    dict(
        username='nr21-2021',
        password='Demo2026!',
        first_name='Noel',
        last_name='Reyes de la Cruz',
        role='student',
        matricula='21-2021',
        cedula='402-0287176-6',
        carrera='Ingeniería en Sistemas Computacionales',
        carrera_codigo='255/2-22-22',
        periodo_activo='1-2026',
        telefono='829-929-8388',
        celular='809-459-6174',
        correo_personal='noelreyes426@gmail.com',
        correo_institucional='nr21-2021@unphu.edu.do',
    ),
    dict(
        username='estudiante2',
        password='Demo2026!',
        first_name='María',
        last_name='García López',
        role='student',
        matricula='22-0042',
        cedula='001-1234567-8',
        carrera='Administración de Empresas',
        carrera_codigo='310/1-20-20',
        periodo_activo='1-2026',
        telefono='809-555-1111',
        celular='829-555-2222',
        correo_personal='maria.garcia@gmail.com',
        correo_institucional='mg22-0042@unphu.edu.do',
    ),
]

ADMINS = [
    dict(
        username='jperez',
        password='Admin2026!',
        first_name='José',
        last_name='Pérez Herrera',
        role='admin',
        matricula='',
        cargo='Coordinador de Registro',
        correo_institucional='jperez@unphu.edu.do',
    ),
    dict(
        username='mgarcia',
        password='Admin2026!',
        first_name='María',
        last_name='García Ramos',
        role='admin',
        matricula='',
        cargo='Analista Documental',
        correo_institucional='mgarcia@unphu.edu.do',
    ),
    dict(
        username='rsantos',
        password='Admin2026!',
        first_name='Ramón',
        last_name='Santos Díaz',
        role='admin',
        matricula='',
        cargo='Director de Registro y Evaluaciones',
        correo_institucional='rsantos@unphu.edu.do',
        is_staff=True,
    ),
]

created_users = {}

for u in STUDENTS + ADMINS:
    password = u.pop('password')
    is_staff = u.pop('is_staff', False)
    username = u['username']

    student, created = Student.objects.update_or_create(
        username=username,
        defaults=u,
    )
    student.set_password(password)
    if is_staff:
        student.is_staff = True
    student.save()

    created_users[username] = student
    tag = "👤" if student.role == 'student' else "🛡"
    action = "CREADO" if created else "actualizado"
    print(f"   {tag} {student.get_full_name()} ({username}) — {action}")

# ── 3. Sample requests ───────────────────────────────────────
print("\n[3/3] Creando solicitudes de ejemplo...")

student_noel = created_users['nr21-2021']
student_maria = created_users['estudiante2']
admin_jperez = created_users['jperez']

# Clear existing sample requests for a fresh demo
DocumentRequest.objects.filter(student=student_noel).delete()
DocumentRequest.objects.filter(student=student_maria).delete()

carta_type   = DocumentType.objects.get(slug='carta-universitaria')
record_type  = DocumentType.objects.get(slug='record-notas')
constancia_type = DocumentType.objects.get(slug='constancia-estudios')
pensum_type  = DocumentType.objects.get(slug='pensum-aprobado')

SAMPLE_REQS = [
    # Noel — carta ready for download
    dict(
        student=student_noel,
        doc_type=carta_type,
        copies=1,
        purpose='visa',
        language='es',
        institution='Embajada de EE.UU.',
        status='ready',
        audit=[
            ('created', '📄', 'Sistema',      'Solicitud creada por el estudiante'),
            ('updated', '💳', 'Sistema',      'Comprobante de pago verificado automáticamente'),
            ('approved','✅', 'José Pérez',   'Aprobado. Carta universitaria generada y disponible para descarga.'),
        ],
    ),
    # Noel — record en proceso
    dict(
        student=student_noel,
        doc_type=record_type,
        copies=2,
        purpose='posgrado',
        language='es_en',
        institution='Universidad de Barcelona',
        status='process',
        audit=[
            ('created', '📄', 'Sistema',      'Solicitud creada por el estudiante'),
            ('updated', '💳', 'Sistema',      'Comprobante de pago adjuntado'),
            ('updated', '⚙️', 'José Pérez',   'Iniciada revisión académica del expediente'),
        ],
    ),
    # Noel — constancia pendiente
    dict(
        student=student_noel,
        doc_type=constancia_type,
        copies=1,
        purpose='empleo',
        language='es',
        status='pending',
        audit=[
            ('created', '📄', 'Sistema', 'Solicitud creada por el estudiante'),
        ],
    ),
    # María — pensum aprobado
    dict(
        student=student_maria,
        doc_type=pensum_type,
        copies=1,
        purpose='beca',
        language='es',
        status='approved',
        audit=[
            ('created', '📄', 'Sistema',      'Solicitud creada por el estudiante'),
            ('updated', '💳', 'Sistema',      'Pago verificado'),
            ('approved','✅', 'María García', 'Aprobado. Documento listo para retiro.'),
        ],
    ),
]

for r in SAMPLE_REQS:
    audits = r.pop('audit')
    req = DocumentRequest.objects.create(**r)
    for action, icon, actor, note in audits:
        AuditLog.objects.create(
            request=req, action=action, icon=icon, actor=actor, note=note
        )
    print(f"   📋 {req.code} — {req.student.first_name} — {req.doc_type.name} [{req.status}]")

print("\n" + "═" * 55)
print("  ✅ Setup completado exitosamente!")
print("═" * 55)
print("\n  Credenciales:")
print("  ┌──────────────┬──────────────┬──────────────────────────┐")
print("  │ Usuario      │ Contraseña   │ Rol                      │")
print("  ├──────────────┼──────────────┼──────────────────────────┤")
print("  │ nr21-2021    │ Demo2026!    │ Estudiante               │")
print("  │ estudiante2  │ Demo2026!    │ Estudiante               │")
print("  │ jperez       │ Admin2026!   │ Coordinador de Registro  │")
print("  │ mgarcia      │ Admin2026!   │ Analista Documental      │")
print("  │ rsantos      │ Admin2026!   │ Director (Superuser)     │")
print("  └──────────────┴──────────────┴──────────────────────────┘")
print("\n  Ejecuta el servidor con:")
print("  python manage.py runserver")
print("  Luego abre: http://127.0.0.1:8000/login/\n")
