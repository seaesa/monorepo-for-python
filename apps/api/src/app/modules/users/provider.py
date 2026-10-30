from dishka import Provider, Scope, provide

from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService


class UsersProvider(Provider):
    scope = Scope.REQUEST

    repository = provide(UserRepository)
    service = provide(UserService)
