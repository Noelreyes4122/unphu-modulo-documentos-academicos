from django.contrib import admin
from .models import DocumentType, DocumentRequest, AuditLog


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display  = ('name', 'price', 'delivery_days', 'auto_pdf', 'is_active', 'order')
    list_editable = ('price', 'delivery_days', 'auto_pdf', 'is_active', 'order')
    prepopulated_fields = {'slug': ('name',)}


class AuditLogInline(admin.TabularInline):
    model  = AuditLog
    extra  = 0
    readonly_fields = ('action', 'icon', 'actor', 'note', 'created_at')
    can_delete = False


@admin.register(DocumentRequest)
class DocumentRequestAdmin(admin.ModelAdmin):
    list_display  = ('code', 'student', 'doc_type', 'status', 'estimated_date', 'created_at')
    list_filter   = ('status', 'doc_type', 'created_at')
    search_fields = ('code', 'student__first_name', 'student__last_name', 'student__matricula')
    readonly_fields = ('code', 'created_at', 'updated_at')
    inlines = [AuditLogInline]
