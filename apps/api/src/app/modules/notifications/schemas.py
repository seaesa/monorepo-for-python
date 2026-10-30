from typing import Literal

from pydantic import Field

from app.shared.schemas import Schema


class PushDeviceRegister(Schema):
    token: str = Field(pattern=r"^(Expo|Exponent)PushToken\[.+\]$", max_length=255)
    platform: Literal["ios", "android"]
