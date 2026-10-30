"""Server-side locale: emails and pushes are written by the API, so it needs the user's language."""

from typing import Annotated, Literal

from fastapi import Depends, Header

Locale = Literal["en", "vi"]

SUPPORTED_LOCALES: tuple[Locale, ...] = ("en", "vi")


def resolve_locale(accept_language: str | None) -> Locale:
    """First supported language in an `Accept-Language` header, English by default."""
    if not accept_language:
        return "en"
    for part in accept_language.split(","):
        language = part.split(";")[0].strip().lower()
        for locale in SUPPORTED_LOCALES:
            if language.startswith(locale):
                return locale
    return "en"


def _request_locale(
    accept_language: Annotated[str | None, Header(alias="Accept-Language")] = None,
) -> Locale:
    return resolve_locale(accept_language)


RequestLocale = Annotated[Locale, Depends(_request_locale)]
