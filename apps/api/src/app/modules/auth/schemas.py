from pydantic import EmailStr, Field

from app.shared.schemas import Schema


class LoginRequest(Schema):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(Schema):
    refresh_token: str


class TokenPair(Schema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
