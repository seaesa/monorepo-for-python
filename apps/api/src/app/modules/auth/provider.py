from dishka import Provider, Scope, provide

from app.modules.auth.service import AuthService


class AuthProvider(Provider):
    scope = Scope.REQUEST

    service = provide(AuthService)
