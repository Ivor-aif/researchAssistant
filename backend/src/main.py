from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import pathlib

# 添加项目根目录到Python路径
root_dir = str(pathlib.Path(__file__).parent.parent.parent)
if root_dir not in sys.path:
    sys.path.append(root_dir)

# 条件导入，避免在没有数据库时出错
try:
    from backend.src.database import engine, Base
    from backend.src.routers import api_router
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

# 注册路由
if HAS_DATABASE:
    app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Research Assistant API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)