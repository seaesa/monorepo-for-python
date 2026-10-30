from dishka import Provider, Scope, provide

from app.modules.notifications.repository import PushDeviceRepository
from app.modules.notifications.service import NotificationService


class NotificationsProvider(Provider):
    scope = Scope.REQUEST

    repository = provide(PushDeviceRepository)
    service = provide(NotificationService)
