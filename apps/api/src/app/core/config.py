import os
from functools import lru_cache
from typing import Annotated, Literal, Self

from pydantic import Field, PostgresDsn, RedisDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

Environment = Literal["development", "test", "staging", "production"]


def _env_files() -> tuple[str, ...]:
    """`.env.<environment>` (committed, development/test only) then `.env` (personal, ignored).

    Real environment variables always win over both files. Staging and production have no
    committed file: every required setting must come from the platform, or boot fails.
    """
    environment = os.environ.get("ENVIRONMENT", "development")
    return (f".env.{environment}", ".env")


class Settings(BaseSettings):
    """Application settings. The only place the API reads environment variables.

    Infrastructure settings have no default on purpose: a missing value fails at boot instead
    of silently pointing at localhost.
    """

    model_config = SettingsConfigDict(
        env_file=_env_files(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "API"
    environment: Environment = "development"
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"

    database_url: PostgresDsn
    database_echo: bool = False
    database_pool_size: int = 10
    database_max_overflow: int = 10
    database_pool_recycle: int = 1800
    database_pool_timeout: int = 30
    # Any statement slower than this is cancelled by Postgres instead of pinning a worker.
    database_statement_timeout_ms: int = 30_000

    redis_url: RedisDsn
    celery_broker_url: str
    celery_result_backend: str

    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    email_token_expire_minutes: int = 60 * 24
    reset_token_expire_minutes: int = 30

    # Base URL of the web app, used to build links inside transactional emails.
    frontend_url: str
    # When on, business endpoints answer 403 `email_not_verified` until the address is confirmed.
    require_email_verification: bool = True

    # Oldest mobile app version (semver) the API still serves. Older builds that send
    # `X-App-Version` get 426 `app_update_required` and show a blocking "update" screen.
    min_app_version: str | None = None

    # Mounts an unauthenticated `/metrics` endpoint. Keep it off the public internet.
    metrics_enabled: bool = True

    # Error reporting is off until a DSN is provided.
    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.0

    # Attempts allowed per window and subject (email or client IP). See `rate_limit_for`.
    rate_limit_window_seconds: int = 300
    rate_limit_login_attempts: int = 5
    rate_limit_register_attempts: int = 20
    rate_limit_email_attempts: int = 5

    cors_origins: Annotated[list[str], NoDecode]

    # How transactional email leaves the app: printed (dev), sent over SMTP, or
    # collected in memory (tests). Production refuses "console".
    email_backend: Literal["console", "smtp", "outbox"] = "console"
    email_from: str = "no-reply@example.com"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_start_tls: bool = False

    # How push notifications leave the app: logged (dev), Expo Push API, or in memory (tests).
    push_backend: Literal["console", "expo", "outbox"] = "console"
    # Only needed when "enhanced push security" is on in the Expo project.
    expo_access_token: str | None = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _refuse_incomplete_config(self) -> Self:
        """Fail at boot, not on the first request, when a setting cannot work."""
        if self.email_backend == "smtp" and not self.smtp_host:
            raise ValueError("smtp_host is required when email_backend is 'smtp'")
        if not self.is_production:
            return self
        if self.email_backend == "console":
            raise ValueError("email_backend must not be 'console' in production")
        if self.push_backend == "console":
            raise ValueError("push_backend must not be 'console' in production")
        if not self.cors_origins:
            raise ValueError("cors_origins must list at least one origin")
        return self

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    def rate_limit_for(self, scope: str) -> tuple[int, int]:
        """`(attempts, window_seconds)` for a rate-limited scope: login, register, email."""
        limits = {
            "login": self.rate_limit_login_attempts,
            "register": self.rate_limit_register_attempts,
            "email": self.rate_limit_email_attempts,
        }
        if scope not in limits:
            raise ValueError(f"unknown rate limit scope: {scope}")
        return limits[scope], self.rate_limit_window_seconds


@lru_cache
def get_settings() -> Settings:
    return Settings()
