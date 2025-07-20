from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("", include("api.urls")),
    path('favicon.ico', lambda request: HttpResponse(status=204)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
