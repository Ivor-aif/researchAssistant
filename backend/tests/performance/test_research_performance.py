import time
import pytest
import concurrent.futures
from fastapi.testclient import TestClient
from datetime import datetime
from backend.src.main import app
from backend.src.models.research import ResearchProject
from backend.src.database import get_db

# 测试客户端
client = TestClient(app)

# 测试数据生成函数
def generate_test_project(index):
    return {
        "title": f"性能测试项目 {index}",
        "description": f"这是性能测试用的研究项目 {index}",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now().replace(year=datetime.now().year + 1)).isoformat()
    }

def generate_test_paper(index, project_id):
    return {
        "title": f"性能测试论文 {index}",
        "authors": f"测试作者 {index}",
        "abstract": f"这是性能测试用的论文摘要 {index}",
        "url": f"https://example.com/test-paper-{index}",
        "publication_date": datetime.now().isoformat(),
        "project_id": project_id
    }

def generate_test_progress(index, project_id):
    return {
        "content": f"性能测试进度记录 {index}",
        "milestone": f"测试里程碑 {index}",
        "project_id": project_id
    }

@pytest.fixture
def auth_headers():
    # 模拟认证头信息
    return {"Authorization": "Bearer test_token"}

@pytest.fixture
def test_project_ids(auth_headers):
    # 创建多个测试项目并返回ID列表
    project_ids = []
    for i in range(5):
        response = client.post(
            "/research/projects",
            params=generate_test_project(i),
            headers=auth_headers
        )
        if response.status_code == 200:
            project_ids.append(response.json()["id"])
    return project_ids

def test_create_multiple_projects_performance(auth_headers):
    """测试批量创建项目的性能"""
    num_projects = 20
    start_time = time.time()
    
    # 串行创建多个项目
    for i in range(num_projects):
        response = client.post(
            "/research/projects",
            params=generate_test_project(i),
            headers=auth_headers
        )
        assert response.status_code == 200
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    print(f"创建 {num_projects} 个项目耗时: {execution_time:.2f} 秒")
    # 性能断言：创建20个项目应该在5秒内完成
    assert execution_time < 5.0

def test_get_projects_performance(auth_headers, test_project_ids):
    """测试获取项目列表的性能"""
    # 确保有足够的测试数据
    assert len(test_project_ids) > 0
    
    # 测量查询性能
    start_time = time.time()
    
    # 执行多次查询
    num_queries = 50
    for _ in range(num_queries):
        response = client.get(
            "/research/projects",
            headers=auth_headers
        )
        assert response.status_code == 200
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    print(f"执行 {num_queries} 次项目列表查询耗时: {execution_time:.2f} 秒")
    # 性能断言：50次查询应该在3秒内完成
    assert execution_time < 3.0

def test_concurrent_add_papers(auth_headers, test_project_ids):
    """测试并发添加论文的性能"""
    # 确保有项目ID可用
    assert len(test_project_ids) > 0
    project_id = test_project_ids[0]
    
    num_papers = 30
    start_time = time.time()
    
    # 使用线程池并发添加论文
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for i in range(num_papers):
            future = executor.submit(
                client.post,
                f"/research/projects/{project_id}/papers",
                params=generate_test_paper(i, project_id),
                headers=auth_headers
            )
            futures.append(future)
        
        # 等待所有请求完成
        for future in concurrent.futures.as_completed(futures):
            response = future.result()
            assert response.status_code == 200
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    print(f"并发添加 {num_papers} 篇论文耗时: {execution_time:.2f} 秒")
    # 性能断言：并发添加30篇论文应该在4秒内完成
    assert execution_time < 4.0

def test_concurrent_record_progress(auth_headers, test_project_ids):
    """测试并发记录研究进度的性能"""
    # 确保有项目ID可用
    assert len(test_project_ids) > 0
    project_id = test_project_ids[0]
    
    num_records = 50
    start_time = time.time()
    
    # 使用线程池并发记录进度
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for i in range(num_records):
            future = executor.submit(
                client.post,
                f"/research/projects/{project_id}/progress",
                params=generate_test_progress(i, project_id),
                headers=auth_headers
            )
            futures.append(future)
        
        # 等待所有请求完成
        for future in concurrent.futures.as_completed(futures):
            response = future.result()
            assert response.status_code == 200
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    print(f"并发记录 {num_records} 条研究进度耗时: {execution_time:.2f} 秒")
    # 性能断言：并发记录50条进度应该在5秒内完成
    assert execution_time < 5.0

def test_mixed_load_performance(auth_headers, test_project_ids):
    """测试混合负载下的系统性能"""
    # 确保有项目ID可用
    assert len(test_project_ids) > 0
    
    start_time = time.time()
    
    # 使用线程池模拟多用户并发操作
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = []
        
        # 创建新项目
        for i in range(5):
            future = executor.submit(
                client.post,
                "/research/projects",
                params=generate_test_project(i + 100),
                headers=auth_headers
            )
            futures.append(future)
        
        # 查询项目列表
        for _ in range(10):
            future = executor.submit(
                client.get,
                "/research/projects",
                headers=auth_headers
            )
            futures.append(future)
        
        # 添加论文
        for i in range(10):
            project_id = test_project_ids[i % len(test_project_ids)]
            future = executor.submit(
                client.post,
                f"/research/projects/{project_id}/papers",
                params=generate_test_paper(i + 100, project_id),
                headers=auth_headers
            )
            futures.append(future)
        
        # 记录进度
        for i in range(10):
            project_id = test_project_ids[i % len(test_project_ids)]
            future = executor.submit(
                client.post,
                f"/research/projects/{project_id}/progress",
                params=generate_test_progress(i + 100, project_id),
                headers=auth_headers
            )
            futures.append(future)
        
        # 等待所有请求完成
        for future in concurrent.futures.as_completed(futures):
            response = future.result()
            assert response.status_code in [200, 201, 404]  # 允许一些404错误
    
    end_time = time.time()
    execution_time = end_time - start_time
    
    print(f"混合负载测试耗时: {execution_time:.2f} 秒")
    # 性能断言：混合负载测试应该在8秒内完成
    assert execution_time < 8.0