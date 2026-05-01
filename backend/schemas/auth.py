from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    tsc_number: str = Field(min_length=1, max_length=50)


class LoginRequest(BaseModel):
    """Password must be the TSC number. Name must match first or last name on file."""

    tsc_number: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    assigned_form: int | None = None
    assigned_stream: str | None = None


class MessageResponse(BaseModel):
    message: str
