import uuid
from dataclasses import asdict
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.push import PushMessage, PushSender
from app.modules.notifications.repository import PushDeviceRepository
from app.modules.notifications.schemas import PushDeviceRegister
from app.modules.notifications.templates import PushCopy
from app.shared.locale import Locale


class NotificationService:
    def __init__(
        self, session: AsyncSession, devices: PushDeviceRepository, sender: PushSender
    ) -> None:
        self.session = session
        self.devices = devices
        self.sender = sender

    async def register_device(
        self, user_id: uuid.UUID, data: PushDeviceRegister, locale: Locale
    ) -> None:
        device = await self.devices.get_by_token(data.token)
        if device is None:
            await self.devices.create(
                user_id=user_id, token=data.token, platform=data.platform, locale=locale
            )
        else:
            await self.devices.update(
                device, user_id=user_id, platform=data.platform, locale=locale
            )
        await self.session.commit()

    async def unregister_device(self, user_id: uuid.UUID, token: str) -> None:
        await self.devices.delete_tokens([token], user_id=user_id)
        await self.session.commit()

    async def forget_user_devices(self, user_id: uuid.UUID) -> None:
        """Stop pushing to a user who was signed out everywhere."""
        await self.devices.delete_for_user(user_id)
        await self.session.commit()

    def notify(
        self, user_id: uuid.UUID, copy: PushCopy, data: dict[str, Any] | None = None
    ) -> None:
        """Queue a push to every device of the user. The public entry point for other modules;
        call it after the business change is committed."""
        from app.modules.notifications.tasks import send_push

        localized = {locale: asdict(content) for locale, content in copy.items()}
        send_push.delay(str(user_id), localized, data or {})

    async def deliver(
        self, user_id: uuid.UUID, copy: dict[str, dict[str, str]], data: dict[str, Any]
    ) -> None:
        devices = await self.devices.list_for_user(user_id)
        if not devices:
            return
        messages = [
            PushMessage(to=device.token, data=data, **copy.get(device.locale, copy["en"]))
            for device in devices
        ]
        dead = await self.sender.send(messages)
        if dead:
            await self.devices.delete_tokens(dead)
            await self.session.commit()
