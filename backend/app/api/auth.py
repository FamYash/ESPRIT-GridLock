from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Any
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import create_access_token

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

# Demo Credentials
DEMO_EMAIL = "admin@gridlock.com"
DEMO_PASSWORD = "gridlock123"


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

        return {
            "email": email,
            "full_name": "Demo Admin",
            "role": "admin",
            "status": "active"
        }

    except JWTError:
        raise credentials_exception


@router.post("/register")
def register():
    raise HTTPException(
        status_code=403,
        detail="Registration disabled in demo mode"
    )


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:

    if (
        form_data.username != DEMO_EMAIL
        or form_data.password != DEMO_PASSWORD
    ):
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password"
        )

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    return {
        "access_token": create_access_token(
            DEMO_EMAIL,
            expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": {
            "email": DEMO_EMAIL,
            "full_name": "Demo Admin",
            "role": "admin",
            "status": "active"
        }
    }


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user