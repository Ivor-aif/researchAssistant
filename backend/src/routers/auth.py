from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from typing import Any, Dict
from jose import jwt
import os

# 尝试导入数据库相关模块
try:
    from sqlalchemy.orm import Session
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
    HAS_DATABASE = True
except ImportError:
    HAS_DATABASE = False
    # 模拟数据库连接失败时的替代实现
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
    SECRET_KEY = "mock_secret_key"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

    # 模拟用户数据
    mock_users = {
        "admin": {
            "id": 1,
            "username": "admin",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", # 'password'
            "author_name": "管理员",
            "author_email": "admin@example.com",
            "author_website": "https://example.com"
        }
    }

    def create_access_token(data: dict, expires_delta=None):
        return "mock_token"

    def verify_password(plain_password, hashed_password):
        return plain_password == "password"

    def get_password_hash(password):
        return "hashed_" + password

router = APIRouter(prefix="/auth", tags=["auth"])

# 获取当前用户
def get_current_user(token: str = Depends(oauth2_scheme), db=None):
    if HAS_DATABASE and db is None:
        db = next(get_db())
        
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        if HAS_DATABASE:
            # 正常数据库验证流程
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
                
            user = db.query(User).filter(User.username == username).first()
            if user is None:
                raise credentials_exception
            return user
        else:
            # 模拟验证流程
            # 在模拟模式下，任何非空token都被视为有效
            if not token or token == "invalid":
                raise credentials_exception
                
            # 返回模拟用户
            return mock_users["admin"]
    except Exception:
        raise credentials_exception

@router.get("/me")
def read_users_me(current_user = Depends(get_current_user)) -> Dict:
    """获取当前登录用户信息"""
    user_info = {
        "id": current_user["id"] if isinstance(current_user, dict) else current_user.id,
        "username": current_user["username"] if isinstance(current_user, dict) else current_user.username,
        "author_name": current_user["author_name"] if isinstance(current_user, dict) else current_user.author_name,
        "author_email": current_user["author_email"] if isinstance(current_user, dict) else current_user.author_email,
        "author_website": current_user["author_website"] if isinstance(current_user, dict) else current_user.author_website
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
def login(form_data: OAuth2PasswordRequestForm = Depends(), db=None) -> Dict[str, Any]:
    """用户登录"""
    if HAS_DATABASE and db is None:
        db = next(get_db())
        
    authentication_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        if HAS_DATABASE:
            # 正常数据库验证流程
            user = db.query(User).filter(User.username == form_data.username).first()
            if not user or not verify_password(form_data.password, user.password):
                raise authentication_exception
                
            access_token = create_access_token(
                data={"sub": user.username},
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "author_name": user.author_name,
                    "author_email": user.author_email,
                    "author_website": user.author_website
                }
            }
        else:
            # 模拟验证流程
            if form_data.username != "admin" or form_data.password != "password":
                raise authentication_exception
                
            mock_user = mock_users["admin"]
            access_token = create_access_token(
                data={"sub": mock_user["username"]},
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": mock_user["id"],
                    "username": mock_user["username"],
                    "author_name": mock_user["author_name"],
                    "author_email": mock_user["author_email"],
                    "author_website": mock_user["author_website"]
                }
            }
    except Exception as e:
        print(f"登录异常: {e}")
        raise authentication_exception

@router.post("/register")
def register(username: str, password: str, db=None) -> Dict[str, Any]:
    """用户注册"""
    if HAS_DATABASE and db is None:
        db = next(get_db())
        
    if HAS_DATABASE:
        # 检查用户名是否已存在
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
            
        # 创建新用户
        hashed_password = get_password_hash(password)
        user = User(username=username, password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 创建访问令牌
        access_token = create_access_token(
            data={"sub": user.username},
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username
            }
        }
    else:
        # 模拟注册流程
        if username in mock_users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
            
        # 创建模拟用户
        new_user_id = len(mock_users) + 1
        mock_users[username] = {
            "id": new_user_id,
            "username": username,
            "password": get_password_hash(password),
            "author_name": f"User {new_user_id}",
            "author_email": f"{username}@example.com",
            "author_website": ""
        }
        
        # 创建访问令牌
        access_token = create_access_token(
            data={"sub": username},
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": new_user_id,
                "username": username
            }
        }