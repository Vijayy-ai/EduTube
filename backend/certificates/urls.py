from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CertificateViewSet, verify_certificate, mint_nft_certificate, CertificateVerificationViewSet, serve_pdf

app_name = 'certificates'

router = DefaultRouter()
router.register(r'', CertificateViewSet, basename='certificate')
router.register(r'verifications', CertificateVerificationViewSet, basename='certificate-verification')

urlpatterns = [
    path('', include(router.urls)),
    path('<str:certificate_id>/verify/', verify_certificate, name='certificate-verify'),
    path('<str:certificate_id>/mint_nft/', mint_nft_certificate, name='certificate-mint-nft'),
    path('<str:certificate_id>/pdf/', serve_pdf, name='certificate-pdf'),
] 