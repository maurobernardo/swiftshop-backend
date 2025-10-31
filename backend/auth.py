from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, UserRole
from backend.timezone_utils import now_moz
import os

# Secret key da variável de ambiente ou fallback para desenvolvimento
SECRET_KEY = os.environ.get("SECRET_KEY", "CHANGE_ME_DEV_ONLY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
	return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
	return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
	to_encode = data.copy()
	expire = now_moz() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
	to_encode.update({"exp": expire})
	return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
	credentials_exception = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Could not validate credentials",
		headers={"WWW-Authenticate": "Bearer"},
	)
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		sub = payload.get("sub")
		if sub is None:
			raise credentials_exception
		try:
			user_id = int(sub)
		except (TypeError, ValueError):
			raise credentials_exception
	except JWTError:
		raise credentials_exception
	user = db.get(User, user_id)
	if user is None or user.is_blocked:
		raise credentials_exception
	return user


def require_admin(user: User = Depends(get_current_user)) -> User:
	if user.role != UserRole.admin:
		raise HTTPException(status_code=403, detail="Admin privileges required")
	return user
