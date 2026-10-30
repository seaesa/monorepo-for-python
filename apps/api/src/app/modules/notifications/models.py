import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PushDevice(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One installed app that can receive pushes. A token belongs to one user at a time:
    signing in as someone else on the same phone moves it."""

    __tablename__ = "push_devices"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token: Mapped[str] = mapped_column(String(255), unique=True)
    platform: Mapped[str] = mapped_column(String(16))
    # Language of the app on this device: pushes are rendered server-side, per device.
    locale: Mapped[str] = mapped_column(String(8), default="en", server_default="en")
