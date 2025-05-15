import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from backend.src.main import app
from backend.src.models.research import ResearchProject, Paper, ProgressRecord, InnovationPoint, ProjectStatus
from backend.src.database import get_db

# 测试客户端
client = TestClient(app)

# 测试数据
test_project = {
    "title": "测试研究项目",
    "description": "这是一个用于测试的研究项目",
    "start_date": datetime.now().isoformat(),
    "end_date": (datetime.now().replace(year=datetime.now().year + 1)).isoformat()
}

test_paper = {
    "title": "测试论文",
    "authors": "测试作者",
    "abstract": "这是一篇测试论文的摘要",
    "url": "https://example.com/test-paper",
    "publication_date": datetime.now().isoformat()
}

test_progress = {
    "content": "完成了实验设计",
    "milestone": "实验设计阶段"
}

test_innovation = {
    "title": "新的研究方法",
    "description": "一种改进的数据分析方法",
    "implementation_status": "planning"
}

@pytest.fixture
def test_db():
    # 使用测试数据库
    yield get_db()

@pytest.fixture
def auth_headers():
    # 模拟认证头信息
    # 注意：在实际测试中，应该使用有效的测试用户令牌
    return {"Authorization": "Bearer test_token"}

@pytest.fixture
def test_project_id(auth_headers):
    # 创建测试项目并返回ID
    response = client.post(
        "/research/projects",
        params=test_project,
        headers=auth_headers
    )
    assert response.status_code == 200
    return response.json()["id"]

def test_create_project(auth_headers):
    """测试创建研究项目"""
    response = client.post(
        "/research/projects",
        params=test_project,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_project["title"]
    assert data["description"] == test_project["description"]
    assert data["status"] == ProjectStatus.PLANNING.value

def test_get_projects(auth_headers, test_project_id):
    """测试获取研究项目列表"""
    response = client.get(
        "/research/projects",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert any(project["id"] == test_project_id for project in data)

def test_add_paper(auth_headers, test_project_id):
    """测试添加相关论文"""
    response = client.post(
        f"/research/projects/{test_project_id}/papers",
        params=test_paper,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_paper["title"]
    assert data["authors"] == test_paper["authors"]
    assert data["project_id"] == test_project_id

def test_record_progress(auth_headers, test_project_id):
    """测试记录研究进度"""
    response = client.post(
        f"/research/projects/{test_project_id}/progress",
        params=test_progress,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == test_progress["content"]
    assert data["milestone"] == test_progress["milestone"]
    assert data["project_id"] == test_project_id

def test_add_innovation_point(auth_headers, test_project_id):
    """测试添加创新点"""
    response = client.post(
        f"/research/projects/{test_project_id}/innovation-points",
        params=test_innovation,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_innovation["title"]
    assert data["description"] == test_innovation["description"]
    assert data["implementation_status"] == test_innovation["implementation_status"]
    assert data["project_id"] == test_project_id

def test_project_not_found(auth_headers):
    """测试访问不存在的项目"""
    invalid_project_id = 9999  # 假设这个ID不存在
    
    # 测试添加论文到不存在的项目
    response = client.post(
        f"/research/projects/{invalid_project_id}/papers",
        params=test_paper,
        headers=auth_headers
    )
    assert response.status_code == 404
    
    # 测试记录进度到不存在的项目
    response = client.post(
        f"/research/projects/{invalid_project_id}/progress",
        params=test_progress,
        headers=auth_headers
    )
    assert response.status_code == 404
    
    # 测试添加创新点到不存在的项目
    response = client.post(
        f"/research/projects/{invalid_project_id}/innovation-points",
        params=test_innovation,
        headers=auth_headers
    )
    assert response.status_code == 404