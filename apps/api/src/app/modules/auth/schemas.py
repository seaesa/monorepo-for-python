from pydantic import EmailStr, Field

from app.shared.schemas import Schema


class LoginRequest(Schema):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(Schema):
    refresh_token: str


class VerifyEmailRequest(Schema):
    token: str = Field(min_length=1)


class EmailRequest(Schema):
    email: EmailStr


class ResetPasswordRequest(Schema):
    token: str
    password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(Schema):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class DeleteAccountRequest(Schema):
    password: str = Field(min_length=1)


class TokenPair(Schema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
