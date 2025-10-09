from channels.routing import ProtocolTypeRouter, URLRouter
from channels.sessions import SessionMiddlewareStack
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

from .jwt_auth import JWTAuthMiddleware

def JWTAuthMiddlewareStack(inner):
    return AllowedHostsOriginValidator(
        SessionMiddlewareStack(
            JWTAuthMiddleware(
                inner
            )
        )
    )
