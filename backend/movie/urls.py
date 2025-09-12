from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("api/", include("api.urls")),
    path("api/user/", include("accounts.urls")),
    path("api/auth/", include("rest_framework.urls")),
    path("favicon.ico", lambda request: HttpResponse(status=204)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
