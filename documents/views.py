from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.utils import timezone
from django.db.models import Q

from .models import DocumentType, DocumentRequest, AuditLog
from .pdf_generator import generate_carta_universitaria


# ──────────────────────────────────────────────────────────────
# Student views
# ──────────────────────────────────────────────────────────────

@login_required
def solicitud_docs(request):
    """Main document request module — tabbed interface."""
    doc_types = DocumentType.objects.filter(is_active=True)
    my_requests = DocumentRequest.objects.filter(student=request.user).select_related('doc_type')

    # Stats
    stats = {
        'total':    my_requests.count(),
        'process':  my_requests.filter(status__in=['pending', 'process']).count(),
        'done':     my_requests.filter(status__in=['approved', 'ready', 'delivered']).count(),
        'pending':  my_requests.filter(status='pending').count(),
    }

    recent = my_requests[:5]
    active_tab = request.GET.get('tab', 'inicio')

    return render(request, 'documents/solicitud_docs.html', {
        'doc_types':  doc_types,
        'my_requests': my_requests,
        'recent':     recent,
        'stats':      stats,
        'active_tab': active_tab,
    })


@login_required
def nueva_solicitud(request):
    """Process the new document request form (POST)."""
    if request.method != 'POST':
        return redirect('solicitud_docs')

    doc_type_slug = request.POST.get('doc_type_slug')
    doc_type = get_object_or_404(DocumentType, slug=doc_type_slug, is_active=True)

    copies       = max(1, int(request.POST.get('copies', 1)))
    purpose      = request.POST.get('purpose', 'personal')
    language     = request.POST.get('language', 'es')
    institution  = request.POST.get('institution', '')
    observations = request.POST.get('observations', '')
    receipt_file = request.FILES.get('payment_receipt')

    req = DocumentRequest.objects.create(
        student      = request.user,
        doc_type     = doc_type,
        copies       = copies,
        purpose      = purpose,
        language     = language,
        institution  = institution,
        observations = observations,
        payment_receipt = receipt_file,
        status       = DocumentRequest.STATUS_PENDING,
    )

    AuditLog.objects.create(
        request = req,
        action  = 'created',
        icon    = '📄',
        actor   = 'Sistema',
        note    = f'Solicitud creada por {request.user.get_full_name()}',
    )

    if receipt_file:
        AuditLog.objects.create(
            request = req,
            action  = 'updated',
            icon    = '💳',
            actor   = 'Sistema',
            note    = 'Comprobante de pago adjuntado para revisión',
        )

    messages.success(request, f'¡Solicitud enviada! Código: {req.code}')
    return redirect(f'/solicitud-documentos/?tab=solicitudes&new={req.code}')


@login_required
def detalle_solicitud(request, pk):
    """Detail view for a single request (AJAX-friendly JSON response)."""
    req = get_object_or_404(DocumentRequest, pk=pk, student=request.user)
    logs = list(req.audit_logs.values('icon', 'actor', 'note', 'created_at'))

    data = {
        'code':          req.code,
        'doc_name':      req.doc_type.name,
        'copies':        req.copies,
        'purpose':       req.get_purpose_display(),
        'language':      req.get_language_display(),
        'institution':   req.institution,
        'total':         f'RD${req.total_amount:,.2f}',
        'status':        req.status,
        'status_label':  req.status_badge[1],
        'status_class':  req.status_badge[0],
        'estimated':     req.estimated_date_display,
        'created_at':    req.created_at.strftime('%d/%m/%Y %I:%M %p'),
        'can_download':  req.can_download,
        'audit_logs':    [
            {
                'icon':  l['icon'],
                'actor': l['actor'],
                'note':  l['note'],
                'when':  l['created_at'].strftime('%d/%m/%Y %I:%M %p'),
            }
            for l in logs
        ],
    }
    return JsonResponse(data)


@login_required
def descargar_documento(request, pk):
    """Generate and return the PDF for an approved document request."""
    req = get_object_or_404(DocumentRequest, pk=pk, student=request.user)

    if not req.can_download:
        messages.error(request, 'El documento no está disponible para descarga.')
        return redirect('solicitud_docs')

    if req.doc_type.slug == 'carta-universitaria':
        pdf_buffer = generate_carta_universitaria(request.user, req)
        filename = f'carta_universitaria_{req.code}.pdf'
    else:
        messages.error(request, 'Generación automática no disponible para este tipo de documento.')
        return redirect('solicitud_docs')

    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


# ──────────────────────────────────────────────────────────────
# Admin panel views
# ──────────────────────────────────────────────────────────────

