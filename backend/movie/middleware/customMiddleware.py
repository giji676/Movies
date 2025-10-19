from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from django.conf import settings
from channels.sessions import CookieMiddleware
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication

import logging

logger = logging.getLogger("movie")

class JWTAuthMiddleware:
    """
    Custom middleware for JWT authentication. Must be wrapped in CookieMiddleware.
    Adds user to scope if they have a valid JWT.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        close_old_connections()

        # cookies are in scope, since we're wrapped in CookieMiddleware
        jwt_cookie = scope["cookies"].get(settings.SIMPLE_JWT["AUTH_COOKIE"])

        if not jwt_cookie:
            scope["user"] = AnonymousUser()
        else:
            try:
                auth = JWTAuthentication()
                validated_token = auth.get_validated_token(jwt_cookie)
                scope["user"] = await database_sync_to_async(auth.get_user)(
                    validated_token
                )
            except Exception as e:
                # or raise validation errors, etc
                scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    '''
    Handy shortcut to ensure we're wrapped in CookieMiddleware.
    Use in your ASGI application as follows:
    application = ProtocolTypeRouter(
        {
            "http": django_asgi_app,
            "websocket": AllowedHostsOriginValidator(
                JwtAuthMiddlewareStack(
                    URLRouter(websocket_urlpatterns)
                )
            ),
        }
    )
    '''
    return CookieMiddleware(JWTAuthMiddleware(inner))
