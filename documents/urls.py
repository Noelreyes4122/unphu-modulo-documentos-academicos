from django.urls import path
from . import views

urlpatterns = [
    # Student
    path('solicitud-documentos/',                  views.solicitud_docs,      name='solicitud_docs'),
    path('solicitud-documentos/nueva/',            views.nueva_solicitud,     name='nueva_solicitud'),
    path('solicitud-documentos/<int:pk>/detalle/', views.detalle_solicitud,   name='detalle_solicitud'),
    path('solicitud-documentos/<int:pk>/descargar/', views.descargar_documento, name='descargar_doc'),
    # Admin panel
    path('admin-panel/',                           views.admin_panel,         name='admin_panel'),
    path('admin-panel/<int:pk>/detalle/',          views.admin_detalle,       name='admin_detalle'),
    path('admin-panel/<int:pk>/aprobar/',          views.admin_aprobar,       name='admin_aprobar'),
    path('admin-panel/<int:pk>/rechazar/',         views.admin_rechazar,      name='admin_rechazar'),
    path('admin-panel/<int:pk>/proceso/',          views.admin_marcar_proceso,name='admin_proceso'),
]
