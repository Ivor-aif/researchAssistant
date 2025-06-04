from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import pathlib

# 添加项目根目录到Python路径
root_dir = str(pathlib.Path(__file__).parent.parent.parent)
if root_dir not in sys.path:
    sys.path.append(root_dir)

# 导入路由
from backend.src.routers import api_router

# 条件导入数据库相关模块
try:
    from backend.src.database import engine, Base
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

# 注册所有路由
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Research Assistant API"}

if __name__ == "__main__":
    import uvicorn
    import argparse
    
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="启动Research Assistant API服务器")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)), help="服务器端口号")
    args = parser.parse_args()
    
    # 使用命令行参数中的端口号
    port = args.port
    print(f"启动服务器在端口: {port}")
    uvicorn.run(app, host="127.0.0.1", port=port)