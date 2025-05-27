from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any, Dict
from jose import jwt

from ..database import get_db
from ..models.user import User
from ..security import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM,
    oauth2_scheme
)

router = APIRouter(prefix="/auth", tags=["auth"])

# 获取当前用户
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)) -> Dict:
    """获取当前登录用户信息"""
    user_info = {
        "id": current_user.id,
        "username": current_user.username,
        "author_name": current_user.author_name,
        "author_email": current_user.author_email,
        "author_website": current_user.author_website
    }
    return user_info

@router.post("/update-profile")
def update_profile(
    profile_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """更新用户个人资料，包括署名信息"""
    try:
        # 更新用户名
        if "username" in profile_data and profile_data["username"] != current_user.username:
            # 检查用户名是否已存在
            existing_user = db.query(User).filter(User.username == profile_data["username"]).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists"
                )
            current_user.username = profile_data["username"]
        
        # 更新署名信息
        if "author_name" in profile_data:
            current_user.author_name = profile_data["author_name"]
        
        if "author_email" in profile_data:
            current_user.author_email = profile_data["author_email"]
        
        if "author_website" in profile_data:
            current_user.author_website = profile_data["author_website"]
        
        # 保存到数据库
        db.commit()
        
        return {"success": True, "message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.post("/register")
def register(username: str, password: str, db: Session = Depends(get_db)) -> Any:
    """用户注册 - 简化版，只需要用户名和密码"""
    # 检查用户名是否已存在
    db_user = db.query(User).filter(User.username == username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # 创建新用户
    db_user = User(
        username=username,
        hashed_password=get_password_hash(password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {"message": "User registered successfully"}

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Any:
    """用户登录"""
    # 查找用户
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 验证密码
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}