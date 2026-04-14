"""
PDF Generator — Carta Universitaria / Constancia de Estudios
Replicates the official UNPHU format shown in the sample document.
"""
import io
from datetime import date

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import (
    HexColor, black, white, green
)
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# ── Brand colors ──────────────────────────────────────────────
UNPHU_GREEN      = HexColor('#006837')
UNPHU_GREEN_MID  = HexColor('#439441')
UNPHU_GREEN_LIGHT= HexColor('#8CC63E')
UNPHU_NAVY       = HexColor('#003E7E')
DARK_TEXT        = HexColor('#1A1A1A')
LIGHT_GRAY       = HexColor('#F0F0F0')

# ── Month names (Spanish) ─────────────────────────────────────
MONTHS_ES = [
    '', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

# ── Academic period helper ────────────────────────────────────
def _get_period_label(periodo_str: str) -> str:
    """
    Converts '3-2024' → '(3 - 2024) - SEPTIEMBRE - DICIEMBRE DEL 2024'
    """
    try:
        num, year = periodo_str.split('-')
        maps = {
            '1': f'(1 - {year}) - ENERO - ABRIL DEL {year}',
            '2': f'(2 - {year}) - MAYO - AGOSTO DEL {year}',
            '3': f'(3 - {year}) - SEPTIEMBRE - DICIEMBRE DEL {year}',
        }
        return maps.get(num, periodo_str.upper())
    except Exception:
        return periodo_str.upper()


def _draw_unphu_logo_block(c: canvas.Canvas, x, y):
    """Draws the UNPHU text logo block (replaces image logo)."""
    # Green square logo mark
    c.setFillColor(UNPHU_GREEN)
    c.rect(x, y - 30, 44, 44, fill=1, stroke=0)

    # Inner white squares (4 quadrants)
    c.setFillColor(white)
    c.rect(x + 3, y + 8,  18, 18, fill=1, stroke=0)
    c.rect(x + 23, y + 8, 18, 18, fill=1, stroke=0)

    c.setFillColor(HexColor('#C0392B'))
    c.rect(x + 3, y - 10, 18, 16, fill=1, stroke=0)
    c.setFillColor(HexColor('#2980B9'))
    c.rect(x + 23, y - 10, 18, 16, fill=1, stroke=0)

    # "UNPHU" text
    c.setFillColor(UNPHU_GREEN)
    c.setFont('Helvetica-Bold', 22)
    c.drawString(x + 52, y + 8, 'UNPHU')

    # "Universidad Nacional" sub-text
    c.setFillColor(DARK_TEXT)
    c.setFont('Helvetica', 8)
    c.drawString(x + 52, y - 2, 'Universidad Nacional')
    c.drawString(x + 52, y - 12, 'Pedro Henríquez Ureña')


def _draw_seal(c: canvas.Canvas, cx, cy, radius=42):
    """Draws the official UNPHU stamp/seal."""
    # Outer ring
    c.setStrokeColor(UNPHU_GREEN)
    c.setFillColor(HexColor('#E8F5E9'))
    c.setLineWidth(2.5)
    c.circle(cx, cy, radius, fill=1, stroke=1)

    # Inner ring
    c.setStrokeColor(UNPHU_GREEN)
    c.setLineWidth(1)
    c.circle(cx, cy, radius - 6, fill=0, stroke=1)

    # Text around the ring
    import math
    c.setFillColor(UNPHU_GREEN)
    c.setFont('Helvetica-Bold', 5.5)
    text_top = 'UNIVERSIDAD NACIONAL PEDRO HENRIQUEZ URENA'
    text_bot = 'OFICINA DE REGISTRO'

    # Top arc text (simple approximation — place letters in arc)
    angle_start = 150
    angle_end   = 30
    n = len(text_top)
    for i, ch in enumerate(text_top):
        angle = math.radians(angle_start - i * (angle_start - angle_end) / (n - 1))
        lx = cx + (radius - 10) * math.cos(angle)
        ly = cy + (radius - 10) * math.sin(angle)
        c.saveState()
        c.translate(lx, ly)
        c.rotate(math.degrees(angle) - 90)
        c.drawCentredString(0, 0, ch)
        c.restoreState()

    # Bottom text
    c.setFont('Helvetica-Bold', 6.5)
    c.drawCentredString(cx, cy + 8, 'OFICINA DE')
    c.drawCentredString(cx, cy - 2, 'REGISTRO')

    # Star at bottom
    c.setFont('Helvetica', 7)
    c.drawCentredString(cx, cy - 14, '★')

    # "Dom. Rep." text
    c.setFont('Helvetica', 5)
    c.setFillColor(UNPHU_GREEN_MID)
    c.drawCentredString(cx, cy - 22, 'Dom. Rep.')


def _draw_signature_line(c: canvas.Canvas, x, y, width=180):
    """Draws the signature area."""
    # Handwriting-style squiggle (simplified)
    c.setStrokeColor(HexColor('#2C3E50'))
    c.setLineWidth(1.2)
    p = c.beginPath()
    p.moveTo(x, y)
    # Simple wavy signature
    p.curveTo(x + 20, y + 12, x + 40, y - 8,  x + 60, y + 10)
    p.curveTo(x + 80, y + 24, x + 100, y - 4, x + 120, y + 8)
    p.curveTo(x + 140, y + 18, x + 160, y,    x + width, y + 6)
    c.drawPath(p, stroke=1, fill=0)


def _draw_bottom_bar(c: canvas.Canvas, width, height):
    """Draws the green bottom bar with accreditation logos and address."""
    bar_h = 52
    bar_y = 0

    # Green bar
    c.setFillColor(UNPHU_GREEN)
    c.rect(0, bar_y, width, bar_h, fill=1, stroke=0)

    # Address text
    c.setFillColor(white)
    c.setFont('Helvetica', 7)
    address = ('Av. John F. Kennedy km 7 1/2, Santo Domingo, República Dominicana, '
               'Apartado Postal 1423. T. 809 562 6601')
    c.drawCentredString(width / 2, bar_h - 16, address)
    c.drawCentredString(width / 2, bar_h - 26, 'info@unphu.edu.do   |   unphu.edu.do   |   UNPHU   |   UNPHURD')

    # Accreditation logos (text boxes)
    logos = [
        ('ACBSP',   'ACCREDITED',       width - 1.8*inch),
        ('GCREAS',  'Acreditación Ing', width - 1.2*inch),
        ('ANPA\nDEH', '',               width - 0.55*inch),
    ]
    for name, sub, lx in logos:
        c.setFillColor(white)
        c.setStrokeColor(HexColor('#8CC63E'))
        c.setLineWidth(0.5)
        c.rect(lx, bar_y + bar_h + 2, 42, 34, fill=1, stroke=1)
        c.setFillColor(UNPHU_GREEN)
        c.setFont('Helvetica-Bold', 7)
        c.drawCentredString(lx + 21, bar_y + bar_h + 26, name)
        if sub:
            c.setFont('Helvetica', 5)
            c.setFillColor(DARK_TEXT)
            c.drawCentredString(lx + 21, bar_y + bar_h + 16, sub)


# ── Main export function ──────────────────────────────────────

def generate_carta_universitaria(student, request_obj=None) -> bytes:
    """
    Generates a PDF Carta Universitaria for the given student.
    Returns the raw PDF bytes.
    """
    buffer = io.BytesIO()
    page_w, page_h = letter  # 8.5 × 11 inches
    c = canvas.Canvas(buffer, pagesize=letter)

    margin_left  = 1.1 * inch
    margin_right = page_w - 1.1 * inch

    # ── Header ──────────────────────────────────────────────────
    _draw_unphu_logo_block(c, margin_left, page_h - 1.1 * inch)

    # Thin horizontal line below header
    c.setStrokeColor(UNPHU_GREEN)
    c.setLineWidth(1)
    c.line(margin_left, page_h - 1.35 * inch, margin_right, page_h - 1.35 * inch)

    # ── Title ────────────────────────────────────────────────────
    c.setFillColor(DARK_TEXT)
    c.setFont('Helvetica-Bold', 11)
    title_y = page_h - 2.15 * inch
    c.drawCentredString(page_w / 2, title_y + 14, 'OFICINA DE REGISTRO Y EVALUACIONES')
    c.drawCentredString(page_w / 2, title_y,      '"A QUIEN PUEDA INTERESAR"')

    # ── Body ─────────────────────────────────────────────────────
    body_y     = page_h - 3.05 * inch
    line_height= 18
    indent     = margin_left + 4

    def bold_underline_line(label_plain: str, value: str, y: float):
        """Draws a line with a normal part and a bold+underlined value."""
        c.setFont('Helvetica', 10.5)
        c.setFillColor(DARK_TEXT)
        tw = c.stringWidth(label_plain, 'Helvetica', 10.5)
        c.drawString(indent, y, label_plain)

        c.setFont('Helvetica-Bold', 10.5)
        vw = c.stringWidth(value, 'Helvetica-Bold', 10.5)
        c.drawString(indent + tw, y, value)
        # Underline
        c.setLineWidth(0.7)
        c.setStrokeColor(DARK_TEXT)
        c.line(indent + tw, y - 1.5, indent + tw + vw, y - 1.5)

    full_name    = student.get_full_name().upper()
    cedula       = student.cedula or '—'
    matricula    = student.matricula or '—'
    carrera      = student.carrera.upper() if student.carrera else '—'
    periodo      = _get_period_label(student.periodo_activo or '1-2026')

    bold_underline_line('CERTIFICAMOS QUE EL (LA) ESTUDIANTE: ', full_name, body_y)
    body_y -= line_height
    bold_underline_line(f'CÉDULA DE IDENTIDAD Y ELECTORAL NO. ', cedula + ' FIGURA MATRICULADO (A)', body_y)
    body_y -= line_height
    bold_underline_line('EN ESTA UNIVERSIDAD EN EL PERÍODO ', periodo, body_y)
    body_y -= line_height
    bold_underline_line('CON LA MATRICULA ', matricula + ' EN LA CARRERA', body_y)
    body_y -= line_height
    bold_underline_line('DE ', carrera + '.', body_y)

    # ── Issuing paragraph ────────────────────────────────────────
    today     = date.today()
    day_str   = str(today.day)
    month_str = MONTHS_ES[today.month]
    year_str  = str(today.year)

    issue_y = body_y - 1.0 * inch

    c.setFont('Helvetica', 10.5)
    c.setFillColor(DARK_TEXT)
    line1 = 'SE EXPIDE LA PRESENTE, A SOLICITUD DE LA PARTE INTERESADA, EN SANTO DOMINGO,'
    line2 = ('DISTRITO NACIONAL, CAPITAL DE LA REPÚBLICA DOMINICANA, A LOS ')
    line3 = f'DE '

    c.drawString(indent, issue_y,          line1)
    issue_y -= line_height

    # Line 2 — day in bold
    c.drawString(indent, issue_y, line2)
    tw2 = c.stringWidth(line2, 'Helvetica', 10.5)
    c.setFont('Helvetica-Bold', 10.5)
    c.drawString(indent + tw2, issue_y, day_str + ' DIAS DEL MES')
    issue_y -= line_height

    # Line 3 — month + year in bold
    c.setFont('Helvetica', 10.5)
    c.drawString(indent, issue_y, 'DE ')
    w_de = c.stringWidth('DE ', 'Helvetica', 10.5)
    c.setFont('Helvetica-Bold', 10.5)
    month_txt = month_str + ' DEL AÑO '
    c.drawString(indent + w_de, issue_y, month_txt)
    w_month = c.stringWidth(month_txt, 'Helvetica-Bold', 10.5)
    c.drawString(indent + w_de + w_month, issue_y, year_str + '.')
    # Underline month + year
    total_w = w_month + c.stringWidth(year_str + '.', 'Helvetica-Bold', 10.5)
    c.setLineWidth(0.7)
    c.setStrokeColor(DARK_TEXT)
    c.line(indent + w_de, issue_y - 1.5, indent + w_de + total_w, issue_y - 1.5)

    # ── Seal + Signature ──────────────────────────────────────────
    seal_cx = page_w / 2 - 0.3 * inch
    seal_cy = issue_y - 1.55 * inch
    _draw_seal(c, seal_cx, seal_cy, radius=44)

    # Signature (over the seal, slightly offset)
    _draw_signature_line(c, seal_cx - 60, seal_cy + 10, width=120)

    # Signatory name & title
    sig_y = seal_cy - 60
    c.setFillColor(DARK_TEXT)
    c.setFont('Helvetica-Bold', 9)
    c.drawCentredString(seal_cx, sig_y, 'LIC. GERARMY ELIZABETH MADERA ESTEVEZ')
    c.setFont('Helvetica-Bold', 9)
    c.drawCentredString(seal_cx, sig_y - 12, 'DIRECTORA DE REGISTRO Y EVALUACIONES')

    # ── Bottom bar ───────────────────────────────────────────────
    _draw_bottom_bar(c, page_w, page_h)

    c.save()
    buffer.seek(0)
    return buffer.read()
