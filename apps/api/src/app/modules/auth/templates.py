"""Transactional email copy, in every locale the app supports.

Templates live in the backend (the API sends the email, not the frontend), so the
strings are plain Python instead of `packages/i18n` keys.
"""

from dataclasses import dataclass

from app.shared.locale import Locale


@dataclass(frozen=True, slots=True)
class EmailTemplate:
    subject: str
    text: str
    html: str


def verification_email(token: str, locale: Locale, frontend_url: str) -> EmailTemplate:
    link = f"{frontend_url}/verify-email?token={token}"
    if locale == "vi":
        return EmailTemplate(
            subject="Xác nhận địa chỉ email của bạn",
            text=(
                "Chào bạn,\n\n"
                "Hãy mở liên kết sau để xác nhận địa chỉ email và hoàn tất việc tạo tài khoản:\n"
                f"{link}\n\n"
                f"Hoặc dán mã này vào ứng dụng: {token}\n\n"
                "Nếu bạn không tạo tài khoản, hãy bỏ qua email này."
            ),
            html=(
                "<p>Chào bạn,</p>"
                f'<p><a href="{link}">Xác nhận địa chỉ email</a></p>'
                f"<p>Hoặc dán mã này vào ứng dụng: <code>{token}</code></p>"
                "<p>Nếu bạn không tạo tài khoản, hãy bỏ qua email này.</p>"
            ),
        )
    return EmailTemplate(
        subject="Confirm your email address",
        text=(
            "Hi,\n\n"
            "Open the link below to confirm your email address and finish setting up your "
            f"account:\n{link}\n\n"
            f"Or paste this code in the app: {token}\n\n"
            "If you did not create an account, you can ignore this email."
        ),
        html=(
            "<p>Hi,</p>"
            f'<p><a href="{link}">Confirm your email address</a></p>'
            f"<p>Or paste this code in the app: <code>{token}</code></p>"
            "<p>If you did not create an account, you can ignore this email.</p>"
        ),
    )


def reset_password_email(token: str, locale: Locale, frontend_url: str) -> EmailTemplate:
    link = f"{frontend_url}/reset-password?token={token}"
    if locale == "vi":
        return EmailTemplate(
            subject="Đặt lại mật khẩu của bạn",
            text=(
                "Chào bạn,\n\n"
                "Ai đó đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Mở liên kết sau:\n"
                f"{link}\n\n"
                f"Hoặc dán mã này vào ứng dụng: {token}\n\n"
                "Liên kết chỉ dùng được một lần. Nếu không phải bạn, hãy bỏ qua email này."
            ),
            html=(
                "<p>Chào bạn,</p>"
                "<p>Ai đó đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>"
                f'<p><a href="{link}">Đặt lại mật khẩu</a></p>'
                f"<p>Hoặc dán mã này vào ứng dụng: <code>{token}</code></p>"
                "<p>Liên kết chỉ dùng được một lần. Nếu không phải bạn, hãy bỏ qua email này.</p>"
            ),
        )
    return EmailTemplate(
        subject="Reset your password",
        text=(
            "Hi,\n\n"
            "Someone asked to reset the password of your account. Open the link below:\n"
            f"{link}\n\n"
            f"Or paste this code in the app: {token}\n\n"
            "The link works once. If this was not you, you can ignore this email."
        ),
        html=(
            "<p>Hi,</p>"
            "<p>Someone asked to reset the password of your account.</p>"
            f'<p><a href="{link}">Reset your password</a></p>'
            f"<p>Or paste this code in the app: <code>{token}</code></p>"
            "<p>The link works once. If this was not you, you can ignore this email.</p>"
        ),
    )