@login_required
def admin_panel(request):
    """Admin dashboard — manage all student requests."""
    if not request.user.is_admin_staff:
        messages.error(request, 'No tienes permiso para acceder al panel administrativo.')
        return redirect('perfil')

    status_filter = request.GET.get('status', 'pending')
    search_q      = request.GET.get('q', '').strip()

    all_requests = DocumentRequest.objects.select_related('student', 'doc_type', 'processed_by')

    if search_q:
        all_requests = all_requests.filter(
            Q(code__icontains=search_q) |
            Q(student__first_name__icontains=search_q) |
            Q(student__last_name__icontains=search_q) |
            Q(student__matricula__icontains=search_q)
        )

    pending_qs  = all_requests.filter(status__in=['pending', 'process'])
    approved_qs = all_requests.filter(status__in=['approved', 'ready', 'delivered'])
    rejected_qs = all_requests.filter(status='rejected')

    counts = {
        'pending':  pending_qs.count(),
        'approved': approved_qs.count(),
        'rejected': rejected_qs.count(),
        'total':    all_requests.count(),
    }

    tab_map = {
        'pending':  pending_qs,
        'approved': approved_qs,
        'rejected': rejected_qs,
    }
    displayed = tab_map.get(status_filter, pending_qs)

    reject_reasons = [
        'Comprobante de pago ilegible o inválido',
        'Documentación incompleta o incorrecta',
        'Deuda pendiente en el sistema académico',
        'Datos no coinciden con el expediente',
        'Solicitud duplicada detectada',
        'Otro (especificar en observaciones)',
    ]

    return render(request, 'documents/admin_panel.html', {
        'requests':       displayed,
        'counts':         counts,
        'status_filter':  status_filter,
        'search_q':       search_q,
        'reject_reasons': reject_reasons,
    })


@login_required
def admin_detalle(request, pk):
    """Full detail view for admin (JSON)."""
    if not request.user.is_admin_staff:
        return JsonResponse({'error': 'Forbidden'}, status=403)

    req  = get_object_or_404(DocumentRequest, pk=pk)
    logs = list(req.audit_logs.values('icon', 'actor', 'note', 'created_at'))

    return JsonResponse({
        'id':          req.pk,
        'code':        req.code,
        'doc_name':    req.doc_type.name,
        'student':     req.student.get_full_name(),
        'matricula':   req.student.matricula,
        'cedula':      req.student.cedula,
        'carrera':     req.student.carrera,
        'copies':      req.copies,
        'purpose':     req.get_purpose_display(),
        'language':    req.get_language_display(),
        'institution': req.institution,
        'total':       f'RD${req.total_amount:,.2f}',
        'status':      req.status,
        'status_label':req.status_badge[1],
        'status_class':req.status_badge[0],
        'estimated':   req.estimated_date_display,
        'created_at':  req.created_at.strftime('%d/%m/%Y %I:%M %p'),
        'admin_notes': req.admin_notes,
        'audit_logs':  [
            {
                'icon':  l['icon'],
                'actor': l['actor'],
                'note':  l['note'],
                'when':  l['created_at'].strftime('%d/%m/%Y %I:%M %p'),
            }
            for l in logs
        ],
    })


@login_required
def admin_aprobar(request, pk):
    if not request.user.is_admin_staff:
        return JsonResponse({'error': 'Forbidden'}, status=403)
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    req = get_object_or_404(DocumentRequest, pk=pk)
    old_status = req.status
    req.status       = DocumentRequest.STATUS_READY
    req.processed_by = request.user
    req.save()

    AuditLog.objects.create(
        request = req,
        action  = 'approved',
        icon    = '✅',
        actor   = request.user.get_full_name(),
        note    = f'Aprobado por {request.user.cargo or request.user.get_full_name()}. Documento listo para retiro.',
    )

    return JsonResponse({'status': 'ok', 'new_status': req.status,
                         'label': req.status_badge[1], 'css': req.status_badge[0]})


@login_required
def admin_rechazar(request, pk):
    if not request.user.is_admin_staff:
        return JsonResponse({'error': 'Forbidden'}, status=403)
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    req    = get_object_or_404(DocumentRequest, pk=pk)
    reason = request.POST.get('reason', 'Sin especificar')
    obs    = request.POST.get('observations', '')
    note   = reason + (f' — Obs: {obs}' if obs else '')

    req.status       = DocumentRequest.STATUS_REJECTED
    req.admin_notes  = note
    req.processed_by = request.user
    req.save()

    AuditLog.objects.create(
        request = req,
        action  = 'rejected',
        icon    = '❌',
        actor   = request.user.get_full_name(),
        note    = f'Rechazado: {note}',
    )

    return JsonResponse({'status': 'ok', 'new_status': req.status,
                         'label': req.status_badge[1], 'css': req.status_badge[0]})


@login_required
def admin_marcar_proceso(request, pk):
    if not request.user.is_admin_staff:
        return JsonResponse({'error': 'Forbidden'}, status=403)
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    req = get_object_or_404(DocumentRequest, pk=pk)
    req.status       = DocumentRequest.STATUS_PROCESS
    req.processed_by = request.user
    req.save()

    AuditLog.objects.create(
        request = req,
        action  = 'updated',
        icon    = '⚙️',
        actor   = request.user.get_full_name(),
        note    = 'Solicitud puesta en revisión académica.',
    )

    return JsonResponse({'status': 'ok', 'new_status': req.status,
                         'label': req.status_badge[1], 'css': req.status_badge[0]})
