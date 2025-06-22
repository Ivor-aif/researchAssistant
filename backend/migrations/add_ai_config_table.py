#!/usr/bin/env python3
"""
数据库迁移脚本：添加AI配置表

这个脚本会创建ai_api_configs表，用于存储用户的AI API配置信息。

运行方式：
python migrations/add_ai_config_table.py
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, text
from src.database import get_database_url
from src.models.ai_config import AIAPIConfig, AIProviderType
from src.models import Base

def run_migration():
    """运行数据库迁移"""
    try:
        # 获取数据库URL
        database_url = get_database_url()
        print(f"连接数据库: {database_url}")
        
        # 创建数据库引擎
        engine = create_engine(database_url)
        
        # 创建所有表（包括新的ai_api_configs表）
        print("创建AI配置表...")
        Base.metadata.create_all(bind=engine, tables=[AIAPIConfig.__table__])
        
        # 验证表是否创建成功
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='ai_api_configs'
            """))
            
            if result.fetchone():
                print("✅ AI配置表创建成功！")
            else:
                print("❌ AI配置表创建失败！")
                return False
        
        print("\n🎉 数据库迁移完成！")
        print("\n表结构说明：")
        print("- ai_api_configs: 存储用户的AI API配置")
        print("  - id: 主键")
        print("  - user_id: 用户ID（外键）")
        print("  - title: 配置标题")
        print("  - provider_type: AI提供商类型")
        print("  - api_key: API密钥（加密存储）")
        print("  - api_endpoint: API端点")
        print("  - model_name: 模型名称")
        print("  - system_prompt: 系统提示词")
        print("  - default_prompt: 默认提示词")
        print("  - is_primary: 是否为主配置")
        print("  - is_active: 是否启用")
        print("  - use_for_*: 各种使用场景的开关")
        print("  - max_tokens, temperature等: 高级配置参数")
        print("  - created_at, updated_at: 时间戳")
        
        return True
        
    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        return False

def rollback_migration():
    """回滚数据库迁移"""
    try:
        database_url = get_database_url()
        engine = create_engine(database_url)
        
        print("回滚AI配置表...")
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS ai_api_configs"))
            conn.commit()
        
        print("✅ 回滚完成！")
        return True
        
    except Exception as e:
        print(f"❌ 回滚失败: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="AI配置表迁移脚本")
    parser.add_argument(
        "--rollback", 
        action="store_true", 
        help="回滚迁移（删除AI配置表）"
    )
    
    args = parser.parse_args()
    
    if args.rollback:
        print("⚠️  准备回滚AI配置表迁移...")
        confirm = input("这将删除ai_api_configs表及其所有数据。确定继续吗？(y/N): ")
        if confirm.lower() == 'y':
            success = rollback_migration()
        else:
            print("取消回滚操作。")
            success = True
    else:
        print("🚀 开始AI配置表迁移...")
        success = run_migration()
    
    sys.exit(0 if success else 1)