from datetime import datetime

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.shared.permissions import ROLE_PERMISSIONS, Permission, Role


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    role: Mapped[Role] = mapped_column(
        String(32), default=Role.MEMBER, server_default=Role.MEMBER.value
    )
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    # Bumped on password change/reset; access tokens carry it so old ones stop working.
    token_version: Mapped[int] = mapped_column(default=0, server_default="0")

    @property
    def email_verified(self) -> bool:
        return self.email_verified_at is not None

    @property
    def permissions(self) -> frozenset[Permission]:
        return ROLE_PERMISSIONS[self.role]


# Uniqueness ignores case: `Jane@Example.com` and `jane@example.com` are the same account.
Index("uq_users_email_lower", func.lower(User.email), unique=True)
