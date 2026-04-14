from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta, date


# ---------------------------------------------------------------------------
# Document types & pricing
# ---------------------------------------------------------------------------

class DocumentType(models.Model):
    DELIVERY_SAME_DAY = 0
    DELIVERY_1_DAY    = 1
    DELIVERY_3_DAYS   = 3
    DELIVERY_5_DAYS   = 5
    DELIVERY_7_DAYS   = 7

    DELIVERY_CHOICES = [
        (DELIVERY_SAME_DAY, 'Mismo día (antes de las 2:00 PM)'),
        (DELIVERY_1_DAY,    '1 día hábil'),
        (DELIVERY_3_DAYS,   '3–5 días hábiles'),
        (DELIVERY_5_DAYS,   '5–7 días hábiles'),
        (DELIVERY_7_DAYS,   '7–10 días hábiles'),
    ]

    name          = models.CharField(max_length=100)
    slug          = models.SlugField(unique=True)
    icon          = models.CharField(max_length=10, default='📄')
    price         = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_days = models.IntegerField(choices=DELIVERY_CHOICES, default=DELIVERY_3_DAYS)
    is_active     = models.BooleanField(default=True)
    order         = models.PositiveSmallIntegerField(default=0)
    # Whether this document can be generated automatically as PDF
    auto_pdf      = models.BooleanField(default=False,
                                        help_text='El sistema genera el PDF automáticamente.')

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    @property
    def delivery_label(self):
        return dict(self.DELIVERY_CHOICES).get(self.delivery_days, f'{self.delivery_days} días')

    def get_estimated_date(self, from_date=None):
        """Return estimated delivery date (skipping weekends)."""
        if from_date is None:
            from_date = date.today()

        if self.delivery_days == 0:
            # Same day — only if before 2pm, otherwise next business day
            now = timezone.localtime(timezone.now())
            if now.hour < 14:
                return from_date
            else:
                return self._next_business_day(from_date)

        current = from_date
        days_added = 0
        while days_added < self.delivery_days:
            current += timedelta(days=1)
            if current.weekday() < 5:  # Mon–Fri
                days_added += 1
        return current

    @staticmethod
    def _next_business_day(d):
        next_d = d + timedelta(days=1)
        while next_d.weekday() >= 5:
            next_d += timedelta(days=1)
        return next_d


# ---------------------------------------------------------------------------
# Document Request
# ---------------------------------------------------------------------------

class DocumentRequest(models.Model):
    STATUS_PENDING  = 'pending'
    STATUS_PROCESS  = 'process'
    STATUS_APPROVED = 'approved'
    STATUS_READY    = 'ready'
    STATUS_DELIVERED= 'delivered'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = [
        (STATUS_PENDING,   'Pendiente de revisión'),
        (STATUS_PROCESS,   'En revisión académica'),
        (STATUS_APPROVED,  'Aprobado'),
        (STATUS_READY,     'Listo para retiro'),
        (STATUS_DELIVERED, 'Entregado'),
        (STATUS_REJECTED,  'Rechazado'),
    ]

    PURPOSE_CHOICES = [
        ('visa',      'Visa / Trámite consular'),
        ('empleo',    'Empleo / Trabajo'),
        ('beca',      'Beca / Intercambio'),
        ('banco',     'Banco / Institución financiera'),
        ('posgrado',  'Estudios de posgrado'),
        ('mescyt',    'Beca MESCYT'),
        ('personal',  'Uso personal'),
        ('otro',      'Otro'),
    ]

    LANGUAGE_CHOICES = [
        ('es',    'Español'),
        ('en',    'Inglés'),
        ('es_en', 'Español e Inglés'),
    ]

    # Relations
    student       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                      related_name='requests')
    doc_type      = models.ForeignKey(DocumentType, on_delete=models.PROTECT,
                                      related_name='requests')

    # Request details
    code          = models.CharField(max_length=20, unique=True, editable=False)
    copies        = models.PositiveSmallIntegerField(default=1)
    purpose       = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='personal')
    language      = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='es')
    institution   = models.CharField(max_length=200, blank=True,
                                     verbose_name='Institución destinataria')
    observations  = models.TextField(blank=True)

    # Payment
    payment_receipt = models.FileField(upload_to='receipts/%Y/%m/', blank=True, null=True)

    # Status & timeline
    status           = models.CharField(max_length=15, choices=STATUS_CHOICES,
                                        default=STATUS_PENDING)
    estimated_date   = models.DateField(null=True, blank=True,
                                        verbose_name='Fecha estimada de entrega')
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    # Admin notes
    admin_notes      = models.TextField(blank=True)
    processed_by     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='processed_requests')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} — {self.student.get_full_name()} — {self.doc_type}'

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self._generate_code()
        if not self.estimated_date:
            self.estimated_date = self.doc_type.get_estimated_date()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_code():
        from django.utils import timezone as tz
        year  = tz.localtime(tz.now()).year
        count = DocumentRequest.objects.filter(
            created_at__year=year
        ).count() + 1
        return f'SOL-{year}-{count:04d}'

    @property
    def total_amount(self):
        return self.doc_type.price * self.copies

    @property
    def status_badge(self):
        badges = {
            self.STATUS_PENDING:   ('pending',  'Pendiente revisión'),
            self.STATUS_PROCESS:   ('process',  'En revisión'),
            self.STATUS_APPROVED:  ('approved', 'Aprobado'),
            self.STATUS_READY:     ('ready',    'Listo para retiro'),
            self.STATUS_DELIVERED: ('done',     'Entregado'),
            self.STATUS_REJECTED:  ('reject',   'Rechazado'),
        }
        return badges.get(self.status, ('pending', self.status))

    @property
    def can_download(self):
        """True if the document can be downloaded (auto-PDF and status ready/delivered)."""
        return (self.doc_type.auto_pdf and
                self.status in [self.STATUS_APPROVED, self.STATUS_READY, self.STATUS_DELIVERED])

    @property
    def delivery_same_day(self):
        return self.doc_type.delivery_days == 0

    @property
    def estimated_date_display(self):
        if not self.estimated_date:
            return '—'
        today = date.today()
        if self.estimated_date == today:
            return 'Hoy mismo'
        elif self.estimated_date == today + timedelta(days=1):
            return 'Mañana'
        else:
            MONTHS_ES = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun',
                         'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
            d = self.estimated_date
            return f'{d.day} {MONTHS_ES[d.month]} {d.year}'


# ---------------------------------------------------------------------------
# Audit trail
# ---------------------------------------------------------------------------

class AuditLog(models.Model):
    request   = models.ForeignKey(DocumentRequest, on_delete=models.CASCADE,
                                  related_name='audit_logs')
    action    = models.CharField(max_length=20)   # created, updated, approved, rejected
    icon      = models.CharField(max_length=5, default='📋')
    actor     = models.CharField(max_length=100)
    note      = models.TextField()
    created_at= models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'[{self.action}] {self.request.code} — {self.actor}'
