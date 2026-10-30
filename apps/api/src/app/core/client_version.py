from collections.abc import Callable

from fastapi import Request

from app.core.config import Settings
from app.core.exceptions import UpgradeRequiredError

APP_VERSION_HEADER = "X-App-Version"


def _parse(version: str) -> tuple[int, ...]:
    return tuple(int(part) for part in version.split(".") if part.isdigit())


def require_supported_client(settings: Settings) -> Callable[[Request], None]:
    """Route dependency: reject mobile builds older than `min_app_version`.

    Only clients that send `X-App-Version` (the mobile app) are checked, so the web app and
    infrastructure probes are never blocked. Read from the raw request so the header does not
    show up as a parameter on every generated SDK function.
    """

    def check(request: Request) -> None:
        version = request.headers.get(APP_VERSION_HEADER)
        minimum = settings.min_app_version
        if minimum and version and _parse(version) < _parse(minimum):
            raise UpgradeRequiredError

    return check
