from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import pathlib

# 添加项目根目录到Python路径
root_dir = str(pathlib.Path(__file__).parent.parent.parent)
if root_dir not in sys.path:
    sys.path.append(root_dir)

# 导入AI路由（不依赖数据库）
from backend.src.routers.ai import router as ai_router

# 条件导入数据库相关模块
try:
    from backend.src.database import engine, Base
    from backend.src.routers.auth import router as auth_router
    from backend.src.routers.research import router as research_router
    # 创建数据库表
    if os.environ.get('SKIP_DB_INIT') != 'true':
        Base.metadata.create_all(bind=engine)
    HAS_DATABASE = True
except Exception as e:
    print(f"警告: 数据库初始化失败 - {e}")
    HAS_DATABASE = False

app = FastAPI(
    title="Research Assistant API",
    description="API for Research Assistant project",
    version="0.1.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册AI路由（始终可用）
app.include_router(ai_router, prefix="/api")

# 注册数据库相关路由
if HAS_DATABASE:
    app.include_router(auth_router, prefix="/api")
    app.include_router(research_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Research Assistant API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)