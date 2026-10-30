"""Push copy, rendered per device locale (pushes are written by the API, not the app)."""

from dataclasses import dataclass

from app.shared.locale import Locale


@dataclass(frozen=True, slots=True)
class PushContent:
    title: str
    body: str


PushCopy = dict[Locale, PushContent]


def push_enabled_copy() -> PushCopy:
    return {
        "en": PushContent(title="Notifications are on", body="This device will receive updates."),
        "vi": PushContent(title="Đã bật thông báo", body="Thiết bị này sẽ nhận được cập nhật."),
    }
