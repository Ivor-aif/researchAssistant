import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from backend.src.main import app
from backend.src.models.paper import Paper
from backend.src.database import get_db

# 测试客户端
client = TestClient(app)

# 测试数据
test_paper = {
    "title": "Test Paper",
    "authors": ["Test Author"],
    "abstract": "Test Abstract",
    "keywords": ["test", "research"],
    "publication_date": datetime.now().isoformat(),
    "doi": "10.1234/test.123"
}

@pytest.fixture
def test_db():
    # 使用测试数据库
    yield get_db()

def test_search_papers():
    # 测试论文搜索接口
    response = client.get("/api/v1/papers/search", params={
        "query": "test",
        "page": 1,
        "per_page": 10
    })
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data

def test_get_paper_by_id(test_db):
    # 创建测试论文
    response = client.post("/api/v1/papers", json=test_paper)
    assert response.status_code == 201
    paper_id = response.json()["id"]

    # 测试获取单篇论文
    response = client.get(f"/api/v1/papers/{paper_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_paper["title"]
    assert data["doi"] == test_paper["doi"]

def test_filter_papers():
    # 测试论文过滤功能
    response = client.get("/api/v1/papers/filter", params={
        "author": "Test Author",
        "year": datetime.now().year,
        "keyword": "test"
    })
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["items"], list)

def test_paper_recommendations():
    # 测试论文推荐功能
    response = client.get("/api/v1/papers/recommendations", params={
        "user_id": 1,
        "limit": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 5
    for paper in data:
        assert "relevance_score" in paper

def test_export_papers():
    # 测试论文导出功能
    response = client.post("/api/v1/papers/export", json={
        "paper_ids": [1, 2, 3],
        "format": "bibtex"
    })
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain"

def test_invalid_search_params():
    # 测试无效的搜索参数
    response = client.get("/api/v1/papers/search", params={
        "query": "",  # 空查询
        "page": 0,    # 无效页码
        "per_page": 100  # 超出限制
    })
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data

def test_paper_not_found():
    # 测试访问不存在的论文
    response = client.get("/api/v1/papers/999999")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data

def test_create_paper_validation():
    # 测试创建论文时的数据验证
    invalid_paper = {
        "title": "",  # 空标题
        "authors": [],  # 空作者列表
        "abstract": "Test Abstract",
        "keywords": ["test"],
        "publication_date": "invalid-date",  # 无效日期
        "doi": "invalid-doi"  # 无效DOI
    }
    response = client.post("/api/v1/papers", json=invalid_paper)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data