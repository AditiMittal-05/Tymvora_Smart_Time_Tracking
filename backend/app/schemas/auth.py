import re
from pydantic import BaseModel, EmailStr, field_validator

_PW_RULES = [
    (r".{8,}", "at least 8 characters"),
    (r"[A-Z]", "an uppercase letter"),
    (r"[a-z]", "a lowercase letter"),
    (r"[0-9]", "a number"),
    (r"[^A-Za-z0-9]", "a special character (!@#$%^&*)"),
]


def _validate_password_strength(v: str) -> str:
    failed = [msg for pattern, msg in _PW_RULES if not re.search(pattern, v)]
    if failed:
        raise ValueError("Password must contain " + ", ".join(failed))
    return v


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("password")
    @classmethod
    def strong_password(cls, v):
        return _validate_password_strength(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class OtpResetRequest(BaseModel):
    """Step 2 of forgot-password: verify OTP and set new password."""
    email: EmailStr
    otp: str
    new_password: str

    @field_validator("otp")
    @classmethod
    def otp_digits(cls, v):
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be a 6-digit number")
        return v

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v):
        return _validate_password_strength(v)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v):
        return _validate_password_strength(v)
