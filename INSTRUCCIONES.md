# UNPHU SIST — Módulo de Solicitud de Documentos

## Requisitos previos
- Python 3.10 o superior
- pip

---

## Instalación y ejecución

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Crear la base de datos
python manage.py migrate

# 3. Poblar datos demo (usuarios, tipos de documento, solicitudes de ejemplo)
python setup_demo.py

# 4. Iniciar el servidor
python manage.py runserver
```

Abrir en el navegador: **http://127.0.0.1:8000/login/**

---

## Credenciales de acceso

| Usuario      | Contraseña   | Rol                        |
|-------------|--------------|----------------------------|
| nr21-2021   | Demo2026!    | Estudiante (Noel Reyes)    |
| estudiante2 | Demo2026!    | Estudiante (María García)  |
| jperez      | Admin2026!   | Coordinador de Registro    |
| mgarcia     | Admin2026!   | Analista Documental        |
| rsantos     | Admin2026!   | Director de Registro       |

---

## Funcionalidades implementadas

### Estudiante
- Login con matrícula institucional
- Página de **Perfil** (idéntica al UNPHU SIST original)
- Módulo **Solicitud de Documentos** con 4 tabs:
  - **Inicio** — estadísticas, solicitudes recientes, tabla de tiempos de entrega
  - **Nueva Solicitud** — formulario en 3 pasos (documento → datos → pago)
  - **Mis Solicitudes** — lista filtrable con modal de detalle
  - **Mis Documentos** — descarga de documentos aprobados + verificador SHA-256
- **Descarga de Carta Universitaria en PDF** generada automáticamente con:
  - Logo UNPHU, datos del estudiante, período académico
  - Sello oficial de Oficina de Registro
  - Firma de la Directora de Registro
  - Barra verde inferior con acreditaciones y dirección

### Administrador
- Panel administrativo con tabs: Pendientes / Aprobadas / Rechazadas
- Aprobar, rechazar (con motivo) o marcar en proceso cada solicitud
- Modal de detalle con trazabilidad completa
- Búsqueda por nombre, código o matrícula

---

## Tiempos de entrega configurados

| Documento              | Tiempo             |
|------------------------|-------------------|
| Carta Universitaria    | Mismo día (antes de las 2PM) |
| Constancia de Estudios | Mismo día (antes de las 2PM) |
| Récord de Notas        | 3–5 días hábiles  |
| Cert. de Graduación    | 5–7 días hábiles  |
| Pensum Aprobado        | 3–5 días hábiles  |
| Cert. de Conducta      | 3–5 días hábiles  |
| Copia de Título        | 7–10 días hábiles |

---

## Estructura del proyecto

```
unphusist/          ← Configuración Django
accounts/           ← Modelo Student (estudiante + admin)
documents/          ← Solicitudes, tipos de doc, PDF generator
core/               ← Vista de Perfil
templates/          ← Todos los HTML
static/css/         ← unphu.css (estilos de marca)
setup_demo.py       ← Script de datos iniciales
```
